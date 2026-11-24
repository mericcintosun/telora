import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-24 text-center">
      <div className="telora-panel flex w-full flex-col items-center gap-4 p-8">
        <h1 className="text-2xl">Page not found</h1>
        <p className="text-sm text-muted-foreground">Telora has two pages: the poster lab and how it works.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to the lab</Link>
        </Button>
      </div>
    </div>
  );
}
