# Trilha original do comercial do Semear, sintetizada em código (numpy). 120 BPM, 20 s.
# Ré maior, I–vi–IV–V (D, Bm, G, A), um acorde por compasso (2 s).
# Os efeitos (cliques, pops, whooshes) usam os mesmos tempos do index.html.
# Uso: python trilha.py  -> assets/audio/trilha.wav (48 kHz, estéreo)
import numpy as np, wave, os
from scipy.signal import lfilter

SR = 48000; DUR = 20.0; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
BEAT = 0.5

def hz(n): return 440.0 * 2 ** ((n - 69) / 12)          # midi -> Hz
def env(n, a, d, s=0.0, rel=None):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * (s + (1 - s) * np.exp(-t / d))
    if rel: e *= np.clip((n / SR - t) / rel, 0, 1)
    return e
def lp(x, fc):                                              # passa-baixa de um polo
    a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
def hp(x, fc): return x - lp(x, fc)
def put(t, sig, g=1.0, pan=0.0):
    i = int(t * SR); sig = sig[:max(0, N - i)]
    if i < 0 or len(sig) == 0: return
    L[i:i + len(sig)] += sig * g * np.sqrt(0.5 * (1 - pan)) * 1.414
    R[i:i + len(sig)] += sig * g * np.sqrt(0.5 * (1 + pan)) * 1.414
def saw(f, n, det=0.0):
    t = np.arange(n) / SR; x = np.zeros(n)
    for k in range(1, 24):
        if f * k > SR / 2.2: break
        x += np.sin(2 * np.pi * f * k * t * (1 + det)) / k
    return x * 0.6

# ---------------- instrumentos ----------------
def kick(g=1.0):
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t / .035); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t / .16) + .3 * rng.standard_normal(n) * np.exp(-t / .004)) * g
def clap():
    n = int(.3 * SR); x = hp(rng.standard_normal(n), 900); e = np.zeros(n)
    for o in (0, .011, .022): i = int(o * SR); e[i:] += np.exp(-np.arange(n - i) / SR / (.012 if o < .02 else .09))
    return lp(x * e, 6000) * .5
def hat(open_=False):
    n = int((.18 if open_ else .05) * SR); x = hp(rng.standard_normal(n), 7000)
    return x * env(n, .001, .06 if open_ else .014) * .35
def pluck(f, dur=.24, brilho=3500):
    n = int(dur * SR); x = saw(f, n, .002) + saw(f, n, -.002)
    return lp(x * env(n, .002, .09), brilho) * .32
def baixo(f, dur=.22):
    n = int(dur * SR); x = saw(f, n) + .6 * np.sin(2 * np.pi * f * np.arange(n) / SR)
    return lp(x * env(n, .004, .2, .5, .03), 520) * .55
def pad(fs, dur, g=.12):
    n = int(dur * SR); x = sum(saw(f, n, .003) + saw(f, n, -.003) for f in fs)
    return lp(x * env(n, .25, 9, 1, .5), 1600) * g
def marimba(f, dur=.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / .02)) * np.exp(-t / .22) * .35
def impacto(g=1.0):
    n = int(1.4 * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 80 * np.exp(-t / .06)) / SR) * np.exp(-t / .5)
    ruido = lp(rng.standard_normal(n), 2500) * np.exp(-t / .12) * .6
    return (sub + ruido) * g
def whoosh(dur=.35, sobe=True, g=.5):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    # filtro que varre: soma de dois passa-baixa com frequências diferentes, cruzando
    k = t / dur; amp = np.sin(np.pi * k) ** 1.6
    a = lp(x, 900); b = lp(x, 6000)
    mix = (k if sobe else 1 - k)
    return hp(a * (1 - mix) + b * mix, 200) * amp * g
def clique(g=.6):
    n = int(.03 * SR); t = np.arange(n) / SR
    return (hp(rng.standard_normal(n), 3000) * np.exp(-t / .002) + np.sin(2 * np.pi * 2400 * t) * np.exp(-t / .006) * .6) * g
def pop(f=900, g=.35):
    n = int(.09 * SR); t = np.arange(n) / SR
    fr = f * (1 + 1.5 * np.exp(-t / .01))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / .03) * g
def riser(dur, g=.35):
    n = int(dur * SR); t = np.arange(n) / SR; k = t / dur
    x = hp(rng.standard_normal(n), 1500) * k ** 2.2 * .5
    tom = np.sin(2 * np.pi * np.cumsum(200 + 900 * k ** 2) / SR) * k ** 2 * .3
    return (x + tom) * g
def raspa(dur=.4):
    n = int(dur * SR); t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 34 * t) ** 2) * np.sin(np.pi * t / dur)
    return x * .14

# ---------------- harmonia ----------------
D, Bm, G, A = [62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]
PROG = [D, Bm, G, A]
RAIZ = {id(D): 38, id(Bm): 35, id(G): 31, id(A): 33}
def acorde(t): return PROG[int(t // 2) % 4]

# ---------------- 0–3 s: gancho (uma pancada por palavra) ----------------
for i, t in enumerate([0.0, 0.5, 1.0, 1.5, 2.0]):
    put(t, impacto(.55 if i < 4 else .7))
    put(t, kick(1.0))
    ch = [D, Bm, G, A, D][i]
    for nn in ch: put(t, pluck(hz(nn + 12), .45, 2500), .55, (nn % 3 - 1) * .3)
    put(t, baixo(hz(RAIZ[id(ch)]), .45), .9)
put(2.25, riser(.6), .8)
put(2.6, whoosh(.45, True, .7))

# ---------------- 3–14,75 s: groove ----------------
def groove(t0, t1, cheio=True):
    t = t0
    while t < t1 - 1e-6:
        b = round(t / BEAT)
        put(t, kick(.95))
        if b % 2 == 1: put(t, clap(), .9, .05)
        put(t + .25, hat(b % 4 == 3), .8, .35)
        if cheio: put(t + .125, hat(), .45, -.35); put(t + .375, hat(), .45, -.35)
        ch = acorde(t); raiz = RAIZ[id(ch)]
        for k8 in range(2):                                   # baixo em colcheias com oitava no contratempo
            put(t + k8 * .25, baixo(hz(raiz + (12 if k8 else 0)), .2), .8)
        if cheio:                                             # arpejo em semicolcheias
            seq = [ch[0], ch[1], ch[2], ch[1] + 12]
            for s in range(4):
                nn = seq[(b * 4 + s) % 4] + 12
                put(t + s * .125, pluck(hz(nn), .2, 3000 + 1500 * ((s + b) % 2)), .42, -.4 + .8 * ((s + b) % 2))
        t += BEAT
groove(3.0, 6.5, cheio=False)          # o site se monta: groove mais seco
groove(6.5, 14.75, cheio=True)         # os recursos: groove cheio
for t in (3.0, 5.0, 7.0, 9.0, 11.0, 13.0): put(t, pad([hz(n) for n in acorde(t)], 2.0), 1.0)

# ---------------- 14,75–17 s: respiro e o número ----------------
put(14.45, riser(.55), 1.0)
put(15.0, impacto(1.0)); put(15.0, kick(1.1))
for nn in D: put(15.0, pluck(hz(nn + 12), .9, 2200), .6)
put(15.0, pad([hz(n) for n in D], 2.0, .14), 1.0)
for t in np.arange(15.5, 16.75, BEAT):
    put(t, kick(.7)); put(t + .25, hat(), .6, .3)
    put(t, baixo(hz(38), .22), .7)

# ---------------- 17–20 s: assinatura ----------------
put(17.0, impacto(.6)); put(17.0, kick(1.0))
put(17.0, pad([hz(n) for n in [62, 66, 69, 74]], 3.0, .13), 1.0)
pent = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95, 98, 100, 102, 105, 107, 110, 112]  # pentatônica de Ré subindo
for n_, nn in enumerate(pent): put(17.3 + n_ * .042, marimba(hz(nn - 12)), .55, -.6 + 1.2 * (n_ % 2))
put(18.0, kick(.9)); put(18.5, kick(.8))
for nn in [62, 66, 69, 74]: put(18.0, pluck(hz(nn), 1.2, 1800), .5)
put(19.0, impacto(.75)); put(19.0, kick(1.0))
for nn in [50, 62, 66, 69, 74, 78]: put(19.0, pluck(hz(nn), 1.0, 1600), .55)
put(19.0, pad([hz(n) for n in [50, 62, 66, 69]], 1.0, .16), 1.0)

# ---------------- efeitos de interface ----------------
for i, t in enumerate([3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75]): put(t, pop(700 + 120 * i, .4), 1.0, -.5 + i * .16)
put(3.0, whoosh(.4, False, .45))
put(5.0, whoosh(.3, True, .35), 1.0, -.3)
for t in (6.28, 8.78, 11.28, 13.78, 16.78): put(t, whoosh(.32, True, .65))   # chicotes entre cenas
put(7.0, pop(1300, .22)); put(7.5, pop(1500, .18))                           # submenu abre / hover
for t in (7.6, 9.5, 10.0, 12.0, 12.5, 13.0): put(t, clique(.75))              # cliques reais
put(7.62, whoosh(.2, True, .5))                                              # mergulho no clique
put(8.15, raspa(.4), 1.0, .2)                                                # seleção do texto
for t in (12.0, 12.5, 13.0): put(t + .02, whoosh(.3, False, .3), 1.0, .4)    # carrossel anda
put(14.0, kick(.8)); put(14.0, whoosh(.25, False, .35))                      # faixa IMPACTO desce
put(14.25, pop(600, .45))
put(15.5, pop(1100, .2)); put(15.75, pop(1250, .18))
put(19.0, pop(900, .3))

# ---------------- mix ----------------
fade = np.ones(N); nf = int(.6 * SR); fade[-nf:] = np.linspace(1, 0, nf) ** 2
L *= fade; R *= fade
pk = max(np.abs(L).max(), np.abs(R).max()); L /= pk; R /= pk
L = np.tanh(L * 1.6) / np.tanh(1.6); R = np.tanh(R * 1.6) / np.tanh(1.6)   # cola leve
os.makedirs('assets/audio', exist_ok=True)
x = (np.stack([L, R], 1) * 0.89 * 32767).astype(np.int16)
with wave.open('assets/audio/trilha.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes())
print('ok assets/audio/trilha.wav')
