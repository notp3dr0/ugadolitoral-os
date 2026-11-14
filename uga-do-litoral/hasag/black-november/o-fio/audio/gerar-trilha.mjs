// O FIO · trilha e efeitos, tudo sintetizado em JavaScript (Node), sem amostra nenhuma.
// Escreve audio/trilha.wav: 48 kHz, estéreo, 36 s, sincronizado aos quadros do roteiro (30 qps).
// Trap a 150 BPM em meio tempo (1 tempo = 12 quadros, 1 colcheia = 6 quadros): 808 com glide, bumbo,
// palma, chimbal com rolls; no ateliê o chimbal ganha timbre de pérola (um clique tonal por conta).
// No fim mede o loudness com o ffmpeg (ebur128) e ajusta pra perto de -14 LUFS, pico abaixo de -1 dBTP.
//
//   node audio/gerar-trilha.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.join(AQUI, 'trilha.wav');
const SR = 48000;
const DUR = 36;
const N = SR * DUR;
const ALVO_LUFS = -14;
const TETO = Math.pow(10, -1.5 / 20); // teto do limitador, com folga pro pico real

const q = (quadro) => quadro / 30; // quadro -> segundos
const TAU = Math.PI * 2;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

// acaso com semente: a trilha sai igual toda vez
const mulberry = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// ---------- barras de mixagem ----------
const novo = () => ({L: new Float32Array(N), R: new Float32Array(N)});
const seco = novo(); // direto
const sala = novo(); // mandada pro reverb
const abafado = novo(); // a batida do plano 2, que passa por um filtro fechado

// põe um sinal mono numa barra, com ganho, panorâmica (-1..1) e mandada de reverb
const por = (sig, t0, ganho = 1, pan = 0, rev = 0, barra = seco) => {
  const i0 = Math.round(t0 * SR);
  const a = (pan + 1) * 0.25 * Math.PI;
  const gl = Math.cos(a) * ganho;
  const gr = Math.sin(a) * ganho;
  for (let i = 0; i < sig.length; i++) {
    const k = i0 + i;
    if (k < 0 || k >= N) continue;
    const s = sig[i];
    barra.L[k] += s * gl;
    barra.R[k] += s * gr;
    if (rev > 0) {
      sala.L[k] += s * gl * rev;
      sala.R[k] += s * gr * rev;
    }
  }
};

// ---------- filtros ----------
// filtro de estado variável (Simper): passa-baixa, banda e alta de uma vez, estável com corte variando
class SVF {
  constructor() {
    this.a = 0;
    this.b = 0;
  }
  rodar(x, fc, Q) {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
    const k = 1 / Q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.b;
    const v1 = a1 * this.a + a2 * v3;
    const v2 = this.b + a2 * this.a + a3 * v3;
    this.a = 2 * v1 - this.a;
    this.b = 2 * v2 - this.b;
    this.lp = v2;
    this.bp = v1;
    this.hp = x - k * v1 - v2;
    return this;
  }
}
const env = (t, ataque, queda) => (t < 0 ? 0 : t < ataque ? t / ataque : Math.exp(-(t - ataque) / queda));
// curva por pontos [[t, v], ...]
const curva = (pts) => (t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  }
  return pts[pts.length - 1][1];
};

// ---------- instrumentos ----------
const bumbo = (forca = 1) => {
  const n = Math.round(0.42 * SR);
  const o = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 44 + 150 * Math.exp(-t / 0.028) + 60 * Math.exp(-t / 0.006);
    ph += (TAU * f) / SR;
    const corpo = Math.sin(ph) * Math.exp(-t / 0.16);
    const estalo = i < 96 ? (1 - i / 96) * 0.6 : 0;
    o[i] = Math.tanh((corpo + estalo) * 1.8 * forca) * 0.9;
  }
  return o;
};
// 808: uma voz contínua com portamento. notas = [{t, m, dur}] em segundos relativos ao começo
const baixo808 = (notas, dur, o = {}) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const drive = o.drive || 2.4;
  let ph = 0;
  let f = midi(notas[0].m);
  let idx = -1;
  const lp = new SVF();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    while (idx + 1 < notas.length && t >= notas[idx + 1].t) idx++;
    if (idx < 0) continue;
    const nt = notas[idx];
    const alvo = midi(nt.m + (nt.sobe ? nt.sobe * clamp((t - nt.t) / nt.dur) : 0));
    f += (alvo - f) * (1 - Math.exp(-1 / (SR * (nt.glide || 0.035)))); // o glide
    ph += (TAU * f) / SR;
    const tt = t - nt.t;
    const a = tt < 0.004 ? tt / 0.004 : tt < nt.dur ? Math.exp(-tt / (nt.dur * 1.6)) : Math.exp(-nt.dur / (nt.dur * 1.6)) * Math.exp(-(tt - nt.dur) / 0.05);
    // seno saturado: os harmônicos fazem o grave aparecer em caixa pequena
    const s = Math.tanh(Math.sin(ph) * drive * (0.6 + 0.4 * a)) * a;
    out[i] = lp.rodar(s, 900 + 2600 * a, 0.7).lp * 0.8;
  }
  return out;
};
const palma = (r) => {
  const n = Math.round(0.3 * SR);
  const o = new Float32Array(n);
  const bp = new SVF();
  const hp = new SVF();
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let a = 0;
    for (const d of [0, 0.011, 0.021, 0.03]) a += t >= d ? Math.exp(-(t - d) / (d === 0.03 ? 0.085 : 0.006)) * (d === 0.03 ? 1 : 0.7) : 0;
    const ru = r() * 2 - 1;
    ph += (TAU * (190 - 40 * clamp(t / 0.05))) / SR;
    const corpo = Math.sin(ph) * Math.exp(-t / 0.06) * 0.5;
    o[i] = (bp.rodar(ru, 1700, 1.6).bp * 1.6 + hp.rodar(ru, 5000, 0.7).hp * 0.25) * a + corpo;
  }
  return o;
};
const chimbal = (r, queda = 0.03, brilho = 8000) => {
  const n = Math.round((queda * 6 + 0.01) * SR);
  const o = new Float32Array(n);
  const hp = new SVF();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    o[i] = hp.rodar(r() * 2 - 1, brilho, 1.2).hp * Math.exp(-t / queda) * (i < 24 ? i / 24 : 1);
  }
  return o;
};
// pérola: clique tonal de vidro. brilho > 0 dá a cauda cintilante do strass
const perola = (f, r, brilho = 0, queda = 0.07) => {
  const n = Math.round((queda * 7 + brilho * 0.5 + 0.02) * SR);
  const o = new Float32Array(n);
  const bp = new SVF();
  const parc = [[1, 1, 1], [2.76, 0.42, 0.55], [5.4, 0.2, 0.32], [8.93, 0.1 + brilho * 0.25, 0.2 + brilho * 1.6]];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const [m, a, d] of parc) s += Math.sin(TAU * f * m * t) * a * Math.exp(-t / (queda * d * (1 + brilho)));
    const tique = t < 0.004 ? bp.rodar(r() * 2 - 1, 4200, 2).bp * (1 - t / 0.004) * 1.4 : 0;
    o[i] = (s * 0.5 + tique) * (i < 12 ? i / 12 : 1);
  }
  return o;
};
// metal: parciais inarmônicas (elo de corrente, cruz, fecho)
const metal = (f, queda, r, o = {}) => {
  const n = Math.round((queda * 7 + 0.02) * SR);
  const out = new Float32Array(n);
  const razoes = o.razoes || [1, 1.47, 2.09, 2.56, 3.39, 4.08];
  const fases = razoes.map(() => r() * TAU);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    razoes.forEach((m, k) => {
      s += Math.sin(TAU * f * m * t + fases[k]) * Math.exp(-t / (queda / (1 + k * 0.45))) / (1 + k * 0.5);
    });
    out[i] = s * 0.35 * (i < 16 ? i / 16 : 1);
  }
  return out;
};
// sino: parciais de sino de igreja, as agudas morrem antes
const sino = (f0, queda, o = {}) => {
  const n = Math.round(Math.min(DUR, queda * 5) * SR);
  const out = new Float32Array(n);
  const parc = [[0.5, 0.5, 1.2], [1, 1, 1], [1.183, 0.65, 0.8], [1.506, 0.45, 0.6], [2, 0.6, 0.55], [2.514, 0.3, 0.38], [2.662, 0.25, 0.32], [3.011, 0.22, 0.26], [4.166, 0.14, 0.18], [5.433, 0.09, 0.12]];
  const brilho = o.brilho == null ? 1 : o.brilho;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const [m, a, d] of parc) s += Math.sin(TAU * f0 * m * t) * a * (m > 2 ? brilho : 1) * Math.exp(-t / (queda * d));
    out[i] = s * 0.22 * Math.min(1, t / 0.002);
  }
  return out;
};
const cowbell = () => {
  const n = Math.round(0.4 * SR);
  const o = new Float32Array(n);
  const bp = new SVF();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const s = (Math.sin(TAU * 540 * t) > 0 ? 1 : -1) + (Math.sin(TAU * 800 * t) > 0 ? 1 : -1);
    o[i] = bp.rodar(s, 1650, 2.2).bp * (0.75 * Math.exp(-t / 0.018) + 0.3 * Math.exp(-t / 0.11)) * 0.5;
  }
  return o;
};
// ruído varrido por um filtro de banda (vento curto, sopro, subida, golpe de ar)
const sopro = (dur, r, fDe, fAte, Q, envFn, o = {}) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = new SVF();
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const fc = fDe * Math.pow(fAte / fDe, o.curva ? Math.pow(u, o.curva) : u);
    f.rodar(r() * 2 - 1, fc, Q);
    out[i] = (o.alta ? f.hp : f.bp) * envFn(u, i / SR);
  }
  return out;
};
// coro: serras desafinadas com vibrato passando por três formantes de vogal
const coro = (notas, dur, r, o = {}) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const formA = o.vogal === 'o' ? [[450, 7, 1], [800, 8, 0.5], [2600, 9, 0.2]] : [[720, 7, 1], [1150, 8, 0.6], [2800, 9, 0.28]];
  const ataque = o.ataque || 0.4;
  const solta = o.solta || 0.5;
  for (const side of [0, 1]) {
    const out = side ? R : L;
    const filtros = formA.map(() => new SVF());
    const vozes = [];
    for (const m of notas) for (let v = 0; v < 3; v++) vozes.push({f: midi(m) * Math.pow(2, ((v - 1) * 9 + (side ? 4 : -4)) / 1200), ph: r(), vib: 4.6 + r() * 1.6, vph: r() * TAU});
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let s = 0;
      for (const v of vozes) {
        const f = v.f * (1 + 0.006 * Math.sin(TAU * v.vib * t + v.vph) * clamp(t / 0.6));
        v.ph += f / SR;
        if (v.ph >= 1) v.ph -= 1;
        s += v.ph * 2 - 1;
      }
      s /= vozes.length;
      let y = 0;
      formA.forEach(([fc, Q, g], k) => {
        y += filtros[k].rodar(s, fc, Q).bp * g;
      });
      const a = Math.min(1, t / ataque) * Math.min(1, Math.max(0, (dur - t) / solta));
      out[i] = y * a * 2.2;
    }
  }
  return {L, R};
};
const porEstereo = (st, t0, ganho, rev = 0, barra = seco) => {
  const i0 = Math.round(t0 * SR);
  for (let i = 0; i < st.L.length; i++) {
    const k = i0 + i;
    if (k < 0 || k >= N) continue;
    barra.L[k] += st.L[i] * ganho;
    barra.R[k] += st.R[i] * ganho;
    if (rev > 0) {
      sala.L[k] += st.L[i] * ganho * rev;
      sala.R[k] += st.R[i] * ganho * rev;
    }
  }
};
// pad: serras desafinadas num passa-baixa que abre devagar
const pad = (notas, dur, r, o = {}) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (const side of [0, 1]) {
    const out = side ? R : L;
    const lp = new SVF();
    const vozes = [];
    for (const m of notas) for (let v = 0; v < 2; v++) vozes.push({f: midi(m) * Math.pow(2, ((v ? 7 : -7) + (side ? 3 : -3)) / 1200), ph: r()});
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let s = 0;
      for (const v of vozes) {
        v.ph += v.f / SR;
        if (v.ph >= 1) v.ph -= 1;
        s += v.ph * 2 - 1;
      }
      s /= vozes.length;
      const u = t / dur;
      const a = Math.min(1, t / (o.ataque || 0.8)) * Math.min(1, Math.max(0, (dur - t) / (o.solta || 0.6)));
      out[i] = lp.rodar(s, lerp(o.f0 || 260, o.f1 || 1100, u), 0.9).lp * a;
    }
  }
  return {L, R};
};

const r = mulberry(20261110);

// =====================================================================================
// 1 · VENTO (quase o filme todo, some no silêncio e na batida cheia)
// =====================================================================================
{
  const nivel = curva([[0, 0], [0.3, 0.6], [3.6, 0.55], [4.0, 0.32], [7.8, 0.26], [8.0, 0.42], [11.6, 0.7], [11.96, 0.7], [12.0, 0], [14.7, 0], [16.2, 0.42], [18.0, 0.36], [20.6, 0.22], [21.0, 0], [28.95, 0], [29.05, 0.34], [31.9, 0.38], [32.2, 0.1], [33.6, 0]]);
  for (const side of [0, 1]) {
    const out = side ? seco.R : seco.L;
    const rr = mulberry(100 + side);
    const f1 = new SVF();
    const f2 = new SVF();
    let lfo = 0;
    let lfo2 = 0;
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      const nv = nivel(t);
      if (nv <= 0) continue;
      // rajadas: ruído muito lento
      lfo += ((rr() * 2 - 1) * 0.5 - lfo * 0.00002) * 0.004;
      lfo = clamp(lfo, -1, 1);
      lfo2 += ((rr() * 2 - 1) - lfo2) * 0.00004;
      const raj = 0.7 + 0.3 * Math.sin(TAU * 0.13 * t + side) + lfo * 0.25;
      const ru = rr() * 2 - 1;
      const corpo = f1.rodar(ru, 420 + 260 * Math.sin(TAU * 0.09 * t + side * 2) + lfo * 180, 1.1).bp;
      const assobio = f2.rodar(ru, 1900 + 500 * Math.sin(TAU * 0.07 * t + 1 + side), 7).bp * 0.18 * clamp(raj - 0.6, 0, 1);
      out[i] += (corpo + assobio) * nv * raj * 0.72;
    }
  }
}

// =====================================================================================
// 2 · PLANO 1 (0 a 4 s): sino grave longe, a sacola
// =====================================================================================
por(sino(midi(43), 2.6, {brilho: 0.25}), 1.0, 0.5, -0.3, 0.9);
// sacola: estalinhos de plástico (impulsos esparsos num filtro agudo), mais densos a cada quique
const sacola = (t0, dur, panDe, panAte, ganho, quiques) => {
  const n = Math.round(dur * SR);
  const f = new SVF();
  const i0 = Math.round(t0 * SR);
  let e = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const dens = (0.0009 + 0.006 * Math.pow(Math.abs(Math.sin(u * Math.PI * quiques + 0.4)), 6)) * Math.sin(u * Math.PI);
    if (r() < dens) e = (r() * 2 - 1) * (0.5 + r());
    const s = f.rodar(e, 5200 + 1800 * Math.sin(u * 40), 3).bp;
    e *= 0.3;
    const pan = lerp(panDe, panAte, u);
    const a = (pan + 1) * 0.25 * Math.PI;
    const k = i0 + i;
    if (k >= N) break;
    seco.L[k] += s * Math.cos(a) * ganho;
    seco.R[k] += s * Math.sin(a) * ganho;
    sala.L[k] += s * 0.15 * ganho;
    sala.R[k] += s * 0.15 * ganho;
  }
};
sacola(0.4, 4.2, -0.8, 0.8, 1.5, 4.2);
sacola(q(298), 2.1, 0.8, -0.8, 1.2, 3.3);

// =====================================================================================
// 3 · PLANO 2 (4 a 8 s): passos no tempo da batida, que começa abafada
// =====================================================================================
{
  const passos = [4.0, 4.8, 5.6, 6.4, 7.2];
  passos.forEach((t, i) => {
    // o pé na poeira: baque e arrasto
    por(sopro(0.07, r, 120, 60, 1.2, (u) => (1 - u) * (1 - u)), t, 1.4, 0, 0.1);
    por(sopro(0.16, r, 1800, 900, 0.9, (u) => Math.sin(u * Math.PI) * (1 - u)), t + 0.01, 0.2, i % 2 ? 0.2 : -0.2, 0.15);
    // batida abafada: bumbo e sub nos tempos 1, palma nos tempos 3
    if (i % 2 === 0) por(bumbo(0.9), t, 0.9, 0, 0, abafado);
    else por(palma(r), t, 0.55, 0, 0.1, abafado);
  });
  por(baixo808([{t: 0, m: 31, dur: 0.6}, {t: 1.6, m: 31, dur: 0.6}, {t: 2.4, m: 34, dur: 0.3, glide: 0.06}, {t: 3.2, m: 31, dur: 0.7}], 4.0), 4.0, 0.8, 0, 0, abafado);
  for (let k = 0; k < 20; k++) por(chimbal(r, 0.022), 4.0 + k * 0.2, k % 2 ? 0.16 : 0.26, 0.15, 0, abafado);
  // as tiras entrando: três sopros curtos
  [4.0, 4.8, 5.6].forEach((t, i) => por(sopro(0.3, r, 500, 3200, 1.4, (u) => Math.sin(u * Math.PI) ** 2), t - 0.04, 0.3, i % 2 ? 0.6 : -0.6, 0.2));
  // a corrente brilha uma vez
  por(metal(3100, 0.11, r), q(207), 0.22, 0.2, 0.5);
  // pad escuro entrando por baixo
  porEstereo(pad([31, 43, 50], 4.0, r, {f0: 160, f1: 420, ataque: 2.5, solta: 0.05}), 4.0, 0.16, 0.2, abafado);
  // filtro fechado na barra abafada, abrindo um pouco; corta seco em 8,0 s
  for (const lado of ['L', 'R']) {
    const f = new SVF();
    const b = abafado[lado];
    const i0 = Math.round(3.9 * SR);
    const i1 = Math.round(8.3 * SR);
    for (let i = i0; i < i1; i++) {
      const t = i / SR;
      const corte = lerp(320, 1900, clamp((t - 4) / 4) ** 1.5); // abafada, mas abre o bastante pra existir em caixa de celular
      const fora = t >= 8.0 ? Math.max(0, 1 - (t - 8.0) / 0.03) : 1;
      seco[lado][i] += f.rodar(b[i], corte, 0.8).lp * fora * 1.25;
    }
  }
}

// =====================================================================================
// 4 · PLANO 3 (8 a 12 s): a batida corta; vento e um zumbido subindo
// =====================================================================================
{
  const dur = 4.0;
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  let p1 = 0;
  let p2 = 0;
  let p3 = 0;
  let p4 = 0;
  const lp = new SVF();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const u = t / dur;
    const sobe = Math.pow(u, 1.6);
    const f = lerp(62, 147, sobe);
    p1 += f / SR;
    p2 += (f * 1.498) / SR;
    p3 += (f * 2.01) / SR;
    p4 += lerp(1500, 3300, sobe) / SR;
    const grave = lp.rodar(((p1 % 1) * 2 - 1) * 0.5 + ((p2 % 1) * 2 - 1) * 0.3 + ((p3 % 1) * 2 - 1) * 0.3, lerp(200, 1400, sobe), 1.2).lp;
    const agudo = Math.sin(TAU * p4) * 0.1 * (0.6 + 0.4 * Math.sin(TAU * lerp(5, 13, u) * t));
    const a = Math.pow(u, 1.8) * (t > dur - 0.035 ? (dur - t) / 0.035 : 1);
    L[i] = (grave + agudo) * a;
    R[i] = (grave * 0.9 + agudo * 1.1) * a;
  }
  porEstereo({L, R}, 8.0, 0.55, 0.25);
  // as sombras surgindo: três pancadas surdas
  [q(244), q(251), q(258)].forEach((t, i) => por(sopro(0.5, r, 90, 45, 1.5, (u) => (1 - u) ** 2), t, 1.0, (i - 1) * 0.3, 0.3));
  // os três painéis: sopro curto e um baque cada
  [q(286), q(294), q(302)].forEach((t, i) => {
    por(sopro(0.26, r, 700, 3600, 1.6, (u) => Math.sin(u * Math.PI) ** 2), t - 0.03, 0.34, (i - 1) * 0.6, 0.2);
    por(sopro(0.12, r, 150, 70, 1.3, (u) => (1 - u) ** 2), t + 0.12, 1.1, (i - 1) * 0.4, 0.2);
  });
  // o olho acende; a mão fecha (couro e junta)
  por(metal(880, 0.5, r, {razoes: [1, 1.01, 2.4, 3.7]}), q(296), 0.12, 0, 0.8);
  por(sopro(0.5, r, 300, 900, 3, (u) => Math.sin(u * Math.PI) * (0.6 + 0.4 * Math.sin(u * 60))), q(308), 0.22, 0.5, 0.1);
}

// =====================================================================================
// 5 · PLANOS 4 e 5 (12 a 15 s): silêncio total, inspiração, e o golpe em 14,0 s
// =====================================================================================
{
  // inspiração: ar entrando, o filtro sobe; corta um instante antes do golpe
  por(sopro(0.86, r, 500, 2400, 2.2, (u) => Math.pow(u, 1.5) * (u > 0.95 ? (1 - u) / 0.05 : 1), {curva: 1.3}), 13.1, 0.95, 0, 0.12);
  por(sopro(0.86, r, 1200, 5200, 1.2, (u) => Math.pow(u, 2.2) * (u > 0.95 ? (1 - u) / 0.05 : 1) * 0.5), 13.1, 0.35, 0, 0.1);
  // as sombras avançando: um grave que cresce por baixo
  {
    const n = Math.round(1.16 * SR);
    const o = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const u = i / n;
      o[i] = Math.sin(TAU * (38 + 16 * u) * t) * Math.pow(u, 2.4) * (u > 0.97 ? (1 - u) / 0.03 : 1);
    }
    por(o, 12.82, 0.7, 0, 0);
  }
  const g = 14.0;
  // estalo
  {
    const n = Math.round(0.05 * SR);
    const o = new Float32Array(n);
    const hp = new SVF();
    for (let i = 0; i < n; i++) o[i] = (i < 40 ? 1 - i / 40 : 0) * 1.2 + hp.rodar(r() * 2 - 1, 6000, 0.8).hp * Math.exp(-i / SR / 0.008) * 0.9;
    por(o, g, 1.0, 0, 0.35);
  }
  // whoosh: o ar rasgando, da esquerda pra direita
  {
    const w = sopro(0.42, r, 7000, 350, 1.1, (u) => Math.pow(1 - u, 1.4) * Math.min(1, u * 30));
    const i0 = Math.round((g - 0.01) * SR);
    for (let i = 0; i < w.length; i++) {
      const pan = lerp(-0.9, 0.9, i / w.length);
      const a = (pan + 1) * 0.25 * Math.PI;
      seco.L[i0 + i] += w[i] * Math.cos(a) * 1.1;
      seco.R[i0 + i] += w[i] * Math.sin(a) * 1.1;
      sala.L[i0 + i] += w[i] * 0.3;
      sala.R[i0 + i] += w[i] * 0.3;
    }
  }
  // impacto grave
  {
    const n = Math.round(1.6 * SR);
    const o = new Float32Array(n);
    let ph = 0;
    const lp = new SVF();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f = 36 + 120 * Math.exp(-t / 0.05);
      ph += (TAU * f) / SR;
      const ru = lp.rodar(r() * 2 - 1, 300, 0.8).lp * Math.exp(-t / 0.08) * 0.8;
      o[i] = Math.tanh((Math.sin(ph) * Math.exp(-t / 0.42) + ru) * 2.6);
    }
    por(o, g, 1.0, 0, 0.25);
  }
  // o fio do corte: metal agudo que fica soando
  por(metal(2350, 0.7, r, {razoes: [1, 1.34, 1.91, 2.63, 3.5, 4.4]}), g + 0.01, 0.34, 0.3, 0.7);
  por(metal(4700, 0.5, r), g + 0.02, 0.14, -0.3, 0.7);
  // zumbido fino no ouvido, depois do clarão
  {
    const n = Math.round(1.8 * SR);
    const o = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      o[i] = Math.sin(TAU * 3520 * t) * Math.min(1, t / 0.2) * Math.exp(-t / 0.6) * 0.05;
    }
    por(o, g + 0.05, 1, 0, 0.2);
  }
}

// =====================================================================================
// 6 · PLANO 6 (15 a 18 s): as sombras viram fumaça; a corrente arrebenta e cai
// =====================================================================================
{
  // fumaça: três sopros que descem de tom
  [q(451), q(454), q(457)].forEach((t, i) => por(sopro(0.9, r, 2600, 300, 1.0, (u) => Math.sin(Math.min(1, u * 5) * Math.PI * 0.5) * Math.pow(1 - u, 1.5)), t + 0.15, 0.42, (i - 1) * 0.5, 0.35));
  // o fecho estala (16,4 s)
  const tq = q(492);
  por(metal(4300, 0.045, r), tq, 0.6, 0.25, 0.3);
  por(metal(6400, 0.03, r), tq + 0.012, 0.4, 0.3, 0.3);
  // a corrente escorrendo: tilintar fino e esparso, em câmera lenta
  const rc = mulberry(77);
  let t = q(494) + 0.03;
  while (t < q(518)) {
    por(metal(3000 + rc() * 5200, 0.03 + rc() * 0.05, rc), t, 0.12 + rc() * 0.14, rc() * 0.8 - 0.4, 0.5);
    t += 0.035 + rc() * 0.09;
  }
  // um silvo descendo com ela
  por(sopro(0.8, r, 5200, 1500, 5, (u) => Math.sin(u * Math.PI) * 0.6), q(494), 0.16, 0, 0.3);
  // bate na poeira: um cacho de tilintares e um baque seco
  const tc = q(519);
  for (let k = 0; k < 16; k++) por(metal(2600 + rc() * 4800, 0.04 + rc() * 0.07, rc), tc + k * 0.014 + rc() * 0.012, 0.34 * (1 - k / 22), rc() * 0.7 - 0.2, 0.45);
  por(sopro(0.1, r, 200, 80, 1.2, (u) => (1 - u) ** 2), tc, 1.2, 0, 0.1);
  por(sopro(0.3, r, 2200, 700, 0.9, (u) => Math.sin(Math.min(1, u * 6) * Math.PI * 0.5) * (1 - u) ** 2), tc, 0.3, 0, 0.2);
  // os últimos elos assentando
  [0.24, 0.37, 0.55].forEach((d, k) => por(metal(3400 + k * 900, 0.05, rc), tc + d, 0.16 - k * 0.04, 0.2, 0.5));
}

// =====================================================================================
// 7 · PLANO 7 (18 a 21 s): pad grave, coro curto, e a subida pra dentro do vão
// =====================================================================================
{
  porEstereo(pad([31, 43, 50, 58], 3.05, r, {f0: 220, f1: 1500, ataque: 0.9, solta: 0.06}), 18.0, 0.42, 0.35);
  porEstereo(coro([55, 62], 2.3, r, {vogal: 'o', ataque: 0.7, solta: 0.25}), 18.7, 0.5, 0.6);
  porEstereo(coro([67, 70], 1.4, r, {vogal: 'a', ataque: 0.6, solta: 0.08}), 19.62, 0.34, 0.6);
  // passos dele indo
  for (let k = 0; k < 5; k++) por(sopro(0.06, r, 110, 60, 1.2, (u) => (1 - u) ** 2), q(558 + 12) + k * 0.39, 0.7 * (1 - k * 0.15), -0.3 + k * 0.08, 0.15);
  // subida: ruído e tom crescendo com a câmera, cortando em 21,0 s
  por(sopro(1.5, r, 300, 6500, 1.3, (u) => Math.pow(u, 2.6) * (u > 0.985 ? (1 - u) / 0.015 : 1), {curva: 1.5}), 19.5, 0.42, 0, 0.3);
  {
    const n = Math.round(1.4 * SR);
    const o = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      ph += (TAU * lerp(98, 392, Math.pow(u, 2))) / SR;
      o[i] = Math.sin(ph) * Math.pow(u, 2.2) * (u > 0.985 ? (1 - u) / 0.015 : 1) * 0.5;
    }
    por(o, 19.6, 0.3, 0, 0.3);
  }
}

// =====================================================================================
// 8 · PLANOS 8, 9 e 10 (21 a 32 s): a batida cheia. Compasso = 1,6 s, 16 passos de 0,1 s.
// =====================================================================================
const C1 = 21.0;
const compasso = (k) => C1 + k * 1.6; // k = 0 é o primeiro compasso do ateliê
const passo = 0.1;
{
  const bumbos = [[0, 6, 10], [0, 3, 10, 13], [0, 6, 10], [0, 3, 10, 13], [10, 13], [0, 3, 6, 10], [0, 6, 8, 12]];
  bumbos.forEach((ps, k) => ps.forEach((p) => por(bumbo(k >= 5 ? 1.15 : 1), compasso(k) + p * passo, k >= 5 ? 1.0 : 0.9, 0, 0.03)));
  // palma no tempo 3
  [0, 1, 2, 3, 4, 5, 6].forEach((k) => por(palma(r), compasso(k) + 8 * passo, k >= 5 ? 0.62 : 0.52, 0.05, 0.22));
  // 808 com glide
  const linha = [
    [{p: 0, m: 31, d: 5}, {p: 6, m: 34, d: 3, glide: 0.07}, {p: 10, m: 31, d: 5, glide: 0.05}],
    [{p: 0, m: 31, d: 3}, {p: 3, m: 31, d: 6}, {p: 10, m: 29, d: 3, glide: 0.08}, {p: 13, m: 34, d: 3, glide: 0.06}],
    [{p: 0, m: 31, d: 5}, {p: 6, m: 34, d: 3, glide: 0.07}, {p: 10, m: 31, d: 5, glide: 0.05}],
    [{p: 0, m: 31, d: 3}, {p: 3, m: 31, d: 6}, {p: 10, m: 38, d: 3, glide: 0.03}, {p: 13, m: 36, d: 3, glide: 0.09}],
    [{p: 10, m: 31, d: 6, sobe: 12, glide: 0.02}], // depois do clique: um 808 só, subindo uma oitava até o drop
    [{p: 0, m: 31, d: 6}, {p: 6, m: 34, d: 3, glide: 0.07}, {p: 10, m: 31, d: 6, glide: 0.06}],
    [{p: 0, m: 39, d: 7, glide: 0.05}, {p: 8, m: 38, d: 5.6, glide: 0.09}],
  ];
  linha.forEach((notas, k) => {
    const ns = notas.map((x) => ({t: x.p * passo, m: x.m, dur: x.d * passo, glide: x.glide, sobe: x.sobe}));
    const fim = k === 6 ? 1.4 : 1.75;
    const sig = baixo808(ns, fim, {drive: k >= 5 ? 3.2 : 2.4});
    if (k === 6) for (let i = 0; i < sig.length; i++) sig[i] *= clamp((1.4 - i / SR) / 0.02); // corta no sino (32,0 s)
    por(sig, compasso(k), k >= 5 ? 0.95 : 0.85, 0, 0);
  });

  // PLANO 8: cada par de contas é um clique de pérola numa colcheia (6 quadros); a bola de strass cintila
  const escala = [79, 82, 84, 86, 89, 91, 94, 96, 98];
  const melodia = [0, 1, 3, 1, 2, 3, 4, 5, 3, 4, 5, 6, 7, 5, 6, 7, 8];
  const bolas = new Set([2, 7, 12]);
  melodia.forEach((idx, k) => {
    const t = q(636 + k * 6);
    const f = midi(escala[idx]);
    if (bolas.has(k)) {
      por(perola(f, r, 1, 0.09), t, 0.5, -0.25, 0.5);
      por(perola(f * 1.5, r, 1, 0.08), t + 0.004, 0.3, 0.25, 0.5);
    } else {
      por(perola(f, r, 0, 0.07), t, 0.46, k % 2 ? 0.3 : -0.3, 0.3);
      por(perola(f * 2, r, 0, 0.04), t + 0.003, 0.14, k % 2 ? -0.3 : 0.3, 0.3);
    }
    // o chimbal de sempre por baixo, bem leve: o timbre que manda é o da pérola
    por(chimbal(r, 0.018, 9000), t, 0.07, 0.1, 0.05);
  });
  // as contratempos e os rolls do ateliê, no mesmo timbre de pérola (mais agudo e curto)
  for (let k = 0; k < 3; k++) {
    for (let p = 0; p < 16; p++) {
      const t = compasso(k) + p * passo;
      if (t < 21.15 || t > 24.45) continue;
      if (p % 2 === 1) por(perola(midi(98 + (p % 4 === 3 ? 3 : 0)), r, 0, 0.022), t, 0.1, p % 4 === 1 ? 0.45 : -0.45, 0.15);
    }
    // roll no fim do compasso
    if (k < 2) for (let j = 0; j < 4; j++) por(perola(midi(91 + j * 2 + k * 3), r, 0, 0.03), compasso(k) + 1.4 + j * 0.05, 0.16 + j * 0.03, lerp(-0.5, 0.5, j / 3), 0.25);
  }
  // as cruzes encaixam: metal mais pesado, subindo; a do meio com sino
  [[738, 1250, -0.4], [744, 1480, 0.4], [750, 1760, 0]].forEach(([f, hz, pan], i) => {
    por(metal(hz, 0.16, r, {razoes: [1, 1.52, 2.31, 3.08, 4.2]}), q(f), 0.5 + i * 0.1, pan, 0.5);
    por(perola(hz * 2, r, 1, 0.05), q(f), 0.2, pan, 0.5);
  });
  por(sino(midi(67), 1.1, {brilho: 0.8}), q(750), 0.5, 0, 0.6);
  // chimbal regular: volta depois das pérolas, em colcheias; semicolcheias e rolls no plano 9 e no drop
  for (let k = 0; k < 7; k++) {
    for (let p = 0; p < 16; p++) {
      const t = compasso(k) + p * passo;
      if (t < 24.55 || t >= 31.98) continue;
      if (k === 4 && p < 4) continue; // o silêncio depois do clique do fecho
      const cheio = k >= 5;
      if (p % 2 === 0 || cheio || (k >= 3 && p % 4 === 3)) por(chimbal(r, p % 4 === 2 ? 0.035 : 0.02), t, (p % 2 === 0 ? 0.2 : 0.11) * (cheio ? 1.15 : 1), 0.2, 0.04);
    }
    // rolls de fusa
    const rolls = k === 3 ? [14] : k === 4 ? [] : k === 5 ? [6, 14] : k === 6 ? [6] : [];
    for (const p of rolls) for (let j = 0; j < 4; j++) por(chimbal(r, 0.014), compasso(k) + p * passo + j * 0.05, 0.1 + j * 0.035, 0.2 + j * 0.1, 0.04);
  }
  // chimbal aberto
  [[2, 14], [3, 6], [5, 14], [6, 4]].forEach(([k, p]) => por(chimbal(r, 0.11, 7000), compasso(k) + p * passo, 0.16, -0.2, 0.1));
  // pad escuro por baixo do ateliê e do peito
  porEstereo(pad([43, 50, 55, 58], 6.4, r, {f0: 300, f1: 900, ataque: 0.3, solta: 0.1}), 21.0, 0.16, 0.3);

  // PLANO 9: o colar assenta (26,4 s); clique seco do fecho em 27,4 s (tempo 1); cowbell e subida pro drop
  [0, 0.05, 0.11].forEach((d, i) => por(perola(midi(86 - i * 2), r, 0, 0.04), q(792) + d, 0.2 - i * 0.04, 0.1, 0.25));
  const tc = q(822);
  {
    const n = Math.round(0.09 * SR);
    const o = new Float32Array(n);
    const hp = new SVF();
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      ph += (TAU * (95 + 60 * Math.exp(-t / 0.01))) / SR;
      o[i] = (i < 30 ? 1 - i / 30 : 0) * 1.3 + hp.rodar(r() * 2 - 1, 2500, 0.9).hp * Math.exp(-t / 0.004) * 1.2 + Math.sin(ph) * Math.exp(-t / 0.03) * 0.8;
    }
    por(o, tc, 1.0, 0.15, 0.04); // seco: quase sem sala
  }
  por(metal(2150, 0.035, r, {razoes: [1, 1.59, 2.43, 3.3]}), tc, 0.8, 0.15, 0.05);
  por(metal(5200, 0.02, r), tc + 0.006, 0.4, 0.15, 0.05);
  // brilho correndo pelas rondelas, logo depois
  for (let j = 0; j < 4; j++) por(perola(midi(96 + j * 2), r, 1, 0.035), tc + 0.12 + j * 0.05, 0.12, lerp(-0.3, 0.5, j / 3), 0.5);
  // cowbell
  [4, 6, 7, 9, 12, 14].forEach((p, i) => por(cowbell(), compasso(4) + p * passo, 0.42 + i * 0.03, -0.15, 0.2));
  // caixa rufando e ruído subindo até 29,0 s
  for (let j = 0; j < 12; j++) {
    const u = j / 12;
    por(palma(r), compasso(4) + 1.0 + (1 - Math.pow(1 - u, 1.6)) * 0.6, 0.16 + u * 0.3, 0, 0.2);
  }
  por(sopro(1.2, r, 400, 9000, 1.2, (u) => Math.pow(u, 2.4) * (u > 0.98 ? (1 - u) / 0.02 : 1), {curva: 1.4}), 27.8, 0.7, 0, 0.3);

  // PLANO 10: o drop (29,0 s). Impacto, coro em acorde, pérolas acendendo, o brilho da G1.
  {
    const n = Math.round(2.2 * SR);
    const o = new Float32Array(n);
    const hp = new SVF();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      o[i] = hp.rodar(r() * 2 - 1, 5000, 0.7).hp * Math.exp(-t / 0.5) * 0.5; // prato
    }
    por(o, 29.0, 0.5, 0, 0.5);
  }
  porEstereo(coro([55, 58, 62, 67], 1.66, r, {vogal: 'a', ataque: 0.06, solta: 0.12}), 29.0, 0.62, 0.55);
  porEstereo(coro([51, 55, 58, 63], 0.86, r, {vogal: 'a', ataque: 0.05, solta: 0.1}), 30.6, 0.62, 0.55);
  porEstereo(coro([50, 54, 57, 62, 66], 0.62, r, {vogal: 'a', ataque: 0.05, solta: 0.03}), 31.4, 0.66, 0.55);
  porEstereo(coro([67, 74, 79], 3.0, r, {vogal: 'o', ataque: 0.3, solta: 0.03}), 29.0, 0.2, 0.7);
  // as pérolas acendendo: faíscas agudas em sequência
  for (let j = 0; j < 17; j++) por(perola(midi(escala[j % 9] + 12), r, 0.6, 0.03), q(880 + j * 1.3), 0.085, lerp(-0.6, 0.6, (j * 7) % 10 / 10), 0.6);
  // a G1 brilha no punho (30,5 s)
  por(metal(3520, 0.3, r, {razoes: [1, 1.5, 2.0, 2.99, 4.02]}), q(915), 0.26, -0.5, 0.7);
  por(perola(midi(103), r, 1, 0.08), q(915), 0.2, -0.5, 0.7);
  // a luz voltando: ruído que sobe pro sino
  por(sopro(0.7, r, 800, 11000, 1.0, (u) => Math.pow(u, 2.2) * (u > 0.97 ? (1 - u) / 0.03 : 1)), 31.3, 0.5, 0, 0.3);
}

// =====================================================================================
// 9 · PLANO 11 (32 a 36 s): o sino e sua cauda, as contas da G1, um tilintar final
// =====================================================================================
{
  por(sino(midi(55), 2.4), 32.0, 1.0, 0, 0.6);
  por(sino(midi(43), 3.0, {brilho: 0.4}), 32.0, 0.6, 0, 0.5);
  por(bumbo(0.8), 32.0, 0.6, 0, 0.1);
  // as 19 contas da pulseira aparecendo em fila: um zíper de pérolas, bem leve
  for (let i = 0; i < 19; i++) por(perola(midi(84 + ((i * 3) % 12) + Math.floor(i / 4) * 2), r, 0, 0.03), q(960 + 9 + i * 1.25), 0.09, lerp(-0.4, 0.4, i / 18), 0.4);
  // o fecho
  por(metal(2400, 0.03, r), q(960 + 44), 0.16, 0.3, 0.3);
  // tilintar final (34,5 s)
  const tf = q(960 + 75);
  [[98, 0], [103, 0.07], [110, 0.15]].forEach(([m, d], i) => por(perola(midi(m), r, 1, 0.1), tf + d, 0.3 - i * 0.06, i - 1 > 0 ? 0.4 : -0.3 + i * 0.3, 0.8));
  por(metal(4186, 0.25, r), tf, 0.1, 0, 0.8);
}

// =====================================================================================
// REVERB (Freeverb: 8 pentes e 4 passa-tudo por canal) e MASTER
// =====================================================================================
const reverb = (inL, inR) => {
  const esc = SR / 44100;
  const pentes = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const tudo = [556, 441, 341, 225];
  const feito = [new Float32Array(N), new Float32Array(N)];
  [inL, inR].forEach((ent, c) => {
    const abre = c ? 23 : 0;
    const cb = pentes.map((d) => ({buf: new Float32Array(Math.round((d + abre) * esc)), i: 0, filtro: 0}));
    const ap = tudo.map((d) => ({buf: new Float32Array(Math.round((d + abre) * esc)), i: 0}));
    const realim = 0.86;
    const amort = 0.32;
    const out = feito[c];
    for (let n = 0; n < N; n++) {
      const x = (ent[n] + (c ? inL[n] : inR[n]) * 0.3) * 0.015;
      let y = 0;
      for (const k of cb) {
        const v = k.buf[k.i];
        k.filtro = v * (1 - amort) + k.filtro * amort;
        k.buf[k.i] = x + k.filtro * realim;
        if (++k.i >= k.buf.length) k.i = 0;
        y += v;
      }
      for (const k of ap) {
        const v = k.buf[k.i];
        const sai = -y + v;
        k.buf[k.i] = y + v * 0.5;
        if (++k.i >= k.buf.length) k.i = 0;
        y = sai;
      }
      out[n] = y;
    }
  });
  return feito;
};
console.log('reverb...');
const [molhL, molhR] = reverb(sala.L, sala.R);
const mixL = new Float32Array(N);
const mixR = new Float32Array(N);
{
  // passa-alta em 28 Hz, fade no fim
  const hL = new SVF();
  const hR = new SVF();
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const fade = Math.min(1, t / 0.02) * Math.min(1, (DUR - t) / 0.35);
    mixL[i] = hL.rodar(seco.L[i] + molhL[i] * 1.0, 28, 0.7).hp * fade;
    mixR[i] = hR.rodar(seco.R[i] + molhR[i] * 1.0, 28, 0.7).hp * fade;
  }
}

// limitador com antecipação: segura os picos sem distorcer
const limitar = (L, R, ganho) => {
  const oL = new Float32Array(N);
  const oR = new Float32Array(N);
  const ant = Math.round(0.005 * SR);
  const solta = Math.exp(-1 / (0.09 * SR));
  let g = 1;
  let reducaoMax = 0;
  // pico à frente (janela deslizante simples)
  const pico = new Float32Array(N);
  for (let i = 0; i < N; i++) pico[i] = Math.max(Math.abs(L[i]), Math.abs(R[i])) * ganho;
  const frente = new Float32Array(N);
  let m = 0;
  const fila = [];
  for (let i = 0; i < N + ant; i++) {
    if (i < N) {
      while (fila.length && pico[fila[fila.length - 1]] <= pico[i]) fila.pop();
      fila.push(i);
    }
    const j = i - ant;
    if (j >= 0) {
      while (fila.length && fila[0] < j) fila.shift();
      frente[j] = fila.length ? pico[fila[0]] : 0;
    }
  }
  for (let i = 0; i < N; i++) {
    const alvo = frente[i] > TETO ? TETO / frente[i] : 1;
    g = alvo < g ? Math.max(alvo, g - (g - alvo) * 0.25 - 0.0005) : alvo + (g - alvo) * solta;
    if (g > alvo && frente[i] * g > TETO) g = alvo;
    reducaoMax = Math.max(reducaoMax, 1 - g);
    oL[i] = Math.max(-TETO, Math.min(TETO, L[i] * ganho * g));
    oR[i] = Math.max(-TETO, Math.min(TETO, R[i] * ganho * g));
  }
  return {L: oL, R: oR, reducaoDb: -20 * Math.log10(1 - reducaoMax)};
};

const gravar = (L, R, arq) => {
  const dados = Buffer.alloc(N * 4);
  const rd = mulberry(4242);
  for (let i = 0; i < N; i++) {
    // dither triangular
    const dl = (rd() - rd()) / 32768;
    const dr = (rd() - rd()) / 32768;
    dados.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((L[i] + dl) * 32767))), i * 4);
    dados.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((R[i] + dr) * 32767))), i * 4 + 2);
  }
  const cab = Buffer.alloc(44);
  cab.write('RIFF', 0);
  cab.writeUInt32LE(36 + dados.length, 4);
  cab.write('WAVEfmt ', 8);
  cab.writeUInt32LE(16, 16);
  cab.writeUInt16LE(1, 20);
  cab.writeUInt16LE(2, 22);
  cab.writeUInt32LE(SR, 24);
  cab.writeUInt32LE(SR * 4, 28);
  cab.writeUInt16LE(4, 32);
  cab.writeUInt16LE(16, 34);
  cab.write('data', 36);
  cab.writeUInt32LE(dados.length, 40);
  fs.writeFileSync(arq, Buffer.concat([cab, dados]));
};
const medir = (arq) => {
  const p = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', arq, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'});
  const txt = p.stderr || '';
  const resumo = txt.slice(txt.lastIndexOf('Summary:'));
  const I = /I:\s+(-?[\d.]+) LUFS/.exec(resumo);
  const LRA = /LRA:\s+(-?[\d.]+) LU/.exec(resumo);
  const pk = /Peak:\s+(-?[\d.]+) dBFS/.exec(resumo);
  if (!I) throw new Error('não consegui medir o loudness com o ffmpeg:\n' + txt.slice(-600));
  return {lufs: parseFloat(I[1]), lra: LRA ? parseFloat(LRA[1]) : null, pico: pk ? parseFloat(pk[1]) : null};
};

// pico bruto e primeiro ganho
let picoBruto = 0;
for (let i = 0; i < N; i++) picoBruto = Math.max(picoBruto, Math.abs(mixL[i]), Math.abs(mixR[i]));
let ganho = 0.9 / picoBruto;
let med = null;
for (let volta = 0; volta < 6; volta++) {
  const lim = limitar(mixL, mixR, ganho);
  gravar(lim.L, lim.R, SAIDA);
  med = medir(SAIDA);
  console.log(`volta ${volta + 1}: ganho ${(20 * Math.log10(ganho)).toFixed(2)} dB · ${med.lufs} LUFS · pico real ${med.pico} dBFS · LRA ${med.lra} LU · limitador até ${lim.reducaoDb.toFixed(1)} dB`);
  const erro = ALVO_LUFS - med.lufs;
  if (Math.abs(erro) <= 0.15) break;
  ganho *= Math.pow(10, erro / 20);
}
console.log(`trilha: ${SAIDA}`);
console.log(`duração ${DUR} s · ${SR} Hz estéreo · integrado ${med.lufs} LUFS · pico real ${med.pico} dBFS`);
