#!/usr/bin/env python3
"""Sintetiza os efeitos e camas do template (nada de áudio de terceiros).

Uso: python scripts/sfx.py        -> public/audio/*.wav (44,1 kHz, mono, 16 bit)

Receita do susto (estudo do teaser de referência): a cama grave some ANTES, há 0,4 s de silêncio
total e o impacto de grave entra ~12 dB acima do resto. Por isso `bass_hit` é o som mais forte
e `drone` é baixo e some inteiro antes dele (ver CUES em src/data/episode.ts).
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
rng = np.random.default_rng(7)  # semente fixa: o mesmo som toda vez


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def env_exp(t, tau):
    return np.exp(-t / tau)


def lowpass(x, fc):
    """Passa-baixa de 1 polo (suficiente pra escurecer ruído)."""
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def norm(x, peak=0.89):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def save(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"  {name}  {len(x)/SR:.2f}s")


def bass_hit():
    t = t_axis(1.6)
    f = 34 + 60 * np.exp(-t / 0.06)  # varredura 94 -> 34 Hz
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(t, 0.42)
    sub = np.sin(2 * np.pi * 28 * t) * env_exp(t, 0.7) * 0.6
    click = lowpass(rng.standard_normal(len(t)), 900) * env_exp(t, 0.015) * 0.9
    return norm(body + sub + click)


def gunshot():
    t = t_axis(1.2)
    crack = rng.standard_normal(len(t)) * env_exp(t, 0.035)
    boom = lowpass(rng.standard_normal(len(t)), 420) * env_exp(t, 0.22) * 1.6
    thump = np.sin(2 * np.pi * (48 + 40 * env_exp(t, 0.05)) * t) * env_exp(t, 0.16)
    return norm(crack * 0.7 + boom + thump)


def wood_crack():
    t = t_axis(0.9)
    out = np.zeros_like(t)
    for at, amp in [(0.0, 1.0), (0.05, 0.7), (0.11, 0.55), (0.2, 0.4), (0.33, 0.25)]:
        i = int(at * SR)
        seg = t_axis(0.25)
        burst = lowpass(rng.standard_normal(len(seg)), 3200) * env_exp(seg, 0.03)
        burst += np.sin(2 * np.pi * (180 + 120 * rng.random()) * seg) * env_exp(seg, 0.05) * 0.5
        out[i : i + len(seg)] += burst[: len(out) - i] * amp
    return norm(out)


def knock():
    t = t_axis(1.5)
    out = np.zeros_like(t)
    for at in (0.0, 0.34, 0.68):
        i = int(at * SR)
        seg = t_axis(0.3)
        thud = np.sin(2 * np.pi * (140 - 50 * seg) * seg) * env_exp(seg, 0.06)
        thud += lowpass(rng.standard_normal(len(seg)), 1500) * env_exp(seg, 0.012) * 0.8
        out[i : i + len(seg)] += thud
    return norm(out)


def creak():
    t = t_axis(1.6)
    f = 90 + 40 * np.sin(2 * np.pi * 1.7 * t) + 70 * t
    saw = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
    shaped = lowpass(saw, 700) * np.sin(np.pi * np.clip(t / 1.6, 0, 1)) ** 2
    return norm(shaped, 0.7)


def breath():
    t = t_axis(2.2)
    n = lowpass(rng.standard_normal(len(t)), 1700)
    swell = np.sin(np.pi * np.clip(t / 1.0, 0, 1)) ** 2 + 0.8 * np.sin(np.pi * np.clip((t - 1.1) / 1.0, 0, 1)) ** 2
    return norm(n * swell, 0.6)


def drone():
    """Cama de 10 s: 55 Hz + 82,5 Hz com pulso lento (~60 bpm). Termina em fade pra zero."""
    t = t_axis(10.0)
    pulse = 0.55 + 0.45 * np.maximum(0, np.sin(2 * np.pi * 1.0 * t)) ** 3  # 1 pulso por segundo
    tone = np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.5 * t + 0.6) + 0.25 * np.sin(2 * np.pi * 110.4 * t)
    air = lowpass(rng.standard_normal(len(t)), 260) * 0.35
    fade = np.clip(t / 1.2, 0, 1) * np.clip((10.0 - t) / 0.8, 0, 1)
    return norm((tone * pulse + air) * fade, 0.8)


if __name__ == "__main__":
    print(f"Gerando em {OUT}")
    for name, fn in [
        ("bass_hit.wav", bass_hit),
        ("gunshot.wav", gunshot),
        ("wood_crack.wav", wood_crack),
        ("knock.wav", knock),
        ("creak.wav", creak),
        ("breath.wav", breath),
        ("drone.wav", drone),
    ]:
        save(name, fn())
