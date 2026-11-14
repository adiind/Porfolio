# Round 2 pieces: trim, make the felt tile seamless, and print the measurements the CSS needs.
from PIL import Image, ImageEnhance
import numpy as np, os

out = '../assets/art'


def load(n):
    im = Image.open(f'{n}.png').convert('RGBA')
    a = np.asarray(im).copy()
    a[..., 3] = np.where(a[..., 3] < 40, 0, a[..., 3])
    return a


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def save(a, n, maxdim=640, q=86):
    im = Image.fromarray(a)
    im.thumbnail((maxdim, maxdim), Image.LANCZOS)
    im.save(f'{out}/{n}.webp', 'WEBP', quality=q, method=6)
    print(n, im.size, round(im.width / im.height, 3), os.path.getsize(f'{out}/{n}.webp') // 1024, 'KB')
    return im


# Felt: opaque. Mirror a centre crop 2x2 so the tile edges always match, then darken to the page's green.
if os.path.exists('felt.png'):
    f = Image.open('felt.png').convert('RGB')
    w, h = f.size
    c = f.crop((w // 4, h // 4, w // 4 + 512, h // 4 + 512))
    tile = Image.new('RGB', (1024, 1024))
    tile.paste(c, (0, 0)); tile.paste(c.transpose(Image.FLIP_LEFT_RIGHT), (512, 0))
    tile.paste(c.transpose(Image.FLIP_TOP_BOTTOM), (0, 512)); tile.paste(c.transpose(Image.ROTATE_180), (512, 512))
    arr = np.asarray(tile).astype(float)
    mean = arr.reshape(-1, 3).mean(0)
    target = np.array([17, 33, 26.0])
    arr = (arr - mean) * 1.15 + target          # keep the fibre detail, land on the page colour
    tile = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))
    tile.save(f'{out}/felt.webp', 'WEBP', quality=78, method=6)
    print('felt', tile.size, 'was mean', mean.round(), os.path.getsize(f'{out}/felt.webp') // 1024, 'KB')

# Pipe and cord: keep only the band, and only the middle of its length.
for n in ('pipe', 'cord'):
    if not os.path.exists(f'{n}.png'):
        continue
    a = load(n)
    rows = (a[..., 3] > 120).mean(1)
    ys = np.nonzero(rows > 0.6)[0]
    y0, y1 = ys.min(), ys.max() + 1
    w = a.shape[1]
    band = a[y0:y1, int(w * 0.12):int(w * 0.88)]
    band[..., 3] = np.where(band[..., 3] > 120, 255, band[..., 3])
    save(band, n, 900)

for n in ('station', 'capsule', 'frame', 'hoop', 'bezel', 'plate', 'ruler'):
    if not os.path.exists(f'{n}.png'):
        continue
    a = load(n)
    x0, y0, x1, y1 = bbox(a[..., 3] > 60)
    a = a[y0:y1, x0:x1]
    H, W = a.shape[:2]
    al = a[..., 3]
    if n == 'station':
        # the pipe stubs are the only solid pixels in the far left columns
        col = al[:, :max(4, W // 30)].max(1) > 120
        ys = np.nonzero(col)[0]
        print('  station stub centre y %', round((ys.min() + ys.max()) / 2 / H * 100, 1), 'stub height %', round((ys.max() - ys.min()) / H * 100, 1))
    if n in ('frame', 'hoop'):
        row = al[H // 2] > 120
        xs = np.nonzero(row)[0]
        # thickness of the ring on the left side
        t = 0
        while t < W and row[xs.min() + t]:
            t += 1
        print(f'  {n} ring thickness % of width', round(t / W * 100, 1), '-> centre line radius share', round((W / 2 - t / 2) / W, 3), 'opening share', round((W - 2 * t) / W, 3))
    if n == 'bezel':
        lum = a[..., :3].mean(2)
        dark = (lum < 45) & (al > 200)
        xs0, ys0, xs1, ys1 = bbox(dark)
        print('  bezel window % x', round(xs0 / W * 100, 1), round(xs1 / W * 100, 1), 'y', round(ys0 / H * 100, 1), round(ys1 / H * 100, 1))
    save(a, n, 900 if n in ('hoop', 'ruler') else 640)
