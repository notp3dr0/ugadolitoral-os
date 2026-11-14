"""Folha de revisão de um plano: 8 quadros lado a lado, uma linha por passe, mais uma linha com o fio
em vermelho sobre a cor (confere se a câmera coincide). Uso: python revisao.py <ID> [quadros separados por vírgula]
Saída: captura/revisao/<ID>.jpg"""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
QD = os.path.join(AQUI, '..', 'quadros')
idp = sys.argv[1]
base = os.path.join(QD, idp)
pronto = json.load(open(os.path.join(base, 'pronto.json'))) if os.path.exists(os.path.join(base, 'pronto.json')) else None
passes = [p for p in ['cor', 'fio', 'prof'] if os.path.isdir(os.path.join(base, p))]
n = len(os.listdir(os.path.join(base, passes[0])))
if len(sys.argv) > 2:
    qs = [int(x) for x in sys.argv[2].split(',')]
else:
    qs = [round(i * (n - 1) / 7) for i in range(8)]
W, H = 270, 480

def abrir(p, q):
    ext = 'png' if p == 'prof' else 'jpg'
    f = os.path.join(base, p, f'{q:06d}.{ext}')
    im = Image.open(f)
    if p == 'prof':
        a = np.asarray(im.convert('RGB')).astype(np.float32)
        d = (a[..., 0] * 256 + a[..., 1]) / 65535
        v = (255 * (1 - np.clip(d, 0, 1)) ** 1.5).astype(np.uint8)
        return Image.fromarray(v).convert('RGB')
    return im.convert('RGB')

linhas = passes + (['fio/cor'] if 'cor' in passes and 'fio' in passes else [])
sheet = Image.new('RGB', (W * len(qs), (H + 18) * len(linhas)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for r, p in enumerate(linhas):
    for c, q in enumerate(qs):
        if p == 'fio/cor':
            a = np.asarray(abrir('cor', q)).astype(np.float32)
            f = np.asarray(abrir('fio', q)).astype(np.float32)[..., :1] / 255
            o = a * .55 * (1 - f) + np.array([255, 30, 30]) * f
            im = Image.fromarray(o.clip(0, 255).astype(np.uint8))
        else:
            im = abrir(p, q)
        sheet.paste(im.resize((W, H), Image.LANCZOS), (c * W, r * (H + 18) + 18))
        d.text((c * W + 4, r * (H + 18) + 3), f'{p} q{q}', fill=(255, 255, 0))
os.makedirs(os.path.join(AQUI, 'revisao'), exist_ok=True)
out = os.path.join(AQUI, 'revisao', f'{idp}.jpg')
sheet.save(out, quality=88)
print(out, n, 'quadros', passes)
