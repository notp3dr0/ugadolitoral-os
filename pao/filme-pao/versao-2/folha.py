# folha de contato de uma pasta de stills: python -I folha.py <pasta> [colunas]
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 5
fs = sorted(f for f in glob.glob(os.path.join(d, "*.jpg")) if not f.endswith("folha.jpg"))
W, H = 480, 270; rows = (len(fs) + cols - 1) // cols
sh = Image.new("RGB", (cols * W, rows * (H + 24)), "#111"); dr = ImageDraw.Draw(sh)
f = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 18)
for i, p in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * (H + 24)
    sh.paste(Image.open(p).resize((W, H)), (x, y + 24)); dr.text((x + 4, y + 2), os.path.basename(p)[:-4], fill="#ffd27a", font=f)
sh.save(os.path.join(d, "folha.jpg"), quality=85); print(len(fs), "quadros")
