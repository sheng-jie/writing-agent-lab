"use client";

import { cn } from "@/lib/utils";

import { StudioActionbar } from "./StudioActionbar";
import { StudioFlowRail } from "./StudioFlowRail";
import { StudioToast } from "./StudioToast";
import { StudioTopbar } from "./StudioTopbar";
import { StepWorkspace } from "../workspaces/StepWorkspace";
import { useStudioState } from "../hooks/useStudioState";

export function StudioWorkbenchShell() {
  const controller = useStudioState();

  return (
    <main className={cn("fd-studio", controller.ui.collapsed && "rail-collapsed")}>
      <a className="studio-skip" href="#studio-main">
        跳到工作区
      </a>

      <StudioFlowRail controller={controller} />

      <section className="studio-workbench" id="studio-main">
        <StudioTopbar controller={controller} />
        <section className="studio-content">
          <StepWorkspace controller={controller} />
        </section>
        <StudioActionbar controller={controller} />
      </section>

      <StudioToast controller={controller} />
    </main>
  );
}
