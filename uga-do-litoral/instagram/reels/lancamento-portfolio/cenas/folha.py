"""Folha de revisao: 8 quadros lado a lado em cenas/revisao/<ID>.jpg.
python cenas/folha.py G3_agenda 0 3 14 20 27 41 47 96 [--fundo caminho/da/foto.webp]
PNG com transparencia e montado sobre uma foto (ou xadrez) pra julgar a leitura por cima da imagem."""
import sys, os
from PIL import Image, ImageDraw, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(AQUI)
args = sys.argv[1:]
fundo = None
if '--fundo' in args:
    i = args.index('--fundo'); fundo = args[i + 1]; del args[i:i + 2]
cid, ns = args[0], [int(x) for x in args[1:]]
pasta = os.path.join(PROJ, 'quadros', cid, 'cor')
TW, TH, M = 405, 720, 14
folha = Image.new('RGB', (M + len(ns) * (TW + M), TH + 2 * M + 30), (40, 40, 40))
d = ImageDraw.Draw(folha)
base = None
if fundo:
    base = ImageOps.fit(Image.open(fundo).convert('RGB'), (1080, 1920))
for k, n in enumerate(ns):
    arq = next((os.path.join(pasta, f'{n:06d}.{e}') for e in ('jpg', 'png') if os.path.exists(os.path.join(pasta, f'{n:06d}.{e}'))), None)
    if not arq:
        continue
    im = Image.open(arq)
    if im.mode == 'RGBA':
        fu = base.copy() if base else Image.new('RGB', im.size, (90, 90, 90))
        fu.paste(im, (0, 0), im)
        im = fu
    im = im.convert('RGB').resize((TW, TH), Image.LANCZOS)
    x = M + k * (TW + M)
    folha.paste(im, (x, M))
    d.text((x, TH + M + 6), f'q{n}', fill=(230, 230, 230))
os.makedirs(os.path.join(AQUI, 'revisao'), exist_ok=True)
saida = os.path.join(AQUI, 'revisao', f'{cid}.jpg')
folha.save(saida, quality=90)
print(saida)
