# Stitch the six app.html screenshots of one round into two review grids.
#   python3 work/grid.py <prefix> <family>     e.g.  python3 work/grid.py r3 desert
# Reads <prefix>-<family>-<faction>-<variation>-*.png from the browser tool's
# screenshot folder; writes work/v2/<family>-<prefix>-grid.png (whole window)
# and work/v2/<family>-<prefix>-accents.png (enlarged document area).
import glob, os, sys
from PIL import Image, ImageDraw

SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'screenshots') + '/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v2') + '/'
ORDER = [(f, v) for f in ('dark', 'light') for v in ('subtle', 'pigment', 'juicy')]

def grid(prefix, family, box, scale, name):
    tiles = []
    for f, v in ORDER:
        path = sorted(glob.glob(f'{SHOTS}{prefix}-{family}-{f}-{v}-*.png'))[-1]
        im = Image.open(path).convert('RGB').crop(box)
        tiles.append((f'{family} {f} {v}', im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)))
    w, h = tiles[0][1].size
    pad, top = 12, 26
    g = Image.new('RGB', (3 * w + 4 * pad, 2 * (h + top) + 3 * pad), (40, 40, 40))
    d = ImageDraw.Draw(g)
    for i, (label, im) in enumerate(tiles):
        x, y = pad + (i % 3) * (w + pad), pad + (i // 3) * (h + top + pad)
        d.text((x, y + 6), label, fill=(235, 235, 235))
        g.paste(im, (x, y + top))
    out = f'{OUT}{family}-{prefix}-{name}.png'
    g.save(out)
    print(out, g.size)

prefix, family = sys.argv[1], sys.argv[2]
grid(prefix, family, (18, 150, 1460, 1000), 0.55, 'grid')
grid(prefix, family, (380, 240, 1160, 840), 0.8, 'accents')
