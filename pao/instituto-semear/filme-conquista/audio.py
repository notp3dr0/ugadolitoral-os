# Som do filme: foley ASMR sintetizado (contato, textura, distância) + vozes posicionadas pela folha de cues.
# Uso: python audio.py            -> audio/mix.wav (48 kHz estéreo, ainda sem master)
# O master (-14 LUFS, -1 dBTP) é feito no mux (ver montar.py).
import json, os, subprocess
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR, DUR = 48000, 30.0
N = int(SR * DUR)
AQUI = os.path.dirname(os.path.abspath(__file__))
CUES = json.load(open(os.path.join(AQUI, 'cues.json'), encoding='utf8'))
rng = np.random.default_rng(20261104)
L = np.zeros(N); R = np.zeros(N)

def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, o=2):
    return sosfilt(butter(o, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, o=2):
    return sosfilt(butter(o, f, btype='high', fs=SR, output='sos'), x)
def env(n, a, d, curve=4.0):  # ataque linear, cauda exponencial
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e
def put(x, t, g=1.0, pan=0.0):  # pan -1..1, lei de potência constante
    i = int(round(t * SR)); x = x[: max(0, N - i)]
    a = (pan + 1) * np.pi / 4
    L[i:i + len(x)] += x * g * np.cos(a); R[i:i + len(x)] += x * g * np.sin(a)
def noise(n): return rng.standard_normal(n)

# ---------------------------------------------------------------- materiais
def vidro_na_bancada():  # contato arredondado + ressonância curta de vidro
    n = int(SR * 1.4); t = np.arange(n) / SR
    thump = lp(noise(n), 380) * env(n, 0.002, 0.05, 3) * 1.6
    knock = bp(noise(n), 900, 2600) * env(n, 0.001, 0.02, 3) * 0.6
    ring = sum(a * np.sin(2 * np.pi * f * t + p) * np.exp(-t * d) for f, a, d, p in
               [(2210, .22, 9, 0), (3480, .14, 12, 1), (5170, .08, 16, 2), (7020, .04, 22, 3)])
    ring *= np.minimum(1, t / 0.002)
    return (thump + knock + ring) * 0.9
def tecido(dur, k=1.0):  # manga do jaleco: atrito macio
    n = int(SR * dur); t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    x = bp(noise(n), 700, 3800) * e * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) ** 2)
    return x * 0.22 * k
def papel_desliza(dur):  # folha deslizando: chiado com fibras
    n = int(SR * dur); t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.9
    base = bp(noise(n), 1800, 7500) * e * 0.18
    fib = np.zeros(n); idx = rng.integers(0, n, int(dur * 90))
    fib[idx] = rng.uniform(-1, 1, len(idx)); fib = bp(fib, 2500, 9000) * e * 0.9
    return base + fib
def polpa(k=1.0):  # toque da polpa do dedo no papel/mesa
    n = int(SR * 0.25)
    return (lp(noise(n), 520) * env(n, 0.003, 0.04, 3) * 1.1 + bp(noise(n), 1500, 4000) * env(n, 0.001, 0.012, 3) * 0.25) * k
def dedo_no_mapa(dur, vel):  # fricção leve, modulada pela velocidade do dedo (vel: array 0..1 por amostra)
    n = int(SR * dur)
    v = np.interp(np.arange(n), np.linspace(0, n, len(vel)), vel)
    return bp(noise(n), 1200, 5200) * v * 0.16
def grafite(dur, k=1.0):  # lápis percorrendo o papel
    n = int(SR * dur); t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    gr = bp(noise(n), 2500, 9500) * (0.7 + 0.3 * np.sin(2 * np.pi * 31 * t))
    tooth = np.zeros(n); idx = rng.integers(0, n, int(dur * 160)); tooth[idx] = rng.uniform(-1, 1, len(idx))
    return (gr * 0.14 + bp(tooth, 3000, 10000) * 0.7) * e * k
def lapis_para():  # o lápis para no encaixe: pequeno clique
    n = int(SR * 0.2)
    return bp(noise(n), 2000, 6000) * env(n, 0.0005, 0.01, 3) * 0.7 + lp(noise(n), 600) * env(n, 0.002, 0.03, 3) * 0.6
def pop_papel(k=1.0):  # pessoinha da copa: toque de papel recortado
    n = int(SR * 0.12)
    return (bp(noise(n), 1800, 5000) * env(n, 0.001, 0.015, 3) * 0.35 + lp(noise(n), 900) * env(n, 0.002, 0.02, 3) * 0.4) * k
def sopro(dur, k=1.0):  # passagem de ar (smear / transições), bem discreta
    n = int(SR * dur); t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return bp(noise(n), 500, 2500) * e * 0.12 * k

# ---------------------------------------------------------------- ambiente baixo que liga os cortes
amb = lp(np.cumsum(noise(N)) * 0.002, 900); amb -= lp(amb, 40)
amb = amb / (np.abs(amb).max() + 1e-9) * 0.018
L += amb; R += amb * 0.96

# ---------------------------------------------------------------- eventos (folha de cues)
c = CUES
def brilhinho():  # cintilar bem discreto (a última pessoinha, o toque no destino)
    n = int(SR * 0.6); t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(3520, .05, 9), (5274, .03, 12), (7040, .015, 16)]) * np.minimum(1, t / 0.004)
put(vidro_na_bancada(), c['vidro'], 1.0, 0.25)
put(tecido(0.9), c['jaleco'], 1.0, 0.3)
put(tecido(0.7, 0.7), c['jaleco'] + 0.6, 1.0, 0.35)
for tl in (2.0, 5.2, 13.6): put(papel_desliza(0.35) * 0.45, tl, 1.0, -0.6)  # legendas entrando
put(grafite(1.0, 0.45), c['arco'], 1.0, 0.5)
put(sopro(0.3), c['corte_advogado'] - 0.1, 1.0, 0.6)
put(papel_desliza(0.9), c['folha_gira'], 1.0, -0.1)
put(polpa(0.9), c['pais_firmam'], 1.0, -0.4)
put(polpa(0.7), c['aponta'], 1.0, 0.0)
put(grafite(1.0, 0.4), c['linha_sai'], 1.0, 0.3)
put(sopro(0.4, 1.6), c['smear'], 1.0, 0.7)
put(grafite(0.3, 0.5), c['corte_mapa'], 1.0, -0.3)
vel = np.concatenate([np.linspace(0.3, 1, 20), np.ones(40), np.linspace(1, 0.35, 40), np.linspace(0.35, 0.15, 20)])
put(dedo_no_mapa(c['destino'] - c['dedo_comeca'], vel), c['dedo_comeca'], 1.0, -0.1)
put(polpa(1.0), c['destino'], 1.0, 0.05); put(brilhinho(), c['destino'] + 0.03, 1.0, 0.2)
for i, k in enumerate([0, 0.04, 0.08]): put(papel_desliza(0.2) * 0.6, c['tres'] + k, 1.0, (-0.6, 0, 0.6)[i])
for i, k in enumerate([0, 0.05, 0.1]): put(papel_desliza(0.25) * 0.6, c['encontro'] + k, 1.0, (-0.6, 0, 0.6)[i])
put(grafite(c['maos_sobem'] - c['linhas_descem'] + 0.1, 0.55), c['linhas_descem'], 1.0, 0.0)
put(tecido(0.5, 0.8), c['maos_sobem'], 1.0, 0.0)
put(papel_desliza(0.8) * 0.8, c['paineis_abrem'], 1.0, -0.5); put(papel_desliza(0.8) * 0.8, c['paineis_abrem'] + 0.05, 1.0, 0.5)
for i in range(3): put(sopro(0.35, 0.8), c['pessoinhas_voam'] + i * 0.08, 1.0, (-0.6, 0, 0.6)[i])
n = 14
for i in range(n): put(pop_papel(0.55 + 0.35 * rng.random()), c['copa'] + i * (c['ultima_pessoinha'] - 0.25 - c['copa']) / n, 1.0, rng.uniform(-0.3, 0.3))
put(pop_papel(1.1), c['ultima_pessoinha'], 1.0, 0.0); put(brilhinho(), c['ultima_pessoinha'] + 0.02, 1.0, 0.1)
put(papel_desliza(1.4) * 0.35, c['assinatura'] + 0.2, 1.0, 0.3)  # cauda de textura de papel

# ---------------------------------------------------------------- vozes
VOZ = os.path.join(AQUI, 'audio', 'vozes')
def carrega(nome):
    p = os.path.join(VOZ, nome + '.wav')
    if not os.path.exists(p): return None
    x, sr = sf.read(p, always_2d=True)
    x = x.mean(axis=1)
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) / SR, np.arange(len(x)) / sr, x)
    x = hp(x, 70)
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.08  # nível de conversa, igual entre as vozes
for v in c['vozes']:
    x = carrega(v['arquivo'])
    if x is not None: put(x, v['t'], 1.0, 0.0)

mix = np.stack([L, R], 1)
mix = lp(mix.T, 16000).T
os.makedirs(os.path.join(AQUI, 'audio'), exist_ok=True)
sf.write(os.path.join(AQUI, 'audio', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('ok audio/mix.wav', 'vozes:', [v['arquivo'] for v in c['vozes'] if os.path.exists(os.path.join(VOZ, v['arquivo'] + '.wav'))])
