import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function AboutPage() {
  const adapter = getAdapter();
  const [posters, profiles] = await Promise.all([adapter.listPosters(), adapter.listProfiles()]);
  const sample = posters.find((p) => p.blocks.length >= 2) ?? null;
  const twenty = profiles.find((p) => p.id === "2020") ?? profiles[0] ?? null;

  return (
    <article className="telora-enter mx-auto flex max-w-3xl flex-col gap-10 pt-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">How Telora works</h1>
        <p className="max-w-[68ch] text-lg leading-relaxed">
          People design posters 40 cm from a laptop and read them from 3 to 5 metres away. The help that exists is a
          static table of point sizes against distances. Telora reads your actual file and answers one question per
          line of text: how far away does this still read?
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">The model, in four steps</h2>
        <div className="flex flex-col gap-3 text-base leading-relaxed">
          <p>
            <strong>Physical size.</strong> You pick the paper (A3 to A0). Every block&apos;s capital height becomes
            millimetres on that sheet.
            {sample && (
              <>
                {" "}
                The {sample.blocks[1].label.toLowerCase()} on &ldquo;{sample.title}&rdquo; prints at{" "}
                {Math.round(capHeightPt(sample.blocks[1], sample.intendedSize))} pt on {sample.intendedSize}.
              </>
            )}
          </p>
          <p>
            <strong>Visual angle.</strong> At distance d, a letter of height h covers 2 atan(h / 2d) of your view. We
            measure it in arcminutes, sixtieths of a degree.
          </p>
          <p>
            <strong>Threshold.</strong> Capitals read when they span about {BASE_THRESHOLD_ARCMIN} arcmin for 20/20
            vision. 20/40 doubles that. Weak contrast raises it further: (7 / contrast)^0.6 for anything below 7:1, and
            a pair with almost no brightness difference stops reading past 60 cm no matter the size. That is the
            deuteranopia trap of red text on green.
          </p>
          <p>
            <strong>Verdict.</strong> Maximum distance is cap height over tan(threshold).
            {sample && twenty && (
              <>
                {" "}
                For the sample poster that gives the {sample.blocks[1].label.toLowerCase()}{" "}
                {formatMeters(maxReadableDistanceM(sample.blocks[1], sample.intendedSize, twenty))} and the{" "}
                {sample.blocks[0].label.toLowerCase()}{" "}
                {formatMeters(maxReadableDistanceM(sample.blocks[0], sample.intendedSize, twenty))}.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">Checked against the NC State table</h2>
        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
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
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">What runs where</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tesseract.js OCR</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Finds every text line on an uploaded poster, in Web Workers in your browser. Then it re-reads the poster
              blurred to {SCAN_DISTANCES_M.length} distances ({SCAN_DISTANCES_M.join(", ")} m). A line counts as read
              while at least {Math.round(OCR_PASS_RATIO * 100)}% of its words still match. OCR reads like a machine, not a person, so it checks the
              model rather than replacing it.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Canvas and CSS filters</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Measures luminance contrast per line, applies the blur for your distance, and the Machado 2009 matrix for
              deuteranopia.
            </CardContent>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground">
          No account, no API key, no server. Your poster never leaves the tab. Once the lab is idle, the browser
          downloads the OCR engine and its English language data (about 4 MB) from {OCR_ASSET_HOST}, the default
          source of Tesseract.js;
          the pdf.js worker comes from this site. The PNG report is drawn in the tab too.
        </p>
      </section>

      <div>
        <Button asChild size="lg">
          <Link href="/#upload">Check your own poster</Link>
        </Button>
      </div>
    </article>
  );
}
