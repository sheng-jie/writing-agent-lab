"use client";

import type { StudioController } from "../studio.controller";

export function StudioTopbar({ controller }: { controller: StudioController }) {
  const { activeStep } = controller.workspace;

  return (
    <header className="studio-topbar">
      <div className="studio-title-area">
        <h1>{activeStep.title}</h1>
      </div>
    </header>
  );
}
