import type { Metadata } from "next";
import Link from "next/link";
import { PosterLab, type LabState } from "@/components/poster-lab";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLabData } from "@/lib/adapter";
import { LabParamsSchema, type LabParams } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Poster distance lab",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { posters, profiles, mode } = await getLabData();

  // Bad or missing params fall back silently; a broken link never errors.
  const parsed = LabParamsSchema.safeParse(sp);
  const params: LabParams = parsed.success ? parsed.data : {};

  const poster = posters.find((p) => p.id === params.poster) ?? posters.find((p) => !p.fixOf) ?? posters[0];
  const size = params.size ?? poster?.intendedSize ?? "A2";
  const distanceM = params.d ?? poster?.intendedDistanceM ?? 4;
  const profile = profiles.find((p) => p.id === params.profile) ?? profiles[0];
  const initial: LabState = { posterId: poster?.id ?? "", size, distanceM, profileId: profile?.id ?? "2020" };

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-4 pt-5">
        <div className="telora-enter flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">See your poster from across the hallway, before you print it.</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Drag the distance slider. Every line that stops reading turns red and tells you how many metres it lasts.
            </p>
          </div>
          <Button asChild size="lg">
            <a href="#upload">Check your own poster</a>
          </Button>
        </div>

        <PosterLab initial={initial} posters={posters} profiles={profiles} mode={mode} />
      </div>

      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">
            Every line gets its own <span className="telora-gradient-word">distance</span>
          </h2>
          <p className="max-w-[68ch] text-base leading-relaxed">
            Poster tables tell you that 24 pt is fine from 2 metres. They never look at your file. Telora does: it
            works out how big each line will be on the paper you print, how big that is in your eye at the spot
            people will stand, and where it falls under the limit of what a human eye resolves.
          </p>
          <div className="telora-enter-list grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Paper to eye</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                A2 is 594 mm tall. From 4 m, that whole sheet spans about 509 arcminutes of your view.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Eye to blur</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Capitals need about 8 arcmin to read with 20/20 vision. The preview blurs to that limit, live.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Blur to verdict</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Each block gets a maximum distance and a fix: how many times bigger, or a different color pair.
              </CardContent>
            </Card>
          </div>
        </div>
        <Card className="overflow-hidden p-3">
          <SceneSlot
            n={2}
            alt="A large peach eye on the left sends a narrow magenta sight cone across the page to a capital letter A, which repeats smaller and blurrier as it moves away"
            width={960}
            height={640}
            className="rounded-xl"
          />
        </Card>
      </section>

      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <Card className="order-last overflow-hidden p-3 lg:order-first">
          <SceneSlot
            n={3}
            alt="Three posters pinned to a cork board, a club night, a science fair results sheet and an academic poster, each text line framed in green, amber or red"
            width={960}
            height={640}
            className="rounded-xl"
          />
        </Card>
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">For the poster you finish the night before</h2>
          <p className="max-w-[68ch] text-base leading-relaxed">
            Club nights, science fair boards, conference posters. They get designed 40 cm from a laptop screen and read
            from 3 to 5 metres down a corridor. The date, the room number and the line under the QR code are the
            first things to go.
          </p>
          <details className="group max-w-[68ch] rounded-2xl border border-border bg-card p-4 shadow-panel">
            <summary className="cursor-pointer font-semibold marker:text-magenta">
              What the simulation leaves out, and why the numbers still help
            </summary>
            <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                A Gaussian blur is a simplification of the eye&apos;s contrast sensitivity curve, and lighting, glare
                and viewing angle are ignored. The threshold is calibrated so that 20 pt type reads to about 2.1 m,
                which matches the widely used NC State poster table.
              </p>
              <p>
                The scores are best read as relative: if your date lasts 2.4 m and your title 9 m, the date is the
                problem, whatever the light in that hallway.
              </p>
            </div>
          </details>
          <p className="text-sm">
            Everything runs in your browser and nothing is uploaded.{" "}
            <Link href="/about" className="font-semibold text-magenta underline underline-offset-4">
              Read the full model
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
