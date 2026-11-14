// SHAPE MORPH · roteiro em ROTEIRO-VETOR.md. Uma forma só vira a próxima (sempre passando por um círculo),
// cada pouso cai numa palavra da fala, e o campo de cor troca a cada pouso. Personagens só em silhueta.
import { W, H, C, clamp, lerp, inv, E, pr, pop, sai, hs, fill, circ, rr, poly, caps, traco, estrela, coracao, casa, boneco,
  simbolo, maosDesenho, pessoinhaLogo, ordemCopa, FIM, nome, cta, qr, legenda, LOGO, silhueta, circulo, mistura, easeM, NPTS, carregar } from './vetor.js';

let F = {}, PAPEL = null, COPA = null;
const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };

// formas (desenhadas em unidades, ±1)
const FORMAS = {
  gota: (m) => circ(m, 0, 0, 0.5, '#000'),
  frasco: (m) => { rr(m, -0.34, -0.55, 0.68, 1.25, 0.12, '#000'); rr(m, -0.26, -0.82, 0.52, 0.32, 0.06, '#000'); },
  pesquisadora: (m) => boneco(m, 'pesquisadora', { x: 0, y: -0.42, s: 1 / 280 }),
  advogado: (m) => boneco(m, 'advogado', { x: 0, y: -0.42, s: 1 / 280 }),
  bolsista: (m) => boneco(m, 'bolsista', { x: 0, y: -0.36, s: 1 / 290 }),
  casa: (m) => casa(m, 0, 0.3, 0.75, '#000', '#000', null),
  coracao: (m) => coracao(m, 0, 0.12, 0.62, '#000'),
  pais: (m) => { boneco(m, 'pai', { x: -0.42, y: -0.3, s: 1 / 360 }); boneco(m, 'mae', { x: 0.42, y: -0.28, s: 1 / 370 }); },
  muda: (m) => { caps(m, 0, 0.7, 0, -0.42, 0.08, '#000'); fill(m, '#000', () => m.ellipse(-0.3, -0.18, 0.36, 0.16, -0.5, 0, Math.PI * 2)); fill(m, '#000', () => m.ellipse(0.3, -0.32, 0.36, 0.16, 0.5, 0, Math.PI * 2)); fill(m, '#000', () => m.ellipse(0, 0.74, 0.62, 0.15, 0, 0, Math.PI * 2)); },
  doc: (m) => poly(m, [[-0.55, -0.75], [0.3, -0.75], [0.55, -0.5], [0.55, 0.75], [-0.55, 0.75]], '#000'),
  calendario: (m) => { rr(m, -0.7, -0.55, 1.4, 1.2, 0.12, '#000'); caps(m, -0.35, -0.78, -0.35, -0.45, 0.08, '#000'); caps(m, 0.35, -0.78, 0.35, -0.45, 0.08, '#000'); },
  onibus: (m) => { rr(m, -1.0, -0.45, 2.0, 0.8, 0.18, '#000'); circ(m, -0.55, 0.38, 0.21, '#000'); circ(m, 0.55, 0.38, 0.21, '#000'); },
  relogio: (m) => { circ(m, 0, 0.06, 0.74, '#000'); rr(m, -0.13, -0.88, 0.26, 0.28, 0.05, '#000'); caps(m, -0.45, 0.62, -0.6, 0.85, 0.07, '#000'); caps(m, 0.45, 0.62, 0.6, 0.85, 0.07, '#000'); },
  pino: (m) => { circ(m, 0, -0.25, 0.55, '#000'); poly(m, [[-0.46, -0.02], [0.46, -0.02], [0, 0.9]], '#000'); },
  tres: (m) => { boneco(m, 'pesquisadora', { x: -0.72, y: -0.2, s: 1 / 430 }); boneco(m, 'advogado', { x: 0.72, y: -0.2, s: 1 / 430 }); boneco(m, 'bolsista', { x: 0, y: -0.14, s: 1 / 430 }); },
  mao: (m) => { rr(m, -0.42, -0.15, 0.84, 0.8, 0.3, '#000'); [[-0.3, -0.72], [-0.1, -0.84], [0.1, -0.82], [0.3, -0.68]].forEach(([x, y]) => caps(m, x, -0.1, x, y, 0.11, '#000')); caps(m, -0.36, 0.28, -0.74, -0.08, 0.12, '#000'); },
  seta: (m) => { rr(m, -0.18, -0.12, 0.36, 0.97, 0.06, '#000'); poly(m, [[-0.6, -0.05], [0.6, -0.05], [0, -0.85]], '#000'); },
  semente: (m) => { fill(m, '#000', () => m.ellipse(0, 0.12, 0.42, 0.6, 0.35, 0, Math.PI * 2)); caps(m, 0.08, -0.4, 0.3, -0.85, 0.07, '#000'); fill(m, '#000', () => m.ellipse(0.42, -0.86, 0.2, 0.09, -0.4, 0, Math.PI * 2)); },
  porta: (m) => fill(m, '#000', () => { m.moveTo(-0.5, 0.88); m.lineTo(-0.5, -0.38); m.arc(0, -0.38, 0.5, Math.PI, 0); m.lineTo(0.5, 0.88); m.closePath(); }),
  estrela: (m) => estrela(m, 0, 0.06, 0.92, '#000', 5, 0.45),
  circulo: (m) => circ(m, 0, 0, 0.62, '#000'),
  maos: (m) => { const MB = LOGO.maosBox, k = 2.0 / (MB.x1 - MB.x0); m.save(); m.scale(k, k); m.translate(-MB.cx, -(MB.y0 + MB.y1) / 2); m.fillStyle = '#000'; m.fill(LOGO.maos2d); m.restore(); },
};

// a corrente de formas: pouso (palavra da fala), forma, posição, tamanho (px por unidade), campo de cor, cor da forma
const K = [
  { t: 0.0, f: 'gota', x: 960, y: 140, sc: 70, fundo: C.creme, cor: C.tinta },
  { t: 0.5, f: 'frasco', x: 960, y: 560, sc: 300, fundo: C.creme, cor: C.tinta, D: 0.16 },
  { t: 1.02, f: 'pesquisadora', y: 580, sc: 340, fundo: C.amarelo },
  { t: 1.4, f: 'casa', sc: 290, fundo: C.marromC, D: 0.3 },        // "doméstica"
  { t: 2.7, f: 'frasco', sc: 300, fundo: C.azul },                 // "vacina"
  { t: 3.42, f: 'coracao', sc: 300, fundo: C.amarelo },            // "salva milhões de vidas"
  { t: 5.33, f: 'pais', y: 570, sc: 360, fundo: C.oliva },         // "pais"
  { t: 7.58, f: 'muda', sc: 320, fundo: C.olivaE },                // "roça"
  { t: 8.86, f: 'advogado', y: 580, sc: 340, fundo: C.azul },      // "advogado"
  { t: 9.72, f: 'doc', sc: 300, fundo: C.amarelo },                // "ajudo eles"
  { t: 10.4, f: 'calendario', sc: 290, fundo: C.marromC, D: 0.3 }, // "todos os dias"
  { t: 11.57, f: 'onibus', sc: 330, fundo: C.azul },               // "ônibus"
  { t: 12.25, f: 'relogio', sc: 290, fundo: C.petroleo },          // "horas"
  { t: 13.77, f: 'bolsista', y: 580, sc: 330, fundo: C.oliva },    // "Hoje ajudo pessoas"
  { t: 15.21, f: 'pino', sc: 290, fundo: C.azul },                 // "transporte"
  { t: 15.88, f: 'tres', y: 600, sc: 420, fundo: C.amarelo, D: 0.3 },
  { t: 16.39, f: 'mao', sc: 300, fundo: C.marromC, D: 0.3 },       // "Semear"
  { t: 17.01, f: 'seta', sc: 300, fundo: C.oliva, D: 0.3 },        // "empurrãozinho"
  { t: 18.83, f: 'pesquisadora', y: 580, sc: 340, fundo: C.amarelo },
  { t: 19.77, f: 'semente', sc: 260, fundo: C.olivaE },            // "potencial"
  { t: 20.81, f: 'porta', sc: 330, fundo: C.petroleo },            // "faltava oportunidade"
  { t: 22.48, f: 'bolsista', y: 580, sc: 330, fundo: C.azul },     // "Semear"
  { t: 24.34, f: 'mao', sc: 300, fundo: C.marromC, D: 0.3 },       // "mão"
  { t: 24.88, f: 'estrela', sc: 290, fundo: C.amarelo, D: 0.3 },   // "sonho"
  { t: 25.42, f: 'circulo', sc: 300, fundo: C.petroleo, D: 0.3 },  // "A próxima"
  { t: 26.04, f: 'maos', y: 640, sc: 280, fundo: C.preto, D: 0.4 },// "conquista"
].map((k, i, a) => ({ x: 960, y: 560, cor: C.creme, D: 0.42, ...k }));

const forma = (k) => F[k.f];
function heroi(k, t) { // posição viva enquanto a forma está pousada
  let { x, y, sc } = k;
  if (k.f === 'gota') { const u = inv(0, 0.36, t); y = lerp(140, 560, E.in2(u)); }
  if (k.f === 'seta') y -= 150 * E.back(inv(17.05, 17.5, t), 1.6) - 0; // o empurrão leva a seta pra cima
  if (k.f === 'onibus') y += Math.sin(t * 20) * 4;
  const resp = 1 + 0.014 * Math.sin(t * 5.2);
  return { x, y: y + Math.sin(t * 2) * 4, sc: sc * resp };
}
function desenhaP(ctx, P, x, y, sc, cor, sx = 1, sy = 1, r = 0) {
  const c0 = Math.cos(r), s0 = Math.sin(r);
  ctx.beginPath();
  P.forEach(([px, py], i) => { const dx = px * sc * sx, dy = py * sc * sy, X = x + dx * c0 - dy * s0, Y = y + dx * s0 + dy * c0; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
}
function hexMix(a, b, u) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const ch = (n, s) => (n >> s) & 255; return `rgb(${[16, 8, 0].map((s) => Math.round(lerp(ch(A, s), ch(B, s), u))).join(',')})`; }

// detalhes que vivem dentro de cada forma pousada (na cor do campo)
function detalhes(ctx, k, t, h) {
  const { x, y, sc } = h, f = k.fundo, e = pop(t, k.t + 0.05, 0.3);
  if (e <= 0) return;
  if (k.f === 'frasco' && k.t > 1) { rr(ctx, x - sc * 0.22, y - sc * 0.05, sc * 0.44 * e, sc * 0.1, sc * 0.05, f); }
  if (k.f === 'casa') rr(ctx, x - sc * 0.15, y + sc * 0.3, sc * 0.3, sc * 0.45 * e, sc * 0.12, f);
  if (k.f === 'coracao') for (let i = 0; i < 26; i++) { // "milhões": corações se multiplicam em volta
    const a = (i / 26) * Math.PI * 2 + hs(i) * 0.4, d = 420 + hs(i, 2) * 380, ee = pop(t, 3.72 + i * 0.022, 0.3);
    if (ee > 0) coracao(ctx, x + Math.cos(a) * d * 1.3, y + Math.sin(a) * d * 0.72, (16 + hs(i, 3) * 18) * ee, C.creme);
  }
  if (k.f === 'doc') { for (let i = 0; i < 3; i++) rr(ctx, x - sc * 0.36, y - sc * (0.42 - i * 0.18), sc * (0.6 - i * 0.12), sc * 0.07, sc * 0.035, f); traco(ctx, [[x - sc * 0.2, y + sc * 0.32], [x - sc * 0.04, y + sc * 0.46], [x + sc * 0.3, y + sc * 0.14]], sc * 0.09, f, pr(t, 9.85, 10.2)); }
  if (k.f === 'calendario') { const n = t < 10.6 ? 1 : t < 10.8 ? 2 : 3, fl = [10.6, 10.8].map((a) => inv(a - 0.08, a, t)).find((v) => v > 0 && v < 1);
    ctx.save(); ctx.translate(x, y + sc * 0.42); if (fl) ctx.scale(1, 1 - Math.sin(Math.PI * fl) * 0.8); ctx.fillStyle = f; ctx.font = `700 ${Math.round(sc * 0.8)}px P`; ctx.textAlign = 'center'; ctx.fillText(String(n), 0, 0); ctx.restore(); }
  if (k.f === 'onibus') { for (let i = 0; i < 4; i++) rr(ctx, x + sc * (-0.85 + i * 0.44), y - sc * 0.32, sc * 0.34, sc * 0.3, sc * 0.06, f); for (let i = 0; i < 3; i++) caps(ctx, x - sc * 1.25 - i * 40, y - sc * 0.2 + i * 50, x - sc * 1.55 - i * 60, y - sc * 0.2 + i * 50, 7, C.creme); }
  if (k.f === 'relogio') { const a = (t - 12.25) * 12; for (const [L, w, v] of [[0.55, 0.06, a], [0.38, 0.08, a / 6]]) { ctx.save(); ctx.translate(x, y + sc * 0.06); ctx.rotate(v); rr(ctx, -sc * w / 2, -sc * L, sc * w, sc * L, sc * w / 2, f); ctx.restore(); } circ(ctx, x, y + sc * 0.06, sc * 0.07, f); }
  if (k.f === 'pino') { circ(ctx, x, y - sc * 0.25, sc * 0.22 * e, f); for (let i = 0; i < 9; i++) if (pop(t, 15.25 + i * 0.04) > 0) circ(ctx, x - sc * 1.6 + i * sc * 0.36, y + sc * 1.05 + Math.sin(i) * 10, 8, C.creme); }
  if (k.f === 'seta') for (let i = 0; i < 3; i++) { const yy = y + sc * (1.1 + i * 0.25) + (1 - pr(t, 17.05, 17.4)) * 60; caps(ctx, x - sc * 0.12, yy, x + sc * 0.12, yy, 6, C.creme); }
  if (k.f === 'semente') for (let i = 0; i < 3; i++) { const r = ((t * 0.9 + i / 3) % 1); ctx.save(); ctx.globalAlpha = (1 - r) * e; ctx.lineWidth = 8; ctx.strokeStyle = C.creme; ctx.beginPath(); ctx.arc(x, y + sc * 0.1, sc * (0.8 + r * 0.9), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (k.f === 'porta') { circ(ctx, x + sc * 0.32, y + sc * 0.22, sc * 0.06, f); const cad = pop(t, 21.26); if (cad > 0) { ctx.save(); ctx.translate(x + sc * 0.9, y + sc * 0.1); ctx.scale(cad, cad); ctx.lineWidth = sc * 0.06; ctx.strokeStyle = C.creme; ctx.beginPath(); ctx.arc(0, -sc * 0.12, sc * 0.12, Math.PI, 0); ctx.stroke(); rr(ctx, -sc * 0.17, -sc * 0.12, sc * 0.34, sc * 0.28, sc * 0.05, C.creme); ctx.restore(); } }
  if (k.f === 'estrela') { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.6); for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); caps(ctx, 0, sc * 1.1 * e, 0, sc * 1.3 * e, 7, C.creme); } ctx.restore(); }
}

// ------------------------------------------------------------------ mãos, copa e assinatura (25,9–30)
function final(ctx, t) {
  const MB = LOGO.maosBox, kAlvo = 280, wIni = kAlvo * 2.0;
  const INI = { w: wIni, bx: 960, by: 640 + ((MB.y1 - MB.y0) / 2) * (wIni / (MB.x1 - MB.x0)) };
  const viaja = E.io3(inv(26.6, 27.45, t));
  const S = simbolo(lerp(INI.w, FIM.w, viaja), lerp(INI.bx, FIM.bx, viaja), lerp(INI.by, FIM.by, viaja));
  maosDesenho(ctx, S, hexMix(C.creme, C.marrom, pr(t, 26.3, 26.8)), 1);
  if (!COPA) COPA = ordemCopa();
  const de = [[-120, 300], [960, -120], [2040, 300]];
  COPA.primeiras.forEach((idx, i) => { // as três primeiras chegam de fora (as três histórias)
    const voo = pr(t, 27.0 + i * 0.08, 27.42 + i * 0.08, 'io2'); if (voo <= 0) return;
    const p = S.pes[idx], [x0, y0] = de[i], mx = (x0 + p.X) / 2, my = Math.min(y0, p.Y) - 120;
    const q = (u) => [(1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * p.X, (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * p.Y];
    if (voo < 1) { for (let k = 0; k < 10; k++) { const pt = q(voo * k / 10); circ(ctx, pt[0], pt[1], 3, C.creme); } const [x, y] = q(voo); circ(ctx, x, y, 16, C.creme); }
    if (voo > 0.8) pessoinhaLogo(ctx, S, idx, { dx: 0, dy: 0, s: E.back(inv(0.8, 1, voo), 2.2) });
  });
  COPA.ord.forEach((i, n) => {
    if (COPA.primeiras.includes(i)) return;
    const t0 = i === COPA.ultima ? 27.88 : lerp(27.35, 27.75, n / COPA.ord.length), e = inv(t0, t0 + 0.16, t);
    if (e > 0) pessoinhaLogo(ctx, S, i, { dx: 0, dy: 0, s: E.back(e, 2.4) });
  });
  if (t > 28.0 && t < 28.45) { const p = S.pes[COPA.ultima], s = Math.sin(Math.PI * inv(28.0, 28.45, t)); estrela(ctx, p.X + 44, p.Y - 40, 16 * s, C.amarelo); }
  nome(ctx, pr(t, 27.7, 28.1, 'out3'));
  cta(ctx, pr(t, 27.95, 28.35, 'out3'));
}

// ------------------------------------------------------------------ montagem
export async function init() {
  await carregar();
  for (const [nomeF, fn] of Object.entries(FORMAS)) F[nomeF] = silhueta(fn);
  PAPEL = new Image(); PAPEL.src = 'assets/marca/papel.png'; await PAPEL.decode();
}
export function render(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  // em que trecho da corrente estamos
  let j = 0; while (j + 1 < K.length && t >= K[j + 1].t - K[j + 1].D) j++;
  const emMorph = j > 0 && t < K[j].t;            // chegando em K[j], saindo de K[j-1]
  const A = emMorph ? K[j - 1] : K[j], B = emMorph ? K[j] : null, i = j;
  // campo de cor: troca no meio de cada morph, num círculo que cresce de trás da forma
  let fundo = A.fundo;
  for (let j = 1; j < K.length; j++) { const k = K[j], m = k.t - k.D * 0.7; if (t >= m + 0.34) fundo = k.fundo; }
  ctx.fillStyle = fundo; ctx.fillRect(0, 0, W, H);
  for (let j = 1; j < K.length; j++) { const k = K[j], m = k.t - k.D * 0.7, u = inv(m, m + 0.34, t);
    if (u > 0 && u < 1) { const h = heroi(K[j - 1], t); circ(ctx, h.x, h.y, E.in3(u) * 2300, k.fundo); } }
  if (t < 26.5) {
    let P, x, y, sc, cor, sx = 1, sy = 1, r = 0;
    if (emMorph) {
      const u = inv(B.t - B.D, B.t, t), e = easeM(u), hA = heroi(A, t), hB = heroi(B, t);
      const rA = Math.sqrt(area(forma(A)) / Math.PI), rB = Math.sqrt(area(forma(B)) / Math.PI), rM = lerp(rA, rB, 0.5);
      P = e < 0.5 ? mistura(forma(A), circulo(lerp(rA, rM, e * 2)), e * 2) : mistura(circulo(lerp(rM, rB, e * 2 - 1)), forma(B), e * 2 - 1);
      x = lerp(hA.x, hB.x, e); y = lerp(hA.y, hB.y, e); sc = lerp(hA.sc, hB.sc, e);
      const s = Math.sin(Math.PI * u); sx = 1 + 0.13 * s; sy = 1 - 0.13 * s; r = 0.22 * s * (i % 2 ? 1 : -1);
      cor = hexMix(A.cor, B.cor, e);
    } else {
      const h = heroi(A, t); P = forma(A); ({ x, y, sc } = h); cor = A.cor;
      const imp = inv(A.t, A.t + 0.22, t); if (imp > 0 && imp < 1) { const k = (1 - E.elast(imp)) * 0.5; sx = 1 + 0.16 * k; sy = 1 - 0.16 * k; } // pouso: achata e volta
      if (A.f === 'gota' && t < 0.36) { const u = inv(0, 0.36, t); sx = 1 - 0.18 * u; sy = 1 + 0.3 * u; }
    }
    if (A.f === 'maos' && t > 26.04) { /* mãos passam pro desenho exato da marca */ }
    ctx.save(); ctx.globalAlpha = A.f === 'maos' && !emMorph ? 1 - pr(t, 26.25, 26.45) : 1;
    desenhaP(ctx, P, x, y, sc, cor, sx, sy, r); ctx.restore();
    if (!emMorph) detalhes(ctx, A, t, heroi(A, t));
  }
  if (t >= 26.25) final(ctx, t);
  legenda(ctx, t, 2.0, 4.6, 'Pesquisadora', 'ex-bolsista');
  legenda(ctx, t, 5.2, 10.7, 'Advogado', 'ex-bolsista');
  legenda(ctx, t, 13.6, 15.75, 'Bolsista', 'startup de transporte');
  // textura leve de papel (o morph de referência tem papel)
  if (t < 26.6) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28; ctx.drawImage(PAPEL, 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  const g = E.io3(inv(26.9, 27.9, t));
  qr(ctx, lerp(1756, 1730, g), lerp(140, 190, g), Math.round(lerp(180, 250, g)));
  const p = pr(t, 29.5, 29.96, 'io2'); if (p > 0) { ctx.fillStyle = `rgba(0,0,0,${p})`; ctx.fillRect(0, 0, W, H); }
}
