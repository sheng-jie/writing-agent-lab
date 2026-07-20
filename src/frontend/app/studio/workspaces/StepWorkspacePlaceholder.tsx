import { Skeleton } from "@/components/ui/skeleton";

export function StepWorkspacePlaceholder() {
  return (
    <article className="studio-stage" aria-busy="true" aria-label="步骤工作区加载占位">
      <section className="studio-panel" aria-hidden="true">
        <div className="studio-panel-body flex min-h-[430px] flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </section>
    </article>
  );
}