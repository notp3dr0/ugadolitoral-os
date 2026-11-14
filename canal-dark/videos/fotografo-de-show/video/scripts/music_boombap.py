"""Trilha boom bap sintetizada em código (sem áudio de terceiros) pro "Fotógrafo de show".

88 BPM, Lá menor (Am7 · Dm9 · G7 · Cmaj7), bateria com swing, baixo, Rhodes e chiado de vinil.
Momentos amarrados à voz real (src/data/vo.json + GAPS de utils/timing.ts):
  - rebobinar do gancho: a fita para (desacelera) em "Como isso é possível?" e o beat volta na cena 2
  - chegada da câmera (cena 4): o beat para meio segundo antes e volta depois do coro
  - show (cena 7): bateria mais cheia
  - final: acerto em "Visibilidade" e só o acorde até o fim
Os cortes de silêncio das punchlines ("Ninguém paga", "Sem crédito", "três reais") são feitos no Remotion
(trilha music.duck no Soundtrack), não aqui.
Uso: python scripts/music_boombap.py  ->  public/audio/music.wav
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path.cwd()
SR = 48000
DUR = 90.0
BPM = 88
BEAT = 60 / BPM
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- tempos da voz
vo = json.loads((ROOT / "src" / "data" / "vo.json").read_text(encoding="utf-8"))
GAPS = [0.35, 0.35, 0.35, 1.0, 0.8, 0.35, 0.7, 0.35, 0.35, 0.35, 0.45]
keys = list(vo.keys())
start = {}
t = 0.45
for i, k in enumerate(keys):
    start[k] = t
    t += vo[k]["seconds"] + (GAPS[i] if i < len(GAPS) else 0)
word = lambda k, i: start[k] + vo[k]["words"][i]["start"]
cut = lambda k: start[k] - 0.25

T_REWIND = word("s1", 10)
T_S2 = cut("s2")
T_S4 = cut("s4")
T_S5 = cut("s5")
T_S7 = cut("s7")
T_S8 = cut("s8")
T_FINAL = word("s12", 12)
print(f"rebobinar {T_REWIND:.2f} · cena2 {T_S2:.2f} · câmera {T_S4:.2f}-{T_S5:.2f} · show {T_S7:.2f}-{T_S8:.2f} · final {T_FINAL:.2f}")

N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0:
        return
    j = min(N, i + len(sig))
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan))
    R[i:j] += s * (1 + min(0, pan))


def env(n, a, d):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)


def kick():
    n = int(0.45 * SR)
    x = np.arange(n) / SR
    f = 48 + 110 * np.exp(-x * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(n, 0.002, 0.16) * 1.0 + np.sin(ph * 2) * env(n, 0.001, 0.02) * 0.2


def snare():
    n = int(0.3 * SR)
    noise = rng.standard_normal(n)
    noise = np.convolve(noise, np.ones(4) / 4, "same") - np.convolve(noise, np.ones(40) / 40, "same")
    x = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 185 * x) * env(n, 0.001, 0.05)
    return noise * env(n, 0.001, 0.085) * 0.75 + tone * 0.5


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    noise = rng.standard_normal(n)
    hp = noise - np.convolve(noise, np.ones(6) / 6, "same")
    return hp * env(n, 0.0005, 0.08 if open_ else 0.018) * 0.32


def rhodes(freqs, dur):
    n = int(dur * SR)
    x = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        out += (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 6) + 0.08 * np.sin(2 * np.pi * 3 * f * x)) * np.exp(-x * 0.9)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.5 * x)
    a = np.minimum(1, x / 0.01)
    r = np.minimum(1, (dur - x) / 0.12)
    return out * trem * a * np.clip(r, 0, 1) / len(freqs) * 0.5


def bass(f, dur):
    n = int(dur * SR)
    x = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 2 * f * x)
    return s * np.minimum(1, x / 0.008) * np.clip((dur - x) / 0.05, 0, 1) * np.exp(-x * 1.2) * 0.55


hz = lambda m: 440 * 2 ** ((m - 69) / 12)
CHORDS = [  # (baixo, notas do Rhodes)
    (45, [57, 60, 64, 67]),  # Am7
    (50, [53, 57, 60, 64]),  # Dm9 (sem a fundamental)
    (43, [53, 55, 59, 62]),  # G7
    (48, [52, 55, 59, 64]),  # Cmaj7
]
BAR = 4 * BEAT
SWING = 0.58  # colcheia com swing


def stopped(t0):
    """True onde o beat não toca (fita parada, respiro da câmera, depois do final)."""
    return (T_REWIND + 0.9 <= t0 < T_S2) or (T_S4 - 0.45 <= t0 < T_S5 - 0.1) or (t0 >= T_FINAL)


bar = 0
t0 = 0.0
while t0 < DUR:
    b, notes = CHORDS[bar % 4]
    show = T_S7 <= t0 < T_S8
    for beat in range(4):
        for half in range(2):
            tt = t0 + beat * BEAT + (half * SWING * BEAT)
            if stopped(tt):
                continue
            # bateria: bumbo no 1 e no "e" do 3, caixa no 2 e no 4
            if (beat == 0 and half == 0) or (beat == 2 and half == 1) or (show and beat == 3 and half == 1):
                add(kick(), tt, 0.95)
            if beat in (1, 3) and half == 0:
                add(snare(), tt + 0.012, 0.6 if not show else 0.72)
            add(hat(open_=(beat == 3 and half == 1)), tt, 0.55 if half else 0.75, pan=0.25)
    # baixo e Rhodes por compasso
    for k, (off, d) in enumerate([(0, 1.4), (1.5 * BEAT, 0.5), (2.58 * BEAT, 1.3)]):
        tt = t0 + off
        if not stopped(tt):
            add(bass(hz(b + (7 if k == 1 else 0)), d * BEAT), tt, 0.9)
    if not stopped(t0):
        add(rhodes([hz(m) for m in notes], BAR * 0.95), t0, 0.8, pan=-0.15)
    bar += 1
    t0 += BAR

# fita parando no rebobinar: o último pedaço do beat desacelera até parar
i0, i1 = int(T_REWIND * SR), int((T_REWIND + 0.9) * SR)
seg = (L[i0:i1] + R[i0:i1]) / 2
k = np.linspace(1, 0.15, len(seg))
pos = np.cumsum(k)
pos = pos / pos[-1] * (len(seg) * 0.55)
slowed = np.interp(pos, np.arange(len(seg)), seg) * np.linspace(1, 0, len(seg))
L[i0:i1] = slowed
R[i0:i1] = slowed

# acorde final sustentado a partir de "Visibilidade"
fin = rhodes([hz(m) for m in [45, 57, 60, 64, 67, 71]], DUR - T_FINAL)
add(fin, T_FINAL, 1.3)
add(kick(), T_FINAL, 1.0)

# chiado de vinil por baixo de tudo
crackle = rng.standard_normal(N) * 0.004
pops = (rng.random(N) < 0.00025) * rng.standard_normal(N) * 0.25
L += crackle + pops
R += crackle + pops

# saturação leve e normalização
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
mix *= 0.89 / np.max(np.abs(mix))
fade = np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1)
mix *= fade[:, None]
out = ROOT / "public" / "audio" / "music.wav"
sf.write(out, mix.astype(np.float32), SR)
print("ok", out, f"{DUR:.1f} s")
