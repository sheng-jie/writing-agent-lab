"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";

import "./studio.css";
import { studioAgentByStage } from "./config/studio-config";
import { StudioWorkbenchShell } from "./components/StudioWorkbenchShell";

export default function StudioPage() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent={studioAgentByStage["idea-capture"]}
      useSingleEndpoint
      showDevConsole={process.env.NODE_ENV !== "production"}
    >
      <StudioWorkbenchShell />
    </CopilotKit>
  );
}
