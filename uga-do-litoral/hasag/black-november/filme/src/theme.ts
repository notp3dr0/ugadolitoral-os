// Régua do filme: cor, tempo e medidas do símbolo. Tudo que os planos compartilham mora aqui.

export const FPS = 24;
export const W = 1080;
export const H = 1920;

// 144 BPM: um tempo = 10 frames a 24 fps. Todo corte e todo som cai em frame inteiro.
export const BEAT = 10;

// Movimento a 24 qps com easing. Corte seco só na totalidade (o golpe) e no clique do punho.

export const C = {
  paper: "#F2F1ED", // off-white das fotos da loja
  red: "#AF0C05", // vermelho do símbolo (do vetor; falta o oficial)
  redShade: "#7C0903", // sombra chapada sobre vermelho
  black: "#0A0A0A",
  cloud: "#E3E1DA",
  // o céu escurecendo, do dia ao instante antes da totalidade
  sky: ["#F2F1ED", "#DCDAD4", "#C4C1BA", "#ABA8A0", "#9C9991", "#8A877F"],
  eclipseSky: "#5A0A06", // totalidade: o vermelho escurecido
  eclipseDeep: "#3A0603", // forma em sombra dentro da totalidade
  pearlDim: "#756E69", // pérola na totalidade, antes do crescente
};

// Medidas tiradas do vetor do símbolo (viewBox 522 x 311).
export const SIM = {
  w: 522,
  h: 311,
  disco: {cx: 260.6, cy: 155, r: 70.8}, // o vão redondo
  sol: {cx: 261.2, cy: 155.5, r: 68.2},
  luaR: 76.9, // 13% maior que o sol: o eclipse fecha inteiro
  dxSimbolo: 28.2, // deslocamento da lua no desenho do símbolo (filete de 14%)
};

// Proporção do crescente do símbolo, reaplicada em cada pérola.
export const CRESCENTE = {razaoLua: SIM.luaR / SIM.sol.r, desloc: SIM.dxSimbolo / SIM.sol.r};

// Planos em frames (24 fps). Fonte única: a trilha em scripts/trilha.py usa os mesmos números.
export const PLANOS = {
  p1: {from: 0, dur: 50},
  p2: {from: 50, dur: 50},
  p3: {from: 100, dur: 44},
  p4: {from: 144, dur: 16},
  p5: {from: 160, dur: 80},
  p6: {from: 240, dur: 80},
  p7: {from: 320, dur: 40},
  p8: {from: 360, dur: 96},
};
export const TOTAL = 456;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// rampa 0..1 entre dois frames
export const ramp = (f: number, a: number, b: number) => clamp((f - a) / (b - a), 0, 1);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
// passa um pouco do ponto e volta: entrada de peça
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = clamp(t, 0, 1);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
};
export const paleta = (cores: string[], t: number) => {
  const x = clamp(t, 0, 1) * (cores.length - 1);
  const i = Math.min(cores.length - 2, Math.floor(x));
  return mix(cores[i], cores[i + 1], x - i);
};
// soco de câmera: um pulo de escala que decai, marcado na batida
export const soco = (f: number, em: number[], amp = 0.035, tau = 3) =>
  em.reduce((acc, a) => acc + (f >= a ? amp * Math.exp(-(f - a) / tau) : 0), 0);
export const zoomEm = (x: number, y: number, s: number) => `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// balanço amortecido que começa em f0: amplitude * e^(-t/tau) * sin(2pi t/periodo)
export const balanco = (f: number, f0: number, amp: number, periodo: number, tau: number, fase = 0) => {
  const t = f - f0;
  if (t < 0) return 0;
  return amp * Math.exp(-t / tau) * Math.sin((2 * Math.PI * t) / periodo + fase);
};
