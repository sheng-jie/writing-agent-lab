"use client";

import { CopilotChatInput } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

import type { AgentChat } from "./useAgentChat";

export interface AgentInputProps {
  chat: AgentChat;
  placeholder?: string;
}

/**
 * 基于 CopilotKit 官方 CopilotChatInput 实现的输入区：自动增高的多行输入框、
 * 发送/停止按钮的排版与可访问性都交给库处理，我们只负责接线到 useAgentChat。
 * https://docs.copilotkit.ai/reference/v2/components/CopilotChatInput
 */
export function AgentInput({ chat, placeholder }: AgentInputProps) {
  return (
    <CopilotChatInput
      className="border-t border-border"
      value={chat.input}
      onChange={chat.setInput}
      isRunning={chat.isRunning}
      autoFocus
      bottomAnchored
      textArea={{ placeholder: chat.isRunning ? "Agent 正在思考…" : placeholder }}
      onSubmitMessage={(text) => {
        chat.setInput("");
        void chat.send(text);
      }}
      onStop={() => chat.abort()}
    />
  );
}
