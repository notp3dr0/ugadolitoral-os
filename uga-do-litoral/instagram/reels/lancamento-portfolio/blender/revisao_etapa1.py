# Passo 4 da etapa 1: renderiza as quatro posições nos dois formatos e nos dois motores e monta
# blender/revisao/etapa-1.jpg (atual | EEVEE | Cycles, com o tempo por quadro), mais a sobreposição com o
# passe fio (revisao/etapa-1-fio.jpg) e o teste de vista Standard x AgX (revisao/etapa-1-vista.jpg).
# Uso (Python do sistema, com Pillow): python revisao_etapa1.py [--so-folha]
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageChops

AQUI = os.path.dirname(os.path.abspath(__file__))
BL = r'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe'
CENA = os.path.join(AQUI, 'cena', 'corredor.blend')
OUT = os.path.join(AQUI, 'revisao', 'etapa-1')
QUADROS = os.path.normpath(os.path.join(AQUI, '..', 'quadros'))
POS = [('B1_travessia', 110), ('C2a', 0), ('C7_porta', 60), ('C7_porta', 90)]

def render(plano, quadros, formato, motor, saida=OUT, extra=()):
    cmd = [BL, '-b', CENA, '--python', os.path.join(AQUI, 'render.py'), '--', '--plano', plano, '--quadros', quadros,
           '--formato', formato, '--motor', motor, '--saida', saida, *extra]
    r = subprocess.run(cmd, capture_output=True, text=True, errors='replace')
    for l in r.stdout.splitlines():
        if l.startswith(('QUADRO', 'AQUEC')) or 'Error' in l: print(' ', l)

if '--so-folha' not in sys.argv:
    for formato in ('v', 'h'):
        for motor in ('eevee', 'cycles'):
            por_plano = {}
            for p, n in POS: por_plano.setdefault(p, []).append(str(n))
            for p, ns in por_plano.items(): render(p, ','.join(ns), formato, motor)
    # vista: o mesmo quadro em AgX, pra comparar com Standard
    render('C2a', '0', 'v', 'cycles', os.path.join(OUT, 'agx'), ('--vista', 'AgX'))
    render('B1_travessia', '110', 'v', 'cycles', os.path.join(OUT, 'agx'), ('--vista', 'AgX'))

# ---------------------------------------------------------------- tempos
tempos = {}
for l in open(os.path.join(OUT, 'tempos.jsonl'), encoding='utf-8'):
    t = json.loads(l); tempos[(t['plano'], t['quadro'], t['formato'], t['motor'])] = t['segundos']
def fonte(px):
    for f in ('C:/Windows/Fonts/consola.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f): return ImageFont.truetype(f, px)
    return ImageFont.load_default()
F, FP = fonte(22), fonte(30)

def rotulo(im, txt):
    d = ImageDraw.Draw(im); d.rectangle((0, 0, im.width, 34), fill=(0, 0, 0)); d.text((10, 5), txt, fill=(235, 235, 235), font=F)
    return im

# ---------------------------------------------------------------- folha: uma linha por posição, vertical e horizontal
VW, VH = 360, 640        # vertical reduzido
HW, HH = 640, 360        # horizontal reduzido
GAP = 12
linhas = []
for p, n in POS:
    atual = Image.open(os.path.join(QUADROS, p, 'cor', f'{n:06d}.jpg')).convert('RGB')
    cel_v = [rotulo(atual.resize((VW, VH)), f'atual (v2)')]
    for m in ('eevee', 'cycles'):
        im = Image.open(os.path.join(OUT, f'{p}_v_{m}_{n:03d}.jpg')).convert('RGB').resize((VW, VH))
        cel_v.append(rotulo(im, f'{m.upper()} v  {tempos.get((p, n, "v", m), 0):.1f} s'))
    # o atual só existe em vertical: no horizontal, ele aparece reenquadrado no centro (referência)
    a_h = Image.new('RGB', (HW, HH), (0, 0, 0)); a_h.paste(atual.resize((HH * 1080 // 1920, HH)), ((HW - HH * 1080 // 1920) // 2, 0))
    cel_h = [rotulo(a_h, 'atual (só existe em v)')]
    for m in ('eevee', 'cycles'):
        im = Image.open(os.path.join(OUT, f'{p}_h_{m}_{n:03d}.jpg')).convert('RGB').resize((HW, HH))
        cel_h.append(rotulo(im, f'{m.upper()} h  {tempos.get((p, n, "h", m), 0):.1f} s'))
    largura = 3 * VW + 2 * GAP + GAP * 3 + 3 * HW + 2 * GAP
    L = Image.new('RGB', (largura, 50 + VH), (18, 18, 18))
    ImageDraw.Draw(L).text((10, 8), f'{p} · quadro {n}', fill=(255, 60, 50), font=FP)
    x = 0
    for c in cel_v: L.paste(c, (x, 50)); x += VW + GAP
    x += GAP * 2
    for k, c in enumerate(cel_h): L.paste(c, (x, 50 + (VH - 2 * HH - GAP) // 2 + (0 if k < 3 else 0)) if False else (x, 50 + (VH - HH) // 2)); x += HW + GAP
    linhas.append(L)
med = {}
for (p, n, f, m), s in tempos.items(): med.setdefault((f, m), []).append(s)
resumo = '   '.join(f'{m.upper()} {f}: média {sum(v) / len(v):.1f} s/quadro' for (f, m), v in sorted(med.items()))
topo = Image.new('RGB', (linhas[0].width, 70), (0, 0, 0))
ImageDraw.Draw(topo).text((10, 18), 'ETAPA 1 · corredor no Blender (GTX 1660 Super, resolução final, sem arranque)   ' + resumo, fill=(235, 235, 235), font=F)
folha = Image.new('RGB', (linhas[0].width, 70 + sum(l.height + GAP for l in linhas)), (18, 18, 18))
folha.paste(topo, (0, 0)); y = 70
for l in linhas: folha.paste(l, (0, y)); y += l.height + GAP
folha.save(os.path.join(AQUI, 'revisao', 'etapa-1.jpg'), quality=90)

# ---------------------------------------------------------------- sobreposição com o passe fio (vermelho = motor, ciano = Blender)
def bordas(im):
    from PIL import ImageFilter
    return im.convert('L').filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
sob = []
for p, n in POS[:3]:
    fio = Image.open(os.path.join(QUADROS, p, 'fio', f'{n:06d}.jpg')).convert('L').point(lambda v: 255 if v > 60 else 0)
    bl = bordas(Image.open(os.path.join(OUT, f'{p}_v_cycles_{n:03d}.jpg')).convert('RGB').resize(fio.size))
    z = Image.new('L', fio.size, 0)
    im = Image.merge('RGB', (fio, bl, bl)).resize((540, 960))
    sob.append(rotulo(im, f'{p} q{n}: vermelho = fio do motor, ciano = bordas Blender'))
S = Image.new('RGB', (540 * len(sob) + GAP * (len(sob) - 1), 960), (0, 0, 0))
for i, s in enumerate(sob): S.paste(s, (i * (540 + GAP), 0))
S.save(os.path.join(AQUI, 'revisao', 'etapa-1-fio.jpg'), quality=90)

# ---------------------------------------------------------------- Standard x AgX
vis = []
for p, n in (('C2a', 0), ('B1_travessia', 110)):
    vis.append(rotulo(Image.open(os.path.join(QUADROS, p, 'cor', f'{n:06d}.jpg')).convert('RGB').resize((VW, VH)), 'atual'))
    vis.append(rotulo(Image.open(os.path.join(OUT, f'{p}_v_cycles_{n:03d}.jpg')).convert('RGB').resize((VW, VH)), 'Standard'))
    vis.append(rotulo(Image.open(os.path.join(OUT, 'agx', f'{p}_v_cycles_{n:03d}.jpg')).convert('RGB').resize((VW, VH)), 'AgX'))
V = Image.new('RGB', (len(vis) * (VW + GAP), VH), (0, 0, 0))
for i, s in enumerate(vis): V.paste(s, (i * (VW + GAP), 0))
V.save(os.path.join(AQUI, 'revisao', 'etapa-1-vista.jpg'), quality=90)
print('folha:', os.path.join(AQUI, 'revisao', 'etapa-1.jpg'))
print(resumo)
