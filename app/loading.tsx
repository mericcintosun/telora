/* Skeleton of the poster lab while the route loads. Token classes only; the only motion
   is the telora-fade opacity entrance (disabled under prefers-reduced-motion). */
export default function Loading() {
  return (
    <div className="telora-enter flex flex-col gap-4 pt-5" role="status" aria-live="polite">
      <span className="sr-only">Loading the poster lab</span>

      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-8 w-3/4 max-w-2xl rounded-xl bg-deep" />
        <div className="h-4 w-1/2 max-w-xl rounded-xl bg-surface" />
      </div>

      <div className="flex gap-3 overflow-hidden" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 min-w-[12rem] flex-1 rounded-2xl border border-border bg-card shadow-panel" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]" aria-hidden="true">
        <div className="flex min-h-[27.5rem] items-center justify-center rounded-2xl border border-border bg-surface p-6 shadow-panel">
          <div className="aspect-[1/1.414] h-full max-h-[34rem] min-h-[20rem] rounded-xl bg-card shadow-lift" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-panel">
            <div className="h-5 w-1/3 rounded-xl bg-deep" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-surface" />
              ))}
            </div>
            <div className="h-3 rounded-full bg-surface" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-surface" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-panel">
            <div className="h-5 w-1/3 rounded-xl bg-deep" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-1.5 border-b border-border pb-3 last:border-0">
                <div className="h-4 w-2/5 rounded-xl bg-surface" />
                <div className="h-3 w-4/5 rounded-xl bg-surface" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
