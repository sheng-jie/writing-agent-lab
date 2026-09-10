"use client";

import { useState } from "react";

import { createInitialWorkflow } from "../workflow/studio-workflow";

export function useStudioWorkflowState() {
  return useState(createInitialWorkflow);
}