import { isVisible, scenes, sceneAt, track } from "../data/scenes";
import { clamp, lerp, smoothstep, type Vec3 } from "../utils/animation";
import type { Eyes, Mouth, PersonPose } from "./Person";

// Posições do sistema como funções puras do frame GLOBAL. O mundo 3D e os rótulos 2D leem daqui,
// então rótulo e personagem nunca se desencontram.

export const v3 = {
  add: (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  scale: (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k],
  lerp: (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
};

/** Índice da cena ativa no frame global. */
export const sceneIndex = (frame: number) => scenes.indexOf(sceneAt(frame));

// ---------------------------------------------------------------- lugares fixos da maquete
export const SHOP_X = -1.9;
export const BAKERY_X = 1.9;
export const CLOCK = { base: [0, 0, -0.95] as Vec3, face: [0, 4.62, -0.68] as Vec3 };
export const BASKET: Vec3 = [0.95, 0, 0.82];
/** Fulcro da baguete-catapulta, na rua. */
export const CATAPULT: Vec3 = [-0.55, 0, 1.5];

export const SPOT = {
  street: [0, 0, 0.95] as Vec3,
  shopCounter: [SHOP_X - 0.15, 0, -0.88] as Vec3,
  shopExit: [-0.75, 0, 0.55] as Vec3,
  shopBackDoor: [SHOP_X + 0.85, 0, -1.2] as Vec3,
  aline: [SHOP_X - 0.95, 0, -0.75] as Vec3,
  mannequin: [SHOP_X + 0.65, 0, -0.42] as Vec3,
  customer: [SHOP_X + 0.85, 0, 0.62] as Vec3,
  seat: [CATAPULT[0] - 0.85, 0.36, CATAPULT[2]] as Vec3,
  bakeryCounter: [BAKERY_X - 0.1, 0, -0.88] as Vec3,
  customer2: [BAKERY_X - 0.1, 0, 0.32] as Vec3,
  baker: [BAKERY_X + 0.55, 0, -0.7] as Vec3,
  alineLanding: [BAKERY_X - 0.85, 0, 0.5] as Vec3,
};

/** Arco balístico de a até b com altura extra h no meio. */
export const arc = (a: Vec3, b: Vec3, t: number, h: number): Vec3 => {
  const p = v3.lerp(a, b, t);
  return [p[0], p[1] + Math.sin(Math.PI * clamp(t, 0, 1)) * h, p[2]];
};

/** Ângulo da baguete (rad, em torno de z): a ponta esquerda desce ao carregar e sobe no disparo. */
export const catapultTilt = (frame: number) => {
  const i = sceneIndex(frame);
  const pull = track("catapult.pull", frame);
  const fire = i <= 5 ? track("nadini.flight", frame) : i === 6 ? 1 : track("aline.flight", frame);
  const fired = clamp(fire * 6, 0, 1);
  return lerp(-0.18 - 0.2 * pull, 0.42, smoothstep(fired));
};

const seatPoint = (frame: number): Vec3 => {
  const tilt = catapultTilt(frame);
  return [CATAPULT[0] - 0.85 * Math.cos(tilt), CATAPULT[1] + 0.36 - 0.85 * Math.sin(tilt), CATAPULT[2]];
};

/** Contratos nas mãos da Nadini (cenas 1 e 9). */
const holdingArms = { armL: 1.05, armR: 1.05, sideL: 0.25, sideR: 0.25 };

// ---------------------------------------------------------------- Nadini
export type Nadini = PersonPose & { apron: boolean; holding: boolean; badge: boolean; sweat: number };

export const nadiniPose = (frame: number): Nadini => {
  const i = sceneIndex(frame);
  const base = { apron: false, holding: false, badge: true, sweat: 0, eyes: "open" as Eyes, mouth: "smile" as Mouth };
  if (i <= 1) {
    const sweat = track("nadini.sweat", frame);
    return { ...base, ...holdingArms, holding: true, sweat, position: SPOT.street, yaw: 0, mouth: sweat > 0.3 ? "flat" : "grin", eyes: sweat > 0.3 ? "wide" : "open" };
  }
  if (i === 2) {
    const sn = track("nadini.sneak", frame);
    const fr = track("nadini.freeze", frame);
    const p = v3.lerp(SPOT.shopCounter, SPOT.shopExit, smoothstep(sn) * 0.75);
    const tiptoe = sn > 0 && fr < 0.05 ? 0.06 + 0.03 * Math.sin(frame * 0.6) : 0.06 * (1 - clamp(fr, 0, 1));
    return {
      ...base,
      position: v3.add(p, [0, tiptoe, 0]),
      yaw: sn > 0.02 ? 0.85 : 0,
      walk: frame * 0.35,
      walkAmp: fr > 0.05 ? 0 : sn > 0.02 && sn < 0.99 ? 0.35 : 0,
      armL: 0.6,
      armR: 0.6,
      sideL: 0.5,
      sideR: 0.5,
      lean: 0.12,
      eyes: fr > 0.05 ? "wide" : "open",
      mouth: fr > 0.05 ? "o" : "flat",
      scale: 1 + 0.06 * Math.max(0, fr - 1),
    };
  }
  if (i === 3) {
    const sw = track("cracha.swap", frame);
    const ex = track("nadini.exitBack", frame);
    const side = v3.add(SPOT.shopCounter, [-0.35, 0, 0]);
    const p = ex > 0 ? v3.lerp(side, SPOT.shopBackDoor, smoothstep(ex)) : v3.lerp(SPOT.shopCounter, side, clamp(track("mannequin.enter", frame), 0, 1));
    return {
      ...base,
      badge: sw < 0.5,
      position: p,
      yaw: ex > 0.02 ? Math.PI * 0.85 : 0.4,
      walk: frame * 0.5,
      walkAmp: ex > 0.02 && ex < 0.98 ? 0.6 : 0,
      armR: sw > 0 && sw < 1 ? 1.2 : 0,
      opacity: 1 - clamp((ex - 0.85) / 0.15, 0, 1),
      mouth: "grin",
    };
  }
  if (i === 5) {
    const fl = track("nadini.flight", frame);
    const land = track("nadini.land", frame);
    if (fl <= 0.001) {
      const pull = track("catapult.pull", frame);
      return { ...base, position: seatPoint(frame), yaw: 0.3, tuck: 1, armL: 0.6, armR: 0.6, eyes: pull > 0.5 ? "wide" : "open", mouth: pull > 0.5 ? "o" : "grin", lean: -0.15 };
    }
    const target = v3.add(BASKET, [0, 0.12, 0]);
    const p = arc(SPOT.seat, target, smoothstep(fl), 2.6);
    const flip = fl < 1 ? fl * Math.PI * 4 : 0;
    const squash = land > 0 ? 1 - 0.12 * Math.sin(Math.PI * clamp(land, 0, 1)) : 1;
    return { ...base, position: p, yaw: -0.4, roll: -flip, tuck: fl < 1 ? 0.8 : 0.9, armL: 2.6, armR: 2.6, sideL: 0.4, sideR: 0.4, eyes: "wide", mouth: "o", scale: squash };
  }
  if (i === 6) {
    const hand = track("handoff.phone", frame);
    return { ...base, apron: true, position: SPOT.bakeryCounter, yaw: 0, armR: 0.2 + 1.1 * Math.sin(Math.PI * clamp(hand, 0, 1)) + (hand >= 1 ? 0 : 0), mouth: "grin" };
  }
  if (i === 7) {
    const f1 = track("fired1", frame);
    const f2 = track("fired2", frame);
    const shock = clamp(f1 + f2, 0, 1);
    return { ...base, apron: true, position: SPOT.bakeryCounter, yaw: 0, eyes: f2 > 0.5 ? "x" : shock > 0.1 ? "wide" : "open", mouth: shock > 0.1 ? "o" : "flat", scale: 1 - 0.08 * f2, sweat: shock };
  }
  if (i === 8) {
    // rebobinando: voa de volta (arco ao contrário) até o meio da rua, com os contratos
    const r = track("rewind", frame);
    const p = arc(SPOT.bakeryCounter, SPOT.street, smoothstep(clamp(r * 1.25, 0, 1)), 2.2);
    const back = clamp(r * 1.25, 0, 1);
    return {
      ...base,
      apron: back < 0.5,
      holding: back > 0.9,
      position: p,
      yaw: 0,
      roll: back < 1 ? back * Math.PI * 4 : 0,
      tuck: back > 0.02 && back < 0.98 ? 0.7 : 0,
      armL: back > 0.9 ? holdingArms.armL : 2.2 * (1 - back),
      armR: back > 0.9 ? holdingArms.armR : 2.2 * (1 - back),
      sideL: holdingArms.sideL,
      sideR: holdingArms.sideR,
      eyes: back >= 1 ? "open" : "closed",
      mouth: back >= 1 ? "grin" : "o",
    };
  }
  return { ...base, position: [0, -20, 0], yaw: 0, opacity: 0 };
};

// ---------------------------------------------------------------- Aline
export type Aline = PersonPose & { radar: number; antenna: number; steam: number };

export const alinePose = (frame: number): Aline | null => {
  const i = sceneIndex(frame);
  if (!isVisible("aline", frame)) return null;
  if (i === 2) {
    const radar = track("aline.radar", frame);
    return { position: SPOT.aline, yaw: radar > 0 ? 0.75 : 0.2, radar, antenna: clamp(radar * 3, 0, 1), steam: 0, armL: 0.9, armR: 0.9, sideL: -0.55, sideR: -0.55, eyes: radar > 0.95 ? "angry" : "open", mouth: radar > 0.95 ? "frown" : "flat" };
  }
  if (i === 4) {
    const peek = track("aline.peek", frame);
    const p = v3.lerp([SHOP_X - 1.6, 0, 0.6], [SHOP_X - 1.05, 0, 0.45], clamp(peek, 0, 1));
    return { position: p, yaw: 0.9, radar: 0, antenna: 0, steam: 0, eyes: "angry", mouth: "o", lean: 0.1 * peek, roll: -0.2 * peek };
  }
  if (i === 5) return null;
  if (i === 7) {
    const fl = track("aline.flight", frame);
    const look = track("chefs.look", frame);
    const steam = track("aline.steam", frame);
    const start = v3.add(seatPoint(frame), [0, 0, 0]);
    const p = fl > 0 ? arc(SPOT.seat, SPOT.alineLanding, smoothstep(fl), 2.4) : start;
    const flying = fl > 0.001 && fl < 0.999;
    return {
      position: p,
      yaw: fl >= 0.999 ? lerp(0.0, 1.1, look) : 0.4,
      radar: 0,
      antenna: 0,
      steam,
      tuck: flying ? 0.7 : fl >= 0.999 ? 0 : 1,
      roll: flying ? -fl * Math.PI * 2 : 0,
      armL: flying ? 2.6 : 0.9,
      armR: flying ? 2.6 : 0.9,
      sideL: flying ? 0.3 : -0.55,
      sideR: flying ? 0.3 : -0.55,
      eyes: "angry",
      mouth: "frown",
    };
  }
  if (i === 8) {
    const r = clamp(track("rewind", frame) * 1.6, 0, 1);
    if (r >= 0.999) return null;
    const p = arc(SPOT.alineLanding, SPOT.seat, smoothstep(r), 2.4);
    return { position: p, yaw: 0.4, radar: 0, antenna: 0, steam: 1 - r, tuck: 0.7, roll: r * Math.PI * 2, armL: 2.6, armR: 2.6, eyes: "closed", mouth: "o", opacity: 1 - clamp((r - 0.85) / 0.15, 0, 1) };
  }
  return null;
};

// ---------------------------------------------------------------- manequim
export const mannequinPose = (frame: number): (PersonPose & { badge: boolean; smile: number }) | null => {
  const i = sceneIndex(frame);
  if (!isVisible("mannequin", frame)) return null;
  const enter = track("mannequin.enter", frame);
  const nod = track("mannequin.nod", frame);
  const fall = i === 4 ? track("mannequin.fall", frame) : 0;
  const bob = Math.sin(Math.PI * clamp(nod, 0, 1)) * 0.25;
  const drop = i === 3 ? (1 - clamp(enter, 0, 1)) * 1.6 : 0;
  return {
    position: v3.add(SPOT.mannequin, [0, drop, 0]),
    yaw: -0.15,
    lean: bob + (fall * Math.PI) / 180,
    scale: clamp(enter * 1.1, 0, 1.08),
    badge: track("cracha.swap", frame) > 0.5,
    smile: track("mannequin.smile", frame),
    mouth: "smile",
  };
};

// ---------------------------------------------------------------- figurantes
export const customerPose = (frame: number): PersonPose | null => {
  if (!isVisible("customer", frame)) return null;
  const enter = track("customer.enter", frame);
  const fall = track("mannequin.fall", frame);
  const jump = fall > 70 ? Math.sin(Math.PI * clamp((fall - 70) / 20, 0, 1)) * 0.25 : 0;
  const p = v3.lerp(v3.add(SPOT.customer, [1.6, 0, 0.3]), SPOT.customer, smoothstep(clamp(enter, 0, 1)));
  return { position: v3.add(p, [0, jump, 0]), yaw: Math.PI + 0.35, walk: frame * 0.5, walkAmp: enter < 0.98 ? 0.55 : 0, armR: track("customer.ask", frame) * 1.3, eyes: fall > 60 ? "wide" : "open", mouth: fall > 60 ? "o" : "smile" };
};

export const customer2Pose = (frame: number): PersonPose | null => {
  if (!isVisible("customer2", frame)) return null;
  const enter = track("customer2.enter", frame);
  const conf = track("customer2.confused", frame);
  const hand = track("handoff.phone", frame);
  const p = v3.lerp(v3.add(SPOT.customer2, [1.8, 0, 0.4]), SPOT.customer2, smoothstep(clamp(enter, 0, 1)));
  return { position: p, yaw: Math.PI, walk: frame * 0.5, walkAmp: enter < 0.98 ? 0.55 : 0, armL: hand > 0.5 ? 1.0 : 0, armR: conf * 2.4, sideR: conf * 0.2, roll: conf * 0.12, eyes: conf > 0.3 ? "wide" : "open", mouth: conf > 0.3 ? "flat" : "smile" };
};

export const bakerPose = (frame: number): PersonPose | null => {
  if (!isVisible("baker", frame)) return null;
  const i = sceneIndex(frame);
  const enter = i === 7 ? track("baker.enter", frame) : 1 - clamp(track("rewind", frame) * 2, 0, 1);
  if (enter <= 0.01) return null;
  const look = i === 7 ? track("chefs.look", frame) : 0;
  const p = v3.lerp(v3.add(SPOT.baker, [0.6, 0, -0.2]), SPOT.baker, smoothstep(clamp(enter, 0, 1)));
  return { position: p, yaw: lerp(-0.2, -1.1, look), walk: frame * 0.5, walkAmp: enter < 0.98 ? 0.5 : 0, armL: 0.9, armR: 0.9, sideL: -0.55, sideR: -0.55, eyes: "angry", mouth: "frown", opacity: clamp(enter * 2, 0, 1) };
};
