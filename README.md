# std-info-skill

`std-info` 标准信息查询卡技能的分发包。同事一条 `npx` 命令即可把技能装到自己的 agent 技能目录，无需 clone 仓库、无需 npm publish。

## 安装

前置：Node.js ≥ 18（含 npx，Node 自带）。

```bash
# 默认装到 ~/.workbuddy/skills/std-info/
npx --yes github:sing-zzj/std-info-skill
```

Windows / macOS / Linux 通用；npx 会自动从 GitHub 拉取并执行，不写进项目的 `package.json`。

## 指定目标 agent

`--agent` 可重复、可逗号分隔，或用 `all`：

```bash
npx --yes github:sing-zzj/std-info-skill --agent workbuddy
npx --yes github:sing-zzj/std-info-skill --agent workbuddy --agent claude-code
npx --yes github:sing-zzj/std-info-skill --agent claude-code,codebuddy,agents
npx --yes github:sing-zzj/std-info-skill --agent all
```

| 参数 | 安装路径 |
|------|----------|
| `workbuddy`（默认） | `~/.workbuddy/skills/std-info/` |
| `claude-code` | `~/.claude/skills/std-info/` |
| `codebuddy` | `~/.codebuddy/skills/std-info/` |
| `agents` | `~/.agents/skills/std-info/` |

```bash
npx --yes github:sing-zzj/std-info-skill --list      # 列出目标路径
npx --yes github:sing-zzj/std-info-skill --dry-run   # 预演，不写文件
```

## 更新 / 卸载

- 更新：重跑同一条命令即可，会覆盖同名文件（不动目录里的其他文件）。
- 卸载：删除对应目录下的 `std-info/` 文件夹。

## 技能内容

`skills/std-info/` 即技能本体（`SKILL.md` + `references/verified-example.md`）。行为：输入标准号或 PDF，输出 18 字段标准信息卡，并默认用 playwright-cli 打开标信查（192.168.0.230:8001）填表、停在清洗预览弹窗核对。

## 版本管理

版本号的唯一真相源是 `package.json` 的 `version`，遵循语义化版本 SemVer `MAJOR.MINOR.PATCH`：

- **MAJOR**：不兼容变更（如字段顺序调整、默认目标 agent 改变）
- **MINOR**：向后兼容的新功能（如新增 `--agent` 目标）
- **PATCH**：修复（如文案纠正、安装路径修正）

### 方式 A：GitHub tag 分发（当前方式）

`npx --yes github:sing-zzj/std-info-skill` 默认拉 `main` 分支最新 commit —— **version 字段只是标签，不决定装到哪个版本**。要锁定版本必须打 tag：

```bash
# 维护者：改 version → commit → 打 tag → push
# 1. 编辑 package.json 的 version，例如 1.0.1
git add -A && git commit -m "chore: bump version to 1.0.1"
git tag v1.0.1
git push origin main --tags

# 同事：装固定版本
npx --yes github:sing-zzj/std-info-skill#v1.0.1
```

> 注意：npm 10.x 对 `github:...#commit-sha` 和 `#semver:^x.y.z` 有 GitFetcher 打包 bug（实测报错 `GitFetcher requires an Arborist constructor to pack a tarball`），`#分支名` 和 tag 需较新 npm（建议同事用 npm 11+）。若同事 npm 版本不可控，用方式 B。

### 方式 B：npm registry 分发（版本管理最省事）

```bash
# 维护者：改 version → publish（同一版本不能重复 publish）
npm publish

# 同事：语义化版本锁/范围都支持
npx --yes std-info-skill@1.0.1
npx --yes std-info-skill@^1.0.0
```

### 升级 / 回滚

- 升级：重跑安装命令（GitHub 方式默认拉最新 main）。
- 回滚：装指定版本（`#vX.Y.Z` 或 `@X.Y.Z`），或 `git revert` 后重打 tag。

## 维护者：发布新版本

1. 改 `skills/std-info/` 内容 → 提交 push 到 GitHub 默认分支。
2. 改 `package.json` 的 `version`（SemVer）。
3. 按上面方式 A 打 tag，或方式 B `npm publish`。
