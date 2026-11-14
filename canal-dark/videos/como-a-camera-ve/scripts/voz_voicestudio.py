"""Gera a narração com a voz do Pedro no VoiceStudio local e deixa no formato do voiceover.py.

O VoiceStudio (127.0.0.1:3900, motor OmniVoice, roda na GPU desta máquina, sem custo por uso) precisa
estar aberto. A voz clonada vem com ~0,8 s de ruído antes da fala: o corte usa o tempo da 1ª palavra
(transcrição do próprio VoiceStudio) e passa um denoise leve.

Uso (na raiz do projeto):
    python scripts/voz_voicestudio.py                 # todas as falas
    python scripts/voz_voicestudio.py s3 s7           # só essas
    python scripts/prepare_vo.py                      # depois: normaliza e grava src/data/vo.json
Variáveis: VOZ (id do perfil, padrão d2669c06 = "joao gabriel"), SEED, SPEED.
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path.cwd()
API = "http://127.0.0.1:3900"
VOZ = os.environ.get("VOZ", "d2669c06")
SEED = int(os.environ.get("SEED", "7"))
SPEED = float(os.environ.get("SPEED", "1.0"))
OUT_AUDIO = ROOT / "public" / "audio" / "vo"
OUT_JSON = ROOT / "scripts" / "out" / "vo-timings.json"
TMP = ROOT / "scripts" / "out" / "bruto"


def post(path: str, data: bytes, ctype: str) -> bytes:
    req = urllib.request.Request(API + path, data=data, headers={"Content-Type": ctype})
    try:
        return urllib.request.urlopen(req, timeout=900).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"VoiceStudio respondeu {e.code}: {e.read().decode(errors='replace')[:300]}")
    except urllib.error.URLError:
        sys.exit("O VoiceStudio não está respondendo em 127.0.0.1:3900. Abra o app e rode de novo.")


def tts(text: str) -> bytes:
    body = {"model": "omnivoice", "input": text, "language": "pt", "voice": VOZ, "seed": SEED, "speed": SPEED, "response_format": "wav"}
    return post("/v1/audio/speech", json.dumps(body).encode(), "application/json")


def transcribe(wav: Path) -> list[dict]:
    b = uuid.uuid4().hex
    parts = []
    for k, v in [("model", "whisper-1"), ("language", "pt"), ("response_format", "verbose_json"), ("timestamp_granularities[]", "word")]:
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{wav.name}"\r\nContent-Type: audio/wav\r\n\r\n'.encode() + wav.read_bytes() + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())
    res = json.loads(post("/v1/audio/transcriptions", b"".join(parts), f"multipart/form-data; boundary={b}"))
    return [{"text": w["word"].strip(), "start": float(w["start"]), "end": float(w["end"])} for w in res.get("words", [])]


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    lines = json.loads((ROOT / "scripts" / "narration.json").read_text(encoding="utf-8-sig"))
    only = sys.argv[1:]
    TMP.mkdir(parents=True, exist_ok=True)
    OUT_AUDIO.mkdir(parents=True, exist_ok=True)
    timings = json.loads(OUT_JSON.read_text(encoding="utf-8")) if OUT_JSON.exists() else {"lines": {}}
    for key, text in lines.items():
        if only and key not in only:
            continue
        raw = TMP / f"{key}.wav"
        raw.write_bytes(tts(text))
        words = transcribe(raw)
        if not words:
            sys.exit(f"{key}: a transcrição voltou vazia; não dá pra sincronizar.")
        cut = max(words[0]["start"] - 0.06, 0)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{cut:.3f}", "-i", str(raw), "-af", "afftdn=nf=-25", "-ar", "48000", "-ac", "1", str(OUT_AUDIO / f"{key}.mp3")], check=True)
        # o texto aprovado manda na legenda: se a contagem bate, usa as palavras do roteiro
        script_words = text.replace("—", " ").split()
        if len(script_words) == len(words):
            for w, t in zip(words, script_words):
                w["text"] = t
        else:
            print(f"  aviso: {key} transcrito com {len(words)} palavras (roteiro tem {len(script_words)}); confira os índices W()")
        for w in words:
            w["start"] = round(w["start"] - cut, 3)
            w["end"] = round(w["end"] - cut, 3)
        timings["lines"][key] = {"text": text, "words": words}
        print(f"{key}: ok, {words[-1]['end']:.2f}s  {text}")
    timings["lines"] = {k: timings["lines"][k] for k in lines if k in timings["lines"]}
    OUT_JSON.write_text(json.dumps(timings, ensure_ascii=False, indent=2), encoding="utf-8")


main()
