import type { Metadata } from "next";
import Link from "next/link";
import { Entrance } from "@/components/entrance";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdapter } from "@/lib/adapter";
import { OCR_ASSET_HOST, OCR_PASS_RATIO } from "@/lib/config";
import { BASE_THRESHOLD_ARCMIN, SCAN_DISTANCES_M, capHeightPt, formatMeters, maxReadableDistanceM } from "@/lib/legibility";

export const metadata: Metadata = {
  title: "How it works",
  description: "The distance model, the OCR scan and the vision profiles behind Telora, with the simplifications spelled out.",
};

// The NC State anchor is 20 pt for about 7 ft; the rule of thumb scales linearly with size.
const calibration = [20, 36, 72].map((pt) => {
  const ft = (pt / 20) * 7;
  return { pt, table: `${ft.toFixed(1)} ft (${(ft * 0.3048).toFixed(1)} m)` };
});

function modelDistanceForPt(pt: number): number {
  const capMm = pt * 0.3528 * 0.7;
  return capMm / Math.tan(((BASE_THRESHOLD_ARCMIN / 60) * Math.PI) / 180) / 1000;
}

const DETAILS = "group rounded-2xl bg-card p-4 shadow-panel";
const SUMMARY = "cursor-pointer font-semibold marker:text-magenta";

export default async function AboutPage() {
  const adapter = getAdapter();
  const [posters, profiles] = await Promise.all([adapter.listPosters(), adapter.listProfiles()]);
  const sample = posters.find((p) => p.blocks.length >= 2) ?? null;
  const twenty = profiles.find((p) => p.id === "2020") ?? profiles[0] ?? null;

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-14 pt-10">
      <Entrance className="flex flex-col gap-3">
        <h1 className="text-4xl leading-tight sm:text-5xl">How Telora works</h1>
        <p className="text-lg leading-relaxed">
          Telora reads your actual poster and answers one question per line of text: how far away does this still read?
        </p>
      </Entrance>

      <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl sm:text-3xl">Blur to the eye&apos;s limit</h2>
          <p className="text-base leading-relaxed">
            Each line&apos;s capital height on your paper becomes a visual angle at your distance, and below{" "}
            {BASE_THRESHOLD_ARCMIN} arcminutes for 20/20 vision the preview blurs it out.
          </p>
          <details className={DETAILS}>
            <summary className={SUMMARY}>Four steps from paper to verdict</summary>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Physical size: you pick the paper (A3 to A0) and every block&apos;s capital height becomes millimetres on
                that sheet.
                {sample && (
                  <>
                    {" "}
                    The {sample.blocks[1].label.toLowerCase()} on &ldquo;{sample.title}&rdquo; prints at{" "}
                    {Math.round(capHeightPt(sample.blocks[1], sample.intendedSize))} pt on {sample.intendedSize}.
                  </>
                )}
              </li>
              <li>Visual angle: at distance d, a letter of height h covers 2 atan(h / 2d) of your view, in arcminutes.</li>
              <li>
                Threshold: capitals read at about {BASE_THRESHOLD_ARCMIN} arcmin for 20/20 vision, 20/40 doubles it, and
                weak contrast raises it by (7 / contrast)^0.6 below 7:1. A pair with almost no brightness difference stops
                reading past 60 cm at any size: the deuteranopia trap of red text on green.
              </li>
              <li>
                Verdict: maximum distance is cap height over tan(threshold).
                {sample && twenty && (
                  <>
                    {" "}
                    On the sample poster that gives the {sample.blocks[1].label.toLowerCase()}{" "}
                    {formatMeters(maxReadableDistanceM(sample.blocks[1], sample.intendedSize, twenty))} and the{" "}
                    {sample.blocks[0].label.toLowerCase()}{" "}
                    {formatMeters(maxReadableDistanceM(sample.blocks[0], sample.intendedSize, twenty))}.
                  </>
                )}
              </li>
            </ol>
          </details>
          <details className={DETAILS}>
            <summary className={SUMMARY}>Checked against the NC State table</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 font-semibold">Type size</th>
                    <th className="py-2 font-semibold">NC State anchor (20 pt, 7 ft), scaled</th>
                    <th className="py-2 font-semibold">Telora, 20/20, high contrast</th>
                  </tr>
                </thead>
                <tbody>
                  {calibration.map((row) => (
                    <tr key={row.pt} className="border-b border-border last:border-0">
                      <td className="py-2">{row.pt} pt</td>
                      <td className="py-2">{row.table}</td>
                      <td className="py-2 font-semibold">{formatMeters(modelDistanceForPt(row.pt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
        <Card className="overflow-hidden p-3">
          <SceneSlot
            n={2}
            alt="A peach eye sends a narrow magenta sight cone toward a capital letter A, which repeats smaller and blurrier as it moves away"
            width={960}
            height={640}
            className="rounded-2xl"
          />
        </Card>
      </section>

      <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="order-last overflow-hidden p-3 md:order-first">
          <SceneSlot
            n={3}
            alt="Three posters on a board, a club night, a science fair results sheet and an academic poster, each text line framed in green, amber or red"
            width={960}
            height={640}
            className="rounded-2xl"
          />
        </Card>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl sm:text-3xl">A second opinion from OCR</h2>
          <p className="text-base leading-relaxed">
            On a poster you upload, Tesseract.js re-reads it blurred to {SCAN_DISTANCES_M.length} distances, and a line
            counts as read while {Math.round(OCR_PASS_RATIO * 100)}% of its words still match.
          </p>
          <details className={DETAILS}>
            <summary className={SUMMARY}>What runs where</summary>
            <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Tesseract.js finds every text line in Web Workers in your browser, then re-reads the poster at{" "}
                {SCAN_DISTANCES_M.join(", ")} m. OCR reads like a machine, not a person, so it checks the model rather
                than replacing it.
              </p>
              <p>
                Canvas measures luminance contrast per line, CSS filters apply the blur for your distance, and the
                Machado 2009 matrix simulates deuteranopia.
              </p>
              <p>
                No account, no API key, no server. Your poster never leaves the tab. Once the lab is idle, the browser
                downloads the OCR engine and its English language data (about 4 MB) from {OCR_ASSET_HOST}, the default
                source of Tesseract.js; the pdf.js worker comes from this site. The PNG report is drawn in the tab too.
              </p>
            </div>
          </details>
        </div>
      </section>

      <div>
        <Button asChild size="lg">
          <Link href="/#upload">Check your own poster</Link>
        </Button>
      </div>
    </article>
  );
}
