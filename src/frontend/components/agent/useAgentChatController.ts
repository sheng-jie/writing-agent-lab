"use client";

import { UseAgentUpdate, useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useState } from "react";

export interface AgentChatControllerOptions {
  agentId: string;
  onError?: (error: unknown) => void;
}

/**
 * 通用 Agent 对话通信层：封装 useAgent + useCopilotKit，
 * 提供发送、停止、输入框状态等能力，不感知任何具体业务。
 */
export function useAgentChatController({ agentId, onError }: AgentChatControllerOptions) {
  const { agent } = useAgent({
    agentId,
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 80,
  });
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || agent.isRunning) return;

    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    });

    try {
      await copilotkit.runAgent({ agent });
    } catch (error) {
      onError?.(error);
    }
  }

  async function sendCurrentInput() {
    const text = input.trim();
    if (!text || agent.isRunning) return;

    setInput("");
    await send(text);
  }

  return {
    agent,
    messages: agent.messages,
    isRunning: agent.isRunning,
    hasMessages: agent.messages.length > 0,
    input,
    setInput,
    send,
    sendCurrentInput,
    abort: () => agent.abortRun(),
  };
}

export type AgentChatController = ReturnType<typeof useAgentChatController>;
