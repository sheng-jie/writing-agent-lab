"use client";

import type { ReactNode } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

export interface AgentCardShellProps {
  status: ToolCallStatus;
  /** 工具调用尚未进入 executing 阶段时展示的占位内容。 */
  pending: ReactNode;
  children: ReactNode;
}

/**
 * 通用交互卡片外壳：根据 human-in-the-loop 工具的 status
 * 在“准备中”占位内容和实际交互内容之间切换，避免每个业务卡片
 * 都重复实现一个 XxxPendingCard 组件。
 */
export function AgentCardShell({ status, pending, children }: AgentCardShellProps) {
  return status === ToolCallStatus.InProgress ? <>{pending}</> : <>{children}</>;
}
