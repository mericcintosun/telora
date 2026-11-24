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
    <Button variant="outline" size="sm" onClick={copy} aria-live="polite">
      <Link2 />
      {status === "copied" ? "Link copied" : status === "failed" ? "Copy blocked, use the address bar" : "Share this view"}
    </Button>
  );
}
