# DEMO: Telora in 90 seconds

**Problem:** posters get designed 40 cm from a laptop and read from 3 to 5 metres down a corridor, so the date, the room and the QR caption vanish first and nobody finds out until after the print is paid for.

**Trigger:** a visitor opens `/`. The poster lab is already loaded with an example poster, no click needed.

**Wow moment:** the visitor drags the distance slider from 1 m to 6 m. The poster blurs live, the lines turn red in order, and the date shows "2.4 m max".

**Demo start route:** `/` (`app/page.tsx`). Start from a clean URL, or `/?poster=robot-sumo-night&size=A2&d=4.0&profile=2020`.

## Steps

| # | Step | Route file | Component | Status |
| --- | --- | --- | --- | --- |
| 1 | Club poster loaded: Robot Sumo Night, A2, 4 m | `app/page.tsx` | `components/poster-lab.tsx`, `components/poster-deck.tsx` | works |
| 2 | Verdict outlines on the poster and a distance per line | `app/page.tsx` | `components/simulated-poster.tsx`, `components/block-report.tsx` | works |
| 3 | Slider dragged from 1 m to 6 m: blur grows, lines turn red in order, the date reads "2.4 m max" | `app/page.tsx` | `components/poster-lab.tsx` (Viewing distance slider), `components/simulated-poster.tsx` | works |
| 4 | Vision profile switched to 20/40, then to Deuteranopia | `app/page.tsx` | `components/poster-lab.tsx` (Who is looking), `components/simulated-poster.tsx` | works |
| 5 | Fix recipe: "enlarge it 1.7x" on the event date | `app/page.tsx` | `components/block-report.tsx` | works |
| 6 | The corrected poster is all green at 4 m | `app/page.tsx` | `components/block-report.tsx` ("Open the corrected poster"), seed variant `robot-sumo-night-fixed` in `lib/data/seed.ts` | works |
| 7 | Upload a poster (PNG, JPG, WebP or PDF): the bar steps through 8 distances, then each line reads "OCR: 2.0 m, model: 2.4 m"; "Download PNG report" saves the poster at that distance with every line's distance and fix | `app/page.tsx` (`app/about/page.tsx` explains the model) | `components/upload-scan.tsx`, `components/block-report.tsx`, `components/poster-lab.tsx` (`ReportDownload`), `lib/ocr.ts`, `lib/pdf.ts`, `lib/report.ts` | written, PDF included (first page); PNG report unverified until the runner builds it |
| 8 | Corridor view: toggle to the hallway, drag the slider, the poster shrinks and the date line goes red at 2.4 m | `app/page.tsx` (`/?view=corridor`) | `components/poster-lab.tsx` ("Flat" / "Corridor" toggle), `components/corridor-view.tsx`, `components/simulated-poster.tsx` | written, unverified until the runner builds it |

Notes per step:

1. The page reads posters and profiles through `getLabData()` (`lib/adapter/index.ts`): the active adapter, then the fake adapter, then the seed constants, so `/` never comes up empty. Bad URL params fall back to defaults silently.
2. Outlines use OK, WARN and BAD tokens. Every chip reads "Label: N m max".
3. The order of lines turning red is driven by `maxReadableDistanceM` in `lib/legibility.ts`. The narration says the date lasts to 2.4 m; check it live on the chip before recording.
4. 20/40 doubles the threshold, so every distance roughly halves. Deuteranopia is clearest on "Microplastics in Campus Tap Water" (the RESULTS banner drops to 60 cm).
5. The recipe line in the report reads "To read at 4.0 m, enlarge it 1.7x, from N pt to M pt."
6. On Robot Sumo Night, click "Open the corrected poster" at the top of the "Block by block" report. The lab loads `robot-sumo-night-fixed` at A2 and 4.0 m and every line is green for 20/20. The date there is 2.1x larger, not 1.7x: 1.7x reaches exactly 4.0 m, which shows amber, and green needs 15% to spare. "Back to the original" returns. The corrected poster is not on the rail.
7. The 8-distance OCR runs in the browser on the uploaded file. A PDF opens with pdf.js (first page only) and then takes the same path. The engine starts loading while the page is idle, so the first upload usually skips the 4 MB wait; on a slow connection, still do one upload before recording. In the default fake mode the example posters show "Sample OCR" lines, which are hand-written samples; say so if you show them. The "Download PNG report" button sits under the "Block by block" report and works for example posters and uploads alike: `renderReportPng` in `lib/report.ts` draws the blurred poster with numbered outlines, then one row per line (distance, verdict, fix, OCR line when it applies) on a canvas in the tab, and downloads it. The deuteranopia color filter is not drawn into the image; the footer says so.
8. Click "Corridor" above the poster. The same poster hangs on a hallway wall; its height is the visual angle of the printed sheet against a 30 degree view (`apparentHeightShare` in `lib/legibility.ts`), so it shrinks as the slider moves out. Outlines and the caption "N of M lines readable at D m." come from the lab's own scores (`maxReadableDistanceM`). On Robot Sumo Night at A2, the date is green to about 2.0 m, amber to 2.4 m, and red just past it. A spring settles the size; with reduced motion it jumps. "Flat" returns. The choice is in the URL as `view=corridor`.

**Reset before a take:** `npm run demo:reset`, then open the URL it prints in a private window. There is no server state to clear; a reload resets the tab.

**Closing line:** Know before you print.

The builder records the 90-second video himself on the live URL.
