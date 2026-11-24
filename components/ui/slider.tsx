import * as React from "react";
import { cn } from "@/lib/utils";

/* Accessible range slider (native input, keyboard and screen reader friendly),
   restyled through the .telora-range rules in app/globals.css. */
function Slider({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return <input type="range" className={cn("telora-range", className)} {...props} />;
}

export { Slider };
