// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useStudioState } from "./useStudioState";

vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: vi.fn(),
}));

const writingIntent = {
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
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
  });
  Object.defineProperty(window, "cancelAnimationFrame", { configurable: true, value: vi.fn() });
});

describe("Studio 工作流状态控制器", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("生成候选写作意图后保留当前阶段并允许继续修正", () => {
    const { result } = renderHook(() => useStudioState());

    act(() => result.current.proposeWritingIntent(writingIntent));

    expect(result.current.workflow.currentStageId).toBe("idea-capture");
    expect(result.current.workflow.stages["idea-capture"]).toMatchObject({
      status: "in-progress",
      proposal: writingIntent,
      accepted: null,
      revision: 0,
    });
    expect(result.current.workflow.stages["topic-generation"].status).toBe("pending");

    act(() => result.current.updateWritingIntent({ topic: "可演进的 Agent 产品工程" }));

    expect(result.current.project.writingIntent).toMatchObject({
      topic: "可演进的 Agent 产品工程",
      audience: "独立开发者",
    });
    expect(result.current.workflow.stages["idea-capture"].proposal).toEqual(writingIntent);
  });

  it("Agent 运行时阻止候选阶段产物进入下一步", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.setAgentRunning(true));

    expect(result.current.stageAction).toMatchObject({
      kind: "blocked",
      hint: "Agent 处理完成后才能进入下一步。",
    });

    act(() => result.current.runStageAction());
    expect(result.current.confirmation).toBeNull();
    expect(result.current.workflow.currentStageId).toBe("idea-capture");
  });

  it("下一步只打开摘要弹窗，取消不变，确认后才原子推进", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.proposeWritingIntent(writingIntent));
    const beforeConfirmation = result.current.workflow;

    act(() => result.current.runStageAction());

    expect(result.current.workflow).toBe(beforeConfirmation);
    expect(result.current.activeWorkspaceId).toBe("idea-capture");
    expect(result.current.confirmation).toMatchObject({
      title: "确认写作意图并进入选题生成",
    });
    expect(result.current.confirmation?.description).toContain("写作主题：Agent 产品工程");
    expect(result.current.confirmation?.description).toContain("目标读者：独立开发者");
    expect(result.current.confirmation?.description).toContain("核心观点：先闭环再扩展");

    act(() => result.current.cancelPendingAction());
    expect(result.current.confirmation).toBeNull();
    expect(result.current.workflow).toBe(beforeConfirmation);
    expect(result.current.activeWorkspaceId).toBe("idea-capture");

    act(() => result.current.runStageAction());
    act(() => result.current.confirmPendingAction());

    expect(result.current.workflow.currentStageId).toBe("topic-generation");
    expect(result.current.activeWorkspaceId).toBe("topic-generation");
    expect(result.current.workflow.stages["idea-capture"]).toMatchObject({
      status: "accepted",
      accepted: writingIntent,
      revision: 1,
    });
    expect(result.current.workflow.stages["topic-generation"].status).toBe("in-progress");
  });

  it("首次确认下一步后刷新可恢复当前写作工作流", () => {
    const first = renderHook(() => useStudioState());

    act(() => first.result.current.proposeWritingIntent(writingIntent));
    act(() => first.result.current.runStageAction());
    act(() => first.result.current.confirmPendingAction());
    first.unmount();

    const restored = renderHook(() => useStudioState());

    expect(restored.result.current.activeWorkspaceId).toBe("topic-generation");
    expect(restored.result.current.project.writingIntent).toEqual(writingIntent);
    expect(restored.result.current.workflow.currentStageId).toBe("topic-generation");
    expect(restored.result.current.workflow.stages["idea-capture"]).toMatchObject({
      status: "accepted",
      accepted: writingIntent,
    });
  });

  it("首次确认前刷新不恢复捕捉想法草稿", () => {
    const first = renderHook(() => useStudioState());

    act(() => first.result.current.proposeWritingIntent(writingIntent));
    first.unmount();

    const restored = renderHook(() => useStudioState());

    expect(restored.result.current.activeWorkspaceId).toBe("idea-capture");
    expect(restored.result.current.project.writingIntent.rawIdea).toBe("");
    expect(restored.result.current.workflow.stages["idea-capture"].proposal).toBeNull();
  });

  it("损坏的可恢复进度会整体清除并回到初始状态", () => {
    localStorage.setItem(progressStorageKey, "{not-valid-json");

    const { result } = renderHook(() => useStudioState());

    expect(result.current.workflow.currentStageId).toBe("idea-capture");
    expect(result.current.project.writingIntent.rawIdea).toBe("");
    expect(localStorage.getItem(progressStorageKey)).toBeNull();
    expect(result.current.toast).toEqual({ text: "上次进度无法恢复，已重新开始", visible: true });
  });

  it("首次确认时保存失败不会推进工作流", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.runStageAction());
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    act(() => result.current.confirmPendingAction());

    expect(result.current.workflow.currentStageId).toBe("idea-capture");
    expect(result.current.activeWorkspaceId).toBe("idea-capture");
    expect(result.current.workflow.stages["idea-capture"].status).toBe("in-progress");
    expect(result.current.saveWarning).toBe("进度保存失败，尚未进入下一阶段");
    setItem.mockRestore();
  });

  it("自动保存失败时保留当前修改并持续警告", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.runStageAction());
    act(() => result.current.confirmPendingAction());
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    act(() => result.current.updateProject({ confirmedTopic: "新的确定选题" }));

    expect(result.current.project.confirmedTopic).toBe("新的确定选题");
    expect(result.current.saveWarning).toBe("当前修改尚未保存");
    setItem.mockRestore();
  });

  it("空闲时自动载入其他标签保存的新进度", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.runStageAction());
    act(() => result.current.confirmPendingAction());
    const external = JSON.parse(localStorage.getItem(progressStorageKey)!);
    external.savedAt = "2026-08-14T10:00:00.000Z";
    external.project.confirmedTopic = "另一标签的新选题";
    localStorage.setItem(progressStorageKey, JSON.stringify(external));

    act(() => window.dispatchEvent(new StorageEvent("storage", {
      key: progressStorageKey,
      newValue: JSON.stringify(external),
    })));

    expect(result.current.project.confirmedTopic).toBe("另一标签的新选题");
    expect(result.current.externalProgressAvailable).toBe(false);
  });

  it("有未发送输入时提示手动载入其他标签的新进度", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.runStageAction());
    act(() => result.current.confirmPendingAction());
    act(() => result.current.setAgentDraftActive(true));
    const external = JSON.parse(localStorage.getItem(progressStorageKey)!);
    external.savedAt = "2026-08-14T10:00:00.000Z";
    external.project.confirmedTopic = "另一标签的新选题";
    localStorage.setItem(progressStorageKey, JSON.stringify(external));

    act(() => window.dispatchEvent(new StorageEvent("storage", {
      key: progressStorageKey,
      newValue: JSON.stringify(external),
    })));

    expect(result.current.project.confirmedTopic).not.toBe("另一标签的新选题");
    expect(result.current.externalProgressAvailable).toBe(true);

    act(() => result.current.loadExternalProgress());
    expect(result.current.project.confirmedTopic).toBe("另一标签的新选题");
    expect(result.current.externalProgressAvailable).toBe(false);
  });

  it("接受后锁定写作意图，只有重新开始入口可以修改", () => {
    const { result } = renderHook(() => useStudioState());
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.runStageAction());
    act(() => result.current.confirmPendingAction());
    const acceptedWorkflow = result.current.workflow;
    const acceptedIntent = result.current.project.writingIntent;

    let updated = true;
    act(() => { updated = result.current.updateWritingIntent({ topic: "不应生效" }); });

    expect(updated).toBe(false);
    expect(result.current.confirmation).toBeNull();
    expect(result.current.workflow).toBe(acceptedWorkflow);
    expect(result.current.project.writingIntent).toBe(acceptedIntent);
  });

  it("重置阶段会清空当前 Agent 的可恢复历史消息", () => {
    const { result } = renderHook(() => useStudioState());
    const messages = [{ id: "message-1", role: "user" as const, content: "旧对话" }];
    act(() => result.current.updateAgentMessages("ideaCaptureAgent", messages));
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.runStageAction());
    act(() => result.current.confirmPendingAction());
    act(() => result.current.selectWorkspace("idea-capture"));

    act(() => result.current.resetStage());
    act(() => result.current.confirmPendingAction());

    expect(result.current.getAgentMessages("ideaCaptureAgent")).toEqual([]);
  });

  it("重新开始捕捉想法会清空会话、写作意图和所有下游产物", () => {
    const { result } = renderHook(() => useStudioState());
    const resetAgent = vi.fn();

    act(() => result.current.registerAgentReset(resetAgent));
    act(() => result.current.proposeWritingIntent(writingIntent));
    act(() => result.current.runStageAction());
    act(() => result.current.confirmPendingAction());
    act(() => result.current.updateProject({ confirmedTopic: "旧选题", outline: ["旧大纲"], draft: "旧初稿" }));
    act(() => result.current.selectWorkspace("idea-capture"));
    act(() => result.current.restartIdeaCapture());
    act(() => result.current.confirmPendingAction());

    expect(resetAgent).toHaveBeenCalledOnce();
    expect(result.current.project.writingIntent).toEqual({
      rawIdea: "",
      topic: "",
      audience: "",
      purpose: "",
      platform: "",
      coreViewpoint: "",
      contentBoundary: "",
    });
    expect(result.current.project.confirmedTopic).toBe("");
    expect(result.current.project.outline).toEqual([]);
    expect(result.current.project.draft).toBe("");
    expect(result.current.workflow.currentStageId).toBe("idea-capture");
    expect(result.current.workflow.stages["idea-capture"].status).toBe("in-progress");
    expect(result.current.workflow.stages["topic-generation"].status).toBe("pending");
  });

  it("重新开始捕捉想法后刷新不会恢复旧进度", () => {
    const first = renderHook(() => useStudioState());
    act(() => first.result.current.proposeWritingIntent(writingIntent));
    act(() => first.result.current.runStageAction());
    act(() => first.result.current.confirmPendingAction());
    act(() => first.result.current.selectWorkspace("idea-capture"));
    act(() => first.result.current.restartIdeaCapture());
    act(() => first.result.current.confirmPendingAction());
    first.unmount();

    const restored = renderHook(() => useStudioState());

    expect(restored.result.current.workflow.currentStageId).toBe("idea-capture");
    expect(restored.result.current.project.writingIntent.rawIdea).toBe("");
  });

  it("首次确认后的未确认草稿会自动保存并恢复", () => {
    const first = renderHook(() => useStudioState());
    act(() => first.result.current.proposeWritingIntent(writingIntent));
    act(() => first.result.current.runStageAction());
    act(() => first.result.current.confirmPendingAction());
    act(() => first.result.current.updateProject({ confirmedTopic: "尚未确认的新选题" }));
    first.unmount();

    const restored = renderHook(() => useStudioState());

    expect(restored.result.current.project.confirmedTopic).toBe("尚未确认的新选题");
    expect(restored.result.current.workflow.stages["topic-generation"].status).toBe("in-progress");
  });

  it("文章保存状态随合法的当前写作工作流恢复", () => {
    const first = renderHook(() => useStudioState());
    act(() => first.result.current.proposeWritingIntent(writingIntent));
    act(() => first.result.current.runStageAction());
    act(() => first.result.current.confirmPendingAction());
    first.unmount();
    const snapshot = JSON.parse(localStorage.getItem(progressStorageKey)!);
    snapshot.articleSaved = true;
    localStorage.setItem(progressStorageKey, JSON.stringify(snapshot));

    const restored = renderHook(() => useStudioState());

    expect(restored.result.current.articleSaved).toBe(true);
  });
});