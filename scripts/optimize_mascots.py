"""
Optimize mascot PNGs via Pillow's adaptive palette quantization.

Safe: writes to a .tmp file, verifies it opens correctly, then atomically
replaces the original. If anything fails the original is preserved.
"""
import os
from pathlib import Path
from PIL import Image

OUT_DIR = Path(r"C:/Coding/개인포트폴리오(Persnal)/Random_Resturant/public/mascots")


def optimize(path: Path) -> tuple[int, int]:
    img = Image.open(path).convert("RGBA")
    before = path.stat().st_size

    # Quantize RGB only (256 colors), keep original alpha untouched —
    # binarizing alpha would destroy the soft mascot edges.
    alpha = img.split()[3]
    rgb_quant = (
        img.convert("RGB")
        .quantize(colors=256, method=Image.Quantize.MEDIANCUT)
        .convert("RGB")
    )
    r, g, b = rgb_quant.split()
    out = Image.merge("RGBA", (r, g, b, alpha))

    tmp = path.with_name(path.stem + ".tmp.png")
    out.save(tmp, "PNG", optimize=True)

    # Verify the temp file opens before replacing.
    Image.open(tmp).verify()
    after = tmp.stat().st_size
    if after >= before:
        # Quantization made it bigger — keep original.
        tmp.unlink()
        return before, before
    os.replace(tmp, path)
    return before, after


def main() -> None:
    files = sorted(OUT_DIR.glob("*.png"))
    total_before = 0
    total_after = 0
    for f in files:
        try:
            before, after = optimize(f)
        except Exception as e:
            print(f"  {f.name}: skipped ({e})")
            continue
        saved = before - after
        pct = (saved / before * 100) if before > 0 else 0
        total_before += before
        total_after += after
        marker = "-" if saved == 0 else "+"
        print(f"  [{marker}] {f.name}: {before/1024:.1f}KB -> {after/1024:.1f}KB ({pct:+.0f}%)")
    if total_before:
        total_pct = (total_before - total_after) / total_before * 100
        print(
            f"\nTotal: {total_before/1024:.1f}KB -> {total_after/1024:.1f}KB "
            f"(saved {total_pct:.0f}%)"
        )


if __name__ == "__main__":
    main()
