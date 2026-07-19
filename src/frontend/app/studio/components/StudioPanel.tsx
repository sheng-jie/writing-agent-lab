import type { ReactNode } from "react";

export function StudioPanel({
  title,
  caption,
  action,
  children,
}: {
  title: string;
  caption: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="studio-panel">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{caption}</p>
        </div>
        {action}
      </header>
      <div className="studio-panel-body">{children}</div>
    </section>
  );
}
