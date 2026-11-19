# Rodada 13 do site: tira o ruído dos mapas de luz do bake e grava em 8 bits (sRGB, WebP) pro site.
# Duas passadas, o mesmo arquivo:
#   1) blender.exe -b --python bake_site_pos.py      -> lê luz_site/*.exr e grava luz_site/*.npy (float, linha 0 = topo)
#   2) python bake_site_pos.py [--suave 1.6]          -> borra de leve, escolhe a escala, grava *.webp e prévia *.png
# A "escala" (o valor de luz que vira branco) vai pro mapa.json; o site multiplica de volta.
import json, os, sys
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__)); PASTA = os.path.join(AQUI, 'luz_site')
NOMES = ('paredes', 'piso')

try:
    import bpy
except ImportError:
    bpy = None

if bpy:
    for n in NOMES:
        img = bpy.data.images.load(os.path.join(PASTA, n + '.exr'))
        w, h = img.size
        a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1, :, :3]
        np.save(os.path.join(PASTA, n + '.npy'), a)
        print(n, a.shape, float(a.max()))
    print('FIM')
    raise SystemExit

from PIL import Image
SUAVE = float(sys.argv[sys.argv.index('--suave') + 1]) if '--suave' in sys.argv else 1.6
QUALIDADE = int(sys.argv[sys.argv.index('--q') + 1]) if '--q' in sys.argv else 82

def borrar(a, sig):
    if sig <= 0: return a
    r = int(sig * 3); x = np.arange(-r, r + 1); k = np.exp(-x * x / (2 * sig * sig)); k /= k.sum()
    p = np.pad(a, ((r, r), (r, r), (0, 0)), mode='edge')
    t = sum(k[i] * p[i:i + a.shape[0], :, :] for i in range(2 * r + 1))
    return sum(k[i] * t[:, i:i + a.shape[1], :] for i in range(2 * r + 1))

mapas = {n: borrar(np.load(os.path.join(PASTA, n + '.npy')), SUAVE) for n in NOMES}
tudo = np.concatenate([m[m.max(axis=2) > 1e-5].ravel() for m in mapas.values()])
pct = {p: float(np.percentile(tudo, p)) for p in (5, 25, 50, 75, 95, 99, 99.5, 99.9)}
escala = float(np.percentile(tudo, 99.7)) * 1.15
print('luz (difusa, linear):', {k: round(v, 4) for k, v in pct.items()}, 'max', round(float(tudo.max()), 3), '-> escala', round(escala, 4))
for n, m in mapas.items():
    v = np.clip(m / escala, 0, 1)
    v = np.where(v <= .0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - .055)  # sRGB: mais degraus no escuro
    im = Image.fromarray((v * 255 + .5).astype(np.uint8), 'RGB')
    im.save(os.path.join(PASTA, n + '.webp'), quality=QUALIDADE, method=6)
    im.save(os.path.join(PASTA, n + '-previa.png'))
    print(f'  {n}.webp {os.path.getsize(os.path.join(PASTA, n + ".webp")) // 1024} KB')
mp = os.path.join(PASTA, 'mapa.json'); M = json.load(open(mp, encoding='utf-8'))
M['escala'] = round(escala, 5); M['suave'] = SUAVE; M['percentis'] = {str(k): round(v, 5) for k, v in pct.items()}
json.dump(M, open(mp, 'w', encoding='utf-8'), indent=1)
print('FIM')
