import { cn } from "@/lib/utils";

/**
 * M5 entrance: the telora-fade keyframe (opacity only, linear, 280 ms) from app/globals.css.
 * Pure CSS, so the content is in the server HTML and reads with JavaScript off;
 * the prefers-reduced-motion block in app/globals.css switches the fade off.
 */
export function Entrance({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("telora-enter", className)}>{children}</div>;
}
