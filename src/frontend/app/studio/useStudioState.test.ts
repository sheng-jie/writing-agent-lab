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
});