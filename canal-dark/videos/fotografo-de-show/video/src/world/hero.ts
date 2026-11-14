import { scenes, sceneIndexAt, track } from "../data/scenes";
import { SPOT } from "../layout";
import { clamp, lerp, smoothstep } from "../utils/animation";

// Estado do Você no frame global: posição, direção, pose. Função pura do frame.

/** Janela global [início, fim) da 1ª animação de um alvo (pra partículas emitidas). */
export const animWindow = (target: string, nth = 0): [number, number] => {
  const list = scenes.flatMap((sc) => sc.animations.filter((a) => a.target === target).map((a) => [sc.startFrame + a.startFrame, sc.startFrame + a.endFrame] as [number, number]));
  return list[nth] ?? [0, 1];
};

const SHUTTLE_A = SPOT.callcenter.p;
const SHUTTLE_B = SPOT.padaria.p;

const rawPos = (frame: number): { x: number; z: number; outfit: number } => {
  const idx = sceneIndexAt(frame);
  const sh = track("hero.shuttle", frame);
  if (idx === 2 && sh > 0 && sh < 5.999) {
    const leg = Math.floor(sh);
    const f = sh - leg;
    const from = leg % 2 === 0 ? SHUTTLE_A : SHUTTLE_B;
    const to = leg % 2 === 0 ? SHUTTLE_B : SHUTTLE_A;
    const u = smoothstep((f - 0.22) / 0.56);
    const outfit = (u < 0.5 ? leg % 2 === 0 : leg % 2 !== 0) ? 2 : 1;
    return { x: lerp(from[0], to[0], u), z: lerp(from[1], to[1], u), outfit };
  }
  return { x: track("hero.x", frame, SPOT.quarto.p[0]), z: track("hero.z", frame, SPOT.quarto.p[1]), outfit: Math.round(track("hero.outfit", frame)) };
};

export const heroAt = (frame: number) => {
  const p = rawPos(frame);
  const a = rawPos(frame - 2);
  const b = rawPos(frame + 2);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const speed = Math.hypot(dx, dz) / 4; // u por frame
  const teleport = speed > 0.3; // corte seco / rebobinar: não "anda"
  const walkAmt = teleport ? 0 : clamp(speed / 0.03, 0, 1);
  const baseYaw = track("hero.yaw", frame, 0);
  const walkYaw = (Math.atan2(dx, dz) * 180) / Math.PI;
  let yaw = baseYaw;
  if (walkAmt > 0.01) {
    let d = walkYaw - baseYaw;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    yaw = baseYaw + d * walkAmt;
  }
  const bump = track("hero.bump", frame);
  const bumpX = -0.22 * Math.sin(clamp(bump, 0, 1) * Math.PI) * (bump < 1 ? 1 : 0);
  return {
    x: p.x + bumpX,
    z: p.z,
    y: track("hero.y", frame, 0),
    yaw,
    walkAmt,
    walk: frame * 0.42,
    outfit: p.outfit,
    hasCamera: track("hero.hasCamera", frame, 0),
    lanyards: track("hero.lanyards", frame, 0),
    fatigue: track("hero.fatigue", frame, 0),
    hope: track("hero.hope", frame, 1),
    shoot: track("hero.shoot", frame, 0),
    lift: track("camera.lift", frame, 0),
    edit: track("hero.edit", frame, 0),
  };
};
