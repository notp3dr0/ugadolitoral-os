"""Trilha da Nadini (sintetizada, sem samples nem direitos de terceiros). O vídeo é um LOOP: as notas que
passam do fim dão a volta e soam no começo, e não há fade — o último compasso emenda no primeiro.

Intenção por trecho (cortes medidos da voz real, recalculados de src/data/vo.json com as mesmas
constantes de src/utils/timing.ts):
  s1–s2: groove de "música de loja" em dó maior, 104 bpm, baixo sincopado + pizzicato
  s3–s7: os planos: entra o chimbal e o bumbo, a melodia sobe meio tom a cada plano (tensão cômica)
  s8: corta no "Os dois chefes se olharam" (silêncio dramático) e volta com acorde no "demitida"
  s9: a partir de "pessoa" a trilha some sob a fita rebobinando; o compasso 1 recomeça no frame 0

Uso: python scripts/music.py  -> public/audio/music.wav
"""

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "music.wav"
SR = 48000
FPS = 30
rng = np.random.default_rng(7)

# ---- mesma conta de src/utils/timing.ts (mantenha em sincronia)
FIRST_VO, LEAD, TAIL = 0.3, 0.25, 1.15
GAPS = [0.45, 0.5, 0.55, 0.85, 0.6, 0.5, 0.6, 0.5]
KEYS = [f"s{i}" for i in range(1, 10)]
VO = json.loads((ROOT / "src" / "data" / "vo.json").read_text(encoding="utf-8"))
starts, t = {}, FIRST_VO
for i, k in enumerate(KEYS):
    starts[k] = t
    t += VO[k]["seconds"] + (GAPS[i] if i < len(GAPS) else 0)
vo_end = starts["s9"] + VO["s9"]["seconds"]
DUR = round((vo_end + TAIL) * FPS) / FPS
N = round(DUR * SR)
S = [0.0] + [round((starts[k] - LEAD) * FPS) / FPS for k in KEYS[1:]]


def word(k, i):
    return starts[k] + VO[k]["words"][i]["start"]


LOOK = word("s8", 5)  # "Os dois chefes se olharam"
FIRED = word("s8", 13)  # "demitida"
REWIND = word("s9", 6)  # "pessoa": começa a rebobinar


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
    """Coloca o som no loop: o que passa do fim continua no começo."""
    if sig.ndim == 1:
        sig = np.stack([sig * np.cos((p + 1) * np.pi / 4), sig * np.sin((p + 1) * np.pi / 4)], axis=1) * 1.41
    i = int(round(at * SR)) % N
    n = min(len(sig), N)
    first = min(n, N - i)
    bus[i : i + first] += sig[:first] * gain
    if n > first:
        bus[: n - first] += sig[first:n] * gain


def pizz(m, d=0.35):
    t = tt(d)
    f = hz(m)
    y = sum(np.sin(2 * np.pi * f * k * t) / k**1.3 for k in range(1, 6))
    return lp(y * np.exp(-t / 0.09) * (1 - np.exp(-t / 0.002)), 3200)


def epiano(m, d=0.9):
    t = tt(d)
    f = hz(m)
    y = np.sin(2 * np.pi * f * t + 0.8 * np.exp(-t / 0.3) * np.sin(2 * np.pi * f * 2 * t))
    return y * np.exp(-t / 0.4) * (1 - np.exp(-t / 0.004))


def bass(m, d=0.3):
    t = tt(d)
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return lp(y * np.exp(-t / 0.18) * (1 - np.exp(-t / 0.003)), 900)


def kick():
    t = tt(0.25)
    f = 50 + 90 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)


def hat():
    t = tt(0.05)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t / 0.012) * 0.4


def snap():
    t = tt(0.12)
    return hp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.03) * 0.7


BEAT = 60 / 104
STEP = BEAT / 2
PROG = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]]  # Cmaj7 Am7 Dm7 G7
BASS = [36, 36, 43, 36, 33, 33, 40, 33, 38, 38, 45, 38, 31, 31, 38, 31]
MEL = [76, None, 79, 76, None, 74, 72, None, 74, None, 76, None, 72, None, None, None]


def plan_of(t):
    """0 nas cenas 1–2, 1/2/3 nos planos 1–3 (cenas 3–4, 5, 6–7)."""
    if t < S[2]:
        return 0
    if t < S[4]:
        return 1
    if t < S[5]:
        return 2
    return 3


def muted(t):
    return LOOK - 0.05 <= t < FIRED - 0.02 or t >= REWIND - 0.1


k = 0
t = 0.0
while t < DUR - 1e-6:
    if not muted(t):
        plan = plan_of(t)
        bar = int(t / (BEAT * 4))
        chord = PROG[bar % 4]
        up = plan if t < LOOK else 3  # meio tom acima a cada plano
        if k % 2 == 0 or k % 8 == 3:
            place(bass(BASS[k % 16] + up, 0.32), t, 0.62, -0.1)
        if k % 4 == 2:
            for j, m in enumerate(chord):
                place(epiano(m + up, 0.7), t + j * 0.006, 0.12, -0.3 + 0.2 * j)
        mm = MEL[k % 16]
        if mm is not None and bar % 2 == 1:
            place(pizz(mm + up, 0.3), t, 0.3, 0.35)
        if plan >= 1 and k % 2 == 1:
            place(hat(), t, 0.45)
        if plan >= 2 and k % 4 == 0:
            place(kick(), t, 0.55)
        if plan >= 3 and k % 8 == 4:
            place(snap(), t, 0.4)
    t += STEP
    k += 1

# acorde de impacto no "demitida" (dó menor) e respiro até o rebobinar
for j, m in enumerate([48, 60, 63, 67, 72]):
    place(epiano(m, 1.6), FIRED + j * 0.01, 0.2, -0.4 + 0.2 * j)
place(kick(), FIRED, 0.8)

# ---------------------------------------------------------------- mixagem (sem fade: é loop)
mix = hp(bus, 35)
mix = np.tanh(mix * 1.2)
mix *= 0.85 / (np.max(np.abs(mix)) + 1e-9)
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, mix.astype(np.float32), SR, subtype="PCM_16")
print(f"music: {OUT} ({DUR:.2f}s, cortes {S})")
