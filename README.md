# ZenTao CLI

禅道 CLI 工具，供 AI Agent 调用操作禅道系统。

## 安装

1. 命令工具安装

```bash
npm install -g @huang.xinghui/zentao-cli
```

2. Agent 技能安装

```bash
npx skills add huang-x-h/zentao-cli -y -g
```

## 配置

```bash
# 设置禅道地址
zentao-cli config set host http://your-zentao.com

# 登录
zentao-cli login admin your-password

# 查看配置
zentao-cli config list
```

## AI Agent 调用示例

### 查看产品版本需求列表

```bash
# 查看产品列表
zentao-cli products

# 查看某产品的版本
zentao-cli builds 1

# 查看某产品所有需求
zentao-cli stories 1

# 查看某产品激活状态的需求
zentao-cli stories 1 --status active

# 查看某版本关联的需求
zentao-cli stories --build 5
```

### 查看版本对应 Bug 情况

```bash
# 查看所有 Bug
zentao-cli bugs

# 按版本查看 Bug
zentao-cli bugs --build 5

# 按状态查看 Bug
zentao-cli bugs --status active

# 表格形式输出
zentao-cli bugs --build 5 --format table

# 按严重程度排序
zentao-cli bugs --build 5 --format table
```

### 其他常用命令

```bash
# 项目列表
zentao-cli projects

# 任务列表
zentao-cli tasks 1

# 搜索
zentao-cli search "登录功能"

# 需求详情
zentao-cli story 123

# Bug 详情
zentao-cli bug 456

# 产品版本计划列表
zentao-cli plans 1

# 产品构建版本列表
zentao-cli builds 1

# 产品发布版本列表
zentao-cli releases 1
```

## AI Agent Prompt 模板

```
你是禅道系统管理员。请帮我完成以下操作：

1. 查看产品1的所有激活需求
   命令: zentao-cli stories 1 --status active

2. 查看版本5关联的所有Bug
   命令: zentao-cli bugs --build 5 --format table

3. 统计版本5的Bug情况（按状态分组）
   命令: zentao-cli bugs --build 5 | jq 'group_by(.status)'
```

## 环境变量

| 变量        | 说明     |
| ----------- | -------- |
| ZENTAO_HOST | 禅道地址 |

## 配置文件

配置保存在 `~/.zentao-cli/config.json`

## AI Agent Skills 安装

本工具提供 AI Agent Skills，可用于 pi 等 AI 编程助手。

### 自动安装（推荐）

```bash
# 复制 skills 目录到 ~/.pi/agent/skills/
cp -r skills ~/.pi/agent/skills/zentao
```

### 手动安装

将 `skills/SKILL.md` 复制到 AI Agent 的 skills 目录。

安装后，AI Agent 可自动理解禅道相关查询并调用 zentao-cli 完成操作。
