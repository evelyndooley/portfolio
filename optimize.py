#!/usr/bin/env python3
"""Optimize images for web — resize + convert to WebP.

Usage:  python3 optimize.py
Re-run any time you add new images to assets/slider/.
"""

from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
MAX_DIMENSION = 2400      # longest side in pixels
WEBP_QUALITY = 82         # 0-100; 80-85 is the sweet spot for photos

# (input glob, output dir)
JOBS = [
    (ROOT / "assets" / "slider", ROOT / "assets" / "slider-web", "*.jpg"),
    (ROOT / "assets",            ROOT / "assets" / "web",        "*.jpg"),
    (ROOT / "assets",            ROOT / "assets" / "web",        "*.png"),
]

# only optimize these specific files at the assets/ root (skip the slider folder
# files which are handled by the slider job)
ASSETS_ROOT_ALLOWLIST = {
    "20251026_19303021.jpg",   # about panel
    "20260412_122208.jpg",     # contact panel
    "ebelogo white.png",
    "ebelogo.png",
}


def needs_update(src: Path, dst: Path) -> bool:
    if not dst.exists():
        return True
    return src.stat().st_mtime > dst.stat().st_mtime


def optimize(src: Path, dst: Path) -> tuple[int, int]:
    """Resize + convert to WebP. Returns (src_size, dst_size) in bytes."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)  # apply EXIF rotation
        # resize to fit within MAX_DIMENSION on the longest side
        if max(im.size) > MAX_DIMENSION:
            im.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
        save_kwargs = {"quality": WEBP_QUALITY, "method": 6}
        if im.mode == "RGBA":
            im.save(dst, "WEBP", lossless=False, **save_kwargs)
        else:
            im.convert("RGB").save(dst, "WEBP", **save_kwargs)
    return src.stat().st_size, dst.stat().st_size


def main() -> None:
    total_in = 0
    total_out = 0
    processed = 0
    skipped = 0

    for src_dir, dst_dir, pattern in JOBS:
        if not src_dir.exists():
            print(f"skip (missing): {src_dir}")
            continue

        for src in sorted(src_dir.glob(pattern)):
            # for jobs at the assets/ root, only handle allowlisted files
            if src.parent == ROOT / "assets" and src.name not in ASSETS_ROOT_ALLOWLIST:
                continue
            # Windows alternate-data-stream metadata files
            if ":" in src.name:
                continue

            dst = dst_dir / (src.stem + ".webp")
            if not needs_update(src, dst):
                skipped += 1
                continue

            try:
                in_sz, out_sz = optimize(src, dst)
            except Exception as e:
                print(f"  ERROR  {src.name}: {e}")
                continue

            total_in += in_sz
            total_out += out_sz
            processed += 1
            print(f"  {src.name}  {in_sz/1024:.0f}K -> {out_sz/1024:.0f}K  "
                  f"({100 * out_sz / in_sz:.0f}%)")

    print()
    print(f"processed: {processed}  skipped: {skipped}")
    if processed:
        print(f"total: {total_in/1_000_000:.1f}MB -> {total_out/1_000_000:.1f}MB "
              f"({100 * total_out / total_in:.0f}%)")


if __name__ == "__main__":
    main()
