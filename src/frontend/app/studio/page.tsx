"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";

import "./studio.css";
import { StudioWorkspace } from "./StudioWorkspace";

export default function StudioPage() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="clarificationAgent"
      useSingleEndpoint
      showDevConsole={process.env.NODE_ENV !== "production"}
    >
      <StudioWorkspace />
    </CopilotKit>
  );
}
