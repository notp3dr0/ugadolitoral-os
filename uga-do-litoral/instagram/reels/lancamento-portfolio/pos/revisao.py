"""Folhas de revisao (saida/revisao/) e conferencia automatica de sincronia."""
import json
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

from comum import BATIDA_F, F_BATIDA, FPS, NQ, SEMI_F, OITAVA_F, TEMPO, batida_do_quadro

TW, TH = 270, 480


def _fonte(t):
    for n in ("arialbd.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(n, t)
        except OSError:
            pass
    return ImageFont.load_default(size=t)


class Coletor:
    def __init__(self, mon):
        self.mon = mon
        self.cortes = []
        ant = None
        for f in range(NQ):
            top = mon.topo(f)
            if ant is not None and top is not ant:
                self.cortes.append((f, ant["fonte"], top["fonte"]))
            ant = top
        fl = [f for f, e in sorted(mon.flash.items()) if e["tipo"] != "estrobo"]
        escolha = []
        for alvo in (436, 463, 651, 759):
            if alvo in fl:
                escolha.append(alvo)
        self.flashes = escolha[:3]
        self.rev = [int(x) for x in np.linspace(221, 424, 12)]
        quer = set()
        for f, _, _ in self.cortes:
            quer |= {f - 1, f}
        quer |= set(BATIDA_F.values())
        for fe in self.flashes:
            quer |= set(range(fe, fe + 6))
        quer |= set(self.rev)
        quer |= {425, 427, 430, 855, 858, 861, 919, 959}
        self.quer = {q for q in quer if 0 <= q < NQ}
        self.thumbs = {}
        self.info = {}

    def guarda(self, f, u8, info):
        self.info[f] = info
        if f in self.quer:
            self.thumbs[f] = cv2.resize(u8, (TW, TH), interpolation=cv2.INTER_AREA)


def _rotulo(im, txt, cor=(255, 255, 255)):
    p = Image.fromarray(im)
    d = ImageDraw.Draw(p)
    d.rectangle([0, 0, im.shape[1], 22], fill=(0, 0, 0))
    d.text((4, 3), txt, fill=cor, font=_fonte(15))
    return np.asarray(p)


def _grade(ims, cols, fundo=16):
    if not ims:
        return np.zeros((10, 10, 3), np.uint8)
    h, w = ims[0].shape[:2]
    rows = (len(ims) + cols - 1) // cols
    g = np.full((rows * (h + 6), cols * (w + 6), 3), fundo, np.uint8)
    for i, im in enumerate(ims):
        r, c = divmod(i, cols)
        g[r * (h + 6):r * (h + 6) + h, c * (w + 6):c * (w + 6) + w] = im
    return g


def _salva(g, p, maior=2400):
    s = min(1.0, maior / max(g.shape[:2]))
    if s < 1:
        g = cv2.resize(g, (round(g.shape[1] * s), round(g.shape[0] * s)), interpolation=cv2.INTER_AREA)
    Image.fromarray(g).save(p, quality=88)


def _bstr(f):
    b = (f / FPS - TEMPO["t0"]) / TEMPO["batida_s"]
    return f"b{b:.2f}"


def folhas(col, dirr, mp4, wav, cartoes, dur, mon):
    dirr.mkdir(parents=True, exist_ok=True)
    th = col.thumbs
    vazio = np.zeros((TH, TW, 3), np.uint8)
    T = lambda f: th.get(f, vazio)

    # cortes: ultimo antes / primeiro depois
    pares = []
    for f, a, b in col.cortes:
        l = _rotulo(T(f - 1), f"{f - 1} {a[:14]}")
        r = _rotulo(T(f), f"{f} {_bstr(f)} {b[:12]}", (255, 210, 120))
        pares.append(np.hstack([l, np.full((TH, 2, 3), 200, np.uint8), r]))
    _salva(_grade(pares, 6), dirr / "cortes.jpg")

    # uma batida por quadro
    def faixa(b0, b1, nome):
        ims = [_rotulo(T(BATIDA_F[b]), f"b{b}  q{BATIDA_F[b]}") for b in range(b0, b1) if b in BATIDA_F]
        _salva(_grade(ims, 8), dirr / f"batidas-{nome}.jpg")
    faixa(0, 16, "A"); faixa(16, 32, "B"); faixa(32, 48, "C1"); faixa(48, 64, "C2"); faixa(64, 69, "D")

    # flash: 6 primeiros quadros de tres flashes
    ims = []
    for fe in col.flashes:
        for k in range(6):
            ims.append(_rotulo(T(fe + k), f"{fe}+{k} {mon.flash[fe]['tipo']} {col.info[fe + k]['fonte'][:10]}"))
    _salva(_grade(ims, 6), dirr / "flash.jpg")

    # revelacao
    ims = [_rotulo(T(f), f"{f} {_bstr(f)}") for f in col.rev]
    _salva(_grade(ims, 6), dirr / "revelacao.jpg")

    # respiros (pos-imagem)
    ims = [_rotulo(T(f), f"{f}") for f in (424, 425, 427, 430, 854, 855, 858, 861) if f in th or True]
    _salva(_grade(ims, 8), dirr / "respiros.jpg")

    (dirr / "sincronia.txt").write_text(sincronia(col, mp4, wav, cartoes, dur, mon), encoding="utf-8")


def sincronia(col, mp4, wav, cartoes, dur, mon):
    L = []
    inf = col.info
    lumen = np.array([inf[f]["lumen"] for f in range(NQ)])
    luzv = np.array([inf[f]["luz"] for f in range(NQ)])
    grade = set(BATIDA_F.values()) | set(OITAVA_F.values()) | set(SEMI_F.values())
    L.append("CONFERENCIA DE SINCRONIA (gerada pelo montar.py)\n")
    # cortes na grade
    fora = [(f, a, b) for f, a, b in col.cortes if f not in set(BATIDA_F.values())]
    L.append(f"cortes: {len(col.cortes)}; fora de quadro de batida: {len(fora)}")
    for f, a, b in fora:
        L.append(f"   corte {f} ({a} -> {b}) cai em {_bstr(f)}" + (" (na grade de oitava/semicolcheia)" if f in grade else " FORA DA GRADE"))
    # flashes
    ok = 0; ruins = []
    for fe, ev in sorted(mon.flash.items()):
        na_grade = fe in grade
        pico = luzv[fe] > 0 and luzv[fe] >= luzv[min(fe + 1, NQ - 1)] and (fe == 0 or luzv[fe] > luzv[fe - 1] or ev["tipo"] == "estrobo")
        cai = lumen[fe] >= lumen[min(fe + 1, NQ - 1)] - 1e-6
        if na_grade and pico and cai:
            ok += 1
        else:
            ruins.append(f"   flash {fe} {ev['tipo']} {ev['fonte']}: grade={na_grade} pico_no_quadro={pico} luz_cai_depois={cai}")
    L.append(f"flashes: {len(mon.flash)}; com pico de luz exatamente no quadro da grade (tolerancia 0): {ok}")
    L += ruins
    # pulsos da secao A
    pa = []
    for b in range(16):
        f = BATIDA_F[b]
        pa.append(luzv[f] >= max(luzv[f - 1], luzv[f + 1]) and luzv[f] > 1.0)
    L.append(f"pulsos da linha (batidas 0 a 15): pico de ganho no quadro da batida em {sum(pa)}/16")
    pl = [b for b in range(16) if lumen[BATIDA_F[b]] >= lumen[BATIDA_F[b] + 1]]
    L.append(f"   luminancia medida cai depois do quadro da batida em {len(pl)}/16 "
             f"(onde nao cai e a camera/desenho trazendo linha nova)")
    L.append(f"degraus de revelacao: {len(mon.rev.deg)} (quadros {', '.join(str(q) for q, _ in mon.rev.deg)})")

    # video e audio do MP4
    try:
        pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-count_frames",
                                        "-of", "json", str(mp4)], capture_output=True, text=True).stdout)
        v = [s for s in pr["streams"] if s["codec_type"] == "video"][0]
        a = [s for s in pr["streams"] if s["codec_type"] == "audio"][0]
        L.append("")
        L.append(f"MP4: {mp4.name}  {v['codec_name']} {v.get('profile')} {v['width']}x{v['height']} {v['pix_fmt']} "
                 f"{v['r_frame_rate']} qps, {v.get('nb_read_frames')} quadros, cor {v.get('color_space')}/"
                 f"{v.get('color_primaries')}/{v.get('color_transfer')} {v.get('color_range')}")
        L.append(f"     audio {a['codec_name']} {a.get('bit_rate')} b/s {a['sample_rate']} Hz, inicio {a.get('start_time')} s, "
                 f"duracao {a.get('duration')} s; video inicio {v.get('start_time')} s, duracao {v.get('duration')} s; "
                 f"arquivo {float(pr['format']['duration']):.3f} s")
        # deslocamento real do audio decodificado contra a trilha
        with tempfile.TemporaryDirectory() as td:
            dec = Path(td) / "a.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-map", "0:a", "-ac", "1", "-ar", "44100",
                            str(dec)], check=True)
            y, sr = sf.read(str(dec))
        x, sr2 = sf.read(str(wav))
        x = x.mean(axis=1) if x.ndim > 1 else x
        n = sr * 4
        seg = slice(int(sr * 14.0), int(sr * 14.0) + n)   # em volta do drop
        a1, b1 = x[seg], y[seg]
        c = np.correlate(b1[2000:-2000], a1, "valid")
        off = int(np.argmax(c)) - 2000
        L.append(f"     deslocamento do audio do MP4 contra a trilha, medido em volta do drop: {off} amostras "
                 f"({off / sr * 1000:.2f} ms)")
        L.append(f"     duracao do audio decodificado: {len(y) / sr:.4f} s")
    except Exception as e:  # nao derruba a montagem
        L.append(f"(nao consegui conferir o MP4: {e})")

    # a batida 32 no som cai no quadro 436?
    try:
        import librosa
        x, sr = sf.read(str(wav))
        x = x.mean(axis=1)
        t32 = TEMPO["t0"] + 32 * TEMPO["batida_s"]
        seg = x[int((t32 - 0.3) * sr):int((t32 + 0.3) * sr)]
        on = librosa.onset.onset_detect(y=seg.astype(np.float32), sr=sr, units="time", hop_length=128, backtrack=False)
        if len(on):
            tt = on[np.argmin(np.abs(on - 0.3))] + t32 - 0.3
            L.append(f"     ataque mais proximo da batida 32 no som: {tt:.3f} s = quadro {tt * FPS:.2f} "
                     f"(grade: {t32:.3f} s, quadro {BATIDA_F[32]})")
    except Exception as e:
        L.append(f"(sem conferencia de ataque: {e})")

    L.append("")
    L.append(f"planos em cartao cinza nesta montagem: {', '.join(cartoes) or 'nenhum'}")
    L.append(f"tempo de montagem: {dur:.0f} s")
    return "\n".join(L) + "\n"
