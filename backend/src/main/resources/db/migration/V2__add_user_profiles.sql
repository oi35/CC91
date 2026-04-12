-- 用户资料扩展表
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id BIGINT PRIMARY KEY COMMENT '用户ID',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    bio VARCHAR(500) COMMENT '个人签名',
    location VARCHAR(100) COMMENT '所在地',
    website VARCHAR(200) COMMENT '个人网站',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料扩展表';

-- 为已有用户插入空 profile
INSERT INTO user_profiles (user_id)
SELECT id FROM users
ON DUPLICATE KEY UPDATE user_id = user_id;
