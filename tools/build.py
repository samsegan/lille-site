"""Builds the site's pictures from the originals.

    uv run --with pillow tools/build.py --src ~/scratch/lille-research

The originals (profile pictures, cover art, post pictures) are not kept in this
repo. `--src` is the folder that holds them (img/, img_ig/). The cut-out of the
portrait (img/cut_avatar.png) is made first with tools/cutout.swift:

    swiftc -O tools/cutout.swift -o /tmp/cutout
    /tmp/cutout <src>/img/sc_avatar.jpg <src>/img/cut_avatar.png 2400
"""
import argparse, pathlib, random

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--src", required=True, help="folder holding the original pictures")
SRC = pathlib.Path(ap.parse_args().src).expanduser()


def op(name, mode="RGB"):
    return Image.open(SRC / name).convert(mode)


def save(im, path, q=80):
    path.parent.mkdir(exist_ok=True)
    if path.suffix == ".webp":
        im.save(path, "WEBP", quality=q, method=6)
    else:
        im.convert("RGB").save(path, "JPEG", quality=q, optimize=True, progressive=True)
    print(f"{path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def fit_w(im, width):
    return im if im.width == width else im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def frac(im, box):
    w, h = im.size
    return im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))


def square(im):
    s = min(im.size)
    return im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))


# ---------- landing: the press portrait (LILLE's SoundCloud picture) ----------
# The original is square. For wide screens the wall is carried on to the left and
# right (each row keeps the colour of the picture's edge), so the figure stands
# in the middle of a 16:9 wall with room for the name behind.
H = 1350
W = 2400
por = fit_w(op("img/sc_avatar.jpg"), H)
cut = fit_w(Image.open(SRC / "img/cut_avatar.png").convert("RGBA"), H)
x0 = (W - H) // 2
wall = Image.new("RGB", (W, H))
left = por.crop((0, 0, 6, H)).resize((1, H), Image.BOX).filter(ImageFilter.GaussianBlur(6))
right = por.crop((H - 6, 0, H, H)).resize((1, H), Image.BOX).filter(ImageFilter.GaussianBlur(6))
wall.paste(left.resize((x0, H)), (0, 0))
wall.paste(right.resize((W - x0 - H, H)), (x0 + H, 0))
wall.paste(por, (x0, 0))
# soften the two joins
band = 90
for jx in (x0, x0 + H):
    strip = wall.crop((jx - band, 0, jx + band, H)).filter(ImageFilter.GaussianBlur(26))
    mask = Image.linear_gradient("L").rotate(90, expand=True).resize((band, H))
    m = Image.new("L", (band * 2, H))
    m.paste(mask, (0, 0)); m.paste(ImageOps.mirror(mask), (band, 0))
    wall.paste(strip, (jx - band, 0), ImageOps.invert(m) if False else m)
# the light falls off toward the far edges, as it does on the real wall
fall = Image.radial_gradient("L").resize((W * 2, round(H * 2.6))).crop((W // 2, round(H * 0.8), W // 2 + W, round(H * 0.8) + H))
shade = Image.new("RGB", (W, H), (52, 66, 66))
wall = Image.composite(shade, wall, fall.point(lambda v: max(0, v - 70) * 1.05))
# the same grain as the photograph, so the added wall is not smoother than the real one
random.seed(11)
noise = Image.effect_noise((W, H), 9).convert("RGB")
wall = ImageChops.overlay(wall, Image.blend(Image.new("RGB", (W, H), (128, 128, 128)), noise, 0.22))
wall.paste(por.crop((round(H * .26), 0, round(H * .78), H)), (x0 + round(H * .26), 0),
           Image.linear_gradient("L").rotate(90, expand=True).resize((round(H * .52), H)).point(lambda v: 255 if 18 < v < 237 else 0).filter(ImageFilter.GaussianBlur(20)))
save(wall, ROOT / "img" / "hero.jpg", 80)
board = Image.new("RGBA", (W, H), (0, 0, 0, 0))
board.paste(cut, (x0, 0))
save(board, ROOT / "img" / "hero-cut.webp", 84)

# phones: an upright crop of the original picture, and the same crop of the cut-out
PB = (0.215, 0.0, 0.795, 1.0)
big = fit_w(op("img/sc_avatar.jpg"), 1900)
save(fit_w(frac(big, PB), 1080), ROOT / "img" / "hero-m.jpg", 78)
save(fit_w(frac(fit_w(Image.open(SRC / "img/cut_avatar.png").convert("RGBA"), 1900), PB), 1080), ROOT / "img" / "hero-m-cut.webp", 82)

# ---------- menu: the black and white full-length picture ----------
bw = op("img_ig/igc_DeAZ_9siVwJ_01.jpg")
save(fit_w(frac(bw, (0.14, 0.14, 0.86, 0.86)), 1000), ROOT / "img" / "menu.jpg", 78)

# ---------- contact: the figure alone, hard black and white, on the dark screen ----------
g = ImageOps.grayscale(cut.convert("RGB"))
g = ImageOps.autocontrast(g, cutoff=(2, 6)).point(lambda v: 0 if v < 70 else min(255, round((v - 70) * 1.62)))
con = Image.merge("RGBA", (g, g, g, cut.getchannel("A")))
save(fit_w(frac(con, (0.24, 0.05, 0.80, 1.0)), 1000), ROOT / "img" / "contact.webp", 80)

# ---------- cover art ----------
covers = {
    "with-me": "img/scart_withme.jpg",
    "thats-my-bby": "img/scart_thats-my-bby.jpg",
    "everlong": "img/scart_everlong.jpg",
    "when-it-comes-to-love": "img/scart_when-it-comes-to-love-1.jpg",
}
for rid, name in covers.items():
    save(fit_w(square(op(name)), 720), ROOT / "art" / f"{rid}.jpg", 80)

# ---------- nights ----------
save(fit_w(frac(op("img_ig/igc_DbGwzZ4Fb8j_03.jpg"), (0.0, 0.10, 1.0, 0.92)), 900), ROOT / "img" / "night-brooklyn.jpg", 76)
els = op("img_ig/igc_De97beeibHn_01.jpg")
save(ImageEnhance.Brightness(fit_w(frac(els, (0.30, 0.0, 1.0, 1.0)), 900)).enhance(1.25), ROOT / "img" / "night-elsewhere.jpg", 78)
save(fit_w(frac(op("img_ig/igc_DeSGiSWid9p_01.jpg"), (0.0, 0.22, 1.0, 0.96)), 900), ROOT / "img" / "night-orlando.jpg", 76)
# the "unreleased" card uses a frame of the Elsewhere set; the Lille Vault card its own artwork
save(fit_w(square(frac(els, (0.42, 0.0, 1.0, 1.0))), 720), ROOT / "art" / "ids.jpg", 78)
save(fit_w(square(op("img/scart_old_nwtg.jpg")), 720), ROOT / "art" / "vault.jpg", 78)

# ---------- link preview picture ----------
share = fit_w(wall, 1200)
save(share.crop((0, 20, 1200, 650)), ROOT / "img" / "share.jpg", 80)
