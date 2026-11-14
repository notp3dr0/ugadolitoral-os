"""Tempos por palavra para a voz do Gemini (que não devolve timestamps).

Transcreve cada public/audio/vo/<fala>.src.wav com `npx hyperframes transcribe` (Parakeet local) e
alinha o resultado ao texto aprovado de scripts/narration.json: as palavras finais são as do roteiro
(mesmos índices que W("sN", i) usa), com os tempos da transcrição. Palavras que a transcrição errou
são casadas por posição; faltantes recebem tempo interpolado. Avisa se a fala tiver palavras a mais
(sinal de que o modelo leu a instrução de estilo ou improvisou).

Uso (na raiz do projeto):  python scripts/align_words.py [s1 s3 ...]
Saída: scripts/out/vo-timings.json (formato do voiceover.py). Depois: python scripts/prepare_vo.py
"""

import difflib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

ROOT = Path.cwd()
VO = ROOT / "public" / "audio" / "vo"
LINES = json.loads((ROOT / "scripts" / "narration.json").read_text(encoding="utf-8-sig"))
OUT = ROOT / "scripts" / "out" / "vo-timings.json"


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


def transcribe(wav: Path) -> list[dict]:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "a.wav"
        shutil.copy(wav, src)
        subprocess.run(
            f'npx hyperframes transcribe "{src}" --dir "{tmp}" --language pt --json',
            shell=True, check=True, capture_output=True,
        )
        data = json.loads((Path(tmp) / "transcript.json").read_text(encoding="utf-8"))
    words = data["words"] if isinstance(data, dict) else data
    return [{"text": w["text"], "start": float(w["start"]), "end": float(w["end"])} for w in words if norm(w["text"])]


def align(script: list[str], heard: list[dict]) -> tuple[list[dict], int]:
    a = [norm(w) for w in script]
    b = [norm(w["text"]) for w in heard]
    times: list[tuple[float, float] | None] = [None] * len(script)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k]["start"], heard[j1 + k]["end"])
        elif tag == "replace" and j2 > j1:
            # blocos de tamanhos diferentes: reparte o intervalo ouvido pelas palavras do roteiro
            t0, t1 = heard[j1]["start"], heard[j2 - 1]["end"]
            n = i2 - i1
            for k in range(n):
                times[i1 + k] = (t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n)
    # faltantes: interpola entre vizinhos conhecidos
    for i, t in enumerate(times):
        if t is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
            nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), prev + 0.3)
            times[i] = (prev, max(prev + 0.05, nxt))
    extra = max(0, len(b) - len(a))
    return [{"text": w, "start": round(t[0], 3), "end": round(t[1], 3)} for w, t in zip(script, times)], extra


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    only = set(sys.argv[1:])
    timings = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"lines": {}}
    timings.update({"provider": "gemini", "voice": timings.get("voice", "Charon")})
    for key, text in LINES.items():
        if only and key not in only:
            continue
        heard = transcribe(VO / f"{key}.src.wav")
        words, extra = align(text.split(), heard)
        timings["lines"][key] = {"text": text, "words": words}
        flag = f"  ATENÇÃO: {extra} palavra(s) a mais na fala" if extra else ""
        print(f"{key}: {len(heard)} ouvidas / {len(words)} no roteiro, fim {words[-1]['end']:.2f}s{flag}")
        print("   ouvido:", " ".join(w["text"] for w in heard))
    timings["lines"] = {k: timings["lines"][k] for k in LINES if k in timings["lines"]}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(timings, ensure_ascii=False, indent=2), encoding="utf-8")


main()
