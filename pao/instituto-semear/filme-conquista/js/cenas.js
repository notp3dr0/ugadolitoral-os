// O filme: 30 s, 24 fps, 720 quadros. render(t) desenha qualquer instante; tudo é função pura de t.
// Estrutura pelo roteiro + storyboard de 2026-11-04 (conferencia/…storyboard — Paó.pdf): depoimentos em retrato
// intercalados com as imagens das conquistas, QR no canto direito, tela dividida em triângulos, assinatura no preto.
import { PAL, GLOBAL, STYLE, spline, prefix, resample, boil, inkLoop, inkStroke, fillPoly, circlePts, mulberry32, clamp, lerp, inv, E, K, hs, arclen } from './engine.js';
import { ST, sd, withXf, shp, ln, capsule, pessoa, sentada, mao, vacina, ELENCO } from './personagens.js';

export const W = 1920, H = 1080, FPS = 24, DUR = 30;
let LOGO = null, PAPEL = null, GRAOS = [], QR = null, BOCA = {};
// cores de fundo por estilo
const PALETAS = {
  cel: { lab: '#ece5d6', esc: '#d8cfc1', escuro: '#2c2f34', mesa: '#d8bd95', fim: '#0d0b0a', haloP: '#f3d77d', haloA: '#c9d18e', haloB: '#3d6b7d' },
  flat: { lab: '#F6E7B5', esc: '#DCDDB8', escuro: '#0F3A4A', mesa: '#E8C38E', fim: '#0d0b0a', haloP: '#FFBB00', haloA: '#B9C35E', haloB: '#237B9F' },
  morph: { lab: '#FFBB00', esc: '#85933C', escuro: '#237B9F', mesa: '#C98C52', fim: '#0d0b0a', haloP: '#f1e9da', haloA: '#f1e9da', haloB: '#f1e9da' },
};
let BG = PALETAS.cel, HALOK = 1; // HALOK: no morph, o círculo da cena nasce cobrindo a tela e encolhe atrás do personagem
const VETOR = () => STYLE.boil === 0;

// tempos (iguais aos de cues.json)
const T = {
  A: 0, B: 4.95, Bm: 7.6, C: 11.3, Cs: 13.4, D: 15.85, Ee: 16.15, F: 18.75, G: 22.2, I: 25.2,
  linhas: 25.4, maos: 25.9, abre: 26.6, voam: 27.0, copa: 27.35, ultima: 28.0, sig: 28.3, preto: 29.5,
};
// cadência: [de, até, exposição em quadros]
const EXPO = [[0, 0.25, 2], [0.25, 0.625, 1], [0.625, 8.65, 2], [8.65, 8.8, 1], [8.8, 10.75, 2], [10.75, 11.3, 1], [11.3, 12.95, 2],
  [12.95, 13.15, 1], [13.15, 15.85, 2], [15.85, 16.15, 1], [16.15, 25.2, 2], [25.2, 25.45, 1], [25.45, 27.0, 2], [27.0, 27.5, 1],
  [27.5, 28.3, 2], [28.3, 30.01, 3]];
export const expo = (t) => VETOR() ? 1 : (EXPO.find(([a, b]) => t >= a && t < b) || [0, 0, 2])[2];

const pr = (t, a, b, e = 'io2') => E[e](inv(a, b, t));
const ss = (t, a, b) => pr(t, a, b, 'io3');
const fala = (who, t) => { if (VETOR()) return 0; const a = BOCA[who]; if (!a) return 0; const i = Math.round(t * FPS); return (a[i] ?? 0) * 0.8; };

// energia da fala (média de ±4 quadros): nos estilos vetor o corpo atua com ela, a boca não dubla
const energia = (who, t) => { const a = BOCA[who]; if (!a) return 0; const i = Math.round(t * FPS); let s = 0; for (let k = -4; k <= 4; k++) s += a[i + k] ?? 0; return s / 9; };
const aceno = (who, t) => VETOR() ? energia(who, t) * 0.045 * Math.sin(t * 7.5) : 0;

// ------------------------------------------------------------------ marca: SVG → polígonos
function parsePath(d) {
  const tk = d.match(/[MCLZ]|-?\d*\.?\d+/g), out = []; let cur = null, i = 0, cmd = null, x = 0, y = 0;
  const num = () => +tk[i++];
  while (i < tk.length) {
    if (/[MCLZ]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'M') { x = num(); y = num(); cur = [[x, y]]; out.push(cur); cmd = 'L'; }
    else if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]); }
    else if (cmd === 'C') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
      for (let k = 1; k <= 6; k++) { const u = k / 6, v = 1 - u;
        cur.push([v * v * v * x + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3]); }
      x = x3; y = y3;
    } else if (cmd === 'Z') { cmd = null; }
    else i++;
  }
  return out.filter((p) => p.length > 2);
}
function simbolo(w, bx, by) { // largura das mãos = w, base no ponto (bx, by)
  const MB = LOGO.maosBox, k = w / (MB.x1 - MB.x0);
  const Tr = (P) => P.map(([x, y]) => [bx + (x - MB.cx) * k, by + (y - MB.y1) * k]);
  return {
    k, maos: LOGO.maosP.map(Tr),
    pes: LOGO.pessoas.map((p) => ({ body: p.bodyP.map(Tr), head: p.headP.map(Tr), cx: bx + (p.cx - MB.cx) * k, cy: by + (p.cy - MB.y1) * k })),
    path: (ctx) => { ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.translate(-MB.cx, -MB.y1); },
  };
}
// símbolo desenhado à mão: o boil e o contorno somem perto da assinatura (amp, inkA → 0)
function simboloCel(ctx, S, fmaos, pesFn, o = {}) {
  const amp = o.amp ?? 1.6, inkA = o.inkA ?? 1;
  const grupo = (polys, cor, seed) => {
    const B = polys.map((P, i) => amp > 0.05 ? boil(resample(P, 3, true), sd(seed + i), amp, 60) : P);
    ctx.beginPath(); for (const P of B) { ctx.moveTo(...P[0]); for (const q of P) ctx.lineTo(...q); ctx.closePath(); }
    ctx.fillStyle = cor; ctx.fill('evenodd');
    if (inkA > 0.02) { ctx.save(); ctx.globalAlpha *= inkA; for (const P of B) if (arclen(P).at(-1) > 40) inkLoop(ctx, P, { seed: sd(seed + 50), amp: 0.6 * amp / 1.6, w: o.w ?? 2.6, color: PAL.ink, splits: 2, heavy: 0.3 }); ctx.restore(); }
  };
  if (fmaos > 0) {
    ctx.save();
    const yt = Math.min(...S.maos.map((P) => Math.min(...P.map((q) => q[1])))), yb = Math.max(...S.maos.map((P) => Math.max(...P.map((q) => q[1]))));
    ctx.beginPath(); ctx.rect(-W, lerp(yb + 4, yt - 10, fmaos), 3 * W, 3 * H); ctx.clip();
    grupo(S.maos, PAL.marrom, 4000);
    ctx.restore();
  }
  S.pes.forEach((p, i) => {
    const st = pesFn(i, p); if (!st) return; // { dx, dy, s }
    ctx.save(); ctx.translate(p.cx + st.dx, p.cy + st.dy); ctx.rotate(st.r || 0); ctx.scale(st.s, st.s); ctx.translate(-p.cx, -p.cy);
    grupo(p.body, PAL.oliva, 4100 + i * 7);
    grupo(p.head, PAL.amarelo, 4200 + i * 7);
    ctx.restore();
  });
}
function simboloOficial(ctx, S) {
  S.path(ctx);
  ctx.fillStyle = PAL.marrom; ctx.fill(LOGO.maos2d);
  for (const p of LOGO.pessoas) { ctx.fillStyle = PAL.oliva; ctx.fill(p.body2d); ctx.fillStyle = PAL.amarelo; ctx.fill(p.head2d); }
  ctx.restore();
}

// ------------------------------------------------------------------ câmera e utilidades
function cam(ctx, cx, cy, s) {
  ctx.setTransform(s, 0, 0, s, W / 2 - cx * s, H / 2 - cy * s);
  ST.k = s; GLOBAL.ink = 1 / s; GLOBAL.amp = 1 / s;
}
const tela = (ctx) => cam(ctx, W / 2, H / 2, 1);
const rect = (x0, y0, x1, y1) => [[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]];
const quad = (P) => P.map((p) => [...p, 1]);
const ln2 = (ctx, P, o) => ln(ctx, P, { color: '#8a745e', w: 2.6, ...o });
function braco(ctx, cor, P, r0, r1, id) {
  for (let i = 0; i < P.length - 1; i++) shp(ctx, capsule(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], i ? r1 + 6 : r0, r1, 8), cor, { id: id + i, w: 3.8 });
}
function percurso(ctx, P, frac, o = {}) { // a linha que conduz o filme
  if (frac <= 0) return null;
  const pts = prefix(o.dense ? P : spline(P, false, 4), frac);
  if (pts.length < 2) return null;
  inkStroke(ctx, pts, { seed: sd(o.id ?? 77), dense: true, amp: 1.2, w: o.w ?? 9, color: o.color ?? PAL.oliva, t0: 12, t1: o.t1 ?? 18, heavy: 0, jit: 0.2 });
  return pts.at(-1);
}
function pontilhado(ctx, P, frac, cor = PAL.marrom, id = 700) { // rastro pontilhado do movimento (cel FX)
  const pts = resample(spline(P, false, 4), 22);
  const n = Math.floor(pts.length * clamp(frac));
  for (let i = 0; i < n; i++) fillPoly(ctx, circlePts(pts[i][0], pts[i][1], (2.2 + hs(id, i) * 1.2) / ST.k * (ST.k > 1 ? 1.2 : 1), 8), cor);
}
function poeira(ctx, x, y, t0, t, id, cor = '#6d5a49', n = 7, r = 60) {
  const u = inv(t0, t0 + 0.6, t); if (u <= 0 || u >= 1) return;
  for (let i = 0; i < n; i++) {
    const a = hs(id, i) * Math.PI * 2, d = (12 + hs(id, i, 2) * r) * E.out3(u), s = (1 - u) * (2 + hs(id, i, 3) * 3);
    fillPoly(ctx, circlePts(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, s / ST.k + 0.4, 8), cor);
  }
}
function vibra(ctx, x, y, t0, t, id, cor = PAL.ink) {
  const u = inv(t0, t0 + 0.42, t); if (u <= 0 || u >= 1) return;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const r = 64 + i * 16 + u * 22, a0 = s > 0 ? -0.55 : Math.PI + 0.55, sp = 0.22 - i * 0.04;
    const P = [-1, 0, 1].map((k) => [x + Math.cos(a0 + k * sp * s) * r, y - 40 + Math.sin(a0 + k * sp * s) * r * 0.8]);
    if (i < 3 - Math.floor(u * 3)) ln(ctx, P, { id: id + i + (s > 0 ? 10 : 0), w: 3, color: cor, amp: 0.8 });
  }
}
function brilho(ctx, x, y, r, id, cor = PAL.amarelo) { // estrela de 4 pontas
  const P = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.28 : r; P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  shp(ctx, P, cor, { id, w: 2.4, reg: 0, sh: false, splits: 1 });
}
function hachura(ctx, x0, x1, y, id, n = 7) { // sombra de contato em hachura (no vetor: sombra chapada)
  if (VETOR()) { ctx.save(); ctx.fillStyle = 'rgba(40,24,16,0.16)'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, y + 6, (x1 - x0) / 2 + 10, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, (i + 0.5) / n); ln(ctx, [[x - 8, y + 14], [x + 8, y]], { id: id + i, w: 2.4, color: '#7d6a58', amp: 0.6 }); }
}
function halo(ctx, x, y, r, cor, a = 0.5) { // mancha de cor macia atrás do personagem (no vetor: círculo chapado)
  if (VETOR()) { ctx.save(); ctx.globalAlpha = clamp(a / 0.35); ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r * 0.86 * HALOK, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, cor); g.addColorStop(0.72, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// legenda (só o que a pessoa é), canto inferior esquerdo como no storyboard
function legenda(ctx, t, t0, t1, tit, sub) {
  const e = pr(t, t0, t0 + 0.35, 'out3'), s = pr(t, t1 - 0.3, t1, 'in2');
  if (e <= 0 || s >= 1) return;
  ctx.save(); ctx.font = '600 44px P'; const w1 = ctx.measureText(tit).width; ctx.font = '400 30px P'; const w2 = ctx.measureText(sub).width; ctx.restore();
  const w = Math.max(w1, w2) + 70, x0 = 70 - (1 - E.outBack(e, 1.6)) * (w + 90) - s * (w + 90), y0 = 812;
  shp(ctx, rect(x0, y0, x0 + w, y0 + 128), PAL.hi, { id: 860, w: 3.6, sh: false, reg: 0.4 });
  ctx.fillStyle = PAL.marrom; ctx.font = '600 44px P'; ctx.textAlign = 'left'; ctx.fillText(tit, x0 + 34, y0 + 58);
  ctx.fillStyle = PAL.ink; ctx.font = '400 30px P'; ctx.fillText(sub, x0 + 34, y0 + 102);
}
// QR real do site (isemear.org.br), sempre no canto direito
function qr(ctx, cx, cy, sz, a = 1) {
  if (!QR || a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const n = QR.n, q = 2, m = sz / (n + 2 * q), x0 = Math.round(cx - sz / 2), y0 = Math.round(cy - sz / 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, y0, sz, sz);
  ctx.fillStyle = '#111111';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (QR.m[r][c]) ctx.fillRect(Math.floor(x0 + (c + q) * m), Math.floor(y0 + (r + q) * m), Math.ceil(m), Math.ceil(m));
  ctx.restore();
}

// ------------------------------------------------------------------ cenários
function lab(ctx) {
  ctx.fillStyle = BG.lab; ctx.fillRect(-400, -400, 2800, 2000);
  if (STYLE.nome === 'morph') return;
  // estante com caixas à esquerda
  shp(ctx, rect(-40, 120, 330, 760), '#e2dccd', { id: 11, w: 3, color: '#8a745e' });
  for (let r = 0; r < 4; r++) {
    ln2(ctx, [[-40, 260 + r * 150], [330, 260 + r * 150]], { id: 12 + r });
    for (let c = 0; c < 3; c++) shp(ctx, rect(10 + c * 105, 170 + r * 150, 90 + c * 105, 258 + r * 150), [PAL.hi, '#d9c9b2', '#cfd9dc'][(r + c) % 3], { id: 20 + r * 3 + c, w: 2.4, color: '#8a745e', shd: 6 });
  }
  // janela pro laboratório ao lado
  shp(ctx, rect(1250, 70, 1660, 560), '#cfdfe3', { id: 40, w: 4, sh: false });
  shp(ctx, [[1430, 560], [1420, 380], [1460, 320], [1520, 330], [1540, 400], [1530, 560]], '#a8cbd6', { id: 41, w: 2.4, color: '#7f9aa3', sh: false });
  shp(ctx, circlePts(1480, 290, 34, 18), '#bcd7df', { id: 42, w: 2.4, color: '#7f9aa3', sh: false });
  ln(ctx, [[1300, 120], [1360, 220]], { id: 43, w: 3, color: PAL.hi });
  // tomada
  shp(ctx, rect(1700, 600, 1780, 680), PAL.hi, { id: 44, w: 2.6, color: '#8a745e' });
  ln(ctx, [[1728, 630], [1728, 648]], { id: 45, w: 4, color: '#a5452f' });
}
function escritorio(ctx) {
  ctx.fillStyle = BG.esc; ctx.fillRect(-400, -400, 2800, 2000);
  if (STYLE.nome === 'morph') return;
  shp(ctx, rect(1380, -40, 2200, 1200), '#cbc1b1', { id: 50, w: 3, color: '#8a745e', sh: false });
  // quadros na parede, cortados pelo topo
  for (const [x0, x1] of [[120, 700], [1480, 1960]]) {
    shp(ctx, rect(x0, -80, x1, 150), '#2a2a2c', { id: 51 + x0, w: 3.2 });
    shp(ctx, rect(x0 + 26, -60, x1 - 26, 124), '#e9e4da', { id: 52 + x0, w: 2.4, sh: false });
    ln2(ctx, [[x0 + 60, 90], [x0 + 200, 40], [x0 + 330, 80]], { id: 53 + x0 });
  }
}
function escuro(ctx) {
  ctx.fillStyle = BG.escuro; ctx.fillRect(-400, -400, 2800, 2000);
  if (VETOR()) return;
  const g = ctx.createRadialGradient(960, 480, 100, 960, 520, 1000);
  g.addColorStop(0, 'rgba(70,75,82,0.9)'); g.addColorStop(1, 'rgba(30,32,36,0)');
  ctx.fillStyle = g; ctx.fillRect(-400, -400, 2800, 2000);
}

// ------------------------------------------------------------------ retratos (depoimentos)
function retratoPesquisadora(ctx, t, o = {}) {
  lab(ctx);
  halo(ctx, 830, 380, 470, BG.haloP, 0.55);
  const pis = (t % 3.1) > 2.95 ? 1 : 0;
  pessoa(ctx, 'pesquisadora', { tr: 0.12, sorri: o.sorri ?? 1, aberto: 0.45, fala: o.fala ?? 0, gx: o.gx ?? 0, gy: o.gy ?? 0, pisca: pis, sobr: 0.35, tilt: 0.03 * Math.sin(t * 1.3) + aceno('pesquisadora', t) }, { x: 800, y: 440 + 60 * aceno('pesquisadora', t + 0.1), s: 1.55 });
}
function retratoAdvogado(ctx, t, o = {}) {
  escritorio(ctx);
  halo(ctx, 1080, 400, 460, BG.haloA, 0.4);
  const pis = (t % 2.7) > 2.55 ? 1 : 0;
  pessoa(ctx, 'advogado', { tr: -0.12, sorri: o.sorri ?? 0.45, fala: o.fala ?? 0, gx: o.gx ?? 0, pisca: pis, tilt: -0.02 + 0.02 * Math.sin(t * 1.1) + aceno('advogado', t) }, { x: 1080, y: 490 + 60 * aceno('advogado', t + 0.1), s: 1.85 });
}
function retratoBolsista(ctx, t, o = {}) {
  escuro(ctx);
  halo(ctx, 1000, 380, 520, BG.haloB, 0.5);
  const pis = (t % 3.3) > 3.15 ? 1 : 0;
  sentada(ctx, { tr: 0.1, sorri: o.sorri ?? 1, aberto: 0.7, fala: o.fala ?? 0, gx: o.gx ?? 0, gy: o.gy ?? 0, pisca: pis, sobr: 0.5, tilt: 0.04 + 0.02 * Math.sin(t * 1.4) + aceno('bolsista', t) }, { x: 1010, y: 300 + 60 * aceno('bolsista', t + 0.1), s: 0.75 });
}

// ------------------------------------------------------------------ A · 0–4,95 · vacina → pesquisadora
function cenaA(ctx, t) {
  const c = ss(t, 0.9, 1.9);
  cam(ctx, lerp(1300, 960, c), lerp(800, 540, c), lerp(2.3, 1, c));
  const desce = 1 - pr(t, 0, 0.5, 'in2'), sol = pr(t, 1.0, 1.35, 'out2'), sai = ss(t, 1.35, 2.0);
  const olha = ss(t, 1.6, 1.9), sorri = ss(t, 1.8, 2.2);
  lab(ctx);
  halo(ctx, 830, 380, 470, BG.haloP, 0.55 * c);
  pessoa(ctx, 'pesquisadora', { tr: lerp(0.35, 0.12, olha), gx: lerp(1, 0, olha), gy: lerp(1, 0, olha), sorri: lerp(0.4, 1, sorri), aberto: 0.45 * sorri, fala: fala('pesquisadora', t) * olha, sobr: 0.35 * sorri, tilt: lerp(0.08, 0.03, olha) + aceno('pesquisadora', t) * olha }, { x: 800, y: 440, s: 1.55 });
  // bancada à direita, na frente
  const bx = 1360, by = 950, vy = by - desce * 30;
  const sq = t >= 0.5 && t < 0.625 ? 0.96 : 1;
  const wx = bx - 80 * 1.45 - sai * 120, wy = vy - 1.45 * 112 + sai * 60;
  const lag = ss(t, 1.5, 2.3);
  braco(ctx, PAL.hi, [[1080, 720], [lerp(1150, 1120, lag), 900], [wx - 16, wy + 8]], 60, 40, 140);
  vacina(ctx, { x: bx, y: vy, s: 1.1, sx: 1 / sq });
  mao(ctx, ELENCO.pesquisadora.pele, 'segura', { x: wx, y: wy, s: 1.45 }, { a: sol, id: 900 });
  shp(ctx, quad([[1020, by], [2300, by], [2300, by + 30], [1020, by + 30]]), '#e6ddcb', { id: 16, w: 4.4 });
  shp(ctx, quad([[1020, by + 30], [2300, by + 30], [2300, 1500], [1020, 1500]]), '#d3c5aa', { id: 17, w: 3.6 });
  hachura(ctx, bx - 60, bx + 60, by + 4, 180);
  vibra(ctx, bx, by, 0.5, t, 160);
  if (t >= 0.5 && t < 1.0) [[bx - 90, by - 190, 14], [bx + 80, by - 210, 10]].forEach(([x, y, r], i) => brilho(ctx, x, y, r * (1 - inv(0.5, 1.0, t) * 0.6), 170 + i));
  // o arco nasce na base do frasco e sai pela direita
  percurso(ctx, [[bx + 50, by - 2], [bx + 220, by - 120], [bx + 420, by - 150], [bx + 640, by - 60]], pr(t, 3.9, 4.9), { id: 172 });
  tela(ctx);
  legenda(ctx, t, 2.0, 4.85, 'Pesquisadora', 'ex-bolsista');
}

// ------------------------------------------------------------------ B · 4,95–11,3 · advogado → documentos com os pais
const FOLHA = { x: 990, y: 760 };
function cenaB(ctx, t) {
  if (t < T.Bm) {
    tela(ctx);
    const z = ss(t, T.B, T.Bm);
    cam(ctx, 960 + z * 20, 540, 1 + z * 0.04);
    retratoAdvogado(ctx, t, { fala: fala('advogado', t), sorri: 0.4 });
    tela(ctx);
    // o arco chega da esquerda e vira o sublinhado da legenda
    percurso(ctx, [[-120, 960], [200, 958], [420, 956]], pr(t, T.B, T.B + 0.4, 'out2'), { id: 181, w: 7 });
    legenda(ctx, t, T.B + 0.25, T.Bm - 0.1, 'Advogado', 'ex-bolsista');
    return;
  }
  cam(ctx, 960, 740, 1.6);
  escritorio(ctx);
  const gira = ss(t, 7.8, 8.6), aponta = ss(t, 9.0, 9.4), espera = t > 9.45;
  pessoa(ctx, 'advogado', { tr: -0.5, gx: -1, gy: lerp(0.9, espera ? 0.2 : 0.9, ss(t, 9.6, 10.0)), sorri: espera ? 0.6 : 0.3, tilt: 0.05, fala: fala('advogado', t) }, { x: 1250, y: 370, s: 1.08 });
  shp(ctx, quad([[-300, 600], [2300, 600], [2300, 1500], [-300, 1500]]), BG.mesa, { id: 28, w: 4.4 });
  ln2(ctx, [[-300, 640], [2300, 640]], { id: 29, color: '#b8976c' });
  const ang = lerp(0.55, -0.12, gira), dx = lerp(110, -40, gira);
  const fc = [FOLHA.x + dx, FOLHA.y], cs = Math.cos(ang), sn = Math.sin(ang), F = (x, y) => [fc[0] + x * cs - y * sn, fc[1] + x * sn + y * cs];
  hachura(ctx, F(-150, 110)[0], F(150, 110)[0], F(0, 110)[1] - 2, 190, 9);
  shp(ctx, [[-150, -110, 1], [150, -110, 1], [150, 110, 1], [-150, 110, 1]].map(([x, y, k]) => [...F(x, y), k]), PAL.hi, { id: 30, w: 3.6 });
  [-70, -40, -10, 20, 50, 80].forEach((y, i) => { const L = [200, 240, 180, 230, 160, 210][i]; ln(ctx, [F(-120, y), F(-120 + L, y)], { id: 31 + i, w: 2.6, color: '#a6988a', amp: 0.6 }); });
  const marca = pr(t, 9.3, 9.6);
  if (marca > 0) ln(ctx, [F(-122, 20), F(-122 + 236 * marca, 20)], { id: 40, w: 9, color: 'rgba(255,187,0,0.6)', amp: 0.6 });
  if (t > 7.8 && t < 8.8) poeira(ctx, ...F(-150, 0), 7.9, t, 41, '#b9a88f', 6, 30);
  const pele = ELENCO.advogado.pele, terno = '#1f2127';
  const mR = F(125, -96), mL = F(30, -104);
  braco(ctx, terno, [[1080, 580], [1130, 660], [mR[0] + 70, mR[1] - 10]], 36, 24, 310);
  mao(ctx, pele, 'apoia', { x: mR[0] + 60, y: mR[1] - 6, s: 0.9, r: Math.PI + ang * 0.8 }, { id: 930 });
  const pa = F(-60 + 40 * aponta, 20);
  const wa = [lerp(mL[0] + 110, pa[0] + 115, aponta), lerp(mL[1] - 4, pa[1] + 6, aponta)];
  braco(ctx, terno, [[1420, 590], [1360, 730], [wa[0] + 10, wa[1] + 8]], 36, 24, 320);
  mao(ctx, pele, aponta > 0.3 ? 'aponta' : 'apoia', { x: wa[0], y: wa[1], s: 0.9, r: Math.PI }, { id: 940 });
  // mãos dos pais firmam o papel (8,7 s)
  const entra = pr(t, 8.3, 8.7, 'out3');
  if (entra > 0) {
    const e1 = F(-150, -30), p1 = [lerp(-80, e1[0] - 64, entra), lerp(e1[1] + 90, e1[1] - 4, entra)];
    braco(ctx, '#7d8a8f', [[p1[0] - 700, p1[1] + 520], [p1[0] - 10, p1[1] + 6]], 34, 28, 340);
    mao(ctx, '#8a5a3a', 'pinca', { x: p1[0], y: p1[1], s: 0.9, r: -0.08 + ang }, { id: 950 });
  }
  const entra2 = pr(t, 9.1, 9.5, 'out3');
  if (entra2 > 0) {
    const e2 = F(-130, 96), p2 = [lerp(-80, e2[0] - 70, entra2), lerp(e2[1] + 160, e2[1] + 30, entra2)];
    braco(ctx, '#b8a27a', [[p2[0] - 700, p2[1] + 480], [p2[0] - 10, p2[1] + 4]], 34, 28, 350);
    mao(ctx, '#b07a52', 'apoia', { x: p2[0], y: p2[1], s: 0.86, r: -0.25 }, { id: 960 });
  }
  // a linha indicada atravessa a borda e vira percurso; recua (antecipação) e estica (smear ~150%) até o corte
  const sai = pr(t, 9.7, 10.75, 'io2');
  if (sai > 0) {
    const p0 = F(114, 20);
    let P = [p0, [p0[0] + 120, p0[1] - 30], [p0[0] + 300, p0[1] + 40], [p0[0] + 520, p0[1] - 20], [p0[0] + 900, p0[1] - 60]];
    if (t >= 10.75 && t < 10.9) P = P.map(([x, y]) => [x - 18, y]);
    if (t >= 10.9) {
      const u = inv(10.9, 11.3, t), st = 1.5 + u * 1.0;
      P = P.map(([x, y]) => [p0[0] + (x - p0[0]) * st + u * 500, y]);
      percurso(ctx, P, 1, { id: 190, w: 9 });
      for (let i = 0; i < 4; i++) ln(ctx, [[p0[0] + 200 + i * 120 + u * 400, p0[1] - 60 + i * 34], [p0[0] + 420 + i * 120 + u * 700, p0[1] - 60 + i * 34]], { id: 195 + i, w: 2.4, color: PAL.olivaE });
    } else percurso(ctx, P, sai, { id: 190 });
  }
}

// ------------------------------------------------------------------ C · 11,3–15,85 · o mapa e o ônibus → bolsista
const ROTA = [[490, 712], [610, 700], [650, 790], [790, 810], [830, 890], [950, 905], [1045, 955]];
function mapa(ctx, frota) {
  ctx.fillStyle = BG.mesa; ctx.fillRect(-400, -400, 2800, 2000);
  hachura(ctx, 400, 1140, 1012, 200, 14);
  shp(ctx, quad([[400, 650], [1130, 650], [1160, 1010], [370, 1010]]), PAL.hi, { id: 60, w: 3.8 });
  [[430, 740, 590, 860], [690, 672, 900, 760], [960, 672, 1112, 850], [420, 900, 760, 990], [870, 935, 990, 992], [700, 838, 770, 880], [430, 670, 560, 690]]
    .forEach(([a, b, c, d], i) => shp(ctx, rect(a, b, c, d), '#ebe4d2', { id: 61 + i, w: 2, color: '#b3a491', reg: 0.4, sh: false }));
  const R = spline(ROTA, false, 4);
  percurso(ctx, R, frota, { id: 80, w: 10, dense: true });
  ROTA.forEach((p, i) => { if (i % 2 === 0) shp(ctx, circlePts(p[0], p[1], 9, 14), PAL.hi, { id: 82 + i, w: 3, reg: 0, sh: false }); });
  return R;
}
function onibus(ctx, x, y, a, id) {
  withXf(ctx, { x, y, r: a, s: 1 }, () => {
    shp(ctx, [[-30, -14, 1], [30, -14, 1], [34, 12, 1], [-30, 12, 1]], PAL.azul, { id, w: 2.8 });
    ln(ctx, [[-22, -5], [22, -5]], { id: id + 1, w: 2.2, color: PAL.hi });
    fillPoly(ctx, circlePts(-18, 14, 5, 10), PAL.ink); fillPoly(ctx, circlePts(18, 14, 5, 10), PAL.ink);
  });
}
function cenaC(ctx, t) {
  if (t < T.Cs) {
    cam(ctx, 770, 830, 2.0);
    const R = mapa(ctx, t < 11.6 ? 0.04 + pr(t, 11.3, 11.6, 'out2') * 0.14 : 1);
    if (t < 11.6) percurso(ctx, [[-200, 760], [200, 690], ROTA[0]], 1 - pr(t, 11.3, 11.6), { id: 181 });
    // dedo percorre o trajeto, desacelera antes da última curva e toca o destino uma vez (13,0 s)
    const u = K(t, [[11.6, 0.0], [12.3, 0.6, 'io2'], [12.82, 0.93, 'out3'], [13.0, 1.0, 'out2']]);
    const Lr = arclen(R), tot = Lr.at(-1);
    const at = (uu) => { let j = Lr.findIndex((v) => v >= uu * tot); if (j < 0) j = R.length - 1; return [R[j], R[Math.min(R.length - 1, j + 3)]]; };
    // o ônibus vem logo atrás do dedo
    if (u > 0.04) { const [b, b2] = at(Math.max(0, u - 0.07)); onibus(ctx, b[0], b[1] - 22, Math.atan2(b2[1] - b[1], b2[0] - b[0]), 92); }
    const [tip] = at(u), toca = t >= 13.0 && t < 13.15;
    const tipY = tip[1] + (toca ? 4 : 0) - (t > 13.15 ? 10 * ss(t, 13.15, 13.4) : 0);
    const om = [1150, 520], r = Math.atan2(tipY - om[1], tip[0] - om[0]) + 0.12, hk = 0.95;
    const wx = tip[0] - (124 * Math.cos(r) + 18 * Math.sin(r)) * hk, wy = tipY - (124 * Math.sin(r) - 18 * Math.cos(r)) * hk;
    const mx = lerp(om[0], wx, 0.5), my = lerp(om[1], wy, 0.5); let nx = -(wy - om[1]), ny = wx - om[0]; if (nx + ny < 0) { nx = -nx; ny = -ny; } const nl = Math.hypot(nx, ny) || 1;
    braco(ctx, PAL.hi, [om, [mx + nx / nl * 46, my + ny / nl * 46], [wx - Math.cos(r) * 8, wy - Math.sin(r) * 8]], 32, 22, 530);
    mao(ctx, ELENCO.bolsista.pele, 'aponta', { x: wx, y: wy, s: hk, r }, { id: 970 });
    const d = ROTA.at(-1);
    if (t >= 13.0) {
      const e = pr(t, 13.0, 13.35, 'out3');
      shp(ctx, circlePts(d[0], d[1], 12 + 6 * E.outBack(e), 16), PAL.amarelo, { id: 95, w: 3.2, reg: 0 });
      if (e < 1) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3, r0 = 26 + e * 30; ln(ctx, [[d[0] + Math.cos(a) * r0, d[1] + Math.sin(a) * r0], [d[0] + Math.cos(a) * (r0 + 16 * (1 - e)), d[1] + Math.sin(a) * (r0 + 16 * (1 - e))]], { id: 96 + i, w: 3, color: PAL.ink }); }
      brilho(ctx, d[0] + 40, d[1] - 40, 12 * (1 - e * 0.5), 103);
    } else shp(ctx, circlePts(d[0], d[1], 11, 16), PAL.hi, { id: 95, w: 3, reg: 0, sh: false });
    return;
  }
  // retrato sentada (storyboard 03): ergue o olhar e sorri
  const z = ss(t, T.Cs, T.D);
  cam(ctx, 960, 540 + z * 10, 1 + z * 0.03);
  const ergue = ss(t, 13.45, 13.85);
  retratoBolsista(ctx, t, { gy: lerp(1, 0, ergue), gx: lerp(-0.6, 0, ergue), sorri: lerp(0.5, 1, ergue), fala: fala('bolsista', t) });
  tela(ctx);
  legenda(ctx, t, 13.6, T.D - 0.05, 'Bolsista', 'startup de transporte');
}

// ------------------------------------------------------------------ tela dividida em triângulos (storyboard 04/05)
const REG = {
  esq: [[0, 0], [360, 0], [930, 1080], [0, 1080]],
  cen: [[360, 0], [1660, 0], [1010, 1080], [930, 1080]],
  dir: [[1660, 0], [1920, 0], [1920, 1080], [1010, 1080]],
};
function regiao(ctx, P, desenha, xf, id) { // xf: {dx, dy, r} desloca o painel inteiro (conteúdo junto)
  const { dx = 0, dy = 0, r = 0 } = xf || {};
  ctx.save(); ctx.translate(960 + dx, 540 + dy); ctx.rotate(r); ctx.translate(-960, -540);
  const k0 = ST.k; ST.k = 1;
  ctx.save(); ctx.beginPath(); ctx.moveTo(...P[0]); for (const q of P) ctx.lineTo(...q); ctx.closePath(); ctx.clip();
  desenha();
  ctx.restore();
  inkLoop(ctx, resample(P.map(p => [...p]), 3, true), { seed: sd(id), amp: 1.2, w: 6, color: PAL.ink, splits: 2 });
  ST.k = k0; ctx.restore();
}
function tres(ctx, t, ab = {}, sorri = 1) {
  regiao(ctx, REG.esq, () => { withXf(ctx, { x: -300, y: -120, s: 1 }, () => lab(ctx)); halo(ctx, 400, 430, 380, BG.haloP, 0.5);
    pessoa(ctx, 'pesquisadora', { tr: 0.15, sorri, aberto: 0.45, sobr: 0.3 }, { x: 400, y: 500, s: 1.45 }); }, ab.esq, 320);
  regiao(ctx, REG.cen, () => { escuro(ctx); halo(ctx, 1000, 330, 420, BG.haloB, 0.5);
    sentada(ctx, { tr: 0, sorri, aberto: 0.7, sobr: 0.5 }, { x: 990, y: 320, s: 0.82 }); }, ab.cen, 321);
  regiao(ctx, REG.dir, () => { withXf(ctx, { x: 500, y: 60, s: 1 }, () => escritorio(ctx)); halo(ctx, 1640, 460, 360, BG.haloA, 0.4);
    pessoa(ctx, 'advogado', { tr: -0.2, sorri: 0.5 * sorri }, { x: 1640, y: 540, s: 1.45 }); }, ab.dir, 322);
}
function cenaD(ctx, t) { // retorno rápido aos três (0,3 s, on ones)
  tela(ctx); ctx.fillStyle = PAL.cream; ctx.fillRect(0, 0, W, H);
  const e = 1 - pr(t, T.D, T.D + 0.12, 'out3');
  tres(ctx, t, { esq: { dx: -e * 900 }, cen: { dy: -e * 1100 }, dir: { dx: e * 900 } });
}

// ------------------------------------------------------------------ I + J · 25,2–30 · encontro → assinatura (sem corte)
const LK = { w: 262, x0: 228, by: 650 }; // assinatura: símbolo + nome, centrada; proporções do lockup do comercial e do "Um gesto"
const FIM = { w: LK.w, bx: LK.x0 + LK.w / 2, by: LK.by };
function textoLargura(ctx, s, x, y, size, peso, larg, estica) {
  ctx.font = `${peso} ${size}px P`; ctx.letterSpacing = '0px';
  const w0 = ctx.measureText(s).width;
  if (estica) { ctx.save(); ctx.translate(x, y); ctx.scale(larg / w0, 1); ctx.fillText(s, 0, 0); ctx.restore(); }
  else { ctx.letterSpacing = `${(larg - w0) / (s.length - 1)}px`; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; }
}
function nome(ctx, a) { // "INSTITUTO" fino espaçado sobre "semear" bold, versão clara pro fundo preto
  if (a <= 0) return;
  const k = LK.w / 222, x0 = LK.x0, by = LK.by, dx = (1 - a) * 30;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PAL.cream; ctx.textAlign = 'left';
  textoLargura(ctx, 'INSTITUTO', x0 + (756 - 337) * k + dx, by + (392 - 600) * k, 74 * k, 300, 703 * k, false);
  textoLargura(ctx, 'semear', x0 + (631 - 337) * k + dx, by + (555 - 600) * k, 216 * k, 700, 954 * k, true);
  ctx.restore();
}
const INI = { w: 600, bx: 970, by: 1240 }; // mãos grandes subindo no vértice da tela dividida (storyboard 05)
const VOAM = [ // as três primeiras pessoinhas saem dos painéis (índice da pessoinha ← de onde vem)
  { de: [300, 560], painel: 'esq' }, { de: [1000, 260], painel: 'cen' }, { de: [1640, 560], painel: 'dir' },
];
let ORDEM = null, PRIMEIRAS = null, ULTIMA = null;
function cenaIJ(ctx, t) {
  tela(ctx);
  ctx.fillStyle = BG.fim; ctx.fillRect(0, 0, W, H);
  // painéis: entram (25,2), ficam, e se abrem pra fora como páginas (26,6–27,3)
  const ent = pr(t, T.I, T.I + 0.2, 'out3'), ab = ss(t, T.abre, T.abre + 0.7);
  if (ab < 1) {
    const o = (1 - ent) + E.in3(ab) * 1.15;
    tres(ctx, t, { esq: { dx: -o * 1000, r: -ab * 0.12 }, cen: { dy: -o * 1150 }, dir: { dx: o * 1000, r: ab * 0.12 } });
  }
  // linhas que saem dos objetos de cada um e descem até o vértice
  const vai = pr(t, T.linhas, T.maos + 0.1, 'io2'), some = pr(t, T.maos + 0.1, T.maos + 0.4);
  if (vai > 0 && some < 1) {
    [[[420, 820], [700, 900], [930, 1080]], [[990, 760], [975, 940], [970, 1080]], [[1500, 820], [1200, 920], [1010, 1080]]]
      .forEach((P, i) => percurso(ctx, P, vai, { id: 220 + i, w: 9 * (1 - some) + 0.1, color: [PAL.oliva, PAL.amarelo, PAL.oliva][i] }));
  }
  // mãos do Semear: sobem do vértice e viajam até a posição da assinatura
  const viaja = ss(t, T.abre, T.abre + 0.85);
  const Sx = { w: lerp(INI.w, FIM.w, viaja), bx: lerp(INI.bx, FIM.bx, viaja), by: lerp(INI.by, FIM.by, viaja) };
  const sobe = pr(t, T.maos, T.maos + 0.5, 'out3');
  Sx.by += (1 - sobe) * 420;
  const S = simbolo(Sx.w, Sx.bx, Sx.by);
  if (!ORDEM) {
    const S0 = simbolo(FIM.w, FIM.bx, FIM.by);
    ORDEM = S0.pes.map((p, i) => [p.cy, i]).sort((a, b) => b[0] - a[0]).map((v) => v[1]); // de baixo pra cima
    const baixo = ORDEM.slice(0, 6).map((i) => [S0.pes[i].cx, i]).sort((a, b) => a[0] - b[0]);
    PRIMEIRAS = [baixo[0][1], baixo[2][1], baixo[5][1]]; ULTIMA = ORDEM.at(-1);
  }
  const fim = ss(t, T.ultima - 0.4, T.sig);
  const amp = 1.5 * (1 - fim), inkA = 1 - fim;
  if (t < T.sig) {
    simboloCel(ctx, S, sobe, (i, p) => {
      const k = PRIMEIRAS.indexOf(i);
      if (k >= 0) { // voa do painel pro lugar na copa, com rastro pontilhado
        const e = pr(t, T.voam + k * 0.08, T.voam + 0.4 + k * 0.08, 'io2'); if (e <= 0) return null;
        const [x0, y0] = VOAM[k].de, mx = (x0 + p.cx) / 2, my = Math.min(y0, p.cy) - 160;
        const q = (u) => [(1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * p.cx, (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * p.cy];
        if (e < 1) pontilhado(ctx, [q(0), q(e * 0.33), q(e * 0.66), q(e)], 1, PAL.amarelo, 710 + k);
        const [x, y] = q(e);
        return { dx: x - p.cx, dy: y - p.cy, s: lerp(1.6, 1, e), r: (1 - e) * (k - 1) * 0.6 };
      }
      if (i === ULTIMA) { const e = pr(t, T.ultima - 0.12, T.ultima + 0.12, 'lin'); return e > 0 ? { dx: 0, dy: 0, s: E.outBack(e, 2.6) } : null; }
      const n = ORDEM.indexOf(i), N = ORDEM.length - 1;
      const t0 = lerp(T.copa, T.ultima - 0.25, n / N), e = pr(t, t0, t0 + 0.18, 'lin');
      return e > 0 ? { dx: 0, dy: 0, s: E.outBack(e, 2.2) } : null;
    }, { amp, inkA });
    if (t >= T.ultima && t < T.ultima + 0.4) { const p = S.pes[ULTIMA]; brilho(ctx, p.cx + 46, p.cy - 40, 16 * (1 - inv(T.ultima, T.ultima + 0.4, t)), 880); }
  } else simboloOficial(ctx, simbolo(FIM.w, FIM.bx, FIM.by));
  // "A próxima conquista / começa com você." entra com a última pessoinha
  nome(ctx, pr(t, T.ultima - 0.3, T.ultima + 0.1, 'out3'));
  const tx = pr(t, T.ultima - 0.05, T.ultima + 0.35, 'out3');
  if (tx > 0) {
    ctx.save(); ctx.globalAlpha = tx; ctx.textAlign = 'center';
    ctx.fillStyle = PAL.cream; ctx.font = '600 60px P'; ctx.fillText('A próxima conquista', 960, 812 + (1 - tx) * 24);
    ctx.fillStyle = '#b9c66a'; ctx.font = '400 60px P'; ctx.fillText('começa com você.', 960, 886 + (1 - tx) * 30);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ montagem
export async function init(estilo = 'cel') {
  STYLE.nome = estilo; STYLE.boil = estilo === 'cel' ? 1 : 0; BG = PALETAS[estilo];
  LOGO = await (await fetch('assets/marca/logo-data.json')).json();
  LOGO.maosP = parsePath(LOGO.maos); LOGO.maos2d = new Path2D(LOGO.maos);
  for (const p of LOGO.pessoas) { p.bodyP = parsePath(p.body); p.headP = parsePath(p.head); p.body2d = new Path2D(p.body); p.head2d = new Path2D(p.head); }
  QR = await (await fetch('assets/qr.json')).json();
  try { BOCA = await (await fetch('audio/vozes/boca.json')).json(); } catch { BOCA = {}; }
  PAPEL = new Image(); PAPEL.src = 'assets/marca/papel.png'; await PAPEL.decode();
  for (let g = 0; g < 4; g++) {
    const c = document.createElement('canvas'); c.width = 960; c.height = 540; const x = c.getContext('2d'), d = x.createImageData(960, 540), r = mulberry32(900 + g);
    for (let i = 0; i < d.data.length; i += 4) { const v = 150 + r() * 105; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); GRAOS.push(c);
  }
}
export function render(ctx, t) {
  const f = Math.min(DUR * FPS - 1, Math.round(t * FPS)), ex = expo(f / FPS), q = Math.floor(f / ex) * ex, tq = q / FPS;
  ST.v = Math.floor(q / ex) % 4;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAL.cream; ctx.fillRect(0, 0, W, H);
  const tf = f / FPS; // a fala anda por quadro (boca em on ones dentro da exposição)
  HALOK = 1;
  if (STYLE.nome === 'morph') {
    if (!CORTES) CORTES = cortes();
    for (const k of CORTES) {
      if (k.alvoHalo && tq >= k.t && tq < k.t + MEIO) HALOK = lerp(2600 / k.B.r, 1, E.out3(easeM(inv(k.t, k.t + MEIO, tq))));
      if (k.deHalo && tq >= k.t - MEIO && tq < k.t) HALOK = lerp(1, 2600 / k.A.r, E.in3(easeM(inv(k.t - MEIO, k.t, tq))));
    }
  }
  if (tq < T.B) cenaA(ctx, tq);
  else if (tq < T.C) cenaB(ctx, tq);
  else if (tq < T.D) cenaC(ctx, tq);
  else if (tq < T.Ee) cenaD(ctx, tq);
  else if (tq < T.F) { const z = ss(tq, T.Ee, T.F); cam(ctx, lerp(1060, 1075, z), lerp(470, 480, z), lerp(1.12, 1.18, z)); retratoAdvogado(ctx, tq, { fala: fala('advogado', tf), sorri: 0.6 }); }
  else if (tq < T.G) { const z = ss(tq, T.F, T.G); cam(ctx, lerp(830, 840, z), lerp(470, 480, z), lerp(1.12, 1.2, z)); retratoPesquisadora(ctx, tq, { fala: fala('pesquisadora', tf) }); }
  else if (tq < T.I) { const z = ss(tq, T.G, T.I); cam(ctx, 975, lerp(520, 470, z), lerp(1.04, 1.14, z)); retratoBolsista(ctx, tq, { fala: fala('bolsista', tf) }); }
  else cenaIJ(ctx, tq);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ST.k = 1; GLOBAL.ink = GLOBAL.amp = 1;
  // papel ancorado ao quadro + grão em multiply
  if (STYLE.nome === 'morph') morph(ctx, tq);
  ctx.globalCompositeOperation = 'multiply';
  const papelA = { cel: 0.7, flat: 0, morph: 0.32 }[STYLE.nome], graoA = { cel: 0.13, flat: 0, morph: 0.05 }[STYLE.nome];
  if (papelA) { ctx.globalAlpha = papelA; ctx.drawImage(PAPEL, 0, 0, W, H); }
  if (graoA) { ctx.globalAlpha = graoA; ctx.drawImage(GRAOS[STYLE.nome === 'cel' ? ST.v : 0], 0, 0, W, H); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // QR do site no canto direito o filme todo; cresce na assinatura. Por cima do grão: módulos limpos
  const g = ss(tq, T.abre + 0.4, T.ultima);
  qr(ctx, lerp(1756, 1730, g), lerp(140, 190, g), Math.round(lerp(180, 250, g)));
  // tela preta no fim
  const p = pr(tq, T.preto, DUR - 1 / FPS, 'io2');
  if (p > 0) { ctx.fillStyle = `rgba(0,0,0,${p})`; ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ SHAPE MORPH: em cada corte do storyboard, o objeto principal
// vira círculo (forma intermediária), cobre a tela com a cor da cena seguinte e encolhe até virar o objeto principal dela.
const NPTS = 180;
function amostra(P) { // polígono fechado → NPTS pontos por comprimento de arco, começando no topo, sentido horário
  const Q = [...P, P[0]], L = [0];
  for (let i = 1; i < Q.length; i++) L.push(L[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
  const tot = L.at(-1), out = []; let j = 1;
  for (let i = 0; i < NPTS; i++) { const s = tot * i / NPTS; while (L[j] < s) j++; const u = (s - L[j - 1]) / (L[j] - L[j - 1] || 1); out.push([lerp(Q[j - 1][0], Q[j][0], u), lerp(Q[j - 1][1], Q[j][1], u)]); }
  let A = 0; for (let i = 0; i < NPTS; i++) { const p = out[i], q = out[(i + 1) % NPTS]; A += p[0] * q[1] - q[0] * p[1]; }
  if (A < 0) out.reverse();
  const cx = out.reduce((s, p) => s + p[0], 0) / NPTS, cy = out.reduce((s, p) => s + p[1], 0) / NPTS;
  let k = 0, best = 1e9; out.forEach(([x, y], i) => { const d = Math.abs(Math.atan2(y - cy, x - cx) + Math.PI / 2); if (d < best) { best = d; k = i; } });
  return { P: [...out.slice(k), ...out.slice(0, k)], cx, cy, r: Math.sqrt(Math.abs(A) / 2 / Math.PI) };
}
const circ = (cx, cy, r) => Array.from({ length: NPTS }, (_, i) => { const a = -Math.PI / 2 + (i / NPTS) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const retRot = (cx, cy, w, h, a) => { const c0 = Math.cos(a), s0 = Math.sin(a); return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c0 - y * s0, cy + x * s0 + y * c0]); };
const mistura = (A, B, u) => A.map((p, i) => [lerp(p[0], B[i][0], u), lerp(p[1], B[i][1], u)]);
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
const corMix = (a, b, u) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
function desenhaForma(ctx, P, cor, cx, cy, u) { // squash & stretch ~12% e leve rotação durante o morph
  const s = Math.sin(Math.PI * u), rot = 0.22 * s, sx = 1 + 0.12 * s, sy = 1 - 0.12 * s, c0 = Math.cos(rot), s0 = Math.sin(rot);
  ctx.beginPath();
  P.forEach(([x, y], i) => { const dx = (x - cx) * sx, dy = (y - cy) * sy; const X = cx + dx * c0 - dy * s0, Y = cy + dx * s0 + dy * c0; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
}
const MEIO = 0.34; // duração de cada metade do morph (8 quadros)
const easeM = (u) => { const v = clamp((u * 24 - 3) / 18); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }; // ~cubic-bezier(.7,0,.3,1) com 3 quadros de colchão
let CORTES = null;
function cortes() {
  const halo = (x, y, r) => circ(x, y, r * 0.86);
  const cen = REG.cen;
  return [ // a: forma que sai, ca: cor dela · b: forma que chega, cb: cor dela (= cor que cobre a tela no corte)
    { alvoHalo: true, t: T.B, a: retRot(1360, 868, 96, 196, 0), ca: '#85933C', b: halo(1080, 400, 460), cb: BG.haloA },
    { deHalo: true, t: T.Bm, a: halo(1064, 394, 478), ca: BG.haloA, b: retRot(1184, 572, 480, 352, 0.55), cb: BG.haloA },
    { t: T.C, a: retRot(944, 572, 480, 352, -0.12), ca: '#fbf6ec', b: [[220, 180], [1680, 180], [1740, 900], [160, 900]], cb: '#fbf6ec', direto: true },
    { alvoHalo: true, t: T.Cs, a: circ(1510, 790, 30), ca: '#FFBB00', b: halo(1000, 380, 520), cb: BG.haloB },
    // a volta rápida aos três (0,3 s) fica no corte seco: dois morphs ali se atropelam
    { deHalo: true, alvoHalo: true, t: T.F, a: halo(966, 446, 543), ca: BG.haloA, b: halo(960, 439, 526), cb: BG.haloP },
    { deHalo: true, alvoHalo: true, t: T.G, a: halo(948, 420, 564), ca: BG.haloP, b: halo(986, 394, 541), cb: BG.haloB },
    { deHalo: true, t: T.I, a: halo(988, 444, 593), ca: BG.haloB, b: cen, cb: BG.haloB },
  ].map((k) => ({ ...k, A: amostra(k.a), B: amostra(k.b) }));
}
function morph(ctx, t) {
  if (!CORTES) CORTES = cortes();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const R = 1250; // raio que cobre a tela
  for (const k of CORTES) {
    const { A, B } = k;
    if (k.direto) { // folha → mapa: as duas são retângulos, morph direto sem cobrir a tela
      const u = inv(k.t - 0.3, k.t + 0.18, t); if (u <= 0 || u >= 1) continue;
      const e = easeM(u), P = mistura(A.P, B.P, e);
      ctx.save(); ctx.globalAlpha = u > 0.8 ? (1 - u) / 0.2 : 1;
      desenhaForma(ctx, P, k.cb, lerp(A.cx, B.cx, e), lerp(A.cy, B.cy, e), u); ctx.restore();
      continue;
    }
    if (t >= k.t - MEIO && t < k.t && !k.deHalo) { // sai: forma → círculo → cobre a tela
      const u = inv(k.t - MEIO, k.t, t), e = easeM(u);
      const C1 = circ(A.cx, A.cy, A.r), P = e < 0.45 ? mistura(A.P, C1, e / 0.45) : circ(A.cx, A.cy, lerp(A.r, R * 1.6, E.in3((e - 0.45) / 0.55)));
      desenhaForma(ctx, P, corMix(k.ca, k.cb, clamp(e / 0.6)), A.cx, A.cy, u);
    } else if (t >= k.t && t < k.t + MEIO && !k.alvoHalo) { // chega: tela cheia → círculo → forma da cena nova
      const u = inv(k.t, k.t + MEIO, t), e = easeM(u);
      const P = e < 0.55 ? circ(B.cx, B.cy, lerp(R * 1.6, B.r, E.out3(e / 0.55))) : mistura(circ(B.cx, B.cy, B.r), B.P, (e - 0.55) / 0.45);
      ctx.save(); ctx.globalAlpha = u > 0.82 ? (1 - u) / 0.18 : 1;
      desenhaForma(ctx, P, k.cb, B.cx, B.cy, u); ctx.restore();
    }
  }
}
