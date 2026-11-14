"""Efeitos sonoros do piloto, sintetizados do zero (nada tirado do vídeo de referência).
Uso: python -I scripts/sfx.py  → escreve public/sfx/*.wav (48 kHz, mono).
Os sons vocais do PAÓ ("hm", piado) aqui são provisórios; no filme vêm do VoiceStudio.
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 48000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, r=0.1, curva=4.0):
    x = np.ones(n)
    na, nr = max(1, int(SR * a)), max(1, int(SR * r))
    x[:na] = np.linspace(0, 1, na)
    x[-nr:] *= np.exp(-curva * np.linspace(0, 1, nr))
    return x


def filtro(x, lo=None, hi=None, ordem=2):
    if lo and hi:
        b, a = butter(ordem, [lo / (SR / 2), hi / (SR / 2)], "band")
    elif lo:
        b, a = butter(ordem, lo / (SR / 2), "high")
    else:
        b, a = butter(ordem, hi / (SR / 2), "low")
    return lfilter(b, a, x)


def glide(f0, f1, d, forma="sin"):
    tt = t(d)
    f = np.geomspace(f0, f1, len(tt))
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) if forma == "sin" else np.sign(np.sin(fase)) * 0.5


def salva(nome, x, pico=0.9):
    x = np.asarray(x, dtype=np.float64)
    x = x / (np.max(np.abs(x)) + 1e-9) * pico
    wavfile.write(os.path.join(OUT, nome + ".wav"), SR, (x * 32767).astype(np.int16))


# ambiente: pad quente e baixo (sala de notificações), 8,2 s
tt = t(8.2)
pad = sum(np.sin(2 * np.pi * fr * tt + i) * g for i, (fr, g) in enumerate([(110, 1), (164.8, 0.6), (220, 0.35), (329.6, 0.15)]))
pad *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt) ** 2
pad += filtro(rng.normal(0, 0.3, len(tt)), hi=500)
salva("ambiente", pad * env(len(tt), a=0.6, r=0.8, curva=3), 0.25)

# olhar: tic curtinho e macio (sacada)
x = glide(1800, 2600, 0.05) * env(int(SR * 0.05), 0.002, 0.045, 6)
salva("olhar", x, 0.35)

# hm: zumbido nasal descendo (provisório)
d = 0.42
base = glide(260, 200, d)
x = sum(np.sin(np.arcsin(np.clip(base, -1, 1)) * k) / k for k in range(1, 6))
x = filtro(x, lo=180, hi=1400) * env(int(SR * d), 0.04, 0.2, 3)
salva("hm", x, 0.55)

# whoosh: ruído com banda subindo (a asa entrando)
d = 0.4
n = rng.normal(0, 1, int(SR * d))
partes = [filtro(n[i : i + 2400], lo=300 + 3000 * (i / len(n)), hi=900 + 5000 * (i / len(n))) for i in range(0, len(n), 2400)]
x = np.concatenate(partes)[: len(n)] * np.sin(np.linspace(0, np.pi, len(n))) ** 2
salva("whoosh", x, 0.6)

# clique: estalo + "tunk" grave do botão afundando
d = 0.35
c = filtro(rng.normal(0, 1, int(SR * 0.012)), lo=2500) * env(int(SR * 0.012), 0.0005, 0.011, 8)
tk = glide(190, 70, d) * env(int(SR * d), 0.001, 0.32, 7)
x = np.zeros(int(SR * d))
x[: len(c)] += c * 0.8
x += tk
salva("clique", x, 0.9)
salva("clique-leve", np.concatenate([c * 0.6, np.zeros(10)]).tolist() + (tk[: int(SR * 0.2)] * 0.5).tolist(), 0.6)

# faíscas: brilhinhos agudos aleatórios por 1,1 s
d = 1.1
x = np.zeros(int(SR * d))
for _ in range(14):
    i = rng.integers(0, len(x) - 4000)
    fr = rng.uniform(2800, 5200)
    s = np.sin(2 * np.pi * fr * t(0.08)) * env(int(SR * 0.08), 0.001, 0.075, 6)
    x[i : i + len(s)] += s * rng.uniform(0.3, 1)
salva("faiscas", x, 0.3)

# acende: "fuum" (sopro grave subindo) + acorde brilhante que abre
d = 1.8
tt = t(d)
fuum = filtro(rng.normal(0, 1, len(tt)), lo=80, hi=900) * env(len(tt), 0.05, 0.6, 5) * 0.6
acorde = np.zeros(len(tt))
for k, fr in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5]):
    ini = int(SR * (0.03 + k * 0.035))
    seg = tt[: len(tt) - ini]
    nota = (np.sin(2 * np.pi * fr * seg) + 0.3 * np.sin(2 * np.pi * fr * 2 * seg)) * np.exp(-seg * 2.2)
    acorde[ini:] += nota * 0.5
salva("acende", fuum + acorde, 0.95)

# pulo: boing curto subindo
d = 0.22
x = glide(220, 700, d) * env(int(SR * d), 0.003, 0.15, 4)
salva("pulo", x, 0.5)

# piado feliz: duas trinadas subindo (provisório)
x = np.concatenate([
    glide(1400, 2600, 0.09) * env(int(SR * 0.09), 0.004, 0.05, 3),
    np.zeros(int(SR * 0.03)),
    glide(1600, 3100, 0.13) * env(int(SR * 0.13), 0.004, 0.08, 3),
])
salva("piado", x, 0.5)

# pouso: baque fofo
d = 0.25
x = glide(120, 55, d) * env(int(SR * d), 0.001, 0.22, 6) + filtro(rng.normal(0, 0.4, int(SR * d)), hi=400) * env(int(SR * d), 0.001, 0.1, 8)
salva("pouso", x, 0.7)

print("ok:", sorted(os.listdir(OUT)))
