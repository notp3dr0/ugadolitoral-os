import { Easing, interpolate, random } from "remotion";

// Tudo aqui é função pura do frame: nenhum Math.random(), nenhum relógio.
// Qualquer frame pode ser renderizado isolado e sai igual.

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const EASE = {
  linear: (t: number) => t,
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.45, 0, 0.25, 1),
  // freada seca, usada em recuo de tiro e pancada
  hit: Easing.bezier(0.1, 0.9, 0.2, 1),
} as const;
export type EaseName = keyof typeof EASE;

/** Progresso 0→1 entre dois frames, com easing. */
export const prog = (frame: number, a: number, b: number, ease: (t: number) => number = EASE.inOut) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** Ruído suave determinístico (soma de senos com fases sorteadas pela semente). */
export const noise = (t: number, seed: string | number) => {
  const p1 = random(`${seed}-a`) * 6.28;
  const p2 = random(`${seed}-b`) * 6.28;
  const p3 = random(`${seed}-c`) * 6.28;
  return (Math.sin(t * 1.0 + p1) * 0.5 + Math.sin(t * 2.3 + p2) * 0.3 + Math.sin(t * 4.1 + p3) * 0.2);
};

export const sec = (s: number, fps = 30) => Math.round(s * fps);
