import Link from "next/link";
import { Entrance } from "@/components/entrance";
import { PosterLab, type LabState } from "@/components/poster-lab";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLabData } from "@/lib/adapter";
import { BASE_THRESHOLD_ARCMIN, PAPER_MM } from "@/lib/legibility";
import { LabParamsSchema, type LabParams } from "@/lib/schemas";

// No page title: `/` is the product, so it uses the layout default "Telora: know before you print".

// Visual angle of an A2 sheet at 4 m, in arcminutes: 2 atan(h / 2d), the same geometry as the verdicts.
const a2ArcminAt4m = Math.round(((2 * Math.atan(PAPER_MM.A2.h / (2 * 4000))) * 180 * 60) / Math.PI);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DETAILS = "group rounded-2xl bg-card p-4 shadow-panel";
const SUMMARY = "cursor-pointer font-semibold marker:text-magenta";

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
  const initial: LabState = {
    posterId: poster?.id ?? "",
    size,
    distanceM,
    profileId: profile?.id ?? "2020",
    view: params.view ?? "flat",
  };

  return (
    <div className="flex flex-col gap-16">
      {/* The mesh hero: the claim band (two lines, one CTA) over the live lab. */}
      <div className="telora-mesh -mx-4 flex flex-col gap-4 px-4 pb-8 pt-5 sm:-mx-6 sm:px-6 lg:rounded-b-[2rem]">
        <Entrance className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-2xl leading-tight sm:text-3xl">
              See which poster line stops reading across the{" "}
              <span className="telora-gradient-word">hallway</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Say where it will hang, and Telora shows the exact metres each line disappears at.
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href="#upload">Check your own poster</a>
          </Button>
        </Entrance>

        <PosterLab initial={initial} posters={posters} profiles={profiles} mode={mode} />
      </div>

      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl leading-tight sm:text-4xl">Every line gets its own distance</h2>
          <p className="text-base leading-relaxed">
            Every line on your poster gets its own reading distance and its own fix, worked out from the paper you print
            on and the spot people stand.
          </p>
          <details className={DETAILS}>
            <summary className={SUMMARY}>How the number is worked out</summary>
            <ol className="telora-enter-list mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Paper to eye: A2 is {PAPER_MM.A2.h} mm tall, so from 4 m the sheet spans about {a2ArcminAt4m} arcminutes
                of your view.
              </li>
              <li>
                Eye to blur: capitals need about {BASE_THRESHOLD_ARCMIN} arcmin to read with 20/20 vision, and the preview
                blurs to that limit.
              </li>
              <li>Blur to verdict: each line gets a maximum distance and a fix, either how many times bigger or a new color pair.</li>
            </ol>
          </details>
        </div>
        <Card className="overflow-hidden p-3">
          <SceneSlot
            n={4}
            alt="A report panel lists five poster lines, each with a green, amber or red dot and a bar showing how far it reads, next to a small poster with matching outlines"
            width={1200}
            height={560}
            className="rounded-2xl"
          />
        </Card>
      </section>

      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
        <Card className="order-last overflow-hidden p-3 lg:order-first">
          <SceneSlot
            n={5}
            alt="An empty corridor wall waits under a ceiling light, with a dashed outline where a poster will hang and distance marks on the floor"
            width={720}
            height={640}
            className="rounded-2xl"
          />
        </Card>
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl leading-tight sm:text-4xl">For the poster you finish the night before</h2>
          <p className="text-base leading-relaxed">
            Check the wall before the print shop does: everything runs in your browser and nothing is uploaded.
          </p>
          <details className={DETAILS}>
            <summary className={SUMMARY}>What the simulation leaves out</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A Gaussian blur stands in for the eye&apos;s contrast sensitivity curve, and lighting, glare and viewing
              angle are ignored. The threshold is calibrated so 20 pt type reads to about 2.1 m, which matches the NC
              State poster table, so read the numbers as a ranking: if the date lasts 2.4 m and the title 9 m, the date is
              the problem.
            </p>
          </details>
          <p className="text-sm">
            <Link href="/about" className="font-semibold text-magenta underline underline-offset-4">
              Read the full model
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
