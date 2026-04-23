// One-time helper that splits the combined ChatGPT mascot image into:
//   - public/mascot-source-full.png  (left half — full-body editorial mascot)
//   - public/mascot-source-face.png  (right half — face-only icon)
//
// Run: node scripts/split-mascot-source.mjs <path-to-source.png>
// Both outputs keep their white background; soft-key happens later in
// generate-mascot-icons.mjs.

import sharp from "sharp";
import path from "node:path";

const ROOT = process.cwd();
const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node split-mascot-source.mjs <source.png>");
  process.exit(1);
}

async function main() {
  const meta = await sharp(SRC).metadata();
  const W = meta.width;
  const H = meta.height;
  // Source is ~1536×1024 with the two mascots roughly split at x≈760.
  // Crop boxes are intentionally generous so soft-key + autoCrop later
  // shave the whitespace.
  const splitX = Math.round(W * 0.50);

  // Full body — left half, with a small left padding to avoid clipping.
  await sharp(SRC)
    .extract({ left: 0, top: 0, width: splitX, height: H })
    .toFile(path.join(ROOT, "public/mascot-source-full.png"));

  // Face — right half.
  await sharp(SRC)
    .extract({ left: splitX, top: 0, width: W - splitX, height: H })
    .toFile(path.join(ROOT, "public/mascot-source-face.png"));

  console.log("wrote public/mascot-source-full.png + face.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
