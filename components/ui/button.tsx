import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-[background-color,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-panel hover:shadow-lift hover:bg-primary/92",
        secondary: "bg-secondary text-secondary-foreground hover:bg-deep",
        outline: "border border-border bg-card text-foreground shadow-panel hover:bg-surface",
        ghost: "text-foreground hover:bg-surface",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-magenta underline decoration-2 underline-offset-4 hover:decoration-peach",
        choice:
          "border border-border bg-card text-foreground hover:bg-surface aria-pressed:border-magenta aria-pressed:bg-magenta aria-pressed:text-on-accent aria-pressed:shadow-panel",
      },
      size: {
        /* Every size keeps a 44 px (min-h-11 / h-11) touch target. */
        default: "h-11 px-4",
        sm: "min-h-11 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
