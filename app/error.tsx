"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/* Route error boundary. Shows no error message or stack, only a retry and a way home. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-2xl font-black">Telora</p>
      <h1 className="text-xl font-semibold">This view did not load</h1>
      <p className="text-sm text-muted-foreground">Try again, or go back to the poster lab.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to the lab</Link>
        </Button>
      </div>
    </div>
  );
}
