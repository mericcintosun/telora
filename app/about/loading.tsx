/* Text-only skeleton of the about page. Token classes only, telora-fade opacity entrance.
   /about is static copy with no data, so it has no empty state. */
function AboutSkeleton() {
  return (
    <div className="telora-enter mx-auto flex max-w-3xl flex-col gap-6 pt-10" role="status" aria-live="polite">
      <span className="sr-only">Loading how Telora works</span>
      <div className="h-10 w-2/3 rounded-xl bg-deep" aria-hidden="true" />
      {[0, 1, 2].map((p) => (
        <div key={p} className="flex flex-col gap-2" aria-hidden="true">
          <div className="h-4 w-full rounded-xl bg-surface" />
          <div className="h-4 w-11/12 rounded-xl bg-surface" />
          <div className="h-4 w-3/4 rounded-xl bg-surface" />
        </div>
      ))}
    </div>
  );
}

export default function AboutLoading() {
  return <AboutSkeleton />;
}
