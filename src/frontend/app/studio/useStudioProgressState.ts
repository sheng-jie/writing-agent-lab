"use client";

import { useRef, useState } from "react";

import type { AgentMessage } from "@/components/agent/useAgentChat";

import type { StudioProgressSnapshot } from "./studio.persistence";

export function useStudioProgressState() {
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentDraftActive, setAgentDraftActive] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [externalProgress, setExternalProgress] = useState<StudioProgressSnapshot | null>(null);
  const [agentMessagesRestoreKey, setAgentMessagesRestoreKey] = useState(0);
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Record<string, AgentMessage[]>>({});
  const agentResetRef = useRef<(() => void) | null>(null);
  const skipNextSaveRef = useRef(false);

  function registerAgentReset(reset: () => void) {
    agentResetRef.current = reset;
    return () => {
      if (agentResetRef.current === reset) agentResetRef.current = null;
    };
  }

  return {
    agentRunning, setAgentRunning, agentDraftActive, setAgentDraftActive,
    saveWarning, setSaveWarning, externalProgress, setExternalProgress,
    agentMessagesRestoreKey, setAgentMessagesRestoreKey,
    progressHydrated, setProgressHydrated, agentMessages, setAgentMessages,
    agentResetRef, skipNextSaveRef, registerAgentReset,
  };
}