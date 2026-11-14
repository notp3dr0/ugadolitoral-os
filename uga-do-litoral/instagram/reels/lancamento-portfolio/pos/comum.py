"""Coisas comuns do laboratorio: caminhos, grade de tempo, conversao sRGB <-> linear, leitura de passes."""
import json
import os
from pathlib import Path

import cv2
import numpy as np

POS = Path(__file__).resolve().parent
PROJ = POS.parent
SITE = PROJ.parents[2] / "portfolio" / "site-lab"
ASSETS = SITE / "assets"
SAIDA = PROJ / "saida"
REVISAO = SAIDA / "revisao"
AUDIO = PROJ / "audio"

TEMPO = json.loads((PROJ / "tempo.json").read_text(encoding="utf-8"))
MONTAGEM = json.loads((PROJ / "montagem.json").read_text(encoding="utf-8"))

FPS = TEMPO["fps"]
W, H = TEMPO["largura"], TEMPO["altura"]
NQ = TEMPO["quadros"]

BATIDA_F = {b["b"]: b["f"] for b in TEMPO["batidas"]}          # batida -> quadro
F_BATIDA = {b["f"]: b["b"] for b in TEMPO["batidas"]}          # quadro -> batida
OITAVA_F = {o["b"]: o["f"] for o in TEMPO["oitavas"]}
SEMI_F = {s["b"]: s["f"] for s in TEMPO["semicolcheias"]}

# vermelho que o corredor ja usa (site-lab/bastidor/sheet.js: RED = '#fa1717')
VERMELHO_SRGB = np.array([0xfa, 0x17, 0x17], np.float32) / 255.0


# ---------- sRGB <-> linear (por tabela, rapido) ----------
def _srgb_to_lin(x):
    x = np.asarray(x, np.float64)
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def _lin_to_srgb(x):
    x = np.asarray(x, np.float64)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(np.maximum(x, 0), 1 / 2.4) - 0.055)


LUT_DEC = _srgb_to_lin(np.arange(256) / 255.0).astype(np.float32)
_ENC_N = 8192
LUT_ENC = np.clip(np.round(_lin_to_srgb(np.arange(_ENC_N) / (_ENC_N - 1)) * 255), 0, 255).astype(np.uint8)
LUT_ENC_F = _lin_to_srgb(np.arange(_ENC_N) / (_ENC_N - 1)).astype(np.float32)

VERMELHO_LIN = _srgb_to_lin(VERMELHO_SRGB).astype(np.float32)


def dec(img_u8):
    """uint8 sRGB -> float32 linear"""
    return LUT_DEC[img_u8]


def enc_f(lin):
    """float linear [0,1] -> float sRGB [0,1] (sem quantizar em 8 bits)"""
    idx = np.clip(lin * (_ENC_N - 1) + 0.5, 0, _ENC_N - 1).astype(np.int32)
    return LUT_ENC_F[idx]


def enc(lin):
    idx = np.clip(lin * (_ENC_N - 1) + 0.5, 0, _ENC_N - 1).astype(np.int32)
    return LUT_ENC[idx]


def lum(lin):
    return lin[..., 0] * 0.2126 + lin[..., 1] * 0.7152 + lin[..., 2] * 0.0722


# ---------- leitura de passes ----------
def ler_rgb(path):
    im = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if im is None:
        raise FileNotFoundError(path)
    return cv2.cvtColor(im, cv2.COLOR_BGR2RGB)


def ler_rgba(path):
    im = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if im is None:
        raise FileNotFoundError(path)
    if im.ndim == 2:
        im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGRA)
    if im.shape[2] == 3:
        im = cv2.cvtColor(im, cv2.COLOR_BGR2BGRA)
    if im.dtype == np.uint16:
        im = (im >> 8).astype(np.uint8)
    return cv2.cvtColor(im, cv2.COLOR_BGRA2RGBA)


def ler_cinza(path):
    im = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if im is None:
        raise FileNotFoundError(path)
    if im.ndim == 3:
        im = im[..., :3].max(axis=2) if im.dtype == np.uint8 else im[..., :3].max(axis=2)
    if im.dtype == np.uint16:
        return im.astype(np.float32) / 65535.0
    return im.astype(np.float32) / 255.0


def ler_prof(path):
    """Distancia em metros (float32). 0..30 m linear em 16 bits; 65535 = vazio -> inf.
    Aceita PNG de 16 bits num canal, ou RGB de 8 bits com R = byte alto e G = byte baixo."""
    im = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if im is None:
        raise FileNotFoundError(path)
    if im.dtype == np.uint16:
        v = im if im.ndim == 2 else im[..., 2]  # BGR: canal R
        v = v.astype(np.float32)
    else:
        if im.ndim == 2:
            v = im.astype(np.float32) * 257.0
        else:
            r = im[..., 2].astype(np.float32)
            g = im[..., 1].astype(np.float32)
            v = r * 256.0 + g
    d = v / 65535.0 * 30.0
    d[v >= 65535] = np.inf
    return d


def ajusta(img, w=W, h=H):
    """Garante o tamanho de saida (cover, centralizado), caso a fonte venha em outro tamanho."""
    if img.shape[1] == w and img.shape[0] == h:
        return img
    s = max(w / img.shape[1], h / img.shape[0])
    nw, nh = round(img.shape[1] * s), round(img.shape[0] * s)
    interp = cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR
    r = cv2.resize(img, (nw, nh), interpolation=interp)
    x0, y0 = (nw - w) // 2, (nh - h) // 2
    return r[y0:y0 + h, x0:x0 + w]


def batida_do_quadro(f):
    """batida (inteira) cujo quadro e o maior <= f"""
    bs = [b for b, ff in BATIDA_F.items() if ff <= f]
    return max(bs) if bs else 0
