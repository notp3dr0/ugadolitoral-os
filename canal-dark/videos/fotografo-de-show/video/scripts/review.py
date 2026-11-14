"""Folhas de revisão por cena (5 quadros + fala + números) e uma página HTML que junta tudo.

Lê out/stills/fNNNN.png (gerados por stills.mjs com os quadros de scripts/out/review-frames.json)
e grava ../revisao/cena-XX.png + ../revisao/index.html (na pasta da produção, fora do projeto).
Uso: python scripts/review.py
"""
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path.cwd()
OUT = ROOT.parent / "revisao"
OUT.mkdir(exist_ok=True)
frames = json.loads((ROOT / "scripts" / "out" / "review-frames.json").read_text())
lines = json.loads((ROOT / "scripts" / "narration.json").read_text(encoding="utf-8"))
NAMES = [
    "Gancho", "Dois empregos", "Cofrinho", "A câmera", "Sem cliente", "Pagamento em experiência",
    "Melhor trabalho", "DMs", "Credencial", "Economia da credencial", "Seis meses", "Moral e loop",
]
FONT = "C:/Windows/Fonts/arialbd.ttf"
f_title = ImageFont.truetype(FONT, 34)
f_text = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 24)
f_tag = ImageFont.truetype(FONT, 22)

tc = lambda fr: f"{fr // 30 // 60:02d}:{fr // 30 % 60:02d}:{fr % 30:02d}"

html = ["<!DOCTYPE html><html lang='pt-BR'><head><meta charset='utf-8'><title>Revisão · Fotógrafo de show</title>",
        "<style>body{background:#0b0d12;color:#f2f0eb;font-family:Arial,sans-serif;margin:32px}h1{font-size:28px}h2{font-size:20px;margin:36px 0 6px}"
        "p{color:#b9b5ad;margin:0 0 12px;max-width:900px}.row{display:flex;gap:10px;flex-wrap:wrap}.row figure{margin:0}.row img{width:216px;border-radius:6px;display:block}"
        "figcaption{font-size:13px;color:#f6c518;margin-top:4px}</style></head><body>",
        "<h1>Como funciona a carreira de fotógrafo de show? · revisão quadro a quadro</h1>",
        "<p>90 s · 1080×1920 · 30 fps. Cinco quadros por cena (início, 30%, 55%, 80%, fim). Diga o número do quadro ou da cena pra mudar algo.</p>"]

for i in range(12):
    fs = frames[i * 5:(i + 1) * 5]
    ims = [Image.open(ROOT / "out" / "stills" / f"f{fr:04d}.png").convert("RGB") for fr in fs]
    w, h = ims[0].size
    pad, head = 14, 112
    sheet = Image.new("RGB", (5 * w + 6 * pad, h + head + pad + 36), (11, 13, 18))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 14), f"CENA {i + 1:02d} · {NAMES[i].upper()}", font=f_title, fill=(246, 197, 24))
    d.text((pad, 60), "“" + lines[f"s{i + 1}"] + "”", font=f_text, fill=(242, 240, 235))
    for k, (fr, im) in enumerate(zip(fs, ims)):
        x = pad + k * (w + pad)
        sheet.paste(im, (x, head))
        d.text((x, head + h + 8), f"quadro {fr} · {tc(fr)}", font=f_tag, fill=(185, 181, 173))
    name = f"cena-{i + 1:02d}.png"
    sheet.save(OUT / name)
    html.append(f"<h2>Cena {i + 1:02d} · {NAMES[i]}</h2><p>“{lines[f's{i + 1}']}”</p><div class='row'>")
    for fr in fs:
        shutil.copy(ROOT / "out" / "stills" / f"f{fr:04d}.png", OUT / f"f{fr:04d}.png")
        html.append(f"<figure><img src='f{fr:04d}.png'><figcaption>quadro {fr} · {tc(fr)}</figcaption></figure>")
    html.append("</div>")

html.append("</body></html>")
(OUT / "index.html").write_text("\n".join(html), encoding="utf-8")
print("ok", OUT)
