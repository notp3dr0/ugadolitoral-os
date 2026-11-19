# junta as prévias de um tipo numa tira: python juntar_previa.py seguranca
import sys, glob, os
from PIL import Image
t = sys.argv[1]; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'previa'))
fs = sorted(glob.glob(f'{t}-*.png'))
ims = [Image.open(f).convert('RGB').crop((150, 0, 750, 1200)).resize((300, 600)) for f in fs]
o = Image.new('RGB', (300 * len(ims), 600)); [o.paste(im, (i * 300, 0)) for i, im in enumerate(ims)]
o.save(f'_{t}.jpg', quality=90); print(fs)
