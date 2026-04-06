const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// 登录尝试记录（简单的内存存储，生产环境应使用 Redis）
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 分钟

// 邮箱验证码存储（email -> { code, expiresAt, username, passwordHash }）
const emailVerificationCodes = new Map();
const VERIFICATION_CODE_EXPIRY = 10 * 60 * 1000; // 10 分钟

// 中间件 - CORS 跨域支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// 暴力破解防护中间件
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };

  if (Date.now() < attempts.lockUntil) {
    const remainingTime = Math.ceil((attempts.lockUntil - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      message: `账户已锁定，请 ${remainingTime} 秒后重试`
    });
  }

  next();
}

// 哈希密码（初始化时使用）
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// 初始化测试用户（使用哈希密码）
let users = [];
(async () => {
  users = [
    { username: 'admin', passwordHash: await hashPassword('admin123') },
    { username: 'test', passwordHash: await hashPassword('test123') }
  ];
  console.log('Users initialized with hashed passwords');
})();

// POST /api/login 接口
app.post('/api/login', rateLimitMiddleware, async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // 检查必填字段
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '缺少用户名或密码'
    });
  }

  // 输入长度限制
  if (username.length > 50 || password.length > 100) {
    return res.status(400).json({
      success: false,
      message: '输入过长'
    });
  }

  // 查找用户
  const user = users.find(u => u.username === username);

  // 统一错误消息（防止用户枚举）
  const errorMessage = '用户名或密码错误';

  if (!user) {
    return res.status(401).json({
      success: false,
      message: errorMessage
    });
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    // 记录失败尝试
    const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
    attempts.count += 1;

    if (attempts.count >= MAX_ATTEMPTS) {
      attempts.lockUntil = Date.now() + LOCKOUT_TIME;
      attempts.count = 0;
    }

    loginAttempts.set(ip, attempts);

    return res.status(401).json({
      success: false,
      message: errorMessage
    });
  }

  // 登录成功，清除失败记录
  loginAttempts.delete(ip);

  // 生成 JWT Token
  const token = jwt.sign(
    { username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    success: true,
    message: '登录成功',
    token: token
  });
});

// 生成 6 位随机验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证邮箱格式
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST /api/register - 用户注册（发送验证码）
app.post('/api/register', rateLimitMiddleware, async (req, res) => {
  const { username, email, password } = req.body;

  // AC1: 接收 username, email, password 参数
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: '缺少用户名、邮箱或密码'
    });
  }

  // AC3: 校验邮箱格式（正则）
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: '邮箱格式不正确'
    });
  }

  // AC4: 校验密码长度 >= 6
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: '密码长度不能少于 6 位'
    });
  }

  // 输入长度限制
  if (username.length > 50 || email.length > 100 || password.length > 100) {
    return res.status(400).json({
      success: false,
      message: '输入过长'
    });
  }

  // AC2: 校验用户名唯一性（内存中查找）
  if (users.find(u => u.username === username)) {
    return res.status(409).json({
      success: false,
      message: '用户名已被注册'
    });
  }

  // 哈希密码并生成验证码
  const passwordHash = await hashPassword(password);
  const code = generateVerificationCode();

  // AC5: 生成验证码，存入内存 Map
  emailVerificationCodes.set(email, {
    code: code,
    expiresAt: Date.now() + VERIFICATION_CODE_EXPIRY,
    username: username,
    passwordHash: passwordHash
  });

  // AC6: 返回验证提示信息（实际项目应发送邮件，这里仅返回验证码提示）
  console.log(`[注册验证码] 邮箱 ${email} 的验证码: ${code}`);

  res.status(200).json({
    success: true,
    message: '验证码已发送，请查收邮箱',
    // 开发环境下返回验证码以便测试
    dev_code: code
  });
});

// POST /api/verify-email - 验证邮箱验证码
app.post('/api/verify-email', rateLimitMiddleware, async (req, res) => {
  const { email, code } = req.body;

  // AC1: 接收 email, code 参数
  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: '缺少邮箱或验证码'
    });
  }

  // 查找验证码记录
  const record = emailVerificationCodes.get(email);

  // AC5: 验证码过期
  if (!record || Date.now() > record.expiresAt) {
    emailVerificationCodes.delete(email);
    return res.status(400).json({
      success: false,
      message: '验证码已过期，请重新注册'
    });
  }

  // AC4: 验证码错误
  if (record.code !== code) {
    return res.status(400).json({
      success: false,
      message: '验证码错误'
    });
  }

  // AC6: 验证码正确但邮箱已被注册
  if (users.find(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      message: '该邮箱已被注册'
    });
  }

  // AC2: 验证成功 → 创建用户账户
  const newUser = {
    username: record.username,
    email: email,
    passwordHash: record.passwordHash
  };
  users.push(newUser);

  // 删除已使用的验证码
  emailVerificationCodes.delete(email);

  // AC3: 验证成功后自动登录，返回 JWT token
  const token = jwt.sign(
    { username: newUser.username, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    success: true,
    message: '注册成功',
    token: token
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
