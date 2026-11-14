"""Trilha-guia do filme HASAG Black November, sintetizada em código.

144 BPM (um tempo = 10 frames a 24 fps). Os números de frame são os mesmos de src/theme.ts.
A batida escurece junto com a imagem (filtro fechando no P2 e no P3), para em silêncio total
na totalidade, e volta no clique do fecho com o chimbal feito do som das pérolas.
O 808 toca a nota Sol 1 (G1), o nome da pulseira.

Uso: python scripts/trilha.py   ->  public/audio/trilha.wav
É guia: serve para montar e aprovar o ritmo. A versão final pede produtor ou som gravado das peças.
"""
import os
import wave

import numpy as np

SR = 48000
FPS = 24
TOTAL = 456
N = int(SR * TOTAL / FPS)
rng = np.random.default_rng(11)


def s(frame):
    return int(round(frame / FPS * SR))


def env(n, decay):
    return np.exp(-np.arange(n) / (decay * SR))


def put(buf, frame, sig, gain=1.0, pan=0.0):
    i = s(frame)
    if i >= N:
        return
    sig = sig[: N - i]
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(sig), 0] += sig * gain * left * 1.414
    buf[i : i + len(sig), 1] += sig * gain * right * 1.414


def onepole_lp(x, fc):
    """Passa-baixa de um polo com corte variável por amostra (fc pode ser array)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape[:1])
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x)
    acc = np.zeros(x.shape[1:]) if x.ndim > 1 else 0.0
    for i in range(len(x)):
        acc = acc + a[i] * (x[i] - acc)
        y[i] = acc
    return y


def hp_noise(n, fc):
    x = rng.standard_normal(n)
    return x - onepole_lp(x, fc)


def kick(dur=0.32):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 46 + 130 * np.exp(-t / 0.028)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.13)
    click = hp_noise(n, 3000) * np.exp(-t / 0.003) * 0.5
    return np.tanh(1.6 * body) + click


def sub808(f0, dur, glide=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + glide * t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    e = np.minimum(1, t / 0.006) * np.exp(-t / (dur * 0.7))
    fade = np.minimum(1, (dur - t) / 0.02)
    # saturação forte: o grave precisa de harmônico para aparecer em alto-falante de celular
    return np.tanh(3.2 * np.sin(ph) * e) * 0.8 * fade


def clap():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    x = hp_noise(n, 900)
    x = onepole_lp(x, 6500)
    e = np.zeros(n)
    for d in (0.0, 0.011, 0.023):
        k = int(d * SR)
        e[k:] += np.exp(-(t[: n - k]) / 0.012)
    e += np.exp(-t / 0.09) * 0.5
    return x * e * 0.6


def hat(decay=0.022):
    n = int(0.09 * SR)
    return hp_noise(n, 7000) * env(n, decay) * 0.5


def partials(freqs, decays, amps, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f, d, a in zip(freqs, decays, amps):
        out += a * np.sin(2 * np.pi * f * t) * np.exp(-t / d)
    return out


def tic(f=2600.0, dur=0.12):
    """Pérola contra pérola: estalo curto, um pouco de corpo."""
    body = partials([f, f * 2.31, f * 3.87], [0.030, 0.018, 0.010], [1.0, 0.55, 0.3], dur)
    n = len(body)
    click = hp_noise(n, 4000) * env(n, 0.0012) * 0.8
    return (body + click) * 0.5


def ping(f=5200.0, dur=0.5):
    """Strass e metal fino."""
    return partials([f, f * 1.41, f * 1.75, f * 2.6], [0.16, 0.12, 0.08, 0.05], [1.0, 0.6, 0.5, 0.25], dur) * 0.3


def clink(dur=0.6):
    """Cruz batendo em cruz."""
    return partials([2100, 3350, 5120, 6890], [0.26, 0.2, 0.12, 0.07], [1.0, 0.7, 0.5, 0.3], dur) * 0.3


def click_fecho():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    x = hp_noise(n, 2500) * np.exp(-t / 0.004)
    x += partials([1700, 2900, 4300], [0.014, 0.01, 0.006], [1.0, 0.7, 0.4], 0.12)
    return x * 0.9


beat = np.zeros((N, 2))  # bumbo, 808, palma, chimbal
fx = np.zeros((N, 2))  # peças: pérola, strass, cruz, fecho

G1, F1, AS1 = 49.0, 43.65, 58.27

# ---------- P1 e P2 (0-100): a batida de dia ----------
for fr in (0, 25, 40, 65, 80):
    put(beat, fr, kick(), 0.95)
    put(beat, fr, sub808(G1, 0.55), 0.7)
put(beat, 20, clap(), 0.7)
for fr in (70, 80, 90):  # os três cortes do P2
    put(beat, fr, clap(), 0.9)
for b in range(10):  # chimbal em tercina
    for k in range(3):
        fr = b * 10 + k * 10 / 3
        put(beat, fr, hat(0.03 if k == 0 else 0.016), 0.5 if k == 0 else 0.28, pan=0.25 if k % 2 else -0.25)

# ---------- P3 (100-144): sobra o grave e um chimbal cada vez mais espaçado ----------
put(beat, 100, sub808(G1, 1.7), 0.75)
for fr in (100, 106, 114, 124):
    put(beat, fr, hat(0.03), 0.5)
put(fx, 130, tic(3100, 0.2), 1.0)  # o frame parado: é o símbolo

# o filtro fecha em degraus no P2 e desce no P3
fc = np.full(N, 18000.0)
for a, b, val in ((70, 80, 6000), (80, 90, 2600), (90, 100, 1300)):
    fc[s(a) : s(b)] = val
i0, i1 = s(100), s(144)
fc[i0:i1] = np.geomspace(800, 220, i1 - i0)
seg = slice(0, s(144))
beat[seg] = onepole_lp(onepole_lp(beat[seg], fc[seg]), fc[seg])

# ---------- P4 (144-160): o golpe e o silêncio ----------
put(beat, 144, kick(0.12), 0.9)

# ---------- P5 (160-240): uma conta por desenho ----------
SEQ = "ppprppprppprppprppp"
np_ = 0
for i, tipo in enumerate(SEQ):
    fr = 160 + 2 * i
    pan = 0.6 * np.sin(np.radians(50 + i * 13.7))
    if tipo == "p":
        put(fx, fr, tic(2200 * 2 ** (np_ / 15 * 0.9)), 0.8, pan)
        np_ += 1
    else:
        put(fx, fr, ping(5600 + 500 * i / 19), 0.9, pan)
for k in range(4):  # a corrente
    put(fx, 198 + k * 0.5, ping(7400 + 300 * k, 0.15), 0.35)
put(fx, 200, click_fecho(), 1.0)


# ---------- a batida cheia: do clique do fecho (200) ao clique do punho (350), e na tela final ----------
def compasso(f0, variacao=False, hats=True):
    for step in (0, 6, 10):
        fr = f0 + step * 2.5
        put(beat, fr, kick(), 1.0)
        nota = F1 if (variacao and step == 10) else G1
        dur = 0.62 if step == 0 else 0.4
        put(beat, fr, sub808(nota, dur, glide=0.12 if (variacao and step == 10) else 0.0), 0.85)
    put(beat, f0 + 20, clap(), 0.95)
    if hats:
        for step in range(0, 16, 2):  # colcheias, com o som da pérola
            g = 0.5 if step % 4 == 0 else 0.3
            put(beat, f0 + step * 2.5, tic(4200 + 260 * (step % 4), 0.06), g, pan=0.3 if step % 4 else -0.3)
        if variacao:  # rufo de fusas no fim do compasso
            for k in range(6):
                put(beat, f0 + 32.5 + k * 1.25, tic(4600 + 180 * k, 0.05), 0.22 + 0.05 * k, pan=0.3)


for b, f0 in enumerate(range(200, 350, 40)):
    compasso(f0, variacao=(b % 2 == 1))

# P6 (240-320): cruzes nos tempos, o comprido em half-time
for k, fr in enumerate((252, 262, 272)):
    put(fx, fr, clink(), 0.75 * 0.62**k, pan=-0.2 + 0.2 * k)
for k, fr in enumerate((268, 288, 308)):
    put(fx, fr, tic(1450, 0.2), 0.75 * 0.75**k, pan=0.15)

# P7 (320-360): o chocalho do deslize e o clique que corta a batida
for k in range(11):
    fr = 334 + 16 * (k / 11) ** 0.8
    put(fx, fr, tic(float(rng.uniform(2600, 4200)), 0.07), 0.3 + 0.03 * k, pan=float(rng.uniform(-0.4, 0.4)))
put(fx, 350, click_fecho(), 1.0)

# P8 (360-456): dois compassos, um "tic" e meio segundo de silêncio
compasso(360)
compasso(400, variacao=True)
put(fx, 440, tic(3100, 0.25), 1.0)


# ---------- cortes secos: silêncio de verdade ----------
def mudo(buf, a, b, fade=0.004):
    i, j = s(a), min(N, s(b))
    k = int(fade * SR)
    buf[i - k : i] *= np.linspace(1, 0, k)[:, None]
    buf[i:j] = 0


mudo(beat, 146, 200)  # totalidade: 14 frames de silêncio, depois só as contas
mudo(fx, 146, 160)
mudo(beat, 350, 360)  # o clique do punho corta a batida
mudo(beat, 440, 456)

mix = beat * 0.9 + fx * 0.8
mix = np.tanh(mix * 0.8)
mix = mix / np.max(np.abs(mix)) * 0.62  # perto de -14 LUFS, com folga de pico

out = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "trilha.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(os.path.abspath(out), f"{N / SR:.2f}s")
