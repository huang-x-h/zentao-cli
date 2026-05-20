---
name: zentao
description: Query ZenTao project management system for products, stories, bugs, builds, plans. Use when user wants to check requirements list, bug status, product versions, or any ZenTao related queries.
---

# ZenTao Skill

Query ZenTao via `zentao-cli` command.

## Quick Start

```bash
# Login first (once)
zentao-cli login <account> <password>

# Query workflows
```

## Workflows

### 1. Query Stories by Product & Version

**User says**: "查询{产品名}{版本号}版本需求清单"

```bash
# Step 1: Find product ID
zentao-cli products | grep "<产品关键字>"

# Step 2: Find plan ID for version
zentao-cli plans <productId> | grep "<版本关键字>"

# Step 3: Get stories
zentao-cli stories <productId> --plan <planId>
```

### 2. Query Bugs by Product

**User says**: "查看{产品}的活跃Bug"

```bash
zentao-cli bugs -p <productId> --status active
```

### 3. Get Story/Bug Detail

**User says**: "查看需求20210详情"

```bash
zentao-cli story 20210
```

**User says**: "查看Bug 98764详情"

```bash
zentao-cli bug 98764
```

### 4. Query by Build

**User says**: "查看版本5关联的Bug"

```bash
zentao-cli bugs --build 5 --status active
```

## Command Reference

| Command | Description |
|---------|-------------|
| `zentao-cli login <u> <p>` | Login |
| `zentao-cli products` | List all products |
| `zentao-cli plans <id>` | List plans for product |
| `zentao-cli builds <id>` | List builds for product |
| `zentao-cli releases <id>` | List releases for product |
| `zentao-cli stories <id> --plan <planId> --status <status>` | List stories |
| `zentao-cli story <id>` | Get story detail |
| `zentao-cli bugs -p <id> --status <status> --severity <1-4>` | List bugs |
| `zentao-cli bug <id>` | Get bug detail |
| `zentao-cli search "<keyword>"` | Search |

## Filter Options

**Stories**:
- `--status` - active/closed/draft
- `--plan <id>` - Filter by plan- `--build <id>` - Filter by build
- `--build <id>` - Filter by build

**Bugs**:
- `--status` - active/closed/resolved
- `--severity` - 1/2/3/4 (1=highest)
- `--type` - codeerror/interface/design/others

## Output Format

Default JSON. Use `--format table` for table output.

```bash
zentao-cli stories <id> --format table
```

## Auto-Mapping Logic

When user mentions product name + version:
1. Match product name from `products` → get productId
2. Match version from `plans <productId>` → get planId
3. Execute `stories <productId> --plan <planId>`

Example: "{产品名}{版本号}版本"
→ product: {matched from products}
→ plan: {matched from plans}
→ cmd: `stories <productId> --plan <planId>`