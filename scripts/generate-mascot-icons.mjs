// Generates transparent mascot + size variants (favicon, apple-icon, PWA).
// Run from repo root: `node scripts/generate-mascot-icons.mjs`
//
// Strategy for white-background removal:
//   - Pixels where min(R,G,B) >= HIGH become fully transparent.
//   - Pixels in [LOW, HIGH) are soft-keyed: alpha fades linearly, which
//     preserves anti-aliased edges and avoids a hard halo around the art.
//   - Pixels below LOW keep full opacity.
// Tune LOW/HIGH if the cutout shows fringing (raise LOW) or chews into
// the artwork (lower HIGH).

import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public/mascot-giraffe.png");

const LOW = 235;
const HIGH = 252;

async function softKeyWhite(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const min = Math.min(r, g, b);
    if (min >= HIGH) {
      data[i + 3] = 0;
    } else if (min >= LOW) {
      const t = (HIGH - min) / (HIGH - LOW); // 1 at LOW, 0 at HIGH
      data[i + 3] = Math.round(255 * t);
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png({ compressionLevel: 9 });
}

async function write(pipeline, outPath) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await pipeline.toFile(outPath);
  console.log("wrote", path.relative(ROOT, outPath));
}

const TRANSPARENT_BG = { r: 0, g: 0, b: 0, alpha: 0 };
const MASKABLE_BG = { r: 245, g: 239, b: 230, alpha: 1 }; // #F5EFE6 (background_color)

async function main() {
  const base = await softKeyWhite(SRC);
  const baseBuf = await base.toBuffer();

  // Overwrite source with transparent version so HomeShell gets it too.
  await writeFile(SRC, baseBuf);
  console.log("overwrote", path.relative(ROOT, SRC), "with transparent version");

  // Contain-fit onto transparent canvas for each target size.
  const sizes = [
    { out: "src/app/icon.png", size: 512 },
    { out: "src/app/apple-icon.png", size: 180 },
    { out: "public/icons/icon-192.png", size: 192 },
    { out: "public/icons/icon-512.png", size: 512 },
  ];
  for (const { out, size } of sizes) {
    await write(
      sharp(baseBuf).resize(size, size, {
        fit: "contain",
        background: TRANSPARENT_BG,
      }),
      path.join(ROOT, out),
    );
  }

  // Maskable: 512×512 with background color, mascot scaled to ~80% safe zone.
  const safe = 410; // 512 * 0.8
  const inner = await sharp(baseBuf)
    .resize(safe, safe, { fit: "contain", background: TRANSPARENT_BG })
    .toBuffer();
  await write(
    sharp({
      create: { width: 512, height: 512, channels: 4, background: MASKABLE_BG },
    })
      .composite([{ input: inner, gravity: "center" }])
      .png({ compressionLevel: 9 }),
    path.join(ROOT, "public/icons/maskable-512.png"),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
