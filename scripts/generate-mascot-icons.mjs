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
// Two source mascots after split-mascot-source.mjs:
//   - SRC_FULL → editorial full-body version (used inline + as watermark)
//   - SRC_FACE → face-only version (used as the basis for square app icons)
const SRC_FULL = path.join(ROOT, "public/mascot-source-full.png");
const SRC_FACE = path.join(ROOT, "public/mascot-source-face.png");

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
  // Full body — keeps its alpha-cut version at the original mascot path so
  // HomeShell / PickCard watermark / OG card all keep working.
  const fullBase = await softKeyWhite(SRC_FULL);
  const fullBuf = await fullBase.toBuffer();
  await writeFile(path.join(ROOT, "public/mascot-giraffe.png"), fullBuf);
  console.log("wrote public/mascot-giraffe.png (full body, transparent)");

  // Face — separate output for the inline header avatar.
  const faceBase = await softKeyWhite(SRC_FACE);
  const faceBuf = await faceBase.toBuffer();
  await writeFile(path.join(ROOT, "public/mascot-giraffe-face.png"), faceBuf);
  console.log("wrote public/mascot-giraffe-face.png (face only, transparent)");

  // App icons — face fits squares much better than the tall full body.
  const sizes = [
    { out: "src/app/icon.png", size: 512 },
    { out: "src/app/apple-icon.png", size: 180 },
    { out: "public/icons/icon-192.png", size: 192 },
    { out: "public/icons/icon-512.png", size: 512 },
  ];
  for (const { out, size } of sizes) {
    await write(
      sharp(faceBuf).resize(size, size, {
        fit: "contain",
        background: TRANSPARENT_BG,
      }),
      path.join(ROOT, out),
    );
  }

  // Maskable: 512×512 with background color, mascot scaled to ~80% safe zone.
  const safe = 410;
  const inner = await sharp(faceBuf)
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
