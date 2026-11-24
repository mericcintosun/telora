/* Short skeleton of the about page. Token classes only, telora-fade opacity entrance. */
export default function AboutLoading() {
  return (
    <div className="telora-enter mx-auto flex max-w-3xl flex-col gap-6 pt-10" role="status" aria-live="polite">
      <span className="sr-only">Loading how Telora works</span>
      <div className="h-10 w-2/3 rounded-xl bg-deep" aria-hidden="true" />
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-4 w-full rounded-xl bg-surface" />
        <div className="h-4 w-11/12 rounded-xl bg-surface" />
        <div className="h-4 w-3/4 rounded-xl bg-surface" />
      </div>
      <div className="h-40 rounded-2xl border border-border bg-card shadow-panel" aria-hidden="true" />
    </div>
  );
}
