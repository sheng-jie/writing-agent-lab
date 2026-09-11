// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useStudioState } from "./useStudioState";
import type { StageArtifactMap, StudioStageId } from "../workflow/studio-workflow";

const writingIntent: StageArtifactMap["idea-capture"] = {
  rawIdea: "想写 Agent 产品工程",
  topic: "Agent 产品工程",
  audience: "独立开发者",
  purpose: "帮助读者形成开发顺序",
  platform: "微信公众号",
  coreViewpoint: "先闭环再扩展",
  contentBoundary: "不讨论模型训练",
};

const storage = new Map<string, string>();
const progressStorageKey = "flowdraft-studio-progress";

beforeAll(() => {
  const localStorageMock: Storage = {
    get length() { return storage.size; },
    clear: () => storage.clear(),
    getItem: (key) => storage.get(key) ?? null,
    key: (index) => [...storage.keys()][index] ?? null,
    removeItem: (key) => { storage.delete(key); },
    setItem: (key, value) => { storage.set(key, value); },
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: localStorageMock });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorageMock });
  Object.defineProperty(window, "requestAnimationFrame", { configurable: true, value: (callback: FrameRequestCallback) => { callback(0); return 1; } });
  Object.defineProperty(window, "cancelAnimationFrame", { configurable: true, value: vi.fn() });
});

function acceptCurrentStage(result: ReturnType<typeof renderHook<ReturnType<typeof useStudioState>, unknown>>["result"]) {
  act(() => result.current.workflow.reportStageComplete(result.current.workspace.activeWorkspaceId, true));
  act(() => result.current.workflow.runStageAction());
  act(() => result.current.ui.confirmPendingAction());
}

function generateAllStages(result: ReturnType<typeof renderHook<ReturnType<typeof useStudioState>, unknown>>["result"]) {
  const stages: [StudioStageId, StageArtifactMap[StudioStageId]][] = [
    ["idea-capture", writingIntent],
    ["topic-generation", { candidates: [
      { id: "topic-1", title: "标题", audience: "读者", coreViewpoint: "观点", angle: "角度", excludedContent: "边界" },
      { id: "topic-2", title: "另一个标题", audience: "另一类读者", coreViewpoint: "另一个观点", angle: "另一个角度", excludedContent: "另一个边界" },
    ], selectedCandidateId: "topic-1" }],
    ["outline-planning", { throughline: "主线", sections: [{ title: "开场", task: "提出问题", materialGap: "" }] }],
    ["drafting", { content: "初稿" }],
    ["polishing", { content: "润色稿" }],
    ["image-planning", { title: "定稿标题", content: "定稿正文", illustrations: [] }],
  ];
  for (const [stageId, artifact] of stages) {
    act(() => result.current.workflow.generateStageArtifact(stageId, artifact as never));
    acceptCurrentStage(result);
  }
}

describe("工作台当前写作工作流控制器", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("生成与修正都操作同一个阶段 artifact", () => {
    const { result } = renderHook(() => useStudioState());

    act(() => result.current.workflow.generateStageArtifact("idea-capture", writingIntent));
    act(() => result.current.workflow.updateStageArtifact("idea-capture", { topic: "可演进的 Agent 产品工程" }));

    expect(result.current.workflow.getStageArtifact("idea-capture")).toEqual({ ...writingIntent, topic: "可演进的 Agent 产品工程" });
    expect(result.current.workflow.snapshot.stages["idea-capture"].generatedAt).not.toBeNull();
  });

  it("下一步先确认，确认后才原子推进并保存 v2 快照", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.workflow.generateStageArtifact("idea-capture", writingIntent));
    act(() => result.current.workflow.reportStageComplete("idea-capture", true));

    act(() => result.current.workflow.runStageAction());
    expect(result.current.workspace.activeWorkspaceId).toBe("idea-capture");
    expect(result.current.ui.confirmation?.description).toContain("写作主题：Agent 产品工程");

    act(() => result.current.ui.confirmPendingAction());
    expect(result.current.workspace.activeWorkspaceId).toBe("topic-generation");
    expect(result.current.workflow.snapshot.stages["idea-capture"].status).toBe("accepted");
    const snapshot = JSON.parse(localStorage.getItem(progressStorageKey)!);
    expect(snapshot.version).toBe(2);
    expect(snapshot).not.toHaveProperty("project");
  });

  it("首次接受前刷新不恢复草稿", () => {
    const first = renderHook(() => useStudioState());
    act(() => first.result.current.workflow.updateStageArtifact("idea-capture", { rawIdea: "未接受的想法" }));
    first.unmount();

    const restored = renderHook(() => useStudioState());
    expect(restored.result.current.workflow.getStageArtifact("idea-capture")).toBeNull();
  });

  it("v1 与损坏快照都整体放弃", () => {
    localStorage.setItem(progressStorageKey, JSON.stringify({ version: 1, workflow: {} }));
    const { result } = renderHook(() => useStudioState());

    expect(result.current.workflow.snapshot.currentStageId).toBe("idea-capture");
    expect(localStorage.getItem(progressStorageKey)).toBeNull();
    expect(result.current.ui.toast.text).toBe("上次进度无法恢复，已重新开始");
  });

  it("首次接受保存失败时不推进", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.workflow.generateStageArtifact("idea-capture", writingIntent));
    act(() => result.current.workflow.reportStageComplete("idea-capture", true));
    vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });

    act(() => result.current.workflow.runStageAction());
    act(() => result.current.ui.confirmPendingAction());

    expect(result.current.workflow.snapshot.currentStageId).toBe("idea-capture");
    expect(result.current.progress.saveWarning).toBe("进度保存失败，尚未进入下一阶段");
  });

  it("重置保存失败时保留原工作流和 Agent 消息", () => {
    const { result } = renderHook(() => useStudioState());
    generateAllStages(result);
    act(() => result.current.progress.updateAgentMessages("studioTopicAgent", [{ id: "1", role: "user", content: "保留" }]));
    act(() => result.current.workspace.selectWorkspace("topic-generation"));
    act(() => result.current.workflow.resetStage());
    vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });

    act(() => result.current.ui.confirmPendingAction());

    expect(result.current.workflow.snapshot.stages["topic-generation"].status).toBe("accepted");
    expect(result.current.progress.getAgentMessages("studioTopicAgent")).toEqual([{ id: "1", role: "user", content: "保留" }]);
    expect(result.current.progress.saveWarning).toBe("进度保存失败，尚未提交当前操作");
  });

  it("繁忙时延迟载入其他标签页的新进度", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.workflow.generateStageArtifact("idea-capture", writingIntent));
    acceptCurrentStage(result);
    act(() => result.current.progress.setAgentDraftActive(true));
    const external = JSON.parse(localStorage.getItem(progressStorageKey)!);
    external.workflow.stages["topic-generation"].artifact = {
      candidates: [
        { id: "topic-1", title: "标题", audience: "读者", coreViewpoint: "观点", angle: "角度", excludedContent: "边界" },
        { id: "topic-2", title: "另一个标题", audience: "另一类读者", coreViewpoint: "另一个观点", angle: "另一个角度", excludedContent: "另一个边界" },
      ],
      selectedCandidateId: "",
    };

    act(() => window.dispatchEvent(new StorageEvent("storage", { key: progressStorageKey, newValue: JSON.stringify(external) })));
    expect(result.current.progress.externalProgressAvailable).toBe(true);

    act(() => result.current.progress.loadExternalProgress());
    expect(result.current.workflow.getStageArtifact("topic-generation")).toMatchObject({ candidates: [{ id: "topic-1" }, { id: "topic-2" }], selectedCandidateId: "" });
  });

  it("输入框有未发送草稿时延迟载入其他标签页的新进度", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.workflow.generateStageArtifact("idea-capture", writingIntent));
    acceptCurrentStage(result);
    act(() => result.current.progress.setAgentDraftActive(true));
    const external = JSON.parse(localStorage.getItem(progressStorageKey)!);
    external.workflow.stages["topic-generation"].artifact = {
      candidates: [
        { id: "topic-1", title: "标题", audience: "读者", coreViewpoint: "观点", angle: "角度", excludedContent: "边界" },
        { id: "topic-2", title: "另一个标题", audience: "另一类读者", coreViewpoint: "另一个观点", angle: "另一个角度", excludedContent: "另一个边界" },
      ],
      selectedCandidateId: "",
    };

    act(() => window.dispatchEvent(new StorageEvent("storage", { key: progressStorageKey, newValue: JSON.stringify(external) })));

    expect(result.current.progress.externalProgressAvailable).toBe(true);
    expect(result.current.workflow.getStageArtifact("topic-generation")).toBeNull();
  });

  it("Agent 运行中不能切换工作区", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.workflow.generateStageArtifact("idea-capture", writingIntent));
    acceptCurrentStage(result);
    act(() => result.current.progress.setAgentRunning(true));

    act(() => result.current.workspace.selectWorkspace("idea-capture"));

    expect(result.current.workspace.activeWorkspaceId).toBe("topic-generation");
    expect(result.current.ui.toast.text).toBe("Agent 处理完成后才能切换工作区");
  });

  it("文章保存成功后结束工作流并可开始新的工作流", async () => {
    const { result } = renderHook(() => useStudioState());
    generateAllStages(result);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "article-1" }) }));

    await act(async () => result.current.workflow.saveArticle());
    expect(result.current.workflow.snapshot).toMatchObject({ status: "completed", articleId: "article-1" });
    expect(result.current.workflow.articleSaved).toBe(true);

    act(() => result.current.workflow.startNewWorkflow());
    expect(result.current.workflow.snapshot.status).toBe("active");
    expect(result.current.workflow.getStageArtifact("idea-capture")).toBeNull();
  });

  it("文章保存失败时保留已接受配图稿以便重试", async () => {
    const { result } = renderHook(() => useStudioState());
    generateAllStages(result);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await act(async () => result.current.workflow.saveArticle());
    expect(result.current.workflow.snapshot.status).toBe("active");
    expect(result.current.workflow.snapshot.stages["image-planning"].status).toBe("accepted");
    expect(result.current.progress.saveWarning).toBe("文章保存失败，请重试");
  });

  it("完成工作流的进度保存失败时不提交完成状态", async () => {
    const { result } = renderHook(() => useStudioState());
    generateAllStages(result);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "article-1" }) }));
    vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });

    await act(async () => result.current.workflow.saveArticle());

    expect(result.current.workflow.snapshot.status).toBe("active");
    expect(result.current.workflow.snapshot.articleId).toBeNull();
    expect(result.current.progress.saveWarning).toBe("进度保存失败，尚未提交当前操作");
  });

  it("恢复整体快照中的活动工作区和 Agent 消息", () => {
    const first = renderHook(() => useStudioState());
    act(() => first.result.current.workflow.generateStageArtifact("idea-capture", writingIntent));
    acceptCurrentStage(first.result);
    const snapshot = JSON.parse(localStorage.getItem(progressStorageKey)!);
    snapshot.activeWorkspaceId = "topic-generation";
    snapshot.agentMessages = { studioTopicAgent: [{ id: "m1", role: "user", content: "已恢复" }] };
    localStorage.setItem(progressStorageKey, JSON.stringify(snapshot));
    first.unmount();

    const restored = renderHook(() => useStudioState());

    expect(restored.result.current.workspace.activeWorkspaceId).toBe("topic-generation");
    expect(restored.result.current.progress.getAgentMessages("studioTopicAgent")).toEqual([{ id: "m1", role: "user", content: "已恢复" }]);
  });
});
