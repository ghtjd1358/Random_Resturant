"""
Crop 8 mascot variants and remove background via rembg (U2Net).
Threshold version was lossy on dark character parts (black hanbok, spots).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from rembg import remove, new_session

SRC = Path(r"C:/Users/hoseo/Downloads/ChatGPT Image 2026년 4월 24일 오후 11_01_59.png")
OUT_DIR = Path(r"C:/Coding/개인포트폴리오(Persnal)/Random_Resturant/public/mascots")
OUT_DIR.mkdir(parents=True, exist_ok=True)

NAMES = [
    "01-brush-stand",
    "02-brush-desk",
    "03-book-read",
    "04-brush-wink",
    "05-meditate",
    "06-lantern",
    "07-scroll-fortune",
    "08-butterfly",
]


def trim_to_content(img: Image.Image, pad: int = 14) -> Image.Image:
    arr = np.array(img)
    alpha = arr[..., 3]
    mask = alpha > 8
    if not mask.any():
        return img
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    y0, y1 = max(0, rows[0] - pad), min(arr.shape[0], rows[-1] + pad + 1)
    x0, x1 = max(0, cols[0] - pad), min(arr.shape[1], cols[-1] + pad + 1)
    return img.crop((x0, y0, x1, y1))


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    arr = np.array(src)
    H, W = arr.shape[:2]
    cw, ch = W // 4, H // 2

    # isnet-general-use is the best general model in rembg, sharp on
    # illustrated characters with fine details.
    session = new_session("isnet-general-use")

    for i, name in enumerate(NAMES):
        col = i % 4
        row = i // 4
        x0, y0 = col * cw, row * ch
        x1, y1 = x0 + cw, y0 + ch
        cell = Image.fromarray(arr[y0:y1, x0:x1])

        # rembg returns RGBA. Process per-cell so the model focuses on
        # one character at a time (cleaner masks than running on the
        # full grid).
        cut = remove(cell, session=session)
        if not isinstance(cut, Image.Image):
            cut = Image.fromarray(np.array(cut))
        cut = cut.convert("RGBA")
        cut = trim_to_content(cut, pad=18)

        out = OUT_DIR / f"{name}.png"
        cut.save(out, optimize=True)
        print(f"  {name}: {cut.size} -> {out.relative_to(OUT_DIR.parent.parent)}")


if __name__ == "__main__":
    main()
