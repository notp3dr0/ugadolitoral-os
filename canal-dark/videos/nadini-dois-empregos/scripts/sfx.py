"""Sintetiza os efeitos sonoros do vídeo (tudo gerado por código, sem samples).

Uso:
    python scripts/sfx.py          -> public/audio/sfx/*.wav
"""

from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "sfx"
SR = 48000
rng = np.random.default_rng(31)


def tt(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def sweep_bp(x, centers, q=1.6, block=256):
    out = np.zeros_like(x)
    zi = None
    for b in range(0, len(x), block):
        c = float(np.clip(centers[min(b, len(centers) - 1)], 60, 16000))
        sos = butter(2, [c / q, min(c * q, SR * 0.45)], "band", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
        out[b : b + block], zi = sosfilt(sos, x[b : b + block], axis=0, zi=zi)
    return out


def pan(x, p):
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], axis=1)


def env(d, a, r):
    t = tt(d)
    return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)


def save(name, x, peak=0.89):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    sf.write(OUT / f"{name}.wav", x.astype(np.float32), SR, subtype="PCM_16")


# ---------------------------------------------------------------- movimento de câmera
def whoosh(d=0.7, f0=400, ratio=14, spread=0.6):
    t = tt(d)
    p = t / d
    shape = np.sin(np.pi * p) ** 2
    n = rng.standard_normal((len(t), 2))
    y = sweep_bp(n, f0 * ratio ** np.sin(np.pi * p * 0.5)) * shape[:, None]
    pn = np.linspace(-spread, spread, len(t))
    y[:, 0] *= np.cos((pn + 1) * np.pi / 4) * 1.4
    y[:, 1] *= np.sin((pn + 1) * np.pi / 4) * 1.4
    return y


def dive(d=2.2):
    # câmera atravessando o chão: ar + terra passando, filtro descendo
    t = tt(d)
    p = t / d
    n = rng.standard_normal((len(t), 2))
    y = sweep_bp(n, 3500 * 0.08 ** (p**0.8), q=2.0)
    rumble = lp(rng.standard_normal(len(t)), 110) * 2.5 * np.sin(np.pi * p) ** 2
    amp = np.sin(np.pi * np.clip(p * 1.1, 0, 1)) ** 1.3
    return (y + rumble[:, None]) * amp[:, None]


# ---------------------------------------------------------------- interface
def pop(f0=760, f1=380):
    t = tt(0.09)
    f = f1 + (f0 - f1) * np.exp(-t / 0.015)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) * (1 - np.exp(-t / 0.001))


def badge():
    # "plim" suave de entrada de badge: pop + dois parciais
    t = tt(0.5)
    y = np.zeros(len(t))
    for f, dl, g in [(1046.5, 0.0, 1.0), (1568, 0.045, 0.6)]:
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, np.sin(2 * np.pi * f * u) * np.exp(-u / 0.12), 0) * g
    y[: int(0.09 * SR)] += pop(900, 450)[: int(0.09 * SR)] * 0.6
    return y * 0.6


def tick():
    t = tt(0.06)
    return np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.008) * 0.6 + hp(rng.standard_normal(len(t)), 5000) * np.exp(-t / 0.002) * 0.3


def click():
    t = tt(0.07)
    y = np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.006) + np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.015) * 0.7
    return y + hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.003) * 0.5


def buzz():
    # alerta negativo discreto (duas notas descendentes)
    t = tt(0.42)
    y = np.zeros(len(t))
    for f, dl in [(392, 0.0), (311, 0.16)]:
        u = np.clip(t - dl, 0, None)
        tone = np.sign(np.sin(2 * np.pi * f * u)) * 0.35 + np.sin(2 * np.pi * f * u)
        y += np.where(t >= dl, lp(tone, 2200) * np.exp(-u / 0.11), 0)
    return y * 0.6


def ding(f1=1318.5, f2=1975.5, d=1.1):
    t = tt(d)
    y = np.zeros(len(t))
    for f, dl, g in [(f1, 0.0, 1.0), (f2, 0.07, 0.7)]:
        u = np.clip(t - dl, 0, None)
        tone = np.sin(2 * np.pi * f * u + 0.9 * np.exp(-u / 0.2) * np.sin(2 * np.pi * f * 2 * u))
        y += np.where(t >= dl, tone * np.exp(-u / 0.35), 0) * g
    return y


def shimmer(d=1.6):
    # descoberta: notas agudas subindo + brilho
    t = tt(d)
    y = np.zeros((len(t), 2))
    notes = [1396.9, 1760, 2093, 2637, 3136]
    for k, f in enumerate(notes):
        dl = k * 0.07
        u = np.clip(t - dl, 0, None)
        y += pan(np.sin(2 * np.pi * f * u) * np.exp(-u / 0.5) * np.where(t >= dl, 1, 0), -0.6 + 1.2 * k / (len(notes) - 1))
    return y + hp(rng.standard_normal((len(t), 2)), 7000) * (np.exp(-t / 0.5) * (1 - np.exp(-t / 0.1)))[:, None] * 0.12


def glow():
    t = tt(1.2)
    f = 520 * 2 ** (0.5 * np.minimum(1, t / 0.6))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.minimum(1, t / 1.2)) * 0.5
    return y + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.sin(np.pi * np.minimum(1, t / 1.2)) * 0.2


def final():
    t = tt(2.4)
    y = np.zeros((len(t), 2))
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5]):
        dl = k * 0.05
        u = np.clip(t - dl, 0, None)
        y += pan(np.sin(2 * np.pi * f * u) * np.exp(-u / 0.9) * np.where(t >= dl, 1, 0), -0.5 + 0.25 * k) * (0.9 - 0.1 * k)
    boom = np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.4)
    return y + boom[:, None] * 0.7


# ---------------------------------------------------------------- máquina e terra
def thud():
    # caminhão aterrissando + suspensão
    t = tt(0.9)
    f = 38 + 90 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    dirt = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.12) * 0.5
    rattle = bp(rng.standard_normal(len(t)), 900, 3500) * np.exp(-t / 0.05) * 0.3
    return np.tanh((boom + dirt + rattle) * 1.4)


def hydraulic(d=0.75):
    t = tt(d)
    p = t / d
    hiss = bp(rng.standard_normal(len(t)), 2500, 9000) * np.sin(np.pi * p) ** 0.7 * 0.5
    motor = np.sin(2 * np.pi * np.cumsum(110 + 60 * p) / SR) * 0.4 * np.sin(np.pi * p)
    return hiss + lp(np.sign(motor), 600) * 0.3


def drill(d=3.0):
    # motor da perfuratriz + broca triturando rocha (com variação conforme a camada)
    t = tt(d)
    motor = np.zeros(len(t))
    base = 72 + 6 * np.sin(2 * np.pi * 0.6 * t)
    for h in range(1, 7):
        motor += np.sin(2 * np.pi * np.cumsum(base * h) / SR) / h
    motor = lp(motor, 900) * 0.6
    grind = bp(rng.standard_normal(len(t)), 300, 2400) * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 9 * t)))
    crunch = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, d - 0.05, 70)):
        i = int(t0 * SR)
        k = tt(0.03)
        seg = bp(rng.standard_normal(len(k)), 1200, 6000) * np.exp(-k / 0.006) * rng.uniform(0.3, 1.0)
        crunch[i : i + len(k)] += seg[: len(crunch) - i]
    return (motor + grind * 0.5 + crunch * 0.45) * env(d, 0.12, 0.35)


def crumble():
    t = tt(0.7)
    y = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, 0.45, 26)):
        i = int(t0 * SR)
        k = tt(0.05)
        seg = lp(rng.standard_normal(len(k)), rng.uniform(1500, 4000)) * np.exp(-k / 0.012) * rng.uniform(0.3, 1.0)
        y[i : i + len(k)] += seg[: len(y) - i]
    return y + lp(rng.standard_normal(len(t)), 200) * np.exp(-t / 0.2) * 0.6


def clunk():
    t = tt(0.6)
    y = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.08) + np.sin(2 * np.pi * 523 * t) * np.exp(-t / 0.15) * 0.5 + np.sin(2 * np.pi * 1290 * t) * np.exp(-t / 0.1) * 0.25
    return y + lp(rng.standard_normal(len(t)), 1200) * np.exp(-t / 0.02) * 0.5


def rumble_soft(d=1.4):
    t = tt(d)
    return lp(rng.standard_normal(len(t)), 140) * env(d, 0.3, 0.7) * 1.2 + np.sin(2 * np.pi * 52 * t) * env(d, 0.3, 0.7) * 0.4


def pressure(d=2.6):
    # pressão: grave pulsante e discreto
    t = tt(d)
    sub = np.sin(2 * np.pi * 46 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 2.2 * t))
    body = lp(np.sign(np.sin(2 * np.pi * 92 * t)), 300) * 0.25
    creak = bp(rng.standard_normal(len(t)), 180, 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * t)) * 0.3
    return (sub + body + creak) * env(d, 0.35, 0.9)


# ---------------------------------------------------------------- água
def bubbles(d=1.6, n=30, lo=500, hi=1400):
    t = tt(d)
    y = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, d - 0.1, n)):
        i = int(t0 * SR)
        k = tt(0.08)
        f0 = rng.uniform(lo, hi)
        f = f0 * (1 + 0.8 * k / 0.08)
        seg = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k / 0.02) * rng.uniform(0.3, 1.0)
        y[i : i + len(k)] += seg[: len(y) - i]
    return y * env(d, 0.1, 0.4)


def water_rise(d=2.3):
    t = tt(d)
    p = t / d
    n = rng.standard_normal((len(t), 2))
    rush = sweep_bp(n, 300 * 6 ** p, q=1.4) * (0.3 + 0.7 * p)[:, None] * env(d, 0.15, 0.25)[:, None]
    gl = bubbles(d, 55, 400, 1100)
    gl2 = bubbles(d, 40, 900, 2000)
    return rush * 0.8 + pan(gl, -0.3) * 0.6 + pan(gl2, 0.3) * 0.4


def gush(d=2.8):
    # água saindo com força e caindo em volta
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    spray = bp(n, 1500, 9000) * (np.minimum(1, t / 0.08) * (0.65 + 0.35 * np.exp(-t / 0.5)))[:, None]
    body = lp(n, 900) * 0.6 * np.exp(-t / 0.9)[:, None]
    splat = np.stack([bubbles(d, 50, 600, 1600), bubbles(d, 50, 700, 1800)], axis=1) * 0.35
    return (spray + body + splat) * env(d, 0.02, 0.9)[:, None]


def rain(d=4.6):
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    bed = bp(n, 1200, 8000) * 0.35
    drops = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, d - 0.05, 160)):
        i = int(t0 * SR)
        k = tt(0.02)
        seg = hp(rng.standard_normal(len(k)), 3000) * np.exp(-k / 0.003) * rng.uniform(0.2, 1.0)
        drops[i : i + len(k)] += seg[: len(drops) - i]
    return (bed + pan(drops, 0.2) * 0.5) * env(d, 0.6, 1.0)[:, None]


def flow(d=3.2):
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    stream = sweep_bp(n, 700 + 250 * np.sin(2 * np.pi * 0.7 * t), q=1.8) * 0.6
    gl = bubbles(d, 45, 500, 1300)
    return (stream + pan(gl, 0.1) * 0.5) * env(d, 0.25, 0.8)[:, None]


def fill(d=2.3):
    # caixa enchendo: tom do "glug" sobe com o nível
    t = tt(d)
    p = t / d
    n = rng.standard_normal(len(t))
    pour = bp(n, 800, 5000) * 0.35
    res = np.sin(2 * np.pi * np.cumsum(260 + 520 * p) / SR) * (0.25 + 0.15 * np.sin(2 * np.pi * 11 * t))
    return (pour + lp(res, 1500) * 0.5 + bubbles(d, 40, 300 + 0, 900) * 0.4) * env(d, 0.2, 0.6)


def pump(d=2.0):
    t = tt(d)
    f = 95 + 125 * np.minimum(1, t / 0.5)
    whir = np.zeros(len(t))
    for h in (1, 2, 3, 5):
        whir += np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h
    hum = lp(whir, 1400) * 0.6
    start = np.concatenate([click(), np.zeros(len(t) - len(click()))]) * 0.6
    return (hum + bp(rng.standard_normal(len(t)), 400, 2000) * 0.12 + start) * env(d, 0.04, 0.6)


# ---------------------------------------------------------------- tema: raquete de mosquito
def saw(f, t):
    ph = np.cumsum(f) / SR if np.ndim(f) else f * t
    return 2 * (ph % 1) - 1


def mosquito_buzz(d=1.8):
    # zumbido fino com vibrato e aproximação (Doppler leve)
    t = tt(d)
    f = 560 + 40 * np.sin(2 * np.pi * 7 * t) + 60 * np.sin(np.pi * t / d)
    y = bp(saw(f, t), 400, 4200)
    amp = np.sin(np.pi * t / d) ** 0.7 * (0.8 + 0.2 * np.sin(2 * np.pi * 3.3 * t))
    return pan(y * amp, 0.0) * 0.8


def slap():
    t = tt(0.35)
    n = rng.standard_normal(len(t))
    crack = bp(n, 900, 6000) * np.exp(-t / 0.018)
    body = lp(n, 500) * np.exp(-t / 0.05) * 1.6 + np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.06)
    return crack * 1.4 + body


def rewind(d=0.6):
    t = tt(d)
    f = 1800 * (1 - t / d) ** 2 + 200
    y = saw(f, t) * 0.4 + bp(rng.standard_normal(len(t)), 1500, 6000) * 0.3
    return lp(y, 5000) * env(d, 0.03, 0.15)


def swoosh():
    return whoosh(0.45, 500, 10, 0.7)


def net():
    # rede de náilon segurando o bicho: "fump" macio
    t = tt(0.3)
    return lp(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.06) + np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.08) * 0.5


def scale_beep():
    t = tt(0.5)
    y = np.zeros(len(t))
    for dl in [0.0, 0.14]:
        u = np.clip(t - dl, 0, None)
        y += np.where((t >= dl) & (u < 0.08), np.sign(np.sin(2 * np.pi * 2600 * u)) * 0.3, 0)
    return lp(y, 7000)


def boing(d=0.6, f0=180, f1=520):
    t = tt(d)
    f = f0 + (f1 - f0) * np.abs(np.sin(2 * np.pi * 5 * t)) * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)


def zap_tiny():
    t = tt(0.18)
    n = rng.standard_normal(len(t))
    y = hp(n, 2500) * (np.sin(2 * np.pi * 120 * t) > 0) * np.exp(-t / 0.05)
    return y + saw(np.full(len(t), 120.0), t) * 0.3 * np.exp(-t / 0.04)


def whoosh_deep():
    return whoosh(1.1, 120, 10, 0.4)


def yawn(d=1.0):
    # bocejo sintético: vogal descendente
    t = tt(d)
    f = 320 - 120 * t / d
    src = saw(f, t)
    y = bp(src, 500, 1200) + bp(src, 250, 600) * 0.6
    return y * env(d, 0.15, 0.35) * 0.7


def hum(d=1.6):
    t = tt(d)
    y = np.sin(2 * np.pi * 100 * t) + 0.3 * np.sin(2 * np.pi * 200 * t)
    return y * env(d, 0.2, 0.4) * 0.6


def error():
    t = tt(0.4)
    y = np.zeros(len(t))
    for f, dl in [(330, 0.0), (233, 0.15)]:
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, lp(np.sign(np.sin(2 * np.pi * f * u)), 1800) * np.exp(-u / 0.1), 0)
    return y * 0.6


def whine(d=2.2):
    # o chiado agudo que a raquete de verdade faz quando liga
    t = tt(d)
    f = 3000 + 5000 * (t / d) ** 0.6
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return y * env(d, 0.15, 0.4) * 0.35


def ladder():
    t = tt(0.9)
    y = np.zeros(len(t))
    for k, f in enumerate([880, 1046.5, 1318.5, 1568]):
        dl = k * 0.16
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, np.sin(2 * np.pi * f * u) * np.exp(-u / 0.07), 0)
    return y * 0.6


def boing_metal():
    t = tt(0.9)
    y = boing(0.9, 300, 900)
    y = y + 0.5 * np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.3) * np.sin(2 * np.pi * 9 * t)
    return y


def charge(d=1.0):
    t = tt(d)
    f = 300 + 1500 * (t / d) ** 1.5
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + saw(f, t) * 0.15) * env(d, 0.05, 0.12)


def zap():
    # estalo da descarga: crack largo + zumbido elétrico curto
    t = tt(0.7)
    n = rng.standard_normal(len(t))
    crack = hp(n, 1200) * np.exp(-t / 0.03) * 1.8
    arc = bp(n, 2000, 9000) * (np.sin(2 * np.pi * 60 * t) > -0.2) * np.exp(-t / 0.12)
    low = np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.08)
    return crack + arc + low


def sizzle(d=1.6):
    t = tt(d)
    n = rng.standard_normal(len(t))
    pops = (rng.random(len(t)) > 0.9993) * 6.0
    y = hp(n, 3500) * 0.25 + bp(pops, 1500, 8000) * 1.2
    return y * env(d, 0.05, 0.9)


def suspense(d=1.4):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(5):
        dl = k * 0.26
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, np.sin(2 * np.pi * 1200 * u) * np.exp(-u / 0.02), 0)
    return y * 0.5


def badge_big():
    t = tt(1.2)
    y = np.zeros(len(t))
    for f, dl, g in [(523.25, 0, 1), (659.25, 0.07, 0.8), (783.99, 0.14, 0.8), (1046.5, 0.21, 0.7)]:
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, np.sin(2 * np.pi * f * u) * np.exp(-u / 0.35) * g, 0)
    return y * 0.5


def harp(d=2.0):
    t = tt(d)
    y = np.zeros(len(t))
    notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093]
    for k, f in enumerate(notes):
        dl = k * 0.09
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, (np.sin(2 * np.pi * f * u) + 0.3 * np.sin(4 * np.pi * f * u)) * np.exp(-u / 0.5), 0)
    return y * 0.4


def crickets(d=4.5):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(int(d / 0.7)):
        dl = k * 0.7 + 0.1
        u = np.clip(t - dl, 0, None)
        chirp = np.sin(2 * np.pi * 4500 * u) * (np.sin(2 * np.pi * 30 * u) > 0) * np.exp(-u / 0.06)
        y += np.where(t >= dl, chirp, 0)
    return y * env(d, 0.5, 1.0) * 0.5


# ---------------------------------------------------------------- tema: Nadini e os dois empregos
def stamp(heavy=False):
    # carimbo: batida seca de borracha na mesa (+ grave no pesado)
    t = tt(0.5 if heavy else 0.3)
    n = rng.standard_normal(len(t))
    hit = lp(n, 2500) * np.exp(-t / 0.02) * 1.4 + bp(n, 2500, 7000) * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * np.cumsum(90 + 140 * np.exp(-t / 0.03)) / SR) * np.exp(-t / (0.12 if heavy else 0.06))
    return np.tanh((hit + body * (1.6 if heavy else 0.9)) * 1.3)


def coins(d=1.4):
    t = tt(d)
    y = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, d - 0.25, 18)):
        i = int(t0 * SR)
        k = tt(0.22)
        f = rng.uniform(2800, 4600)
        seg = (np.sin(2 * np.pi * f * k) + 0.6 * np.sin(2 * np.pi * f * 1.51 * k)) * np.exp(-k / 0.05) * rng.uniform(0.3, 1.0)
        y[i : i + len(k)] += seg[: len(y) - i]
    return y * 0.5


def arcfill(d=0.9):
    # arco do relógio se desenhando: tom subindo com tique-taque
    t = tt(d)
    f = 440 * 2 ** (t / d)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.05, 0.25) * 0.4
    ticks = (np.sin(2 * np.pi * 12 * t) > 0.97) * hp(rng.standard_normal(len(t)), 4000) * 0.5
    return tone + ticks


def alarm(d=0.8):
    t = tt(d)
    y = np.sign(np.sin(2 * np.pi * 880 * t)) * (np.sin(2 * np.pi * 8 * t) > 0) * 0.35
    return lp(y, 3500) * env(d, 0.01, 0.15)


def tiptoe(d=1.6, n=7):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(n):
        i = int((0.1 + k * (d - 0.2) / n) * SR)
        u = tt(0.05)
        seg = np.sin(2 * np.pi * (900 if k % 2 else 760) * u) * np.exp(-u / 0.01) + hp(rng.standard_normal(len(u)), 3000) * np.exp(-u / 0.004) * 0.4
        y[i : i + len(u)] += seg[: len(y) - i]
    return y * 0.7


def radar(d=1.4):
    t = tt(d)
    y = np.zeros(len(t))
    for dl in (0.0, 0.5, 1.0):
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, np.sin(2 * np.pi * 1480 * u) * np.exp(-u / 0.18), 0)
    return y * 0.6


def bip():
    # "bipou!": dois bipes agudos de alarme
    t = tt(0.45)
    y = np.zeros(len(t))
    for dl in (0.0, 0.18):
        u = np.clip(t - dl, 0, None)
        y += np.where((t >= dl) & (u < 0.13), np.sign(np.sin(2 * np.pi * 2093 * u)) * 0.5, 0)
    return lp(y, 6000)


def door():
    t = tt(0.5)
    creak = bp(saw(180 + 120 * np.sin(np.pi * t / 0.5), t), 300, 1800) * env(0.5, 0.05, 0.2) * 0.5
    slam = lp(rng.standard_normal(len(t)), 800) * np.exp(-np.clip(t - 0.35, 0, None) / 0.04) * (t > 0.35)
    return creak + slam


def voice_bips(d=1.1):
    # "um momentinho…": sílabas sintéticas, sem voz real
    t = tt(d)
    y = np.zeros(len(t))
    for k, f in enumerate([520, 610, 470, 560, 430]):
        i = int(k * 0.2 * SR)
        u = tt(0.14)
        seg = bp(saw(np.full(len(u), f), u), 500, 2500) * np.sin(np.pi * u / 0.14)
        y[i : i + len(u)] += seg[: len(y) - i]
    return y * 0.6


def steps(d=0.9, n=4):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(n):
        i = int((0.05 + k * d / n) * SR)
        u = tt(0.08)
        seg = lp(rng.standard_normal(len(u)), 900) * np.exp(-u / 0.02) + np.sin(2 * np.pi * 120 * u) * np.exp(-u / 0.03)
        y[i : i + len(u)] += seg[: len(y) - i]
    return y * 0.6


def bubble():
    t = tt(0.25)
    f = 500 + 900 * (t / 0.25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.08)


def crash():
    # manequim de plástico caindo duro: baque oco + chacoalhar
    t = tt(0.9)
    hollow = np.sin(2 * np.pi * np.cumsum(140 + 200 * np.exp(-t / 0.04)) / SR) * np.exp(-t / 0.15)
    plastic = bp(rng.standard_normal(len(t)), 700, 4000) * np.exp(-t / 0.07)
    rattle = np.zeros(len(t))
    for t0 in (0.18, 0.31, 0.42):
        i = int(t0 * SR)
        u = tt(0.06)
        seg = bp(rng.standard_normal(len(u)), 900, 3500) * np.exp(-u / 0.015) * 0.5
        rattle[i : i + len(u)] += seg[: len(rattle) - i]
    return np.tanh((hollow * 1.2 + plastic + rattle) * 1.2)


def gasp():
    t = tt(0.4)
    return bp(rng.standard_normal(len(t)), 900, 3500) * env(0.4, 0.08, 0.2) * 0.6


def build():
    t = tt(0.6)
    y = np.zeros(len(t))
    for k, f in enumerate([300, 450, 600]):
        i = int(k * 0.15 * SR)
        y[i : i + int(0.09 * SR)] += pop(f * 2, f)[: len(y) - i]
    return y + lp(rng.standard_normal(len(t)), 500) * np.exp(-t / 0.15) * 0.4


def stretch(d=0.6):
    # baguete envergando: rangido de madeira/massa
    t = tt(d)
    f = 120 + 160 * t / d
    return bp(saw(f + 15 * np.sin(2 * np.pi * 23 * t), t), 200, 1500) * env(d, 0.05, 0.1) * 0.6


def launch():
    # disparo: "tóim" de mola + estalo
    t = tt(0.8)
    spr = np.sin(2 * np.pi * np.cumsum(180 + 700 * np.abs(np.sin(2 * np.pi * 6 * t)) * np.exp(-t / 0.2)) / SR) * np.exp(-t / 0.25)
    crack = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.01)
    return spr + crack


def scratch():
    # disco arranhado: "uhh?"
    t = tt(0.5)
    f = 300 + 900 * np.abs(np.sin(2 * np.pi * 3 * t))
    return bp(saw(f, t) + rng.standard_normal(len(t)) * 0.4, 400, 4000) * env(0.5, 0.01, 0.12) * 0.7


def steam(d=1.6):
    t = tt(d)
    puffs = 0.5 + 0.5 * np.sin(2 * np.pi * 2.5 * t) ** 2
    return hp(rng.standard_normal(len(t)), 3500) * puffs * env(d, 0.08, 0.4) * 0.6


def tension(d=1.2):
    # olhar entre os chefes: duas notas graves que se encaram
    t = tt(d)
    y = np.zeros(len(t))
    for f, dl in ((110, 0.0), (116.5, 0.5)):
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, (np.sin(2 * np.pi * f * u) + 0.4 * np.sin(4 * np.pi * f * u)) * np.exp(-u / 0.5), 0)
    return lp(y, 1200) * 0.7


def tape_rewind(d=2.2):
    # fita rebobinando: chiado agudo acelerando + guinchos
    t = tt(d)
    p = t / d
    f = 600 + 4200 * p**1.4
    squeal = saw(f + 120 * np.sin(2 * np.pi * 14 * t), t) * 0.25
    hiss = bp(rng.standard_normal(len(t)), 2500, 9000) * (0.3 + 0.4 * p)
    clunk_end = np.zeros(len(t))
    i = int((d - 0.12) * SR)
    k = tt(0.12)
    clunk_end[i : i + len(k)] = (lp(rng.standard_normal(len(k)), 900) * np.exp(-k / 0.02))[: len(t) - i]
    return lp(squeal + hiss, 9000) * env(d, 0.05, 0.08) + clunk_end * 0.8


OUT.mkdir(parents=True, exist_ok=True)
for name, fn in {
    "whoosh-soft": lambda: whoosh(0.9, 300, 6, 0.3), "whoosh": lambda: whoosh(1.6, 250, 14, 0.8), "badge": badge, "tick": tick,
    "ding": ding, "pop": lambda: pop(700, 300), "thud": thud, "stamp": stamp, "stamp-big": lambda: stamp(True), "coins": coins,
    "fill": arcfill, "alarm": alarm, "tiptoe": tiptoe, "radar": radar, "bip": bip, "door": door, "voice-bips": voice_bips,
    "steps": steps, "bubble": bubble, "crash": crash, "gasp": gasp, "build": build, "stretch": stretch, "launch": launch,
    "scratch": scratch, "steam": steam, "tension": tension, "rewind": tape_rewind,
}.items():
    save(name, fn())
print("sfx:", sorted(p.name for p in OUT.glob("*.wav")))
