"""A luz do filme, toda em luz linear (float32).
laboratorio: a linha do passe fio vira luz vermelha de laboratorio, com halo e queda com a distancia.
flash: luz que cai com o quadrado da distancia (com prof) ou uniforme (sem prof), com ombro suave.
revelacao: mascara presa ao mundo (adveccao por fluxo optico), degraus no ritmo da caixa.
pos_imagem: mancha de retina em cor complementar, borrada, morrendo exponencialmente."""
import cv2
import numpy as np

from comum import H, W, VERMELHO_LIN, lum

# cores da luz (linear)
COR_LINHA = VERMELHO_LIN                                   # o vermelho do corredor (#fa1717)
COR_HALO = np.array([1.0, 0.012, 0.008], np.float32)       # halo mais profundo, quase vermelho puro
COR_FLASH = np.array([1.0, 0.975, 0.93], np.float32)       # flash de xenonio, levemente quente

_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_R2 = ((_xx - W / 2) / (W / 2)) ** 2 * 0.6 + ((_yy - H * 0.45) / (H / 2)) ** 2   # raio normalizado do refletor


def blur_rapido(img, sigma, fator=4):
    """desfoque gaussiano grande feito em resolucao reduzida"""
    if sigma < 6:
        return cv2.GaussianBlur(img, (0, 0), sigma)
    h, w = img.shape[:2]
    p = cv2.resize(img, (w // fator, h // fator), interpolation=cv2.INTER_AREA)
    p = cv2.GaussianBlur(p, (0, 0), sigma / fator)
    return cv2.resize(p, (w, h), interpolation=cv2.INTER_LINEAR)


def ombro(x, peso):
    """Ombro suave: identidade onde peso = 0; onde ha luz forte, 1 - exp(-x), que preserva forma no estouro.
    peso pode ser escalar ou mapa (H, W)."""
    k = 0.6
    sh = np.where(x <= k, x, k + (1 - k) * (1 - np.exp(-(x - k) / (1 - k))))
    if np.isscalar(peso):
        if peso <= 0:
            return np.minimum(x, 1.0)
        s = min(float(peso), 1.0)
        return np.minimum(x, 1.0) * (1 - s) + sh * s
    s = np.clip(peso, 0, 1)[..., None]
    return np.minimum(x, 1.0) * (1 - s) + sh * s


# ---------------- laboratorio ----------------
def atenuacao_linha(prof):
    if prof is None:
        return np.float32(1.0)
    d = np.minimum(prof, np.float32(30.0))          # vazio (inf) vira o fundo
    return np.clip(np.exp(d * np.float32(-1 / 9.0)), 0.07, 1.0).astype(np.float32)


def laboratorio(fio, prof, nivel=1.0):
    """fio (H,W) 0..1 -> imagem linear vermelha. nivel inclui o pulso da batida.
    nucleo no vermelho do corredor, ponto quente onde a linha e forte, halo em dois raios."""
    e = fio.astype(np.float32) * (atenuacao_linha(prof) * np.float32(nivel))
    q = np.clip(e - 0.55, 0, None)
    q *= q
    hal = blur_rapido(e, 5) * 0.9 + blur_rapido(e, 28) * 1.1
    cq = np.array([0.9, 0.25, 0.18], np.float32) * 0.6
    canais = [e * np.float32(COR_LINHA[c] * 0.85) + q * cq[c] + hal * COR_HALO[c] for c in range(3)]
    return np.dstack(canais)


def pulso_batida(f, quadros_batida, sobe=0.4, tau=2.2, dur=8):
    """1 + sobe no quadro da batida, caindo em 6 a 8 quadros. Pico exatamente no quadro da batida."""
    p = 1.0
    for fb in quadros_batida:
        a = f - fb
        if 0 <= a < dur:
            p = max(p, 1 + sobe * np.exp(-a / tau) * (1 - a / dur))
    return p


# ---------------- flash ----------------
def envelope_flash(a, com_prof=True):
    if a < 0:
        return 0.0
    if com_prof:
        return float(np.exp(-a / 1.25)) if a < 6 else 0.0      # 4 a 6 quadros
    return float(np.exp(-a / 0.7)) if a < 3 else 0.0            # 3 quadros


def mapa_flash(prof, ganho, d_ref=2.6, f_max=5.0):
    """Luz do flash por pixel: (d_ref / d)^2, limitado perto, zero no vazio, com vinheta de refletor."""
    vin = 1.0 - 0.28 * np.clip(_R2, 0, 1.6)
    if prof is None:
        return ganho * (1.0 - 0.15 * np.clip(_R2, 0, 1.6))
    d = np.where(np.isfinite(prof), np.maximum(prof, 0.05), 1e6)
    F = np.minimum((d_ref / d) ** 2, f_max)
    return ganho * F * vin


def aplica_flash(img, L, cena3d=False):
    """img linear, L mapa de luz (H,W) ou escalar. A luz que chega multiplica o albedo aproximado
    (a propria imagem, mais um piso nas sombras pra o flash revelar o que estava escuro)."""
    if np.isscalar(L) and L <= 0:
        return img
    if cena3d:
        # no corredor a luz ambiente e baixa: o albedo real e bem mais alto que a imagem sugere,
        # entao o flash perto acende parede escura (raiz puxa as sombras)
        alb = img * 0.5 + 0.3 * np.sqrt(np.maximum(img, 0))
    else:
        alb = img * 0.75 + 0.05 * np.sqrt(np.maximum(img, 0))
    Lc = (L[..., None] if not np.isscalar(L) else L) * COR_FLASH
    x = img + Lc * alb
    return ombro(x, L * 1.2 if np.isscalar(L) else L * 1.2)


def protege_claros(img, l0=0.03, l1=0.30, resto=0.15):
    """fator (H,W): 1 no escuro, 'resto' no que ja e claro (luminancia linear entre l0 e l1, suavizado)"""
    l = cv2.GaussianBlur(lum(img), (0, 0), 3)
    t = np.clip((l - l0) / (l1 - l0), 0, 1)
    t = t * t * (3 - 2 * t)
    return (1 - (1 - resto) * t).astype(np.float32)


def faixa_poupada(y0, y1, resto=0.2, macio=90):
    """fator (H,W) que reduz a luz do flash a 'resto' entre y0 e y1, com bordas macias"""
    y = _yy[:, :1]
    a = np.clip((y - (y0 - macio)) / macio, 0, 1) * np.clip(((y1 + macio) - y) / macio, 0, 1)
    return np.broadcast_to(1 - (1 - resto) * a, (H, W)).astype(np.float32)


# ---------------- raio x ----------------
def raio_x(img, fio):
    return img * 0.28 + laboratorio(fio, None, 1.15)


# ---------------- pos-imagem ----------------
def pos_imagem_base(ultimo):
    """A partir do ultimo quadro (linear), a mancha de retina: borrada e na cor complementar."""
    p = cv2.resize(ultimo, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    p = cv2.GaussianBlur(p, (0, 0), 9)
    mx, mn = p.max(axis=2, keepdims=True), p.min(axis=2, keepdims=True)
    comp = (mx + mn) - p                    # matiz complementar, mesma luminosidade
    # so o que estava claro deixa marca
    l = lum(p)[..., None]
    peso = np.clip(l / (l.max() + 1e-6), 0, 1) ** 0.7
    return (comp * peso).astype(np.float32)


def pos_imagem(base, k, amp=0.55, tau=2.6):
    """k = quadros desde o apagao. Cresce de leve (a retina 'escorre') e morre exponencialmente."""
    a = amp * np.exp(-k / tau)
    z = 1.0 + 0.006 * k
    h, w = base.shape[:2]
    M = np.array([[z, 0, w / 2 * (1 - z)], [0, z, h / 2 * (1 - z)]], np.float32)
    b = cv2.warpAffine(base, M, (w, h), borderMode=cv2.BORDER_CONSTANT)
    return cv2.resize(b, (W, H), interpolation=cv2.INTER_LINEAR) * a


# ---------------- revelacao ----------------
class Revelador:
    """Mascara de revelacao presa ao mundo.
    Em resolucao reduzida, guarda: M (revelado 0/1), A (quadro em que revelou) e N (id da celula de
    Voronoi organica), e os carrega de um quadro pro seguinte pelo fluxo optico do passe cor do B1. Assim
    a mancha revelada anda com a parede, nao com a tela. Cada degrau revela celulas inteiras (sorteio,
    com as claras, as copias acesas, primeiro e as de perto um pouco antes) ate a fracao alvo."""

    def __init__(self, degraus, escala=4, semente=7):
        self.deg = sorted(degraus)            # [(quadro, fracao_alvo)]
        self.es = escala
        self.w, self.h = W // escala, H // escala
        rng = np.random.default_rng(semente)
        # celulas de Voronoi com borda organica (coordenadas tortas por ruido): cada celula e um pedaco
        # do mundo que revela inteiro. N guarda o id da celula e anda com o mundo (adveccao sem misturar).
        ncel = 140
        px = rng.uniform(0, self.w, ncel).astype(np.float32)
        py = rng.uniform(0, self.h, ncel).astype(np.float32)
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        nx = cv2.GaussianBlur(rng.standard_normal((self.h, self.w)).astype(np.float32), (0, 0), 10)
        ny = cv2.GaussianBlur(rng.standard_normal((self.h, self.w)).astype(np.float32), (0, 0), 10)
        amp = 18.0 / (nx.std() + 1e-6)
        xw, yw = xx + nx * amp, yy + ny * amp
        best = np.full((self.h, self.w), np.inf, np.float32)
        cid = np.zeros((self.h, self.w), np.float32)
        for i in range(ncel):
            d = (xw - px[i]) ** 2 + (yw - py[i]) ** 2
            m = d < best
            best[m] = d[m]
            cid[m] = i
        self.N = cid
        self.ordem = rng.permutation(ncel).astype(np.float32) / ncel   # sorteio de cada celula
        self.M = np.zeros((self.h, self.w), np.float32)
        self.A = np.full((self.h, self.w), -999.0, np.float32)
        self.ant = None
        self.dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        self.estados = {}

    def _cinza(self, cor):
        g = (np.clip(lum(cor), 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)
        return cv2.resize(g, (self.w, self.h), interpolation=cv2.INTER_AREA)

    def passo(self, f, cor, prof):
        g = self._cinza(cor)
        if self.ant is not None:
            # fluxo do quadro atual pro anterior: onde estava cada pixel de agora
            fl = self.dis.calc(g, self.ant, None)
            mx = (np.arange(self.w, dtype=np.float32)[None, :] + fl[..., 0])
            my = (np.arange(self.h, dtype=np.float32)[:, None] + fl[..., 1])
            self.M = cv2.remap(self.M, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            self.N = cv2.remap(self.N, mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE)
            self.A = cv2.remap(self.A, mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE)
            # estado binario: a adveccao bilinear amacia a borda, entao corta em 0,5 (sem aro que sobra)
            self.M = (self.M > 0.5).astype(np.float32)
        self.ant = g
        for fq, alvo in self.deg:
            if fq == f:
                self._revela(f, alvo, prof, g)
        self.estados[f] = ((self.M > 0.5).astype(np.uint8), self.A.astype(np.int16))

    def _revela(self, f, alvo, prof, g=None):
        if alvo >= 0.999:
            novo = self.M < 0.999
            self.A[novo & (self.M < 0.5)] = f
            self.M[:] = 1.0
            return
        ids = self.N.astype(np.int32).ravel()
        nc = len(self.ordem)
        area = np.bincount(ids, minlength=nc).astype(np.float64)
        if prof is not None:
            d = cv2.resize(np.minimum(prof, 30.0).astype(np.float32), (self.w, self.h), interpolation=cv2.INTER_AREA)
            dm = np.bincount(ids, weights=d.ravel(), minlength=nc) / np.maximum(area, 1)
            dn = (dm - dm[area > 0].mean()) / (dm[area > 0].std() + 1e-6)
        else:
            dn = np.zeros(nc)
        if g is not None:   # o que tem luz (as copias acesas na parede) revela primeiro
            lm = np.bincount(ids, weights=g.ravel().astype(np.float64), minlength=nc) / np.maximum(area, 1)
            ln = (lm - lm[area > 0].mean()) / (lm[area > 0].std() + 1e-6)
        else:
            ln = np.zeros(nc)
        score = self.ordem - 0.45 * ln + 0.12 * dn   # sorteio; claro primeiro; perto um pouco antes
        rev_cel = np.bincount(ids, weights=(self.M.ravel() > 0.5), minlength=nc) / np.maximum(area, 1)
        atual = (self.M > 0.5).mean()
        if alvo <= atual:
            return
        tot = self.M.size
        for c in np.argsort(score):
            if area[c] == 0 or rev_cel[c] > 0.5:
                continue
            novo = (self.N == c) & (self.M < 0.5)
            self.A[novo] = f
            self.M[novo] = 1.0
            atual += novo.sum() / tot
            if atual >= alvo:
                break

    def preparar(self, seq, local_de_f, f0, f1):
        """passa uma vez pelo B1 inteiro calculando a mascara de cada quadro (resolucao reduzida)"""
        for f in range(f0, f1):
            q = seq.quadro(local_de_f(f), ("cor", "prof"))
            self.passo(f, q.cor, q.prof)
        self.ant = None
        return self.estados

    def mascaras(self, f):
        """mascara revelada (H,W) e peso do revelador (H,W): 1 no quadro em que a regiao revela,
        caindo em 3 a 4 quadros"""
        M, A = self.estados[f]
        M = cv2.GaussianBlur(M.astype(np.float32), (0, 0), 1.3)       # borda macia so na exibicao
        Mf = cv2.resize(M, (W, H), interpolation=cv2.INTER_LINEAR)
        idade = f - A.astype(np.float32)
        wv = np.where((idade >= 0) & (idade <= 6), np.exp(-np.maximum(idade, 0) / 1.4), 0.0).astype(np.float32)
        if wv.max() <= 0:
            return Mf, None
        wv = cv2.GaussianBlur(wv, (0, 0), 1.0)
        return Mf, cv2.resize(wv, (W, H), interpolation=cv2.INTER_LINEAR)


def revelado(img, w):
    """A regiao recem revelada entra como foto no revelador: estourada e sem contraste por 3 a 4 quadros,
    depois assenta na imagem real. w (H,W) = peso do revelador."""
    if w is None:
        return img
    w = w[..., None]
    x = img * (1 + 3.0 * w) + 0.22 * w
    y = np.minimum(x, 1) * (1 - w) + (1 - np.exp(-x)) * w
    return y * (1 - 0.45 * w) + 0.45 * w * 0.62
