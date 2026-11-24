"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copies the current URL: poster, print size, distance and vision profile all live in it. */
export function ShareViewButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <Button variant="outline" size="sm" className="min-h-11 min-w-0" onClick={copy} aria-live="polite">
      <Link2 />
      {/* Short labels below sm so the header fits at 360 px next to the mark and the one link. */}
      <span className="truncate sm:hidden">
        {status === "copied" ? "Copied" : status === "failed" ? "Use address bar" : "Share"}
      </span>
      <span className="hidden sm:inline">
        {status === "copied" ? "Link copied" : status === "failed" ? "Copy blocked, use the address bar" : "Share this view"}
      </span>
    </Button>
  );
}
