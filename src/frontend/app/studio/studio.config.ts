import type { StudioProject, StudioStep } from "./studio.types";
import type { StudioStageId } from "./studio.workflow";

export const studioAgentByStage: Record<StudioStageId, string> = {
  "idea-capture": "ideaCaptureAgent",
  "topic-generation": "studioTopicAgent",
  "outline-planning": "studioOutlineAgent",
  drafting: "studioDraftingAgent",
  polishing: "studioPolishingAgent",
  "image-planning": "studioImageAgent",
};

export const studioSteps: StudioStep[] = [
  {
    id: "idea-capture",
    title: "捕捉想法",
    icon: "捕",
    description: "灵感收集与素材归档",
    hint: "先把未经整理的灵感收进来，不急着判断好坏。",
    missing: "补齐写作主题、目标读者、写作目的、发布平台、核心观点与内容边界后，再提交写作意图审阅。",
    wordTarget: "—",
  },
  {
    id: "topic-generation",
    title: "选题生成",
    icon: "题",
    description: "确定读者、承诺与角度",
    hint: "把文章从“我想写什么”收束为“读者为什么要读”。",
    missing: "确认写作意图后，选择一个确定选题。",
    wordTarget: "1200–2200",
  },
  {
    id: "outline-planning",
    title: "大纲规划",
    icon: "纲",
    description: "文章骨架与段落任务",
    hint: "先定结构，再让每一段承担明确任务。",
    missing: "确认确定选题后，补齐文章主线和章节任务。",
    wordTarget: "1800",
  },
  {
    id: "drafting",
    title: "撰写初稿",
    icon: "写",
    description: "正文生成与段落展开",
    hint: "围绕写作大纲快速形成可编辑初稿，不在这一阶段追求完美。",
    missing: "确认写作大纲后，完成一份可继续改写的初稿。",
    wordTarget: "1800",
  },
  {
    id: "polishing",
    title: "润色改写",
    icon: "润",
    description: "节奏、表达与去 AI 味",
    hint: "提升可读性，保留个人判断，并处理模板化表达。",
    missing: "确认初稿后，处理标题、开头、转场与表达自然度。",
    wordTarget: "1800",
  },
  {
    id: "image-planning",
    title: "文章配图",
    icon: "图",
    description: "封面、信息图与段落插图",
    hint: "让图片承担解释任务，而不是只做装饰。",
    missing: "确认润色稿后，为关键段落补齐图位与配图需求。",
    wordTarget: "1800",
  },
];

export const initialStudioProject: StudioProject = {
  title: "如何把零散灵感变成一篇能发布的深度文章",
  writingIntent: {
    rawIdea: "",
    topic: "",
    audience: "",
    purpose: "",
    platform: "",
    coreViewpoint: "",
    contentBoundary: "",
  },
  confirmedTopic: "把零散灵感变成可发布文章：一套自媒体写作工作台",
  outline: ["开场：创作者真正卡住的不是写字", "为什么需要固定工作流", "六个阶段如何推进", "AI 应该在什么位置介入", "文章形成前的检查清单"],
  draft: "很多自媒体作者的问题，不是没有灵感，而是灵感一旦进入写作阶段就会散掉。\n\n你可能在通勤时想到一个观点，在评论区看到一个读者问题，又在别人的文章里发现一个案例。但真正打开文档时，这些东西并不会自动变成一篇文章。\n\n所以我更建议把写作看成一个工作台，而不是一个空白文档。工作台的意义，是让每一步都有明确的输入和输出：先捕捉想法，再生成选题，接着规划大纲、写初稿、润色改写和文章配图。",
  polishedDraft: "很多创作者并不缺灵感。真正困难的是：那些零散想法，一到写作时就散成了碎片。",
  imageBrief: "清爽的内容创作工作台界面，左侧为六个写作阶段，右侧为文章编辑区与当前步骤 Agent。浅青灰背景，青绿色主行动，深墨蓝用于 Agent 区域，不出现机器人形象。",
  artifacts: {},
};
