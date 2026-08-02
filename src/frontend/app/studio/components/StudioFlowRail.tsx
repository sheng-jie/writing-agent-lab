"use client";

import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

import { studioSteps } from "../studio.config";
import { getStageStateLabel } from "../studio.workflow";
import type { StudioController } from "../studio.types";

export function StudioFlowRail({ controller }: { controller: StudioController }) {
  return (
    <aside className="studio-rail" aria-label="创作流程">
      <header className="studio-brand">
        <div className="studio-brand-lockup">
          <span className="studio-logo" aria-hidden="true" />
          <span className="studio-brand-copy">
            <strong>创作工作台</strong>
            <small>从想法到发布的闭环写作系统</small>
          </span>
        </div>

        <button
          className="studio-icon-button"
          type="button"
          aria-label={controller.collapsed ? "展开创作流程栏" : "收起创作流程栏"}
          onClick={controller.toggleRail}
        >
          <ChevronLeft />
        </button>
      </header>

      <nav className="studio-steps" aria-label="步骤流">
        {studioSteps.map((step, stepIndex) => {
          const stage = controller.workflow.stages[step.id];
          const isActive = step.id === controller.activeWorkspaceId;
          const isDone = stage.status === "accepted";

          return (
            <button
              key={step.id}
              type="button"
              className={cn("studio-step", isActive && "active", isDone && "done")}
              onClick={() => controller.selectWorkspace(step.id)}
              aria-current={isActive ? "step" : undefined}
              data-title={step.title}
            >
              <span className="studio-step-index">
                <b>{isDone ? "✓" : String(stepIndex + 1).padStart(2, "0")}</b>
                <i>{step.icon}</i>
              </span>
              <span className="studio-step-copy">
                <strong>{step.title}</strong>
                <small>{step.description}</small>
                <em>{stage.status === "stale" ? "上游内容已变化，需要检查" : step.hint}</em>
              </span>
              <span className="studio-step-state">
                {getStageStateLabel(stage.status)}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
