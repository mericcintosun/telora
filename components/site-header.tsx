import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { HeaderLink } from "@/components/header-link";
import { ShareViewButton } from "@/components/share-view-button";

/* HEADER row of IDENTITY.md: solid ground, border-b in LINE, sticky.
   S1 rule: the mark, one link and one action. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl font-display text-xl font-black tracking-tight sm:gap-2.5"
        >
          <BrandMark size={30} />
          Telora
        </Link>
        <nav className="flex min-w-0 items-center gap-1 sm:gap-4">
          <HeaderLink href="/about">About</HeaderLink>
          <ShareViewButton />
        </nav>
      </div>
    </header>
  );
}
