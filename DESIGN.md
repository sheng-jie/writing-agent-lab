---
name: FlowDraft
description: 面向自媒体用户的沉浸式写作工作台，从想法澄清到发布闭环。
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  fd-bg: "oklch(98% 0.006 185)"
  fd-surface: "oklch(100% 0 0)"
  fd-surface-soft: "oklch(96.5% 0.012 180)"
  fd-fg: "oklch(19% 0.025 210)"
  fd-muted: "oklch(48% 0.022 220)"
  fd-border: "oklch(89% 0.011 190)"
  fd-accent: "oklch(52% 0.115 166)"
  fd-accent-strong: "oklch(42% 0.12 166)"
  fd-accent-soft: "oklch(92% 0.045 166)"
  fd-gold: "oklch(74% 0.13 78)"
  fd-ink: "oklch(24% 0.035 245)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Inter, Avenir Next, -apple-system, BlinkMacSystemFont, PingFang SC, system-ui, sans-serif"
    fontSize: "clamp(48px, 7vw, 86px)"
    fontWeight: 760
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, PingFang SC, system-ui, sans-serif"
    fontSize: "clamp(34px, 4.8vw, 58px)"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, PingFang SC, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 680
    lineHeight: 1.16
    letterSpacing: "-0.035em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Geist Mono, SFMono-Regular, ui-monospace, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  shell: "28px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  section: "88px"
components:
  button-primary:
    backgroundColor: "{colors.fd-accent-strong}"
    textColor: "{colors.fd-surface}"
    rounded: "999px"
    padding: "12px 18px"
  button-secondary:
    backgroundColor: "{colors.fd-surface}"
    textColor: "{colors.fd-fg}"
    rounded: "999px"
    padding: "12px 18px"
  card-standard:
    backgroundColor: "{colors.fd-surface}"
    textColor: "{colors.fd-fg}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input-standard:
    backgroundColor: "{colors.fd-surface}"
    textColor: "{colors.fd-fg}"
    rounded: "15px"
    padding: "13px 14px"
---

# Design System: FlowDraft

## 1. Overview

**Creative North Star: "安静的编辑室"**

FlowDraft 的视觉系统应像一间安静的编辑室：光线柔和、工具顺手、稿件状态清楚，所有界面材料都服务于把一个想法继续往前推进。它不表演 AI，不制造喧哗，也不把用户困在一个泛聊天框里；它像可靠编辑一样用结构、状态和少量高价值提示帮助用户完成写作闭环。

当前前端由两层系统组成：全局 shadcn/base-vega 产品组件提供熟悉、克制的控件语言；`fd-*` 首页系统提供更具品牌识别的冷静青绿、克制金色、白色稿纸和深墨蓝面板。后续产品界面应优先继承 shadcn 的一致性，再把 `fd-*` 的沉浸氛围用于关键写作流程、状态提示和发布闭环节点。

**Key Characteristics:**
- 冷静青绿是主要行动与进度色，使用稀少但明确。
- 金色只用于完成度、亮点和发布价值提示，不做大面积装饰。
- 白色稿纸、浅青灰背景和深墨蓝强调区构成“写作工作台”空间感。
- 产品控件保持熟悉：清晰焦点、标准表单、可预期按钮、少量状态动效。
- 中文长文本优先可读性；标题可以有气质，但不能牺牲换行与移动端稳定性。

## 2. Colors

这是一套冷静青绿 + 克制金色的产品色彩系统：青绿负责推进，金色负责成果，墨蓝负责沉浸，浅青灰负责安静的工作台环境。

### Primary
- **Quiet Teal** (`fd-accent`, `oklch(52% 0.115 166)`): 主要行动、当前步骤、进度条和可继续推进的状态。它不应作为背景花纹大量铺开。
- **Editor Teal Deep** (`fd-accent-strong`, `oklch(42% 0.12 166)`): 主要按钮、强调标签、选中态文本和焦点边界。
- **Teal Note** (`fd-accent-soft`, `oklch(92% 0.045 166)`): 选中步骤、提示底色、轻量状态容器。

### Secondary
- **Proof Gold** (`fd-gold`, `oklch(74% 0.13 78)`): 只用于完成度、可发布、亮点提示和小面积视觉节拍。金色不是品牌主色，不能抢过写作流程本身。

### Neutral
- **Desk Mist** (`fd-bg`, `oklch(98% 0.006 185)`): 首页和沉浸式写作区域的环境背景。
- **Paper White** (`fd-surface`, `oklch(100% 0 0)`): 稿纸、卡片、表单和主要内容面。
- **Soft Cyan Surface** (`fd-surface-soft`, `oklch(96.5% 0.012 180)`): 侧栏、工具条、次级面板和输入前景的柔和底色。
- **Ink Text** (`fd-fg`, `oklch(19% 0.025 210)`): 中文正文和主要标题的默认墨色。
- **Editorial Muted** (`fd-muted`, `oklch(48% 0.022 220)`): 说明文字、辅助描述和非主状态文本；正文不要比这个更浅。
- **Rule Line** (`fd-border`, `oklch(89% 0.011 190)`): 分隔线、输入框、卡片边界。
- **Deep Work Ink** (`fd-ink`, `oklch(24% 0.035 245)`): 沉浸式强调区、深色故事面板和高对比状态标签。

### Named Rules
**The ≤10% Accent Rule.** 青绿和金色合计不应超过单屏可视面积的 10%，它们的稀少感就是权威感。

**The No Cream AI Rule.** 不要把“写作产品”翻译成通用 AI SaaS 奶油风；背景要么是真白/浅青灰，要么是明确的深墨蓝工作区。

## 3. Typography

**Display Font:** Inter / system sans with Chinese system fallback
**Body Font:** SF Pro Text / PingFang SC / system sans
**Label/Mono Font:** Geist Mono / SFMono-Regular / ui-monospace

**Character:** 字体系统以单一高质量 sans 为主，产品界面保持熟悉和高密度；营销首页允许少量宋体/Georgia italic 用在关键词上，但产品工作台不要把 display 情绪带进标签、按钮和数据。

### Hierarchy
- **Display** (760, `clamp(48px, 7vw, 86px)`, 0.94): 只用于首页主标题或重大空状态标题。字距不得比 `-0.04em` 更紧；现有更紧的标题应在 polish 时修正。
- **Headline** (720, `clamp(34px, 4.8vw, 58px)`, 1): 用于首页区块标题和大型流程标题。移动端必须检查长中文标题不溢出。
- **Title** (680, `24px`, 1.16): 用于稿纸标题、卡片标题、流程步骤摘要。
- **Body** (400, `15px`, 1.7): 用于正文、说明和长段落。长文本行长控制在 65–75ch；中文说明优先用 `text-wrap: pretty`。
- **Label** (760, `12px`, 0.08em): 用于状态、步骤、工具栏和短标签。不要在每个区块都使用小号大写 eyebrow；只在真实状态或流程标签里使用。

### Named Rules
**The Editor Voice Rule.** 字体层级必须像编辑批注：清楚、节制、有判断。不要用夸张 display 字体或过密字距制造“高级感”。

## 4. Elevation

FlowDraft 使用“轻触感”混合深度：产品控件以细边界和微弱阴影为主，首页关键面板允许更大的环境阴影营造工作台空间。阴影只能表达层级、悬停或焦点，不作为装饰背景。

### Shadow Vocabulary
- **Ambient Panel** (`--fd-shadow: 0 24px 70px rgba(16, 39, 44, 0.11)`): 只用于首页产品预览、CTA 大容器和沉浸式关键面板。
- **Soft Lift** (`--fd-shadow-soft: 0 14px 38px rgba(16, 39, 44, 0.08)`): 用于稿纸、步骤选中态、表单容器和浮层导航。
- **Control Shadow** (`shadow-xs` in shadcn controls): 用于按钮、输入和卡片默认可触感。

### Named Rules
**The Shadow Has a Job Rule.** 如果阴影不能说明“这个面板更靠前、这个控件可交互、这个状态被选中”，就删掉它。边框和大软阴影不要同时堆在普通卡片上。

## 5. Components

### Buttons
- **Shape:** 首页 CTA 使用 full pill；产品工作台默认使用 shadcn `rounded-md`（约 10px）。
- **Primary:** 青绿渐变或 `fd-accent-strong`，白字，`12px 18px` 起步；只用于真正推进工作流的动作。
- **Hover / Focus:** 悬停最多 `translateY(-1px)` 和轻微阴影增强；焦点必须有清晰 ring，不允许只变颜色。
- **Secondary / Ghost:** 次要按钮使用白色或透明背景 + 墨色/弱文本；不能和主按钮竞争。

### Chips
- **Style:** 圆角 pill，小面积边框，背景来自 `fd-surface` 或 `fd-accent-soft`。
- **State:** 选中态用浅青绿底 + 深青绿文本；未选中态保持白底/浅边框。不要用高饱和色填充未激活选项。

### Cards / Containers
- **Corner Style:** 产品卡片 12–16px；首页大型容器可到 20–28px。超过 32px 的圆角只允许在已存在首页大展示容器中保留，不作为新组件默认值。
- **Background:** 普通内容面用 `Paper White`；侧栏和工具条用 `Soft Cyan Surface`。
- **Shadow Strategy:** 普通卡片用边界或 `shadow-xs`；关键面板才使用 `Soft Lift`。
- **Border:** 统一使用 `Rule Line`，避免彩色侧边条。
- **Internal Padding:** 普通卡片 18–24px；密集产品区可降到 12–16px。

### Inputs / Fields
- **Style:** 白色底，15px 圆角，`Rule Line` 边框，`13px 14px` 内边距；产品默认输入遵循 shadcn `h-9 rounded-md px-2.5`。
- **Focus:** 边框转向青绿混合色，并出现浅青绿 4px ring。
- **Error / Disabled:** 错误使用 destructive 红色与 `role="alert"`；禁用态降低透明度但保留可读文本。

### Navigation
- **Style:** 顶部导航使用浅青灰半透明背景和轻微 blur；产品工作台应优先用明确 top bar / side rail / tabs，不发明陌生导航。
- **Typography:** 导航项 14px、620 weight；当前项或 hover 用墨色，默认项用 `Editorial Muted`。
- **Mobile:** 窄屏导航以可点击列表展开，阴影轻，点击目标不小于 44px。

### Signature Component: Writing Workbench Preview
- **Structure:** 左侧步骤 rail + 右侧稿纸区域，表达 FlowDraft 的核心流程，不要退化为普通聊天窗口。
- **State:** 当前步骤必须有清楚选中态、质量/进度反馈和下一步建议。
- **Copy:** 组件文案要直接服务写作判断，避免“让创作更简单”这类空泛标语。

## 6. Do's and Don'ts

### Do:
- **Do** 把青绿用于当前步骤、主行动、焦点和进度，保持稀少而明确。
- **Do** 让写作流程可见：捕捉想法、选题澄清、大纲生成、撰写初稿、润色改写、去 AI 味、文章配图、排版发布。
- **Do** 使用熟悉的 shadcn/Base UI 控件语言构建产品界面，保留标准键盘、焦点、错误和禁用状态。
- **Do** 为中文长文本保留足够行高和换行弹性，移动端逐屏检查标题是否溢出。
- **Do** 用空状态、加载骨架和内联提示教用户下一步，而不是把用户丢进空聊天框。

### Don't:
- **Don't** 做“通用 AI SaaS 奶油风”；不要用温暖奶油背景、泛紫蓝渐变和空泛效率文案套壳。
- **Don't** 做“模板化聊天机器人”；聊天可以存在，但不能成为所有能力的唯一界面。
- **Don't** 做“夸张营销感”；避免巨大数字指标、hero metric 模板、过度承诺和大面积装饰性渐变。
- **Don't** 过度拟人化；FlowDraft 是专业编辑和流程工作台，不是卖萌助手。
- **Don't** 使用彩色侧边粗条、渐变文字、重复 eyebrow、无意义玻璃拟态或大软阴影 + 细边框的幽灵卡片组合。
