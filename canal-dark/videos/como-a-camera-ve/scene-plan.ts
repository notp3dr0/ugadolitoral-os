// Fase 1 · contrato de dados de "Como a câmera transforma luz em foto?" (roteiro v1).
// Na Fase 2 este arquivo vira src/data/scenes.ts sem tradução (imports relativos a src/data/).
// utils/timing.ts recebe: SECONDS = 64; VO_KEYS = s1..s8; PLANNED_SECONDS = [7, 7, 7, 9, 8, 8, 8, 10];
// FIRST_VO = 0.45; LEAD = 0.25; GAPS = [0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55].
// Mundo: eixo óptico em x (skatista em x = −9, boca da lente em x ≈ −1,2, sensor em x = +1);
// o corte da câmera fica virado pra +z (az 0° = de frente pro corte).
import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };
export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-estudio-escuro", language: "pt-BR" };

export type BadgeVariant = "positive" | "negative" | "info" | "warning";
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };
export type CameraPlan = {
  projection: "perspective" | "orthographic";
  movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split" | "hold";
  keys: CameraKey[];
};
export type SceneObject = { id: string; type: string; visible: boolean; state?: { start: string; end: string } };
export type SceneBadge = {
  text: string; variant: BadgeVariant; appearAt: number; disappearAt?: number;
  subtitle?: string; slot?: "center" | "left" | "right"; icon?: "?"; size?: "normal" | "large";
};
export type CaptionBlock = { text: string; from: number; to: number };
export type AudioCue = { kind: "narration" | "sfx"; src: string; at: number; volume: number; status: "planned" | "ready" };
export type ScenePlan = {
  id: string; startFrame: number; durationInFrames: number; voKey: VoKey; narration: string;
  camera: CameraPlan; objects: SceneObject[]; animations: TrackAnimation[]; badges: SceneBadge[];
  highlights: string[]; captions: CaptionBlock[]; audioCues: AudioCue[];
};

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status: "planned" });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "planned" });
const anim = (a: TrackAnimation) => a;

// Poses compartilhadas (continuidade espacial)
const P = {
  wide: orbit([-3, 0.5, 0], 24, 65, 26),        // por trás e de cima: câmera na frente, skatista ao fundo
  side: orbit([0, 0.2, 0], 13, 8, 10),          // vista do corte
  sideDrift: orbit([0, 0.3, 0], 13, 22, 12),
  lensClose: orbit([-1.3, 0.2, 0], 9, -20, 8),
  front: orbit([-1.5, 0.2, 0], 8, -75, 6),      // olhando pra dentro da lente (diafragma)
  medium: orbit([-4, 0.8, 0], 26, 55, 18),      // skatista + câmera
  mediumDrift: orbit([-4, 0.8, 0], 26, 62, 18),
  shutter: orbit([0.6, 0.2, 0], 8, 15, 6),
  open: orbit([-3, 0.6, 0], 24, 60, 16),
  sensor: orbit([0.9, 0.2, 0], 9, 35, 8),
  final: orbit([-3, 0.8, 0], 30, 40, 28),
  finalEnd: orbit([-3, 0.8, 0], 30, 70, 30),
};

// Objetos que persistem depois de instalados
const base = (extra: SceneObject[] = []): SceneObject[] => [
  { id: "studio", type: "fundo-degrade", visible: true },
  { id: "subject", type: "skatista-rampa", visible: true },
  { id: "sun", type: "sol", visible: true },
  { id: "body", type: "camera-em-corte", visible: true },
  { id: "sensor", type: "grade-12x8", visible: true },
  { id: "rays", type: "raios-3-cores", visible: true },
  ...extra,
];
const lens: SceneObject = { id: "lens", type: "lente-3-elementos", visible: true };
const iris: SceneObject = { id: "iris", type: "diafragma-7-laminas", visible: true };
const shutter: SceneObject = { id: "shutter", type: "obturador-cortina", visible: true };
const card: SceneObject = { id: "photoCard", type: "card-resultado-2d", visible: true };

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você quer guardar uma imagem. Parece fácil: é só deixar a luz bater num sensor.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(end(0), P.side, "soft")] },
    objects: base([{ id: "photoCard", type: "card-resultado-2d", visible: false }]).map((o) =>
      o.id === "body" ? { ...o, state: { start: "fechada, sem lente", end: "em corte, só o sensor" } } : o),
    animations: [
      anim({ type: "spring", target: "body.scale", startFrame: 0, endFrame: s(1), from: 0, to: 1, damping: 11, unit: "0-1" }),
      anim({ type: "interpolate", target: "body.cut", startFrame: W("s1", 11), endFrame: W("s1", 11) + 24, from: 0, to: 1, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "rays.amount", startFrame: W("s1", 11), endFrame: W("s1", 12) + 6, from: 0, to: 0.35, easing: "out", unit: "0-1" }),
    ],
    badges: [{ text: "LUZ VIRA FOTO?", variant: "warning", icon: "?", appearAt: W("s1", 5), disappearAt: end(0) - 10 }],
    highlights: ["IMAGEM", "LUZ", "SENSOR"],
    captions: [{ text: "Você quer guardar uma imagem. Parece fácil: é só deixar a luz bater num sensor.", from: voLocal("s1"), to: end(0) }],
    audioCues: [narration("s1"), sfx("whoosh-soft", 0, 0.3), sfx("badge", W("s1", 5), 0.28)],
  },
  {
    id: "scene-02-sem-imagem",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que a luz chega de todos os lados. O sensor vê só uma mancha clara.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.side), key(end(1), P.sideDrift, "soft")] },
    objects: base([card]).map((o) => (o.id === "sensor" ? { ...o, state: { start: "apagado", end: "todo pálido" } } : o)),
    animations: [
      anim({ type: "interpolate", target: "rays.spread", startFrame: W("s2", 2), endFrame: W("s2", 8), from: 0, to: 1, easing: "linear", unit: "0-1" }),
      anim({ type: "interpolate", target: "sensor.mix", startFrame: W("s2", 8), endFrame: W("s2", 11), from: 0, to: 1, easing: "soft", unit: "0-1" }),
      anim({ type: "spring", target: "photoCard.show", startFrame: W("s2", 12), endFrame: W("s2", 12) + s(1), from: 0, to: 1, damping: 12, unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.focus", startFrame: 0, endFrame: 1, from: 0, to: 0, easing: "linear", unit: "0-1" }),
    ],
    badges: [{ text: "SEM IMAGEM", subtitle: "Luz de todo lado", variant: "negative", appearAt: W("s2", 13), disappearAt: end(1) - 4 }],
    highlights: ["LUZ", "LADOS", "MANCHA"],
    captions: [{ text: "Só que a luz chega de todos os lados. O sensor vê só uma mancha clara.", from: voLocal("s2"), to: end(1) }],
    audioCues: [narration("s2"), sfx("buzz-low", W("s2", 13), 0.2), sfx("badge", W("s2", 13), 0.28)],
  },
  {
    id: "scene-03-lente",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Por isso existe a lente: ela leva cada ponto da cena pra um ponto do sensor.",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [key(0, P.lensClose), key(W("s3", 6), P.side, "soft"), key(end(2), P.side, "linear")],
    },
    objects: base([lens, card, { id: "labels", type: "rotulos-3d", visible: true }]).map((o) =>
      o.id === "sensor" ? { ...o, state: { start: "pálido", end: "imagem invertida nítida" } } : o),
    animations: [
      anim({ type: "spring", target: "lens.install", startFrame: W("s3", 4), endFrame: W("s3", 4) + s(1), from: 0, to: 1, damping: 12, unit: "0-1" }),
      anim({ type: "interpolate", target: "labels.lens", startFrame: W("s3", 4) + 6, endFrame: W("s3", 4) + 18, from: 0, to: 1, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "rays.converge", startFrame: W("s3", 6), endFrame: W("s3", 13), from: 0, to: 1, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "sensor.mix", startFrame: W("s3", 10), endFrame: W("s3", 14), from: 1, to: 0, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "sensor.image", startFrame: W("s3", 10), endFrame: W("s3", 14), from: 0, to: 1, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.focus", startFrame: W("s3", 10), endFrame: W("s3", 15) + 8, from: 0, to: 1, easing: "out", unit: "0-1" }),
    ],
    badges: [{ text: "LENTE", subtitle: "Foca a luz", variant: "positive", appearAt: W("s3", 4), disappearAt: end(2) - 4 }],
    highlights: ["LENTE", "PONTO", "SENSOR"],
    captions: [{ text: "Por isso existe a lente: ela leva cada ponto da cena pra um ponto do sensor.", from: voLocal("s3"), to: end(2) }],
    audioCues: [narration("s3"), sfx("whoosh-soft", 0, 0.25), sfx("thud", W("s3", 4) + 8, 0.34), sfx("badge", W("s3", 4), 0.28)],
  },
  {
    id: "scene-04-diafragma",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Mas no sol entra luz demais e a foto estoura. Então umas lâminas fecham a passagem: o diafragma.",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [key(0, P.side), key(W("s4", 10), P.front, "soft"), key(W("s4", 17), P.front, "linear"), key(end(3), P.side, "soft")],
    },
    objects: base([lens, iris, card]).map((o) => (o.id === "sun" ? { ...o, state: { start: "normal", end: "estourado" } } : o)),
    animations: [
      anim({ type: "interpolate", target: "sun.intensity", startFrame: W("s4", 1), endFrame: W("s4", 3), from: 1, to: 2.4, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "rays.width", startFrame: W("s4", 1), endFrame: W("s4", 3), from: 1, to: 2.2, easing: "out", unit: "u3d" }),
      anim({ type: "interpolate", target: "photo.exposure", startFrame: W("s4", 3), endFrame: W("s4", 9), from: 0, to: 2, easing: "in", unit: "0-1" }),
      anim({ type: "interpolate", target: "iris.close", startFrame: W("s4", 12), endFrame: W("s4", 15), from: 0, to: 0.65, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.exposure", startFrame: W("s4", 13), endFrame: W("s4", 17), to: 0, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "rays.width", startFrame: W("s4", 13), endFrame: W("s4", 17), to: 1, easing: "soft", unit: "u3d" }),
    ],
    badges: [
      { text: "FOTO ESTOURADA", variant: "negative", appearAt: W("s4", 9), disappearAt: W("s4", 12) - 3 },
      { text: "DIAFRAGMA", subtitle: "Controla a abertura", variant: "positive", appearAt: W("s4", 17), disappearAt: end(3) - 4 },
    ],
    highlights: ["SOL", "ESTOURA", "LÂMINAS", "DIAFRAGMA"],
    captions: [{ text: "Mas no sol entra luz demais e a foto estoura. Então umas lâminas fecham a passagem: o diafragma.", from: voLocal("s4"), to: end(3) }],
    audioCues: [
      narration("s4"),
      sfx("glare", W("s4", 1), 0.22),
      sfx("badge", W("s4", 9), 0.28),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => sfx("tick", W("s4", 12) + i * 2, 0.18)),
      sfx("badge", W("s4", 17), 0.28),
    ],
  },
  {
    id: "scene-05-borrao",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Só que o sensor registra tudo enquanto está exposto. Se o skatista se mexe, a foto vira borrão.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.medium), key(end(4), P.mediumDrift, "linear")] },
    objects: base([lens, iris, card]).map((o) => (o.id === "subject" ? { ...o, state: { start: "parado", end: "dando ollie em loop" } } : o)),
    animations: [
      anim({ type: "interpolate", target: "subject.jump", startFrame: W("s5", 11), endFrame: end(4), from: 0, to: (end(4) - W("s5", 11)) / 36, easing: "linear", unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.blur", startFrame: W("s5", 12), endFrame: W("s5", 17), from: 0, to: 1, easing: "linear", unit: "0-1" }),
      anim({ type: "interpolate", target: "sensor.trail", startFrame: W("s5", 12), endFrame: W("s5", 17), from: 0, to: 1, easing: "linear", unit: "0-1" }),
    ],
    badges: [{ text: "BORRÃO", subtitle: "Exposto tempo demais", variant: "negative", appearAt: W("s5", 16), disappearAt: end(4) - 4 }],
    highlights: ["SENSOR", "EXPOSTO", "BORRÃO"],
    captions: [{ text: "Só que o sensor registra tudo enquanto está exposto. Se o skatista se mexe, a foto vira borrão.", from: voLocal("s5"), to: end(4) }],
    audioCues: [narration("s5"), sfx("whoosh-soft", 0, 0.25), sfx("skate-roll", W("s5", 11), 0.18), sfx("badge", W("s5", 16), 0.28)],
  },
  {
    id: "scene-06-obturador",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Por isso existe o obturador: ele abre e fecha em uma fração de segundo e congela o movimento.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.shutter), key(W("s6", 15), P.shutter, "linear"), key(end(5), P.open, "soft")] },
    objects: base([lens, iris, shutter, card, { id: "labels", type: "rotulos-3d", visible: true }, { id: "flash", type: "flash-2d", visible: true }]),
    animations: [
      anim({ type: "spring", target: "shutter.install", startFrame: W("s6", 4), endFrame: W("s6", 4) + s(1), from: 0, to: 1, damping: 12, unit: "0-1" }),
      anim({ type: "interpolate", target: "shutter.open", startFrame: W("s6", 6), endFrame: W("s6", 6) + 6, from: 0, to: 1, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "shutter.open", startFrame: W("s6", 8), endFrame: W("s6", 8) + 6, to: 0, easing: "in", unit: "0-1" }),
      anim({ type: "interpolate", target: "labels.speed", startFrame: W("s6", 11), endFrame: W("s6", 11) + 10, from: 0, to: 1, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.blur", startFrame: W("s6", 15), endFrame: W("s6", 15) + 10, to: 0, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "sensor.trail", startFrame: W("s6", 15), endFrame: W("s6", 15) + 10, to: 0, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "flash", startFrame: W("s6", 15), endFrame: W("s6", 15) + 4, from: 1, to: 0, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "subject.freeze", startFrame: W("s6", 15), endFrame: W("s6", 15) + 1, from: 0, to: 1, easing: "linear", unit: "0-1" }),
    ],
    badges: [{ text: "OBTURADOR", subtitle: "Controla o tempo", variant: "positive", appearAt: W("s6", 4), disappearAt: end(5) - 4 }],
    highlights: ["OBTURADOR", "FRAÇÃO", "CONGELA"],
    captions: [{ text: "Por isso existe o obturador: ele abre e fecha em uma fração de segundo e congela o movimento.", from: voLocal("s6"), to: end(5) }],
    audioCues: [
      narration("s6"),
      sfx("badge", W("s6", 4), 0.28),
      sfx("shutter-click", W("s6", 8), 0.36),
      sfx("shutter-click", W("s6", 15), 0.42),
    ],
  },
  {
    id: "scene-07-iso",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Com menos luz e menos tempo, a foto escurece. Então a câmera amplifica o sinal: o ISO. Preço? Ruído.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.open), key(s(0.8), P.sensor, "soft"), key(end(6), orbit([0.9, 0.2, 0], 9, 25, 10), "linear")] },
    objects: base([lens, iris, shutter, card]).map((o) => (o.id === "sensor" ? { ...o, state: { start: "escuro", end: "amplificado com ruído" } } : o)),
    animations: [
      anim({ type: "interpolate", target: "photo.exposure", startFrame: W("s7", 1), endFrame: W("s7", 8), to: -2, easing: "in", unit: "0-1" }),
      anim({ type: "interpolate", target: "sensor.gain", startFrame: W("s7", 12), endFrame: W("s7", 12) + 35, from: 0, to: 1, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.exposure", startFrame: W("s7", 12), endFrame: W("s7", 16), to: 0, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.noise", startFrame: W("s7", 17), endFrame: W("s7", 17) + 18, from: 0, to: 0.8, easing: "out", unit: "0-1" }),
    ],
    badges: [
      { text: "FOTO ESCURA", variant: "negative", appearAt: W("s7", 8), disappearAt: W("s7", 16) - 4 },
      { text: "ISO", subtitle: "Amplifica o sinal", variant: "info", appearAt: W("s7", 16), disappearAt: end(6) - 4 },
      { text: "RUÍDO", variant: "negative", appearAt: W("s7", 18), disappearAt: end(6) - 4 },
    ],
    highlights: ["ESCURECE", "AMPLIFICA", "ISO", "RUÍDO"],
    captions: [{ text: "Com menos luz e menos tempo, a foto escurece. Então a câmera amplifica o sinal: o ISO. Preço? Ruído.", from: voLocal("s7"), to: end(6) }],
    audioCues: [
      narration("s7"),
      sfx("whoosh-soft", 0, 0.22),
      sfx("badge", W("s7", 8), 0.28),
      sfx("badge", W("s7", 16), 0.28),
      sfx("noise-hiss", W("s7", 17), 0.16),
      sfx("badge", W("s7", 18), 0.28),
    ],
  },
  {
    id: "scene-08-triangulo",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Abertura, obturador e ISO: o triângulo da exposição. Mexeu num, mexe nos outros. Agora você sabe o que acontece quando aperta o botão.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.sensor), key(s(1.2), P.final, "soft"), key(end(7), P.finalEnd, "linear")] },
    objects: base([lens, iris, shutter, card, { id: "triangle", type: "triangulo-3d", visible: true }, { id: "flash", type: "flash-2d", visible: true }]).map((o) =>
      o.id === "photoCard" ? { ...o, state: { start: "pequeno, com ruído", end: "grande, foto final equilibrada" } } : o),
    animations: [
      anim({ type: "spring", target: "triangle.vertexA", startFrame: W("s8", 0), endFrame: W("s8", 0) + s(1), from: 0, to: 1, damping: 11, unit: "0-1" }),
      anim({ type: "spring", target: "triangle.vertexB", startFrame: W("s8", 1), endFrame: W("s8", 1) + s(1), from: 0, to: 1, damping: 11, unit: "0-1" }),
      anim({ type: "spring", target: "triangle.vertexC", startFrame: W("s8", 3), endFrame: W("s8", 3) + s(1), from: 0, to: 1, damping: 11, unit: "0-1" }),
      anim({ type: "interpolate", target: "triangle.edges", startFrame: W("s8", 3), endFrame: W("s8", 5), from: 0, to: 1, easing: "out", unit: "0-1" }),
      anim({ type: "interpolate", target: "iris.close", startFrame: W("s8", 8), endFrame: W("s8", 11), to: 0.4, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "shutter.speed", startFrame: W("s8", 8), endFrame: W("s8", 11), from: 0, to: 1, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "photo.noise", startFrame: W("s8", 8), endFrame: W("s8", 11), to: 0.15, easing: "soft", unit: "0-1" }),
      anim({ type: "interpolate", target: "flash", startFrame: W("s8", 20), endFrame: W("s8", 20) + 4, from: 1, to: 0, easing: "out", unit: "0-1" }),
      anim({ type: "spring", target: "photoCard.hero", startFrame: W("s8", 20), endFrame: W("s8", 20) + s(1), from: 0, to: 1, damping: 12, unit: "0-1" }),
      anim({ type: "interpolate", target: "fade", startFrame: end(7) - 20, endFrame: end(7), from: 0, to: 1, easing: "in", unit: "0-1" }),
    ],
    badges: [{ text: "TRIÂNGULO DA EXPOSIÇÃO", variant: "info", size: "large", appearAt: W("s8", 5), disappearAt: end(7) }],
    highlights: ["ABERTURA", "OBTURADOR", "ISO", "BOTÃO"],
    captions: [{ text: "Abertura, obturador e ISO: o triângulo da exposição. Mexeu num, mexe nos outros. Agora você sabe o que acontece quando aperta o botão.", from: voLocal("s8"), to: end(7) }],
    audioCues: [
      narration("s8"),
      sfx("whoosh-soft", 0, 0.25),
      sfx("badge", W("s8", 0), 0.22),
      sfx("badge", W("s8", 1), 0.22),
      sfx("badge", W("s8", 3), 0.22),
      sfx("shutter-click", W("s8", 20), 0.45),
    ],
  },
];

export const track = (target: string, frame: number, fallback = 0) => evaluateTrack(scenes, target, frame, FPS, fallback);

export const sceneAt = (frame: number) => {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (frame >= scenes[i].startFrame) return scenes[i];
  }
  return scenes[0];
};

export const isVisible = (id: string, frame: number) => sceneAt(frame).objects.some((o) => o.id === id && o.visible);

// Integridade: contígua, começa em 0, soma DURATION (1920)
scenes.forEach((cur, i) => {
  const prev = scenes[i - 1];
  if (prev && prev.startFrame + prev.durationInFrames !== cur.startFrame) {
    throw new Error(`Buraco/sobreposição entre ${prev.id} e ${cur.id}`);
  }
});
const total = scenes.reduce((acc, cur) => acc + cur.durationInFrames, 0);
if (total !== DURATION || scenes[0].startFrame !== 0) {
  throw new Error(`As cenas somam ${total} frames (esperado ${DURATION})`);
}
