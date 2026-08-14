"use client";

import { UseAgentUpdate, useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useEffect, useRef, useState } from "react";

export type AgentMessage = ReturnType<typeof useAgent>["agent"]["messages"][number];

export interface AgentChatOptions {
  agentId: string;
  onError?: (error: unknown) => void;
  initialMessages?: AgentMessage[];
  onMessagesChange?: (messages: AgentMessage[]) => void;
  onDraftChange?: (hasDraft: boolean) => void;
  restoreKey?: number;
}

/**
 * 通用 Agent 对话通信层：封装 useAgent + useCopilotKit，
 * 提供发送、停止、输入框状态等能力，不感知任何具体业务。
 */
export function useAgentChat({ agentId, onError, initialMessages, onMessagesChange, onDraftChange, restoreKey = 0 }: AgentChatOptions) {
  const { agent } = useAgent({
    agentId,
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 80,
  });
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");
  const restoredKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialMessages === undefined || restoredKeyRef.current === restoreKey) return;
    restoredKeyRef.current = restoreKey;
    agent.setMessages(initialMessages);
  }, [agent, initialMessages, restoreKey]);

  useEffect(() => {
    if (initialMessages !== undefined && initialMessages.length > 0 && agent.messages.length === 0) return;
    onMessagesChange?.(agent.messages);
  }, [agent.messages, initialMessages, onMessagesChange]);

  useEffect(() => {
    onDraftChange?.(input.trim().length > 0);
  }, [input, onDraftChange]);

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
    clearMessages: () => {
      if (agent.isRunning) {
        agent.abortRun();
      }
      agent.setMessages([]);
    },
  };
}

export type AgentChat = ReturnType<typeof useAgentChat>;
