// Personagens e objetos desenhados à mão (traço cel). Coordenadas locais: cabeça ~220 de altura,
// centro do rosto em (0,0), queixo em y≈100, base do pescoço em y≈150.
import { PAL, GLOBAL, STYLE, spline, inkStroke, inkLoop, fillShape, fillPoly, circlePts, hs, lerp, clamp } from './engine.js';

// estado do quadro: variante de boil (0..3) e escala total (câmera × personagem)
export const ST = { v: 0, k: 1 };
export const sd = (id) => id * 17 + ST.v * 131 + 3;

export function withXf(ctx, o, fn) {
  const { x = 0, y = 0, s = 1, r = 0, sx = 1 } = o;
  const k0 = ST.k, gi = GLOBAL.ink, ga = GLOBAL.amp;
  ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s * sx, s);
  ST.k = k0 * s; GLOBAL.ink = 1 / ST.k; GLOBAL.amp = 1 / ST.k;
  try { fn(); } finally { ctx.restore(); ST.k = k0; GLOBAL.ink = gi; GLOBAL.amp = ga; }
}

// cor mais escura pro lado de sombra (mistura com a tinta)
export function escurece(hex, k = 0.2) {
  if (!hex || hex[0] !== '#') return null;
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = (c, t) => Math.round(c * (1 - k) + t * k);
  return `rgb(${m(r, 42)},${m(g, 24)},${m(b, 18)})`;
}
// forma fechada: preenchimento levemente fora de registro, sombra cel chapada no lado de baixo/direita,
// contorno de tinta que ferve. o.sh = cor da sombra (false desliga), o.shd = largura da sombra
export function shp(ctx, P, fill, o = {}) {
  const id = o.id ?? 1;
  const dense = o.dense ? P : spline(P, true, 4);
  if (STYLE.boil === 0) { // vetor chapado: sem registro torto, sombra chapada, contorno mínimo tom sobre tom
    if (fill) {
      const sh = o.sh === false ? null : (o.sh || escurece(fill, 0.16));
      if (sh) {
        const d = o.shd ?? 9;
        fillPoly(ctx, dense, sh);
        ctx.save(); ctx.beginPath(); ctx.moveTo(...dense[0]); for (const q of dense) ctx.lineTo(...q); ctx.closePath(); ctx.clip();
        fillPoly(ctx, dense.map(([x, y]) => [x - d * 0.75, y - d]), fill);
        ctx.restore();
      } else fillPoly(ctx, dense, fill);
    }
    if (o.ink !== false) {
      const cor = fill && fill[0] === '#' ? escurece(fill, 0.38) : (o.color ?? PAL.ink);
      ctx.save(); ctx.beginPath(); ctx.moveTo(...dense[0]); for (const q of dense) ctx.lineTo(...q); ctx.closePath();
      ctx.lineJoin = 'round'; ctx.lineWidth = (o.w ?? 4.2) * 0.55 / ST.k; ctx.strokeStyle = o.color && !fill ? o.color : cor; ctx.stroke(); ctx.restore();
    }
    return dense;
  }
  if (fill) {
    const reg = o.reg ?? 1, dx = reg * (hs(id, 1) - 0.5) * 7 / ST.k, dy = reg * (hs(id, 2) - 0.5) * 5 / ST.k;
    const sh = o.sh === false ? null : (o.sh || escurece(fill, 0.2));
    if (sh) {
      const d = o.shd ?? 9;
      const B = fillShape(ctx, dense, sh, { seed: sd(id), amp: (o.famp ?? 1.4), dx, dy });
      ctx.save(); ctx.beginPath(); ctx.moveTo(...B[0]); for (const q of B) ctx.lineTo(...q); ctx.closePath(); ctx.clip();
      fillShape(ctx, dense, fill, { seed: sd(id), amp: (o.famp ?? 1.4), dx: dx - d * 0.75, dy: dy - d });
      ctx.restore();
    } else fillShape(ctx, dense, fill, { seed: sd(id), amp: (o.famp ?? 1.4), dx, dy });
  }
  if (o.ink !== false) inkLoop(ctx, dense, { seed: sd(id) + 7, amp: o.amp ?? 1.9, w: o.w ?? 4.2, color: o.color ?? PAL.ink, splits: o.splits ?? 2, heavy: o.heavy ?? 0.4 });
  return dense;
}
// traço aberto
export function ln(ctx, P, o = {}) {
  return inkStroke(ctx, P, { seed: sd(o.id ?? 5), amp: o.amp ?? 1.6, w: o.w ?? 3.6, color: o.color ?? PAL.ink, t0: o.t0 ?? 10, t1: o.t1 ?? 14, heavy: o.heavy ?? 0.2, dense: o.dense });
}
// cápsula (dedos, braços)
export function capsule(x0, y0, x1, y1, r0, r1, n = 10) {
  const a = Math.atan2(y1 - y0, x1 - x0), P = [];
  for (let i = 0; i <= n; i++) { const t = a + Math.PI / 2 + (Math.PI * i) / n; P.push([x0 + Math.cos(t) * r0, y0 + Math.sin(t) * r0]); }
  for (let i = 0; i <= n; i++) { const t = a - Math.PI / 2 + (Math.PI * i) / n; P.push([x1 + Math.cos(t) * r1, y1 + Math.sin(t) * r1]); }
  return P;
}
// nuvem de cabelo crespo/cacheado: lóbulos arredondados
function cloud(cx, cy, rx, ry, id, bump = 0.06, n = 64) {
  const P = [], k = 9 + (id % 4), ph = id * 0.7;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const b = 1 + bump * (Math.abs(Math.sin(a * k / 2 + ph)) * 1.6 - 0.8) + bump * 0.25 * Math.sin(a * 23 + id);
    P.push([cx + Math.cos(a) * rx * b, cy + Math.sin(a) * ry * b]);
  }
  return P;
}
function curls(ctx, cx, cy, rx, ry, id, n, color, w = 2.6) {
  for (let i = 0; i < n; i++) {
    const a = hs(id, i) * Math.PI * 2, r = Math.sqrt(hs(id, i, 3)) * 0.82;
    const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
    const s = 9 + hs(id, i, 5) * 9, o = hs(id, i, 7) * 6;
    ln(ctx, [[x - s, y], [x - s * 0.3, y - s * 0.8], [x + s * 0.5, y - s * 0.4], [x + s * 0.2, y + s * 0.3]].map(p => [p[0] + o, p[1]]), { id: id * 100 + i, w, color, amp: 0.8 });
  }
}

// ------------------------------------------------------------------ elenco (pelo storyboard 2026-11-04)
export const ELENCO = {
  pesquisadora: { pele: '#8d5a3a', peleS: '#6e4228', cabelo: 'cacheado', roupa: 'jaleco', cab: '#22160e', cabL: '#7a4c28', top: '#8f908c', brinco: 'argola', colar: true },
  advogado: { pele: '#d9a985', peleS: '#bc8862', cabelo: 'topete', roupa: 'terno', cab: '#2a1d15', cabL: '#5a4030', barba: true },
  bolsista: { pele: '#5e3520', peleS: '#47271a', cabelo: 'coque', roupa: 'blazer', cab: '#1a110c', cabL: '#4a3222', brinco: 'longo' },
};
const OURO = '#c9932e', PRATA = '#d8d6cc';

// cloud assimétrica: e = alargamento à esquerda, b = alongamento pra baixo
function cloudA(cx, cy, rx, ry, id, bump, n, e = 0, b = 0) {
  return cloud(cx, cy, rx, ry, id, bump, n).map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    return [cx + dx * (1 + e * Math.max(0, -dx / rx)), cy + dy * (1 + b * Math.max(0, dy / ry))];
  });
}

// cabeça + tronco. p = { tr (giro -1..1, + olha pra direita da tela), tilt, gx, gy (olhar), sorri 0..1, aberto 0..1,
// pisca 0..1, sobr (sobrancelha), ombro (inclinação do tronco), tronco:false (só cabeça), fala 0..1 (boca abre na fala) }
export function pessoa(ctx, who, p = {}, xf = {}) {
  const C = ELENCO[who], id0 = { pesquisadora: 100, advogado: 300, bolsista: 500 }[who];
  const tr = p.tr ?? 0, tilt = p.tilt ?? 0, at = Math.abs(tr), sg = Math.sign(tr) || 1;
  const T = (x, y) => [x * (x * sg > 0 ? 1 - 0.2 * at : 1 + 0.04 * at) + tr * 10 * (1 - Math.abs(y) / 140), y];
  const TP = (P) => P.map(([x, y]) => T(x, y));
  withXf(ctx, xf, () => {
    const hx = -tr * 18;
    // --- cabelo de trás
    if (C.cabelo === 'cacheado') { // cachos médios, volume caindo pro lado esquerdo da tela até o ombro
      const P = cloudA(-6 + hx, -36, 150, 150, 7, 0.075, 140, 0.45, 0.5);
      shp(ctx, P, C.cab, { id: id0 + 1, w: 4.6 });
      curls(ctx, -40 + hx, -10, 150, 150, id0 + 2, 34, C.cabL, 2.8);
    } else if (C.cabelo === 'coque') { // coque alto e volumoso, de twists
      const P = cloud(hx * 0.6, -262, 104, 96, 5, 0.06, 110);
      shp(ctx, P, C.cab, { id: id0 + 1, w: 4.4 });
      curls(ctx, hx * 0.6, -262, 96, 88, id0 + 2, 26, C.cabL, 2.4);
    }
    // --- tronco
    if (p.tronco !== false) {
      const lean = p.ombro ?? 0;
      const L = (P) => P.map(([x, y]) => [x + lean * (y - 140) * 0.18 + tr * 12 * (y - 140) / 300, y]);
      const sil = L([[-54, 140], [-118, 166], [-176, 186], [-206, 214], [-220, 268], [-226, 380], [-230, 520], [230, 520], [226, 380], [220, 268], [206, 214], [176, 186], [118, 166], [54, 140]]);
      const lap = (k, cor, id) => shp(ctx, L([[-50 * k, 144], [-88 * k, 194], [-66 * k, 224], [-24 * k, 340], [-40 * k, 176]]), cor, { id, w: 3.4 });
      if (C.roupa === 'jaleco') {
        shp(ctx, sil, PAL.hi, { id: id0 + 10 });
        shp(ctx, L([[-58, 142], [-30, 300], [-28, 520], [28, 520], [30, 300], [58, 142], [0, 150]]), C.top, { id: id0 + 11 });
        for (let i = -3; i <= 3; i++) ln(ctx, L([[i * 9, 168 + Math.abs(i) * 4], [i * 8, 500]]), { id: id0 + 70 + i, w: 1.6, color: '#6f706c', amp: 0.6 }); // canelado
        lap(1, PAL.hi, id0 + 12); lap(-1, PAL.hi, id0 + 13);
        ln(ctx, L([[-178, 250], [-170, 380]]), { id: id0 + 14, w: 2.8 });
        ln(ctx, L([[178, 250], [170, 380]]), { id: id0 + 16, w: 2.8 });
        ln(ctx, L([[96, 372], [152, 368]]), { id: id0 + 15, w: 2.8 }); // bolso com o nome
        ln(ctx, L([[104, 352], [146, 348]]), { id: id0 + 17, w: 2, color: PAL.azulE, amp: 0.5 });
      } else if (C.roupa === 'terno') {
        shp(ctx, sil, '#1f2127', { id: id0 + 10 });
        shp(ctx, L([[-46, 144], [0, 300], [46, 144], [0, 160]]), PAL.hi, { id: id0 + 11 });
        shp(ctx, L([[-11, 168], [11, 168], [18, 278], [0, 302], [-18, 278]]), '#b0242c', { id: id0 + 18, w: 3.2 });
        shp(ctx, L([[-15, 150], [15, 150], [11, 171], [-11, 171]]), '#b0242c', { id: id0 + 19, w: 3 });
        lap(1, '#2a2d34', id0 + 12); lap(-1, '#2a2d34', id0 + 13);
        ln(ctx, L([[-176, 250], [-170, 380]]), { id: id0 + 14, w: 2.6, color: '#4c515b' });
        ln(ctx, L([[176, 250], [170, 380]]), { id: id0 + 16, w: 2.6, color: '#4c515b' });
      } else { // blazer branco, lapela preta, blusa preta de decote em V
        shp(ctx, sil, PAL.hi, { id: id0 + 10 });
        shp(ctx, L([[-60, 142], [-40, 320], [-34, 520], [34, 520], [40, 320], [60, 142], [0, 150]]), '#171414', { id: id0 + 11 });
        shp(ctx, L([[-34, 146], [0, 300], [34, 146], [0, 156]]), C.pele, { id: id0 + 18, w: 3 });
        shp(ctx, L([[-56, 142], [-98, 210], [-80, 250], [-34, 400], [-46, 180]]), '#171414', { id: id0 + 12, w: 3.4 });
        shp(ctx, L([[56, 142], [98, 210], [80, 250], [34, 400], [46, 180]]), '#171414', { id: id0 + 13, w: 3.4 });
        ln(ctx, L([[-178, 250], [-170, 380]]), { id: id0 + 14, w: 2.8 });
        ln(ctx, L([[178, 250], [170, 380]]), { id: id0 + 16, w: 2.8 });
      }
    }
    // --- pescoço
    shp(ctx, [[-34, 50], [-38, 150], [0, 160], [38, 150], [34, 50]], C.pele, { id: id0 + 20, w: 3.6 });
    fillShape(ctx, spline([[-34, 66], [0, 100], [34, 66], [36, 92], [0, 124], [-36, 92]], true, 4), C.peleS, { seed: sd(id0 + 21), amp: 1 });
    if (C.colar && p.tronco !== false) { // colar com pingente
      ln(ctx, [[-30, 128], [-14, 170], [0, 190], [14, 170], [30, 128]], { id: id0 + 24, w: 1.8, color: PRATA, amp: 0.5 });
      shp(ctx, [[0, 188], [7, 200], [0, 214], [-7, 200]], PRATA, { id: id0 + 25, w: 1.8, reg: 0 });
    }
    // --- cabeça
    ctx.save(); ctx.translate(0, 80); ctx.rotate(tilt); ctx.translate(0, -80);
    const cx = tr * 30;
    const face = TP([[-80, -40], [-74, -100], [-30, -128], [20, -130], [66, -108], [80, -40], [80, 10], [64, 58], [34, 92], [8, 104], [-8, 104], [-34, 92], [-64, 58], [-80, 10]]);
    const orelha = (x0, d, k) => shp(ctx, [[x0, -20], [x0 + d * 18, -30], [x0 + d * 24, 0], [x0 + d * 10, 22], [x0, 16]], C.pele, { id: id0 + 30 + k, w: 3.4 });
    if (C.cabelo === 'cacheado') orelha(78 - Math.max(0, tr) * 14, 1, 0);
    else if (at > 0.15) orelha(-sg * 78 + tr * 4, -sg, 0); else { orelha(78, 1, 0); orelha(-78, -1, 1); }
    shp(ctx, face, C.pele, { id: id0 + 31, w: 4.4 });
    if (at > 0.15) fillShape(ctx, spline(TP([[-sg * 79, -30], [-sg * 72, -70], [-sg * 68, -20], [-sg * 64, 40], [-sg * 70, 54], [-sg * 79, 10]]), true, 4), C.peleS, { seed: sd(id0 + 32), amp: 0.8 });
    // brincos
    if (C.brinco === 'argola') ln(ctx, circlePts(90 - Math.max(0, tr) * 14, 34, 11, 16).concat([circlePts(90 - Math.max(0, tr) * 14, 34, 11, 16)[0]]), { id: id0 + 33, w: 2.6, color: PRATA, amp: 0.4 });
    if (C.brinco === 'longo') for (const s of [-1, 1]) {
      if (at > 0.15 && s === sg) continue;
      const bx = s * 86 + tr * 4;
      ln(ctx, [[bx, 18], [bx + s * 2, 70]], { id: id0 + 34 + (s > 0 ? 1 : 0), w: 2.4, color: OURO, amp: 0.4 });
      shp(ctx, [[bx + s * 2, 66], [bx + s * 9, 84], [bx + s * 2, 106], [bx - s * 5, 84]], OURO, { id: id0 + 36 + (s > 0 ? 1 : 0), w: 2, reg: 0 });
    }
    // --- franja / linha do cabelo
    if (C.cabelo === 'cacheado') { // varrida pro lado esquerdo da tela
      const fr = TP([[78, -40], [92, -100], [50, -150], [-20, -170], [-110, -150], [-160, -80], [-150, 10], [-96, -30], [-70, -84], [-10, -102], [50, -92]]);
      fillShape(ctx, spline(fr, true, 4), C.cab, { seed: sd(id0 + 40), amp: 1.2 });
      ln(ctx, TP([[80, -40], [64, -78], [26, -96], [-24, -100], [-66, -86], [-92, -46], [-124, -6]]), { id: id0 + 41, w: 4 });
      curls(ctx, -40 + cx, -124, 76, 30, id0 + 42, 8, C.cabL, 2.4);
    } else if (C.cabelo === 'coque') {
      const fr = TP([[-84, -24], [-86, -96], [-42, -142], [0, -150], [42, -142], [86, -96], [84, -24], [74, -60], [40, -100], [0, -108], [-40, -100], [-74, -60]]);
      shp(ctx, fr, C.cab, { id: id0 + 40, w: 4.2 });
      ln(ctx, TP([[-36, -104], [-14, -136], [-2, -148]]), { id: id0 + 43, w: 2.4, color: C.cabL });
      ln(ctx, TP([[36, -104], [14, -136], [2, -148]]), { id: id0 + 44, w: 2.4, color: C.cabL });
      // base trançada do coque
      shp(ctx, [[hx * 0.6 - 54, -176], [hx * 0.6 + 54, -176], [hx * 0.6 + 46, -146], [hx * 0.6 - 46, -146]], C.cab, { id: id0 + 45, w: 3 });
      for (let i = -2; i <= 2; i++) ln(ctx, [[hx * 0.6 + i * 18 - 6, -172], [hx * 0.6 + i * 18 + 6, -150]], { id: id0 + 46 + i, w: 2, color: C.cabL, amp: 0.5 });
    } else { // topete: volume pra cima, penteado pra trás
      const fr = TP([[-84, -26], [-90, -86], [-72, -136], [-32, -168], [24, -192], [72, -178], [98, -142], [94, -64], [86, -38], [80, -82], [62, -112], [30, -122], [-10, -118], [-50, -106], [-74, -76], [-78, -30]]);
      shp(ctx, fr, C.cab, { id: id0 + 40, w: 4.2 });
      ln(ctx, TP([[-50, -110], [-36, -160], [10, -180]]), { id: id0 + 41, w: 2.6, color: C.cabL });
      ln(ctx, TP([[-10, -112], [10, -160], [56, -172]]), { id: id0 + 42, w: 2.4, color: C.cabL });
      ln(ctx, TP([[30, -106], [54, -146], [86, -140]]), { id: id0 + 43, w: 2.2, color: C.cabL });
    }
    // --- olhos (pupila ancorada: sem boil)
    const ey = -10, gx = (p.gx ?? 0) * 5, gy = (p.gy ?? 0) * 4;
    const blink = p.pisca ?? 0, sob = p.sobr ?? 0, sm = p.sorri ?? 0.2;
    [T(-34, ey), T(34, ey)].forEach(([x, y], i) => {
      const far = (i === 0 && tr > 0.15) || (i === 1 && tr < -0.15), kw = far ? 1 - 0.28 * at : 1, w = 17 * kw;
      const sq = sm > 0.6 ? (sm - 0.6) * 5 : 0; // olhos apertam no sorriso
      ln(ctx, [[x - w - 2, y - 32 - sob * 6], [x - w * 0.1, y - 38 - sob * 8], [x + w + 2, y - 33 - sob * 5]], { id: id0 + 50 + i, w: C.roupa === 'terno' ? 5.6 : 4.4, color: C.cab, amp: 0.9 });
      if (blink > 0.5) { ln(ctx, [[x - w, y + 1], [x, y + 6], [x + w, y + 1]], { id: id0 + 52 + i, w: 3.4, amp: 0.4 }); return; }
      const alm = spline([[x - w, y + 1], [x - w * 0.4, y - 8], [x + w * 0.5, y - 8], [x + w, y], [x + w * 0.3, y + 7 - sq], [x - w * 0.5, y + 7 - sq]], true, 3);
      fillPoly(ctx, alm, PAL.hi);
      ctx.save(); ctx.beginPath(); ctx.moveTo(...alm[0]); for (const q of alm) ctx.lineTo(...q); ctx.clip();
      fillPoly(ctx, circlePts(x + gx, y + gy, 8 * kw + 1, 20), '#3b2216');
      fillPoly(ctx, circlePts(x + gx, y + gy, 4.2, 14), PAL.ink);
      fillPoly(ctx, circlePts(x + gx + 2.5, y + gy - 2.5, 1.8, 8), PAL.hi);
      ctx.restore();
      ln(ctx, [[x - w - 1, y + 2], [x - w * 0.4, y - 9], [x + w * 0.5, y - 9], [x + w + 2, y]], { id: id0 + 52 + i, w: 4.2, amp: 0.35 });
      ln(ctx, [[x - w * 0.5, y + 8 - sq], [x + w * 0.4, y + 7.5 - sq]], { id: id0 + 56 + i, w: 1.8, amp: 0.3 });
    });
    const nx = cx + tr * 8;
    ln(ctx, [[nx + 2, -2], [nx + 6 + tr * 14, 26], [nx - 2 + tr * 8, 35]], { id: id0 + 58, w: 3.2 });
    ln(ctx, [[nx - 16 + tr * 8, 32], [nx - 9 + tr * 8, 36]], { id: id0 + 59, w: 2.6 });
    // --- boca: sorriso aberto com dentes; a fala abre um pouco mais
    const ab = clamp((p.aberto ?? 0) + (p.fala ?? 0) * 0.5), my = 62, mw = 21 + sm * 9, mx = cx + tr * 4;
    if (ab > 0.05) {
      shp(ctx, [[mx - mw, my - sm * 5], [mx, my - 1 + sm], [mx + mw, my - sm * 5], [mx + mw * 0.55, my + 5 + ab * 14], [mx - mw * 0.55, my + 5 + ab * 14]], '#4a1f1a', { id: id0 + 60, w: 3, reg: 0 });
      fillShape(ctx, spline([[mx - mw * 0.78, my - sm * 3], [mx, my + 1 + sm], [mx + mw * 0.78, my - sm * 3], [mx + mw * 0.6, my + 3 + ab * 3], [mx - mw * 0.6, my + 3 + ab * 3]], true, 3), PAL.hi, { seed: sd(id0 + 61), amp: 0.3 });
    } else {
      ln(ctx, [[mx - mw, my - sm * 6], [mx - mw * 0.4, my + sm * 3], [mx + mw * 0.4, my + sm * 3], [mx + mw, my - sm * 6]], { id: id0 + 60, w: 3.4, amp: 0.4 });
      if (!C.barba) ln(ctx, [[mx - 9, my + 12 + sm], [mx + 9, my + 12 + sm]], { id: id0 + 62, w: 2.2, amp: 0.3, color: C.peleS });
    }
    if (sm > 0.6) {
      ln(ctx, [[mx - mw - 10, my - 20], [mx - mw - 4, my - 8]], { id: id0 + 63, w: 2.2, color: C.peleS });
      ln(ctx, [[mx + mw + 10, my - 20], [mx + mw + 4, my - 8]], { id: id0 + 64, w: 2.2, color: C.peleS });
    }
    if (C.barba) { // bigode fino e cavanhaque curto
      shp(ctx, [[mx - 26, 47], [mx - 8, 42], [mx, 45], [mx + 8, 42], [mx + 26, 47], [mx + 22, 51], [mx, 49], [mx - 22, 51]], C.cab, { id: id0 + 66, w: 2.4, reg: 0.4 });
      const bx = cx * 0.55;
      shp(ctx, [[bx - 14, 84], [bx, 80], [bx + 14, 84], [bx + 9, 99], [bx, 104], [bx - 9, 99]], C.cab, { id: id0 + 67, w: 2.4, reg: 0.4 });
    }
    ctx.restore();
  });
}

// bolsista sentada de corpo inteiro na cadeira azul (storyboard 03). Mesma origem da pessoa.
export function sentada(ctx, p = {}, xf = {}) {
  const pele = ELENCO.bolsista.pele, preto = '#171414';
  withXf(ctx, xf, () => {
    // cadeira azul atrás, à esquerda da tela
    shp(ctx, [[-330, 140], [-150, 120], [-110, 520], [-130, 640], [-360, 650], [-380, 400]], PAL.azul, { id: 600, w: 4.4 });
    shp(ctx, [[-360, 560], [120, 540], [140, 640], [-380, 660]], PAL.azulE, { id: 601, w: 4 });
    ln(ctx, [[-320, 650], [-330, 960]], { id: 602, w: 7, color: '#3a3f45' });
    ln(ctx, [[100, 640], [110, 960]], { id: 603, w: 7, color: '#3a3f45' });
  });
  pessoa(ctx, 'bolsista', p, xf);
  withXf(ctx, xf, () => {
    // pernas cruzadas (calça preta), joelho de cima à direita
    shp(ctx, [[-200, 450], [-50, 452], [-20, 600], [-40, 700], [-70, 960], [-150, 960], [-140, 700], [-170, 600]], '#121010', { id: 610, w: 4 });
    shp(ctx, [[-150, 440], [160, 440], [230, 520], [240, 590], [180, 640], [120, 640], [60, 700], [16, 900], [-56, 890], [0, 680], [40, 610], [-60, 584], [-170, 562]], '#2a2525', { id: 611, w: 4 });
    ln(ctx, [[140, 560], [226, 584]], { id: 612, w: 2.6, color: '#5a5454' });
    ln(ctx, [[20, 700], [-10, 860]], { id: 617, w: 2.2, color: '#5a5454' });
    shp(ctx, [[-30, 884], [44, 900], [36, 934], [-44, 922]], '#0b0909', { id: 618, w: 3 });
    shp(ctx, [[-160, 950], [-60, 950], [-56, 984], [-170, 984]], '#0b0909', { id: 619, w: 3 });
    // braço direito (da tela) com a mão no joelho
    shp(ctx, capsule(206, 220, 232, 430, 40, 34, 8), PAL.hi, { id: 613, w: 3.8 });
    shp(ctx, capsule(236, 430, 170, 548, 38, 30, 8), PAL.hi, { id: 614, w: 3.8 });
    mao(ctx, pele, 'apoia', { x: 158, y: 556, s: 1.05, r: 2.2 }, { id: 980 });
    // braço esquerdo apoiado na coxa
    shp(ctx, capsule(-206, 220, -232, 430, 40, 34, 8), PAL.hi, { id: 615, w: 3.8 });
    shp(ctx, capsule(-236, 430, -150, 520, 38, 30, 8), PAL.hi, { id: 616, w: 3.8 });
    mao(ctx, pele, 'apoia', { x: -146, y: 524, s: 1.0, r: 0.4 }, { id: 990 });
  });
}

// ------------------------------------------------------------------ mãos
// Silhueta simples estilo cel: dorso + dedos em faixas. Pulso em (0,0), mão aponta pra +x.
// pose: 'segura' (envolve um cilindro vertical em x≈80), 'aponta', 'apoia', 'pinca'. a = abertura 0..1
export function mao(ctx, pele, pose, xf = {}, o = {}) {
  const id = o.id ?? 900, a = o.a ?? 0;
  withXf(ctx, xf, () => {
    const dedo = (i, x0, y0, x1, y1, r, r1 = r * 0.86) => shp(ctx, capsule(x0, y0, x1, y1, r, r1, 8), pele, { id: id + 10 + i, w: 3, splits: 1, reg: 0.4 });
    const dorso = (P) => shp(ctx, P, pele, { id: id + 1, w: 3.4 });
    if (pose === 'segura') {
      const lift = a * 10;
      dorso([[-4, -22], [26, -27], [52, -26], [62, -12], [60, 14], [44, 26], [-4, 22]]);
      [-18, -6, 6, 18].forEach((y, i) => dedo(i, 50, y - lift * (0.3 + i * 0.1), 104 - a * 30, y + 2 - lift * (0.6 + i * 0.25), 6.6, 6));
      dedo(9, 20, -24, 56 - a * 6, -36 - a * 6, 7.6, 6.6);
    } else if (pose === 'aponta') {
      dorso([[-4, -22], [30, -26], [58, -22], [66, -4], [60, 20], [36, 26], [-4, 22]]);
      [[8, 1], [-2, 2], [-12, 3]].forEach(([y, i]) => dedo(i, 52, y + 12, 70, y + 14, 7.4, 7));
      dedo(0, 56, -16, 124, -18, 7, 6);
      dedo(9, 18, -24, 60, -28, 8, 7);
    } else if (pose === 'apoia') {
      dorso([[-4, -22], [30, -28], [58, -28], [66, 0], [58, 26], [30, 28], [-4, 22]]);
      [[-21, 46], [-7, 52], [7, 48], [21, 40]].forEach(([y, L], i) => dedo(i, 56, y, 56 + L, y * 1.12, 6.8, 6));
      dedo(9, 18, -24, 44, -50, 8, 6.8);
    } else if (pose === 'pinca') {
      dorso([[-4, -22], [30, -26], [56, -24], [64, -2], [58, 20], [30, 24], [-4, 22]]);
      [[-4, 1], [8, 2], [19, 3]].forEach(([y, i]) => dedo(i, 54, y, 76, y + 8, 7, 6.4));
      dedo(0, 54, -16, 92, -16, 7, 6);
      dedo(9, 20, -24, 90, -30, 7.6, 6.4);
    }
  });
}

// ------------------------------------------------------------------ objetos
// frasco erlenmeyer: base em (0,0), gargalo em x ∈ [-26,26]
export function frasco(ctx, xf = {}, o = {}) {
  withXf(ctx, xf, () => {
    const id = o.id ?? 700;
    shp(ctx, [[-26, -150], [-26, -96], [-70, -10], [-66, 0], [66, 0], [70, -10], [26, -96], [26, -150], [32, -158], [-32, -158]], 'rgba(251,246,236,0.65)', { id, w: 4, reg: 0.3 });
    shp(ctx, [[-50, -46], [50, -46], [66, -8], [62, 0], [-62, 0], [-66, -8]], PAL.oliva, { id: id + 1, w: 3.2, reg: 0.8 });
    ln(ctx, [[-44, -46], [-10, -50], [20, -44], [44, -48]], { id: id + 2, w: 2.6, color: PAL.olivaE });
    ln(ctx, [[-14, -138], [-14, -100], [-40, -40]], { id: id + 3, w: 4, color: PAL.hi, amp: 0.6 });
  });
}

// frasco de vacina: base em (0,0), tampa no alto
export function vacina(ctx, xf = {}, o = {}) {
  withXf(ctx, xf, () => {
    const id = o.id ?? 760;
    shp(ctx, [[-40, -150], [40, -150], [44, -140], [44, -6], [38, 0], [-38, 0], [-44, -6], [-44, -140]], 'rgba(251,246,236,0.7)', { id, w: 4, reg: 0.3 });
    shp(ctx, [[-40, -96], [40, -96], [40, -6], [-40, -6]].map(p => [...p, 1]), PAL.oliva, { id: id + 1, w: 3, reg: 0.8 });
    shp(ctx, [[-30, -150], [30, -150], [30, -176], [-30, -176]].map(p => [...p, 1]), PAL.amarelo, { id: id + 2, w: 3.6 });
    shp(ctx, [[-36, -150], [36, -150], [36, -160], [-36, -160]].map(p => [...p, 1]), '#d8d6cc', { id: id + 3, w: 3 });
    shp(ctx, [[-44, -84], [44, -84], [44, -34], [-44, -34]].map(p => [...p, 1]), PAL.hi, { id: id + 4, w: 3 }); // rótulo
    ln(ctx, [[-30, -66], [20, -66]], { id: id + 5, w: 2.4, color: PAL.azulE, amp: 0.5 });
    ln(ctx, [[-30, -52], [6, -52]], { id: id + 6, w: 2, color: '#a6988a', amp: 0.5 });
    ln(ctx, [[-28, -140], [-28, -100]], { id: id + 7, w: 4, color: PAL.hi, amp: 0.5 });
  });
}
