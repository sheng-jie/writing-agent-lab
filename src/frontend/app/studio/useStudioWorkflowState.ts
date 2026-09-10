"use client";

import { useState } from "react";

import { createInitialWorkflow } from "./studio.workflow";

export function useStudioWorkflowState() {
  return useState(createInitialWorkflow);
}