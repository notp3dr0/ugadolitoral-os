import { interpolateColors } from "remotion";
import { track } from "../data/scenes";
import { SKY_KEYS } from "../theme";
import { clamp } from "../utils/animation";

// Hora do dia a partir da trilha sky.time (lida em módulo 1: 0 meia-noite, 0.25 amanhecer, 0.5 meio-dia).
// "night" vai de 0 (dia de garoa) a 1 (noite): acende janelas, postes, neon e esfria a luz.

const mod1 = (v: number) => ((v % 1) + 1) % 1;

export const skyTime = (frame: number) => mod1(track("sky.time", frame, 0.95));

export const skyColors = (frame: number): [string, string, string] => {
  const t = skyTime(frame);
  let i = 0;
  while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1].t <= t) i++;
  const a = SKY_KEYS[i];
  const b = SKY_KEYS[i + 1];
  const k = clamp((t - a.t) / Math.max(1e-6, b.t - a.t), 0, 1);
  return [0, 1, 2].map((j) => interpolateColors(k, [0, 1], [a.c[j], b.c[j]])) as [string, string, string];
};

export const nightness = (frame: number) => {
  const t = skyTime(frame);
  if (t < 0.2 || t > 0.86) return 1;
  if (t < 0.32) return 1 - (t - 0.2) / 0.12;
  if (t > 0.74) return (t - 0.74) / 0.12;
  return 0;
};

/** 1 no amanhecer e no fim de tarde (luz alaranjada), 0 no resto. */
export const goldenness = (frame: number) => {
  const t = skyTime(frame);
  const d1 = 1 - Math.abs(t - 0.27) / 0.07;
  const d2 = 1 - Math.abs(t - 0.79) / 0.07;
  return clamp(Math.max(d1, d2), 0, 1);
};
