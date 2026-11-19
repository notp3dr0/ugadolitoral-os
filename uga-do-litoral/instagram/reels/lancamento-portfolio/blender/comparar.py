# Folha rápida: atual (quadros/<ID>/cor) em cima e um diretório de render embaixo.
# Uso: python comparar.py <ID> <dir> <padrao com {n}> <saida.jpg> n1 n2 ...
import sys, os
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__))
pid, d, pad, saida = sys.argv[1:5]; ns = [int(x) for x in sys.argv[5:]]
W, H = 360, 640
o = Image.new('RGB', (len(ns) * W, 2 * H))
for i, n in enumerate(ns):
    o.paste(Image.open(os.path.join(AQUI, '..', 'quadros', pid, 'cor', f'{n:06d}.jpg')).convert('RGB').resize((W, H)), (i * W, 0))
    im = Image.open(os.path.join(d, pad.format(n=n))).convert('RGB'); im.thumbnail((W, H) if im.width < im.height else (W, W * 9 // 16))
    o.paste(im, (i * W, H))
o.save(saida, quality=90)
