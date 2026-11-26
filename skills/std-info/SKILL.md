---
name: std-info
description: 标准信息查询卡。当用户给出标准号（GB、GB/T、JGJ、CJJ、DB、DBJ、DB33/T、CECS、T/CCS 团体标准、Q/ 企业标准等）或标准名称并要求查询标准信息、标准详情、列标准字段时使用。多源交叉检索后输出固定 18 字段标准信息表，字段值只给值不加解释，无数据留空。输出信息卡后**默认自动执行第 6 节：用 playwright-cli 打开标信查（192.168.0.230:8001）填表并点"清洗预览"，停在弹窗核对，不自动确认上传**（写库动作仍须 Oliver 明确要求）。
agent_created: true
---

# std-info —— 标准号 → 标准信息卡

输入一个标准号，输出一张固定字段的标准信息表。核心纪律：**只给值，不加解释；查不到就留空，禁止编造**。

## 工作流

### 1. 标准号规范化（输入与输出共用）

用户输入的标准号经常不规范（全角符号、中文破折号、错别字、多余空格、缺漏）。检索前先做输入归一化；输出"标准号"字段前再做一次同样的规范化，保证返回值符号全部为英文半角。

规范化规则（顺序执行）：

1. 全角字符转半角：`－` `—` `–` `―` → `-`；`／` → `/`；`（` `）` → `(` `)`；全角空格 → 半角空格。
2. 字母统一大写：`dbj` → `DBJ`。
3. 连字符统一为半角 `-`，年份前的连接符必须是 `-`。
4. 收紧空格：多个空格收为单个，去首尾空格。**标准号统一采用「代号 + 一个半角空格 + 序号-年份」格式**，代号（含字母、`/T`、`/Z` 及区号，如 `DBJ/T`、`DBJ33/T`、`DB11/`、`DB11/T`、`DBJ`、`GB/T`、`JGJ`；团体标准前缀 `T/` 后接发证机构代号，如 `T/AOPA`、`T/CECS`、`T/CCS`）与序号之间必须保留且仅保留一个半角空格，不照抄来源的无空格排版。
5. 去除混入的中文标点（顿号、句号、逗号）。

示例：`dbj33/t 1104—2022` → `DBJ33/T 1104-2022`；`ＧＢ ５０３１９—２０１３` → `GB 50319-2013`；`JGJ18-2012。` → `JGJ 18-2012`；`DBJ/T15-20-97` → `DBJ/T 15-20-97`（来源无空格也要补齐）；`DBJ33/T1104-2022` → `DBJ33/T 1104-2022`。

**输出标准号以官方来源（公告/PDF/平台）检索到的规范书写为准，不照抄用户输入**；用户输入的号查不到时，优先怀疑输入不规范，尝试去掉空格、换用全名、调整年份后重搜。

### 2. 多源检索（至少 2 个独立来源交叉验证）

**用户直接提供 PDF 文件时**（`@skill:std-info <文件路径>`）：优先级高于任何在线检索 —— 文件本身就是发布版原文。先判文字层：`get_text()` 有内容就直接提取（封面 → 公告/发布页 → 前言 → 目次 → 总则）；整本只有水印/为空则走第 3 节的 m-ocr。再从封面/前言直接读 标准号、名称、英文名、ICS/CCS、起草单位、起草人、归口、发布/实施日期；替代关系只认文件里"代替/废止"字样，没有就留空。最后再按需 WebSearch 补公告类信息（团标/地标往往没有在线公告，此时以文件为准）。

**记住附件路径**：用户提供的是本地 PDF 文件时，保留其绝对路径，第 6 节上传到标信查时要一并填入表单的「附件文件（可选，PDF）」（Oliver 2026-11-26 定）。整理成信息卡时不显示这个路径（字段表不含附件），但填表步骤要用。

按可信度降序排列：

1. **发布公告原文**：WebSearch `"<标准号>" 公告 发布`，定位发布部门官网（政府厅局、部委、标准化管理机构）。公告是发布日期、实施日期、替代关系、归口单位的权威来源。
2. **标准全文 PDF**：公告页通常附 PDF。下载后是封面、起草人/单位、引用名录的最权威来源。
3. **标准信息平台**：全国标准信息公共服务平台、行业标准信息服务平台、地方标准备案查询。
4. **专业标准库转录**：工标网、建科研、标准网等。起草人完整名单、主要审查人常只有这些站有。

**冲突裁决**：字段值不一致时，优先级为 公告/PDF 原文 > 平台收录 > 转录站。起草人名单常见转录错别字（如"赟/赞"、"赳/赵"），以 PDF 前言页为准。

**转录残缺的识别**：第三方标准库（98tuji、webfree、标准网等）转录前言名单时经常截断，只列前 10 余人；症状是人名列表中途出现孤立单字（如"王鹏 高 刘晓雁"，缺的那个字被吞）。遇到疑似不全，改用 `WebSearch` 直接命中**官网 PDF 的正文片段** —— 搜索引擎索引的官网 PDF 文本通常比第三方转录完整得多（实测同一标准：第三方 12 人 vs 官网 PDF 索引 23 人）。

**替代 / 被替代标准号的证据门槛（≥95%，Oliver 2026-09-24 定，硬规则）**

这两个字段只在**接近确证**时才填，达不到一律留空。

**不算证据**（只能证明"是修订项目"，不能证明替代）：
- 制修订计划表里"修订"二字、项目名称、主编单位相同
- 征求意见稿前言"本次修订的主要内容包括"
- **新标准条文说明 / 修订说明中"本标准是在广东省标准《×××》DBJ/T ××-××× 的基础上修订而成的"**——这类表述最常见、最容易误判：它出自新标准正式文本、明确写出旧标准号，但用词仍是"修订"，不等于"代替"。同理，"上一版的主编单位是……"也只是一条修订线索。
- 章节延续、内容高度重合、引用标准名录高度重合、同名或近同名
- 第三方平台的状态标注（常滞后）

**算作达标证据（满足其一，且能给出原文）**：
1. 新标准发布公告或前言原文写明"本标准代替 ×××""自本标准实施之日起，××× 废止"；
2. 旧标准的官方废止公告 / 废止目录，或发布部门明确声明；
3. 官方平台（全国标准信息公共服务平台、省级标准平台）在旧标准条目上把"被代替标准"字段指向新号；
4. 新标准封面或前言页原文出现旧标准号并伴随"代替/废止"字样。

**降级写法**：证据在 50%–95% 之间时，字段留空，把事实挪到表后备注行，写"系 ××× 的修订项目（依据：〈文件名称〉）"—— 事实保留，断言降级。禁止用"替代标准号"字段承载推断。

### 3. PDF 文本层乱码的处理（工程建设 PDF 常见）

工程建设标准 PDF 大量使用字体子集，pypdf/pdfplumber 提取出 `/G21/G22` 乱码。**首选仍是 `m-ocr`（MinerU）**：乱码件跑 `--ocr` 能直接拿到干净 Markdown。若只是零星几个已知页、或 m-ocr 不可用，再改用渲染读图（见下方"扫描件"条的备选路径）：

- 用 pymupdf 把关键页渲染成 PNG（dpi 150-180），然后用视觉逐页读取。
- **必看页**：封面（备案号、英文名、发布/施行日期、是否有 ICS/CCS 标注）、前言最后 1-2 页（主编/参编单位、主要起草人、主要审查人）、目次（章节、附录、引用标准名录页码）、总则（适用范围条文）、引用标准名录（通常在正文倒数几页，条文说明之前）。
- 页码定位技巧：目次页脚数字与 PDF 页索引的偏移固定，先对 1 个已知页算出偏移，再推算目标页索引。
- **扫描件（整本无文字层）**：`get_text()` 每页只返回水印（如 `www.bzfxw.com`、"×××信息公开浏览专用"）或直接为空。**默认先走 `m-ocr` 技能（MinerU），不要一上来就自己渲染读图**（Oliver 2026-09-24 定）。命令 `python <m-ocr目录>/scripts/mineru_parse.py file "<pdf>" --ocr`。
  - **先估页数**：`python <m-ocr目录>/scripts/mineru_parse.py pages "<pdf>"`。v4 通道限 200MB / 200 页；无 token 的轻量通道只限 10MB / 20 页。
  - **超过 50 页必须先问用户**：全量解析还是只解析某几页？标准类通常只需封面/公告/前言/目次/总则/末尾名录那几页，用 `--page-ranges` 即可。超限一律按页范围分批，不硬跑。
  - 额度用尽会自动降级到免费通道，完成后须向用户说明；无 token 时顺带提醒去 mineru.net 领 Token。
  - **备选：渲染读图**（m-ocr 不可用、或只需两三个已知页时）：pymupdf 渲染 PNG 后视觉逐页读，本机不需要 OCR 引擎（`pix = page.get_pixmap(dpi=140)` 足够读中文正文；封面/名单页用 220–230 提高清晰度，避免"如/茹""赳/赵"这类形近字误读）。实测 203 页扫描件（20MB）用此法完整取到封面、公告、前言名单、目次、总则条文。
  - **页码定位**（无论走哪条路都用得上）：先渲染目次页，从"书中页码 ↔ PDF 页索引"算出固定偏移（实测偏移 = 常数，如 `PDF 索引 = 书页码 + 9`），再定点取目标页，不要全本跑。
  - **止于目标**：只取需要的页（封面 0–2、公告、前言 1–2 页、目次、总则、末尾名录），用完即清临时件（`%TEMP%` 下 `shutil.rmtree`）。
  - **降级顺序（仅当上面两条都不可行时才用）**：① 找同标准的**征求意见稿 DOCX/DOC**（住建厅征求意见函附件，正文文字层完整，起草名单与发布版基本一致）；② 找封面照片/公众号推文的 OCR 文本（可补备案号、英文名、替代关系残句）；③ 实在取不到则留空，并在表后注明取数来源，不编造。
  - **陷阱**：降级取数时务必核对版本号与条文序号 —— 征求意见稿的编号常写作 `DBJ/T 15-XX-202X`、章节划分与发布版不同，其适用范围/起草人**不得**充作发布版数据。

### 4. 字段提取规则

| 字段 | 规则 |
|------|------|
| 标准号 | 按第 1 步规范化规则输出官方标准号：字母大写、符号全部英文半角（`-` `/` 等），以官方来源书写为准 |
| 标准名称 | 中文全称 |
| 标准英文 | 封面/公告英文名，无则留空 |
| 发布日期 | 仅日期 `YYYY-MM-DD` |
| 实施日期 | 仅日期 `YYYY-MM-DD` |
| 截止日期 | 废止日期，仅日期；现行标准留空。新标准公告写"本标准自 YYYY-MM-DD 起实施。原标准 ××× 同时废止"时，**取该实施日作为旧标准的废止日**；有官方废止公告的同样按公告日期填 |
| CCS | 中国标准文献分类号。仅当封面或标准平台明确标注时填写；工程建设标准常不标注，查不到就留空，禁止按领域推测 |
| ICS | ICS 分类号。同 CCS，查不到就留空 |
| 标准性质 | 三选一：强制性 / 推荐性 / 指导性。代号带 `/T` → 推荐性；带 `/Z` → 指导性；**以 `T/` 开头（团体标准，如 `T/AOPA`、`T/CECS`、`T/CCS`）→ 推荐性**（团体标准依《团体标准管理规定》自愿采用，且 `T/` 本身不是 `/T` 后缀，别按"无 /T 即强制性"误判）；无 `/T` 无 `/Z`（GB、DB 等）→ 强制性；与发布公告表述冲突时以公告为准 |
| 状态 | 现行 / 废止 / 即将实施 |
| 替代标准号 | 本标准**替代的**旧标准号，多个顿号分隔；无则留空。**证据门槛 ≥95%，见下方硬规则** |
| 被替代标准号 | **替代本标准的**新标准号，仅当本标准已废止/被代替时非空；现行标准留空。**证据门槛 ≥95%，见下方硬规则** |
| 归口单位 | 归口/负责管理单位 |
| 批准发布部门 | 发布公告的部门 |
| 起草单位 | 全部单位按顺序直接列出，顿号分隔；主编与参编单位之间用"；"分界 |
| 起草人 | 主要起草人全部姓名，顿号分隔直接列出，不加职务、不加人数统计 |
| 规范性引用 | 引用标准清单，**只列标准号、不列名称**，顿号 `、` 分隔。例：`GB/T 50319、DB33/T 1202`。工程建设标准常无独立"规范性引用文件"章，此时取标准末尾"引用标准名录"内容；完全没有则留空 |
| 实施范围 | 适用范围，压缩为一句原文，不加解释 |

通用规则：
- 查不到的字段值留空（空字符串），禁止填"无""暂无""-"等占位词。
- 字段值不携带解释、来源标注或备注，备注类信息（如主要审查人、备案号）放在表格之后单独一行。
- 日期字段只保留日期，不带时间、不带"发布"等字样。
- **推断值一律降级**：任一字段若拿不到 ≥95% 的确证，留空并把事实写进表后备注行（注明依据文件），不占用字段位。

### 5. 输出格式

单个 markdown 两列表格，字段按上表顺序。表格后最多附 1-2 行补充（主要审查人、备案号等），不再展开。

**固定输出顺序（18 项，勿改）**：标准号 → 标准名称 → 标准英文 → **发布日期 → 实施日期 → 截止日期 →** CCS → ICS → 标准性质 → 状态 → 替代标准号 → 被替代标准号 → 归口单位 → 批准发布部门 → **起草单位 → 起草人 →** 规范性引用 → 实施范围。

两条顺序约定（Oliver 2026-09-24 定）：
1. **三个日期字段紧跟「标准英文」之后**（在 CCS/ICS 之前）；
2. **「起草单位、起草人」紧贴在「规范性引用」正上方两行，且起草单位在起草人之上**。

**直接在对话里输出表格，不落盘** —— 除 Oliver 明确要文件外，不要另存 `.md` / `.xlsx` / `.docx`（见 RULES.md 第八节「最小落盘原则」）。临时解析脚本、中间文本、下载的原始 PDF/DOCX 用完即清。

### 6. 自动上传预览：标信查「信息上传（手动录入）」

**默认自动执行（Oliver 2026-11-26 定）**：第 5 节信息卡输出后，无需等 Oliver 开口，直接用浏览器打开标信查 `http://192.168.0.230:8001/`（标信查 - 标准信息清洗预览工具）填表 → 点"清洗预览" → **停在弹窗**，向 Oliver 汇报弹窗核对要点，等他决定是否确认上传。流程：填表 → 清洗预览 → 弹窗核对（终点）→ 仅在 Oliver 明确要求时"确认上传"（写入清洗库，flag='A' 待同步）。Oliver 明确说"不用上传 / 只查询"时才跳过本节。

**安装自检（每次执行本节前先做，Oliver 2026-11-26 定）**：

- 官方仓库：`https://github.com/microsoft/playwright-cli`（技能文件在 `skills/playwright-cli/`）；npm 包 `@playwright/cli`，安装命令 `npm install -g @playwright/cli@latest`，要求 Node.js ≥ 20。
- 检测顺序：`command -v playwright-cli >/dev/null 2>&1 && playwright-cli --version` → 没有全局命令时试 `npx --no-install playwright --version`（≥1.59 可用 `npx playwright cli` 代替全局命令）→ 两者都没有就执行 `npm install -g @playwright/cli@latest`，装完再 `playwright-cli --version` 验证。
- 安装失败（无 npm / Node <20 / 网络问题）→ 直接向 Oliver 报告具体报错，不自行改 requirements、不升级 Node。

**工具与脚本纪律（playwright-cli，实测验证 2026-11-26）**：

- **浏览器必须显示在窗口里且最大化**（Oliver 2026-11-26 定）：`playwright-cli -s=stdinfo open ... --headed`，不加 `--headed` 是 headless，桌面上看不到页面。
- **窗口最大化**不能用 `resize`：实测 `resize 1920 1080` 只改视口（innerWidth=1920）不改窗口（outerWidth 仍 945）。用启动参数 `--start-maximized` + `viewport: null`：准备临时 config `{"browser":{"launchOptions":{"args":["--start-maximized"]},"contextOptions":{"viewport":null}}}`，`open --headed --config <config路径>`。实测窗口 outerWidth=1920 / outerHeight=1040（占满桌面可用区），innerHeight=953。config 只在 open 时读取，open 完即可删临时文件。
- **后台保活**：CLI 会话随 Bash 调用结束被回收，窗口会消失。先起一个后台常驻任务持有会话（config 用临时文件，open 后即删）：

  ```bash
  playwright-cli -s=stdinfo close >/dev/null 2>&1
  cat > /tmp/std-info-pw-config.json <<'JSON'
  {"browser":{"launchOptions":{"args":["--start-maximized"]},"contextOptions":{"viewport":null}}}
  JSON
  playwright-cli -s=stdinfo open http://192.168.0.230:8001/ --headed --config /tmp/std-info-pw-config.json
  rm -f /tmp/std-info-pw-config.json
  tail -f /dev/null
  ```

  （`run_in_background=true`）。之后填表/预览在普通 Bash 调用里用同一 `-s=stdinfo` 会话操作，窗口常驻最大化。
- 若已有保活任务，不必重开：先 `playwright-cli list` 看 `stdinfo` 是否 open，open 则直接复用。
- 切换"信息上传"页签：`click` 普通文本会 strict violation（侧栏链接和标题都叫"信息上传"）。用 `eval 'document.querySelector("[data-form=\"form-manual-upload\"]").click()'` 最稳；切完再 `snapshot --filename=...`。
- 取字段 ref：`snapshot --filename=<file>.yml` 后 `grep 'textbox' ... | grep -oP '\[ref=\Ke\d+(?=\])'`。该表单**恰好 18 个 textbox**，顺序固定（file input 在快照里是 `button "Choose File"`，不占 textbox ref）；`playwright-cli fill <ref> <值>` 自带滚动，不需要手动 scrollIntoView。
- **附件 PDF 上传**（用户提供 PDF 时必做，实测 2026-11-26）：表单附件 input 是 `#manual-file`（`accept=".pdf"`）。`click` 该按钮会超时（元素可见但不可点击）、`drop` 同样超时；正确姿势是两步：先 `eval 'document.querySelector("#manual-file").click()'` 触发原生文件选择器，再 `playwright-cli upload "<PDF绝对路径>"`（upload 命令不带目标选择器，作用于当前 file chooser）。验证：`eval 'document.querySelector("#manual-file").files[0]?.name'` 应返回文件名。注意 `upload` 路径用正斜杠 `/` 或转义反斜杠；无用户 PDF 时跳过此步。
- 点"清洗预览"：`click 'getByRole("button", { name: "清洗预览" })'` 会因底部按钮不在视口超时 5s，改用 `eval 'document.querySelector("#manual-clean-btn").click()'`。
- 弹窗内容用 `snapshot --filename=<file>.yml` 抓取，找 `可上传` / `已存在` / `确认上传` 等字样汇报。
- 企业标准分支：标准号 `Q/` 开头 → 用 `check <checkbox-ref>` 勾选"企业标准上传"，**重新快照取 ref**（会多出"企业名称"input，顺序后移），再填值。
- 禁止用 `eval` 原生 setter 改 value（框架响应式状态不更新，弹窗会报"请填写标准号"），一律用 `fill`。
- 表单里其他页签有同 placeholder 的隐藏 input，CSS 选择器会歧义 —— 一律走快照 ref。

**操作步骤**：

1. 后台保活任务起 headed 浏览器（见上）→ `eval` 点击 `[data-form="form-manual-upload"]` → snapshot 取 18 个 textbox ref。
2. **企业标准分支**：标准号 `Q/` 开头或 Oliver 明说是企业标准 → 先勾选"企业标准上传" checkbox，再重新 snapshot 取 ref。
3. 按快照 ref 顺序填字段。textbox 出现顺序：0 标准号* → 1 标准名称 → 2 标准名称英文 → 3 发布日期 → 4 实施日期 → 5 废止日期 → 6 CCS → 7 ICS → 8 归口单位 → 9 批准发布部门 → 10 省市区 → 11 协会名称（团体标准）→ 12 主要起草单位 → 13 主要起草人 → 14 全部代替标准 → 15 全部被代替标准 → 16 引用标准 → 17 适用范围（textarea）→（附件文件不是 textbox，见下一步）。
4. **附件 PDF**（用户提供 PDF 时）：`eval 'document.querySelector("#manual-file").click()'` → `playwright-cli upload "<PDF绝对路径>"` → 验证 `#manual-file` 的 `files[0]` 是目标文件。无 PDF 则跳过。
5. `eval 'document.querySelector("#manual-clean-btn").click()'` → 等弹窗出现（约 1-2s）→ snapshot 抓弹窗内容。
6. **18 字段卡 → 表单映射**（未列出的表单字段按此推断或留空）：

   | 信息卡字段 | 表单字段 |
   |---|---|
   | 标准号 | 标准号* |
   | 标准名称 | 标准名称 |
   | 标准英文 | 标准名称（英文） |
   | 发布日期 | 发布日期 |
   | 实施日期 | 实施日期 |
   | 截止日期 | 废止日期 |
   | CCS | CCS 中国标准分类号 |
   | ICS | ICS 国际标准分类号 |
   | 归口单位 | 归口单位 |
   | 批准发布部门 | 批准发布部门 |
   | 起草单位 | 主要起草单位 |
   | 起草人 | 主要起草人 |
   | 替代标准号 | 全部代替标准 |
   | 被替代标准号 | 全部被代替标准 |
   | 规范性引用 | 引用标准 |
   | 实施范围 | 适用范围 |

   - 日期一律 `YYYY-MM-DD`；留空字段就空着，**禁止填占位词**。
   - 省市区：地方标准可从标准号区号推断省份（如 DBJ33 → 浙江），推断不准就问 Oliver 或留空；国标/行标留空。
   - 协会名称（团体标准）：`T/` 开头时填发证机构全称，其余留空。
   - 标准性质/状态：表单里没有这两个字段，由清洗逻辑自动推导（弹窗会显示），无需录入。
7. **弹窗核对（默认终点）**：向 Oliver 汇报核对要点（标准号、名称、推导出的标准性质/状态、日期、替代关系、可上传/已存在）。
   - 状态标签"**可上传**" → **不点"确认上传"**。确认上传是写库动作（写清洗库 flag='A' 待同步），只有 Oliver 明确要求才点。
   - 状态标签"**已存在 · 不可上传**"（按钮禁用）→ 该标准号已在清洗库，**不重复上传**，直接报告 Oliver。
8. 停在弹窗后在最终回复里汇报，**不点确认、不主动 close、不停后台保活任务**——窗口和弹窗留在桌面上供 Oliver 核对。Oliver 确认上传时直接在同会话点"确认上传"按钮（如会话已失效则重跑）。

**示例脚本骨架**（后台保活 + 填表分两步，实测可用）：

```bash
# ⓪ 安装自检（缺失才装，官方 npm 包 @playwright/cli）：
if ! command -v playwright-cli >/dev/null 2>&1; then
  npm install -g @playwright/cli@latest
fi
playwright-cli --version

# ① 后台保活（run_in_background=true），headed 最大化窗口常驻桌面：
playwright-cli -s=stdinfo close >/dev/null 2>&1
cat > /tmp/std-info-pw-config.json <<'JSON'
{"browser":{"launchOptions":{"args":["--start-maximized"]},"contextOptions":{"viewport":null}}}
JSON
playwright-cli -s=stdinfo open http://192.168.0.230:8001/ --headed --config /tmp/std-info-pw-config.json
rm -f /tmp/std-info-pw-config.json
tail -f /dev/null
```

```bash
# ② 普通 Bash 调用：填表 → 预览 → 停在弹窗
P="playwright-cli -s=stdinfo"
$P eval 'document.querySelector("[data-form=\"form-manual-upload\"]").click()' > /dev/null 2>&1
$P snapshot --filename=/tmp/std-info-form.yml > /dev/null 2>&1
refs=($(grep 'textbox' /tmp/std-info-form.yml | grep -oP '\[ref=\Ke\d+(?=\])'))
# 企业标准: 先 check <checkbox-ref>，再重取 refs
vals=(
'标准号' '标准名称' '英文名称' '发布日期' '实施日期'
'' '' ''                              # 废止日期、CCS、ICS
'归口单位' '批准发布部门' '' '协会名称' # 省市区留空，团标填协会
'起草单位' '起草人' '代替标准' ''       # 被代替留空
'引用标准' '适用范围'
)
for i in "${!vals[@]}"; do
  [ -z "${vals[$i]}" ] && continue
  $P fill "${refs[$i]}" "${vals[$i]}" > /dev/null 2>&1 || echo "FAIL $i ${refs[$i]}"
done
# 附件 PDF（用户提供时取消注释并填绝对路径；upload 不带目标，须先 eval 触发 chooser）
# $P eval 'document.querySelector("#manual-file").click()' > /dev/null 2>&1
# $P upload "C:/Users/Administrator/Downloads/xxx.pdf" > /dev/null 2>&1
# $P --raw eval 'document.querySelector("#manual-file").files[0]?.name'  # 验证文件名
$P eval 'document.querySelector("#manual-clean-btn").click()' > /dev/null 2>&1
sleep 2
$P snapshot --filename=/tmp/std-info-dialog.yml > /dev/null 2>&1
grep -n '可上传\|已存在\|确认上传\|标准号\|现行\|推荐性' /tmp/std-info-dialog.yml | head -30
# Oliver 明确要求上传时: $P click e<确认上传ref>
# 临时文件用完即清: rm -f /tmp/std-info-*.yml
```

- 脚本里的临时 yml/sh 文件用完即清（`rm -f /tmp/std-info-*.yml /tmp/std-info-upload.sh`）。

## 已验证样例

完整的输出示例（含 CCS/ICS 留空、被替代标准号留空的正确写法）见 [references/verified-example.md](references/verified-example.md)，第一次使用本技能前先读它。
