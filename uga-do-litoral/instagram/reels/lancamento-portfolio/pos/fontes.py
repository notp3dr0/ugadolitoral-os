"""Fontes de imagem: sequencias dos outros agentes, fotos em tela cheia, trechos de filme e cartao cinza.
Tudo devolve float32 linear (H, W, 3); passes auxiliares (fio, prof, alfa) quando existem."""
import json
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from comum import ASSETS, H, W, FPS, POS, ajusta, dec, ler_cinza, ler_prof, ler_rgb, ler_rgba


class Quadro:
    """Um quadro de fonte: cor (linear), e opcionais fio (0..1), prof (m), alfa (0..1)."""
    __slots__ = ("cor", "fio", "prof", "alfa", "cartao")

    def __init__(self, cor, fio=None, prof=None, alfa=None, cartao=False):
        self.cor, self.fio, self.prof, self.alfa, self.cartao = cor, fio, prof, alfa, cartao


# ---------------- sequencias ----------------
class Sequencia:
    def __init__(self, raiz: Path, sid: str):
        self.id = sid
        self.dir = raiz / sid
        pj = self.dir / "pronto.json"
        self.pronto = None
        self.passes = {}
        self.n = 0
        if pj.exists():
            try:
                self.pronto = json.loads(pj.read_text(encoding="utf-8"))
            except Exception:
                self.pronto = None
        if self.pronto is not None:
            for p in ("cor", "fio", "prof", "alfa", "rgba"):
                d = self.dir / p
                if d.is_dir():
                    fs = sorted([x for x in d.iterdir() if x.suffix.lower() in (".jpg", ".jpeg", ".png")])
                    if fs:
                        self.passes[p] = fs
            # sequencia com transparencia entregue sem subpasta (ex.: G1_nome/*.png)
            if not self.passes:
                fs = sorted([x for x in self.dir.iterdir() if x.suffix.lower() in (".png", ".jpg")])
                if fs:
                    self.passes["cor"] = fs
            if self.passes:
                self.n = min(len(v) for v in self.passes.values())

    @property
    def pronta(self):
        return self.pronto is not None and self.n > 0

    def _arq(self, passe, i):
        fs = self.passes[passe]
        return fs[int(np.clip(i, 0, len(fs) - 1))]

    def quadro(self, i, querer=("cor", "fio", "prof")):
        cor = fio = prof = alfa = None
        if "cor" in self.passes and "cor" in querer:
            a = self._arq("cor", i)
            if a.suffix.lower() == ".png":
                rgba = ler_rgba(a)
                rgba = ajusta(rgba)
                cor = dec(rgba[..., :3])
                if rgba.shape[2] == 4:
                    alfa = rgba[..., 3].astype(np.float32) / 255.0
                    if alfa.min() >= 0.999:
                        alfa = None
            else:
                cor = dec(ajusta(ler_rgb(a)))
        if "rgba" in self.passes:
            rgba = ajusta(ler_rgba(self._arq("rgba", i)))
            cor = dec(rgba[..., :3]); alfa = rgba[..., 3].astype(np.float32) / 255.0
        if "fio" in self.passes and "fio" in querer:
            fio = ajusta(ler_cinza(self._arq("fio", i)))
        if "prof" in self.passes and "prof" in querer:
            prof = ajusta(ler_prof(self._arq("prof", i)))
        if "alfa" in self.passes:
            alfa = ajusta(ler_cinza(self._arq("alfa", i)))
        if cor is None and fio is not None:
            cor = np.repeat(fio[..., None] ** 2.2, 3, axis=2)
        return Quadro(cor, fio, prof, alfa)


# ---------------- cartao cinza ----------------
def _fonte(tam):
    for nome in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(nome, tam)
        except OSError:
            pass
    return ImageFont.load_default(size=tam)


def cartao(sid, local, f, total=None):
    im = Image.new("RGB", (W, H), (92, 92, 92))
    d = ImageDraw.Draw(im)
    d.rectangle([40, 40, W - 40, H - 40], outline=(150, 150, 150), width=4)
    d.text((W // 2, H // 2 - 140), sid, fill=(235, 235, 235), font=_fonte(96), anchor="mm")
    d.text((W // 2, H // 2), f"local {local}" + (f" / {total}" if total else ""), fill=(210, 210, 210),
           font=_fonte(72), anchor="mm")
    d.text((W // 2, H // 2 + 120), f"quadro {f}", fill=(170, 170, 170), font=_fonte(56), anchor="mm")
    return Quadro(dec(np.asarray(im)), cartao=True)


# ---------------- fotos ----------------
FOTOS = json.loads((POS / "fotos.json").read_text(encoding="utf-8")) if (POS / "fotos.json").exists() else {}


@lru_cache(maxsize=3)
def _foto_base(arquivo, cover_extra=1.12):
    """Foto ja decodificada em linear, redimensionada pra cobrir 1080x1920 com folga pro movimento."""
    p = Path(arquivo)
    if not p.is_absolute():
        p = ASSETS / arquivo
    im = np.asarray(Image.open(p).convert("RGB"))
    s = max(W / im.shape[1], H / im.shape[0]) * cover_extra
    nw, nh = round(im.shape[1] * s), round(im.shape[0] * s)
    interp = cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC
    r = cv2.resize(im, (nw, nh), interpolation=interp)
    return dec(r), s / cover_extra


def foto(arquivo, t, cx=0.5, cy=0.5, z0=1.0, z1=1.07, dx=0.0, dy=0.0):
    """Quadro da foto em cover 9:16 no instante t (0..1 do plano).
    cx, cy: centro do corte (fracao da foto). z: escala sobre o cover. dx, dy: deriva em fracao da tela.
    O avanco e linear (velocidade constante) pra o corte carregar o movimento de uma foto pra outra."""
    base, s_cover = _foto_base(arquivo)
    bh, bw = base.shape[:2]
    k = 1.12  # folga usada em _foto_base
    z = z0 + (z1 - z0) * t
    # escala da base pro quadro: base esta em cover*k; queremos cover*z
    esc = z / k
    # centro desejado em pixels da base
    cxp = cx * bw + dx * t * W / esc
    cyp = cy * bh + dy * t * H / esc
    # limita pra nao mostrar borda
    meia_w, meia_h = W / 2 / esc, H / 2 / esc
    cxp = float(np.clip(cxp, meia_w, bw - meia_w))
    cyp = float(np.clip(cyp, meia_h, bh - meia_h))
    M = np.array([[esc, 0, W / 2 - esc * cxp], [0, esc, H / 2 - esc * cyp]], np.float32)
    img = cv2.warpAffine(base, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return Quadro(img)


# ---------------- fotos lado a lado (formato horizontal) ----------------
@lru_cache(maxsize=8)
def _foto_altura(arquivo, altura):
    p = Path(arquivo)
    if not p.is_absolute():
        p = ASSETS / arquivo
    im = np.asarray(Image.open(p).convert("RGB"))
    s = altura / im.shape[0]
    r = cv2.resize(im, (round(im.shape[1] * s), altura), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    return dec(r)


def foto_fila(fila, i, k, n):
    """Horizontal: as fotos (verticais) em fila, inteiras, sem corte. A da vez no centro, acesa; as vizinhas
    escurecem com a distancia. Na batida a fila desliza uma posicao (6 quadros, saida suave) e segue andando
    devagar. A primeira (p1) chega do mergulho: comeca cobrindo a altura do quadro e abre ate o tamanho da fila."""
    HC = round(H * .80)
    GAP = round(W * .02)
    BH = round(HC * 1.08)
    bases = [_foto_altura(a, BH) for a in fila]
    larg = [b.shape[1] * HC / BH for b in bases]
    xs = [0.0]
    for j in range(1, len(fila)):
        xs.append(xs[-1] + larg[j - 1] / 2 + GAP + larg[j] / 2)
    ease = lambda u: 1 - (1 - min(1.0, max(0.0, u))) ** 3
    c = xs[i]
    if i > 1 and k < 6:
        c = xs[i - 1] + (xs[i] - xs[i - 1]) * ease(k / 6)
    c += (k / max(1, n)) * W * .012              # deriva continua: o movimento atravessa os cortes
    esc = 1 + .03 * (k / max(1, n))
    if i == 1:                                    # p1 sai do mergulho (foto na altura inteira) e abre pra fila
        esc *= (H / HC) + (1 - H / HC) * ease(k / 8)
    out = np.zeros((H, W, 3), np.float32)
    um = np.ones(bases[0].shape[:2], np.float32)
    for j, b in enumerate(bases):
        X = W / 2 + (xs[j] - c) * esc
        meia = larg[j] * esc / 2
        if X + meia < -2 or X - meia > W + 2:
            continue
        a = HC * esc / BH
        M = np.array([[a, 0, X - a * b.shape[1] / 2], [0, a, H / 2 - a * BH / 2]], np.float32)
        img = cv2.warpAffine(b, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        m = cv2.warpAffine(um if um.shape == b.shape[:2] else np.ones(b.shape[:2], np.float32), M, (W, H),
                           flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)[..., None]
        d = min(1.0, abs(xs[j] - c) / (HC * .8))
        ganho = 1 - .8 * d
        out = out * (1 - m) + img * ganho * m
    return Quadro(out)


# ---------------- filmes ----------------
FILMES = json.loads((POS / "filmes.json").read_text(encoding="utf-8")) if (POS / "filmes.json").exists() else {}


@lru_cache(maxsize=2)
def _filme_quadros(n_filme, inicio_s, n_saida, cx=0.5):
    """Quadros do trecho (uint8 sRGB, ja em 9:16). Conversao pro relogio de 30 qps: quadro mais proximo.
    Le o filme em ordem e guarda so os quadros que o trecho usa."""
    p = ASSETS / f"film-{n_filme}-preview-1080.mp4"
    cap = cv2.VideoCapture(str(p))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    idx = [int(np.clip(round((inicio_s + k / FPS) * fps), 0, total - 1)) for k in range(n_saida)]
    quer = set(idx)
    guard = {}
    i = 0
    while i <= max(idx):
        ok, fr = cap.read()
        if not ok:
            break
        if i in quer:
            guard[i] = fr
        i += 1
    cap.release()
    ult = guard[max(guard)]
    out = []
    for i in idx:
        fr = cv2.cvtColor(guard.get(i, ult), cv2.COLOR_BGR2RGB)
        h, w = fr.shape[:2]
        if W > H and w < h:  # saida horizontal, filme vertical: inteiro, no centro, sobre preto (sem esticar nem cortar)
            esc = H / h
            r = cv2.resize(fr, (round(w * esc), H), interpolation=cv2.INTER_AREA if esc < 1 else cv2.INTER_LINEAR)
            tela = np.zeros((H, W, 3), np.uint8)
            x0 = (W - r.shape[1]) // 2
            tela[:, x0:x0 + r.shape[1]] = r
            out.append(tela)
            continue
        if w / h > W / H:  # horizontal: corte central 9:16
            cw = round(h * W / H)
            x0 = int(np.clip(round(cx * w - cw / 2), 0, w - cw))
            fr = fr[:, x0:x0 + cw]
        out.append(ajusta(fr))
    return out


def filme(chave, k, n_saida):
    cfg = FILMES[chave]
    qs = _filme_quadros(cfg["filme"], cfg["inicio_s"], n_saida, cfg.get("cx", 0.5))
    return Quadro(dec(qs[int(np.clip(k, 0, len(qs) - 1))]))
