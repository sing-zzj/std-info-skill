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

## 维护者：发布新版本

1. 改 `skills/std-info/` 内容 → 提交 push 到 GitHub 默认分支。
2. 需要版本号时改 `package.json` 的 `version`（可选，npx github: 每次拉默认分支最新 commit）。
3. 需要走 npm registry 分发时：`npm publish`（包名 `std-info-skill`）。
