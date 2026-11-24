"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/* The three non-happy states of the poster lab: loading, error and empty.
   Token classes only. The only motion is the telora-fade opacity entrance,
   which the prefers-reduced-motion block in app/globals.css turns off. */

/** Block layout of the lab while the route loads. No pulse: a static shape that fades in once. */
export function LabSkeleton() {
  return (
    <div className="telora-enter flex flex-col gap-4 pt-5" role="status" aria-live="polite">
      <span className="sr-only">Loading the poster lab</span>

      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-8 w-3/4 max-w-2xl rounded-xl bg-deep" />
        <div className="h-4 w-1/2 max-w-xl rounded-xl bg-surface" />
      </div>

      <div className="flex gap-3 overflow-hidden" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="telora-panel h-24 min-w-[12rem] flex-1" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]" aria-hidden="true">
        <div className="telora-panel flex min-h-[22rem] items-center justify-center bg-surface p-6">
          <div className="aspect-[1/1.414] h-full max-h-[34rem] min-h-[18rem] rounded-2xl bg-card shadow-lift" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="telora-panel p-6 flex flex-col gap-4">
            <div className="h-5 w-1/3 rounded-xl bg-deep" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl border border-border bg-surface" />
              ))}
            </div>
            <div className="h-3 rounded-full bg-surface" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl border border-border bg-surface" />
              ))}
            </div>
          </div>

          <div className="telora-panel p-6 flex flex-col gap-3">
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

/** Route error: one sentence, a retry that calls Next's reset, and a way back to the lab. */
export function LabErrorState({ reset }: { reset: () => void }) {
  return (
    <div className="telora-enter mx-auto flex max-w-xl flex-col items-center gap-4 py-24 text-center" role="alert">
      <div className="telora-panel flex w-full flex-col items-center gap-4 p-8">
        <h1 className="text-xl font-semibold text-bad">This view did not load</h1>
        <p className="text-sm text-muted-foreground">Something went wrong while drawing this page, so try it once more.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Back to the lab</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_LAB_MESSAGE =
  "No example posters to show right now. Upload a poster and Telora will score every line it finds.";

/** No example posters (or no text lines) to show: say what will appear and point at the upload card. */
export function LabEmptyState({ message = EMPTY_LAB_MESSAGE }: { message?: string }) {
  return (
    <div className="telora-enter telora-panel flex min-h-[18rem] flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
      <p className="max-w-[40ch] text-sm text-muted-foreground">{message}</p>
      <Button asChild className="min-h-11">
        <a href="#upload">Check your own poster</a>
      </Button>
    </div>
  );
}
