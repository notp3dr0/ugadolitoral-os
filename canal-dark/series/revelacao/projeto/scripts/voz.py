#!/usr/bin/env python3
"""Narração com a voz do Pedro no VoiceStudio local + tempo real de cada palavra.

VoiceStudio em 127.0.0.1:3900 (motor OmniVoice, GPU desta máquina, sem custo por uso). Se o app não abrir,
dá pra subir só o servidor (ver README do projeto).

Uso (na raiz do projeto):
    python scripts/voz.py ep01            # todas as falas do episódio
    python scripts/voz.py ep01 f03 f12    # só essas
Lê   src/episodios/<ep>/falas.json  ({"f01": "texto", ...})
Grava public/audio/vo/<ep>/<fala>.wav e src/episodios/<ep>/vo.json
Variáveis: VOZ (perfil, padrão d2669c06 = "joao gabriel", clone do Pedro), SEED, SPEED.
"""
import io
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
import wave
from pathlib import Path

import numpy as np

API = "http://127.0.0.1:3900"
VOZ = os.environ.get("VOZ", "d2669c06")
SEED = int(os.environ.get("SEED", "7"))
SPEED = float(os.environ.get("SPEED", "1.0"))
SR = 48000
TARGET_RMS_DB = -17.0


def post(path, data, ctype):
    req = urllib.request.Request(API + path, data=data, headers={"Content-Type": ctype})
    try:
        return urllib.request.urlopen(req, timeout=1200).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"VoiceStudio respondeu {e.code}: {e.read().decode(errors='replace')[:400]}")
    except urllib.error.URLError:
        sys.exit("O VoiceStudio não está respondendo em 127.0.0.1:3900.")


def tts(text):
    # reticências no fim: sem elas o OmniVoice às vezes para no meio da última sílaba (visto em 2026-11-04)
    body = {"model": "omnivoice", "input": text.rstrip() + " ...", "language": "pt", "voice": VOZ, "seed": SEED, "speed": SPEED, "response_format": "wav"}
    return post("/v1/audio/speech", json.dumps(body).encode(), "application/json")


def transcribe(wav_bytes, name):
    b = uuid.uuid4().hex
    parts = []
    for k, v in [("model", "whisper-1"), ("language", "pt"), ("response_format", "verbose_json"), ("timestamp_granularities[]", "word")]:
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: audio/wav\r\n\r\n'.encode() + wav_bytes + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())
    res = json.loads(post("/v1/audio/transcriptions", b"".join(parts), f"multipart/form-data; boundary={b}"))
    return [{"text": w["word"].strip(), "start": float(w["start"]), "end": float(w["end"])} for w in res.get("words", [])]


def decode(path_or_bytes, src_is_bytes=True):
    inp = "pipe:0" if src_is_bytes else str(path_or_bytes)
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", inp, "-af", "afftdn=nf=-25", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        input=path_or_bytes if src_is_bytes else None, capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def save_wav(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def _norm(t):
    return "".join(ch for ch in t.lower() if ch.isalnum())


def align(script, heard, speech_end):
    """O texto aprovado manda na legenda. Casa as palavras do roteiro com as transcritas; as que o ASR
    juntou ou escreveu diferente (números: "três e dezessete" -> "3h17") ganham tempo interpolado
    entre as vizinhas casadas, proporcional ao tamanho de cada palavra."""
    import difflib

    sm = difflib.SequenceMatcher(a=[_norm(w) for w in script], b=[_norm(w["text"]) for w in heard], autojunk=False)
    times = [None] * len(script)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            times[blk.a + k] = (h["start"], h["end"])
    i = 0
    while i < len(script):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(script) and times[j] is None:
            j += 1
        t0 = times[i - 1][1] + 0.03 if i > 0 else heard[0]["start"]
        t1 = times[j][0] - 0.03 if j < len(script) else speech_end - 0.1
        t1 = max(t1, t0 + 0.12 * (j - i))
        total = sum(len(w) for w in script[i:j]) or 1
        cur = t0
        for k in range(i, j):
            d = (t1 - t0) * len(script[k]) / total
            times[k] = (cur, cur + d)
            cur += d
        i = j
    if any(t is None for t in times):
        raise SystemExit("alinhamento falhou")
    unmatched = len(script) - sum(b.size for b in sm.get_matching_blocks())
    if unmatched:
        print(f"  {unmatched} palavra(s) do roteiro com tempo interpolado (o ASR escreveu diferente)")
    return [{"text": w, "start": round(t[0], 3), "end": round(t[1], 3)} for w, t in zip(script, times)]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ep = sys.argv[1]
    only = set(sys.argv[2:])
    root = Path.cwd()
    falas = json.loads((root / "src" / "episodios" / ep / "falas.json").read_text(encoding="utf-8"))
    out_json = root / "src" / "episodios" / ep / "vo.json"
    data = json.loads(out_json.read_text(encoding="utf-8")) if out_json.exists() else {}
    for key, text in falas.items():
        if only and key not in only:
            continue
        raw = tts(text)
        words = transcribe(raw, f"{key}.wav")
        if not words:
            sys.exit(f"{key}: transcrição vazia, não dá pra sincronizar.")
        x = decode(raw)
        # a voz clonada vem com ruído antes da fala: corta 60 ms antes da 1ª palavra
        a = int(max(words[0]["start"] - 0.06, 0) * SR)
        # o fim sai pelo VOLUME, não pela transcrição: o ASR dá tempo curto demais pra números ("3h17")
        loud = np.flatnonzero(np.abs(x) > 10 ** (-40 / 20))
        b = min(int(loud[-1] + 0.12 * SR) if len(loud) else len(x), len(x))
        y = x[a:b]
        speech = y[np.abs(y) > 10 ** (-45 / 20)]
        rms = np.sqrt(np.mean(speech**2)) if len(speech) else 1.0
        y = y * (10 ** (TARGET_RMS_DB / 20) / rms)
        peak = np.max(np.abs(y))
        if peak > 0.89:
            y *= 0.89 / peak
        n = int(0.012 * SR)
        y[:n] *= np.linspace(0, 1, n)
        y[-n:] *= np.linspace(1, 0, n)
        save_wav(root / "public" / "audio" / "vo" / ep / f"{key}.wav", y)
        off = a / SR
        words = align(text.split(), words, b / SR)
        data[key] = {
            "text": text,
            "seconds": round(len(y) / SR, 3),
            "words": [{"text": w["text"], "start": round(max(w["start"] - off, 0), 3), "end": round(w["end"] - off, 3)} for w in words],
        }
        tail = np.abs(y[-int(0.15 * SR) : -n]).max() / (np.abs(y).max() or 1)
        flag = "  <- FIM CORTADO? refaça com outra SEED" if tail > 0.3 else ""
        print(f"{key}: {data[key]['seconds']:.2f}s  {text}{flag}")
    data = {k: data[k] for k in falas if k in data}
    out_json.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"total de fala: {sum(v['seconds'] for v in data.values()):.1f}s")


if __name__ == "__main__":
    main()
