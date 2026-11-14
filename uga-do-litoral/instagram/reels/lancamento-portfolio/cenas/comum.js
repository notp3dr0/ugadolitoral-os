// Comum às três cenas do agente 2 (gráficos). Tudo puro: nada de relógio nem acaso sem semente.
// O site é só lido: fontes e fotos vêm de portfolio/site-lab pelo mesmo servidor.

export const SITE = '../../../../portfolio/site-lab/';
export const W = 1080, H = 1920;
export const OFF = '#f2f0eb', CINZA = '#a5a5a5', RED = '#fa1717';
export const BOLD = "'Arimo', Arial, sans-serif";
export const MONO = "'Inconsolata', monospace";

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (n, a, b) => clamp((n - a) / (b - a));
export const outCubic = t => 1 - Math.pow(1 - t, 3);
export const outQuart = t => 1 - Math.pow(1 - t, 4);
export const outExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const inOutCubic = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const inOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;

/** gerador com semente (mulberry32) */
export function semente(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** número fixo por índice (pra grão de lápis que não ferve de um quadro pro outro) */
export function hash(i, s = 0) {
  let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s | 0, 0xc2b2ae35);
  h ^= h >>> 13; h = Math.imul(h, 0x27d4eb2f); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export async function carregarTempo() {
  return (await fetch('../tempo.json')).json();
}

export async function carregarFontes() {
  const faces = [
    new FontFace('Arimo', `url(${SITE}assets/arimo-700.woff2)`, { weight: '700' }),
    new FontFace('Inconsolata', `url(${SITE}assets/inconsolata-400.woff2)`, { weight: '400' })
  ];
  for (const f of faces) { await f.load(); document.fonts.add(f); }
  await document.fonts.ready;
}

/**
 * O nome do jeito do site (.intro-name): Arial/Arimo 700, aperto -0,06em, cada palavra comprimida
 * na horizontal até caber em 94% da largura (nunca esticada).
 */
export function linhaGrande(ctx, texto, cx, base, corpo, largura = W * .94, cor = OFF) {
  ctx.save();
  ctx.font = `700 ${corpo}px ${BOLD}`;
  ctx.letterSpacing = `${-0.06 * corpo}px`;
  const w = ctx.measureText(texto).width - (-0.06 * corpo); // tira o espaçamento depois da última letra
  const sx = Math.min(1, largura / w);
  ctx.translate(cx, base);
  ctx.scale(sx, 1);
  ctx.fillStyle = cor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(texto, -w / 2, 0);
  ctx.restore();
  return { largura: w * sx, sx };
}

/** texto mono espaçado, centrado; devolve a largura */
export function linhaMono(ctx, texto, cx, base, corpo, espaco, cor = OFF) {
  ctx.save();
  ctx.font = `400 ${corpo}px ${MONO}`;
  ctx.letterSpacing = `${espaco}px`;
  const w = ctx.measureText(texto).width - espaco;
  ctx.fillStyle = cor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(texto, cx - w / 2, base);
  ctx.restore();
  return w;
}

/**
 * Traço de lápis dermatográfico, vermelho, desenhado até `p` (0..1) do caminho.
 * `pts`: pontos em px de tela (densos). O grão é amarrado à posição relativa no caminho (não ao
 * comprimento em px), então o mesmo traço não ferve quando a câmera aproxima.
 */
export function lapis(ctx, pts, p, largura, sem = 1, N = 2600) {
  if (p <= 0 || pts.length < 2) return;
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = acc[acc.length - 1];
  let seg = 0;
  const ponto = s => {
    while (seg < pts.length - 2 && acc[seg + 1] < s) seg++;
    const a = pts[seg], b = pts[seg + 1], k = (s - acc[seg]) / Math.max(1e-6, acc[seg + 1] - acc[seg]);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  const fim = Math.floor(N * clamp(p));
  // pressão: entra fina, encorpa, sai afinando; respira devagar no meio
  const pressao = u => clamp(u / .035) * (1 - .55 * Math.pow(clamp((u - .9) / .1), 1.5)) *
    (.86 + .1 * Math.sin(u * 17.3 + sem) + .06 * Math.sin(u * 41.7 + 2 * sem));
  ctx.save();
  ctx.fillStyle = RED;
  seg = 0;
  for (let k = 0; k <= fim; k++) {
    const u = k / N, [x, y, ang] = ponto(u * L);
    const w = largura * pressao(u);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    // corpo: um disco cheio um pouco mais estreito que o traço
    ctx.globalAlpha = .82;
    ctx.beginPath(); ctx.arc(x, y, w * .36, 0, Math.PI * 2); ctx.fill();
    // cera: grãos soltos na borda, cada um fixo pelo índice
    for (let g = 0; g < 4; g++) {
      const r1 = hash(k * 4 + g, sem), r2 = hash(k * 4 + g, sem + 77), r3 = hash(k * 4 + g, sem + 191);
      const off = (r1 - .5) * w;
      const t = (r2 - .5) * 2.2;
      const s = .9 + r3 * 1.5;
      ctx.globalAlpha = .25 + .6 * hash(k * 4 + g, sem + 5);
      ctx.fillRect(x + nx * off - Math.cos(ang) * t - s / 2, y + ny * off - Math.sin(ang) * t - s / 2, s, s);
    }
  }
  ctx.restore();
}

/** catmull-rom denso por uma lista de pontos de controle */
export function curva(ctrl, passos = 24) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < passos; s++) {
      const t = s / passos, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(d => .5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1].slice());
  return out;
}
