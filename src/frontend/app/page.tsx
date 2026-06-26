"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const previewData = {
  idea: {
    title: "从碎片灵感开始",
    sub: "把微信收藏、备忘录、语音灵感汇总成一张待澄清的选题卡。",
    quality: 32,
    kicker: "Idea Capture",
    paperTitle: "“为什么读者明明收藏了很多方法论，却仍然写不出稳定内容？”",
    body: "系统会保留原始表达，同时追问受众、观点、案例和平台语境，避免灵感还没成型就被模板化。",
    one: "追问：这篇文章最想帮谁解决什么卡点？",
    two: "素材：可补充一次真实写作卡壳的场景。",
  },
  topic: {
    title: "把想法澄清成选题",
    sub: "系统通过追问把受众、观点、角度和标题方向固定下来。",
    quality: 51,
    kicker: "Topic Clarity",
    paperTitle: "给刚开始做自媒体的人：你缺的不是灵感，而是选题澄清流程",
    body: "这一步会把“想写长期输出”拆成读者痛点、作者立场、反常识观点和可展开案例。",
    one: "标题方向：反常识 / 清单 / 经验复盘",
    two: "判断标准：读者看完是否知道下一步怎么做。",
  },
  draft: {
    title: "生成可编辑初稿",
    sub: "先完成结构和论证，再进入句子层面的润色。",
    quality: 68,
    kicker: "Drafting",
    paperTitle: "稳定输出不是靠自律，而是靠一个不消耗意志力的流程",
    body: "初稿会围绕“触发场景—核心观点—方法步骤—真实案例—行动建议”展开，避免只有漂亮句子没有信息密度。",
    one: "待补充：作者自己的失败案例或对话截图",
    two: "下一步：检查段落节奏，删掉空泛总结。",
  },
  publish: {
    title: "适配平台并准备发布",
    sub: "同一篇文章生成不同平台版本，保留观点但调整表达密度。",
    quality: 91,
    kicker: "Publish Ready",
    paperTitle: "公众号深度版 / 小红书卡片版 / 知乎回答版",
    body: "系统会输出标题候选、摘要、封面方向、分段排版和发布前检查清单，让最后一公里不再拖延。",
    one: "封面方向：工作台截图 + 一句核心反常识",
    two: "检查项：标题承诺、开头钩子、结尾行动。",
  },
} as const;

const previewKeys = ["idea", "topic", "draft", "publish"] as const;

const stages = [
  {
    title: "捕捉想法",
    desc: "让灵感先安全落地，不急着变成完整文章。系统会把碎片内容整理成待澄清的素材卡，并保留来源与原始语气。",
    tag: "STEP 01",
    outputs: ["灵感卡：一句话想法、素材来源、触发场景", "素材池：链接、摘录、读者提问、个人经历", "待澄清问题：受众、观点、可用案例"],
    before: "“想写一下普通人如何长期输出，但不知道从哪写。”",
    after: "“给刚开始做自媒体的人：为什么你缺的不是灵感，而是一套可重复的选题澄清流程。”",
    principle: "原则：先保真，再结构化。",
  },
  {
    title: "选题澄清",
    desc: "把一个模糊念头拆成受众、痛点、观点、证据和平台语境。系统不会直接代写，而是先帮你判断这个选题是否值得写。",
    tag: "STEP 02",
    outputs: ["目标读者：这篇内容具体写给谁", "核心命题：读者看完会相信什么", "差异角度：避免写成同质化方法论"],
    before: "“长期输出很重要。”",
    after: "“为什么很多人不是缺内容能力，而是缺一个能反复启动的选题判断框架。”",
    principle: "原则：不清楚写给谁，就先别急着生成。",
  },
  {
    title: "大纲生成",
    desc: "围绕选题生成文章骨架，并标出每一段要承担的任务：建立共鸣、提出观点、给出方法、补充案例或推动转化。",
    tag: "STEP 03",
    outputs: ["结构大纲：标题、开头、主体、结尾", "段落任务：每段为什么存在", "素材缺口：哪些地方需要作者补充经历"],
    before: "一堆零散观点，顺序随手排列。",
    after: "开头钩子 → 误区拆解 → 三步流程 → 真实案例 → 行动清单。",
    principle: "原则：先搭骨架，再填句子。",
  },
  {
    title: "撰写初稿",
    desc: "根据大纲生成可编辑初稿，保留作者提供的语气、案例和判断，不用空泛金句填满篇幅。",
    tag: "STEP 04",
    outputs: ["完整初稿：可继续编辑的正文", "作者待补充标记：需要真实经历的位置", "弱段落提示：论证不足或跳跃的地方"],
    before: "打开空白文档，不知道第一段怎么写。",
    after: "得到一篇结构完整、可删可改、知道哪里需要补素材的初稿。",
    principle: "原则：初稿是毛坯，不是终稿。",
  },
  {
    title: "润色改写",
    desc: "从标题、开头、转场、句式节奏和结尾行动五个层面做精修，提升可读性而不是把文章改得更花哨。",
    tag: "STEP 05",
    outputs: ["标题候选：不同平台和语气版本", "句子级建议：删冗余、换表达、强节奏", "开头与结尾：增强阅读动机和行动感"],
    before: "“本文将从三个方面介绍如何提升写作效率。”",
    after: "“你不是写得慢，而是每次都在空白页前重新发明流程。”",
    principle: "原则：润色不是堆形容词，是提高信息密度。",
  },
  {
    title: "去 AI 味",
    desc: "识别模板化结构、机械排比、过度总结和没有个人经验的空话，并建议替换成更具体、更像作者本人的表达。",
    tag: "STEP 06",
    outputs: ["AI 味标注：套话、空话、机械句式", "替换建议：更具体的表达方式", "个人化提示：哪里适合补充作者经历"],
    before: "“在当今快节奏时代，内容创作变得越来越重要。”",
    after: "“最折磨人的不是写不出金句，而是每天都要重新判断：今天到底写什么。”",
    principle: "原则：少一点正确废话，多一点真实判断。",
  },
  {
    title: "文章配图",
    desc: "根据文章主题和发布平台生成封面方向、配图提示词、图文节奏建议，帮助内容从“可读”走到“愿意点开”。",
    tag: "STEP 07",
    outputs: ["封面方向：标题层级、画面构图、色彩建议", "插图提示词：可用于图像生成工具", "图文节奏：哪里需要图、哪里留白"],
    before: "临发布前随便找一张不相关的配图。",
    after: "封面承接标题承诺，正文插图服务理解，不抢文章表达。",
    principle: "原则：图片不是装饰，是第二标题。",
  },
  {
    title: "排版发布",
    desc: "根据公众号、小红书、知乎等平台的阅读习惯生成适配版本，并给出发布前检查项。",
    tag: "STEP 08",
    outputs: ["平台版本：长文、卡片、问答等格式", "排版建议：小标题、引用、留白和强调", "发布检查：标题、摘要、封面、结尾动作"],
    before: "写完正文后，还要手动拆平台、调格式、补封面。",
    after: "一篇内容，多个平台版本，最后只需要作者确认语气和细节。",
    principle: "原则：发布不是附属步骤，是创作闭环的一部分。",
  },
] as const;

const features = [
  ["A", "选题澄清器", "通过连续追问把“我想写点什么”变成明确命题：写给谁、解决什么、站在什么角度、需要哪些例子。避免一上来就生成空泛初稿。", true],
  ["B", "个人语气库", "沉淀作者常用表达、禁用词、标题偏好和案例类型，让改写不是“更像 AI”，而是更像你自己。", false],
  ["C", "去 AI 味检查", "标出套话、过度总结、机械排比和空洞形容词，并给出更具体、更有个人经验感的替换建议。", false],
  ["D", "图文发布助手", "根据文章核心观点生成封面方向、配图提示词、分段排版和平台适配版本，减少发布前的机械整理。", false],
  ["E", "多平台版本管理", "同一篇内容可以生成公众号深度版、小红书卡片版、知乎回答版，保留统一观点但调整表达密度。", false],
] as const;

const audiences = [
  ["公众号作者", "需要把碎片观察沉淀成深度文章，重视观点、结构、案例和排版质量。"],
  ["小红书博主", "需要把同一主题拆成标题、封面、正文、卡片和评论区互动版本。"],
  ["知识 IP", "需要长期维护专业表达，避免每篇内容都从空白页重新开始。"],
  ["内容团队", "需要统一选题标准、协作流程和发布前检查，而不是散落在文档和聊天记录里。"],
] as const;

export default function Home() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState<(typeof previewKeys)[number]>("idea");
  const [activeStage, setActiveStage] = useState(0);
  const [copyLabel, setCopyLabel] = useState("复制当前卡片");
  const [contact, setContact] = useState("");
  const [channel, setChannel] = useState("");
  const [topic, setTopic] = useState("");
  const [formNote, setFormNote] = useState({
    text: "我们不会展示你的联系方式；这里只用于内测邀请。",
    tone: "default" as "default" | "ok" | "error",
  });

  const preview = previewData[previewKey];
  const stage = stages[activeStage];

  function closeNav() {
    setIsNavOpen(false);
  }

  function advancePreview() {
    const current = previewKeys.indexOf(previewKey);
    setPreviewKey(previewKeys[(current + 1) % previewKeys.length]);
  }

  async function copyCurrentCard() {
    try {
      await navigator.clipboard.writeText(`${preview.paperTitle}\n\n${preview.body}`);
      setCopyLabel("已复制");
    } catch {
      setCopyLabel("复制受限");
    } finally {
      window.setTimeout(() => setCopyLabel("复制当前卡片"), 1300);
    }
  }

  function submitWaitlist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contact.trim()) {
      setFormNote({ text: "请先留下邮箱或微信，方便发送内测邀请。", tone: "error" });
      return;
    }

    if (!channel.trim()) {
      setFormNote({ text: "请补充一个主要发布平台，我们会按平台准备体验流程。", tone: "error" });
      return;
    }

    setFormNote({
      text: topic.trim()
        ? "已收到。我们会围绕你的发布平台和主题准备一条试写流程。"
        : "已收到。也可以补充一个最近想写的主题，方便我们准备试写样例。",
      tone: "ok",
    });
  }

  return (
    <div className="fd-home">
      <header className={cn("fd-topbar", isNavOpen && "open")} id="topbar">
        <nav className="fd-shell fd-nav" aria-label="主导航">
          <a className="fd-brand" href="#top" aria-label="FlowDraft 首页" onClick={closeNav}>
            <span className="fd-brand-mark" aria-hidden="true" />
            <span>FlowDraft</span>
          </a>
          <div className="fd-nav-links" id="navLinks">
            <a href="#workflow" onClick={closeNav}>写作闭环</a>
            <a href="#features" onClick={closeNav}>核心能力</a>
            <a href="#scenarios" onClick={closeNav}>适合谁用</a>
            <a href="#join" onClick={closeNav}>申请体验</a>
          </div>
          <div className="fd-nav-actions">
            <a className="fd-btn fd-btn-ghost" href="#workflow">查看流程</a>
            <a className="fd-btn fd-btn-primary" href="#join">加入内测</a>
          </div>
          <Button
            className="fd-mobile-toggle"
            variant="outline"
            size="icon-lg"
            type="button"
            aria-label="打开导航"
            aria-expanded={isNavOpen}
            onClick={() => setIsNavOpen((value) => !value)}
          >
            <span aria-hidden="true">☰</span>
          </Button>
        </nav>
      </header>

      <main id="top">
        <section className="fd-hero">
          <div className="fd-shell fd-hero-grid">
            <div>
              <span className="fd-eyebrow"><i className="fd-pulse" aria-hidden="true" /> 面向自媒体创作者的写作工作台</span>
              <h1>把一闪而过的想法，变成可发布的 <em>好文章</em>。</h1>
              <p className="fd-lead">
                FlowDraft 把捕捉想法、选题澄清、大纲生成、初稿撰写、润色改写、去 AI 味、配图与排版发布串成一个连续工作流。你专注表达，系统负责把创作过程推进到底。
              </p>
              <div className="fd-hero-actions">
                <a className="fd-btn fd-btn-primary" href="#join">申请早期体验</a>
                <a className="fd-btn fd-btn-secondary" href="#workflow">看完整工作流</a>
              </div>
              <div className="fd-micro-proof" aria-label="产品原则">
                <span><i className="fd-dot" /> 不只生成，负责推进</span>
                <span><i className="fd-dot" /> 保留作者个人语气</span>
                <span><i className="fd-dot" /> 为发布平台做最后一公里</span>
              </div>
            </div>

            <Card className="fd-product-card" aria-label="产品界面预览">
              <div className="fd-app-window">
                <div className="fd-window-bar">
                  <div className="fd-traffic" aria-hidden="true"><i /><i /><i /></div>
                  <span className="fd-status-pill">Draft · 选题澄清中</span>
                </div>
                <div className="fd-workbench">
                  <aside className="fd-rail">
                    <div className="fd-rail-title">Pipeline</div>
                    {previewKeys.map((key, index) => (
                      <Button
                        key={key}
                        className={cn("fd-rail-button", previewKey === key && "active")}
                        variant="ghost"
                        type="button"
                        onClick={() => setPreviewKey(key)}
                      >
                        {key === "idea" ? "想法" : key === "topic" ? "选题" : key === "draft" ? "初稿" : "发布"}
                        <small>{index === 2 ? "04" : index === 3 ? "08" : `0${index + 1}`}</small>
                      </Button>
                    ))}
                  </aside>
                  <section className="fd-editor">
                    <div className="fd-doc-head">
                      <div>
                        <h3>{preview.title}</h3>
                        <p>{preview.sub}</p>
                      </div>
                      <div className="fd-quality">
                        <div className="fd-quality-row"><span>完成度</span><strong>{preview.quality}%</strong></div>
                        <div className="fd-meter"><span style={{ width: `${preview.quality}%` }} /></div>
                      </div>
                    </div>

                    <Card className="fd-paper">
                      <div className="fd-kicker">{preview.kicker}</div>
                      <h4>{preview.paperTitle}</h4>
                      <p>{preview.body}</p>
                      <div className="fd-suggestions">
                        <div className="fd-chip-card">{preview.one}</div>
                        <div className="fd-chip-card">{preview.two}</div>
                      </div>
                    </Card>

                    <div className="fd-editor-actions">
                      <Button className="fd-btn fd-btn-primary" type="button" onClick={advancePreview}>推进到下一步</Button>
                      <Button className="fd-btn fd-btn-secondary" type="button" onClick={copyCurrentCard}>{copyLabel}</Button>
                    </div>
                  </section>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="fd-section" id="workflow">
          <div className="fd-shell">
            <div className="fd-section-head">
              <div>
                <div className="fd-section-kicker">Closed-loop workflow</div>
                <h2>不是一堆 AI 功能，而是一条能走完的创作流水线。</h2>
              </div>
              <p>每一步都有明确产物、判断标准和下一步动作。创作者不需要在多个工具之间搬运内容，也不需要反复解释“我要写什么”。</p>
            </div>

            <div className="fd-workflow">
              <div className="fd-steps" aria-label="写作流程步骤">
                {stages.map((item, index) => (
                  <button
                    key={item.tag}
                    className={cn("fd-step", activeStage === index && "active")}
                    type="button"
                    onClick={() => setActiveStage(index)}
                  >
                    <span className="fd-num">{String(index + 1).padStart(2, "0")}</span>
                    <span><strong>{item.title}</strong><span>{item.outputs[0].split("：")[0] === "灵感卡" ? "随手记录灵感、链接、金句、语音和读者问题。" : index === 1 ? "把模糊念头变成受众、观点、角度清晰的选题。" : index === 2 ? "按平台节奏组织结构，先确定文章骨架。" : index === 3 ? "围绕观点和素材展开，不把作者声音洗掉。" : index === 4 ? "优化节奏、标题、开头、转场和结尾。" : index === 5 ? "检查套话、空泛表达和过度规整的句式。" : index === 6 ? "生成封面方向、插图提示词和图文搭配建议。" : "适配公众号、小红书、知乎等平台的发布格式。"}</span></span>
                  </button>
                ))}
              </div>

              <Card className="fd-workflow-panel" aria-live="polite">
                <div className="fd-panel-top">
                  <div>
                    <h3>{stage.title}</h3>
                    <p>{stage.desc}</p>
                  </div>
                  <span className="fd-stage-tag">{stage.tag}</span>
                </div>

                <div className="fd-module-grid">
                  <div className="fd-module">
                    <h4>这一阶段的产物</h4>
                    <ul>
                      {stage.outputs.map((output) => (
                        <li key={output}><span className="fd-check" /><span>{output}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="fd-module fd-before-after">
                    <div className="fd-quote-box">
                      <small>Before</small>
                      <p>{stage.before}</p>
                    </div>
                    <div className="fd-quote-box">
                      <small>After</small>
                      <p>{stage.after}</p>
                    </div>
                  </div>
                </div>

                <div className="fd-panel-foot">
                  <span>{stage.principle}</span>
                  <a className="fd-btn fd-btn-secondary" href="#join">用这个流程试写一篇</a>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="fd-section" id="features">
          <div className="fd-shell">
            <div className="fd-section-head">
              <div>
                <div className="fd-section-kicker">Core modules</div>
                <h2>围绕创作者真实卡点设计，而不是围绕模型能力堆功能。</h2>
              </div>
              <p>首页主题采用“清晰工作台 + 温和创作感”的视觉语言：像专业工具一样可靠，也像编辑搭档一样不压迫。</p>
            </div>

            <div className="fd-features">
              {features.map(([icon, title, text, wide]) => (
                <Card key={icon} className={cn("fd-feature-card", wide && "wide")}>
                  <div className="fd-feature-icon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="fd-section" id="scenarios">
          <div className="fd-shell fd-scenario">
            <Card className="fd-scenario-card">
              <div className="fd-section-kicker">Audience fit</div>
              <h3>适合把内容当作长期资产的人。</h3>
              <p>不是一次性代写工具，而是让创作者逐渐形成自己的选题库、素材库、表达库和发布节奏。</p>
            </Card>

            <div className="fd-scenario-list">
              {audiences.map(([name, text]) => (
                <Card key={name} className="fd-audience-row">
                  <strong>{name}</strong>
                  <p>{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="fd-cta" id="join">
          <div className="fd-shell">
            <Card className="fd-cta-card">
              <div>
                <div className="fd-section-kicker">Early access</div>
                <h2>先用一篇真实文章，验证这条闭环是否适合你的创作方式。</h2>
                <p>留下你的内容方向和常用平台。我们会优先邀请正在稳定创作、但希望减少选题和初稿摩擦的作者试用。</p>
              </div>

              <form className="fd-waitlist" noValidate onSubmit={submitWaitlist}>
                <FieldGroup className="fd-field-group">
                  <Field className="fd-field" data-invalid={formNote.tone === "error" && !contact.trim() ? true : undefined}>
                    <FieldLabel htmlFor="email">邮箱或微信</FieldLabel>
                    <Input id="email" name="email" autoComplete="email" placeholder="例如：name@example.com / 微信号" aria-invalid={formNote.tone === "error" && !contact.trim()} value={contact} onChange={(event) => setContact(event.target.value)} />
                  </Field>
                  <Field className="fd-field" data-invalid={formNote.tone === "error" && contact.trim() && !channel.trim() ? true : undefined}>
                    <FieldLabel htmlFor="channel">你主要发布在哪个平台？</FieldLabel>
                    <Input id="channel" name="channel" placeholder="例如：公众号、小红书、知乎、视频号" aria-invalid={formNote.tone === "error" && Boolean(contact.trim()) && !channel.trim()} value={channel} onChange={(event) => setChannel(event.target.value)} />
                  </Field>
                  <Field className="fd-field">
                    <FieldLabel htmlFor="topic">你最近想写的主题</FieldLabel>
                    <Textarea id="topic" name="topic" placeholder="一句话描述即可，例如：普通人如何建立稳定输出系统" value={topic} onChange={(event) => setTopic(event.target.value)} />
                  </Field>
                </FieldGroup>
                <Button className="fd-btn fd-btn-primary" type="submit">{formNote.tone === "ok" ? "已提交" : "提交申请"}</Button>
                <FieldDescription className={cn("fd-form-note", formNote.tone === "ok" && "ok", formNote.tone === "error" && "error")}>{formNote.text}</FieldDescription>
              </form>
            </Card>
          </div>
        </section>
      </main>

      <footer className="fd-footer">
        <div className="fd-shell fd-footer-inner">
          <span>© FlowDraft — Writing workbench for creators</span>
          <span>主题方向：清晰、可信、有创作者温度</span>
        </div>
      </footer>
    </div>
  );
}
