# folha de conferência: python folha2.py <estilo> <saida> t1 t2 ...  (4 colunas, 480x270)
import sys
from PIL import Image, ImageDraw
est, out, ts = sys.argv[1], sys.argv[2], sys.argv[3:]
cols, w, h = 4, 480, 270
img = Image.new('RGB', (cols * w, ((len(ts) + cols - 1) // cols) * h), 'white'); d = ImageDraw.Draw(img)
for i, t in enumerate(ts):
    im = Image.open(f'conferencia/q-{est}-{t}.png').convert('RGB').resize((w, h))
    x, y = (i % cols) * w, (i // cols) * h
    img.paste(im, (x, y)); d.rectangle([x, y, x + 54, y + 18], fill='black'); d.text((x + 4, y + 4), t, fill='white')
img.save(out)
