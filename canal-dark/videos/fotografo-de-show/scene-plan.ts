// scene-plan.ts · "Como funciona a carreira de fotógrafo de show?" (roteiro v1, 2026-11-04)
// Contrato de dados da Fase 1. Na Fase 2 vira src/data/scenes.ts do template sem tradução.
// Frames de animações, badges, legendas, câmera e áudio são LOCAIS à cena; startFrame é global.
//
// utils/timing.ts desta produção:
//   SECONDS = 90  (2700 frames a 30 fps)
//   VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"]
//   PLANNED_SECONDS = [6, 7, 8.5, 4, 7, 8.5, 7.5, 7, 6, 8.5, 9.5, 10.5]   // soma 90
//   FIRST_VO = 0.45; LEAD = 0.25; GAPS = 11 × 0.55
//   Cortes planejados (frames): 0, 180, 390, 645, 765, 975, 1230, 1455, 1665, 1845, 2100, 2385, 2700
//
// Convenções do mundo (u3d): base redonda r=7 em y=0. Padaria [-3.5, 0, 1.5]; telemarketing
// [-3.5, 0, -2.5]; quartinho [0, 0, 2.5]; casa de show [0, 0, -2.5] (palco em z=-1.6); mercado
// [3.5, 0, 1.5]; ponto de ônibus [3.5, 0, -1.5]; casas extras nas bordas; areia e mar na borda +z.
// Trilhas de contagem (hero.lanyards, seen.marks, calendar.flip, hero.outfit) não têm unidade: o
// componente arredonda pra baixo. sky.time é lido em módulo 1 (0 = meia-noite, 0.25 = amanhecer,
// 0.5 = meio-dia, 0.85 = noite).

import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };
export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-uga", language: "pt-BR" };

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
const narration = (k: VoKey, status: AudioCue["status"]): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "planned" });

// Poses compartilhadas (continuidade espacial).
const P = {
  stageClose: orbit([0, 1.0, -1.6], 4.5, 14, 6),
  stageClose2: orbit([0, 1.0, -1.6], 4.0, 20, 6),
  wide: orbit([0, 0.6, 0], 26, 28, 24),
  quarto: orbit([0, 1.0, 2.5], 7, 8, 14),
  padaria: orbit([-3.5, 0.8, 1.5], 8, -24, 14),
  callcenter: orbit([-3.5, 1.6, -2.5], 9, -36, 10),
  rig: orbit([-1.5, 1.2, 0], 14, -10, 22),
  rig2: orbit([-1.5, 1.2, 0], 14, 10, 22),
  piggy: orbit([0, 2.6, 2.5], 5, 10, 8),
  heroLow: orbit([0, 1.1, 2.5], 4.2, 12, 2),
  heroLowIn: orbit([0, 1.1, 2.5], 3.4, 12, 2),
  quartoMid: orbit([0, 1.0, 2.5], 6, -8, 14),
  padariaClose: orbit([-3.5, 0.9, 1.5], 5.5, -30, 10),
  padariaClose2: orbit([-3.5, 0.9, 1.5], 5.4, -29, 10),
  showFacade: orbit([0, 1.4, -2.5], 10, 10, 12),
  door: orbit([0.8, 1.2, -1.4], 5, 20, 8),
  door2: orbit([0.8, 1.2, -1.4], 5, 28, 8),
  showInside: orbit([0, 1.0, -1.8], 7, -15, 8),
  showInside2: orbit([0, 1.0, -1.8], 7, 25, 8),
  quartoNight: orbit([0, 1.2, 2.5], 5, 5, 12),
  telao: orbit([0, 2.6, -3.2], 8, 0, 6),
  city: orbit([0, 0.5, 0], 30, 20, 48),
  city2: orbit([0, 0.5, 0], 30, 40, 48),
  casa2: orbit([5.2, 1.1, -4], 6, 30, 10),
  heroChest: orbit([0, 1.0, 0.5], 3, 10, 4),
  mercado: orbit([3.5, 0.9, 1.5], 5.5, 35, 10),
  onibus: orbit([3.5, 0.9, -1.5], 5.5, 50, 10),
  camarim: orbit([-0.8, 1.0, -3], 5, -20, 10),
  quarto11: orbit([0, 1.2, 2.5], 6, 0, 12),
  quarto11b: orbit([0, 1.2, 2.5], 4.5, 12, 10),
  wideFinal: orbit([0, 0.6, 0], 28, 30, 26),
  wideFinal2: orbit([0, 0.6, 0], 28, 42, 26),
  padariaDawn: orbit([-3.5, 0.9, 1.5], 7, -20, 12),
};

// Objetos que existem o vídeo inteiro.
const BASE: SceneObject[] = [
  { id: "board", type: "maquete-quarteirao-litoral", visible: true },
  { id: "sky", type: "ceu-degrade-por-hora", visible: true },
  { id: "padaria", type: "predio-padaria", visible: true },
  { id: "callcenter", type: "predio-telemarketing", visible: true },
  { id: "quarto", type: "quartinho-em-corte", visible: true },
  { id: "casaShow", type: "casa-de-show-com-palco-e-telao", visible: true },
  { id: "mercado", type: "mercado", visible: true },
  { id: "onibus", type: "ponto-de-onibus-com-catraca", visible: true },
  { id: "photoLabel", type: "rotulo-2d-ancorado: FOTOGRAFIA R$ 0,00", visible: true },
];
const hero = (start: string, endState: string): SceneObject => ({ id: "hero", type: "boneco-voce", visible: true, state: { start, end: endState } });

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Esse fotógrafo trabalha toda semana e nunca recebeu um real. Como isso é possível?",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [key(0, P.stageClose), key(W("s1", 10), P.stageClose2, "soft"), key(end(0), P.wide, "inOut")],
    },
    objects: [
      ...BASE,
      hero("no palco, fotografando, 6 credenciais, câmera no pescoço", "no quartinho, sem câmera, 0 credenciais"),
      { id: "crowd", type: "plateia-24-capsulas", visible: true },
      { id: "rewindFx", type: "overlay-2d-rebobinar", visible: true },
    ],
    animations: [
      { type: "spring", target: "photoLabel.opacity", startFrame: 12, endFrame: 42, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: 12, endFrame: 15, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: 15, endFrame: 18, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: W("s1", 9), endFrame: W("s1", 9) + 3, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: W("s1", 9) + 3, endFrame: W("s1", 9) + 6, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "crowd.jump", startFrame: 0, endFrame: W("s1", 10), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "rewind.amount", startFrame: W("s1", 10), endFrame: 172, from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "sky.time", startFrame: W("s1", 10), endFrame: 172, from: 0.95, to: 0.15, easing: "linear" },
      { type: "interpolate", target: "hero.lanyards", startFrame: W("s1", 10), endFrame: 168, from: 6, to: 0, easing: "linear" },
      { type: "interpolate", target: "hero.fatigue", startFrame: W("s1", 10), endFrame: 168, from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "hero.x", startFrame: 160, endFrame: 172, from: 0, to: 0, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: 160, endFrame: 172, from: -1.6, to: 2.5, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.hasCamera", startFrame: 160, endFrame: 172, from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "rewind.amount", startFrame: 172, endFrame: end(0), from: 1, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "TRABALHA E NÃO RECEBE?", variant: "warning", icon: "?", appearAt: W("s1", 6), disappearAt: 176 }],
    highlights: ["NUNCA", "REAL", "POSSÍVEL"],
    captions: [
      { text: "Esse fotógrafo trabalha toda semana e nunca recebeu um real.", from: voLocal("s1"), to: W("s1", 10) },
      { text: "Como isso é possível?", from: W("s1", 10), to: end(0) },
    ],
    audioCues: [
      narration("s1", "planned"),
      sfx("crowd-bed", 0, 0.18),
      sfx("flash", 12, 0.4),
      sfx("badge", W("s1", 6), 0.28),
      sfx("flash", W("s1", 9), 0.4),
      sfx("rewind", W("s1", 10), 0.35),
    ],
  },
  {
    id: "scene-02-dois-empregos",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Você quer ser fotógrafo. Só que câmera é cara. Então, de manhã, padaria. De noite, telemarketing.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [
        key(0, P.wide),
        key(W("s2", 8), P.quarto, "soft"),
        key(W("s2", 12), P.padaria, "inOut"),
        key(W("s2", 15), P.callcenter, "inOut"),
        key(end(1), P.callcenter),
      ],
    },
    objects: [
      ...BASE,
      hero("no quartinho, casual, sem câmera", "no telemarketing, de headset"),
      { id: "dreamBubble", type: "balao-pensamento-com-camera", visible: true, state: { start: "ausente", end: "sumiu" } },
      { id: "priceTag", type: "etiqueta-$$$$", visible: true, state: { start: "ausente", end: "sumiu" } },
      { id: "sunMoon", type: "sol-e-lua-no-arco", visible: true },
    ],
    animations: [
      { type: "spring", target: "dream.camera", startFrame: W("s2", 3), endFrame: W("s2", 3) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "price.tag", startFrame: W("s2", 6), endFrame: W("s2", 6) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "price.swing", startFrame: W("s2", 6), endFrame: W("s2", 9), from: 12, to: 0, easing: "out", unit: "deg" },
      { type: "interpolate", target: "dream.camera", startFrame: W("s2", 9), endFrame: W("s2", 9) + 8, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "hero.x", startFrame: W("s2", 9) - 6, endFrame: W("s2", 11), from: 0, to: -3.2, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: W("s2", 9) - 6, endFrame: W("s2", 11), from: 2.5, to: 1.9, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.outfit", startFrame: W("s2", 11), endFrame: W("s2", 11) + 1, from: 0, to: 1, easing: "linear" },
      { type: "interpolate", target: "sky.time", startFrame: W("s2", 10), endFrame: W("s2", 12), from: 0.15, to: 0.25, easing: "soft" },
      { type: "interpolate", target: "sky.time", startFrame: W("s2", 13), endFrame: W("s2", 15), from: 0.25, to: 0.85, easing: "inOut" },
      { type: "interpolate", target: "hero.z", startFrame: W("s2", 13) - 4, endFrame: W("s2", 14), from: 1.9, to: -1.8, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.outfit", startFrame: W("s2", 14), endFrame: W("s2", 14) + 1, from: 1, to: 2, easing: "linear" },
    ],
    badges: [
      { text: "CÂMERA CARA", variant: "negative", appearAt: W("s2", 6), disappearAt: W("s2", 12) },
      { text: "DOIS EMPREGOS", subtitle: "padaria + telemarketing", variant: "positive", appearAt: W("s2", 12), disappearAt: end(1) - 6 },
    ],
    highlights: ["FOTÓGRAFO", "CARA", "PADARIA", "TELEMARKETING"],
    captions: [
      { text: "Você quer ser fotógrafo. Só que câmera é cara.", from: voLocal("s2"), to: W("s2", 9) },
      { text: "Então, de manhã, padaria. De noite, telemarketing.", from: W("s2", 9), to: end(1) },
    ],
    audioCues: [
      narration("s2", "planned"),
      sfx("pop", W("s2", 3), 0.3),
      sfx("price", W("s2", 6), 0.3),
      sfx("oven-ding", W("s2", 12), 0.3),
      sfx("phone-ring", W("s2", 15), 0.26),
    ],
  },
  {
    id: "scene-03-cofrinho",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Cada pão vendido e cada cliente gritando no seu ouvido vira moeda no cofrinho. Até que, em vinte e quatro vezes...",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [key(0, P.rig), key(W("s3", 14), P.rig2, "linear"), key(end(2), P.piggy, "soft")],
    },
    objects: [
      ...BASE,
      hero("vaivém entre padaria e telemarketing", "volta pro quartinho, cansado"),
      { id: "piggy", type: "cofrinho-low-poly-com-janela", visible: true, state: { start: "vazio", end: "cheio e rachando" } },
      { id: "coins", type: "particulas-moeda", visible: true },
      { id: "angryBubbles", type: "baloes-vermelhos-xingamento", visible: true },
      { id: "creditCard", type: "cartao-credito-3d", visible: true, state: { start: "ausente", end: "mostra 24x" } },
    ],
    animations: [
      { type: "interpolate", target: "sky.time", startFrame: 0, endFrame: W("s3", 13), from: 0.85, to: 3.85, easing: "linear" },
      { type: "interpolate", target: "hero.shuttle", startFrame: 0, endFrame: W("s3", 13), from: 0, to: 6, easing: "linear" },
      { type: "interpolate", target: "coins.emit", startFrame: W("s3", 1), endFrame: W("s3", 13), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "angry.bubbles", startFrame: W("s3", 5), endFrame: W("s3", 7), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "angry.bubbles", startFrame: W("s3", 9), endFrame: W("s3", 10), from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "piggy.fill", startFrame: W("s3", 1), endFrame: W("s3", 14), from: 0, to: 1, easing: "soft", unit: "0-1" },
      { type: "spring", target: "piggy.scale", startFrame: W("s3", 13), endFrame: W("s3", 13) + 30, from: 1.25, to: 1, damping: 9 },
      { type: "interpolate", target: "hero.fatigue", startFrame: 0, endFrame: end(2), from: 0, to: 0.6, easing: "linear", unit: "0-1" },
      { type: "spring", target: "card.installments", startFrame: W("s3", 17), endFrame: W("s3", 17) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "hero.x", startFrame: 243, endFrame: end(2), from: -3.2, to: 0, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: 243, endFrame: end(2), from: 1.9, to: 2.5, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.outfit", startFrame: 243, endFrame: 244, from: 1, to: 0, easing: "linear" },
      { type: "interpolate", target: "piggy.crack", startFrame: 243, endFrame: end(2), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "COFRINHO", subtitle: "seu único investimento", variant: "info", appearAt: W("s3", 13), disappearAt: W("s3", 17) },
      { text: "24X SEM JUROS", variant: "info", appearAt: W("s3", 17), disappearAt: end(2) - 3 },
    ],
    highlights: ["PÃO", "GRITANDO", "MOEDA", "COFRINHO", "VINTE", "QUATRO"],
    captions: [
      { text: "Cada pão vendido e cada cliente gritando no seu ouvido", from: voLocal("s3"), to: W("s3", 10) },
      { text: "vira moeda no cofrinho. Até que, em vinte e quatro vezes...", from: W("s3", 10), to: end(2) },
    ],
    audioCues: [
      narration("s3", "planned"),
      sfx("coin", W("s3", 1), 0.22),
      sfx("shout-muffled", W("s3", 6), 0.22),
      sfx("coin", W("s3", 8), 0.22),
      sfx("coin", W("s3", 11), 0.22),
      sfx("coin-pile", W("s3", 13), 0.26),
      sfx("card", W("s3", 17), 0.28),
    ],
  },
  {
    id: "scene-04-camera",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Ela chega. A sua primeira câmera.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, P.heroLow), key(end(3), P.heroLowIn, "soft")],
    },
    objects: [
      ...BASE,
      hero("no quartinho, sem câmera", "câmera no pescoço"),
      { id: "piggy", type: "cofrinho-low-poly-com-janela", visible: true, state: { start: "rachado", end: "explodido" } },
      { id: "cameraBox", type: "caixa-da-camera", visible: true, state: { start: "no alto", end: "aberta" } },
      { id: "godrays", type: "feixes-volumetricos", visible: true },
    ],
    animations: [
      { type: "spring", target: "piggy.break", startFrame: W("s4", 0), endFrame: W("s4", 0) + 30, from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "spring", target: "cameraBox.drop", startFrame: W("s4", 0) + 4, endFrame: W("s4", 0) + 34, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "cameraBox.open", startFrame: W("s4", 2), endFrame: W("s4", 4), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "godrays.intensity", startFrame: W("s4", 2), endFrame: W("s4", 2) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "camera.lift", startFrame: W("s4", 4), endFrame: W("s4", 5) + 20, from: 0, to: 1, easing: "soft", unit: "0-1" },
      { type: "interpolate", target: "sparkles", startFrame: W("s4", 4), endFrame: W("s4", 5) + 20, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "hero.hasCamera", startFrame: 110, endFrame: 111, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [{ text: "PRIMEIRA CÂMERA", variant: "positive", appearAt: W("s4", 4), disappearAt: end(3) - 2 }],
    highlights: ["PRIMEIRA", "CÂMERA"],
    captions: [{ text: "Ela chega. A sua primeira câmera.", from: voLocal("s4"), to: end(3) }],
    audioCues: [narration("s4", "planned"), sfx("crack", W("s4", 0), 0.34), sfx("choir", W("s4", 2), 0.35)],
  },
  {
    id: "scene-05-sem-cliente",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Mas ninguém te contrata. Então você fotografa o pão da padaria. Ficou lindo. Ninguém paga.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [
        key(0, P.quartoMid),
        key(W("s5", 4), P.quartoMid),
        key(W("s5", 7), P.padariaClose, "inOut"),
        key(W("s5", 13), P.padariaClose, "soft"),
        key(end(4), P.padariaClose2, "linear"),
      ],
    },
    objects: [
      ...BASE,
      hero("no quartinho, com câmera", "na padaria, fotografando o pão"),
      { id: "phone", type: "celular-gigante-0-mensagens", visible: true, state: { start: "ausente", end: "flutuando" } },
      { id: "cricket", type: "grilo-low-poly", visible: true },
      { id: "bread", type: "pao-no-pedestal-com-spot", visible: true, state: { start: "na vitrine", end: "fotografado" } },
      { id: "polaroid", type: "polaroide-do-pao-com-R$0", visible: true, state: { start: "ausente", end: "impressa" } },
    ],
    animations: [
      { type: "interpolate", target: "sky.time", startFrame: 0, endFrame: W("s5", 4), from: 3.85, to: 4.4, easing: "soft" },
      { type: "spring", target: "phone.show", startFrame: W("s5", 1), endFrame: W("s5", 1) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "cricket.jump", startFrame: W("s5", 3), endFrame: W("s5", 4) + 20, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "hero.x", startFrame: W("s5", 4), endFrame: W("s5", 6), from: 0, to: -3.2, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: W("s5", 4), endFrame: W("s5", 6), from: 2.5, to: 2.0, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "bread.glam", startFrame: W("s5", 8), endFrame: W("s5", 8) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: W("s5", 11), endFrame: W("s5", 11) + 3, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: W("s5", 11) + 3, endFrame: W("s5", 11) + 6, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "photo.print", startFrame: W("s5", 12), endFrame: W("s5", 12) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "photo.priceTag", startFrame: W("s5", 13), endFrame: W("s5", 13) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "music.duck", startFrame: W("s5", 13), endFrame: W("s5", 13) + 3, from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "music.duck", startFrame: end(4) - 6, endFrame: end(4), from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [
      { text: "SEM CLIENTE", variant: "negative", appearAt: W("s5", 1), disappearAt: W("s5", 11) },
      { text: "FOTO LINDA", variant: "positive", appearAt: W("s5", 11), disappearAt: W("s5", 13) },
      { text: "NINGUÉM PAGA", variant: "negative", appearAt: W("s5", 13), disappearAt: end(4) - 4 },
    ],
    highlights: ["NINGUÉM", "CONTRATA", "PÃO", "LINDO", "PAGA"],
    captions: [
      { text: "Mas ninguém te contrata.", from: voLocal("s5"), to: W("s5", 4) },
      { text: "Então você fotografa o pão da padaria.", from: W("s5", 4), to: W("s5", 11) },
      { text: "Ficou lindo. Ninguém paga.", from: W("s5", 11), to: end(4) },
    ],
    audioCues: [
      narration("s5", "planned"),
      sfx("crickets", W("s5", 3), 0.28),
      sfx("shutter", W("s5", 11), 0.36),
    ],
  },
  {
    id: "scene-06-experiencia",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Aí uma casa de show te chama. Não tem verba, mas é uma vitrine absurda. Isso tem nome: pagamento em experiência.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [
        key(0, P.padariaClose2),
        key(10, P.showFacade, "inOut"),
        key(W("s6", 3), P.showFacade),
        key(W("s6", 7), P.door, "soft"),
        key(end(5), P.door2, "linear"),
      ],
    },
    objects: [
      ...BASE,
      hero("na padaria", "na porta da casa de show, segurando o nada"),
      { id: "produtor", type: "boneco-produtor-oculos-corrente", visible: true, state: { start: "ausente", end: "na porta, bolsos vazios" } },
      { id: "callBubble", type: "balao-chamada-3d", visible: true },
      { id: "vitrineFrame", type: "moldura-dourada-VITRINE", visible: true, state: { start: "no alto", end: "emoldurando o Você" } },
      { id: "xpCoin", type: "moeda-3d-XP", visible: true, state: { start: "ausente", end: "no chão" } },
    ],
    animations: [
      { type: "interpolate", target: "sky.time", startFrame: 0, endFrame: 10, from: 4.4, to: 4.85, easing: "inOut" },
      { type: "interpolate", target: "call.ring", startFrame: W("s6", 0), endFrame: W("s6", 0) + 20, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "casaShow.neon", startFrame: W("s6", 2), endFrame: W("s6", 2) + 12, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "hero.x", startFrame: W("s6", 3), endFrame: W("s6", 7), from: -3.2, to: 0.3, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: W("s6", 3), endFrame: W("s6", 7), from: 2.0, to: -1.2, easing: "inOut", unit: "u3d" },
      { type: "spring", target: "produtor.pop", startFrame: W("s6", 5), endFrame: W("s6", 5) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "produtor.pockets", startFrame: W("s6", 8), endFrame: W("s6", 8) + 30, from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "spring", target: "vitrine.frame", startFrame: W("s6", 13), endFrame: W("s6", 13) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "xpCoin.drop", startFrame: W("s6", 18), endFrame: W("s6", 18) + 24, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [
      { text: "SEM VERBA", variant: "negative", appearAt: W("s6", 7), disappearAt: W("s6", 15) },
      { text: "PAGAMENTO EM EXPERIÊNCIA", subtitle: "aceito em: lugar nenhum", variant: "info", appearAt: W("s6", 18), disappearAt: end(5) - 4 },
    ],
    highlights: ["CASA", "SHOW", "VERBA", "VITRINE", "EXPERIÊNCIA"],
    captions: [
      { text: "Aí uma casa de show te chama.", from: voLocal("s6"), to: W("s6", 7) },
      { text: "Não tem verba, mas é uma vitrine absurda.", from: W("s6", 7), to: W("s6", 15) },
      { text: "Isso tem nome: pagamento em experiência.", from: W("s6", 15), to: end(5) },
    ],
    audioCues: [
      narration("s6", "planned"),
      sfx("phone-ring", W("s6", 0), 0.26),
      sfx("neon-buzz", W("s6", 2), 0.2),
      sfx("frame-drop", W("s6", 13), 0.28),
      sfx("coin-bounce", W("s6", 18) + 8, 0.3),
    ],
  },
  {
    id: "scene-07-melhor-trabalho",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Você faz o melhor trabalho da sua vida. Edita até as quatro da manhã. Eles postam. Sem crédito.",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [
        key(0, P.showInside),
        key(W("s7", 8) - 1, P.showInside2, "linear"),
        key(W("s7", 8), P.quartoNight),
        key(W("s7", 14), P.quartoNight),
        key(W("s7", 15) + 6, P.telao, "inOut"),
        key(end(6), P.telao),
      ],
    },
    objects: [
      ...BASE,
      hero("no palco", "no quartinho, de olheira"),
      { id: "crowd", type: "plateia-24-capsulas", visible: true },
      { id: "stageLights", type: "feixes-vermelho-e-cobalto", visible: true },
      { id: "speaker", type: "caixa-de-som", visible: true },
      { id: "photoStack", type: "cards-de-foto", visible: true, state: { start: "vazio", end: "no telão" } },
      { id: "deskClock", type: "relogio-digital-3d", visible: true },
      { id: "telao", type: "telao-com-post", visible: true, state: { start: "apagado", end: "post sem crédito" } },
      { id: "scissors", type: "tesoura-low-poly", visible: true },
    ],
    animations: [
      { type: "interpolate", target: "hero.x", startFrame: 0, endFrame: 10, from: 0.3, to: 0, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: 0, endFrame: 10, from: -1.2, to: -1.6, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "stage.lights", startFrame: 0, endFrame: W("s7", 8), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "crowd.jump", startFrame: 0, endFrame: W("s7", 8), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "hero.y", startFrame: W("s7", 3), endFrame: W("s7", 3) + 30, from: 0, to: 0.9, damping: 10, unit: "u3d" },
      { type: "interpolate", target: "flash.burst", startFrame: W("s7", 3), endFrame: W("s7", 3) + 6, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: W("s7", 5), endFrame: W("s7", 5) + 6, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "flash.burst", startFrame: W("s7", 7), endFrame: W("s7", 7) + 6, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "photos.fly", startFrame: W("s7", 3), endFrame: W("s7", 8), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "hero.y", startFrame: W("s7", 8), endFrame: W("s7", 8) + 1, from: 0.9, to: 0, easing: "linear", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: W("s7", 8), endFrame: W("s7", 8) + 1, from: -1.6, to: 2.5, easing: "linear", unit: "u3d" },
      { type: "interpolate", target: "sky.time", startFrame: W("s7", 8), endFrame: W("s7", 13), from: 4.85, to: 5.12, easing: "linear" },
      { type: "interpolate", target: "clock.time", startFrame: W("s7", 8), endFrame: W("s7", 13), from: 23, to: 28, easing: "linear" },
      { type: "interpolate", target: "hero.fatigue", startFrame: W("s7", 8), endFrame: W("s7", 13), from: 0.6, to: 0.85, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "photos.toScreen", startFrame: W("s7", 14), endFrame: W("s7", 15), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "screen.post", startFrame: W("s7", 15), endFrame: W("s7", 15) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "credit.cut", startFrame: W("s7", 16), endFrame: W("s7", 16) + 14, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "music.duck", startFrame: W("s7", 16), endFrame: W("s7", 16) + 3, from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "music.duck", startFrame: end(6) - 6, endFrame: end(6), from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [
      { text: "MELHOR TRABALHO DA VIDA", variant: "positive", appearAt: W("s7", 3), disappearAt: W("s7", 14) },
      { text: "SEM CRÉDITO", variant: "negative", appearAt: W("s7", 16), disappearAt: end(6) - 4 },
    ],
    highlights: ["MELHOR", "VIDA", "QUATRO", "POSTAM", "CRÉDITO"],
    captions: [
      { text: "Você faz o melhor trabalho da sua vida.", from: voLocal("s7"), to: W("s7", 8) },
      { text: "Edita até as quatro da manhã.", from: W("s7", 8), to: W("s7", 14) },
      { text: "Eles postam. Sem crédito.", from: W("s7", 14), to: end(6) },
    ],
    audioCues: [
      narration("s7", "planned"),
      sfx("crowd-bed", 0, 0.2),
      sfx("shutter", W("s7", 3), 0.34),
      sfx("shutter", W("s7", 5), 0.34),
      sfx("shutter", W("s7", 7), 0.34),
      sfx("clock-tick", W("s7", 8), 0.24),
      sfx("whoosh-soft", W("s7", 14), 0.26),
      sfx("scissors", W("s7", 16), 0.34),
    ],
  },
  {
    id: "scene-08-dms",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Agora vai. Você manda mensagem pra todas as casas da cidade. Visualizado. Visualizado. Visualizado.",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [key(0, P.telao), key(W("s8", 2), P.city, "inOut"), key(end(7), P.city2, "linear")],
    },
    objects: [
      ...BASE,
      hero("no quartinho", "no centro da cidade, cabeça baixa"),
      { id: "casasExtra", type: "4-casas-de-show-pequenas", visible: true, state: { start: "ausentes", end: "nas bordas" } },
      { id: "dmPlanes", type: "5-avioes-de-papel", visible: true, state: { start: "ausentes", end: "caídos" } },
      { id: "seenMarks", type: "icones-visto", visible: true, state: { start: "0", end: "3" } },
    ],
    animations: [
      { type: "interpolate", target: "sky.time", startFrame: 0, endFrame: W("s8", 2), from: 5.12, to: 5.5, easing: "inOut" },
      { type: "interpolate", target: "hero.z", startFrame: 0, endFrame: W("s8", 2), from: 2.5, to: 0.5, easing: "inOut", unit: "u3d" },
      { type: "spring", target: "casasExtra.rise", startFrame: W("s8", 0), endFrame: W("s8", 0) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "dms.fly", startFrame: W("s8", 3), endFrame: W("s8", 10), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "seen.marks", startFrame: W("s8", 11), endFrame: W("s8", 11) + 1, from: 0, to: 1, easing: "linear" },
      { type: "interpolate", target: "seen.marks", startFrame: W("s8", 12), endFrame: W("s8", 12) + 1, from: 1, to: 2, easing: "linear" },
      { type: "interpolate", target: "seen.marks", startFrame: W("s8", 13), endFrame: W("s8", 13) + 1, from: 2, to: 3, easing: "linear" },
      { type: "interpolate", target: "hero.hope", startFrame: W("s8", 11), endFrame: W("s8", 13) + 10, from: 1, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "AGORA VAI?", variant: "warning", icon: "?", appearAt: W("s8", 0), disappearAt: W("s8", 10) },
      { text: "VISUALIZADO", subtitle: "e não respondeu", variant: "negative", appearAt: W("s8", 11), disappearAt: end(7) - 4 },
    ],
    highlights: ["AGORA", "TODAS", "VISUALIZADO"],
    captions: [
      { text: "Agora vai. Você manda mensagem pra todas as casas da cidade.", from: voLocal("s8"), to: W("s8", 11) },
      { text: "Visualizado. Visualizado. Visualizado.", from: W("s8", 11), to: end(7) },
    ],
    audioCues: [
      narration("s8", "planned"),
      sfx("pop", W("s8", 0), 0.26),
      sfx("paper-whoosh", W("s8", 3), 0.26),
      sfx("paper-whoosh", W("s8", 6), 0.26),
      sfx("seen-blip", W("s8", 11), 0.3),
      sfx("seen-blip", W("s8", 12), 0.3),
      sfx("seen-blip", W("s8", 13), 0.3),
    ],
  },
  {
    id: "scene-09-credencial",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Uma responde: a gente te dá a credencial. Tá te fazendo um favor, viu?",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, P.city2), key(W("s9", 2), P.casa2, "inOut"), key(W("s9", 7), P.heroChest, "inOut"), key(end(8), P.heroChest)],
    },
    objects: [
      ...BASE,
      hero("no centro, cabeça baixa", "1 credencial no pescoço"),
      { id: "casasExtra", type: "4-casas-de-show-pequenas", visible: true },
      { id: "produtor2", type: "boneco-produtor-oculos-corrente-bone", visible: true, state: { start: "ausente", end: "joinha" } },
      { id: "replyPlane", type: "aviao-de-papel-dourado", visible: true },
      { id: "credential", type: "credencial-com-cordao", visible: true, state: { start: "no alto", end: "no pescoço" } },
    ],
    animations: [
      { type: "interpolate", target: "reply.plane", startFrame: W("s9", 0), endFrame: W("s9", 0) + 18, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "produtor2.pop", startFrame: W("s9", 1), endFrame: W("s9", 1) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "credential.drop", startFrame: W("s9", 7), endFrame: W("s9", 7) + 30, from: 0, to: 1, damping: 8, unit: "0-1" },
      { type: "interpolate", target: "hero.lanyards", startFrame: W("s9", 7) + 10, endFrame: W("s9", 7) + 11, from: 0, to: 1, easing: "linear" },
      { type: "interpolate", target: "halo.credential", startFrame: W("s9", 7), endFrame: W("s9", 7) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "halo.credential", startFrame: W("s9", 7) + 10, endFrame: W("s9", 7) + 20, from: 1, to: 0.4, easing: "in", unit: "0-1" },
      { type: "spring", target: "produtor2.thumb", startFrame: W("s9", 10), endFrame: W("s9", 10) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "hero.hope", startFrame: W("s9", 7), endFrame: W("s9", 7) + 12, from: 0, to: 0.6, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "CREDENCIAL", subtitle: "moeda oficial do produtor", variant: "info", appearAt: W("s9", 7), disappearAt: end(8) - 4 },
      { text: "UM FAVOR?", variant: "warning", icon: "?", appearAt: W("s9", 12), disappearAt: end(8) - 4 },
    ],
    highlights: ["CREDENCIAL", "FAVOR"],
    captions: [
      { text: "Uma responde: a gente te dá a credencial.", from: voLocal("s9"), to: W("s9", 8) },
      { text: "Tá te fazendo um favor, viu?", from: W("s9", 8), to: end(8) },
    ],
    audioCues: [
      narration("s9", "planned"),
      sfx("paper-whoosh", W("s9", 0), 0.26),
      sfx("lanyard-drop", W("s9", 7), 0.32),
      sfx("sparkle", W("s9", 7) + 4, 0.22),
    ],
  },
  {
    id: "scene-10-economia-credencial",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Só que o mercado não aceita credencial. O ônibus não aceita credencial. E no show, nem água: é só pro camarim.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [
        key(0, P.heroChest),
        key(W("s10", 2), P.mercado, "inOut"),
        key(W("s10", 7), P.mercado),
        key(W("s10", 9), P.onibus, "inOut"),
        key(W("s10", 12), P.onibus),
        key(W("s10", 14), P.camarim, "inOut"),
        key(end(9), P.camarim),
      ],
    },
    objects: [
      ...BASE,
      hero("no centro, 1 credencial", "barrado na porta do camarim"),
      { id: "register", type: "caixa-registradora-com-leitor", visible: true, state: { start: "neutra", end: "recusou" } },
      { id: "turnstile", type: "catraca-com-luz", visible: true, state: { start: "neutra", end: "travada" } },
      { id: "waterBottle", type: "garrafa-dagua", visible: true, state: { start: "ausente", end: "puxada pro camarim" } },
      { id: "camarimDoor", type: "porta-com-estrela", visible: true, state: { start: "aberta", end: "fechada" } },
      { id: "denyMarks", type: "x-vermelho-3d", visible: true },
    ],
    animations: [
      { type: "interpolate", target: "hero.x", startFrame: 0, endFrame: W("s10", 2), from: 0, to: 3.2, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: 0, endFrame: W("s10", 2), from: 0.5, to: 1.9, easing: "inOut", unit: "u3d" },
      { type: "spring", target: "register.deny", startFrame: W("s10", 5) + 2, endFrame: W("s10", 5) + 32, from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "interpolate", target: "hero.z", startFrame: W("s10", 7), endFrame: W("s10", 9), from: 1.9, to: -1.2, easing: "inOut", unit: "u3d" },
      { type: "spring", target: "turnstile.deny", startFrame: W("s10", 10), endFrame: W("s10", 10) + 30, from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "spring", target: "hero.bump", startFrame: W("s10", 10), endFrame: W("s10", 10) + 30, from: 0, to: 1, damping: 7, unit: "0-1" },
      { type: "interpolate", target: "hero.x", startFrame: W("s10", 12), endFrame: W("s10", 14), from: 3.2, to: -0.8, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: W("s10", 12), endFrame: W("s10", 14), from: -1.2, to: -2.4, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "sky.time", startFrame: W("s10", 12), endFrame: W("s10", 14), from: 5.5, to: 5.85, easing: "inOut" },
      { type: "spring", target: "water.bottle", startFrame: W("s10", 15), endFrame: W("s10", 15) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "water.withdraw", startFrame: W("s10", 17), endFrame: W("s10", 17) + 10, from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "camarim.door", startFrame: W("s10", 19), endFrame: W("s10", 19) + 4, from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "MERCADO: NÃO ACEITA", variant: "negative", appearAt: W("s10", 5), disappearAt: W("s10", 9) },
      { text: "ÔNIBUS: NÃO ACEITA", variant: "negative", appearAt: W("s10", 10), disappearAt: W("s10", 14) },
      { text: "SEM ÁGUA", subtitle: "só pro camarim", variant: "negative", appearAt: W("s10", 16), disappearAt: end(9) - 4 },
    ],
    highlights: ["MERCADO", "ÔNIBUS", "CREDENCIAL", "ÁGUA", "CAMARIM"],
    captions: [
      { text: "Só que o mercado não aceita credencial.", from: voLocal("s10"), to: W("s10", 7) },
      { text: "O ônibus não aceita credencial.", from: W("s10", 7), to: W("s10", 12) },
      { text: "E no show, nem água: é só pro camarim.", from: W("s10", 12), to: end(9) },
    ],
    audioCues: [
      narration("s10", "planned"),
      sfx("error-buzz", W("s10", 5) + 2, 0.3),
      sfx("turnstile", W("s10", 10), 0.32),
      sfx("door-slam", W("s10", 19), 0.36),
    ],
  },
  {
    id: "scene-11-seis-meses",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Seis meses depois, seu amigo pergunta se você já tá rico. Você tem seis credenciais, mil curtidas e três reais na conta.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, P.quarto11), key(end(10), P.quarto11b, "soft")],
    },
    objects: [
      ...BASE,
      hero("na porta do camarim, 1 credencial", "no quartinho, 6 credenciais"),
      { id: "calendar", type: "calendario-3d-parede", visible: true, state: { start: "mês 0", end: "mês 6" } },
      { id: "wallPhotos", type: "fotos-coladas-na-parede", visible: true, state: { start: "3", end: "18" } },
      { id: "phone", type: "celular-com-chat", visible: true },
      { id: "likes", type: "coracoes-vermelhos", visible: true },
      { id: "piggy", type: "cofrinho-novo", visible: true, state: { start: "vazio", end: "vazio" } },
      { id: "balance", type: "display-R$-3,47", visible: true, state: { start: "ausente", end: "R$ 3,47" } },
    ],
    animations: [
      { type: "interpolate", target: "hero.x", startFrame: 0, endFrame: 10, from: -0.8, to: 0, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: 0, endFrame: 10, from: -2.4, to: 2.5, easing: "inOut", unit: "u3d" },
      { type: "interpolate", target: "calendar.flip", startFrame: 0, endFrame: W("s11", 2) + 10, from: 0, to: 6, easing: "linear" },
      { type: "interpolate", target: "sky.time", startFrame: 0, endFrame: W("s11", 2) + 10, from: 5.85, to: 11.85, easing: "linear" },
      { type: "interpolate", target: "hero.lanyards", startFrame: 0, endFrame: W("s11", 2) + 10, from: 1, to: 6, easing: "linear" },
      { type: "interpolate", target: "wall.photos", startFrame: 0, endFrame: W("s11", 2) + 10, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "hero.fatigue", startFrame: 0, endFrame: W("s11", 2) + 10, from: 0.85, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "chat.friend", startFrame: W("s11", 3), endFrame: W("s11", 3) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "likes.burst", startFrame: W("s11", 15), endFrame: W("s11", 17), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "likes.bounce", startFrame: W("s11", 17), endFrame: W("s11", 17) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "balance.show", startFrame: W("s11", 18), endFrame: W("s11", 18) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "music.duck", startFrame: W("s11", 18), endFrame: W("s11", 18) + 4, from: 1, to: 0.2, easing: "linear", unit: "0-1" },
    ],
    badges: [
      { text: "6 MESES", variant: "info", appearAt: 4, disappearAt: W("s11", 3) },
      { text: "R$ 3,47", subtitle: "nenhum centavo veio da foto", variant: "negative", appearAt: W("s11", 18), disappearAt: end(10) - 4 },
    ],
    highlights: ["SEIS", "RICO", "CREDENCIAIS", "CURTIDAS", "TRÊS"],
    captions: [
      { text: "Seis meses depois, seu amigo pergunta se você já tá rico.", from: voLocal("s11"), to: W("s11", 11) },
      { text: "Você tem seis credenciais, mil curtidas e três reais na conta.", from: W("s11", 11), to: end(10) },
    ],
    audioCues: [
      narration("s11", "planned"),
      sfx("page-flip", 0, 0.22),
      sfx("page-flip", 12, 0.22),
      sfx("page-flip", 24, 0.22),
      sfx("msg-pop", W("s11", 3), 0.28),
      sfx("heart-pops", W("s11", 15), 0.24),
      sfx("coin-sad", W("s11", 18), 0.3),
    ],
  },
  {
    id: "scene-12-final",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Pronto: agora você entende como funciona a carreira de fotógrafo de show. Visibilidade não paga a parcela da câmera.",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [
        key(0, P.quarto11b),
        key(W("s12", 3), P.wideFinal, "inOut"),
        key(W("s12", 11), P.wideFinal2, "linear"),
        key(W("s12", 13), P.padariaDawn, "inOut"),
        key(end(11), P.padariaDawn),
      ],
    },
    objects: [
      ...BASE,
      hero("no quartinho, 6 credenciais", "na padaria às 5h, de padeiro, câmera e 6 credenciais no pescoço"),
      { id: "finalLabels", type: "rotulos-3d-da-maquete", visible: true },
      { id: "alarm", type: "relogio-05:00", visible: true, state: { start: "ausente", end: "tocando" } },
      { id: "creditCard", type: "cartao-credito-3d", visible: true, state: { start: "ausente", end: "mostra 7/24" } },
      { id: "endCard", type: "cartela-2d-uga", visible: true },
    ],
    animations: [
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 0), endFrame: W("s12", 8), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "sky.time", startFrame: W("s12", 11), endFrame: W("s12", 13), from: 11.85, to: 12.2, easing: "inOut" },
      { type: "interpolate", target: "hero.x", startFrame: W("s12", 12), endFrame: W("s12", 12) + 1, from: 0, to: -3.2, easing: "linear", unit: "u3d" },
      { type: "interpolate", target: "hero.z", startFrame: W("s12", 12), endFrame: W("s12", 12) + 1, from: 2.5, to: 1.9, easing: "linear", unit: "u3d" },
      { type: "interpolate", target: "hero.outfit", startFrame: W("s12", 12), endFrame: W("s12", 12) + 1, from: 0, to: 1, easing: "linear" },
      { type: "interpolate", target: "alarm.ring", startFrame: W("s12", 12), endFrame: W("s12", 12) + 40, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "card.installments", startFrame: W("s12", 16), endFrame: W("s12", 16) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: 240, endFrame: 255, from: 0, to: 0.75, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "FOTÓGRAFO DE SHOW", subtitle: "como funciona", variant: "info", size: "large", appearAt: W("s12", 3), disappearAt: W("s12", 12) },
      { text: "VISIBILIDADE NÃO PAGA A PARCELA", variant: "negative", size: "large", appearAt: W("s12", 12), disappearAt: 240 },
      { text: "UGA DO LITORAL", subtitle: "agenda aberta · aceito pix, não credencial", variant: "info", size: "large", appearAt: 245, disappearAt: end(11) },
    ],
    highlights: ["PRONTO", "CARREIRA", "VISIBILIDADE", "PARCELA", "CÂMERA"],
    captions: [
      { text: "Pronto: agora você entende como funciona a carreira de fotógrafo de show.", from: voLocal("s12"), to: W("s12", 12) },
      { text: "Visibilidade não paga a parcela da câmera.", from: W("s12", 12), to: 240 },
    ],
    audioCues: [
      narration("s12", "planned"),
      sfx("whoosh-soft", W("s12", 3), 0.24),
      sfx("hit-final", W("s12", 12), 0.36),
      sfx("alarm", W("s12", 12), 0.26),
      sfx("badge-big", 245, 0.3),
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
