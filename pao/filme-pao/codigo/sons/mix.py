"""Trilha, efeitos e mixagem do filme do PAÓ, na linha do tempo do próprio filme.
- Lê out/planos.json e out/cues.json (exportados pelo render.mjs).
- Trilha original sintetizada aqui, seguindo a curva de energia do vídeo de referência
  (nada da música original é usado). Efeitos sintetizados aqui.
- Vozes do PAÓ: arquivos gerados no VoiceStudio (sons/voz/*.wav).
Uso: python -I sons/mix.py  → out/trilha.wav (48 kHz, estéreo)
"""
import json, os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

SR = 48000
BASE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(BASE)
rng = np.random.default_rng(11)

planos = json.load(open(os.path.join(RAIZ, "out", "planos.json"), encoding="utf8"))
cues = json.load(open(os.path.join(RAIZ, "out", "cues.json"), encoding="utf8"))
TOTAL = planos[-1]["ini"] + planos[-1]["dur"]
N = int(SR * (TOTAL + 1.5))
T = {p["q"]: p["ini"] for p in planos}


# ── utilidades ─────────────────────────────────────────────────────────────
def tt(d):
    return np.arange(int(SR * d)) / SR


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    na, nd, nr = int(SR * a), int(SR * d), int(SR * r)
    na = max(1, min(na, n)); e[:na] = np.linspace(0, 1, na)
    nd = max(1, min(nd, n - na)); e[na:na + nd] = np.linspace(1, s, nd)
    nr = max(1, min(nr, n)); e[-nr:] *= np.linspace(1, 0, nr)
    return e


def filt(x, tipo, f, ordem=2):
    sos = butter(ordem, np.array(f) / (SR / 2), tipo, output="sos")
    return sosfilt(sos, x)


def hz(nota):  # 'A4', 'C#5' → Hz
    nomes = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, o = nota[:-1], int(nota[-1])
    return 440 * 2 ** ((nomes[n] + (o - 4) * 12) / 12)


def poe(bus, x, t, vol=1.0, pan=0.0):
    i = int(t * SR)
    if i >= bus.shape[1] or i + len(x) <= 0:
        return
    x = x[: bus.shape[1] - i] * vol
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i:i + len(x)] += x * l * 1.41
    bus[1, i:i + len(x)] += x * r * 1.41


def reverb(bus, seg=1.8, mix=0.25):
    n = int(SR * seg)
    ir = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 7, n))
    ir = filt(ir, "lowpass", 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    out = np.zeros_like(bus)
    for c in range(2):
        out[c] = (1 - mix) * bus[c] + mix * fftconvolve(bus[c], ir * (1 if c == 0 else -1) + ir[::-1] * 0.0, "full")[: bus.shape[1]] * 0.6
    return out


# ── instrumentos ───────────────────────────────────────────────────────────
def ep(f, d, vel=0.6):  # piano elétrico (FM curto)
    x = tt(d + 0.6)
    idx = 2.2 * np.exp(-x * 6)
    y = np.sin(2 * np.pi * f * x + idx * np.sin(2 * np.pi * f * x)) * np.exp(-x * 1.6)
    y += 0.25 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 4)
    y *= 1 + 0.15 * np.sin(2 * np.pi * 5 * x)
    return y * adsr(len(x), 0.004, 0.2, 0.8, 0.5) * vel


def piano(f, d, vel=0.6):
    x = tt(d + 1.2)
    y = sum(np.sin(2 * np.pi * f * k * x * (1 + 0.0004 * k * k)) * np.exp(-x * (1.2 + k * 0.9)) / k for k in range(1, 7))
    y += filt(rng.normal(0, 0.3, len(x)), "bandpass", [800, 3000]) * np.exp(-x * 60)
    return y * adsr(len(x), 0.002, 0.1, 0.9, 0.6) * vel


def pad(f, d, vel=0.25, brilho=2000):
    x = tt(d)
    y = sum(((2 * ((f * k * x) % 1) - 1)) for k in (0.997, 1.0, 1.004, 2.002))
    y = filt(y, "lowpass", brilho)
    return y * adsr(len(x), min(0.8, d * 0.3), 0.3, 0.9, min(1.0, d * 0.4)) * vel * 0.3


def pluck(f, d, vel=0.5):  # Karplus-Strong
    n = int(SR * (d + 0.4))
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return filt(y, "lowpass", 5000) * vel


def marimba(f, vel=0.5):
    x = tt(0.6)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x * 9) + 0.3 * np.sin(2 * np.pi * f * 3.93 * x) * np.exp(-x * 30)
    return y * vel


def sino(f, d=1.6, vel=0.4):
    x = tt(d)
    return (np.sin(2 * np.pi * f * x + 1.5 * np.exp(-x * 3) * np.sin(2 * np.pi * f * 3.5 * x)) * np.exp(-x * 2.2)) * vel


def baixo(f, d, vel=0.5):
    x = tt(d)
    y = np.sin(2 * np.pi * f * x) + 0.3 * filt(2 * ((f * x) % 1) - 1, "lowpass", 400)
    return y * adsr(len(x), 0.005, 0.1, 0.8, 0.08) * vel


def bumbo(vel=0.8):
    x = tt(0.35)
    f = 50 + 120 * np.exp(-x * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9) * vel


def palma(vel=0.4):
    x = tt(0.2)
    return filt(rng.normal(0, 1, len(x)), "bandpass", [900, 3500]) * np.exp(-x * 25) * vel


def chimbal(vel=0.15):
    x = tt(0.06)
    return filt(rng.normal(0, 1, len(x)), "highpass", 7000) * np.exp(-x * 70) * vel


# ── trilha (seções na linha do tempo) ──────────────────────────────────────
mus = np.zeros((2, N))
ACORDES = {  # dó maior / lá menor
    "F": ["F3", "A3", "C4", "E4"], "G": ["G3", "B3", "D4", "F#4"], "Em": ["E3", "G3", "B3", "D4"],
    "Am": ["A3", "C4", "E4", "G4"], "C": ["C3", "E3", "G3", "B3"], "Dm": ["D3", "F3", "A3", "C4"],
    "G7": ["G3", "B3", "D4", "F4"],
}
PROG = ["F", "G", "Em", "Am"]


def secao(t0, t1, bpm, fn):
    b = 60 / bpm
    k = 0
    t = t0
    while t < t1 - 0.05:
        fn(t, k, b, t1)
        k += 1
        t += b


def lofi(t, k, b, t1):  # 001–008: noite, piano elétrico calmo
    if k % 4 == 0:
        ac = ACORDES[PROG[(k // 4) % 4]]
        for i, n in enumerate(ac):
            poe(mus, ep(hz(n), b * 3.6, 0.22), t + i * 0.02, 1, -0.3 + i * 0.2)
        poe(mus, baixo(hz(ac[0]) / 2, b * 3.5, 0.25), t)
    if k % 2 == 1:
        poe(mus, chimbal(0.05), t, pan=0.4)


def central(t, k, b, t1):  # 009–015: acende, arpejos subindo
    ac = ACORDES[PROG[(k // 8) % 4]]
    n = ac[k % 4] if (k // 4) % 2 == 0 else ac[3 - k % 4]
    poe(mus, pluck(hz(n) * 2, b, 0.3), t, pan=0.3 * np.sin(k))
    if k % 8 == 0:
        for nn in ac:
            poe(mus, pad(hz(nn), b * 8, 0.12, 1800 + k * 40), t)
    if k % 2 == 0:
        poe(mus, chimbal(0.06), t + b / 2, pan=-0.3)


def ponte(t, k, b, t1):  # 016–017: frase de piano
    frase = ["E5", "G5", "C6", "B5", "G5", "E5", "D5", "C5"]
    poe(mus, piano(hz(frase[k % 8]), b * 1.5, 0.35), t, pan=0.1)
    if k % 4 == 0:
        for nn in ACORDES[["F", "G"][(k // 4) % 2]][:3]:
            poe(mus, piano(hz(nn), b * 3, 0.18), t)


def tentativa(t, k, b, t1, energia=0.6):  # 018–034: marimba brincalhona
    ac = ACORDES[PROG[(k // 8) % 4]]
    padrao = [0, None, 2, 1, None, 3, 2, None]
    i = padrao[k % 8]
    if i is not None:
        poe(mus, marimba(hz(ac[i]) * 2, 0.32 * energia + 0.1), t, pan=0.2)
    if k % 4 == 0:
        poe(mus, baixo(hz(ac[0]) / 2, b * 1.8, 0.3 * energia), t)
        poe(mus, bumbo(0.35 * energia), t)
    if k % 2 == 1:
        poe(mus, chimbal(0.07), t, pan=-0.4)


def montagem(t, k, b, t1):  # 035–043 e 050–056: mais energia
    tentativa(t, k, b, t1, energia=1.0)
    poe(mus, bumbo(0.5), t) if k % 2 == 0 else poe(mus, palma(0.25), t)
    ac = ACORDES[PROG[(k // 8) % 4]]
    poe(mus, pluck(hz(ac[(k * 3) % 4]) * 4, b * 0.5, 0.18), t + b / 2, pan=-0.4)


def espera(t, k, b, t1):  # 044–049 / 057–066: energia cai
    if k % 8 == 0:
        ac = ACORDES[["Am", "F", "Dm", "Em"][(k // 8) % 4]]
        for nn in ac[:3]:
            poe(mus, pad(hz(nn), b * 8, 0.1, 900), t)
        poe(mus, piano(hz(ac[0]) * 2, b * 4, 0.18), t + b)


def leve(t, k, b, t1):  # 070–077: música mais leve que vai retomando energia
    ac = ACORDES[["C", "G", "Am", "F"][(k // 4) % 4]]
    poe(mus, pluck(hz(ac[k % 4]) * 2, b, 0.28), t, pan=0.3)
    if k % 2 == 0:
        poe(mus, bumbo(0.3 + 0.2 * (t - T["073"] > 0)), t)
    if k % 4 == 2:
        poe(mus, palma(0.2), t)
    if k % 4 == 0:
        poe(mus, baixo(hz(ac[0]) / 2, b * 3.5, 0.3), t)


def resolucao(t, k, b, t1):  # 082–090: expansão e resolução acolhedora
    prog = ["F", "G", "Em", "Am", "F", "G", "C", "C"]
    if k % 4 == 0:
        ac = ACORDES[prog[(k // 4) % 8]]
        for nn in ac:
            poe(mus, pad(hz(nn), b * 4.2, 0.16, 3000), t)
            poe(mus, piano(hz(nn), b * 3.5, 0.12), t + 0.01)
        poe(mus, baixo(hz(ac[0]) / 2, b * 4, 0.3), t)
    melodia = ["E5", "D5", "C5", "D5", "E5", "G5", "E5", "D5"]
    if k % 2 == 0:
        poe(mus, piano(hz(melodia[(k // 2) % 8]), b * 2, 0.28), t, pan=0.15)
    if k % 8 == 4:
        poe(mus, sino(hz("C6"), 2, 0.12), t, pan=-0.3)


secao(0, T["009-010"], 82, lofi)
secao(T["009-010"], T["016-017"], 100, central)
secao(T["016-017"], T["018"], 100, ponte)
secao(T["018"], T["021"] + 0.15, 100, tentativa)
secao(T["021"] + 0.6, T["035-036"], 100, tentativa)  # buraco no susto (021)
secao(T["035-036"], T["044"], 108, montagem)
secao(T["044"], T["050"], 70, espera)
secao(T["050"], T["057"], 104, montagem)
secao(T["057"], T["063-066"] + 1.0, 64, espera)
secao(T["070-072"], T["078-079"], 104, leve)
# 078–081: pausa antes do sinal (só um drone baixo)
poe(mus, pad(hz("A2"), T["082"] - T["078-079"], 0.09, 500), T["078-079"])
secao(T["082"] + 0.35, TOTAL - 0.2, 76, resolucao)
# assinatura sonora breve e final limpo
for i, n in enumerate(["C5", "E5", "G5", "C6"]):
    poe(mus, sino(hz(n), 2.5, 0.22), T["088-090"] + 0.45 + i * 0.07, pan=-0.3 + i * 0.2)
for nn in ACORDES["C"]:
    poe(mus, pad(hz(nn), 3.2, 0.18, 2500), T["088-090"] + 0.4)
mus = reverb(mus, 2.2, 0.3)


# ── efeitos ────────────────────────────────────────────────────────────────
def ruido(d, lo=None, hi=None):
    x = rng.normal(0, 1, int(SR * d))
    if lo and hi: return filt(x, "bandpass", [lo, hi])
    if lo: return filt(x, "highpass", lo)
    return filt(x, "lowpass", hi)


def glide(f0, f1, d):
    x = tt(d)
    f = np.geomspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def dec(n, k):
    return np.exp(-np.linspace(0, k, n))


def tecla(v=0.4):
    c = ruido(0.025, 1500, 6000) * dec(int(SR * 0.025), 8)
    b = glide(220, 120, 0.04) * dec(int(SR * 0.04), 6) * 0.4
    y = np.zeros(int(SR * 0.05)); y[: len(c)] += c; y[: len(b)] += b
    return y * v


def rajada(d, cps, v=0.4, s=0):
    y = np.zeros(int(SR * d))
    t = 0.0
    r = np.random.default_rng(s)
    while t < d - 0.06:
        k = tecla(v * r.uniform(0.6, 1)); i = int(t * SR); y[i:i + len(k)] += k[: len(y) - i]
        t += r.uniform(0.6, 1.4) / cps
    return y


def bip(f=1800, d=0.08, v=0.4):
    return np.sin(2 * np.pi * f * tt(d)) * dec(int(SR * d), 5) * v


def pop_(v=0.5):
    return glide(500, 1200, 0.07) * dec(int(SR * 0.07), 5) * v


def whoosh(d=0.5, v=0.5):
    n = int(SR * d)
    x = rng.normal(0, 1, n)
    out = np.concatenate([filt(x[i:i + 2400], "bandpass", [300 + 3000 * i / n, 900 + 6000 * i / n]) for i in range(0, n, 2400)])[:n]
    return out * np.sin(np.linspace(0, np.pi, n)) ** 2 * v


def clique(peso=1.0):
    c = ruido(0.012, 2500) * dec(int(SR * 0.012), 8)
    tk = glide(200 / peso, 70 / peso, 0.3 * peso) * dec(int(SR * 0.3 * peso), 7)
    y = np.zeros(int(SR * 0.3 * peso)); y[: len(c)] += c * 0.8; y += tk
    return y


def notif(v=0.4, alto=1.0):
    return np.concatenate([bip(1320 * alto, 0.07, v), np.zeros(int(SR * 0.02)), bip(1760 * alto, 0.12, v)])


def luz(f, v=0.5):  # "tunk" elétrico de acender
    x = tt(0.6)
    return (np.sin(2 * np.pi * f * x) * dec(len(x), 6) + 0.4 * ruido(0.6, 60, 400) * dec(len(x), 10)) * v


def acorde_brilho(notas, d=1.8, v=0.6):
    x = tt(d)
    y = np.zeros(len(x))
    for i, n in enumerate(notas):
        ini = int(SR * i * 0.04); f = hz(n)
        y[ini:] += (np.sin(2 * np.pi * f * x[: len(x) - ini]) + 0.3 * np.sin(4 * np.pi * f * x[: len(x) - ini])) * np.exp(-x[: len(x) - ini] * 2)
    return y * v / len(notas)


def seq(itens, d):
    """posiciona sons [(t, array)] numa faixa de d segundos"""
    y = np.zeros(int(SR * d))
    for t0, a in itens:
        i = int(t0 * SR)
        if i < len(y):
            y[i:i + len(a)] += a[: len(y) - i]
    return y


def amb(tipo, d):
    n = int(SR * d)
    if tipo == "amb-noite":
        y = ruido(d, hi=300) * 0.25
        for i in range(int(d * 2)):  # grilos bem longe
            k = int(rng.uniform(0, max(1, n - SR // 4)))
            ch = np.sin(2 * np.pi * 4200 * tt(0.15)) * (np.sin(2 * np.pi * 30 * tt(0.15)) > 0) * dec(int(SR * 0.15), 3) * 0.04
            y[k:k + len(ch)] += ch[: n - k]
    elif tipo == "amb-sala":
        y = ruido(d, hi=220) * 0.3 + 0.05 * np.sin(2 * np.pi * 110 * tt(d))
    else:
        y = ruido(d, 200, 900) * 0.08 + 0.04 * np.sin(2 * np.pi * 220 * tt(d)) * (1 + 0.3 * np.sin(2 * np.pi * 0.3 * tt(d)))
    return y * adsr(n, 0.4, 0.1, 1, 0.6)


SFX = {
    "teclas": lambda: rajada(2.4, 9, 0.35, 1),
    "teclas-rapido": lambda: rajada(1.8, 16, 0.4, 2),
    "digita": lambda: rajada(1.6, 22, 0.25, 3),
    "apaga": lambda: rajada(0.4, 30, 0.3, 4),
    "ideia": lambda: acorde_brilho(["E5", "G5", "C6"], 1.2, 0.35),
    "ui-abre": lambda: glide(600, 1400, 0.15) * dec(int(SR * 0.15), 4) * 0.4,
    "enviar": lambda: np.concatenate([clique(0.6) * 0.5, whoosh(0.35, 0.4)]),
    "subida": lambda: whoosh(0.5, 0.6),
    "luz-1": lambda: luz(70), "luz-2": lambda: luz(90), "luz-3": lambda: luz(120, 0.6),
    "pop": lambda: pop_(0.45),
    "notif": lambda: notif(0.35),
    "asas": lambda: whoosh(0.25, 0.35),
    "papel": lambda: ruido(0.35, 2000, 8000) * dec(int(SR * 0.35), 4) * 0.35,
    "ui-card": lambda: np.concatenate([bip(900, 0.05, 0.3), bip(700, 0.08, 0.25)]),
    "transicao": lambda: whoosh(0.7, 0.55),
    "ui-bip": lambda: bip(2000, 0.06, 0.25),
    "clique-macio": lambda: clique(0.8) * 0.8,
    "clique-pesado": lambda: clique(1.4),
    "espiar": lambda: glide(300, 700, 0.18) * dec(int(SR * 0.18), 3) * 0.3,
    "passinho": lambda: glide(160, 90, 0.08) * dec(int(SR * 0.08), 6) * 0.4,
    "passos": lambda: seq([(i * 0.19, glide(160, 90, 0.07) * dec(int(SR * 0.07), 6) * 0.35) for i in range(11)], 2.4),
    "check": lambda: np.concatenate([bip(1200, 0.05, 0.3), bip(1600, 0.09, 0.3)]),
    "ui-rola": lambda: ruido(0.5, 1000, 5000) * dec(int(SR * 0.5), 3) * 0.12,
    "postar": lambda: np.concatenate([clique(0.7), bip(1046, 0.08, 0.3), bip(1568, 0.14, 0.3)]),
    "espera": lambda: np.zeros(10),
    "zumbido": lambda: (np.sin(2 * np.pi * 120 * tt(0.6)) * 0.15 + ruido(0.6, 100, 300) * 0.1) * adsr(int(SR * 0.6), 0.05, 0.1, 1, 0.2),
    "mecanica": lambda: seq([(i * 0.3, glide(500, 900, 0.12) * dec(int(SR * 0.12), 3) * 0.25) for i in range(4)], 1.4),
    "oculos": lambda: ruido(0.15, 3000, 9000) * dec(int(SR * 0.15), 5) * 0.25,
    "oculos-mesa": lambda: (np.sin(2 * np.pi * 2600 * tt(0.12)) * 0.3 + ruido(0.12, 2000, 6000) * 0.3) * dec(int(SR * 0.12), 9),
    "afunda": lambda: glide(300, 90, 0.8) * dec(int(SR * 0.8), 2) * 0.25,
    "mecanismo": lambda: np.concatenate([clique(0.5) * 0.6, glide(120, 260, 1.0) * 0.25 * adsr(int(SR * 1.0), 0.1, 0.1, 1, 0.3), clique(0.6) * 0.5]),
    "pulinho": lambda: glide(250, 700, 0.18) * dec(int(SR * 0.18), 3) * 0.4,
    "likes": lambda: seq([(2.8 * (i / 24) ** 0.6, pop_(0.25 + 0.2 * i / 24)) for i in range(24)], 3.4),
    "comentario-acende": lambda: np.concatenate([notif(0.5, 1.12), acorde_brilho(["C5", "E5", "G5", "C6", "E6"], 2.0, 0.7)]),
    "rede-acende": lambda: seq([(i * 0.06, bip(1046 * 2 ** (i / 12), 0.12, 0.18)) for i in range(0, 12, 2)], 1.4),
    "assinatura": lambda: np.zeros(10),
    "ponte-piano": lambda: np.zeros(10),
    "musica-leve": lambda: np.zeros(10),
}

# vozes do PAÓ (VoiceStudio): tomada escolhida + leve subida de tom (timbre de passarinho)
ESCOLHA = {"pao-choro": 21, "pao-surpresa": 21}


def voz(nome):
    seed = ESCOLHA.get(nome, 7)
    sr, x = wavfile.read(os.path.join(BASE, "voz", f"{nome}-{seed}.wav"))
    x = x.astype(np.float64) / 32768
    if x.ndim > 1: x = x.mean(axis=1)
    # 24 kHz → 48 kHz e +2 semitons (reamostragem leve)
    x = resample_poly(x, 2 * 100, 112)
    x = filt(x, "highpass", 140)
    # corta silêncio do começo
    i = np.argmax(np.abs(x) > 0.02)
    return x[max(0, i - 200):] / (np.max(np.abs(x)) + 1e-9) * 0.8


efx = np.zeros((2, N))
vozbus = np.zeros((2, N))
ambs = sorted([c for c in cues if c["nome"].startswith("amb-")], key=lambda c: c["t"])
for i, c in enumerate(ambs):
    fim = ambs[i + 1]["t"] + 0.6 if i + 1 < len(ambs) else c["t"] + 8
    poe(efx, amb(c["nome"], fim - c["t"]), c["t"], c["vol"] * 0.5)
for c in cues:
    nm = c["nome"]
    if nm.startswith("amb-"):
        continue
    if nm.startswith("pao-"):
        poe(vozbus, voz(nm), c["t"], c["vol"], 0.0)
    elif nm in SFX:
        poe(efx, SFX[nm](), c["t"], c["vol"], float(rng.uniform(-0.3, 0.3)))
    else:
        print("sem som:", nm)
efx = reverb(efx, 0.8, 0.15)

# duck da trilha quando o PAÓ "fala"
env = np.abs(vozbus[0]) + np.abs(vozbus[1])
env = filt(env, "lowpass", 8)
duck = 1 - 0.45 * np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
mixf = mus * duck * 0.55 + efx * 0.8 + vozbus * 0.9
mixf = np.tanh(mixf * 1.2) / 1.2
mixf /= np.max(np.abs(mixf)) + 1e-9
mixf *= 0.89
out = os.path.join(RAIZ, "out", "trilha.wav")
wavfile.write(out, SR, (mixf.T * 32767).astype(np.int16))
print("ok:", out, f"{N / SR:.1f}s")
