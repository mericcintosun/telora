"use client";

import { LabErrorState } from "@/components/lab-states";

/* Route error boundary for / and /about. Shows no error message or stack, only a retry and a way home. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <LabErrorState reset={reset} />;
}
