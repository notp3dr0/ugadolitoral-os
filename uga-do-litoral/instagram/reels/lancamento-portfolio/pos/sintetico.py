"""Corredor falso pra desenvolver a luz antes das sequencias reais chegarem.
Gera A1_planta (fio, prof), B1_travessia (cor, fio, prof) e C5a_seguranca (cor, fio, prof) numa raiz
de quadros separada (nunca em quadros/). Uso: python pos/sintetico.py <raiz_destino> [escala]"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

W, H = 1080, 1920
XW, YC, ZEND = 1.6, 3.2, 70.0


def render(cam, yaw, pitch, esc=1.0):
    w, h = int(W * esc), int(H * esc)
    fov = np.radians(62)
    f = (h / 2) / np.tan(fov / 2)
    xs = (np.arange(w) - w / 2 + 0.5) / f
    ys = -(np.arange(h) - h / 2 + 0.5) / f
    dx, dy = np.meshgrid(xs, ys)
    dz = np.ones_like(dx)
    # pitch (em torno de x), depois yaw (em torno de y)
    cp, sp = np.cos(pitch), np.sin(pitch)
    dy, dz = dy * cp + dz * sp, -dy * sp + dz * cp
    cy_, sy_ = np.cos(yaw), np.sin(yaw)
    dx, dz = dx * cy_ + dz * sy_, -dx * sy_ + dz * cy_
    n = np.sqrt(dx * dx + dy * dy + dz * dz)
    dx, dy, dz = dx / n, dy / n, dz / n
    ox, oy, oz = cam
    INF = np.float64(1e9)
    with np.errstate(divide="ignore", invalid="ignore"):
        tl = np.where(dx < 0, (-XW - ox) / dx, INF)
        tr = np.where(dx > 0, (XW - ox) / dx, INF)
        tf = np.where(dy < 0, (0 - oy) / dy, INF)
        tc = np.where(dy > 0, (YC - oy) / dy, INF)
        te = np.where(dz > 0, (ZEND - oz) / dz, INF)
    T = np.stack([tl, tr, tf, tc, te])
    T[T <= 0] = INF
    idx = T.argmin(0)
    t = T.min(0)
    X, Y, Z = ox + dx * t, oy + dy * t, oz + dz * t
    # profundidade = distancia
    dist = t
    # textura
    rng_h = lambda a, b: np.sin(a * 12.9898 + b * 78.233) * 43758.5453 % 1.0
    wall = (idx <= 1)
    u = np.where(wall, Z, np.where(idx == 4, X, Z))
    v = np.where(wall, Y, np.where(idx == 4, Y, X))
    noise = rng_h(np.floor(u * 8), np.floor(v * 8)) * 0.08
    base = np.where(idx == 2, 0.18, np.where(idx == 3, 0.06, 0.32)) + noise
    cor = np.stack([base * 1.0, base * 0.97, base * 0.93], -1)
    # copias (fotos) na parede: retangulos coloridos a cada 4 m
    cell = np.floor(Z / 4.0)
    fz = Z - cell * 4.0
    quad = wall & (fz > 1.2) & (fz < 2.8) & (Y > 1.0) & (Y < 2.3)
    hue = rng_h(cell, idx.astype(float))
    pal = np.stack([0.6 + 0.4 * np.sin(hue * 6.28), 0.3 + 0.3 * np.sin(hue * 6.28 + 2), 0.4 + 0.4 * np.sin(hue * 6.28 + 4)], -1)
    grad = (0.5 + 0.5 * np.sin(fz * 7 + Y * 5))[..., None]
    cor = np.where(quad[..., None], pal * (0.4 + 0.6 * grad), cor)
    # luz vermelha do corredor no chao
    cor[..., 0] += np.where(idx == 2, 0.08 * (np.sin(Z * 0.8) > 0.6), 0)
    # fio: arestas e juntas
    px = dist / f  # tamanho do pixel no mundo
    lw = np.maximum(px * 1.3, 0.004)
    def near(a, b): return np.abs(a - b) < lw
    fio = np.zeros_like(X)
    fio = np.maximum(fio, (wall & (near(Y, 0) | near(Y, YC))).astype(float))
    fio = np.maximum(fio, ((idx == 2) & (near(np.abs(X), XW))).astype(float))
    fio = np.maximum(fio, ((idx == 3) & (near(np.abs(X), XW))).astype(float))
    junta = np.abs(((Z + 1.0) % 2.0) - 1.0) < lw * 0.7
    fio = np.maximum(fio, ((idx <= 3) & junta).astype(float) * 0.7)
    borda = quad & ((np.abs(fz - 1.2) < lw) | (np.abs(fz - 2.8) < lw) | (np.abs(Y - 1.0) < lw) | (np.abs(Y - 2.3) < lw))
    q2 = wall & (fz > 1.2 - lw) & (fz < 2.8 + lw) & (Y > 1.0 - lw) & (Y < 2.3 + lw)
    fio = np.maximum(fio, (q2 & ~((fz > 1.2 + lw) & (fz < 2.8 - lw) & (Y > 1.0 + lw) & (Y < 2.3 - lw))).astype(float))
    fio = np.maximum(fio, ((idx == 4) & ((np.abs(X) > XW - lw * 2) | near(Y, 0))).astype(float))
    if esc != 1.0:
        cor = cv2.resize(cor.astype(np.float32), (W, H)); fio = cv2.resize(fio.astype(np.float32), (W, H))
        dist = cv2.resize(dist.astype(np.float32), (W, H), interpolation=cv2.INTER_NEAREST)
    cor_u8 = (np.clip(cor, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)
    fio_u8 = (np.clip(fio, 0, 1) * 255).astype(np.uint8)
    v = np.clip(dist / 30.0 * 65535, 0, 65535)
    v[dist > 30] = 65535
    v = v.astype(np.uint16)
    prof = np.zeros((H, W, 3), np.uint8)
    prof[..., 2] = v >> 8   # R (BGR)
    prof[..., 1] = v & 255  # G
    return cor_u8, fio_u8, prof


def gravar(raiz, sid, n, camfn, passes):
    d = raiz / sid
    for p in passes:
        (d / p).mkdir(parents=True, exist_ok=True)
    for i in range(n):
        cam, yaw, pitch = camfn(i, n)
        cor, fio, prof = render(cam, yaw, pitch, ESC)
        if "cor" in passes:
            cv2.imwrite(str(d / "cor" / f"{i:06d}.jpg"), cv2.cvtColor(cor, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
        if "fio" in passes:
            cv2.imwrite(str(d / "fio" / f"{i:06d}.jpg"), fio, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if "prof" in passes:
            cv2.imwrite(str(d / "prof" / f"{i:06d}.png"), prof)
    (d / "pronto.json").write_text(json.dumps({"quadros": n, "passes": passes, "obs": "SINTETICO"}), encoding="utf-8")
    print(sid, n)


if __name__ == "__main__":
    raiz = Path(sys.argv[1])
    ESC = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
    ease = lambda x: x * x * (3 - 2 * x)
    # A1: comeca olhando pra baixo do alto, inclina e desce ate a entrada
    gravar(raiz, "A1_planta", 223, lambda i, n: ((0, 3.0 - 1.4 * ease(i / n), -2 + 3 * (i / n) ** 2),
                                                 0.05 * np.sin(i / 40), np.radians(-60 * (1 - ease(i / n)))),
           ["fio", "prof"])
    # B1: anda e acelera
    gravar(raiz, "B1_travessia", 217, lambda i, n: ((0.2 * np.sin(i / 50), 1.6, 1 + 3 * i / n + 22 * (i / n) ** 2),
                                                    0.12 * np.sin(i / 35), 0.0), ["cor", "fio", "prof"])
    gravar(raiz, "C5a_seguranca", 31, lambda i, n: ((0.5, 1.6, 30 + 0.05 * i), -0.35, 0.0), ["cor", "fio", "prof"])
