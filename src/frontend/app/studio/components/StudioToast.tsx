import type { StudioController } from "../studio.types";

export function StudioToast({ controller }: { controller: StudioController }) {
  if (!controller.toast.visible) return null;

  return (
    <div className="studio-toast" role="status">
      {controller.toast.text}
    </div>
  );
}
