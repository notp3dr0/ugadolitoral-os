import { scenes, sceneAt, track } from "../data/scenes";
import { clamp, lerp, rand, smoothstep, type Vec3 } from "../utils/animation";

// Posições do sistema como funções puras do frame GLOBAL. O mundo 3D e os rótulos 2D leem daqui,
// então rótulo e objeto nunca se desencontram.

export const v3 = {
  add: (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  scale: (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k],
  lerp: (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
  len: (a: Vec3) => Math.hypot(a[0], a[1], a[2]),
  sub: (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
};

/** Índice da cena ativa no frame global. */
export const sceneIndex = (frame: number) => scenes.indexOf(sceneAt(frame));

/** Frame global em que começa a 1ª animação de um alvo (para efeitos que vivem depois dela). */
export const animStart = (target: string) => {
  for (const sc of scenes) {
    const a = sc.animations.find((x) => x.target === target);
    if (a) return sc.startFrame + a.startFrame;
  }
  return Infinity;
};

// ---------------------------------------------------------------- quarto e João Gabriel
export const JG_HEAD: Vec3 = [-1.4, 1.1, 0.35];
export const EAR: Vec3 = [-0.98, 1.2, 0.62];

// ---------------------------------------------------------------- raquete
/** Peças internas, em coordenadas locais da raquete (origem na junção cabo/cabeça). */
export const PART = {
  battery: [0, -0.98, 0.0] as Vec3,
  osc: [0.05, -0.7, 0.035] as Vec3,
  transformer: [-0.035, -0.58, 0.045] as Vec3,
  multBottom: [0, -0.48, 0.04] as Vec3,
  multTop: [0, -0.26, 0.04] as Vec3,
  capacitor: [0, -0.16, 0.05] as Vec3,
  led: [0, -0.05, 0.145] as Vec3,
  neck: [0, 0.1, 0] as Vec3,
  headCenter: [0, 0.86, 0] as Vec3,
};

export const HEAD_RX = 0.6;
export const HEAD_RY = 0.74;

export type RacketPose = { position: Vec3; rotZ: number; rotY: number; scale: number };

const ROOM_POSE = (sw: number): RacketPose => ({ position: [0.32 - 0.4 * sw, 0.78, 0.62], rotZ: -0.32 + 0.52 * sw, rotY: 0.25 - 0.15 * sw, scale: 1 });
const BENCH_POSE: RacketPose = { position: [0, 1.2, 0], rotZ: 0, rotY: 0, scale: 1 };
const STAND_POSE: RacketPose = { position: [-2.78, 1.42, 0.32], rotZ: 0.14, rotY: 0.3, scale: 0.55 };

const mixPose = (a: RacketPose, b: RacketPose, t: number): RacketPose => ({
  position: v3.lerp(a.position, b.position, t),
  rotZ: lerp(a.rotZ, b.rotZ, t),
  rotY: lerp(a.rotY, b.rotY, t),
  scale: lerp(a.scale, b.scale, t),
});

export const racketPose = (frame: number): RacketPose => {
  const sw = smoothstep(track("racket.swing", frame));
  const t = track("racket.toBench", frame);
  const enter = track("racket.enter", frame);
  let pose: RacketPose;
  if (t <= 1) pose = mixPose(ROOM_POSE(sw), BENCH_POSE, smoothstep(t));
  else pose = mixPose(BENCH_POSE, STAND_POSE, smoothstep(t - 1));
  // entrada: cai de cima com mola
  if (enter < 1) pose = { ...pose, position: v3.add(pose.position, [0, (1 - enter) * 1.2, 0]), scale: pose.scale * clamp(enter * 1.15, 0, 1.15) };
  return pose;
};

/** Converte um ponto local da raquete para o mundo (rotação Y depois Z, como no grupo 3D). */
export const racketToWorld = (pose: RacketPose, local: Vec3): Vec3 => {
  const [x0, y0, z0] = v3.scale(local, pose.scale);
  // grupo: rotation={[0, rotY, rotZ]} com ordem XYZ → aplica Z, depois Y
  const cz = Math.cos(pose.rotZ);
  const sz = Math.sin(pose.rotZ);
  const x1 = x0 * cz - y0 * sz;
  const y1 = x0 * sz + y0 * cz;
  const cy = Math.cos(pose.rotY);
  const sy = Math.sin(pose.rotY);
  const x2 = x1 * cy + z0 * sy;
  const z2 = -x1 * sy + z0 * cy;
  return v3.add(pose.position, [x2, y1, z2]);
};

/** Afastamento das redes externas (z local) conforme a vista explodida. */
export const outerZ = (frame: number) => 0.05 + 0.4 * track("racket.explode", frame);

// ---------------------------------------------------------------- mão
const H_DOWN: Vec3 = [-0.45, 0.72, 0.75];
const H_UP: Vec3 = [-0.72, 1.78, 0.82];
const H_CHEEK: Vec3 = [-1.06, 1.02, 0.62];

export type HandPose = { position: Vec3; rotZ: number; rotY: number; scale: number; pointing: number; opacity: number };

export const handPose = (frame: number): HandPose => {
  const i = sceneIndex(frame);
  const dim = track("bedroom.dim", frame);
  if (i <= 1) {
    const raise = track("hand.raise", frame);
    let p = v3.lerp(H_DOWN, H_UP, raise);
    if (i === 1) {
      const slap = track("hand.slap", frame);
      const rew = track("slowmo.rewind", frame);
      const rep = track("airWave.progress", frame);
      if (rep > 0) p = v3.lerp(H_UP, H_CHEEK, rep);
      else if (rew > 0) p = v3.lerp(H_CHEEK, H_UP, rew);
      else p = v3.lerp(H_UP, H_CHEEK, slap);
    }
    return { position: p, rotZ: 0.5, rotY: -0.6, scale: i === 1 ? 1 : clamp(raise * 3, 0, 1), pointing: 0, opacity: 1 };
  }
  if (i <= 4) {
    const pose = racketPose(frame);
    const grip = racketToWorld({ ...pose, scale: 1 }, [0.0, -0.62, 0.12]);
    const enter = i === 2 ? track("racket.enter", frame) : 1;
    const p = v3.lerp(H_CHEEK, grip, clamp(enter, 0, 1));
    return { position: p, rotZ: pose.rotZ + 0.2, rotY: pose.rotY - 0.4, scale: 0.85, pointing: 0, opacity: 1 - dim };
  }
  // cena 10: o dedo curioso
  const fin = track("hand.finger", frame);
  const rec = track("hand.recoil", frame);
  const far: Vec3 = [1.7, 1.35, 0.8];
  const near: Vec3 = [0.56, 1.9, 0.34];
  const touch: Vec3 = [0.44, 1.94, 0.2];
  let p = fin <= 0.8 ? v3.lerp(far, near, fin / 0.8) : v3.lerp(near, touch, (fin - 0.8) / 0.2);
  if (rec > 0) {
    const back: Vec3 = [1.05, 1.62, 0.62];
    p = v3.lerp(p, back, clamp(rec, 0, 1.2));
    const shake = Math.max(0, 1 - rec) * 0.05 + 0.012;
    p = v3.add(p, [Math.sin(frame * 2.1) * shake, Math.cos(frame * 1.7) * shake, 0]);
  }
  return { position: p, rotZ: 1.25, rotY: -0.5, scale: 0.85, pointing: 1, opacity: 1 };
};

// ---------------------------------------------------------------- mosquito
const M_START: Vec3 = [1.9, 2.3, 1.3];
const DODGE: Vec3 = [0.18, 0.32, 0.02];
const SURF_END: Vec3 = [-0.12, 1.55, 0.66];

const hover = (frame: number, amp: number): Vec3 => [
  amp * Math.sin(frame * 0.37) + amp * 0.5 * Math.sin(frame * 0.91 + 1),
  amp * 0.8 * Math.cos(frame * 0.53) + amp * 0.3 * Math.sin(frame * 1.3),
  amp * 0.6 * Math.sin(frame * 0.29 + 2),
];

/** Ponto no vão entre a rede do meio (z=0) e a externa da frente, no mundo. */
const gapPoint = (frame: number): Vec3 => {
  const pose = racketPose(frame);
  return racketToWorld(pose, [0.14, 1.0, outerZ(frame) / 2]);
};

export type MosquitoState = { position: Vec3; visible: boolean };

export const mosquitoPos = (frame: number): Vec3 => {
  const i = sceneIndex(frame);
  if (i === 0) {
    const t = track("mosquito.path", frame);
    // zigue-zague que diminui ao chegar (ruído determinístico)
    const zig: Vec3 = [Math.sin(frame * 0.45) * 0.35 * (1 - t), Math.sin(frame * 0.7 + 1) * 0.25 * (1 - t), 0];
    return v3.add(v3.add(v3.lerp(M_START, EAR, smoothstep(t)), zig), hover(frame, 0.03));
  }
  if (i === 1) {
    const slap = track("hand.slap", frame);
    const surf = track("mosquito.surf", frame);
    const base = v3.add(EAR, v3.scale(DODGE, smoothstep(clamp(slap * 1.6, 0, 1))));
    const arc: Vec3 = [0, Math.sin(surf * Math.PI) * 0.18, 0];
    return v3.add(v3.add(v3.lerp(base, SURF_END, surf), arc), hover(frame, 0.02 * (1 - surf) + 0.012));
  }
  const netPoint = (f: number) => racketToWorld(racketPose(f), [0.05, 0.95, 0.07]);
  if (i === 2) {
    const c = track("mosquito.caught", frame);
    return v3.add(v3.lerp(SURF_END, netPoint(frame), smoothstep(c)), hover(frame, 0.015 * (1 - c)));
  }
  if (i === 3) {
    const b = track("mosquito.bounce", frame);
    const back = track("mosquito.back", frame);
    const bounced = v3.add(netPoint(frame), v3.scale([0.25, 0.32, 0.35], b));
    const arc: Vec3 = [0, Math.sin(back * Math.PI) * 0.3, 0];
    return v3.add(v3.add(v3.lerp(bounced, EAR, smoothstep(back)), arc), hover(frame, 0.02));
  }
  if (i >= 8 && i <= 9) {
    const e = track("mosquito.enter", frame);
    const from: Vec3 = [0.95, 2.75, 0.7];
    const g = gapPoint(frame);
    const dead = track("mosquito.charred", frame) > 0.5;
    return v3.add(v3.lerp(from, g, smoothstep(e)), dead ? [0, 0, 0] : hover(frame, 0.012 * (1 - track("mosquito.bridge", frame))));
  }
  if (i === 10) {
    const rise = track("mosquito.ghostRise", frame);
    const start: Vec3 = [-0.2, 1.9, 0.4];
    const end: Vec3 = [-0.75, 2.45, -1.35];
    const wob: Vec3 = [Math.sin(frame * 0.12) * 0.12, 0, 0];
    return v3.add(v3.lerp(start, end, rise), wob);
  }
  return [0, -10, 0];
};

/** Direção do voo (para virar o corpo): yaw em torno de Y; parado, encara a câmera (+z). */
export const mosquitoYaw = (frame: number) => {
  const i = sceneIndex(frame);
  if (i >= 8) return -Math.PI / 2;
  const a = mosquitoPos(frame - 3);
  const b = mosquitoPos(frame);
  const d = v3.sub(b, a);
  const speed = Math.hypot(d[0], d[2]);
  const heading = Math.atan2(-d[2], d[0]);
  const w = clamp(speed / 0.05, 0, 1);
  const rest = -Math.PI / 2 + 0.5;
  // escolhe o caminho angular mais curto
  let delta = heading - rest;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return rest + delta * w;
};

export const seeded = (seed: string) => rand(seed);
