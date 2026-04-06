# Team Observability Skill

Agent Team 可观测性系统，记录团队协作全流程。

## 目录结构

```
logs/
├── conversations/    # 对话记录（每轮迭代）
├── interventions/    # 人工干预记录
├── snapshots/        # 代码版本快照 (已弃用)
└── changes/         # Git 变更记录
```

> 注意：`snapshots/` 目录已弃用，请使用 Git 版本控制

## Git 版本控制

使用 `scripts/vcs.sh` 管理版本：

```bash
# 查看状态
vcs status

# 创建新轮次
vcs new-turn

# 创建快照
vcs snapshot "登录功能完成"

# 干预前快照
vcs intervention "添加密码哈希"

# 查看历史
vcs history

# 切换版本
vcs checkout v1.0

# 合并到 main
vcs merge
```

## 记录格式

### 对话记录 (conversations/turn_N.md)

```markdown
# 对话记录: turn_N

## 元信息
- 时间: 2024-04-06 14:30
- 团队: fullstack-dev
- 任务: 用户登录功能
- 轮次: 1

## 事件流
| 时间 | 角色 | 事件 | 详情 | 状态 |
|------|------|------|------|------|
| 14:30 | user | 发送任务 | 实现登录 | ✅ |

## 决策记录
- 14:35 - 用户干预：要求添加密码哈希
- 14:40 - 决策：采用 bcrypt 方案
```

### 干预记录 (interventions/intervention_N.md)

```markdown
# 人工干预: intervention_N

## 基本信息
- 时间: 2024-04-06 14:35
- 类型: BEFORE_TASK | AFTER_FAILURE | MANUAL_APPROVAL
- 触发者: 用户

## 干预内容
**原始请求**: 实现登录功能
**用户修改**: 添加密码哈希验证

## 决策
- [x] 接受修改
- [ ] 拒绝修改
- [ ] 方案调整

## 影响
- 新增 Task 4: 密码哈希实现
- 影响范围: backend
```

## 快照机制 (Git)

### 自动快照点
- `vcs new-turn` - 任务开始时
- `vcs snapshot` - 任务完成时
- `vcs intervention` - 人工干预前
- `vcs merge` - 迭代结束时

### Git 分支模型
```
main (稳定版本)
  └── turn/1 (当前轮次)
  └── turn/2 (下一轮次)
```

### Git 标签
```
v1.0        - Turn 1 初始状态
v1.143025   - Turn 1 快照 (时间戳)
v1.pre-add-password-hash - 干预前快照
```

## 协作追踪

### 任务状态
```markdown
## 任务看板
| ID | 任务 | 负责人 | 状态 | 开始时间 | 结束时间 |
|----|------|--------|------|----------|----------|
| 1 | 登录API | backend | ✅ 完成 | 14:30 | 14:45 |
| 2 | 前端表单 | frontend | 🔄 进行中 | 14:31 | - |
```

## 使用方式

### 在 agent 中使用
```bash
# 创建新轮次
vcs new-turn

# 快照
vcs snapshot "功能描述"

# 干预前
vcs intervention "类型"
```

### 查看状态
```bash
vcs status    # 查看当前状态
vcs history   # 查看版本历史
vcs log       # 查看变更日志
```

## 配置

在 settings.json 中启用：
```json
{
  "teamObservability": {
    "enabled": true,
    "logPath": "logs/",
    "useGit": true,
    "vcsScript": "scripts/vcs.sh",
    "interventionPoints": ["BEFORE_TASK", "AFTER_FAILURE"]
  }
}
```
