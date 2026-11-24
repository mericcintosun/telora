// npm run proof: runs the checks that need no browser and writes their results into
// README.md between <!-- PROOF:BEGIN name --> and <!-- PROOF:END name --> markers.
// Prints one summary line per proof, never throws for a missing tool, always exits 0,
// and writes only README.md inside the repo. Relative imports so tsx needs no path alias.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VISION_PROFILES } from "../lib/data/seed";
import { PAPER_MM, formatMeters, maxReadableDistanceM } from "../lib/legibility";
import type { PaperSize, PosterBlock } from "../lib/types";

const ROOT = process.cwd();
const README = join(ROOT, "README.md");
const TEST_TIMEOUT_MS = 90_000;

type ProofResult = { name: string; body: string; summary: string };

function proofTests(): ProofResult {
  const dir = join(ROOT, "tests");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".test.ts")).map((f) => join("tests", f)) : [];
  if (files.length === 0) {
    return { name: "tests", body: "Not run: no files match `tests/*.test.ts`.", summary: "tests: no test files found" };
  }
  const run = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-reporter=tap", ...files], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: TEST_TIMEOUT_MS,
  });
  if (run.error) {
    return {
      name: "tests",
      body: "Not run: the test runner could not start on this machine. Run `npm test` by hand.",
      summary: "tests: runner could not start",
    };
  }
  const out = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
  const pass = /^# pass (\d+)/m.exec(out)?.[1];
  const fail = /^# fail (\d+)/m.exec(out)?.[1];
  if (pass === undefined || fail === undefined) {
    return {
      name: "tests",
      body: "Not run to the end: the runner printed no pass and fail counts. Run `npm test` by hand.",
      summary: "tests: no counts in runner output",
    };
  }
  const line = `${pass} passed, ${fail} failed (${files.length} file${files.length === 1 ? "" : "s"}, node:test through tsx, written by \`npm run proof\`).`;
  return { name: "tests", body: `Tests: ${line}`, summary: `tests: ${pass} passed, ${fail} failed` };
}

function proofCalibration(): ProofResult {
  const profile = VISION_PROFILES.find((p) => p.id === "2020") ?? VISION_PROFILES[0];
  // 20 pt type: cap height = 20 pt * 0.3528 mm/pt * 0.7 cap-to-em.
  const capMm = 20 * 0.3528 * 0.7;
  const ncStateM = 2.13;
  const sizes: PaperSize[] = ["A3", "A2", "A1", "A0"];
  const rows = sizes.map((size) => {
    const block: PosterBlock = {
      id: "calibration-20pt",
      label: "20 pt line",
      role: "body",
      text: "20 pt",
      x: 0,
      y: 0,
      w: 100,
      capHeightPct: (capMm / PAPER_MM[size].h) * 100,
      weight: 400,
      align: "left",
      tone: "ink",
      contrast: 16,
      deutanContrast: 16,
    };
    const m = maxReadableDistanceM(block, size, profile);
    return { size, m };
  });
  const table = [
    "| Paper | 20 pt cap height | Model distance (20/20) | NC State table |",
    "| --- | --- | --- | --- |",
    ...rows.map((r) => `| ${r.size} | ${capMm.toFixed(1)} mm | ${formatMeters(r.m)} (${r.m.toFixed(2)} m) | about 7 ft (${ncStateM} m) |`),
  ].join("\n");
  const worst = Math.max(...rows.map((r) => Math.abs(r.m - ncStateM)));
  return {
    name: "calibration",
    body: `Computed with \`lib/legibility.ts\` by \`npm run proof\`.\n\n${table}`,
    summary: `calibration: 20 pt reads to ${rows[0].m.toFixed(2)} m, NC State says ${ncStateM} m (max gap ${worst.toFixed(2)} m)`,
  };
}

function proofOcr(): ProofResult {
  return {
    name: "ocr",
    body: "Not run in this build: the 8-distance OCR needs a browser and this runner has none.",
    summary: "ocr: not run (needs a browser)",
  };
}

function safe(name: string, fn: () => ProofResult): ProofResult {
  try {
    return fn();
  } catch {
    return { name, body: `Not run: the ${name} proof failed to compute. Run it by hand.`, summary: `${name}: failed to compute` };
  }
}

function writeBlocks(results: ProofResult[]): string {
  if (!existsSync(README)) return "readme: README.md not found, nothing written";
  let text = readFileSync(README, "utf8");
  const missing: string[] = [];
  for (const r of results) {
    const re = new RegExp(`(<!-- PROOF:BEGIN ${r.name} -->)[\\s\\S]*?(<!-- PROOF:END ${r.name} -->)`);
    if (!re.test(text)) {
      missing.push(r.name);
      continue;
    }
    text = text.replace(re, (_m, begin: string, end: string) => `${begin}\n${r.body}\n${end}`);
  }
  writeFileSync(README, text, "utf8");
  return missing.length ? `readme: markers missing for ${missing.join(", ")}` : `readme: ${results.length} blocks rewritten`;
}

try {
  const results = [safe("tests", proofTests), safe("calibration", proofCalibration), safe("ocr", proofOcr)];
  for (const r of results) console.log(r.summary);
  let readme: string;
  try {
    readme = writeBlocks(results);
  } catch {
    readme = "readme: could not write README.md";
  }
  console.log(readme);
} catch {
  console.log("proof: stopped early, see the lines above");
}
process.exitCode = 0;
