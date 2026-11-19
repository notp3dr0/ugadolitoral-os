# Elenco do bastidor · a textura única dos personagens (512 x 512): branco liso (o resto do corpo usa só a cor
# do vértice), as palavras das costas, os crachás e o papel da prancheta. O fundo de cada palavra é a cor da
# camiseta, pra a peça emendar sem borda. Uso: python atlas.py  -> atlas.png + atlas.json (retângulos em UV)
import json, os
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
W = H = 512
CAMISETA = '#141414'
img = Image.new('RGB', (W, H), '#ffffff'); d = ImageDraw.Draw(img)
BLACK = 'C:/Windows/Fonts/ariblk.ttf'; BOLD = 'C:/Windows/Fonts/arialbd.ttf'
R = {}

def caixa(nome, x, y, w, h, fundo):
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=fundo)
    i = 3  # 3 px pra dentro: o filtro da placa não puxa a cor do vizinho
    R[nome] = [(x + i) / W, 1 - (y + h - i) / H, (x + w - i) / W, 1 - (y + i) / H]   # u0, v0, u1, v1 (v de baixo pra cima)

def palavra(nome, txt, x, y, w, h, cor, fundo=CAMISETA, fonte=BLACK, larg=.92):
    caixa(nome, x, y, w, h, fundo)
    tam = 10
    while True:
        f = ImageFont.truetype(fonte, tam + 2); bb = d.textbbox((0, 0), txt, font=f)
        if bb[2] - bb[0] > w * larg or bb[3] - bb[1] > h * .78: break
        tam += 2
    f = ImageFont.truetype(fonte, tam); bb = d.textbbox((0, 0), txt, font=f)
    d.text((x + (w - (bb[2] - bb[0])) / 2 - bb[0], y + (h - (bb[3] - bb[1])) / 2 - bb[1]), txt, font=f, fill=cor)

caixa('branco', 480, 480, 32, 32, '#ffffff')
palavra('seguranca', 'SEGURANÇA', 0, 0, 512, 104, '#f5c518')           # o amarelo das camisetas de segurança
palavra('staff', 'STAFF', 0, 108, 256, 92, '#ecebe6')
palavra('producao', 'PRODUÇÃO', 256, 108, 256, 92, '#ecebe6')

def cracha(nome, x, y, faixa, titulo, grande):
    w, h = 96, 136
    caixa(nome, x, y, w, h, '#f2f0ea')
    d.rectangle([x, y, x + w - 1, y + 30], fill=faixa)
    f = ImageFont.truetype(BOLD, 13); bb = d.textbbox((0, 0), titulo, font=f)
    d.text((x + (w - bb[2]) / 2, y + 8), titulo, font=f, fill='#ffffff')
    t = 40
    while True:
        f = ImageFont.truetype(BLACK, t); bb = d.textbbox((0, 0), grande, font=f)
        if bb[2] - bb[0] <= w - 14: break
        t -= 1
    d.text((x + (w - (bb[2] - bb[0])) / 2 - bb[0], y + 70 - (bb[3] + bb[1]) / 2), grande, font=f, fill='#111111')
    d.rectangle([x + 14, y + 108, x + w - 15, y + 112], fill='#9a978f')
    d.rectangle([x + 14, y + 118, x + w - 40, y + 121], fill='#bcb9b1')
cracha('cracha_aaa', 0, 210, '#c81e1e', 'ALL ACCESS', 'AAA')
cracha('cracha_staff', 100, 210, '#111111', 'BACKSTAGE', 'STAFF')

# papel da prancheta: a lista de credenciamento, linhas finas
caixa('papel', 200, 210, 100, 136, '#efede6')
for k in range(9):
    y = 226 + k * 13; d.rectangle([208, y, 290 - (k % 3) * 14, y + 2], fill='#8f8c85')
d.rectangle([200, 210, 299, 218], fill='#c81e1e')
img.save(os.path.join(AQUI, 'atlas.png'))
json.dump({'w': W, 'h': H, 'camiseta': CAMISETA, 'r': R}, open(os.path.join(AQUI, 'atlas.json'), 'w'), indent=1)
print('atlas.png', {k: [round(v, 3) for v in r] for k, r in R.items()})
