"""Montador do showreel (agente 3, laboratorio).
Le tempo.json e montagem.json, junta as sequencias que ja chegaram em quadros/<ID>/ (so as que tem
pronto.json; o resto vira cartao cinza com o ID e o quadro local), faz toda a luz em luz linear, poe o
som e escreve o MP4 direto num pipe pro ffmpeg. Tambem gera as folhas de revisao.

  python pos/montar.py                      # filme inteiro -> saida/showreel-v2.mp4 (+ -leve) + saida/revisao/
  python pos/montar.py --raiz OUTRA/quadros # testa contra outra raiz de quadros (ex.: corredor sintetico)
  python pos/montar.py --de 200 --ate 260 --png DIR   # so um trecho, em PNG, sem MP4
"""
import argparse
import json
import multiprocessing as mp
import os
import subprocess
import sys
import time
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import (AUDIO, BATIDA_F, FPS, H, MONTAGEM, NQ, OITAVA_F, PROJ, REVISAO, SAIDA, SEMI_F, TEMPO, W,
                   batida_do_quadro, enc, enc_f, lum)
import fontes
import luz
import revisao
import som

SEC_B0, SEC_C0, SEC_D0 = 221, 436, 866
RESPIRO1 = (425, 436)
RESPIRO2 = (855, 866)
FORTES = set(MONTAGEM["flash"]["fortes_b"])
RAIO_X = set(MONTAGEM["raio_x"]["quadros"])
BATIDAS_Q = set(BATIDA_F.values())
# cortes internos de planos entregues como uma sequencia so (pronto.json do S1_site: momentos 0, 27, 54, 81).
# Flash de tela de site: sem profundidade, curto e contido, pra nao apagar a leitura do texto pequeno.
CORTES_INTERNOS = {"S1_site": [0, 27, 54, 81]}


# ------------------------------------------------------------------ linha do tempo
def entradas():
    es = []
    for i, e in enumerate(MONTAGEM["base"]):
        e = dict(e)
        e["ordem"] = i
        es.append(e)
    return es


def camada_topo(es, f):
    """a entrada visivel no quadro f: a ultima da lista que cobre f (insercoes vem depois da base)"""
    top = None
    for e in es:
        if e["f0"] <= f < e["f1"]:
            top = e
    return top


def local_de(e, f):
    if e.get("continua"):
        return f - e["origem"]
    return e.get("local0", 0) + (f - e["f0"])


def eventos_flash(es):
    """Todo corte da secao C (e o da D) acende um flash, no primeiro quadro do plano.
    Na B, so a insercao em modo flash (B3). Mais o estrobo fraco das batidas 28 a 30 por semicolcheia."""
    ev = {}
    ant = None
    for f in range(NQ):
        top = camada_topo(es, f)
        if top is not ant and f > 0:
            b = batida_do_quadro(f)
            forte = (BATIDA_F.get(b) == f and b in FORTES) or top["modo"] == "flash_forte"
            if f >= SEC_C0:
                # so em quadro de batida: os retornos ao C7 em meia batida (819, 833) nao acendem,
                # pra o flash nao passar de um por batida (2,2 por segundo)
                if f in BATIDAS_Q:
                    ev[f] = {"tipo": "forte" if forte else "medio", "fonte": top["fonte"]}
            elif top["modo"].startswith("flash"):
                ev[f] = {"tipo": "medio", "fonte": top["fonte"]}
        ant = top
    for e in es:
        for loc in CORTES_INTERNOS.get(e["fonte"], []):
            fq = e["f0"] + loc - e.get("local0", 0)
            if e["f0"] <= fq < e["f1"]:
                ev[fq] = {"tipo": "site", "fonte": e["fonte"]}
    for bq, fq in SEMI_F.items():
        if 28 <= bq < 31 and fq not in ev:
            ev[fq] = {"tipo": "estrobo", "fonte": "B1_travessia"}
    return ev


GANHO = {  # (com prof, sem prof)
    "forte": (2.4, 2.6),
    "medio": (1.4, 1.5),
    "estrobo": (0.32, 0.22),
    "site": (0.3, 0.3),
}


def degraus_revelacao():
    qs = [BATIDA_F[b] for b in (16, 17, 18, 19)]
    qs += [OITAVA_F[b / 2] for b in range(40, 48)]          # 20 .. 23.5
    qs += [SEMI_F[b / 4] for b in range(96, 112)]           # 24 .. 27.75
    qs = sorted(set(qs))
    n = len(qs)
    out = [(q, ((k + 1) / (n + 1)) ** 1.15) for k, q in enumerate(qs)]
    out.append((BATIDA_F[28], 1.0))
    return out


# ------------------------------------------------------------------ fotos
def resolve_fotos(seqs):
    fot = {k: v for k, v in fontes.FOTOS.items() if isinstance(v, dict)}
    p1 = dict(fot.get("p1_reserva", {}))
    p1["origem"] = "reserva (C2e sem foto declarada)"
    c2e = seqs.get("C2e_mergulho")
    if c2e is not None and c2e.pronto:
        achado = _procura_foto(c2e.pronto)
        if achado:
            nome = Path(achado).name
            if (fontes.ASSETS / nome).exists():
                p1 = {"arquivo": nome, "cx": 0.5, "cy": 0.5, "origem": "quadros/C2e_mergulho/pronto.json"}
                enq = _procura_enquadramento(c2e.pronto)
                if enq:
                    p1.update(enq)
    fot["p1"] = p1
    return fot


def _procura_foto(o):
    if isinstance(o, str):
        s = o.lower()
        if s.endswith((".webp", ".jpg", ".jpeg", ".png")) and "quadros" not in s:
            return o
        return None
    if isinstance(o, dict):
        for k in sorted(o, key=lambda k: (0 if ("p1" in k or "foto" in k) else 1)):
            r = _procura_foto(o[k])
            if r:
                return r
    if isinstance(o, list):
        for x in o:
            r = _procura_foto(x)
            if r:
                return r
    return None


def _procura_enquadramento(o):
    """aceita {cx, cy, escala|zoom|z} em qualquer lugar do pronto.json do C2e"""
    if isinstance(o, dict):
        if "cx" in o and "cy" in o:
            r = {"cx": float(o["cx"]), "cy": float(o["cy"])}
            for k in ("escala", "zoom", "z"):
                if k in o:
                    r["z0"] = float(o[k])
            return r
        for v in o.values():
            r = _procura_enquadramento(v)
            if r:
                return r
    return None


# ------------------------------------------------------------------ montagem
class Montador:
    def __init__(self, raiz, animatico=False):
        self.raiz = Path(raiz)
        self.es = entradas()
        ids = sorted({e["fonte"] for e in self.es if ":" not in e["fonte"]} | {e["sobre"] for e in self.es if "sobre" in e})
        self.seqs = {i: fontes.Sequencia(self.raiz, i) for i in ids}
        self.fotos = resolve_fotos(self.seqs)
        self.flash = eventos_flash(self.es)
        self.rev = luz.Revelador(degraus_revelacao())
        self.ultimo_lin = None
        self._pos = {}
        self.log = []
        self.vel = fontes.FOTOS.get("velocidade_zoom_q", 0.0045)
        self.der = fontes.FOTOS.get("deriva_x_q", -0.0012)
        self.cartoes = set()
        self.b1e = next(e for e in self.es if e["fonte"] == "B1_travessia")

    def _base_pos(self, r0):
        """pos-imagem a partir do ultimo quadro antes do respiro (recalculado: cada processo tem o seu)"""
        if r0 not in self._pos:
            img, _ = self.quadro(self._quadro_base_pos(r0))
            self._pos[r0] = luz.pos_imagem_base(img)
        return self._pos[r0]

    def _quadro_base_pos(self, r0):
        """Respiro 1: o ultimo quadro antes de apagar. Respiro 2: o C7 ja chega escuro, entao a pos-imagem
        vem do quadro mais claro da porta nos 16 quadros antes do respiro (a luz do palco na porta aberta)."""
        if r0 != RESPIRO2[0]:
            return r0 - 1
        c7 = next(e for e in self.es if e["fonte"] == "C7_porta")
        s = self.seqs["C7_porta"]
        if not s.pronta:
            return r0 - 1
        melhor, fq = -1.0, r0 - 1
        for f in range(r0 - 16, r0):
            if self.topo(f) is not c7:
                continue
            q = s.quadro(local_de(c7, f), ("cor",))
            l = float(lum(q.cor[::8, ::8]).mean())
            if l > melhor:
                melhor, fq = l, f
        return fq

    def preparar_revelacao(self):
        s = self.seqs["B1_travessia"]
        if s.pronta:
            self.rev.preparar(s, lambda f: local_de(self.b1e, f), SEC_B0, SEC_C0)

    def topo(self, f):
        return camada_topo(self.es, f)

    # ---- fontes
    def _seq(self, sid, local, f, querer=("cor", "fio", "prof")):
        s = self.seqs.get(sid)
        if s is None or not s.pronta:
            self.cartoes.add(sid)
            return fontes.cartao(sid, local, f)
        if local >= s.n:
            self.log.append(f"aviso: {sid} pediu quadro local {local}, so tem {s.n}; segurei o ultimo")
        return s.quadro(local, querer)

    def _fonte(self, e, f):
        src = e["fonte"]
        n = e["f1"] - e["f0"]
        k = f - e["f0"]
        if src.startswith("FOTO:"):
            c = self.fotos[src[5:]]
            z0 = c.get("z0", 1.0)
            return fontes.foto(c["arquivo"], k / n, c.get("cx", 0.5), c.get("cy", 0.5), z0, z0 + self.vel * n,
                               self.der * n, 0.0)
        if src.startswith("FILME:"):
            return fontes.filme(src, k, n)
        return self._seq(src, local_de(e, f), f)

    # ---- luz de flash do quadro
    def _luz_flash(self, f, q, top):
        self._cena3d = q.prof is not None and not q.cartao
        tot = 0.0
        mapa = None
        for fe, ev in self.flash.items():
            a = f - fe
            if a < 0 or a > 6:
                continue
            # o flash pertence ao plano: so ilumina se o plano visivel e o mesmo que acendeu
            if ev["fonte"] != top["fonte"]:
                continue
            com_prof = q.prof is not None and not q.cartao
            g = GANHO[ev["tipo"]][0 if com_prof else 1] * luz.envelope_flash(a, com_prof)
            if ev["tipo"] in ("estrobo", "site"):
                g = GANHO[ev["tipo"]][0 if com_prof else 1] * (np.exp(-a / 0.6) if a < 2 else 0.0)
            if g <= 0:
                continue
            m = luz.mapa_flash(q.prof if com_prof else None, g)
            if top["fonte"].startswith("FOTO:"):
                faixa = self.fotos[top["fonte"][5:]].get("flash_faixa_escura")
                if faixa:   # o flash poupa a faixa do texto de baixo (a foto em si nao e escurecida)
                    m = m * luz.faixa_poupada(*faixa)
            if top["fonte"].startswith("C2") and not q.cartao:
                # copias na parede: a foto ja e clara (luz propria da copia); o flash poupa o que ja e
                # claro pra a foto seguir legivel no primeiro quadro, e a parede escura estoura inteira
                m = m * luz.protege_claros(q.cor)
            mapa = m if mapa is None else mapa + m
            tot += g
        return mapa, tot

    # ---- um quadro
    def quadro(self, f):
        top = camada_topo(self.es, f)
        info = {"f": f, "fonte": top["fonte"], "luz": 0.0}

        # secao A: laboratorio
        if f < SEC_B0:
            q = self._seq("A1_planta", local_de(top, f), f, ("fio", "prof"))
            p = luz.pulso_batida(f, [BATIDA_F[b] for b in range(16)])
            info["luz"] = p
            if f < BATIDA_F[0]:
                img = np.zeros((H, W, 3), np.float32)
            elif q.cartao:
                img = q.cor * 0.35 * p
            else:
                fio = q.fio if q.fio is not None else lum(q.cor) ** (1 / 2.2)
                # a linha "acende" no comeco
                ramp = min(1.0, (f - BATIDA_F[0] + 1) / 10.0)
                img = luz.laboratorio(fio, q.prof, p * ramp)
            return img, info

        # secao B: revelacao (mascaras ja calculadas em ordem pelo Revelador.preparar, presas ao mundo)
        if f < SEC_C0:
            if top["fonte"] == "B1_travessia":
                qb = self._seq("B1_travessia", local_de(self.b1e, f), f)
                if qb.cartao or f not in self.rev.estados:
                    img = qb.cor * 0.35
                else:
                    M, Wd = self.rev.mascaras(f)
                    fio = qb.fio if qb.fio is not None else np.zeros((H, W), np.float32)
                    lab = luz.laboratorio(fio, qb.prof, 1.0)
                    dev = luz.revelado(qb.cor, Wd)
                    m = M[..., None]
                    # a linha continua por cima do que ja revelou e some entre as batidas 28 e 29
                    resto = 0.5 * float(np.clip((BATIDA_F[29] - f) / (BATIDA_F[29] - BATIDA_F[28]), 0, 1))
                    img = lab * (1 - m + m * resto) + dev * m
                q = qb
            else:
                q = self._fonte(top, f)
                img = q.cor
            mapa, g = self._luz_flash(f, q, top)
            if mapa is not None:
                img = luz.aplica_flash(img, mapa, self._cena3d)
            info["luz"] = g
            # respiro 1: apaga em 2 quadros, fica a pos-imagem
            if f >= RESPIRO1[0]:
                k = f - RESPIRO1[0]
                img = img * (0.3 if k == 0 else 0.06 if k == 1 else 0.0) + luz.pos_imagem(self._base_pos(RESPIRO1[0]), k)
            return img, info

        # secoes C e D
        q = self._fonte(top, f)
        img = q.cor
        mapa, g = self._luz_flash(f, q, top)
        if mapa is not None:
            img = luz.aplica_flash(img, mapa, self._cena3d)
        info["luz"] = g
        # nome por cima da foto heroi
        if "sobre" in top:
            s = top["sobre"]
            qn = self._seq(s, f - top["f0"], f, ("cor",))
            if qn.cartao:
                a = 0.45
                img = img * (1 - a) + qn.cor * a
            elif qn.alfa is not None:
                a = qn.alfa[..., None]
                img = img * (1 - a) + qn.cor * a
            else:
                img = np.maximum(img, qn.cor)
        # raio x: a estrutura pisca por 2 quadros nos C5
        if top["fonte"].startswith("C5") and any(f - r in (0, 1) for r in RAIO_X):
            if q.fio is not None:
                img = luz.raio_x(img, q.fio)
                info["raio_x"] = True
        # respiro 2: pos-imagem da porta
        if RESPIRO2[0] <= f < RESPIRO2[1]:
            k = f - RESPIRO2[0]
            img = img + luz.pos_imagem(self._base_pos(RESPIRO2[0]), k, amp=0.5)
        return img, info


def grao(srgb, f):
    """grao fino animado, monocromatico, em espaco de exibicao; mais forte na secao A"""
    rng = np.random.default_rng(1000 + f)
    n = rng.standard_normal((H, W), dtype=np.float32)
    forca = np.float32(0.030 if f < SEC_B0 else 0.016)
    g = srgb[..., 1]
    n *= (0.35 + 2.6 * g * (1 - g)) * forca
    srgb += n[..., None]
    return srgb


# ------------------------------------------------------------------ processos
_MON = None


def _inicia(raiz, estados):
    global _MON
    cv2.setNumThreads(1)
    _MON = Montador(raiz)
    _MON.rev.estados = estados


def render(f):
    """um quadro final: luz, grao, 8 bits. Roda nos processos."""
    m = _MON
    img, info = m.quadro(f)
    info["lumen"] = float(lum(np.clip(img, 0, None)).mean())
    srgb = enc_f(np.clip(img, 0, 1))
    srgb = grao(srgb, f)
    u8 = np.clip(srgb * 255 + 0.5, 0, 255).astype(np.uint8)
    cart, log = sorted(m.cartoes), sorted(set(m.log))
    m.log.clear()
    return f, u8, info, cart, log


def comando_ffmpeg(saida, wav):
    return ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
            "-i", str(wav),
            "-map", "0:v", "-map", "1:a",
            "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p",
            "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "16",
            "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
            "-r", str(FPS), "-fps_mode", "cfr",
            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
            "-c:a", "aac", "-b:a", "320k",
            "-t", f"{NQ / FPS:.6f}", "-movflags", "+faststart", str(saida)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=str(PROJ / "quadros"))
    ap.add_argument("--saida", default=str(SAIDA / "showreel-v2.mp4"))
    ap.add_argument("--revisao", default=str(REVISAO))
    ap.add_argument("--de", type=int, default=0)
    ap.add_argument("--ate", type=int, default=NQ)
    ap.add_argument("--png", default=None, help="grava PNGs desse trecho em vez do MP4")
    ap.add_argument("--processos", type=int, default=5)
    a = ap.parse_args()

    t0 = time.time()
    mon = Montador(a.raiz)
    prontos = [i for i, s in mon.seqs.items() if s.pronta]
    print("raiz:", a.raiz)
    print("sequencias prontas:", ", ".join(prontos) or "nenhuma")
    print("p1:", mon.fotos["p1"].get("arquivo"), "|", mon.fotos["p1"].get("origem"))

    wav = AUDIO / "trilha-final.wav"
    som.gerar(wav)

    proc = None
    if a.png is None:
        Path(a.saida).parent.mkdir(parents=True, exist_ok=True)
        proc = subprocess.Popen(comando_ffmpeg(a.saida, wav), stdin=subprocess.PIPE)
    else:
        Path(a.png).mkdir(parents=True, exist_ok=True)

    rev = revisao.Coletor(mon)
    t1 = time.time()
    mon.preparar_revelacao()
    print(f"revelacao preparada ({len(mon.rev.estados)} mascaras) em {time.time() - t1:.0f}s", flush=True)
    cartoes, logs = set(), set()
    n_proc = max(1, min(a.processos, (os.cpu_count() or 2) - 1))
    with mp.Pool(n_proc, initializer=_inicia, initargs=(a.raiz, mon.rev.estados)) as pool:
        for f, u8, info, cart, log in pool.imap(render, range(a.de, a.ate), chunksize=2):
            cartoes |= set(cart); logs |= set(log)
            rev.guarda(f, u8, info)
            if proc is not None:
                proc.stdin.write(u8.tobytes())
            else:
                cv2.imwrite(str(Path(a.png) / f"{f:06d}.png"), cv2.cvtColor(u8, cv2.COLOR_RGB2BGR))
            if f % 60 == 0:
                print(f"  quadro {f}/{NQ}  {time.time() - t0:.0f}s", flush=True)
    mon.cartoes = cartoes
    mon.log = list(logs)
    if proc is not None:
        proc.stdin.close()
        proc.wait()
    dur = time.time() - t0
    print(f"montado em {dur:.0f}s")
    cart = sorted(mon.cartoes)
    print("planos em cartao cinza:", ", ".join(cart) or "nenhum")
    for l in sorted(set(mon.log))[:20]:
        print(l)
    if proc is not None and a.de == 0 and a.ate == NQ:
        revisao.folhas(rev, Path(a.revisao), Path(a.saida), wav, cart, dur, mon)
        leve = Path(a.saida).with_name(Path(a.saida).stem + "-leve.mp4")
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(a.saida),
                        "-map", "0:v", "-map", "0:a", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow",
                        "-crf", "21", "-pix_fmt", "yuv420p",
                        "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
                        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                        "-color_range", "tv", "-c:a", "copy", "-movflags", "+faststart", str(leve)], check=True)
        print("leve:", leve)


if __name__ == "__main__":
    main()
