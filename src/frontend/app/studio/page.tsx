"use client";

import {
  ChevronLeft,
  Clipboard,
  Lightbulb,
  Menu,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import "./studio.css";

type Step = {
  title: string;
  icon: string;
  desc: string;
  outcome: string;
  hint: string;
  missing: string;
  primaryAction: string;
  wordTarget: string;
  structure: string;
  natural: string;
  publish: string;
  assistantTitle: string;
  assistantBody: string;
  assistantList: string[];
  actions: string[];
};

const steps: Step[] = [
  { title: "捕捉想法", icon: "捕", desc: "灵感收集与素材归档", outcome: "3 张素材卡", hint: "先把未经整理的灵感收进来，不急着判断好坏。", missing: "还可以补一个真实读者问题，让后续选题更稳。", primaryAction: "保存想法", wordTarget: "—", structure: "18%", natural: "—", publish: "—", assistantTitle: "建议先补三类素材", assistantBody: "个人观察、读者痛点、可引用案例。三类素材同时存在时，后续选题更不容易空泛。", assistantList: ["这个灵感来自哪个具体场景？", "它解决谁的什么困惑？", "有没有一个反常识角度？"], actions: ["生成素材卡", "提炼选题"] },
  { title: "选题澄清", icon: "澄", desc: "确定读者、承诺与角度", outcome: "Brief 待确认", hint: "把文章从“我想写什么”收束为“读者为什么要读”。", missing: "还差一个更锋利的结果承诺，确认后再生成大纲。", primaryAction: "确认 Brief", wordTarget: "1200–2200", structure: "36%", natural: "—", publish: "—", assistantTitle: "当前选题可以更锋利", assistantBody: "标题里的“深度文章”较宽泛，建议改成面向具体人群的结果承诺。", assistantList: ["是否能用一句话说清读者收益？", "是否避开泛泛而谈的效率建议？", "是否有你的经验或案例支撑？"], actions: ["采用标题方向", "补一条读者场景"] },
  { title: "大纲生成", icon: "纲", desc: "文章骨架与段落任务", outcome: "5 段结构", hint: "先定结构，再让每一段承担明确任务。", missing: "案例段落还薄，建议补一个从灵感到初稿的真实过程。", primaryAction: "采用大纲", wordTarget: "1800", structure: "58%", natural: "—", publish: "—", assistantTitle: "推荐结构", assistantBody: "用“痛点开场 → 方法框架 → 工作流示例 → 常见误区 → 行动清单”的结构，适合工具型长文。", assistantList: ["不要把 8 个步骤写成平铺说明书", "每个步骤最好都有输入、处理、输出", "结尾需要给读者一个轻量行动"], actions: ["插入大纲", "补强案例段"] },
  { title: "撰写初稿", icon: "写", desc: "正文生成与段落展开", outcome: "1260 字初稿", hint: "围绕大纲快速形成可编辑初稿，不在这一阶段追求完美。", missing: "“发布前检查”段落仍是空壳，需要补具体清单。", primaryAction: "生成下一段", wordTarget: "1800", structure: "72%", natural: "45%", publish: "—", assistantTitle: "初稿写作建议", assistantBody: "每段先写结论句，再补一个具体场景。这样能减少 AI 式套话，也方便后续润色。", assistantList: ["“去 AI 味”部分需要具体前后对比", "“配图”可以增加封面图与文内图的分工", "“发布”建议加入检查清单"], actions: ["续写当前段", "标记薄弱处"] },
  { title: "润色改写", icon: "润", desc: "节奏、标题与表达优化", outcome: "开头已改写", hint: "提升可读性：删掉绕路表达，让重点更早出现。", missing: "标题仍偏说明文，可以再改成更结果导向。", primaryAction: "应用改写", wordTarget: "1800", structure: "80%", natural: "62%", publish: "—", assistantTitle: "优先润色开头 120 字", assistantBody: "自媒体文章的开头需要更快建立问题。建议先删掉背景铺垫，直接写读者正在经历的卡点。", assistantList: ["把抽象名词换成动作", "把长句拆成两句", "每 3–4 段设置一个小标题"], actions: ["改写开头", "优化标题"] },
  { title: "去 AI 味", icon: "去", desc: "人味、经验与语气校准", outcome: "4 处待处理", hint: "检查模板化、过度顺滑和缺少个人判断的位置。", missing: "还需要补入一处个人失败经验，抵消方法论腔。", primaryAction: "检查表达", wordTarget: "1800", structure: "82%", natural: "78%", publish: "—", assistantTitle: "最像 AI 的地方", assistantBody: "“提升效率”“形成闭环”“持续优化”这类词需要换成具体动作，否则读者会感觉像方法论摘要。", assistantList: ["加入一句不那么完美的个人判断", "保留少量口语停顿", "用具体工具动作替代宏大概念"], actions: ["替换空泛词", "加入个人经验"] },
  { title: "文章配图", icon: "图", desc: "封面、信息图与段落插图", outcome: "4 张图位", hint: "让图片承担解释任务，而不是只做装饰。", missing: "封面标题需要压缩到 12 字以内。", primaryAction: "生成配图建议", wordTarget: "1800", structure: "84%", natural: "82%", publish: "40%", assistantTitle: "建议配 3 张图", assistantBody: "一张封面图、一张工作流信息图、一张“初稿 → 去 AI 味”的对比图，足够支撑这篇文章。", assistantList: ["界面工作台、卡片式流程、清爽浅色背景", "不要出现夸张机器人形象", "封面文字控制在 12 个字以内"], actions: ["生成封面 brief", "生成信息图 brief"] },
  { title: "排版发布", icon: "发", desc: "渠道适配与发布检查", outcome: "6/8 通过", hint: "完成发布前检查：标题、摘要、封面、格式与 CTA。", missing: "摘要与文末行动还需要更具体。", primaryAction: "准备发布", wordTarget: "1800", structure: "92%", natural: "86%", publish: "88%", assistantTitle: "发布前还差两项", assistantBody: "摘要需要更具体；文末 CTA 可以从“欢迎交流”改为“把你的一个灵感丢进这个 8 步流程试一次”。", assistantList: ["公众号：小标题间距保持稳定", "小红书：封面标题更短、更结果导向", "知识星球：可以附工作流模板"], actions: ["改写摘要", "生成发布清单"] },
];

const outline = ["开场：创作者真正卡住的不是写字", "为什么需要固定工作流", "8 步工作台拆解", "AI 应该在什么位置介入", "发布前检查清单"];
const draftText = "很多自媒体作者的问题，不是没有灵感，而是灵感一旦进入写作阶段就会散掉。\n\n你可能在通勤时想到一个观点，在评论区看到一个读者问题，又在别人的文章里发现一个案例。但真正打开文档时，这些东西并不会自动变成一篇文章。\n\n所以我更建议把写作看成一个工作台，而不是一个空白文档。工作台的意义，是让每一步都有明确的输入和输出：先捕捉想法，再澄清选题，接着生成大纲、写初稿、润色、去 AI 味、配图，最后排版发布。";

export default function StudioPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState("如何把零散灵感变成一篇能发布的深度文章");
  const [toast, setToast] = useState("");
  const [prompt, setPrompt] = useState("");
  const [ideas, setIdeas] = useState(["起号阶段的真实卡点", "工作台价值", "可用类比"]);
  const [isSaving, setIsSaving] = useState(false);
  const step = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  useEffect(() => setCollapsed(localStorage.getItem("flowdraft-studio-rail") === "true"), []);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 1800); return () => window.clearTimeout(id); }, [toast]);
  const notify = (message: string) => setToast(message);
  const toggleRail = () => setCollapsed((value) => { localStorage.setItem("flowdraft-studio-rail", String(!value)); return !value; });
  const advance = () => { setIsSaving(true); window.setTimeout(() => { setIsSaving(false); if (stepIndex < steps.length - 1) { notify(`${step.title}已保存，进入下一步`); setStepIndex((value) => value + 1); } else notify("发布检查已打开，可以复制发布清单"); }, 420); };
  const copy = async () => { try { await navigator.clipboard.writeText(`《${title}》\n当前步骤：${step.title}\n阶段目标：${step.hint}`); } finally { notify("阶段内容已复制"); } };

  return (
    <main className={cn("fd-studio", collapsed && "rail-collapsed")}>
      <a className="studio-skip" href="#studio-main">跳到工作区</a>
      <aside className="studio-rail" aria-label="创作流程">
        <header className="studio-brand">
          <div className="studio-brand-lockup"><span className="studio-logo" aria-hidden="true" /><span className="studio-brand-copy"><strong>创作工作台</strong><small>从想法到发布的闭环写作系统</small></span></div>
          <button className="studio-icon-button" type="button" aria-label={collapsed ? "展开创作流程栏" : "收起创作流程栏"} onClick={toggleRail}><ChevronLeft /></button>
        </header>
        <section className="studio-progress" aria-label="文章进度"><small>当前文章进度</small><div className="studio-meter"><span style={{ transform: `scaleX(${progress / 100})` }} /></div><p><span>{stepIndex + 1} / {steps.length} 步</span><span>{progress}%</span></p></section>
        <nav className="studio-steps" aria-label="步骤流">
          {steps.map((item, index) => <button key={item.title} className={cn("studio-step", index === stepIndex && "active", index < stepIndex && "done")} onClick={() => setStepIndex(index)} aria-current={index === stepIndex ? "step" : undefined} data-title={item.title}><span className="studio-step-index"><b>{index < stepIndex ? "✓" : String(index + 1).padStart(2, "0")}</b><i>{item.icon}</i></span><span className="studio-step-copy"><strong>{item.title}</strong><small>{item.desc}</small><em>{item.outcome}</em></span><span className="studio-step-state">{index < stepIndex ? "已完成" : index === stepIndex ? "进行中" : "待处理"}</span></button>)}
        </nav>
        <footer className="studio-health"><p><span>结构完整度</span><b>{step.structure}</b></p><p><span>表达自然度</span><b>{step.natural}</b></p><p><span>发布准备</span><b>{step.publish}</b></p></footer>
      </aside>

      <section className="studio-workbench" id="studio-main">
        <header className="studio-topbar">
          <div className="studio-title-area"><p className="studio-save-state"><span />已自动保存 · 刚刚 <em>草稿 ID WX-2026-042</em></p><textarea value={title} rows={2} aria-label="文章标题" onChange={(event) => setTitle(event.target.value)} /><p className="studio-current-task"><b>当前任务</b>{step.missing}</p></div>
          <div className="studio-top-pills"><span>当前步骤 <b>{step.title}</b></span><span>目标渠道 <b>公众号 / 小红书</b></span><span>预计字数 <b>{step.wordTarget}</b></span></div>
        </header>
        <section className="studio-content">
          <article className="studio-stage" aria-live="polite"><StageContent index={stepIndex} ideas={ideas} onAddIdea={() => { setIdeas((values) => ["新捕捉的灵感", ...values]); notify("已加入素材卡片"); }} onNotify={notify} /></article>
          <aside className="studio-assistant" aria-label="AI 创作助手"><header><div><h2>当前步骤助手</h2><span>编辑搭档</span></div><p>我会基于当前步骤给出下一步建议、反问和可直接使用的草稿。</p></header><div className="studio-assistant-feed"><section className="assistant-card primary"><b>{step.assistantTitle}</b><p>{step.assistantBody}</p><div>{step.actions.map((action) => <button key={action} type="button" onClick={() => notify(`已采用：${action}`)}>{action}</button>)}</div></section><section className="assistant-card"><b>可追问</b><ul>{step.assistantList.map((question) => <li key={question}>{question}</li>)}</ul></section></div><form onSubmit={(event) => { event.preventDefault(); notify(prompt.trim() ? "AI 建议已生成" : "请先补充一点背景"); setPrompt(""); }}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="告诉 AI 你想补充的背景，例如：这篇文章面向刚起号的知识博主，语气要克制但有启发。" aria-label="补充给当前步骤助手的背景" /><div><button type="button" onClick={() => setPrompt("")}>清空</button><button className="assistant-send" type="submit"><Sparkles />补充建议</button></div></form></aside>
        </section>
        <footer className="studio-actionbar"><div><b>{step.title}</b><span>{step.hint}</span></div><div className="studio-actions"><button disabled={stepIndex === 0} onClick={() => setStepIndex((value) => value - 1)}>上一步</button><button onClick={copy}><Clipboard />复制阶段内容</button><button onClick={() => notify("草稿已保存")}><Save />保存草稿</button><button className="studio-primary" disabled={isSaving} onClick={advance}>{isSaving ? "正在保存…" : step.primaryAction}</button></div></footer>
      </section>
      {toast && <div className="studio-toast" role="status">{toast}</div>}
    </main>
  );
}

function StageContent({ index, ideas, onAddIdea, onNotify }: { index: number; ideas: string[]; onAddIdea: () => void; onNotify: (message: string) => void }) {
  if (index === 0) return <div className="studio-grid"><Panel title="灵感收集箱" caption="把碎片想法、读者问题和素材链接先放进来。" action={<button onClick={onAddIdea}><Plus />新增灵感</button>}><label className="studio-field"><span>快速记录</span><textarea defaultValue="最近发现很多创作者不是不会写，而是卡在“灵感很多但不知道怎么组织”。可以把写作流程拆成固定工作台，让每一步都有输入和输出。" /></label><div className="studio-chips"><button className="selected">读者痛点</button><button>个人观察</button><button>案例素材</button><button>待验证观点</button></div></Panel><Panel title="素材卡片" caption="系统自动按用途归类。"><div className="studio-notes">{ideas.map((idea, item) => <article key={`${idea}-${item}`}><b>{idea}</b><p>{item === 0 ? "选题、写作、配图、发布分散在不同工具，导致每次都像从零开始。" : item === 1 ? "把流程固定下来，降低启动成本，同时保留每一步的判断空间。" : "写作不是灵感爆发，而是一条有质检点的生产线。"}</p></article>)}</div></Panel></div>;
  if (index === 1) return <div className="studio-grid"><Panel title="选题澄清画布" caption="用 4 个问题锁定文章方向。"><div className="studio-fields">{[["目标读者", "刚开始稳定输出的知识型自媒体作者"], ["读者当前困惑", "灵感很多，但每次写作都卡在整理和推进"], ["文章承诺", "给你一套从想法到发布的工作台流程"]].map(([label, value]) => <label className="studio-field" key={label}><span>{label}</span><input defaultValue={value} /></label>)}<label className="studio-field"><span>差异化角度</span><textarea defaultValue="不讲泛泛的写作效率，而是把创作拆成 8 个固定工作区：每一步都有输入、处理动作和输出。" /></label></div></Panel><Panel title="选题健康度" caption="用于判断是否值得进入大纲。"><div className="studio-metrics">{[["读者清晰", "82"], ["收益明确", "76"], ["角度新鲜", "68"]].map(([label, value]) => <span key={label}><small>{label}</small><b>{value}</b></span>)}</div><div className="studio-inline-note"><b>系统判断</b><p>选题已具备进入大纲的基础，但标题可以进一步结果化，减少“工作台 UI”这类偏产品内部的表达。</p></div></Panel></div>;
  if (index === 2) return <div className="studio-grid"><Panel title="文章大纲" caption="每个章节都对应一个写作任务。" action={<button onClick={() => onNotify("已基于当前选题刷新大纲建议")}><Sparkles />重新生成</button>}><ol className="studio-outline">{outline.map((item, itemIndex) => <li key={item}><b>{String(itemIndex + 1).padStart(2, "0")}</b><div><strong>{item}</strong><span>{itemIndex === 0 ? "用一个具体场景切入：灵感很多，但打开文档后无从下手。" : "让这一段承担清晰任务，而不只是罗列工具功能。"}</span></div></li>)}</ol></Panel><Checklist /></div>;
  if (index === 3) return <Panel title="正文初稿编辑器" caption="先完成可编辑版本；AI 会在右侧提示薄弱段落。" action={<span className="studio-count">约 1260 字</span>}><textarea className="studio-editor" defaultValue={draftText} aria-label="初稿编辑器" /></Panel>;
  if (index === 4) return <div className="studio-grid"><Panel title="润色改写区" caption="对开头、标题、转场和句长做集中优化。"><label className="studio-field"><span>原句</span><textarea defaultValue="很多自媒体作者的问题，不是没有灵感，而是灵感一旦进入写作阶段就会散掉。" /></label><label className="studio-field"><span>改写后</span><textarea defaultValue="很多创作者并不缺灵感。真正困难的是：那些零散想法，一到写作时就散成了碎片。" /></label><div className="studio-chips"><button className="selected">更口语</button><button>更克制</button><button>更犀利</button></div></Panel><Checklist /></div>;
  if (index === 5) return <div className="studio-grid"><Panel title="去 AI 味诊断" caption="识别模板感、空泛词和过度顺滑的表达。"><div className="studio-tones">{[["空泛表达", "“提升效率”“形成闭环”需要替换为具体动作。"], ["缺少经验", "建议加入你自己使用工作台时的一个失败场景。"], ["过度完整", "可以补一句“不适合什么情况”。"], ["语气太平", "保留少量判断，比如“我不建议一开始就追求金句”。"]].map(([title, text]) => <article key={title}><b>{title}</b><p>{text}</p></article>)}</div></Panel><Panel title="前后对比" caption="用真实语气替换模板化句子。"><div className="studio-notes"><article><b>AI 感版本</b><p>通过系统化流程，创作者可以显著提升内容生产效率，形成从创意到发布的完整闭环。</p></article><article><b>自然版本</b><p>你不需要每次都重新发明一套写作方法。把流程固定下来，至少能让你少卡在“下一步该干什么”。</p></article></div></Panel></div>;
  if (index === 6) return <div className="studio-grid"><Panel title="配图规划" caption="为文章生成封面与文内信息图需求。" action={<button onClick={() => onNotify("已生成 4 条配图提示词")}><Lightbulb />生成配图提示词</button>}><div className="studio-images">{["封面图", "8 步流程图", "工作台界面图", "改写对比图"].map((name) => <div key={name}><span>{name}</span></div>)}</div></Panel><Panel title="图片 brief" caption="可交给设计师或图像模型。"><textarea className="studio-brief" defaultValue="清爽的内容创作工作台界面，左侧为 8 步创作流程，右侧为文章编辑区与当前步骤助手。浅青灰背景，青绿色主行动，深墨蓝用于助手区域，不出现机器人形象。" /></Panel></div>;
  return <div className="studio-grid"><Checklist publish /><Panel title="发布预览" caption="公众号首屏摘要效果。"><article className="studio-publish-preview"><h2>把零散灵感变成可发布文章：一套自媒体写作工作台</h2><p>灵感并不会自动变成文章。真正稳定的创作，往往来自一套固定流程：捕捉、澄清、大纲、初稿、润色、去 AI 味、配图和发布。</p></article></Panel></div>;
}

function Panel({ title, caption, action, children }: { title: string; caption: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className="studio-panel"><header><div><h2>{title}</h2><p>{caption}</p></div>{action}</header><div className="studio-panel-body">{children}</div></section>; }
function Checklist({ publish = false }: { publish?: boolean }) { const rows = publish ? [["标题结果明确", true], ["封面图已生成", true], ["摘要不够具体", false], ["小标题层级清晰", true], ["文末行动号召需更轻", false], ["移动端预览无长段落", true]] : [["开头 3 秒内出现痛点", true], ["连续抽象词过多", false], ["段落长度适中", true], ["小标题还可更结果导向", false]]; return <Panel title={publish ? "发布检查" : "可读性检查"} caption={publish ? "确认标题、摘要、封面、格式与 CTA。" : "优先处理影响阅读节奏的问题。"}><div className="studio-checks">{rows.map(([label, done]) => <p key={String(label)} className={done ? "done" : ""}><i>{done ? "✓" : ""}</i><span>{label}</span><small>{done ? "通过" : "待处理"}</small></p>)}</div></Panel>; }