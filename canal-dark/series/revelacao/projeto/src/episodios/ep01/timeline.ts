import falasJson from "./falas.json";
import voJson from "./vo.json";
import type { Word } from "../../engine/Captions";
import { FPS } from "../../theme";

// Linha do tempo do EP01, derivada da narração REAL (vo.json, medido palavra por palavra).
// Sem vo.json, estima a duração pela contagem de palavras, pra dar pra montar antes da voz.

type VoWord = { text: string; start: number; end: number };
type VoLine = { text: string; seconds: number; words: VoWord[] };
const FALAS = falasJson as Record<string, string>;
const VO = voJson as Record<string, VoLine>;

export type BeatId =
  | "letreiro" | "cais" | "entra" | "relogio" | "camera" | "lab" | "bandeja" | "emerge" | "carimbo"
  | "hud" | "pov" | "preto" | "flash" | "segunda" | "interruptor" | "escolha" | "fecho";

type BeatDef = { id: BeatId; falas: string[]; min: number; inT: "cut" | "dissolve" | "fadeblack"; inS?: number; outBlack?: number; captions?: boolean };

// ordem e intenção dos planos: ver ../../../../episodios/ep01/roteiro.md
const DEFS: BeatDef[] = [
  { id: "letreiro", falas: ["f01"], min: 3.6, inT: "fadeblack", inS: 0.6 },
  { id: "cais", falas: ["f02"], min: 4.2, inT: "dissolve", inS: 0.5 },
  { id: "entra", falas: ["f03"], min: 5.8, inT: "dissolve", inS: 0.4 },
  { id: "relogio", falas: ["f04"], min: 4.6, inT: "cut" },
  { id: "camera", falas: ["f05"], min: 5.2, inT: "cut" },
  { id: "lab", falas: ["f06"], min: 5.0, inT: "dissolve", inS: 0.4 },
  { id: "bandeja", falas: ["f07"], min: 2.6, inT: "cut" },
  { id: "emerge", falas: ["f08", "f09"], min: 6.0, inT: "dissolve", inS: 0.3 },
  { id: "carimbo", falas: ["f10"], min: 3.2, inT: "cut" },
  { id: "hud", falas: ["f11"], min: 2.6, inT: "cut" },
  { id: "pov", falas: ["f12"], min: 5.0, inT: "cut" },
  { id: "preto", falas: [], min: 0.45, inT: "cut" }, // SILÊNCIO TOTAL
  { id: "flash", falas: [], min: 1.5, inT: "cut" },
  { id: "segunda", falas: ["f13"], min: 6.0, inT: "dissolve", inS: 0.6 },
  { id: "interruptor", falas: ["f14"], min: 4.4, inT: "cut" },
  { id: "escolha", falas: ["f15"], min: 6.2, inT: "dissolve", inS: 0.4, captions: false },
  { id: "fecho", falas: ["f16"], min: 4.2, inT: "fadeblack", inS: 0.4, outBlack: 0.6, captions: false },
];

const LEAD = 0.3; // a fala começa este tanto depois do corte
const GAP = 0.35; // entre duas falas do mesmo plano
const TAIL = 0.45; // respiro depois da última fala

/** destaque da legenda (uma ou duas por fala); compara sem pontuação e sem caixa */
const HI: Record<string, string[]> = {
  f01: ["fotografia"], f02: ["cais", "onze"], f03: ["arquivo"], f04: ["parado", "dezessete"], f05: ["câmera", "seis"],
  f06: ["vermelha", "queima"], f07: ["primeira"], f08: ["aparecendo"], f09: ["sala", "dentro"], f10: ["dezessete"],
  f11: ["dez"], f12: ["canto", "ninguém"], f13: ["segunda", "costas"], f14: ["branca", "sabe"],
};

const clean = (s: string) => s.toLowerCase().replace(/[.,!?:;]/g, "");

const lineOf = (key: string): VoLine => {
  const real = VO[key];
  if (real) return real;
  const ws = FALAS[key].split(/\s+/);
  let t = 0;
  const words = ws.map((w) => {
    const d = 0.18 + w.length * 0.045;
    const o = { text: w, start: t, end: t + d };
    t += d + 0.04;
    return o;
  });
  return { text: FALAS[key], seconds: t + 0.1, words };
};

export const HAS_VO = Object.keys(FALAS).every((k) => VO[k] !== undefined);

export type Beat = BeatDef & { from: number; dur: number; vo: { key: string; at: number; seconds: number }[] };

export const BEATS: Beat[] = (() => {
  let t = 0;
  return DEFS.map((d) => {
    let cur = LEAD;
    const vo = d.falas.map((k, i) => {
      const l = lineOf(k);
      const at = t + cur;
      cur += l.seconds + (i < d.falas.length - 1 ? GAP : 0);
      return { key: k, at, seconds: l.seconds };
    });
    const need = d.falas.length ? cur + TAIL : 0;
    const dur = Math.max(d.min, need);
    const b = { ...d, from: t, dur, vo };
    t += dur;
    return b;
  });
})();

export const beat = (id: BeatId) => BEATS.find((b) => b.id === id)!;
export const SECONDS = BEATS[BEATS.length - 1].from + BEATS[BEATS.length - 1].dur;
export const DURATION = Math.round(SECONDS * FPS);

/** Palavras da legenda com tempo absoluto (s). */
export const WORDS: Word[] = BEATS.filter((b) => b.captions !== false).flatMap((b) =>
  b.vo.flatMap(({ key, at }) =>
    lineOf(key).words.map((w) => ({ t: w.text, from: at + w.start, to: at + w.end, hi: (HI[key] ?? []).includes(clean(w.text)) })),
  ),
);

/** Tempo absoluto (s) de uma palavra de uma fala (pra sincronizar cartões). */
export const wordAt = (key: string, word: string) => {
  const b = BEATS.find((x) => x.vo.some((v) => v.key === key));
  const v = b?.vo.find((x) => x.key === key);
  const w = lineOf(key).words.find((x) => clean(x.text) === clean(word));
  return v && w ? v.at + w.start : undefined;
};
