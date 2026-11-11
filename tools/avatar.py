"""Draws the line portrait for the About screen (curls, moustache, ringer collar)
and prints it as SVG. The page carries the result inline in index.html, between
the AVATAR markers:

    python3 tools/avatar.py            # prints the SVG
    python3 tools/avatar.py --inject   # rewrites the block inside index.html
"""
import math, pathlib, random, re, sys

random.seed(5)
CX, CY = 180, 208


def spiral(cx, cy, r, turns=1.7, rot=0.0, flip=1):
    pts = []
    n = 26
    for i in range(n + 1):
        t = i / n
        a = rot + flip * t * turns * 2 * math.pi
        rr = r * (1 - 0.82 * t)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)


curls = []
# three rings of curls round the top and sides of the head, outer ring first
for ring, (rad, r, a0, a1, step) in enumerate([(98, 17, 186, 354, 13), (80, 16, 178, 362, 15), (63, 15, 176, 364, 17), (44, 14, 208, 332, 22)]):
    a = a0
    while a <= a1:
        j = math.radians(a + random.uniform(-3, 3))
        rr = rad + random.uniform(-4, 4)
        x = CX + rr * math.cos(j) * 0.98
        y = CY - 18 + rr * math.sin(j) * 0.92
        curls.append((x, y, r + random.uniform(-2, 2), random.uniform(0, 6.28), random.choice((-1, 1))))
        a += step

out = []
out.append('<svg class="avatar" id="avatar" viewBox="0 0 360 440" role="img" aria-label="A line drawing of LILLE: curls, a moustache, a ringer tee">')
out.append('<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">')
# shoulders, neck, the ringer collar (the one coloured line) and the chain
out.append('<path d="M150 296 L150 336 C122 348 60 360 42 440"/><path d="M210 296 L210 336 C238 348 300 360 318 440"/>')
out.append('<path class="collar" d="M139 341 Q180 378 221 341" stroke="var(--red)" stroke-width="7"/>')
out.append('<path d="M152 330 Q180 396 208 330" stroke-width="1.6" stroke-dasharray="1.5 4"/>')
# ears, head
out.append('<path d="M118 206 C104 204 106 236 121 236" fill="#000"/><path d="M242 206 C256 204 254 236 239 236" fill="#000"/>')
out.append('<path d="M118 205 C118 138 242 138 242 205 C242 262 214 298 180 298 C146 298 118 262 118 205Z" fill="#000"/>')
out.append('</g>')
# eyes: white, the pupils follow the pointer, a heavy lid over each
out.append('<g class="eyes"><ellipse cx="156" cy="218" rx="13" ry="9.5" fill="#fff"/><ellipse cx="204" cy="218" rx="13" ry="9.5" fill="#fff"/>')
out.append('<circle class="pupil" cx="156" cy="219" r="5.2"/><circle class="pupil" cx="204" cy="219" r="5.2"/>')
out.append('<path d="M141 213 Q156 204 171 213 L171 205 L141 205Z" fill="#000"/><path d="M189 213 Q204 204 219 213 L219 205 L189 205Z" fill="#000"/></g>')
out.append('<g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">')
out.append('<path d="M140 199 Q154 190 169 195 M191 195 Q206 190 220 199" stroke-width="4"/>')
out.append('<path d="M181 226 L176 246 L184 248" stroke-width="2"/>')
out.append('<path d="M171 275 Q180 281 189 275" stroke-width="2.4"/></g>')
out.append('<path class="tash" d="M154 264 Q166 250 180 256 Q194 250 206 264 Q193 260 180 263 Q167 260 154 264Z" fill="#fff"/>')
# the curls
out.append('<g class="curls" fill="#000" stroke="#fff" stroke-width="2" stroke-linecap="round">')
for x, y, r, rot, flip in curls:
    out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r + 2:.1f}" stroke="none"/><path d="{spiral(x, y, r, 1.7, rot, flip)}" fill="none"/>')
out.append('</g>')
# three ringlets hang over the forehead: these are the ones to pull
out.append('<g class="ringlets" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">')
for i, (x, y0, length) in enumerate([(139, 150, 34), (176, 146, 40), (216, 150, 32)]):
    pts = []
    n = 40
    for k in range(n + 1):
        t = k / n
        pts.append((x + 7.5 * math.sin(t * 3.6 * 2 * math.pi) * (0.55 + 0.45 * t), y0 + length * t))
    d = "M" + " L".join(f"{px:.1f} {py:.1f}" for px, py in pts)
    out.append(f'<g class="pull" data-i="{i}" style="transform-origin:{x}px {y0}px"><rect x="{x - 16}" y="{y0 - 4}" width="32" height="{length + 16}" fill="transparent" stroke="none"/><path d="{d}"/></g>')
out.append('</g></svg>')
svg = "\n".join(out)

if "--inject" in sys.argv:
    page = pathlib.Path(__file__).resolve().parent.parent / "index.html"
    s = page.read_text()
    s2 = re.sub(r"<!--AVATAR-->.*?<!--/AVATAR-->", lambda m: "<!--AVATAR-->\n" + svg + "\n<!--/AVATAR-->", s, flags=re.S)
    page.write_text(s2)
    print("avatar written into index.html" if s2 != s or "<!--AVATAR-->" in s else "no AVATAR markers found")
else:
    print(svg)
