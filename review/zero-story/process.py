# Trim each cutout to its real pixels, clean faint alpha haze, shrink, save as webp into ../assets/art/.
from PIL import Image
import glob, os, json
out = '../assets/art'; os.makedirs(out, exist_ok=True)
MAX = {'tube': 900, 'table': 900, 'blotter': 1100, 'drawer': 800, 'lamp': 700, 'mic': 800, 'strongbox': 900, 'strongbox-open': 900}
info = {}
for f in sorted(glob.glob('*.png')):
    n = f[:-4]
    im = Image.open(f).convert('RGBA')
    a = im.getchannel('A').point(lambda v: 0 if v < 28 else v)
    im.putalpha(a)
    bb = a.point(lambda v: 255 if v > 60 else 0).getbbox()
    im = im.crop(bb)
    m = MAX.get(n, 640)
    im.thumbnail((m, m), Image.LANCZOS)
    im.save(f'{out}/{n}.webp', 'WEBP', quality=86, method=6)
    info[n] = [im.width, im.height, round(im.width / im.height, 3), os.path.getsize(f'{out}/{n}.webp') // 1024]
print(json.dumps(info, indent=0))
