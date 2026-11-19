# Site, rodada 15: junta as passadas do bake_texturas.py em ladrilhos que emendam sem costura e grava WebP.
#   1) blender.exe -b --python bake_texturas_pos.py   -> lê luz_site/tex/*.exr, grava *.npy (linha 0 = topo)
#   2) python bake_texturas_pos.py                    -> mistura, grava luz_site/tex/{parede,piso,piso_rug}.webp
# A cor sai como albedo de verdade em sRGB (o site decodifica pra linear e multiplica pela luz do bake).
import json, os, glob
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__)); PASTA = os.path.join(AQUI, 'luz_site', 'tex')
try:
    import bpy
except ImportError:
    bpy = None

if bpy:
    for f in glob.glob(os.path.join(PASTA, '*.exr')):
        img = bpy.data.images.load(f); w, h = img.size
        a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1, :, :3]
        np.save(f[:-4] + '.npy', a); print(os.path.basename(f), a.shape, round(float(a.mean()), 4))
    raise SystemExit

from PIL import Image
L = lambda n: np.load(os.path.join(PASTA, n + '.npy'))

def srgb(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= .0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - .055)

def gravar(a, nome, q=86):
    im = Image.fromarray((srgb(a) * 255 + .5).astype(np.uint8), 'RGB')
    im.save(os.path.join(PASTA, nome + '.webp'), quality=q, method=6)
    im.save(os.path.join(PASTA, nome + '-previa.png'))
    print(f'  {nome}.webp {os.path.getsize(os.path.join(PASTA, nome + ".webp")) // 1024} KB  média {a.mean():.4f}')

# parede: peso t = u/P na horizontal (linha 0 é o topo; a coluna 0 é u = 0)
A, B = L('parede_a'), L('parede_b')
t = np.linspace(0, 1, A.shape[1], endpoint=False)[None, :, None]
gravar((1 - t) * A + t * B, 'parede')

# piso: bilinear nas duas direções (v cresce pra cima na imagem: linha 0 = v máximo)
def piso(pref):
    aa, ba, ab, bb = (L(pref + k) for k in ('aa', 'ba', 'ab', 'bb'))
    h, w = aa.shape[:2]
    tu = np.linspace(0, 1, w, endpoint=False)[None, :, None]
    tv = np.linspace(1, 0, h, endpoint=False)[:, None, None]   # linha 0 = topo = v perto de P
    return (1 - tu) * (1 - tv) * aa + tu * (1 - tv) * ba + (1 - tu) * tv * ab + tu * tv * bb
gravar(piso('piso_'), 'piso')
r = piso('piso_r_')[..., :1].repeat(3, axis=2)
im = Image.fromarray((np.clip(r, 0, 1) * 255 + .5).astype(np.uint8)[..., 0], 'L')
im.save(os.path.join(PASTA, 'piso_rug.webp'), quality=80, method=6)
print(f'  piso_rug.webp {os.path.getsize(os.path.join(PASTA, "piso_rug.webp")) // 1024} KB  min {r.min():.3f} max {r.max():.3f}')
# opacidade do piso (o reflexo falso aparece embaixo dele): polido deixa ver mais, fosco menos
alfa = np.clip(.70 + .9 * (r[..., 0] - .14), .70, .95)
Image.fromarray((alfa * 255 + .5).astype(np.uint8), 'L').save(os.path.join(PASTA, 'piso_alfa.webp'), quality=80, method=6)
print(f'  piso_alfa.webp {os.path.getsize(os.path.join(PASTA, "piso_alfa.webp")) // 1024} KB  {alfa.min():.2f}..{alfa.max():.2f}')
print('FIM')
