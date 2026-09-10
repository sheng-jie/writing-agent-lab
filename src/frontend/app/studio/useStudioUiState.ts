"use client";

import { useEffect, useRef, useState } from "react";

import type { StudioConfirmation, StudioUiState } from "./studio.controller";

const initialUiState: StudioUiState = {
  activeWorkspaceId: "idea-capture",
  collapsed: false,
  toast: { text: "", visible: false },
};

export function useStudioUiState() {
  const [ui, setUi] = useState(initialUiState);
  const [confirmation, setConfirmation] = useState<StudioConfirmation | null>(null);
  const toastTimer = useRef<number | null>(null);
  const pendingConfirmationRef = useRef<(() => boolean | void) | null>(null);

  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);

  function notify(text: string) {
    setUi((current) => ({ ...current, toast: { text, visible: true } }));
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setUi((current) => ({ ...current, toast: { ...current.toast, visible: false } }));
    }, 1800);
  }

  function requestConfirmation(title: string, description: string, onConfirm: () => boolean | void) {
    pendingConfirmationRef.current = onConfirm;
    setConfirmation({ title, description });
  }

  function confirmPendingAction() {
    const action = pendingConfirmationRef.current;
    if (action?.() === false) return;
    pendingConfirmationRef.current = null;
    setConfirmation(null);
  }

  function cancelPendingAction() {
    pendingConfirmationRef.current = null;
    setConfirmation(null);
  }

  return { ui, setUi, confirmation, notify, requestConfirmation, confirmPendingAction, cancelPendingAction };
}