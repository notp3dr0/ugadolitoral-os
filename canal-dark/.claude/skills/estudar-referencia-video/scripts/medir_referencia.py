#!/usr/bin/env python3
"""Mede um vídeo de referência e devolve números, não impressão.

Uso:
  python medir_referencia.py <video.mp4> <pasta-saida> [--ini 0] [--dur 90] [--crop W:H:X:Y]

Gera em <pasta-saida>:
  medidas.json    cortes, ritmo, loudness, silêncios, duração
  quadros/        1 quadro por segundo (jpg, 360 px de largura)
  folhas/         folhas de contato (5x4 quadros, com o segundo escrito)

--ini/--dur recortam o trecho medido (útil quando o vídeo é uma gravação de tela
com o episódio dentro). --crop recorta só a região do episódio (formato ffmpeg).
Depende só de ffmpeg e ffprobe no PATH.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("saida")
    ap.add_argument("--ini", type=float, default=0)
    ap.add_argument("--dur", type=float, default=None)
    ap.add_argument("--crop", default=None, help="W:H:X:Y")
    ap.add_argument("--cena", type=float, default=0.08,
                    help="limiar de corte (0-1). 0.08 foi calibrado em animação escura; "
                         "cena clara pede mais (0.2-0.3). Confira contra a folha de contato.")
    ap.add_argument("--silencio-db", type=float, default=-45)
    a = ap.parse_args()

    out = Path(a.saida)
    (out / "quadros").mkdir(parents=True, exist_ok=True)
    (out / "folhas").mkdir(parents=True, exist_ok=True)

    trecho = ["-ss", str(a.ini)] + (["-t", str(a.dur)] if a.dur else [])
    crop = f"crop={a.crop}," if a.crop else ""

    # duração do trecho
    probe = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.video])
    total = float(probe.stdout.strip() or 0)
    dur = a.dur or max(total - a.ini, 0)

    # cortes (mudança de cena)
    r = run(["ffmpeg", "-v", "info", *trecho, "-i", a.video,
             "-vf", f"{crop}select='gt(scene,{a.cena})',showinfo", "-an", "-f", "null", "-"])
    cortes = [round(float(m), 2) for m in re.findall(r"pts_time:([\d.]+)", r.stderr)]
    intervalos = [round(b - a_, 2) for a_, b in zip([0] + cortes, cortes + [dur])]

    # loudness integrado e pico
    r = run(["ffmpeg", "-v", "info", *trecho, "-i", a.video, "-vn",
             "-af", "ebur128=peak=true", "-f", "null", "-"])
    resumo = r.stderr.split("Summary:")[-1] if "Summary:" in r.stderr else ""
    lufs = re.search(r"I:\s+(-?[\d.]+) LUFS", resumo)
    lra = re.search(r"LRA:\s+([\d.]+) LU", resumo)
    pico = re.search(r"Peak:\s+(-?[\d.]+) dBFS", resumo)

    # silêncios
    r = run(["ffmpeg", "-v", "info", *trecho, "-i", a.video, "-vn",
             "-af", f"silencedetect=n={a.silencio_db}dB:d=0.3", "-f", "null", "-"])
    ini = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r.stderr)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    silencios = [{"ini": round(max(i, 0), 2), "fim": round(f, 2)} for i, f in zip(ini, fim)]

    # grave por trecho (energia abaixo de 150 Hz, janela de 1 s)
    r = run(["ffmpeg", "-v", "info", *trecho, "-i", a.video, "-vn",
             "-af", "lowpass=f=150,asetnsamples=n=44100,astats=metadata=1:reset=1,"
                    "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
             "-f", "null", "-"])
    grave = [float(x) for x in re.findall(r"RMS_level=(-?[\d.]+|-inf)", r.stdout.replace("-inf", "-99"))]

    # quadros 1/s e folhas de contato
    run(["ffmpeg", "-v", "error", "-y", *trecho, "-i", a.video,
         "-vf", f"{crop}fps=1,scale=360:-1", "-q:v", "4", str(out / "quadros" / "%04d.jpg")])
    run(["ffmpeg", "-v", "error", "-y", *trecho, "-i", a.video,
         "-vf", f"{crop}fps=1,scale=300:-1,drawtext=text='%{{pts\\:hms}}':x=6:y=6:fontsize=22:"
                f"fontcolor=white:box=1:boxcolor=black@0.6,tile=5x4",
         "-q:v", "4", str(out / "folhas" / "folha_%02d.jpg")])

    medidas = {
        "video": a.video, "trecho": {"ini": a.ini, "dur": round(dur, 2)}, "crop": a.crop,
        "cortes": {"n": len(cortes), "tempos": cortes,
                   "intervalo_medio_s": round(sum(intervalos) / len(intervalos), 2) if intervalos else None,
                   "intervalo_max_s": max(intervalos) if intervalos else None},
        "som": {"lufs": float(lufs.group(1)) if lufs else None,
                "lra": float(lra.group(1)) if lra else None,
                "pico_dbfs": float(pico.group(1)) if pico else None},
        "silencios": silencios,
        "grave_rms_db_por_s": grave,
        "obs": "Se o vídeo é gravação de tela, meça só o trecho do episódio (--ini/--dur/--crop): "
               "voz do apresentador e interface sujam som e cortes.",
    }
    (out / "medidas.json").write_text(json.dumps(medidas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: medidas[k] for k in ("trecho", "cortes", "som")}, ensure_ascii=False))
    print(f"silêncios: {len(silencios)} | folhas em {out / 'folhas'}")


if __name__ == "__main__":
    sys.exit(main())
