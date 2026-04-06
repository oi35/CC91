(function() {
    // DOM 元素
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const verifyForm = document.getElementById('verifyForm');
    const message = document.getElementById('message');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const formTitle = document.getElementById('formTitle');
    const formFooter = document.getElementById('formFooter');
    const footerText = document.getElementById('footerText');
    const verifyEmailDisplay = document.getElementById('verifyEmailDisplay');

    // 切换表单显示
    function showLogin() {
        loginForm.classList.remove('hidden');
        registerForm.classList.remove('active');
        verifyForm.classList.remove('active');
        formTitle.textContent = 'Login';
        formFooter.style.display = 'block';
        footerText.innerHTML = "Don't have an account? <a id=\"toggleToRegister\">Register</a>";
        attachFooterListener();
        clearMessage();
    }

    function showRegister() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('active');
        verifyForm.classList.remove('active');
        formTitle.textContent = 'Register';
        formFooter.style.display = 'none';
        clearMessage();
    }

    function showVerify(email) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('active');
        verifyForm.classList.add('active');
        formTitle.textContent = 'Email Verification';
        formFooter.style.display = 'none';
        verifyEmailDisplay.textContent = email;
        clearMessage();
    }

    // 清除消息
    function clearMessage() {
        message.textContent = '';
        message.className = 'message';
    }

    // 显示消息
    function showMessage(text, type) {
        message.textContent = text;
        message.className = 'message ' + type;
    }

    // 切换按钮状态
    function setButtonState(btn, disabled, text) {
        btn.disabled = disabled;
        btn.textContent = text;
    }

    // 绑定底部链接事件
    function attachFooterListener() {
        const toggleLink = document.getElementById('toggleToRegister');
        if (toggleLink) {
            toggleLink.addEventListener('click', function(e) {
                e.preventDefault();
                showRegister();
            });
        }
    }

    // 登录表单提交
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        clearMessage();
        setButtonState(loginBtn, true, 'Logging in...');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || 'Login successful!', 'success');
                loginForm.reset();
                // 登录成功后可以跳转或更新 UI
                setTimeout(() => {
                    alert('Login successful! Token: ' + data.token);
                }, 500);
            } else {
                showMessage(data.message || 'Login failed', 'error');
            }
        } catch (err) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            setButtonState(loginBtn, false, 'Login');
        }
    });

    // 注册表单提交
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        clearMessage();
        setButtonState(registerBtn, true, 'Registering...');

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // 注册成功，显示验证码输入界面
                showVerify(email);
                showMessage(data.message || 'Verification code sent!', 'success');
            } else {
                showMessage(data.message || 'Registration failed', 'error');
            }
        } catch (err) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            setButtonState(registerBtn, false, 'Register');
        }
    });

    // 验证表单提交
    verifyForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('regEmail').value;
        const code = document.getElementById('verificationCode').value;

        clearMessage();
        setButtonState(verifyBtn, true, 'Verifying...');

        try {
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Verification successful! Redirecting to login...', 'success');
                verifyForm.reset();
                // 验证成功后跳转回登录页面
                setTimeout(() => {
                    showLogin();
                    showMessage('Email verified! Please login.', 'success');
                }, 1500);
            } else {
                showMessage(data.message || 'Verification failed', 'error');
            }
        } catch (err) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            setButtonState(verifyBtn, false, 'Verify');
        }
    });

    // 初始化
    attachFooterListener();
})();
