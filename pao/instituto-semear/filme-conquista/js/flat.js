// FLAT VECTOR · roteiro em ROTEIRO-VETOR.md. Tudo chapado, entradas elásticas, o objeto carrega o corte.
import { W, H, C, clamp, lerp, inv, E, pr, pop, sai, hs, fill, circ, rr, poly, caps, traco, curva, sq, estrela, coracao, casa,
  boneco, frasco, pessoinhaIcone, simbolo, maosDesenho, pessoinhaLogo, ordemCopa, FIM, nome, cta, qr, legenda, aceno, carregar } from './vetor.js';

let COPA = null;
const bg = (ctx, cor) => { ctx.fillStyle = cor; ctx.fillRect(0, 0, W, H); };
const brilho = (ctx, x, y, t, t0, r = 22, cor = C.branco) => { const e = inv(t0, t0 + 0.45, t); if (e <= 0 || e >= 1) return; const s = Math.sin(Math.PI * e); estrela(ctx, x, y, r * s, cor); estrela(ctx, x + r * 1.6, y - r * 1.1, r * 0.5 * s, cor); };
const tremor = (t, f = 9) => Math.sin(t * f * Math.PI * 2);
function pisca(t, per, fase = 0) { return ((t + fase) % per) > per - 0.12 ? 1 : 0; }
function onda(t, t0) { return t0 > t ? 0 : pop(t, t0, 0.32); }
function cobre(ctx, x, y, t, t0, t1, cor) { const e = E.in3(inv(t0, t1, t)); if (e > 0) circ(ctx, x, y, e * 2300, cor); }
function revela(ctx, x, y, t, t0, t1, cor) { const e = inv(t0, t1, t); if (e < 1) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(x, y, E.in3(e) * 2300, 0, Math.PI * 2, true); ctx.fillStyle = cor; ctx.fill('evenodd'); ctx.restore(); } }

// ------------------------------------------------------------------ 1 · 0–4,95 · a vacina
function cena1(ctx, t) {
  bg(ctx, C.amarelo);
  // prateleiras e caixas entram uma a uma
  [[150, 330], [150, 520]].forEach(([x, y], i) => { const e = pop(t, 0.5 + i * 0.08); rr(ctx, x, y, 420 * e, 16, 8, C.marrom); });
  [[170, 330, 90, 110, C.azul], [280, 330, 70, 80, C.branco], [370, 330, 110, 140, C.oliva], [180, 520, 120, 90, C.branco], [320, 520, 80, 130, C.azulE], [420, 520, 90, 70, C.marromC]]
    .forEach(([x, y, w, h, cor], i) => { const e = pop(t, 0.58 + i * 0.06); if (e > 0) sq(ctx, x + w / 2, y, 1, e, () => rr(ctx, -w / 2, -h, w, h, 10, cor)); });
  // "milhões de vidas": pessoinhas brotam em onda a partir do frasco
  for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) {
    const x = 90 + c * 125 + (r % 2) * 60, y = 120 + r * 120; if (x > 560 && x < 1260 && y > 200) continue; if (x < 600 && y > 260) continue;
    const t0 = 3.38 + Math.hypot(x - 1136, y - 700) * 0.0007 + hs(r, c) * 0.06, e = onda(t, t0);
    if (e > 0) sq(ctx, x, y + 20, e, e, () => pessoinhaIcone(ctx, 0, 0, 1.5, (r + c) % 2 ? C.branco : C.oliva, (r + c) % 2 ? C.marrom : C.branco));
  }
  // balão "doméstica": a casa da mãe
  const b = pop(t, 1.36) * sai(t, 2.15);
  if (b > 0) {
    circ(ctx, 700, 470, 14 * b, C.branco); circ(ctx, 650, 420, 22 * b, C.branco);
    sq(ctx, 560, 300, b, b, () => { circ(ctx, 0, 0, 110, C.branco); casa(ctx, 0, 40, 60, C.marromC, C.marrom, C.branco); });
  }
  // pesquisadora sobe por trás da bancada ("filha", 1,02)
  const sobe = pop(t, 1.0, 0.45), alcanca = pr(t, 1.95, 2.24, 'io2'), ergue = pop(t, 2.24, 0.5);
  const segura = t >= 2.24;
  const bD = segura ? lerp(0.75, 2.55, ergue) : lerp(0.12, 0.75, alcanca);
  const vx = 1170, vy = 860;
  // frasco cai: prepara, estica, achata, volta
  let fy = 860, fsx = 1, fsy = 1;
  if (t < 0.12) { fy = 230; fsy = 1 - 0.1 * pr(t, 0, 0.12); fsx = 1 + 0.08 * pr(t, 0, 0.12); }
  else if (t < 0.5) { const u = inv(0.12, 0.5, t); fy = lerp(230, 860, E.in2(u)); fsy = 1 + 0.2 * u; fsx = 1 - 0.12 * u; }
  else if (t < 0.9) { const u = inv(0.5, 0.9, t); const k = 1 - E.elast(u); fsy = 1 - 0.26 * k; fsx = 1 + 0.26 * k; }
  if (t < 0.5 && t > 0.12) { caps(ctx, vx - 24, fy - 260, vx - 24, fy - 200, 4, C.branco); caps(ctx, vx + 24, fy - 280, vx + 24, fy - 210, 4, C.branco); }
  boneco(ctx, 'pesquisadora', { x: 880, y: lerp(1180, 540, sobe), s: 1.28, bracoD: bD, tilt: aceno('pesquisadora', t) + (t < 1.8 ? 0.08 : 0), gx: t < 2.24 ? 0.8 : 0.6, gy: t < 2.7 ? 0.6 : -0.4, sobr: ergue * 0.6,
    pisca: pisca(t, 2.7), segura: segura ? (c) => frasco(c, 0, 70, 0.85) : null });
  // bancada na frente
  rr(ctx, -20, 860, 1960, 34, 12, C.creme); rr(ctx, -20, 890, 1960, 200, 0, '#E7A900');
  fill(ctx, 'rgba(60,30,10,0.14)', () => ctx.ellipse(vx, 872, 70 * fsx, 10, 0, 0, Math.PI * 2));
  if (!segura) frasco(ctx, vx, fy, 1.25, fsx, fsy);
  brilho(ctx, 1260, 520, t, 2.68, 26);
  if (t > 0.5 && t < 0.9) for (const s of [-1, 1]) caps(ctx, vx + s * 70, 820, vx + s * 100, 800, 4, C.branco);
  // o líquido vira o círculo que cobre a tela (forma carrega o corte)
  cobre(ctx, 1250, 380, t, 4.45, 4.95, '#F6E7B5');
  legenda(ctx, t, 2.0, 4.6, 'Pesquisadora', 'ex-bolsista');
}

// ------------------------------------------------------------------ 2 · 4,95–11,3 · da roça ao escritório
function roca(ctx, t) {
  bg(ctx, '#F6E7B5');
  const sol = pop(t, 5.0, 0.5);
  if (sol > 0) { ctx.save(); ctx.translate(1560, 250); ctx.rotate(t * 0.4); for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); caps(ctx, 0, 140 * sol, 0, 175 * sol, 9, C.amarelo); } ctx.restore(); circ(ctx, 1560, 250, 110 * sol, C.amarelo); }
  const m1 = pop(t, 4.98, 0.5), m2 = pop(t, 5.06, 0.5);
  fill(ctx, C.oliva, () => ctx.ellipse(600, 1160 + (1 - m1) * 500, 1150, 430, 0, 0, Math.PI * 2));
  fill(ctx, C.olivaE, () => ctx.ellipse(1550, 1230 + (1 - m2) * 500, 900, 400, 0, 0, Math.PI * 2));
  const ca = pop(t, 5.15); if (ca > 0) sq(ctx, 1500, 840, ca, ca, () => casa(ctx, 0, -60, 95, C.branco, C.marrom, C.marromC));
  // mudas brotam ("roça", 7,55)
  for (let i = 0; i < 9; i++) { const x = 160 + i * 120, y = 880 + Math.sin(i) * 14, e = pop(t, 7.38 + i * 0.035, 0.3);
    if (e > 0) sq(ctx, x, y, e, e, () => { caps(ctx, 0, 0, 0, -36, 5, C.olivaE); fill(ctx, '#a9b94a', () => ctx.ellipse(-16, -40, 18, 9, -0.6, 0, Math.PI * 2)); fill(ctx, '#a9b94a', () => ctx.ellipse(16, -46, 18, 9, 0.6, 0, Math.PI * 2)); }); }
  // pai, mãe e o menino
  const pai = pop(t, 5.29), mae = pop(t, 5.45), men = pop(t, 5.89);
  const livroCai = pr(t, 6.25, 6.7, 'in2'), enxada = pop(t, 6.93);
  if (pai > 0) boneco(ctx, 'pai', { x: 660, y: 560, s: 0.85 * pai, sy: pai, inteiro: true, bracoD: 0.2, pisca: pisca(t, 2.3), gx: 0.5 });
  if (mae > 0) boneco(ctx, 'mae', { x: 1060, y: 575, s: 0.8 * mae, inteiro: true, bracoE: 0.2, pisca: pisca(t, 2.6, 1), gx: -0.5 });
  if (men > 0) {
    const segura = t < 6.25 ? (c) => { rr(c, -30, -20, 60, 44, 6, C.azul); rr(c, -2, -20, 4, 44, 2, C.azulE); }
      : t >= 6.93 ? (c) => { c.save(); c.rotate(-0.5); caps(c, 0, 40, 0, -150, 6, C.marrom); rr(c, -26, -168, 52, 22, 6, '#8a8f93'); c.restore(); } : null;
    boneco(ctx, 'menino', { x: 860, y: 690, s: 0.55 * men, inteiro: true, bracoD: t >= 6.93 ? 0.9 : 0.6, tilt: t > 6.1 ? 0.12 : 0, gy: t > 6.1 ? 0.8 : 0, sobr: t > 6.1 ? -0.4 : 0, sorriso: t > 6.1 ? 12 : 18, pisca: pisca(t, 2.2, 0.5), segura });
    if (t >= 6.25 && t < 6.9) sq(ctx, 940, lerp(780, 880, livroCai), 1, 1, () => rr(ctx, -30, -22, 60, 44, 6, C.azul), livroCai * 1.2);
    if (t >= 6.7 && t < 6.93) rr(ctx, 910, 858, 60, 30, 6, C.azul);
  }
}
function escritorio(ctx, t) {
  bg(ctx, C.azul);
  rr(ctx, 160, 120, 300, 220, 14, C.azulE); rr(ctx, 186, 146, 248, 168, 8, '#9cc3cf');
  rr(ctx, 1460, 150, 200, 200, 14, C.azulE);
  // calendário: vira três folhas em "todos os dias"
  const cal = pop(t, 10.3);
  if (cal > 0) sq(ctx, 1560, 250, cal, cal, () => {
    rr(ctx, -80, -80, 160, 170, 16, C.branco); rr(ctx, -80, -80, 160, 46, 16, C.marrom);
    const n = t < 10.4 ? 1 : t < 10.6 ? 2 : 3, fl = [10.4, 10.6, 10.8].map((a) => inv(a - 0.08, a, t)).find((v) => v > 0 && v < 1);
    ctx.fillStyle = C.tinta; ctx.font = '700 70px P'; ctx.textAlign = 'center'; ctx.save(); if (fl) ctx.scale(1, 1 - Math.sin(Math.PI * fl) * 0.8); ctx.fillText(String(n), 0, 62); ctx.restore();
  });
  const sobe = pop(t, 8.31, 0.45);
  const toque = t > 8.95 && t < 9.08 ? 1 : 0;
  boneco(ctx, 'advogado', { x: 1180, y: lerp(1150, 520, sobe), s: 1.2, bracoE: lerp(0.12, 0.95, pr(t, 8.75, 8.95)) - toque * 0.08, tilt: aceno('advogado', t), gx: t > 9.69 ? -0.8 : 0, pisca: pisca(t, 2.8), sobr: 0.3 });
  // os pais sentam do outro lado ("ajudo eles", 9,69)
  const p1 = pop(t, 9.69), p2 = pop(t, 9.8);
  if (p1 > 0) boneco(ctx, 'pai', { x: 240, y: lerp(1200, 690, p1), s: 0.9, gx: 0.8, pisca: pisca(t, 2.4) });
  if (p2 > 0) boneco(ctx, 'mae', { x: 500, y: lerp(1200, 700, p2), s: 0.86, gx: 0.8, pisca: pisca(t, 2.9, 1) });
  // mesa
  rr(ctx, -20, 860, 1960, 30, 10, C.marromC); rr(ctx, -20, 886, 1960, 220, 0, C.marrom);
  // documento pousa (8,7), o dedo bate (9,0), o visto se desenha
  const voa = pr(t, 10.75, 11.3, 'in3');
  if (t >= 8.4) {
    const desce = inv(8.4, 8.7, t), dy = t < 8.7 ? lerp(-500, 0, E.in2(desce)) : 0, squ = t >= 8.7 && t < 8.9 ? 1 - E.elast(inv(8.7, 8.9, t)) : 0;
    const x = lerp(930, 1100, voa), y = lerp(860, 560, voa) + dy, k = 1 + voa * 1.5;
    sq(ctx, x, y, k * (1 + 0.2 * squ), k * (1 - 0.3 * squ), () => {
      poly(ctx, [[-150, -16], [150, -16], [170, 16], [-170, 16]], C.branco);
      for (let i = 0; i < 3; i++) rr(ctx, -110 + i * 6, -8 + i * 0, 200 - i * 50, 0, 0, C.branco);
      traco(ctx, [[-30, 2], [-8, 10], [40, -12]], 7, C.oliva, pr(t, 9.75, 10.2));
    }, voa * 0.4);
  }
  const cobreF = E.in3(inv(10.95, 11.3, t));
  if (cobreF > 0) { const w = lerp(340, 2400, cobreF), h = lerp(60, 1500, cobreF); rr(ctx, 1100 - w / 2, 560 - h / 2, w, h, 40, C.branco); }
  const cor = pop(t, 10.22); if (cor > 0) sq(ctx, 380, 400, cor, cor, () => coracao(ctx, 0, 0, 46, '#c0262f'));
  brilho(ctx, 1000, 790, t, 9.0, 16);
}
function cena2(ctx, t) {
  if (t < 7.86) roca(ctx, t); else escritorio(ctx, t);
  // a folha atravessa a tela e vira o escritório (papel, 7,8)
  const u = pr(t, 7.6, 8.1, 'io2');
  if (u > 0 && u < 1) sq(ctx, lerp(-1500, 3400, u), 540, 1, 1, () => { rr(ctx, -1300, -800, 2600, 1600, 40, C.branco); for (let i = 0; i < 6; i++) rr(ctx, -900, -400 + i * 150, 1400 - (i % 3) * 300, 24, 12, '#e6e0d2'); }, 0.1);
  if (t < 7.86) revela(ctx, 1250, 380, t, 4.95, 5.25, '#F6E7B5');
  legenda(ctx, t, 5.2, 10.7, 'Advogado', 'ex-bolsista');
}

// ------------------------------------------------------------------ 3 · 11,3–15,85 · do ônibus à startup
function cidade(ctx, t) {
  bg(ctx, C.petroleo);
  for (let i = 0; i < 24; i++) circ(ctx, hs(i, 1) * W, hs(i, 2) * 420, 2 + hs(i, 3) * 2, 'rgba(241,233,218,0.6)');
  [[60, 260, C.azulE], [330, 380, C.azulE], [600, 300, C.azulE], [900, 420, C.azulE], [1200, 280, C.azulE], [1480, 360, C.azulE], [1730, 300, C.azulE],
   [180, 200, C.azul], [460, 300, C.oliva], [760, 220, C.azul], [1060, 340, C.olivaE], [1340, 240, C.azul], [1620, 280, C.oliva]]
    .forEach(([x, h, cor], i) => { const e = pop(t, 11.35 + i * 0.03, 0.4); if (e <= 0) return; const hh = h * e;
      rr(ctx, x, 860 - hh, 200, hh, 10, cor);
      if (e > 0.9) for (let r = 0; r < Math.floor(h / 60); r++) for (let c = 0; c < 3; c++) if (hs(i, r, c) > 0.35) rr(ctx, x + 30 + c * 55, 860 - h + 30 + r * 60, 26, 30, 4, hs(i, r, c, 9) > 0.5 ? C.amarelo : '#2f5f72'); });
  rr(ctx, 0, 860, W, 220, 0, '#26323a');
  for (let i = 0; i < 12; i++) rr(ctx, ((i * 220 - t * 600) % 2400 + 2400) % 2400 - 200, 960, 110, 12, 6, '#5b6a73');
}
function onibus(ctx, x, y, t, parado) {
  const bob = parado ? 0 : Math.sin(t * 22) * 4;
  ctx.save(); ctx.translate(x, y + bob);
  rr(ctx, -300, -120, 600, 210, 40, C.branco); rr(ctx, -300, 30, 600, 26, 0, C.azul);
  for (let i = 0; i < 4; i++) rr(ctx, -260 + i * 120, -90, 96, 86, 16, '#9cc3cf');
  ctx.restore();
  for (const wx of [-190, 190]) { circ(ctx, x + wx, y + 96, 46, C.tinta); circ(ctx, x + wx, y + 96, 18, '#8a8f93'); ctx.save(); ctx.translate(x + wx, y + 96); ctx.rotate(parado ? 0 : t * 14); rr(ctx, -4, -40, 8, 80, 4, '#5b6a73'); ctx.restore(); }
}
function cena3(ctx, t) {
  if (t < 13.25) {
    cidade(ctx, t);
    const para = t >= 13.0, bx = t < 13.0 ? lerp(420, 860, E.out2(inv(11.3, 13.0, t))) : 860, sqz = para ? 1 - E.elast(inv(13.0, 13.3, t)) : 0;
    if (!para) for (let i = 0; i < 3; i++) caps(ctx, bx - 360 - i * 40, 700 + i * 50, bx - 460 - i * 60, 700 + i * 50, 5, 'rgba(241,233,218,0.5)');
    sq(ctx, bx, 760, 1 + 0.06 * sqz, 1 - 0.06 * sqz, () => onibus(ctx, 0, 0, t, para));
    // ela cansada na janela
    ctx.save(); ctx.beginPath(); ctx.roundRect(bx + 100, 670, 96, 86, 16); ctx.clip();
    boneco(ctx, 'bolsista', { x: bx + 148, y: 740, s: 0.34, tilt: 0.15 + Math.sin(t * 22) * 0.02, pisca: t < 12.9 ? (((t * 1.3) % 1) > 0.6 ? 1 : 0) : 0, sorriso: 10, gy: 0.6 });
    ctx.restore();
    // relógio gira ("horas", 12,22)
    const rel = pop(t, 12.22) * sai(t, 13.1);
    if (rel > 0) sq(ctx, 1500, 260, rel, rel, () => { circ(ctx, 0, 0, 100, C.branco); circ(ctx, 0, 0, 84, C.creme); const a = (t - 12.22) * 14;
      ctx.save(); ctx.rotate(a); rr(ctx, -5, -70, 10, 74, 5, C.tinta); ctx.restore(); ctx.save(); ctx.rotate(a / 6); rr(ctx, -6, -48, 12, 52, 6, C.marrom); ctx.restore(); circ(ctx, 0, 0, 10, C.tinta); });
    brilho(ctx, bx + 210, 640, t, 13.0, 22, C.amarelo);
    cobre(ctx, bx + 148, 713, t, 13.0, 13.4, C.oliva); // a janela abre e vira a cena seguinte
    // a folha voadora da cena 2 encolhe até a lataria do ônibus
    const enc = E.out3(inv(11.3, 11.6, t));
    if (enc < 1) { const x0 = lerp(-200, bx - 300, enc), x1 = lerp(W + 200, bx + 300, enc), y0 = lerp(-200, 640, enc), y1 = lerp(H + 200, 850, enc); ctx.save(); ctx.globalAlpha = 1 - enc * 0.4; rr(ctx, x0, y0, x1 - x0, y1 - y0, 40, C.branco); ctx.restore(); }
    return;
  }
  // startup: ela na frente do mapa
  bg(ctx, C.oliva);
  revela(ctx, 1010, 713, t, 13.25, 13.45, C.oliva);
  rr(ctx, 940, 140, 900, 600, 30, C.petroleo);
  ctx.save(); ctx.beginPath(); ctx.roundRect(940, 140, 900, 600, 30); ctx.clip();
  for (let i = 0; i < 8; i++) { rr(ctx, 940 + i * 120, 140, 6, 600, 3, '#1b4a5c'); rr(ctx, 940, 140 + i * 90, 900, 6, 3, '#1b4a5c'); }
  const rota = [[1010, 660], [1120, 560], [1250, 600], [1380, 430], [1520, 470], [1660, 280], [1780, 230]];
  traco(ctx, rota, 14, C.amarelo, pr(t, 13.75, 14.6));
  const pinos = [rota[0], rota[3], rota[6]];
  pinos.forEach(([x, y], i) => { const e = pop(t, 14.28 + i * 0.08); if (e > 0) sq(ctx, x, y, e, e, () => { circ(ctx, 0, -40, 26, C.branco); poly(ctx, [[-20, -26], [20, -26], [0, 6]], C.branco); circ(ctx, 0, -40, 10, '#c0262f'); }); });
  pinos.forEach(([x, y], i) => { const e = pop(t, 14.56 + i * 0.07); if (e > 0) sq(ctx, x + 50, y - 10, e, e, () => pessoinhaIcone(ctx, 0, 0, 1.3, C.oliva, C.amarelo)); });
  for (let i = 0; i < 3; i++) { const u = (t - 15.18 - i * 0.18) * 0.55; if (u <= 0) continue; const k = Math.min(rota.length - 1.001, u * (rota.length - 1)), j = Math.floor(k), f = k - j;
    const x = lerp(rota[j][0], rota[j + 1][0], f), y = lerp(rota[j][1], rota[j + 1][1], f); rr(ctx, x - 26, y - 16, 52, 32, 8, C.branco); rr(ctx, x - 26, y + 4, 52, 6, 0, C.azul); }
  ctx.restore();
  const sobe = pop(t, 13.45, 0.45);
  boneco(ctx, 'bolsista', { x: 560, y: lerp(1150, 560, sobe), s: 1.15, bracoD: lerp(0.12, 2.1, pop(t, 14.2, 0.4)), tilt: aceno('bolsista', t) + 0.05, gx: t > 14.2 ? 0.8 : 0, sobr: 0.5, sorriso: 26, pisca: pisca(t, 3.1) });
  rr(ctx, -20, 900, 1960, 200, 0, C.olivaE);
  legenda(ctx, t, 13.6, 15.75, 'Bolsista', 'startup de transporte');
}

// ------------------------------------------------------------------ 4 · 15,85–16,2 · volta rápida aos três
function tres(ctx, t, saida = 0) {
  const P = [['pesquisadora', C.azul, 120], ['bolsista', C.oliva, 700], ['advogado', C.amarelo, 1280]];
  P.forEach(([who, cor, x], i) => {
    const e = pop(t, 15.85 + i * 0.025, 0.16);
    if (e <= 0) return;
    ctx.save(); ctx.translate(x + 260, 540); ctx.scale(e, e); ctx.translate(-(x + 260), -540);
    ctx.beginPath(); ctx.roundRect(x, 150, 520, 780, 40); ctx.fillStyle = cor; ctx.fill(); ctx.clip();
    boneco(ctx, who, { x: x + 260, y: 520, s: 1.05, pisca: pisca(t, 2.5, i), sorriso: 26 });
    ctx.restore();
  });
}
function cena4(ctx, t) {
  bg(ctx, C.creme);
  tres(ctx, t);
  cobre(ctx, 1540, 540, t, 16.06, 16.2, C.amarelo);
}

// ------------------------------------------------------------------ 5 · 16,2–18,8 · o empurrãozinho
function maoGrande(ctx, x, y, s, cor = C.marrom) {
  sq(ctx, x, y, s, s, () => { rr(ctx, -120, -70, 150, 140, 50, cor); for (let i = 0; i < 4; i++) caps(ctx, 10, -54 + i * 36, 80, -60 + i * 38, 17, cor); caps(ctx, -40, -66, 0, -116, 20, cor); });
}
function cena5(ctx, t) {
  bg(ctx, C.amarelo);
  revela(ctx, 1540, 540, t, 16.2, 16.4, C.amarelo);
  const passos = 4;
  for (let i = 0; i < passos; i++) { const e = pop(t, 16.25 + i * 0.05); if (e > 0) rr(ctx, 520 + i * 300, 940 - i * 130 - 40 * e, 300, 1200, 18, i % 2 ? C.marromC : C.marrom); }
  // a mão do Semear entra ("Semear", 16,36) e empurra ("empurrãozinho", 16,98)
  const entra = pop(t, 16.36, 0.4), empurra = pr(t, 16.9, 17.05, 'out3') * sai(t, 17.25, 0.3);
  maoGrande(ctx, lerp(-200, 380, entra) + empurra * 120, 780, 1.1);
  // ele sobe aos pulos
  const pulos = [17.0, 17.35, 17.7];
  let deg = 0, ar = 0;
  pulos.forEach((p, i) => { if (t >= p) { const u = inv(p, p + 0.3, t); deg = i + E.io2(u); ar = Math.sin(Math.PI * u); } });
  const x = 670 + deg * 300, yb = 900 - deg * 130 - ar * 120;
  const pouso = pulos.map((p) => inv(p + 0.3, p + 0.42, t)).find((v) => v > 0 && v < 1) ?? 0;
  const sqz = Math.sin(Math.PI * pouso) * 0.18;
  const vitoria = pop(t, 18.02, 0.4);
  boneco(ctx, 'advogado', { x, y: yb - 374 * 0.66, s: 0.66, sx: 1 + sqz, sy: 1 - sqz, inteiro: true, pulo: ar, bracoE: lerp(0.3, 2.7, vitoria) + ar * 0.8, bracoD: lerp(0.3, 2.7, vitoria) + ar * 0.8, tilt: aceno('advogado', t), sorriso: 26, sobr: 0.5 });
  if (t > 18.02) { brilho(ctx, x - 90, yb - 360, t, 18.05, 22); brilho(ctx, x + 110, yb - 330, t, 18.15, 18); }
}

// ------------------------------------------------------------------ 6 · 18,8–22,25 · potencial e a porta
function cena6(ctx, t) {
  bg(ctx, C.olivaC);
  const porta = pop(t, 20.78, 0.45), abre = pr(t, 21.85, 22.15, 'in2');
  if (porta > 0) sq(ctx, 1450, 900, porta, porta, () => {
    rr(ctx, -220, -700, 440, 700, 30, C.creme);
    if (abre > 0) rr(ctx, -190, -670, 380, 670, 20, '#FFE6A0');
    sq(ctx, -190, 0, 1 - abre * 0.85, 1, () => { rr(ctx, 0, -670, 380, 670, 20, C.marrom); circ(ctx, 320, -330, 18, C.amarelo); }); // gira na dobradiça
    const cad = pop(t, 21.26) * (1 - abre); if (cad > 0) sq(ctx, 300, -260, cad, cad, () => { ctx.save(); ctx.lineWidth = 12; ctx.strokeStyle = '#8a8f93'; ctx.beginPath(); ctx.arc(0, -30, 28, Math.PI, 0); ctx.stroke(); ctx.restore(); rr(ctx, -40, -30, 80, 66, 12, '#b9bcbf'); });
  });
  const sobe = pop(t, 18.8, 0.42);
  const glow = pop(t, 19.74, 0.5);
  boneco(ctx, 'pesquisadora', { x: 680, y: lerp(1150, 580, sobe), s: 1.15, bracoD: 2.2, tilt: aceno('pesquisadora', t), gx: t > 20.8 ? 0.9 : 0.3, gy: -0.3, sobr: t > 20.8 ? -0.2 : 0.5, sorriso: t > 20.8 ? 16 : 24, pisca: pisca(t, 2.7),
    segura: (c) => { if (glow > 0) for (let i = 0; i < 3; i++) { const r = ((t * 0.9 + i / 3) % 1); c.save(); c.globalAlpha = (1 - r) * glow; c.lineWidth = 6; c.strokeStyle = C.amarelo; c.beginPath(); c.arc(0, -60, 40 + r * 90, 0, Math.PI * 2); c.stroke(); c.restore(); }
      fill(c, C.marrom, () => c.ellipse(0, -56, 22, 30, 0.3, 0, Math.PI * 2)); caps(c, 4, -86, 12, -104, 5, C.olivaE); } });
  brilho(ctx, 1000, 330, t, 19.78, 24, C.branco);
  cobre(ctx, 1450, 560, t, 21.95, 22.25, '#FFE6A0'); // a luz da porta vira a próxima cena
}

// ------------------------------------------------------------------ 7 · 22,25–25,2 · não abrir mão do sonho
function cena7(ctx, t) {
  bg(ctx, C.azul);
  [[300, 220, 1], [1500, 160, 0.8], [900, 120, 0.6], [1700, 420, 0.7]].forEach(([x, y, s], i) => { const dx = ((t * 30 * (i + 1)) % 200); fill(ctx, C.creme, () => { ctx.ellipse(x - dx, y, 110 * s, 46 * s, 0, 0, Math.PI * 2); ctx.ellipse(x - dx + 60 * s, y - 30 * s, 70 * s, 50 * s, 0, 0, Math.PI * 2); }); });
  fill(ctx, C.oliva, () => ctx.ellipse(960, 1250, 1400, 330, 0, 0, Math.PI * 2));
  const vento = pr(t, 23.6, 23.9) * (1 - pr(t, 24.4, 24.7));
  const sx = 1220 - vento * 120 + Math.sin(t * 2.2) * 20, sy = 300 + Math.cos(t * 1.8) * 16 - vento * 30;
  const o = boneco(ctx, 'bolsista', { x: 720 + vento * 20, y: 980 - 374 * 0.78, s: 0.78, inteiro: true, bracoD: 2.4 - vento * 0.3, bracoE: 0.2, tilt: aceno('bolsista', t) - vento * 0.1, gx: 0.6, gy: -0.6, sorriso: 26, sobr: 0.4, pisca: pisca(t, 3.0) });
  const hx = 720 + vento * 20 + o.mD[0] * 0.78, hy = 980 - 374 * 0.78 + o.mD[1] * 0.78;
  const corda = curva([hx, hy], [lerp(hx, sx, 0.5) + vento * 60, lerp(hy, sy, 0.5) + 60], [sx, sy + 70]);
  traco(ctx, corda, 5, C.branco);
  // as mãos do Semear seguram o barbante ("Semear", 22,45); apertam em "mão" (24,31)
  const m = pop(t, 22.45, 0.5), aperta = Math.sin(Math.PI * inv(24.3, 24.5, t)) * 0.08;
  if (m > 0) { const mid = corda[20]; const S = simbolo(250 * (1 - aperta), mid[0], mid[1] + 120 + (1 - m) * 500); maosDesenho(ctx, S, C.marrom, 1); }
  if (vento > 0) for (let i = 0; i < 5; i++) { const x = W - ((t - 23.6) * 2400 + i * 300) % 2200; caps(ctx, x, 200 + i * 120, x + 160, 200 + i * 120, 6, 'rgba(251,247,239,0.7)'); }
  const sonho = pop(t, 24.85, 0.5);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(t * 2) * 0.08 - vento * 0.3);
  if (sonho > 0) { ctx.save(); ctx.rotate(t * 0.8); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); caps(ctx, 0, 110 * sonho, 0, 150 * sonho, 7, '#FFE6A0'); } ctx.restore(); }
  estrela(ctx, 0, 0, 80 * (1 + 0.2 * sonho), C.amarelo, 5, 0.48); ctx.restore();
  brilho(ctx, sx + 90, sy - 70, t, 24.9, 22);
  revela(ctx, 1450, 560, t, 22.25, 22.55, '#FFE6A0');
}

// ------------------------------------------------------------------ 8 · 25,2–30 · a copa e a assinatura
const INI = { w: 520, bx: 960, by: 1190 };
const OBJ = [ // de onde sai cada objeto (os três que viram as primeiras pessoinhas)
  { who: 'pesquisadora', x: 420, desenha: (c) => frasco(c, 0, 60, 0.6) },
  { who: 'bolsista', x: 960, desenha: (c) => { rr(c, -70, -30, 140, 60, 16, C.branco); rr(c, -70, 10, 140, 10, 0, C.azul); circ(c, -40, 36, 14, C.tinta); circ(c, 40, 36, 14, C.tinta); } },
  { who: 'advogado', x: 1500, desenha: (c) => { rr(c, -50, -64, 100, 128, 10, C.branco); traco(c, [[-20, 0], [-4, 14], [26, -16]], 8, C.oliva); } },
];
function cena8(ctx, t) {
  bg(ctx, C.petroleo);
  const fora = E.in3(inv(26.6, 27.0, t));
  OBJ.forEach((o, i) => {
    const e = pop(t, 25.2 + i * 0.06, 0.35); if (e <= 0) return;
    const dx = (i - 1) * fora * 1400, dy = i === 1 ? fora * 900 : 0;
    boneco(ctx, o.who, { x: o.x + dx, y: lerp(1200, 600, e) + dy, s: 0.95, pisca: pisca(t, 2.6, i), sorriso: 26, gy: -0.6, sobr: 0.4, tilt: Math.sin(t * 3 + i) * 0.03 });
  });
  // fundo vira preto a partir das mãos
  cobre(ctx, 960, 900, t, 26.6, 26.95, C.preto);
  // mãos do Semear sobem ("conquista") e viajam até a assinatura
  const sobe = pop(t, 25.9, 0.5), viaja = E.io3(inv(26.6, 27.45, t));
  const S = simbolo(lerp(INI.w, FIM.w, viaja), lerp(INI.bx, FIM.bx, viaja), lerp(INI.by, FIM.by, viaja) + (1 - Math.min(1, sobe)) * 500);
  maosDesenho(ctx, S, C.marrom, 1);
  if (!COPA) COPA = ordemCopa();
  // os três objetos sobem ("próxima") e voam pra copa (27,0), viram as primeiras pessoinhas
  OBJ.forEach((o, i) => {
    const e0 = pop(t, 25.2 + i * 0.06, 0.35); if (e0 <= 0) return;
    const sobeO = pr(t, 25.53, 25.9, 'io2'), voo = pr(t, 27.0 + i * 0.08, 27.42 + i * 0.08, 'io2');
    const idx = COPA.primeiras[i], p = S.pes[idx];
    const x0 = o.x + (i - 1) * fora * 300, y0 = lerp(300, 200, sobeO) + Math.sin(t * 3 + i) * 8;
    if (voo <= 0) { sq(ctx, x0, y0, e0, e0, () => o.desenha(ctx)); return; }
    const mx = (x0 + p.X) / 2, my = Math.min(y0, p.Y) - 180, q = (u) => [(1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * p.X, (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * p.Y];
    if (voo < 1) { for (let k = 0; k < 12; k++) { const pt = q(voo * k / 12); circ(ctx, pt[0], pt[1], 3, C.amarelo); } const [x, y] = q(voo); sq(ctx, x, y, 1 - voo * 0.6, 1 - voo * 0.6, () => o.desenha(ctx), voo * 3); }
    if (voo > 0.75) pessoinhaLogo(ctx, S, idx, { dx: 0, dy: 0, s: E.back(inv(0.75, 1, voo), 2.2) });
  });
  // a copa se completa de baixo pra cima; a última pousa em 28,0 ("você")
  COPA.ord.forEach((i, n) => {
    if (COPA.primeiras.includes(i)) return;
    const t0 = i === COPA.ultima ? 27.88 : lerp(27.35, 27.75, n / COPA.ord.length), e = inv(t0, t0 + 0.16, t);
    if (e > 0) pessoinhaLogo(ctx, S, i, { dx: 0, dy: 0, s: E.back(e, 2.4) });
  });
  if (t > 28.0) { const p = S.pes[COPA.ultima]; brilho(ctx, p.X + 44, p.Y - 40, t, 28.0, 16, C.amarelo); }
  nome(ctx, pr(t, 27.7, 28.1, 'out3'));
  cta(ctx, pr(t, 27.95, 28.35, 'out3'));
}

// ------------------------------------------------------------------ montagem
export async function init() { await carregar(); }
export function render(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  if (t < 4.95) cena1(ctx, t); else if (t < 11.3) cena2(ctx, t); else if (t < 15.85) cena3(ctx, t); else if (t < 16.2) cena4(ctx, t);
  else if (t < 18.8) cena5(ctx, t); else if (t < 22.25) cena6(ctx, t); else if (t < 25.2) cena7(ctx, t); else cena8(ctx, t);
  const g = E.io3(inv(26.9, 27.9, t));
  qr(ctx, lerp(1756, 1730, g), lerp(140, 190, g), Math.round(lerp(180, 250, g)));
  const p = pr(t, 29.5, 29.96, 'io2'); if (p > 0) { ctx.fillStyle = `rgba(0,0,0,${p})`; ctx.fillRect(0, 0, W, H); }
}
