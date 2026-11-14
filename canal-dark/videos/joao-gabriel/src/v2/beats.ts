// v2: tudo é disparado pela palavra. falas.json tem a duração de cada fala e o tempo de cada palavra
// (transcrição do VoiceStudio, já com o silêncio das pontas cortado).
import falas from "./falas.json";

export const FPS = 30;
type Fala = { dur: number; texto: string; words: { w: string; s: number; e: number }[] };
const F = falas as Record<string, Fala>;

// ordem das falas e o respiro (s) antes de cada uma: o respiro antes do soco é o que dá o tempo da piada
const ORDEM: [string, number][] = [["h1", 0.15], ["h2", 0.3], ["a1", 0.45], ["a2", 0.5]];
export const VOZ: Record<string, number> = {};
let cur = 0;
for (const [k, respiro] of ORDEM) { cur += respiro; VOZ[k] = cur; cur += F[k].dur; }
export const FIM = cur + 1.1;

// tempo absoluto (s) do início da palavra i da fala k
export const w = (k: string, i: number) => VOZ[k] + F[k].words[i].s;
export const fim = (k: string) => VOZ[k] + F[k].dur;

// planos (corte seco entre eles)
export const PLANOS = [
  { id: "bar", de: 0 },
  { id: "pc", de: VOZ.h2 - 0.05 },
  { id: "tela", de: w("h2", 4) },             // "Senna": corta pra tela no nome
  { id: "zap", de: VOZ.a1 - 0.1 },
  { id: "zap-tarde", de: VOZ.a2 - 0.12 },     // corte seco antes de "Faz três horas"
].map((p, i, arr) => ({ ...p, ate: i + 1 < arr.length ? arr[i + 1].de : FIM }));

export const planoEm = (t: number) => {
  const p = PLANOS.find((x) => t >= x.de && t < x.ate) ?? PLANOS[PLANOS.length - 1];
  return { ...p, local: t - p.de, len: p.ate - p.de };
};

// legenda em blocos de 1–3 palavras; o texto exibido corrige o que a transcrição ouviu errado
const BLOCOS: [string, number[], string[]][] = [
  ["h1", [0, 1], ["TODO", "GRUPO"]], ["h1", [2, 3], ["DE", "AMIGOS"]], ["h1", [4, 5], ["TEM", "UM"]], ["h1", [6, 7], ["JOÃO", "GABRIEL"]],
  ["h2", [0, 1], ["ESSE", "AQUI"]], ["h2", [2, 3], ["JOGA", "DE"]], ["h2", [4, 5], ["SENNA", "MID"]],
  ["a1", [0, 1], ["ELE", "SEMPRE"]], ["a1", [2, 3], ["CHEGA", "EM"]], ["a1", [4, 5], ["10", "MINUTOS"]],
  ["a2", [0, 1, 2], ["FAZ", "TRÊS", "HORAS"]],
];
export const LEGENDA = BLOCOS.map(([k, idx, txt], i, arr) => {
  const de = w(k, idx[0]);
  const prox = arr[i + 1];
  const ate = prox && prox[0] === k ? w(prox[0], prox[1][0]) : fim(k) + 0.25;
  return { de, ate, palavras: txt.map((t, j) => ({ t, s: w(k, idx[j]) })), destaque: ["JOÃO", "GABRIEL", "SENNA", "MID", "10", "TRÊS", "HORAS"] };
});

// efeitos: [arquivo, tempo, volume]
export const SFX: [string, number, number][] = [
  ["whoosh", 0, 0.5],
  ["ding", w("h1", 6), 0.55],
  ["boom", w("h1", 6), 0.6],
  ["whoosh", VOZ.h2 - 0.12, 0.45],
  ["scratch", w("h2", 4) - 0.02, 0.5],
  ["boom", w("h2", 4), 0.55],
  ["whoosh", VOZ.a1 - 0.18, 0.4],
  ["pop", w("a1", 4), 0.6],
  ["boom", VOZ.a2 - 0.12, 0.7],
  ["pop", fim("a2") + 0.05, 0.5],
  ["pop", fim("a2") + 0.3, 0.5],
  ["pop", fim("a2") + 0.52, 0.5],
];
