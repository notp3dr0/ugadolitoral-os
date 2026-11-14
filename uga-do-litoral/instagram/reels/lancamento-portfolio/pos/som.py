"""Trilha final: audio/musica.wav do zero, corte seco no quadro 920 (batida 68) e cauda curta de eco do
ultimo meio segundo morrendo ate o fim (quadro 959). Pico max -1 dBTP com ganho estatico (sem mexer na
dinamica). Saida: audio/trilha-final.wav, 32,0 s exatos."""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter, resample_poly, sosfilt

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import AUDIO, FPS, MONTAGEM, NQ, TEMPO


CORTE_HZ = 7500.0


def true_peak_db(x, sr):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.abs(up).max() + 1e-12)


def gerar(saida=None, verbose=True):
    saida = Path(saida or AUDIO / "trilha-final.wav")
    x, sr = sf.read(str(AUDIO / "musica.wav"), dtype="float64", always_2d=True)
    # rodada 2: "um pouquinho mais abafado". Passa-baixa Butterworth de 2a ordem (12 dB/oitava), uma
    # passada so (sem fase zero, que dobraria a inclinacao), na faixa inteira, antes do corte e da cauda.
    sos = butter(2, CORTE_HZ, "low", fs=sr, output="sos")
    x = sosfilt(sos, x, axis=0)
    n_tot = round(NQ / FPS * sr)                       # 32,0 s
    corte_f = MONTAGEM["som"]["corte_f"]
    assert corte_f == TEMPO["corte_musica_f"]
    n_cut = round(corte_f / FPS * sr)                  # 30,6667 s
    y = np.zeros((n_tot, x.shape[1]))
    y[:n_cut] = x[:n_cut]
    # corte seco, so sem estalo (2 ms)
    nf = int(0.002 * sr)
    y[n_cut - nf:n_cut] *= np.linspace(1, 0, nf)[:, None]

    # cauda: eco do ultimo meio segundo, uma colcheia de atraso, cada repeticao mais escura e mais baixa
    seg_n = int(0.5 * sr)
    seg = x[n_cut - seg_n:n_cut].copy()
    jan = np.ones(seg_n)
    r = int(0.01 * sr)
    jan[:r] = np.linspace(0, 1, r); jan[-r:] = np.linspace(1, 0, r)
    seg *= jan[:, None]
    atraso = int(round(TEMPO["batida_s"] / 2 * sr))
    wet = np.zeros_like(y)
    s = seg.copy()
    g = 0.55
    for k in range(1, 12):
        b, a = butter(1, max(800, 6000 / k) / (sr / 2), "low")
        s = lfilter(b, a, s, axis=0)
        ini = n_cut - seg_n + k * atraso
        if ini >= n_tot:
            break
        fim = min(n_tot, ini + seg_n)
        wet[ini:fim] += (g ** k) * s[:fim - ini]
    # so depois do corte, com entrada de 5 ms
    wet[:n_cut] = 0
    ne = int(0.005 * sr)
    wet[n_cut:n_cut + ne] *= np.linspace(0, 1, ne)[:, None]
    # morre ate o quadro 959
    t = np.arange(n_tot) / sr
    fim_t = (NQ - 1) / FPS
    env = np.clip((fim_t - t) / (fim_t - n_cut / sr), 0, 1) ** 1.5
    y += wet * env[:, None]
    y[t >= fim_t] = 0

    tp = true_peak_db(y, sr)
    ganho_db = min(0.0, -1.0 - tp - 0.05)
    y *= 10 ** (ganho_db / 20)
    tp2 = true_peak_db(y, sr)
    sf.write(str(saida), y.astype(np.float32), sr, subtype="PCM_24")
    if verbose:
        print(f"trilha: {n_tot / sr:.3f}s, corte em {n_cut / sr:.4f}s, pico verdadeiro {tp:.2f} -> {tp2:.2f} dBTP"
              f" (ganho estatico {ganho_db:.2f} dB)")
    return {"sr": sr, "dur": n_tot / sr, "tp_antes": tp, "tp": tp2, "ganho_db": ganho_db, "corte_s": n_cut / sr}


if __name__ == "__main__":
    gerar()
