import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-2xl font-black">Telora</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">Telora has two pages: the poster lab and how it works.</p>
      <Button asChild variant="outline">
        <Link href="/">Back to the lab</Link>
      </Button>
    </div>
  );
}
