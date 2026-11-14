import { random } from "remotion";
import { scenes, track } from "../data/scenes";
import { clamp, lerp, type Vec3 } from "../utils/animation";
import { wordLocal } from "../utils/timing";

// Geometria compartilhada pelo mundo 3D, pelo sensor e pelo card de resultado.
// Eixo óptico em x: skatista em x = −9 (um pouco para trás, z = −2), sensor em x = SENSOR_X.

export const SUBJECT_POS: Vec3 = [-9, 0, -2];
export const SENSOR_X = 1.17;
export const OPENING_X = -0.9;
export const LENS_X = -1.75;
export const SENSOR_HALF = { y: 0.38, z: 0.57 };
export const GRID = { cols: 24, rows: 16 };

/** Altura dos três pontos do skatista que soltam raios (topo, meio, base), sem o salto. */
export const SOURCE_Y = [0.35, -0.45, -1.3];
export const RAY_COLORS = ["#ff4a3d", "#f2f0eb", "#3b6cff"];

/** O skatista começa a dar ollie em "skatista" (cena 5) e não para mais; ciclo de 36 frames. */
const JUMP0 = scenes[4].startFrame + wordLocal("s5", 11);
export const JUMP_PERIOD = 36;
export const jumpPhase = (frame: number) => (frame < JUMP0 ? 0 : ((frame - JUMP0) / JUMP_PERIOD) % 1);
export const jumpHeight = (phase: number) => Math.sin(Math.PI * phase) * 0.95;

/** Frame em que o obturador congela a foto (cena 6, "congela"). */
export const FREEZE_AT = scenes[5].startFrame + wordLocal("s6", 15);

/** Estado da "foto" no frame: o mesmo para o sensor e para o card. */
export const photoState = (frame: number) => {
  const frozen = frame >= FREEZE_AT;
  return {
    focus: track("photo.focus", frame),
    exposure: track("photo.exposure", frame),
    blur: track("photo.blur", frame),
    noise: track("photo.noise", frame),
    // a foto mostra o skatista no ar depois do clique; antes, no ponto atual do salto
    phase: frozen ? 0.5 : jumpPhase(frame),
  };
};

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const SKY_TOP = hex("#2b1a3a");
const SKY_LOW = hex("#ff8a4a");
const SUN = hex("#ffe0a0");
const RAMP = hex("#7d7a76");
const SHIRT = hex("#f2f0eb");
const PANTS = hex("#2d3a55");
const SKIN = hex("#c98f6a");
const CAP = hex("#e5372b");
const BOARD = hex("#d8a24a");

/** Skatista de pé, coordenadas da foto (u: 0 esq → 1 dir; v: 0 baixo → 1 topo). */
const skater = (u: number, v: number, lift: number): RGB | null => {
  const y = v - lift;
  if (Math.abs(u - 0.5) < 0.14 && y > 0.3 && y < 0.34) return BOARD;
  if (Math.abs(u - 0.5) < 0.05 && y > 0.34 && y < 0.5) return PANTS;
  if (Math.abs(u - 0.5) < 0.065 && y > 0.5 && y < 0.68) return SHIRT;
  if (Math.abs(u - 0.5) < 0.04 && y > 0.68 && y < 0.76) return SKIN;
  if (Math.abs(u - 0.5) < 0.05 && y > 0.76 && y < 0.8) return CAP;
  return null;
};

/** Cor da cena no ponto (u, v) da foto, com o skatista na fase do salto. */
const sceneColor = (u: number, v: number, phase: number): RGB => {
  let c: RGB;
  if (v < 0.3) c = RAMP;
  else {
    c = mix(SKY_LOW, SKY_TOP, clamp((v - 0.3) / 0.7, 0, 1));
    const d = Math.hypot(u - 0.24, (v - 0.72) * 1.4);
    if (d < 0.1) c = SUN;
  }
  const s = skater(u, v, jumpHeight(phase) * 0.18);
  return s ?? c;
};

/** Foto final no ponto (u, v): exposição, rastro do movimento e ruído aplicados. */
export const photoColor = (u: number, v: number, frame: number, seed: number): RGB => {
  const st = photoState(frame);
  let c = sceneColor(u, v, st.phase);
  if (st.blur > 0.01) {
    // rastro: média do skatista em vários pontos do salto
    const acc: RGB = [0, 0, 0];
    const n = 6;
    for (let k = 0; k < n; k++) {
      const g = sceneColor(u, v, (st.phase - k * 0.09 + 1) % 1);
      acc[0] += g[0] / n;
      acc[1] += g[1] / n;
      acc[2] += g[2] / n;
    }
    c = mix(c, acc, st.blur);
  }
  const gain = Math.pow(2, st.exposure * 0.85);
  c = [c[0] * gain, c[1] * gain, c[2] * gain];
  if (st.exposure > 0) c = mix(c, [1, 1, 1], clamp(st.exposure / 2.2, 0, 1) * 0.75);
  if (st.noise > 0.01) {
    const n = st.noise * 0.55;
    c = [
      c[0] + (random(`r${seed}-${frame}`) - 0.5) * n,
      c[1] + (random(`g${seed}-${frame}`) - 0.5) * n,
      c[2] + (random(`b${seed}-${frame}`) - 0.5) * n,
    ];
  }
  return [clamp(c[0], 0, 1), clamp(c[1], 0, 1), clamp(c[2], 0, 1)];
};

export const toCss = (c: RGB) => `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;
export type { RGB };
export const PALE: RGB = hex("#d9d3c9");
export const DARK_SITE: RGB = hex("#14221b");
export const mixRGB = mix;
