"""Converte fotos novas (JPG grandes) pros três tamanhos do site e devolve os dados de cada uma.

Uso: python converter-fotos.py <pasta-com-os-jpg> [pasta-do-site=../site-lab]

Cada `<galeria>--<nome>.jpg` vira `<galeria>-NN-lg.webp` (até 1600 px), `-md` (1080) e `-sm` (640)
em assets/, e sai um JSON com src/md/small/width/height/tone de cada foto, pronto pro add-fotos.mjs.
Não mexe em nada que já existe: numera a partir do que já está na pasta.
"""
import json
import os
import sys
import glob

from PIL import Image, ImageOps

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tons import tom  # noqa: E402

LARGURAS = {'lg': 1600, 'md': 1080, 'sm': 640}


def converter(origem, destino_base):
    im = Image.open(origem)
    im = ImageOps.exif_transpose(im).convert('RGB')
    saida = {}
    for sufixo, largura in LARGURAS.items():
        alvo = min(largura, im.size[0])
        altura = round(im.size[1] * alvo / im.size[0])
        copia = im.resize((alvo, altura), Image.LANCZOS)
        caminho = f'{destino_base}-{sufixo}.webp'
        copia.save(caminho, 'WEBP', quality=90 if sufixo != 'sm' else 82, method=6)
        saida[sufixo] = (caminho, copia.size)
    return saida


def main():
    pasta = sys.argv[1]
    site = sys.argv[2] if len(sys.argv) > 2 else '../site-lab'
    lotes = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fotos-novas.json'), encoding='utf-8'))['lotes']
    assets = os.path.join(site, 'assets')
    out = []
    for lote in lotes:
        gal = lote['galeria']
        existentes = len(glob.glob(os.path.join(assets, f'{gal}-*-lg.webp')))
        for n, foto in enumerate(lote['fotos'], start=existentes + 1):
            origem = os.path.join(pasta, f"{gal}--{foto['nome']}.jpg")
            if not os.path.exists(origem):
                print('SEM ARQUIVO', origem); continue
            base = os.path.join(assets, f'{gal}-{n:02d}')
            r = converter(origem, base)
            rel = lambda s: './assets/' + os.path.basename(r[s][0])
            out.append({
                'galeria': gal, 'artista': lote['artista'], 'arquivo': foto['nome'], 'driveId': foto['id'],
                'src': rel('lg'), 'md': rel('md'), 'small': rel('sm'),
                'width': r['sm'][1][0], 'height': r['sm'][1][1],
                'tone': tom(r['sm'][0]),
                'kb': {k: os.path.getsize(v[0]) // 1024 for k, v in r.items()},
            })
            print(f"{gal}-{n:02d}  {foto['nome']}  {r['lg'][1]}  tom {out[-1]['tone']}")
    destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'saida', 'fotos-convertidas.json')
    json.dump(out, open(destino, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n{len(out)} fotos convertidas · {destino}')


if __name__ == '__main__':
    main()
