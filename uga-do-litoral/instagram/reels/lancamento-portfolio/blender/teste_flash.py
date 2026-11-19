# Compara o flash do laboratório (a) com o flash renderizado (b) num quadro do plano.
# Uso: python teste_flash.py <dir_a> <dir_b> <quadro> <a_flash> <saida.jpg>
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'pos'))
import numpy as np, cv2
import luz
from comum import dec, enc_f, ler_prof
da, db, n, a, saida = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
img = dec(cv2.cvtColor(cv2.imread(f'{da}/cor/{n:06d}.jpg'), cv2.COLOR_BGR2RGB))
prof = ler_prof(f'{da}/prof/{n:06d}.png')
g = 1.4 * luz.envelope_flash(a, True)   # "medio" com prof, como no montar.py
lab = luz.aplica_flash(img, luz.mapa_flash(prof, g), True)
u8 = lambda x: (np.clip(enc_f(np.clip(x, 0, 1)), 0, 1) * 255).astype(np.uint8)
b = cv2.cvtColor(cv2.imread(f'{db}/cor/{n:06d}.jpg'), cv2.COLOR_BGR2RGB)
pr = (np.clip(np.nan_to_num(prof, posinf=30) / 30, 0, 1) * 255).astype(np.uint8)
lin = np.hstack([u8(img), u8(lab), b, np.dstack([pr] * 3)])
lin = cv2.resize(lin, (lin.shape[1] // 3, lin.shape[0] // 3))
for k, t in enumerate(['sem flash', '(a) laboratorio', '(b) luz na camera', 'prof']):
    cv2.putText(lin, t, (10 + k * 360, 30), cv2.FONT_HERSHEY_SIMPLEX, .8, (255, 255, 255), 2)
cv2.imwrite(saida, cv2.cvtColor(lin, cv2.COLOR_RGB2BGR))
