"""Prepara as fotos pro render: versão leve (public/img) e mapa de profundidade (public/depth).

Profundidade: Depth Anything V2 Small em ONNX (onnxruntime, CPU). Modelo em ~/.cache/depth-anything/model.onnx
(https://huggingface.co/onnx-community/depth-anything-v2-small). Saída: PNG em tons de cinza, branco = perto.

Uso: python -I scripts/prep.py            (todas as fotos de public/fotos)
     python -I scripts/prep.py alee phl   (só essas)
"""
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC, IMG, DEPTH = ROOT / 'public/fotos', ROOT / 'public/img', ROOT / 'public/depth'
MODEL = Path.home() / '.cache/depth-anything/model.onnx'
MAX_W, MAX_H = 1620, 2430      # 1,5x a largura do quadro: folga pro zoom da câmera
NET_SHORT = 518                # lado menor da entrada da rede (múltiplo de 14)
MEAN, STD = np.array([0.485, 0.456, 0.406]), np.array([0.229, 0.224, 0.225])


def depth_map(img: Image.Image, sess: ort.InferenceSession) -> Image.Image:
    w, h = img.size
    s = NET_SHORT / min(w, h)
    nw, nh = max(14, round(w * s / 14) * 14), max(14, round(h * s / 14) * 14)
    x = (np.asarray(img.resize((nw, nh), Image.BICUBIC), dtype=np.float32) / 255 - MEAN) / STD
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    d = sess.run(None, {'pixel_values': x})[0][0]
    lo, hi = np.percentile(d, 1), np.percentile(d, 99)
    d = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1)
    out = Image.fromarray((d * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    # borda macia: evita rasgo no contorno do artista quando a câmera anda
    return out.filter(ImageFilter.GaussianBlur(radius=max(2, w // 300)))


def main(names: list[str]) -> None:
    IMG.mkdir(parents=True, exist_ok=True)
    DEPTH.mkdir(parents=True, exist_ok=True)
    sess = ort.InferenceSession(str(MODEL), providers=['CPUExecutionProvider'])
    files = sorted(p for p in SRC.iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png'))
    for p in files:
        if names and p.stem not in names:
            continue
        img = Image.open(p).convert('RGB')
        img.thumbnail((MAX_W, MAX_H), Image.LANCZOS)
        img.save(IMG / f'{p.stem}.jpg', quality=92)
        depth_map(img, sess).save(DEPTH / f'{p.stem}.png')
        print(f'{p.stem}: {img.size[0]}x{img.size[1]}')


if __name__ == '__main__':
    main(sys.argv[1:])
