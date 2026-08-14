// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAgentChat, type AgentMessage } from "./useAgentChat";

const setMessages = vi.fn();
const agent = {
  isRunning: false,
  messages: [] as unknown[],
  addMessage: vi.fn(),
  abortRun: vi.fn(),
  setMessages,
};

vi.mock("@copilotkit/react-core/v2", () => ({
  UseAgentUpdate: {
    OnMessagesChanged: "OnMessagesChanged",
    OnRunStatusChanged: "OnRunStatusChanged",
  },
  useAgent: vi.fn(() => ({ agent })),
  useCopilotKit: vi.fn(() => ({ copilotkit: { runAgent: vi.fn() } })),
}));

describe("Agent 对话通信层", () => {
  beforeEach(() => {
    agent.messages = [];
    vi.clearAllMocks();
  });

  it("恢复已提交消息并在消息变化时上报", () => {
    const restoredMessages: AgentMessage[] = [{ id: "message-1", role: "user", content: "继续上次写作" }];
    const onMessagesChange = vi.fn();

    const { rerender } = renderHook(
      ({ initialMessages }) => useAgentChat({ agentId: "ideaCaptureAgent", initialMessages, onMessagesChange }),
      { initialProps: { initialMessages: restoredMessages } },
    );

    expect(setMessages).toHaveBeenCalledWith(restoredMessages);
    expect(onMessagesChange).not.toHaveBeenCalledWith([]);

    const nextMessages: AgentMessage[] = [...restoredMessages, { id: "message-2", role: "assistant", content: "已恢复" }];
    act(() => {
      agent.messages = nextMessages;
      rerender({ initialMessages: restoredMessages });
    });

    expect(onMessagesChange).toHaveBeenLastCalledWith(nextMessages);
  });

  it("上报输入框是否包含未发送内容", () => {
    const onDraftChange = vi.fn();
    const { result } = renderHook(() => useAgentChat({ agentId: "ideaCaptureAgent", onDraftChange }));

    expect(onDraftChange).toHaveBeenLastCalledWith(false);

    act(() => result.current.setInput("尚未发送的补充"));

    expect(onDraftChange).toHaveBeenLastCalledWith(true);
  });

  it("恢复版本变化时可以用空快照清除当前会话", () => {
    agent.messages = [{ id: "message-1", role: "user", content: "旧会话" }];
    const { rerender } = renderHook(
      ({ restoreKey }) => useAgentChat({ agentId: "ideaCaptureAgent", initialMessages: [], restoreKey }),
      { initialProps: { restoreKey: 1 } },
    );

    expect(setMessages).toHaveBeenCalledWith([]);
    setMessages.mockClear();

    rerender({ restoreKey: 2 });

    expect(setMessages).toHaveBeenCalledWith([]);
  });
});