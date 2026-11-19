# Renderiza um plano inteiro em segundo plano, por faixas que dá pra retomar (o que já está em disco é
# pulado), nos formatos pedidos, e fecha cada saída com pronto.json no formato do laboratório.
# Uso: python sequencia.py C7_porta [v h] [--faixa 20] [--flash 13,40] [--quadros 168-222] [--seg] [-- args extras pro render.py]
#   vertical   -> ../quadros/<ID>_bl/   (cor, prof; fio copiado da v2)
#   horizontal -> ../quadros/<ID>_blh/  (cor, prof; sem fio)
# Registro: blender/revisao/sequencia-<ID>.log
import json, os, shutil, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
BL = r'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe'
QUADROS = os.path.normpath(os.path.join(AQUI, '..', 'quadros'))
args = sys.argv[1:]
EXTRA = args[args.index('--') + 1:] if '--' in args else []
if '--' in args: args = args[:args.index('--')]
def opt(k, d=None):
    if k in args: i = args.index(k); v = args[i + 1]; del args[i:i + 2]; return v
    return d
FAIXA = int(opt('--faixa', 20)); FLASH = opt('--flash', ''); QQ = opt('--quadros', None)
SEG = '--seg' in args
if SEG: args.remove('--seg')
PLANO = args[0]; FORMATOS = args[1:] or ['v', 'h']
POSE = json.load(open(os.path.join(AQUI, 'dados', 'camera', PLANO + '.json')))
N = POSE['quadros']
LISTA = list(range(N)) if not QQ else list(range(int(QQ.split('-')[0]), int(QQ.split('-')[1]) + 1))
LOG = os.path.join(AQUI, 'revisao', f'sequencia-{PLANO}.log')
def log(msg):
    linha = f'{time.strftime("%Y-%m-%d %H:%M:%S")} {msg}'
    print(linha, flush=True)
    with open(LOG, 'a', encoding='utf-8') as f: f.write(linha + '\n')

for fmt in FORMATOS:
    saida = os.path.join(QUADROS, PLANO + ('_bl' if fmt == 'v' else '_blh'))
    os.makedirs(os.path.join(saida, 'cor'), exist_ok=True)
    def feito(n):
        if SEG: return os.path.exists(os.path.join(saida, 'seg', f'{n:06d}.jpg'))
        return os.path.exists(os.path.join(saida, 'cor', f'{n:06d}.jpg')) and os.path.exists(os.path.join(saida, 'prof', f'{n:06d}.png'))
    falta = [n for n in LISTA if not feito(n)]
    log(f'{PLANO} {fmt}: faltam {len(falta)} de {N}')
    for k in range(0, len(falta), FAIXA):
        lote = falta[k:k + FAIXA]
        # a cor existe e a prof não (interrompido no meio): refaz o quadro inteiro
        for n in lote:
            c = os.path.join(saida, 'seg' if SEG else 'cor', f'{n:06d}.jpg')
            if os.path.exists(c): os.remove(c)
        cmd = [BL, '-b', os.path.join(AQUI, 'cena', 'corredor.blend'), '--python', os.path.join(AQUI, 'render.py'), '--',
               '--plano', PLANO, '--quadros', ','.join(map(str, lote)), '--formato', fmt, '--motor', 'cycles', '--seq', '--saida', saida]
        if FLASH: cmd += ['--flash', FLASH]
        if SEG: cmd += ['--seg']
        cmd += EXTRA
        t = time.time()
        r = subprocess.run(cmd, capture_output=True, text=True, errors='replace')
        if r.returncode != 0 or 'Traceback' in r.stdout + r.stderr:
            log(f'  ERRO no lote {lote[0]}-{lote[-1]}:\n{(r.stdout + r.stderr)[-1500:]}'); sys.exit(1)
        log(f'  lote {lote[0]}-{lote[-1]} pronto em {time.time() - t:.0f} s')
    shutil.rmtree(os.path.join(saida, '_tmp'), ignore_errors=True)
    if SEG:
        log(f'{PLANO} {fmt}: passe seg pronto ({len(LISTA)} quadros)'); continue
    if fmt == 'v':
        fio_v2 = os.path.join(QUADROS, PLANO, 'fio')
        if os.path.isdir(fio_v2) and not os.path.isdir(os.path.join(saida, 'fio')): shutil.copytree(fio_v2, os.path.join(saida, 'fio'))
    tempos = [json.loads(l)['segundos'] for l in open(os.path.join(saida, 'tempos.jsonl'), encoding='utf-8')] if os.path.exists(os.path.join(saida, 'tempos.jsonl')) else []
    v2 = json.load(open(os.path.join(QUADROS, PLANO, 'pronto.json'), encoding='utf-8'))
    pronto = {**v2, 'largura': 1080 if fmt == 'v' else 1920, 'altura': 1920 if fmt == 'v' else 1080,
              'passes': ['cor', 'fio', 'prof'] if fmt == 'v' else ['cor', 'prof'],
              'fio': 'copiado da v2 (mesma câmera)' if fmt == 'v' else 'sem fio no horizontal (o arreio do site só filma 1080x1920)',
              'origem': 'Blender 5.3 Cycles 32 amostras + OIDN, desfoque de movimento (meio quadro), profundidade de campo leve; blender/render.py',
              'flash': f'renderizado (luz presa à câmera) nos quadros locais {FLASH}' if FLASH else 'do laboratório',
              'segundos_por_quadro_medio': round(sum(tempos) / len(tempos), 2) if tempos else None,
              'obs': 'etapa 2 do showreel no Blender'}
    json.dump(pronto, open(os.path.join(saida, 'pronto.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    log(f'{PLANO} {fmt}: pronto ({len(tempos)} quadros medidos, média {pronto["segundos_por_quadro_medio"]} s)')
