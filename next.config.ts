import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

// Uploaded brand images (public/brand/*.png) are listed once, at build time, so that
// components can choose between an uploaded image and its SVG fallback without touching
// the file system at request time (public/ is not readable inside a serverless function).
const brandDir = path.join(process.cwd(), "public", "brand");
const brandFiles = fs.existsSync(brandDir)
  ? fs
      .readdirSync(brandDir)
      .filter((f) => f.endsWith(".png"))
      .map((f) => f.slice(0, -4))
  : [];

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BRAND_FILES: brandFiles.join(",") },
  // pdfjs-dist (PDF upload, lib/pdf.ts) has an optional Node-only `canvas` dependency.
  // Telora renders PDFs in the browser only, so the bundler is told to skip it.
  webpack: (config: { resolve?: { alias?: Record<string, unknown> } }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = { ...(config.resolve.alias ?? {}), canvas: false };
    return config;
  },
};

export default nextConfig;
