# Objetos do bastidor (rodada 19): PNG do Blender -> WebP com transparência pro site; o braço é recortado no que tem
# conteúdo (o resto é ar). Uso: python pos.py
import os
from PIL import Image
P = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site-lab', 'bastidor', 'objetos'))
import sys
quais = sys.argv[1:] or ['pulseira', 'prendedor']
for nome, recorta in [(n, n == 'pulseira') for n in quais]:
    im = Image.open(os.path.join(P, nome + '.png')).convert('RGBA')
    if recorta:
        x0, y0, x1, y1 = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        im = im.crop((x0, y0, x1, y1))
    im.save(os.path.join(P, nome + '.webp'), quality=86, method=6, exact=False)
    os.remove(os.path.join(P, nome + '.png'))
    print(nome, im.size, os.path.getsize(os.path.join(P, nome + '.webp')) // 1024, 'KB')
