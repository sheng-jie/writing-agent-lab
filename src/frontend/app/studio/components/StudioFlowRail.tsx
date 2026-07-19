"use client";

import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

import { studioSteps } from "../studio.config";
import type { StudioController } from "../studio.types";

export function StudioFlowRail({ controller }: { controller: StudioController }) {
  const activeStepIndex = studioSteps.findIndex((step) => step.id === controller.activeStepId);
  const progress = Math.round(((activeStepIndex + 1) / studioSteps.length) * 100);

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

      <section className="studio-progress" aria-label="文章进度">
        <small>当前文章进度</small>
        <div className="studio-meter">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <p>
          <span>
            {activeStepIndex + 1} / {studioSteps.length} 步
          </span>
          <span>{progress}%</span>
        </p>
      </section>

      <nav className="studio-steps" aria-label="步骤流">
        {studioSteps.map((step, stepIndex) => {
          const isActive = step.id === controller.activeStepId;
          const isDone = stepIndex < activeStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              disabled={controller.isAdvancing}
              className={cn("studio-step", isActive && "active", isDone && "done")}
              onClick={() => controller.selectStep(step.id)}
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
                <em>{step.outcome}</em>
              </span>
              <span className="studio-step-state">
                {isDone ? "已完成" : isActive ? "进行中" : "待处理"}
              </span>
            </button>
          );
        })}
      </nav>

      <footer className="studio-health">
        <p>
          <span>结构完整度</span>
          <b>{controller.activeStep.structure}</b>
        </p>
        <p>
          <span>表达自然度</span>
          <b>{controller.activeStep.natural}</b>
        </p>
        <p>
          <span>发布准备</span>
          <b>{controller.activeStep.publish}</b>
        </p>
      </footer>
    </aside>
  );
}
