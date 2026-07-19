"use client";

import { cn } from "@/lib/utils";

import { StudioActionbar } from "./components/StudioActionbar";
import { StudioFlowRail } from "./components/StudioFlowRail";
import { StudioToast } from "./components/StudioToast";
import { StudioTopbar } from "./components/StudioTopbar";
import { StepWorkspace } from "./steps/StepWorkspace";
import { useStudioState } from "./useStudioState";

export function StudioWorkspace() {
  const controller = useStudioState();

  return (
    <main className={cn("fd-studio", controller.collapsed && "rail-collapsed")}>
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
