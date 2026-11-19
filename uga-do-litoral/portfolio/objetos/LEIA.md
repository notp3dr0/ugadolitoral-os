# Objetos do bastidor

Renders do Blender que o site usa por cima do HTML (`site-lab/bastidor/objetos/`). Ver `../plano/rodada-18-home.md`
e o andamento de 2026-11-18 (rodada 19).

- `estampas.py` → `cordao.png`, `pulseira.png` (as estampas de tecido).
- `credencial.py` → `cordao.png` (cetim em V, prendedor, mosquetão, argola; 100 x 70 mm) e `capa.png` (capa de PVC
  108 x 166 mm). O cartão do crachá continua HTML (foto sorteada); as medidas casam com o CSS de `.cracha`.
- `pulseira.py` → `pulseira.png` (pulseira de festival sozinha, sem mão: o Pedro não quis braço realista).
- `pos.py` → converte pra WebP com transparência (rodar depois dos renders; recorta o vazio).

Ordem: `python estampas.py` → `blender -b --python credencial.py` → `blender -b --python pulseira.py` → `python pos.py`
(o `pos.py` converte `cordao.png`, `capa.png` e `pulseira.png`).
