// Seed posters for Telora. Each poster is real, renderable content: the tool draws it
// as live JSX, scores every text block with lib/legibility.ts and blurs it to the
// chosen viewing distance. Geometry is relative to the poster, so printing the same
// file at A3 or A1 changes the physical letter size exactly like a real print would.
//
// Deterministic on purpose: fixed ids, fixed `updated` dates, no clock and no randomness,
// so scripts/seed.ts writes the same bytes on every run.

import type { PaperSize, PosterRecord, Tone, VisionProfile } from "../types";

export const VISION_PROFILES: VisionProfile[] = [
  { id: "2020", label: "20/20", note: "Typical corrected vision", acuityFactor: 1, contrastSensitivity: 1, deutan: false },
  { id: "2040", label: "20/40", note: "Driving-licence limit in many countries", acuityFactor: 2, contrastSensitivity: 1, deutan: false },
  { id: "lowcontrast", label: "Low contrast", note: "Reduced contrast sensitivity, early cataract", acuityFactor: 1.25, contrastSensitivity: 1.8, deutan: false },
  { id: "deutan", label: "Deuteranopia", note: "Green-blind, about 1 in 100 men", acuityFactor: 1, contrastSensitivity: 1, deutan: true },
];

export const PAPER_SIZES: PaperSize[] = ["A3", "A2", "A1", "A0"];

const INK_ON_GROUND = { contrast: 16.2, deutanContrast: 16.0 };
const ACCENT_ON_GROUND = { contrast: 5.0, deutanContrast: 4.6 };
const GROUND_ON_ACCENT = { contrast: 5.0, deutanContrast: 4.6 };
const PEACH_ON_GROUND = { contrast: 1.95, deutanContrast: 1.9 };
const INK_ON_SURFACE = { contrast: 14.9, deutanContrast: 14.7 };

export const POSTERS: PosterRecord[] = [
  {
    id: "robot-sumo-night",
    title: "Robot Sumo Night",
    kind: "Club event",
    owner: "Robotics Society",
    hangingSpot: "Engineering block, ground-floor corridor",
    intendedSize: "A2",
    intendedDistanceM: 4,
    background: "ground",
    updated: "2026-11-21",
    blocks: [
      { id: "rs-title", label: "Headline", role: "title", text: "ROBOT SUMO NIGHT", x: 8, y: 9, w: 84, capHeightPct: 3.53, weight: 900, align: "left", tone: "ink", ...INK_ON_GROUND },
      { id: "rs-date", label: "Event date", role: "date", text: "Thursday 3 December, 18:30", x: 8, y: 30, w: 70, capHeightPct: 0.94, weight: 700, align: "left", tone: "ink", ...INK_ON_GROUND },
      { id: "rs-venue", label: "Venue", role: "venue", text: "Lab Z-14, Engineering Block", x: 8, y: 36, w: 70, capHeightPct: 0.8, weight: 500, align: "left", tone: "accent", ...ACCENT_ON_GROUND },
      { id: "rs-body", label: "Pitch", role: "body", text: "Bring a bot under 3 kg or come cheer for one. Pizza after the final round.", x: 8, y: 52, w: 62, capHeightPct: 0.6, weight: 400, align: "left", tone: "ink", ...INK_ON_GROUND },
      { id: "rs-qr", label: "QR caption", role: "caption", text: "Scan to RSVP, 40 seats", x: 62, y: 88, w: 30, capHeightPct: 0.43, weight: 500, align: "left", tone: "ink", ...INK_ON_GROUND },
    ],
  },
  {
    id: "microplastics-tap-water",
    title: "Microplastics in Campus Tap Water",
    kind: "Science fair",
    owner: "Maya Okafor, Environmental Science",
    hangingSpot: "Sports hall, fair row C",
    intendedSize: "A1",
    intendedDistanceM: 3,
    background: "ground",
    updated: "2026-11-19",
    blocks: [
      { id: "mp-title", label: "Headline", role: "title", text: "Microplastics in Campus Tap Water", x: 7, y: 6, w: 86, capHeightPct: 2.4, weight: 900, align: "left", tone: "ink", ...INK_ON_GROUND },
      { id: "mp-results", label: "Results banner", role: "banner", text: "RESULTS", x: 7, y: 40, w: 40, capHeightPct: 2.2, weight: 900, align: "left", tone: "bad", backdrop: "ok", contrast: 3.4, deutanContrast: 1.08 },
      { id: "mp-method", label: "Method paragraph", role: "body", text: "12 taps, 3 buildings, 1 L samples filtered at 20 µm and counted under a stereo microscope.", x: 7, y: 26, w: 80, capHeightPct: 0.5, weight: 400, align: "left", tone: "ink", ...INK_ON_GROUND },
      { id: "mp-axis", label: "Chart axis labels", role: "caption", text: "Particles per litre, by building", x: 7, y: 70, w: 60, capHeightPct: 0.32, weight: 500, align: "left", tone: "ink", backdrop: "surface", ...INK_ON_SURFACE },
      { id: "mp-byline", label: "Author line", role: "byline", text: "Maya Okafor, supervised by Dr. Lena Brandt", x: 7, y: 90, w: 70, capHeightPct: 0.7, weight: 500, align: "left", tone: "accent", ...ACCENT_ON_GROUND },
    ],
  },
  {
    id: "sleep-debt-recall",
    title: "Sleep Debt and Exam Recall in First-Year Students",
    kind: "Academic",
    owner: "Cognition Lab, Department of Psychology",
    hangingSpot: "Conference foyer, board 17",
    intendedSize: "A0",
    intendedDistanceM: 2.5,
    background: "ground",
    updated: "2026-11-23",
    blocks: [
      { id: "sd-band", label: "Title band", role: "banner", text: "Sleep Debt and Exam Recall in First-Year Students", x: 5, y: 4, w: 90, capHeightPct: 1.6, weight: 900, align: "center", tone: "onAccent", backdrop: "accent", ...GROUND_ON_ACCENT },
      { id: "sd-authors", label: "Authors", role: "byline", text: "J. Park, A. Mensah, R. Duarte", x: 5, y: 15, w: 90, capHeightPct: 0.7, weight: 500, align: "center", tone: "ink", ...INK_ON_GROUND },
      { id: "sd-finding", label: "Key finding", role: "body", text: "Each hour of lost sleep cut next-day recall by 9 percent (n = 214).", x: 8, y: 30, w: 84, capHeightPct: 1.1, weight: 700, align: "left", tone: "ink", ...INK_ON_GROUND },
      { id: "sd-abstract", label: "Abstract", role: "body", text: "Students logged sleep with wrist trackers for 21 days before finals and took a 40-item recall test each morning.", x: 8, y: 46, w: 84, capHeightPct: 0.38, weight: 400, align: "left", tone: "ink", ...INK_ON_GROUND },
      { id: "sd-fig", label: "Figure caption", role: "caption", text: "Fig. 2: recall score against hours slept, shaded band is the 95% interval", x: 8, y: 80, w: 84, capHeightPct: 0.28, weight: 400, align: "left", tone: "second", ...PEACH_ON_GROUND },
    ],
  },
  {
    id: "silent-film-piano",
    title: "Silent Film Night with Live Piano",
    kind: "Society screening",
    owner: "Film Society",
    hangingSpot: "Library stairwell, landing 2",
    intendedSize: "A3",
    intendedDistanceM: 2,
    background: "surface",
    updated: "2026-11-17",
    blocks: [
      { id: "sf-title", label: "Headline", role: "title", text: "Silent Film Night", x: 10, y: 14, w: 80, capHeightPct: 4.2, weight: 900, align: "center", tone: "accent", ...ACCENT_ON_GROUND },
      { id: "sf-sub", label: "Subtitle", role: "venue", text: "with live piano by the Music Society", x: 10, y: 34, w: 80, capHeightPct: 1.3, weight: 500, align: "center", tone: "ink", ...INK_ON_SURFACE },
      { id: "sf-date", label: "Event date", role: "date", text: "Friday 11 December, 20:00, Hall B", x: 10, y: 62, w: 80, capHeightPct: 1.0, weight: 700, align: "center", tone: "ink", ...INK_ON_SURFACE },
      { id: "sf-price", label: "Ticket note", role: "caption", text: "Free for members, 2 euros at the door", x: 10, y: 84, w: 80, capHeightPct: 0.55, weight: 400, align: "center", tone: "second", contrast: 1.8, deutanContrast: 1.75 },
    ],
  },
];

/** Palette tone to CSS variable; the only place poster colors resolve. */
export const TONE_VAR: Record<Tone, string> = {
  ink: "var(--t-ink)",
  ground: "var(--t-ground)",
  surface: "var(--t-surface)",
  deep: "var(--t-deep)",
  accent: "var(--t-accent)",
  onAccent: "var(--t-on-accent)",
  second: "var(--t-second)",
  ok: "var(--t-ok)",
  bad: "var(--t-bad)",
};
