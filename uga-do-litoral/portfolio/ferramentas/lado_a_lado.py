# Rodada 15: junta os prints do site (saida/fiel/) e os quadros do Blender no mesmo enquadramento, lado a lado.
# Uso: python lado_a_lado.py [modo ...]   (padrão: hoje filme) -> saida/fiel/lado-a-lado.jpg + medidas de brilho
import sys
from PIL import Image
import numpy as np
R = '../../instagram/reels/lancamento-portfolio/blender/revisao/site-ref/REF_site_h_cycles_%03d.jpg'
S = 'saida/fiel/%s-%s.png'
modos = sys.argv[1:] or ['hoje', 'filme']
pts = ['entrada', 'lance2', 'parede', 'porta']
W, H = 640, 360
out = Image.new('RGB', (W * (len(modos) + 1), H * len(pts)))
for i, p in enumerate(pts):
    imgs = [Image.open(S % (p, m)).convert('RGB').resize((1920, 1080)) for m in modos] + [Image.open(R % i).convert('RGB')]
    for j, im in enumerate(imgs): out.paste(im.resize((W, H)), (j * W, i * H))
    for nome, (y0, y1, x0, x1) in {'parede': (80, 260, 80, 400), 'piso': (900, 1060, 700, 1220)}.items():
        print(p, nome, ' '.join(f'{m}={np.asarray(im.convert("L"), float)[y0:y1, x0:x1].mean():.1f}' for m, im in zip(modos + ['blender'], imgs)))
out.save('saida/fiel/lado-a-lado.jpg', quality=88)
