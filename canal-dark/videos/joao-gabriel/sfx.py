"""Efeitos sintetizados em código (sem banco de terceiros). Gera public/sfx/*.wav a 48 kHz."""
import numpy as np, wave
SR = 48000
rng = np.random.default_rng(3)
def salva(nome, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    with wave.open(f"public/sfx/{nome}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
def t(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.2):
    tt = np.arange(n) / SR; return np.minimum(1, tt / a) * np.exp(-tt / r)
def lowpass(x, k):  # média móvel simples
    return np.convolve(x, np.ones(k) / k, mode="same")

# whoosh: ruído filtrado que sobe e desce
d = 0.45; n = int(SR * d); tt = t(d)
ru = rng.standard_normal(n); band = ru - lowpass(ru, 3); band = lowpass(band, 6)
salva("whoosh", band * np.sin(np.pi * tt / d) ** 2)

# ding: duas parciais com decaimento
tt = t(1.2); salva("ding", (np.sin(2*np.pi*1318*tt) + 0.5*np.sin(2*np.pi*2637*tt) + 0.25*np.sin(2*np.pi*1975*tt)) * env(len(tt), 0.002, 0.35))

# pop de mensagem: senoide com pitch caindo, curtinha
tt = t(0.12); f = 900 - 500 * tt / 0.12; salva("pop", np.sin(2*np.pi*np.cumsum(f)/SR) * env(len(tt), 0.001, 0.04))

# scratch de disco: ruído com pitch vai-e-volta
d = 0.5; tt = t(d); ru = rng.standard_normal(len(tt))
mod = np.abs(np.sin(2*np.pi*3*tt)); x = lowpass(ru, 2) * mod; x = x * np.sin(2*np.pi*(200+600*mod)*tt)
salva("scratch", x * env(len(tt), 0.01, 0.3))

# impacto grave (boom)
tt = t(0.7); f = 110 * np.exp(-tt * 6) + 40; salva("boom", np.sin(2*np.pi*np.cumsum(f)/SR) * env(len(tt), 0.002, 0.18) + 0.2*rng.standard_normal(len(tt))*env(len(tt),0.001,0.02))

# tique-taque
tt = t(0.05); salva("tick", rng.standard_normal(len(tt)) * env(len(tt), 0.0005, 0.006))
print("sfx ok")
