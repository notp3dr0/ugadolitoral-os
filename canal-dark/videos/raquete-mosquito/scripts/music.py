"""Trilha da raquete de mosquito (sintetizada, sem samples nem direitos de terceiros).

Intenção por trecho (início das cenas em segundos, medido da voz real):
  quarto (s1–s4): pizzicato "pé ante pé" em lá menor, cômico e discreto
  dentro da raquete (s5–s8): pulso eletrônico que vai abrindo o filtro conforme a tensão sobe
  estalo (s9): corte seco ~0,35 s antes do "Estalo" e volta leve
  final (s11): caixinha de música em valsa, dó maior, fade

Uso: python scripts/music.py  -> public/audio/music.wav
"""

from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "music.wav"
SR = 48000
DUR = 91.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

# início de cada cena (s), dos cortes derivados da voz
S = [0.0, 8.47, 15.0, 21.43, 29.87, 38.73, 46.23, 55.3, 63.8, 73.07, 81.1]
ZAP = 70.62  # "Estalo"


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


bus = np.zeros((N, 2))


def place(sig, at, gain=1.0, p=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    if sig.ndim == 1:
        sig = np.stack([sig * np.cos((p + 1) * np.pi / 4), sig * np.sin((p + 1) * np.pi / 4)], axis=1) * 1.41
    seg = sig[: N - i]
    bus[i : i + len(seg)] += seg * gain


def pizz(m, d=0.35):
    t = tt(d)
    f = hz(m)
    y = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 for k in range(1, 6))
    return lp(y * np.exp(-t / 0.09) * (1 - np.exp(-t / 0.002)), 3200)


def pulse(m, d=0.12, cut=1500):
    t = tt(d)
    y = np.sign(np.sin(2 * np.pi * hz(m) * t)) * 0.5 + 2 * ((hz(m) * t) % 1) - 1
    return lp(y * np.exp(-t / 0.05), cut)


def kick():
    t = tt(0.25)
    f = 50 + 90 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)


def hat():
    t = tt(0.05)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t / 0.012) * 0.4


def boxnote(m, d=1.4):
    t = tt(d)
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.2)
    return y * np.exp(-t / 0.45) * (1 - np.exp(-t / 0.003))


def silent(t0, t1):
    return lambda t: not (t0 <= t < t1)


# ---------------------------------------------------------------- 1) quarto: pizzicato pé ante pé (110 bpm)
BEAT = 60 / 110
def sneaky(t0, t1, gain=1.0, ok=lambda t: True):
    bass = [45, 45, 40, 40, 41, 41, 40, 44]
    mel = [69, None, 72, None, 76, 75, None, 72, 69, None, 71, None, 72, None, 68, None]
    k = 0
    t = t0
    while t < t1:
        if ok(t):
            if k % 2 == 0:
                place(pizz(bass[(k // 2) % len(bass)] - 12 + 12, 0.5), t, 0.55 * gain, -0.2)
            m = mel[k % len(mel)]
            if m is not None and (k // 16) % 2 == 1:
                place(pizz(m, 0.3), t, 0.32 * gain, 0.3)
        t += BEAT / 2
        k += 1


sneaky(0.3, S[4] - 0.2)

# ---------------------------------------------------------------- 2) dentro da raquete: pulso eletrônico (120 bpm)
B2 = 60 / 120
prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
t = S[4] + 0.4
k = 0
while t < ZAP - 0.35:
    bar = int((t - S[4]) / (B2 * 4))
    chord = prog[bar % 4]
    rise = np.clip((t - S[4]) / (S[8] - S[4]), 0, 1)
    cut = 700 + 3800 * rise
    place(pulse(chord[k % 3] + 12, 0.12, cut), t, 0.22 + 0.08 * rise, 0.25 * np.sin(k))
    if k % 4 == 0:
        place(kick(), t, 0.5 * (0.5 + 0.5 * rise))
        place(pizz(chord[0] - 12, 0.4), t, 0.4)
    if k % 2 == 1 and rise > 0.35:
        place(hat(), t, 0.5)
    t += B2 / 4 * 2
    k += 1

# ---------------------------------------------------------------- 3) depois do estalo: volta leve
sneaky(ZAP + 0.9, S[10] - 0.3, 0.7)

# ---------------------------------------------------------------- 4) final: caixinha de música (valsa)
BW = 60 / 132
waltz = [72, 76, 79, 76, 77, 74, 72, 71, 72, 79, 84, 79, 77, 76, 74, 72]
for i, m in enumerate(waltz):
    at = S[10] + 0.3 + i * BW
    if at > DUR - 1.5:
        break
    place(boxnote(m, 1.6), at, 0.3, 0.2)
    if i % 3 == 0:
        place(boxnote(48 + (0 if (i // 3) % 2 == 0 else 7), 2.0), at, 0.22, -0.3)

# ---------------------------------------------------------------- mixagem
tf = np.arange(N) / SR
mix = bus
mix = hp(mix, 35)
mix *= (np.clip((DUR - tf) / 1.5, 0, 1) ** 1.5)[:, None]
mix = np.tanh(mix * 1.2)
mix *= 0.85 / (np.max(np.abs(mix)) + 1e-9)
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, mix.astype(np.float32), SR, subtype="PCM_16")
print(f"music: {OUT} ({DUR:.1f}s)")
