import type { StudioController } from "../types/studio-controller";

export function StudioToast({ controller }: { controller: StudioController }) {
  if (!controller.ui.toast.visible) return null;

  return (
    <div className="studio-toast" role="status">
      {controller.ui.toast.text}
    </div>
  );
}
