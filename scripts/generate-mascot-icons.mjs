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
// Face had a faint icon-frame ring around it from the source image. Soft-key
// alone left low-alpha ghost pixels along that ring. Round 4 keeps the
// soft-key window narrow (preserves anti-aliased line edges) and adds a
// hard alpha cutoff to delete the ghost ring entirely.
const FACE_LOW = 215;
const FACE_HIGH = 248;
const FACE_ALPHA_CUTOFF = 180;

// `alphaCutoff` lets us binarize the tail of the soft-key gradient. The
// face source ships with a faint gray icon-frame ring whose pixels survive
// the soft-key as low-alpha ghosts; any pixel below this threshold gets
// snapped to fully transparent so no halo is visible at display time.
async function softKeyWhite(inputPath, { low = LOW, high = HIGH, alphaCutoff = 0 } = {}) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const min = Math.min(r, g, b);
    if (min >= high) {
      data[i + 3] = 0;
    } else if (min >= low) {
      const t = (high - min) / (high - low); // 1 at low, 0 at high
      data[i + 3] = Math.round(255 * t);
    }
    if (alphaCutoff > 0 && data[i + 3] < alphaCutoff) {
      data[i + 3] = 0;
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
  // After soft-keying the icon-frame white, trim() crops the remaining
  // transparent padding so the face sits tight in its box. A higher
  // threshold (35 vs default 10) eats the faint gray ring left behind by
  // the source image's icon frame.
  const faceBase = await softKeyWhite(SRC_FACE, {
    low: FACE_LOW,
    high: FACE_HIGH,
    alphaCutoff: FACE_ALPHA_CUTOFF,
  });
  const faceRaw = await faceBase.toBuffer();
  const faceBuf = await sharp(faceRaw).trim().toBuffer();
  await writeFile(path.join(ROOT, "public/mascot-giraffe-face.png"), faceBuf);
  console.log("wrote public/mascot-giraffe-face.png (face, trimmed, transparent)");

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
