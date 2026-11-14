# junta quadros de conferência numa folha 3 colunas (960x540 cada)
import sys
from PIL import Image, ImageDraw
ts = sys.argv[2:]; out = sys.argv[1]
cols = 2; w, h = 960, 540
img = Image.new('RGB', (cols * w, ((len(ts) + cols - 1) // cols) * h), 'white')
d = ImageDraw.Draw(img)
for i, t in enumerate(ts):
    im = Image.open(f'conferencia/q-{t}.png').convert('RGB').resize((w, h))
    x, y = (i % cols) * w, (i // cols) * h
    img.paste(im, (x, y)); d.rectangle([x, y, x + 90, y + 34], fill='black'); d.text((x + 8, y + 8), t + ' s', fill='white')
img.save(out)
