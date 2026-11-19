# Estampas dos objetos do bastidor (rodada 19): o cordão do crachá e a pulseira de festival.
# Uso: python estampas.py  -> cordao.png, pulseira.png (texturas que o Blender usa)
from PIL import Image, ImageDraw, ImageFont
BLACK = 'C:/Windows/Fonts/ariblk.ttf'; BOLD = 'C:/Windows/Fonts/arialbd.ttf'

def tira(nome, w, h, fundo, cor, texto, fonte, tam, borda=None, trama=18):
    img = Image.new('RGB', (w, h), fundo); d = ImageDraw.Draw(img)
    # trama do tecido: linhas finas na direção do comprimento
    for y in range(0, h, 3): d.line([(0, y), (w, y)], fill=tuple(max(0, c - trama) for c in Image.new('RGB', (1, 1), fundo).getpixel((0, 0))))
    if borda: d.rectangle([0, 0, w, 10], fill=borda); d.rectangle([0, h - 11, w, h], fill=borda)
    f = ImageFont.truetype(fonte, tam); x = 20
    while x < w:
        bb = d.textbbox((0, 0), texto, font=f)
        d.text((x, (h - (bb[3] - bb[1])) / 2 - bb[1]), texto, font=f, fill=cor)
        x += bb[2] - bb[0] + tam
    img.save(nome); print(nome, img.size)

# cordão: 20 mm x 400 mm -> 64 x 1280 px (a textura corre no comprimento, que aqui é a horizontal)
tira('cordao.png', 2560, 128, '#0d0d0d', '#ecebe6', 'UGA DO LITORAL  ·  BASTIDOR', BOLD, 54, borda='#1a1a1a', trama=6)
# pulseira: 15 mm x 260 mm, cetim vermelho com FOTO
tira('pulseira.png', 2600, 150, '#c3121a', '#fbf6ec', 'FOTO    FOTO    ALL ACCESS', BLACK, 84, borda='#7d0d11', trama=10)
