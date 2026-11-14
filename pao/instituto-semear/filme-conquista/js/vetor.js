// Base comum dos estilos vetor (Flat Vector e Shape Morph): formas chapadas, easing elástico, personagem geométrico,
// marca, QR, legenda, assinatura e o motor de morph (silhueta tirada do contorno de qualquer desenho).
export const W = 1920, H = 1080, FPS = 24, DUR = 30;
export const C = {
  amarelo: '#FFBB00', oliva: '#85933C', olivaE: '#5E682C', olivaC: '#B9C35E', azul: '#237B9F', azulE: '#196282',
  petroleo: '#0F3A4A', marrom: '#975F30', marromC: '#C98C52', creme: '#F1E9DA', branco: '#FBF7EF', tinta: '#1F1A17', preto: '#0d0b0a',
};
export let LOGO = null, QR = null, BOCA = {}, PAL = null;

// ------------------------------------------------------------------ tempo e easing
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const E = {
  lin: (t) => t, in2: (t) => t * t, out2: (t) => 1 - (1 - t) * (1 - t), in3: (t) => t * t * t, out3: (t) => 1 - Math.pow(1 - t, 3),
  io2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), io3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2), // ~cubic-bezier(.34,1.56,.64,1)
  elast: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3.4)) + 1),
};
export const pr = (t, a, b, e = 'io2') => E[e](inv(a, b, t));
export const pop = (t, t0, d = 0.38) => (t < t0 ? 0 : E.back(inv(t0, t0 + d, t), 1.9)); // entrada elástica 0→1 (passa de 1)
export const sai = (t, t0, d = 0.25) => 1 - E.in3(inv(t0, t0 + d, t));
export function hs(...a) { let h = 2166136261 >>> 0; for (const v of a) { h = Math.imul(h ^ ((Math.round(v * 997) | 0) >>> 0), 16777619) >>> 0; h ^= h >>> 13; } return (h >>> 0) / 4294967296; }

// ------------------------------------------------------------------ desenho chapado
export const P = (ctx) => ctx;
export function fill(ctx, cor, fn) { ctx.beginPath(); fn(); ctx.fillStyle = cor; ctx.fill(); }
export function circ(ctx, x, y, r, cor) { if (r <= 0) return; fill(ctx, cor, () => ctx.arc(x, y, r, 0, Math.PI * 2)); }
export function rr(ctx, x, y, w, h, r, cor) { fill(ctx, cor, () => ctx.roundRect(x, y, w, h, r)); }
export function poly(ctx, pts, cor) { fill(ctx, cor, () => { ctx.moveTo(...pts[0]); for (const p of pts) ctx.lineTo(...p); ctx.closePath(); }); }
export function caps(ctx, x0, y0, x1, y1, r, cor) { ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 2 * r; ctx.strokeStyle = cor; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); }
export function traco(ctx, pts, w, cor, frac = 1) {
  if (frac <= 0) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w; ctx.strokeStyle = cor; ctx.beginPath();
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const alvo = L.at(-1) * clamp(frac); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) { if (L[i] <= alvo) ctx.lineTo(...pts[i]); else { const u = (alvo - L[i - 1]) / (L[i] - L[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)); break; } }
  ctx.stroke(); ctx.restore();
}
export function curva(P0, P1, P2, n = 40) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n; o.push([(1 - u) * (1 - u) * P0[0] + 2 * u * (1 - u) * P1[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * u * (1 - u) * P1[1] + u * u * P2[1]]); } return o; }
// escala com squash & stretch em torno de (x,y)
export function sq(ctx, x, y, sx, sy, fn, r = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(sx, sy); fn(); ctx.restore(); }
export function estrela(ctx, x, y, r, cor, pontas = 4, k = 0.32) {
  const pts = []; for (let i = 0; i < pontas * 2; i++) { const a = (i / (pontas * 2)) * Math.PI * 2 - Math.PI / 2, rr0 = i % 2 ? r * k : r; pts.push([x + Math.cos(a) * rr0, y + Math.sin(a) * rr0]); }
  poly(ctx, pts, cor);
}
export function coracao(ctx, x, y, s, cor) {
  fill(ctx, cor, () => { ctx.moveTo(x, y + s * 0.9); ctx.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45); ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.6, y - s * 0.1, x, y + s * 0.9); });
}
export function casa(ctx, x, y, s, corParede, corTeto, corPorta) {
  rr(ctx, x - s * 0.8, y - s * 0.6, s * 1.6, s * 1.2, s * 0.06, corParede);
  poly(ctx, [[x - s, y - s * 0.55], [x, y - s * 1.35], [x + s, y - s * 0.55]], corTeto);
  if (corPorta) rr(ctx, x - s * 0.22, y + s * 0.02, s * 0.44, s * 0.58, s * 0.2, corPorta);
}

// ------------------------------------------------------------------ personagem geométrico (Flat)
export const GENTE = {
  pesquisadora: { pele: '#8d5a3a', peleS: '#74482d', cab: '#22160e', roupa: C.branco, roupaS: '#e2dccd', dentro: '#8f908c', brinco: 'argola' },
  advogado: { pele: '#d9a985', peleS: '#c08f6b', cab: '#2a1d15', roupa: '#1f2127', roupaS: '#2c2f37', dentro: '#ffffff', gravata: '#c0262f' },
  bolsista: { pele: '#7a4a2c', peleS: '#643b22', cab: '#1a110c', roupa: C.branco, roupaS: '#e2dccd', dentro: '#171414', lapela: '#171414', brinco: 'ouro' },
  pai: { pele: '#a8714c', peleS: '#8e5d3c', cab: '#3a2a1e', roupa: '#5E682C', roupaS: '#4d5624', dentro: '#5E682C', chapeu: true },
  mae: { pele: '#b77d55', peleS: '#9a6644', cab: '#2a1d15', roupa: '#C98C52', roupaS: '#b07a46', dentro: '#C98C52', lenco: true },
  menino: { pele: '#d9a985', peleS: '#c08f6b', cab: '#2a1d15', roupa: '#237B9F', roupaS: '#1d6a89', dentro: '#237B9F' },
};
// o = { x, y, s, tilt, pisca, gx, gy, bracoE, bracoD (ângulos, 0 = pra baixo), inteiro (corpo inteiro), pulo, segura: (ctx) => desenha na mão direita }
export function boneco(ctx, who, o = {}) {
  const G = GENTE[who], s = o.s ?? 1;
  ctx.save(); ctx.translate(o.x ?? 0, o.y ?? 0); ctx.scale(s * (o.sx ?? 1), s * (o.sy ?? 1));
  const tilt = o.tilt ?? 0;
  const ombro = o.inteiro ? 70 : 150, yO = o.inteiro ? 108 : 128;
  const braco = (lado, ang) => { // ombro → mão (cápsula), mão redonda
    const sx = lado * (ombro - 12), a = ang * lado, L = o.inteiro ? 120 : 150;
    const ex = sx + Math.sin(a) * L, ey = yO + Math.cos(a) * L;
    caps(ctx, sx, yO, ex, ey, o.inteiro ? 17 : 30, G.roupaS);
    circ(ctx, ex, ey, o.inteiro ? 15 : 24, G.pele);
    return [ex, ey];
  };
  // cabelo de trás
  if (who === 'pesquisadora') [[-58, -22, 64], [-84, 34, 56], [-78, 92, 46], [-22, -62, 58], [30, -64, 52], [64, -30, 42], [-102, -4, 44], [-40, 118, 34]].forEach(([x, y, r]) => circ(ctx, x, y, r, G.cab));
  if (who === 'bolsista') { circ(ctx, 0, -138, 74, G.cab); rr(ctx, -46, -84, 92, 22, 10, '#3a2618'); }
  // corpo
  if (o.inteiro) {
    const pulo = o.pulo ?? 0;
    caps(ctx, -26, 236, -30 - pulo * 10, 360, 20, who === 'advogado' ? '#1f2127' : '#2b2420');
    caps(ctx, 26, 236, 30 + pulo * 10, 360, 20, who === 'advogado' ? '#1f2127' : '#2b2420');
    rr(ctx, -50 - pulo * 10, 352, 44, 22, 10, C.tinta); rr(ctx, 6 + pulo * 10, 352, 44, 22, 10, C.tinta);
    rr(ctx, -72, 92, 144, 160, 44, G.roupa);
  } else {
    fill(ctx, G.roupa, () => { ctx.moveTo(-58, 92); ctx.quadraticCurveTo(-158, 104, -166, 200); ctx.lineTo(-170, 330); ctx.lineTo(170, 330); ctx.lineTo(166, 200); ctx.quadraticCurveTo(158, 104, 58, 92); ctx.closePath(); });
    fill(ctx, G.roupaS, () => { ctx.moveTo(70, 100); ctx.quadraticCurveTo(152, 112, 160, 200); ctx.lineTo(170, 330); ctx.lineTo(120, 330); ctx.lineTo(118, 200); ctx.closePath(); });
  }
  const k = o.inteiro ? 0.5 : 1;
  poly(ctx, [[-40 * k, 92], [40 * k, 92], [0, 92 + 92 * k]], G.dentro);
  if (G.gravata) { poly(ctx, [[-9 * k, 100], [9 * k, 100], [13 * k, 100 + 62 * k], [0, 100 + 80 * k], [-13 * k, 100 + 62 * k]], G.gravata); }
  if (G.lapela) { poly(ctx, [[-44 * k, 92], [-14 * k, 92 + 100 * k], [-60 * k, 92 + 40 * k]], G.lapela); poly(ctx, [[44 * k, 92], [14 * k, 92 + 100 * k], [60 * k, 92 + 40 * k]], G.lapela); poly(ctx, [[-24 * k, 92], [24 * k, 92], [0, 92 + 80 * k]], G.pele); }
  // braços
  const mE = braco(-1, o.bracoE ?? 0.12), mD = braco(1, o.bracoD ?? 0.12);
  // pescoço e cabeça (inclina em volta do pescoço)
  rr(ctx, -22, 52, 44, 50, 14, G.peleS);
  ctx.save(); ctx.translate(0, 70); ctx.rotate(tilt); ctx.translate(0, -70);
  circ(ctx, -68, 6, 14, G.pele); circ(ctx, 68, 6, 14, G.pele);
  circ(ctx, 0, 0, 70, G.pele);
  fill(ctx, G.peleS, () => { ctx.arc(0, 0, 70, -0.2, Math.PI * 0.55); ctx.arc(-14, -8, 66, Math.PI * 0.5, -0.25, true); ctx.closePath(); });
  // cabelo da frente
  if (who === 'pesquisadora') [[-30, -56, 40], [10, -66, 36], [44, -48, 28], [-62, -26, 32]].forEach(([x, y, r]) => circ(ctx, x, y, r, G.cab));
  if (who === 'bolsista' || who === 'mae') fill(ctx, G.cab, () => { ctx.arc(0, -4, 72, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(0, -62, -68, -30); ctx.closePath(); });
  if (who === 'advogado' || who === 'menino') fill(ctx, G.cab, () => { ctx.moveTo(-70, -6); ctx.quadraticCurveTo(-80, -70, -30, -92); ctx.quadraticCurveTo(30, -118, 70, -70); ctx.quadraticCurveTo(80, -40, 70, -10); ctx.quadraticCurveTo(52, -52, 0, -48); ctx.quadraticCurveTo(-48, -46, -70, -6); ctx.closePath(); });
  if (who === 'pai') { fill(ctx, '#d9b36b', () => { ctx.ellipse(0, -46, 110, 22, 0, 0, Math.PI * 2); }); fill(ctx, '#d9b36b', () => { ctx.ellipse(0, -66, 60, 40, 0, Math.PI, 0); }); rr(ctx, -60, -58, 120, 12, 4, C.marrom); }
  if (G.lenco) fill(ctx, '#c0262f', () => { ctx.arc(0, -10, 74, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(0, -40, -72, -16); ctx.closePath(); });
  // rosto: olhos (piscam), sobrancelhas, sorriso fixo (não dubla)
  const gx = (o.gx ?? 0) * 6, gy = (o.gy ?? 0) * 5;
  for (const sx of [-24, 24]) {
    if ((o.pisca ?? 0) > 0.5) caps(ctx, sx - 8, 0, sx + 8, 0, 2.6, C.tinta);
    else { circ(ctx, sx + gx, -2 + gy, 7.5, C.tinta); circ(ctx, sx + gx + 2.5, -5 + gy, 2.4, '#fff'); }
    caps(ctx, sx - 11, -24 - (o.sobr ?? 0) * 6, sx + 11, -27 - (o.sobr ?? 0) * 6, 3.2, G.cab);
  }
  circ(ctx, -40, 22, 11, 'rgba(224,110,90,0.28)'); circ(ctx, 40, 22, 11, 'rgba(224,110,90,0.28)');
  ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = C.tinta; ctx.beginPath();
  ctx.arc(0, 18, o.sorriso ?? 22, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke(); ctx.restore();
  if (who === 'advogado') { rr(ctx, -20, 22, 40, 8, 4, G.cab); fill(ctx, G.cab, () => ctx.arc(0, 56, 12, 0, Math.PI)); }
  if (G.brinco === 'argola') { ctx.save(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#d8d6cc'; ctx.beginPath(); ctx.arc(72, 28, 10, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (G.brinco === 'ouro') for (const sx of [-72, 72]) { caps(ctx, sx, 18, sx, 40, 2, '#c9932e'); estrela(ctx, sx, 50, 10, '#c9932e', 2, 0.5); }
  ctx.restore();
  // objeto na mão direita
  if (o.segura) { ctx.save(); ctx.translate(...mD); o.segura(ctx); ctx.restore(); }
  ctx.restore();
  return { mE, mD };
}

// ------------------------------------------------------------------ objetos chapados
export function frasco(ctx, x, y, s, sx = 1, sy = 1) { // base em (x,y)
  sq(ctx, x, y, s * sx, s * sy, () => {
    rr(ctx, -40, -150, 80, 150, 14, 'rgba(255,255,255,0.75)');
    rr(ctx, -40, -92, 80, 92, 14, C.oliva);
    rr(ctx, -40, -84, 80, 44, 0, C.branco);
    rr(ctx, -26, -70, 44, 7, 3, C.azulE);
    rr(ctx, -34, -176, 68, 30, 8, C.amarelo);
    rr(ctx, -26, -138, 10, 40, 5, 'rgba(255,255,255,0.9)');
  });
}
export function pessoinhaIcone(ctx, x, y, s, corpo = C.oliva, cabeca = C.amarelo) {
  caps(ctx, x - 9 * s, y - 2 * s, x - 18 * s, y - 14 * s, 4.5 * s, corpo); caps(ctx, x + 9 * s, y - 2 * s, x + 18 * s, y - 14 * s, 4.5 * s, corpo);
  caps(ctx, x, y - 4 * s, x, y + 10 * s, 7 * s, corpo); caps(ctx, x - 4 * s, y + 12 * s, x - 9 * s, y + 24 * s, 4.5 * s, corpo); caps(ctx, x + 4 * s, y + 12 * s, x + 9 * s, y + 24 * s, 4.5 * s, corpo);
  circ(ctx, x, y - 18 * s, 7.5 * s, cabeca);
}

// ------------------------------------------------------------------ marca
function parsePath(d) {
  const tk = d.match(/[MCLZ]|-?\d*\.?\d+/g), out = []; let cur = null, i = 0, cmd = null, x = 0, y = 0;
  const num = () => +tk[i++];
  while (i < tk.length) {
    if (/[MCLZ]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'M') { x = num(); y = num(); cur = [[x, y]]; out.push(cur); cmd = 'L'; }
    else if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]); }
    else if (cmd === 'C') { const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
      for (let k = 1; k <= 6; k++) { const u = k / 6, v = 1 - u; cur.push([v * v * v * x + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3]); }
      x = x3; y = y3; }
    else if (cmd === 'Z') cmd = null; else i++;
  }
  return out.filter((p) => p.length > 2);
}
export function simbolo(w, bx, by) {
  const MB = LOGO.maosBox, k = w / (MB.x1 - MB.x0);
  const T = (pt) => [bx + (pt[0] - MB.cx) * k, by + (pt[1] - MB.y1) * k];
  return { k, T, pes: LOGO.pessoas.map((p) => ({ ...p, X: bx + (p.cx - MB.cx) * k, Y: by + (p.cy - MB.y1) * k })),
    em: (ctx, fn) => { ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.translate(-MB.cx, -MB.y1); fn(); ctx.restore(); } };
}
export function maosDesenho(ctx, S, cor = C.marrom, revela = 1) {
  if (revela <= 0) return;
  ctx.save();
  const MB = LOGO.maosBox, yTop = S.T([0, MB.y0])[1], yBase = S.T([0, MB.y1])[1];
  ctx.beginPath(); ctx.rect(-W, lerp(yBase + 4, yTop - 10, revela), 3 * W, 3 * H); ctx.clip();
  S.em(ctx, () => { ctx.fillStyle = cor; ctx.fill(LOGO.maos2d); });
  ctx.restore();
}
export function pessoinhaLogo(ctx, S, i, st = { dx: 0, dy: 0, s: 1, r: 0 }, cores = [C.oliva, C.amarelo]) {
  const p = S.pes[i];
  ctx.save(); ctx.translate(p.X + st.dx, p.Y + st.dy); ctx.rotate(st.r || 0); ctx.scale(st.s, st.s); ctx.translate(-p.X, -p.Y);
  S.em(ctx, () => { ctx.fillStyle = cores[0]; ctx.fill(p.body2d); ctx.fillStyle = cores[1]; ctx.fill(p.head2d); });
  ctx.restore();
}
export function ordemCopa() { // de baixo pra cima; as 3 primeiras (esq, meio, dir de baixo) e a última (topo)
  const S = simbolo(LK.w, FIM.bx, FIM.by);
  const ord = S.pes.map((p, i) => [p.Y, i]).sort((a, b) => b[0] - a[0]).map((v) => v[1]);
  const baixo = ord.slice(0, 6).map((i) => [S.pes[i].X, i]).sort((a, b) => a[0] - b[0]);
  return { ord, primeiras: [baixo[0][1], baixo[2][1], baixo[5][1]], ultima: ord.at(-1) };
}
// assinatura: símbolo à esquerda + INSTITUTO / semear (proporções do lockup do comercial e do "Um gesto")
export const LK = { w: 262, x0: 228, by: 650 };
export const FIM = { w: LK.w, bx: LK.x0 + LK.w / 2, by: LK.by };
function textoLargura(ctx, s, x, y, size, peso, larg, estica) {
  ctx.font = `${peso} ${size}px P`; ctx.letterSpacing = '0px';
  const w0 = ctx.measureText(s).width;
  if (estica) { ctx.save(); ctx.translate(x, y); ctx.scale(larg / w0, 1); ctx.fillText(s, 0, 0); ctx.restore(); }
  else { ctx.letterSpacing = `${(larg - w0) / (s.length - 1)}px`; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; }
}
export function nome(ctx, a, cor = C.creme) {
  if (a <= 0) return;
  const k = LK.w / 222, x0 = LK.x0, by = LK.by, dx = (1 - a) * 30;
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = cor; ctx.textAlign = 'left';
  textoLargura(ctx, 'INSTITUTO', x0 + (756 - 337) * k + dx, by + (392 - 600) * k, 74 * k, 300, 703 * k, false);
  textoLargura(ctx, 'semear', x0 + (631 - 337) * k + dx, by + (555 - 600) * k, 216 * k, 700, 954 * k, true);
  ctx.restore();
}
export function cta(ctx, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.textAlign = 'center';
  ctx.fillStyle = C.creme; ctx.font = '600 60px P'; ctx.fillText('A próxima conquista', 960, 812 + (1 - a) * 24);
  ctx.fillStyle = '#b9c66a'; ctx.font = '400 60px P'; ctx.fillText('começa com você.', 960, 886 + (1 - a) * 30);
  ctx.restore();
}
export function qr(ctx, cx, cy, sz, a = 1) {
  if (!QR || a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const n = QR.n, q = 2, m = sz / (n + 2 * q), x0 = Math.round(cx - sz / 2), y0 = Math.round(cy - sz / 2);
  ctx.fillStyle = '#fff'; ctx.fillRect(x0, y0, sz, sz); ctx.fillStyle = '#111';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (QR.m[r][c]) ctx.fillRect(Math.floor(x0 + (c + q) * m), Math.floor(y0 + (r + q) * m), Math.ceil(m), Math.ceil(m));
  ctx.restore();
}
// legenda do storyboard (só o que a pessoa é), entra elástica pela esquerda
export function legenda(ctx, t, t0, t1, tit, sub, cor = C.marrom) {
  const e = pop(t, t0, 0.42), s = pr(t, t1 - 0.25, t1, 'in3');
  if (e <= 0 || s >= 1) return;
  ctx.save(); ctx.font = '600 44px P'; const w1 = ctx.measureText(tit).width; ctx.font = '400 30px P'; const w2 = ctx.measureText(sub).width; ctx.restore();
  const w = Math.max(w1, w2) + 76, x0 = 70 - (1 - e) * (w + 90) - s * (w + 90), y0 = 812;
  rr(ctx, x0, y0, w, 128, 22, C.branco);
  rr(ctx, x0, y0 + 110, w, 18, 0, 'rgba(0,0,0,0)');
  rr(ctx, x0 + 34, y0 + 72, 46, 6, 3, C.amarelo);
  ctx.fillStyle = cor; ctx.font = '600 44px P'; ctx.textAlign = 'left'; ctx.fillText(tit, x0 + 34, y0 + 58);
  ctx.fillStyle = C.tinta; ctx.font = '400 30px P'; ctx.fillText(sub, x0 + 34, y0 + 108);
}
export const energia = (who, t) => { const a = BOCA[who]; if (!a) return 0; const i = Math.round(t * FPS); let s = 0; for (let k = -4; k <= 4; k++) s += a[i + k] ?? 0; return s / 9; };
export const aceno = (who, t) => energia(who, t) * 0.07 * Math.sin(t * 7.5);

// ------------------------------------------------------------------ morph: silhueta de qualquer desenho
const MS = 300; let MASK = null;
export function silhueta(desenha) { // desenha em [-1,1]² (escala 140 px por unidade) → contorno externo, NPTS pontos
  if (!MASK) { MASK = document.createElement('canvas'); MASK.width = MASK.height = MS; }
  const m = MASK.getContext('2d', { willReadFrequently: true });
  m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, MS, MS);
  m.setTransform(MS / 2.4, 0, 0, MS / 2.4, MS / 2, MS / 2); m.fillStyle = '#000'; m.strokeStyle = '#000';
  desenha(m);
  const d = m.getImageData(0, 0, MS, MS).data, on = (x, y) => x >= 0 && y >= 0 && x < MS && y < MS && d[(y * MS + x) * 4 + 3] > 127;
  let sx = -1, sy = -1; for (let y = 0; y < MS && sx < 0; y++) for (let x = 0; x < MS; x++) if (on(x, y)) { sx = x; sy = y; break; }
  // Moore com critério de parada de Jacob: volta ao início entrando pelo mesmo vizinho
  const D = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const dirDe = (dx, dy) => D.findIndex(([a, b]) => a === dx && b === dy);
  const pts = []; let cx = sx, cy = sy, bi = 7, guard = 0, segundo = null;
  while (guard++ < 40000) {
    pts.push([cx, cy]);
    let achou = -1;
    for (let k = 1; k <= 8; k++) { const d = (bi + k) % 8; if (on(cx + D[d][0], cy + D[d][1])) { achou = d; break; } }
    if (achou < 0) break;
    const bx = cx + D[(achou + 7) % 8][0], by = cy + D[(achou + 7) % 8][1];
    const nx = cx + D[achou][0], ny = cy + D[achou][1];
    if (segundo === null) segundo = [nx, ny];
    else if (cx === sx && cy === sy && nx === segundo[0] && ny === segundo[1]) { pts.pop(); break; }
    cx = nx; cy = ny; bi = dirDe(bx - cx, by - cy);
  }
  const u = pts.map(([px, py]) => [(px - MS / 2) / (MS / 2.4), (py - MS / 2) / (MS / 2.4)]);
  return reamostra(suaviza(u, 3));
}
function suaviza(P, k) { const n = P.length; return P.map((_, i) => { let x = 0, y = 0; for (let j = -k; j <= k; j++) { const q = P[(i + j + n) % n]; x += q[0]; y += q[1]; } return [x / (2 * k + 1), y / (2 * k + 1)]; }); }
export const NPTS = 220;
export function reamostra(P) {
  const Q = [...P, P[0]], L = [0];
  for (let i = 1; i < Q.length; i++) L.push(L[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
  const tot = L.at(-1), out = []; let j = 1;
  for (let i = 0; i < NPTS; i++) { const s = (tot * i) / NPTS; while (L[j] < s) j++; const v = (s - L[j - 1]) / (L[j] - L[j - 1] || 1); out.push([lerp(Q[j - 1][0], Q[j][0], v), lerp(Q[j - 1][1], Q[j][1], v)]); }
  let A = 0; for (let i = 0; i < NPTS; i++) { const p = out[i], q = out[(i + 1) % NPTS]; A += p[0] * q[1] - q[0] * p[1]; }
  if (A < 0) out.reverse();
  let k = 0, best = 1e9; out.forEach(([px, py], i) => { const dd = Math.abs(Math.atan2(py, px) + Math.PI / 2); if (dd < best) { best = dd; k = i; } });
  return [...out.slice(k), ...out.slice(0, k)];
}
export const circulo = (r = 0.62) => Array.from({ length: NPTS }, (_, i) => { const a = -Math.PI / 2 + (i / NPTS) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r]; });
export const mistura = (A, B, u) => A.map((p, i) => [lerp(p[0], B[i][0], u), lerp(p[1], B[i][1], u)]);
export const easeM = (u) => { const v = clamp((u * 12 - 1.5) / 9); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }; // ~cubic-bezier(.7,0,.3,1) com colchão

export async function carregar() {
  LOGO = await (await fetch('assets/marca/logo-data.json')).json();
  LOGO.maos2d = new Path2D(LOGO.maos); LOGO.maosP = parsePath(LOGO.maos);
  for (const p of LOGO.pessoas) { p.body2d = new Path2D(p.body); p.head2d = new Path2D(p.head); }
  QR = await (await fetch('assets/qr.json')).json();
  try { BOCA = await (await fetch('audio/vozes/boca.json')).json(); } catch { BOCA = {}; }
  PAL = await (await fetch('audio/vozes/palavras.json')).json();
}
