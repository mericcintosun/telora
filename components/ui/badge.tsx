import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* Solid fills only: verdict badges carry state colors (OK, WARN, BAD), never brand. */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-surface text-foreground",
        outline: "border border-border bg-card text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        legible: "bg-ok text-on-accent",
        borderline: "bg-warn text-on-accent",
        lost: "bg-bad text-on-accent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
