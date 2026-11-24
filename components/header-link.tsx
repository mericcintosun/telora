"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** The header's one link. Marks itself with aria-current="page" on its own route. */
export function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-xl px-2 text-sm font-semibold whitespace-nowrap underline decoration-2 underline-offset-4 hover:decoration-magenta",
        active ? "decoration-magenta" : "decoration-peach"
      )}
    >
      {children}
    </Link>
  );
}
