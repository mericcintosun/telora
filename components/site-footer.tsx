import Link from "next/link";

const LINK = "inline-flex min-h-11 items-center rounded-xl font-semibold underline decoration-peach decoration-2 underline-offset-4 hover:decoration-magenta";

/** Footer: links and one sentence. */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-muted-foreground">Built for IdeaLab Hacks, November 2026.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
          <a href="https://github.com/mericcintosun/telora" className={LINK}>
            Source on GitHub
          </a>
          <a href="https://idealab-hacks.devpost.com/" className={LINK}>
            IdeaLab Hacks
          </a>
          <Link href="/about" className={LINK}>
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
