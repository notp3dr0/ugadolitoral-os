import { P, SPOT } from "../layout";
import { evaluateTrack, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// "Como funciona a carreira de fotógrafo de show?" · Canal Dark · roteiro v1 aprovado em 2026-11-04, ambientado em São Paulo.
// Veio do scene-plan.ts da Fase 1. Ajustes técnicos (sem mudar conteúdo): posições e poses de câmera da
// maquete de São Paulo, frames fixos trocados por "fim da cena − n" (os cortes agora saem da voz real),
// trilhas extras de pose do boneco (hero.yaw, hero.shoot) e cues de áudio com os arquivos gerados.
// Frames de animações, badges, legendas, câmera e áudio são LOCAIS à cena; startFrame é global.

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };
export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-sao-paulo", language: "pt-BR" };

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
  /** posição vertical fixa (px), fora da pilha do topo; usada na cartela final */
  top?: number;
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
const key = (at: number, pose: { position: Vec3; target: Vec3; zoom?: number }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status: "ready" });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "ready" });

/** Anda de um lugar pro outro (hero.x e hero.z). */
const walk = (from: readonly [number, number], to: readonly [number, number], a: number, b: number, easing: EaseName = "inOut"): TrackAnimation[] => [
  { type: "interpolate", target: "hero.x", startFrame: a, endFrame: b, from: from[0], to: to[0], easing, unit: "u3d" },
  { type: "interpolate", target: "hero.z", startFrame: a, endFrame: b, from: from[1], to: to[1], easing, unit: "u3d" },
];
/** Troca instantânea de valor (contagens, roupa, teletransporte de corte seco). */
const step = (target: string, at: number, from: number, to: number): TrackAnimation => ({ type: "interpolate", target, startFrame: at, endFrame: at + 1, from, to, easing: "linear" });
const ease = (target: string, a: number, b: number, from: number, to: number, easing: EaseName = "inOut", unit?: TrackAnimation["unit"]): TrackAnimation => ({ type: "interpolate", target, startFrame: a, endFrame: b, from, to, easing, unit });
const pop = (target: string, at: number, from = 0, to = 1, damping = 11): TrackAnimation => ({ type: "spring", target, startFrame: at, endFrame: at + 32, from, to, damping, unit: "0-1" });
const flash = (at: number): TrackAnimation[] => [ease("flash.burst", at, at + 2, 0, 1, "out", "0-1"), ease("flash.burst", at + 2, at + 7, 1, 0, "in", "0-1")];

const BASE: SceneObject[] = [
  { id: "city", type: "quarteirao-sao-paulo", visible: true },
  { id: "skyline", type: "skyline-copan-masp-antenas", visible: true },
  { id: "padaria", type: "padaria-em-corte", visible: true },
  { id: "callcenter", type: "telemarketing-em-pilotis", visible: true },
  { id: "quarto", type: "quartinho-em-corte", visible: true },
  { id: "casaShow", type: "casa-de-show-AO-VIVO", visible: true },
  { id: "mercado", type: "mercadinho-em-corte", visible: true },
  { id: "onibus", type: "ponto-onibus-catraca", visible: true },
  { id: "photoLabel", type: "rotulo-2d: FOTOGRAFIA R$ 0,00", visible: true },
];
const hero = (start: string, endState: string): SceneObject => ({ id: "hero", type: "boneco-voce", visible: true, state: { start, end: endState } });
const S = SPOT;

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
      keys: [key(0, P.stageClose), key(W("s1", 10), P.stageClose2, "soft"), key(Math.round((W("s1", 10) + end(0)) / 2), P.rewindMid, "in"), key(end(0) - 4, P.wide, "out"), key(end(0), P.wide)],
    },
    objects: [...BASE, hero("no palco, fotografando, 6 credenciais", "no quartinho, sem câmera, 0 credenciais"), { id: "crowd", type: "plateia", visible: true }, { id: "rewindFx", type: "overlay-2d-rebobinar", visible: true }],
    animations: [
      ...walk(S.stage.p, S.stage.p, 0, 1),
      step("hero.yaw", 0, 200, 200),
      step("hero.hasCamera", 0, 1, 1),
      step("hero.lanyards", 0, 6, 6),
      step("hero.fatigue", 0, 1, 1),
      ease("hero.shoot", W("s1", 1), W("s1", 1) + 8, 0, 1, "inOut", "0-1"),
      { type: "spring", target: "photoLabel.opacity", startFrame: -6, endFrame: 26, from: 0, to: 1, damping: 11, unit: "0-1" },
      ...flash(W("s1", 2) + 4),
      ...flash(W("s1", 9)),
      ease("crowd.jump", 0, W("s1", 10), 0, 1, "linear", "0-1"),
      ease("stage.lights", 0, 2, 1, 1, "linear", "0-1"),
      ease("rewind.amount", W("s1", 10), end(0) - 20, 0, 1, "in", "0-1"),
      ease("sky.time", W("s1", 10), end(0) - 20, 0.95, 0.15, "linear"),
      ease("hero.lanyards", W("s1", 10), end(0) - 24, 6, 0, "linear"),
      ease("hero.fatigue", W("s1", 10), end(0) - 24, 1, 0, "linear", "0-1"),
      ease("hero.shoot", W("s1", 10), W("s1", 10) + 10, 1, 0, "inOut", "0-1"),
      ease("stage.lights", W("s1", 10), end(0) - 20, 1, 0, "linear", "0-1"),
      ...walk(S.stage.p, S.quarto.p, end(0) - 32, end(0) - 20),
      ease("hero.yaw", end(0) - 32, end(0) - 20, 200, 0, "inOut", "deg"),
      ease("hero.hasCamera", end(0) - 26, end(0) - 25, 1, 0, "linear", "0-1"),
      ease("rewind.amount", end(0) - 20, end(0), 1, 0, "out", "0-1"),
    ],
    badges: [{ text: "TRABALHA E NÃO RECEBE?", variant: "warning", icon: "?", appearAt: W("s1", 6), disappearAt: end(0) - 16 }],
    highlights: ["NUNCA", "REAL", "POSSÍVEL"],
    captions: [
      { text: "Esse fotógrafo trabalha toda semana e nunca recebeu um real.", from: voLocal("s1"), to: W("s1", 10) },
      { text: "Como isso é possível?", from: W("s1", 10), to: end(0) },
    ],
    audioCues: [narration("s1"), sfx("crowd-bed", 0, 0.16), sfx("flash", W("s1", 2) + 4, 0.34), sfx("badge", W("s1", 6), 0.26), sfx("flash", W("s1", 9), 0.34), sfx("rewind", W("s1", 10), 0.3)],
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
      keys: [key(0, P.wide), key(W("s2", 6), P.quarto, "soft"), key(W("s2", 9) - 6, P.quarto), key(W("s2", 11), P.padaria, "inOut"), key(W("s2", 13) - 4, P.padaria), key(W("s2", 14) + 2, P.callcenter, "inOut"), key(end(1), P.callcenter)],
    },
    objects: [...BASE, hero("no quartinho, casual, sem câmera", "no telemarketing, de headset"), { id: "dreamBubble", type: "balao-com-camera", visible: true }, { id: "priceTag", type: "etiqueta-$$$$", visible: true }],
    animations: [
      pop("dream.camera", W("s2", 3)),
      pop("price.tag", W("s2", 6), 0, 1, 9),
      ease("dream.camera", W("s2", 9), W("s2", 9) + 8, 1, 0, "in", "0-1"),
      ease("price.tag", W("s2", 9), W("s2", 9) + 8, 1, 0, "in", "0-1"),
      ...walk(S.quarto.p, S.padaria.p, W("s2", 9) - 6, W("s2", 11)),
      step("hero.outfit", W("s2", 11), 0, 1),
      ease("sky.time", W("s2", 10), W("s2", 12), 0.15, 0.36, "soft"),
      ...walk(S.padaria.p, S.callcenter.p, W("s2", 13) - 4, W("s2", 14) + 2),
      step("hero.outfit", W("s2", 14), 1, 2),
      ease("sky.time", W("s2", 13), W("s2", 15), 0.36, 0.88, "inOut"),
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
    audioCues: [narration("s2"), sfx("pop", W("s2", 3), 0.26), sfx("price", W("s2", 6), 0.26), sfx("oven-ding", W("s2", 12), 0.26), sfx("phone-ring", W("s2", 15), 0.2)],
  },
  {
    id: "scene-03-cofrinho",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Cada pão vendido e cada cliente gritando no seu ouvido vira moeda no cofrinho. Até que, em vinte e quatro vezes...",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.rig), key(W("s3", 14), P.rig2, "linear"), key(end(2) - 6, P.piggy, "soft"), key(end(2), P.piggy)] },
    objects: [...BASE, hero("vaivém entre padaria e telemarketing", "volta pro quartinho, cansado"), { id: "piggy", type: "cofrinho", visible: true }, { id: "coins", type: "moedas", visible: true }, { id: "angryBubbles", type: "baloes-xingamento", visible: true }, { id: "creditCard", type: "cartao-24x", visible: true }],
    animations: [
      ease("sky.time", 0, W("s3", 13), 0.88, 3.88, "linear"),
      ease("hero.shuttle", 0, W("s3", 13), 0, 6, "linear"),
      ease("coins.emit", W("s3", 1), W("s3", 13), 0, 1, "linear", "0-1"),
      ease("angry.bubbles", W("s3", 5), W("s3", 7), 0, 1, "out", "0-1"),
      ease("angry.bubbles", W("s3", 9), W("s3", 10), 1, 0, "in", "0-1"),
      ease("piggy.fill", W("s3", 1), W("s3", 14), 0, 1, "soft", "0-1"),
      { type: "spring", target: "piggy.scale", startFrame: W("s3", 13), endFrame: W("s3", 13) + 32, from: 1.3, to: 1, damping: 8 },
      ease("hero.fatigue", 0, end(2), 0, 0.6, "linear", "0-1"),
      pop("card.installments", W("s3", 17)),
      ease("card.installments", end(2) - 4, end(2), 1, 0, "in", "0-1"),
      ...walk(S.padaria.p, S.quarto.p, W("s3", 13), W("s3", 13) + 1),
      step("hero.outfit", W("s3", 13), 1, 0),
      ease("piggy.crack", end(2) - 12, end(2), 0, 1, "in", "0-1"),
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
    audioCues: [narration("s3"), sfx("coin", W("s3", 1), 0.2), sfx("shout-muffled", W("s3", 6), 0.2), sfx("coin", W("s3", 8), 0.2), sfx("coin", W("s3", 11), 0.2), sfx("coin-pile", W("s3", 13), 0.24), sfx("card", W("s3", 17), 0.26)],
  },
  {
    id: "scene-04-camera",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Ela chega. A sua primeira câmera.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.heroLow), key(end(3), P.heroLowIn, "soft")] },
    objects: [...BASE, hero("no quartinho, sem câmera", "câmera no pescoço"), { id: "piggy", type: "cofrinho", visible: true }, { id: "cameraBox", type: "caixa-da-camera", visible: true }, { id: "godrays", type: "feixes", visible: true }],
    animations: [
      pop("piggy.break", W("s4", 0), 0, 1, 9),
      pop("cameraBox.drop", W("s4", 0) + 2, 0, 1, 10),
      ease("cameraBox.open", W("s4", 2), W("s4", 4), 0, 1, "out", "0-1"),
      ease("godrays.intensity", W("s4", 2), W("s4", 2) + 10, 0, 1, "out", "0-1"),
      ease("camera.lift", W("s4", 4), W("s4", 5) + 16, 0, 1, "soft", "0-1"),
      ease("sparkles", W("s4", 4), end(3), 0, 1, "linear", "0-1"),
      step("hero.hasCamera", end(3) - 6, 0, 1),
      ease("camera.lift", end(3) - 6, end(3), 1, 0, "inOut", "0-1"),
      ease("godrays.intensity", end(3) - 6, end(3), 1, 0, "in", "0-1"),
    ],
    badges: [{ text: "PRIMEIRA CÂMERA", variant: "positive", appearAt: W("s4", 4), disappearAt: end(3) - 2 }],
    highlights: ["PRIMEIRA", "CÂMERA"],
    captions: [{ text: "Ela chega. A sua primeira câmera.", from: voLocal("s4"), to: end(3) }],
    audioCues: [narration("s4"), sfx("crack", W("s4", 0), 0.3), sfx("choir", W("s4", 2), 0.3)],
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
      keys: [key(0, P.quartoMid), key(W("s5", 4), P.quartoMid), key(W("s5", 7), P.padariaClose, "inOut"), key(W("s5", 13), P.padariaClose, "soft"), key(end(4), P.padariaClose2, "linear")],
    },
    objects: [...BASE, hero("no quartinho, com câmera", "na padaria, fotografando o pão"), { id: "phone", type: "celular-0-mensagens", visible: true }, { id: "cricket", type: "grilo", visible: true }, { id: "bread", type: "pao-no-pedestal", visible: true }, { id: "polaroid", type: "polaroide-R$0", visible: true }],
    animations: [
      ease("sky.time", 0, W("s5", 4), 3.88, 4.42, "soft"),
      pop("phone.show", W("s5", 1)),
      ease("phone.show", W("s5", 5), W("s5", 6), 1, 0, "in", "0-1"),
      ease("cricket.jump", W("s5", 3), W("s5", 4) + 24, 0, 1, "linear", "0-1"),
      ...walk(S.quarto.p, [-3.0, 3.05], W("s5", 4), W("s5", 7)),
      ease("hero.yaw", W("s5", 6), W("s5", 8), 0, -125, "inOut", "deg"),
      ease("bread.glam", W("s5", 7), W("s5", 7) + 14, 0, 1, "out", "0-1"),
      ease("hero.shoot", W("s5", 8), W("s5", 10), 0, 1, "inOut", "0-1"),
      ...flash(W("s5", 11)),
      pop("photo.print", W("s5", 12)),
      pop("photo.priceTag", W("s5", 13), 0, 1, 9),
      ease("hero.shoot", W("s5", 13), W("s5", 13) + 10, 1, 0, "inOut", "0-1"),
      ease("music.duck", W("s5", 13), W("s5", 13) + 3, 1, 0, "linear", "0-1"),
      ease("music.duck", end(4) - 6, end(4), 0, 1, "linear", "0-1"),
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
    audioCues: [narration("s5"), sfx("crickets", W("s5", 3), 0.24), sfx("shutter", W("s5", 11), 0.32)],
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
      keys: [key(0, P.padariaClose2), key(12, P.showFacade, "inOut"), key(W("s6", 3), P.showFacade), key(W("s6", 7), P.door, "soft"), key(end(5), P.door2, "linear")],
    },
    objects: [...BASE, hero("na padaria", "na porta da casa de show"), { id: "produtor", type: "produtor-oculos-corrente", visible: true }, { id: "callBubble", type: "balao-chamada", visible: true }, { id: "vitrineFrame", type: "moldura-VITRINE", visible: true }, { id: "xpCoin", type: "moeda-XP", visible: true }],
    animations: [
      ease("sky.time", 0, 12, 4.42, 4.88, "inOut"),
      ease("call.ring", W("s6", 0), W("s6", 0) + 24, 0, 1, "linear", "0-1"),
      ease("casaShow.neon", W("s6", 2), W("s6", 2) + 12, 0, 1, "linear", "0-1"),
      ...walk([-3.0, 3.05], S.door.p, W("s6", 3), W("s6", 7)),
      ease("hero.yaw", W("s6", 6), W("s6", 7) + 6, -125, -60, "inOut", "deg"),
      pop("produtor.pop", W("s6", 4), 0, 1, 10),
      pop("produtor.pockets", W("s6", 8), 0, 1, 9),
      pop("vitrine.frame", W("s6", 13), 0, 1, 10),
      ease("vitrine.frame", W("s6", 18) - 4, W("s6", 18) + 4, 1, 0, "in", "0-1"),
      ease("xpCoin.drop", W("s6", 18), W("s6", 18) + 26, 0, 1, "linear", "0-1"),
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
    audioCues: [narration("s6"), sfx("phone-ring", W("s6", 0), 0.2), sfx("neon-buzz", W("s6", 2), 0.18), sfx("frame-drop", W("s6", 13), 0.24), sfx("coin-bounce", W("s6", 18) + 8, 0.28)],
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
      keys: [key(0, P.showInside), key(W("s7", 8) - 1, P.showInside2, "linear"), key(W("s7", 8), P.quartoNight), key(W("s7", 14), P.quartoNight), key(W("s7", 15) + 6, P.telao, "inOut"), key(end(6), P.telao)],
    },
    objects: [...BASE, hero("no palco", "no quartinho, de olheira"), { id: "crowd", type: "plateia", visible: true }, { id: "speaker", type: "caixa-de-som", visible: true }, { id: "photoStack", type: "cards-de-foto", visible: true }, { id: "deskClock", type: "relogio-digital", visible: true }, { id: "telao", type: "telao-post", visible: true }, { id: "scissors", type: "tesoura", visible: true }],
    animations: [
      ...walk(S.door.p, S.stage.p, 0, 12),
      ease("hero.yaw", 0, 12, -60, 165, "inOut", "deg"),
      ease("stage.lights", 0, 8, 0, 1, "out", "0-1"),
      ease("crowd.jump", 0, W("s7", 8), 1, 2, "linear", "0-1"),
      ease("hero.shoot", 6, 14, 0, 1, "inOut", "0-1"),
      { type: "spring", target: "hero.y", startFrame: W("s7", 3) - 4, endFrame: W("s7", 3) + 28, from: 0, to: 0.42, damping: 10, unit: "u3d" },
      ...flash(W("s7", 3)),
      ...flash(W("s7", 5)),
      ...flash(W("s7", 7)),
      ease("photos.fly", W("s7", 3), W("s7", 8), 0, 1, "linear", "0-1"),
      step("hero.y", W("s7", 8), 0.42, 0),
      ...walk(S.stage.p, S.desk.p, W("s7", 8), W("s7", 8) + 1),
      step("hero.yaw", W("s7", 8), 165, S.desk.yaw),
      step("hero.shoot", W("s7", 8), 1, 0),
      step("hero.edit", W("s7", 8), 0, 1),
      step("stage.lights", W("s7", 8), 1, 0),
      ease("sky.time", W("s7", 8), W("s7", 13), 4.88, 5.12, "linear"),
      ease("clock.time", W("s7", 8), W("s7", 13), 23, 28, "linear"),
      ease("hero.fatigue", W("s7", 8), W("s7", 13), 0.6, 0.85, "linear", "0-1"),
      ease("photos.toScreen", W("s7", 14), W("s7", 15) + 4, 0, 1, "inOut", "0-1"),
      pop("screen.post", W("s7", 15), 0, 1, 12),
      ease("credit.cut", W("s7", 16), W("s7", 16) + 16, 0, 1, "out", "0-1"),
      ease("music.duck", W("s7", 16), W("s7", 16) + 3, 1, 0, "linear", "0-1"),
      ease("music.duck", end(6) - 6, end(6), 0, 1, "linear", "0-1"),
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
    audioCues: [narration("s7"), sfx("crowd-bed", 0, 0.18), sfx("shutter", W("s7", 3), 0.3), sfx("shutter", W("s7", 5), 0.3), sfx("shutter", W("s7", 7), 0.3), sfx("clock-tick", W("s7", 8), 0.2), sfx("whoosh-soft", W("s7", 14), 0.22), sfx("scissors", W("s7", 16), 0.32)],
  },
  {
    id: "scene-08-dms",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Agora vai. Você manda mensagem pra todas as casas da cidade. Visualizado. Visualizado. Visualizado.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.telao), key(W("s8", 2), P.city, "inOut"), key(end(7), P.city2, "linear")] },
    objects: [...BASE, hero("no quartinho", "no meio da rua, cabeça baixa"), { id: "casasExtra", type: "4-casas-de-show", visible: true }, { id: "dmPlanes", type: "avioes-de-papel", visible: true }, { id: "seenMarks", type: "visto", visible: true }],
    animations: [
      ease("sky.time", 0, W("s8", 2), 5.12, 5.5, "inOut"),
      step("hero.edit", 0, 1, 0),
      ...walk(S.desk.p, S.city.p, 0, W("s8", 2)),
      ease("hero.yaw", 0, W("s8", 2), S.desk.yaw, 0, "inOut", "deg"),
      pop("casasExtra.rise", W("s8", 0), 0, 1, 10),
      ease("dms.fly", W("s8", 3), W("s8", 10), 0, 1, "linear", "0-1"),
      step("seen.marks", W("s8", 11), 0, 1),
      step("seen.marks", W("s8", 12), 1, 2),
      step("seen.marks", W("s8", 13), 2, 3),
      ease("hero.hope", W("s8", 11), W("s8", 13) + 10, 1, 0, "out", "0-1"),
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
    audioCues: [narration("s8"), sfx("pop", W("s8", 0), 0.22), sfx("paper-whoosh", W("s8", 3), 0.22), sfx("paper-whoosh", W("s8", 6), 0.22), sfx("seen-blip", W("s8", 11), 0.28), sfx("seen-blip", W("s8", 12), 0.28), sfx("seen-blip", W("s8", 13), 0.28)],
  },
  {
    id: "scene-09-credencial",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Uma responde: a gente te dá a credencial. Tá te fazendo um favor, viu?",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.city2), key(W("s9", 2), P.casa2, "inOut"), key(W("s9", 6), P.casa2), key(W("s9", 7) + 4, P.heroChest, "inOut"), key(end(8), P.heroChest)] },
    objects: [...BASE, hero("no meio da rua", "1 credencial no pescoço"), { id: "casasExtra", type: "4-casas-de-show", visible: true }, { id: "produtor2", type: "produtor-de-bone", visible: true }, { id: "replyPlane", type: "aviao-dourado", visible: true }, { id: "credential", type: "credencial", visible: true }],
    animations: [
      ease("reply.plane", W("s9", 0), W("s9", 0) + 20, 0, 1, "inOut", "0-1"),
      pop("produtor2.pop", W("s9", 1), 0, 1, 10),
      pop("credential.drop", W("s9", 7), 0, 1, 8),
      step("hero.lanyards", W("s9", 7) + 12, 0, 1),
      ease("halo.credential", W("s9", 7), W("s9", 7) + 10, 0, 1, "out", "0-1"),
      ease("halo.credential", W("s9", 7) + 10, W("s9", 7) + 24, 1, 0.35, "in", "0-1"),
      pop("produtor2.thumb", W("s9", 10)),
      ease("hero.hope", W("s9", 7), W("s9", 7) + 12, 0, 0.7, "out", "0-1"),
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
    audioCues: [narration("s9"), sfx("paper-whoosh", W("s9", 0), 0.22), sfx("lanyard-drop", W("s9", 7) + 10, 0.3), sfx("sparkle", W("s9", 7) + 2, 0.2)],
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
      keys: [key(0, P.heroChest), key(W("s10", 2), P.mercado, "inOut"), key(W("s10", 7), P.mercado), key(W("s10", 9), P.onibus, "inOut"), key(W("s10", 12), P.onibus), key(W("s10", 14), P.camarim, "inOut"), key(end(9), P.camarim)],
    },
    objects: [...BASE, hero("no meio da rua, 1 credencial", "barrado no camarim"), { id: "register", type: "caixa-registradora", visible: true }, { id: "turnstile", type: "catraca", visible: true }, { id: "waterBottle", type: "garrafa", visible: true }, { id: "camarimDoor", type: "porta-estrela", visible: true }],
    animations: [
      ...walk(S.city.p, S.mercado.p, 0, W("s10", 2)),
      ease("hero.yaw", W("s10", 1), W("s10", 2) + 4, 0, S.mercado.yaw, "inOut", "deg"),
      pop("register.deny", W("s10", 5) + 2, 0, 1, 9),
      ...walk(S.mercado.p, S.onibus.p, W("s10", 7), W("s10", 9)),
      pop("turnstile.deny", W("s10", 10), 0, 1, 9),
      { type: "spring", target: "hero.bump", startFrame: W("s10", 10), endFrame: W("s10", 10) + 30, from: 0, to: 1, damping: 7, unit: "0-1" },
      ...walk(S.onibus.p, S.camarim.p, W("s10", 12), W("s10", 14)),
      ease("hero.yaw", W("s10", 13), W("s10", 14) + 4, S.onibus.yaw, S.camarim.yaw, "inOut", "deg"),
      ease("sky.time", W("s10", 12), W("s10", 14), 5.5, 5.88, "inOut"),
      pop("water.bottle", W("s10", 15)),
      ease("water.withdraw", W("s10", 17), W("s10", 17) + 10, 0, 1, "in", "0-1"),
      ease("camarim.door", W("s10", 19), W("s10", 19) + 4, 0, 1, "in", "0-1"),
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
    audioCues: [narration("s10"), sfx("error-buzz", W("s10", 5) + 2, 0.26), sfx("turnstile", W("s10", 10), 0.28), sfx("door-slam", W("s10", 19), 0.32)],
  },
  {
    id: "scene-11-seis-meses",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Seis meses depois, seu amigo pergunta se você já tá rico. Você tem seis credenciais, mil curtidas e três reais na conta.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.quarto11), key(end(10), P.quarto11b, "soft")] },
    objects: [...BASE, hero("no camarim, 1 credencial", "no quartinho, 6 credenciais"), { id: "calendar", type: "calendario", visible: true }, { id: "wallPhotos", type: "fotos-na-parede", visible: true }, { id: "phone", type: "celular-chat", visible: true }, { id: "likes", type: "coracoes", visible: true }, { id: "piggy", type: "cofrinho-novo-vazio", visible: true }, { id: "balance", type: "R$ 3,47", visible: true }],
    animations: [
      ...walk(S.camarim.p, S.quarto.p, 0, 1),
      step("hero.yaw", 0, S.camarim.yaw, 0),
      step("piggy.break", 0, 1, 0),
      step("piggy.fill", 0, 1, 0),
      step("piggy.crack", 0, 1, 0),
      ease("calendar.flip", 0, W("s11", 2) + 10, 0, 6, "linear"),
      ease("sky.time", 0, W("s11", 2) + 10, 5.88, 11.88, "linear"),
      ease("hero.lanyards", 0, W("s11", 2) + 10, 1, 6, "linear"),
      ease("wall.photos", 0, W("s11", 2) + 10, 0, 1, "linear", "0-1"),
      ease("hero.fatigue", 0, W("s11", 2) + 10, 0.85, 1, "linear", "0-1"),
      ease("hero.hope", 0, 20, 0.7, 0.4, "inOut", "0-1"),
      pop("phone.show", W("s11", 3)),
      pop("chat.friend", W("s11", 3) + 4),
      ease("likes.burst", W("s11", 15), W("s11", 17), 0, 1, "out", "0-1"),
      ease("likes.bounce", W("s11", 17), W("s11", 17) + 14, 0, 1, "out", "0-1"),
      pop("balance.show", W("s11", 18), 0, 1, 10),
      ease("music.duck", W("s11", 18), W("s11", 18) + 4, 1, 0.2, "linear", "0-1"),
      ease("music.duck", end(10) - 6, end(10), 0.2, 1, "linear", "0-1"),
      ease("phone.show", end(10) - 6, end(10), 1, 0, "in", "0-1"),
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
    audioCues: [narration("s11"), sfx("page-flip", 0, 0.2), sfx("page-flip", 12, 0.2), sfx("page-flip", 24, 0.2), sfx("msg-pop", W("s11", 3) + 4, 0.26), sfx("heart-pops", W("s11", 15), 0.22), sfx("coin-sad", W("s11", 18), 0.28)],
  },
  {
    id: "scene-12-final",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Pronto: agora você entende como funciona a carreira de fotógrafo de show. Visibilidade não paga a parcela da câmera.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.quarto11b), key(W("s12", 3), P.wideFinal, "inOut"), key(W("s12", 11), P.wideFinal2, "linear"), key(W("s12", 13), P.padariaDawn, "inOut"), key(end(11), P.padariaDawn)] },
    objects: [...BASE, hero("no quartinho, 6 credenciais", "na padaria às 5h, de padeiro, com câmera e 6 credenciais"), { id: "finalLabels", type: "rotulos-da-maquete", visible: true }, { id: "alarm", type: "relogio-05:00", visible: true }, { id: "creditCard", type: "cartao-7/24", visible: true }],
    animations: [
      ease("final.labels", W("s12", 0), W("s12", 8), 0, 1, "out", "0-1"),
      ease("final.labels", W("s12", 11), W("s12", 12), 1, 0, "in", "0-1"),
      ease("sky.time", W("s12", 11), W("s12", 13), 11.88, 12.26, "inOut"),
      ...walk(S.quarto.p, S.padaria.p, W("s12", 12), W("s12", 12) + 1),
      step("hero.outfit", W("s12", 12), 0, 1),
      ease("alarm.ring", W("s12", 12), W("s12", 12) + 48, 0, 1, "linear", "0-1"),
      step("card.variant", 0, 0, 1),
      pop("card.installments", W("s12", 16)),
      ease("fade", end(11) - 74, end(11) - 59, 0, 0.86, "in", "0-1"),
    ],
    badges: [
      { text: "FOTÓGRAFO DE SHOW", subtitle: "como funciona", variant: "info", size: "large", appearAt: W("s12", 3), disappearAt: W("s12", 12) },
      { text: "VISIBILIDADE NÃO PAGA", subtitle: "a parcela da câmera", variant: "negative", size: "large", appearAt: W("s12", 12), disappearAt: end(11) - 74 },
      { text: "PIX, NÃO CREDENCIAL", subtitle: "fotógrafo de show · como funciona", variant: "info", size: "large", appearAt: end(11) - 69, disappearAt: end(11) + 10, top: 860 },
    ],
    highlights: ["PRONTO", "CARREIRA", "VISIBILIDADE", "PARCELA", "CÂMERA"],
    captions: [
      { text: "Pronto: agora você entende como funciona a carreira de fotógrafo de show.", from: voLocal("s12"), to: W("s12", 12) },
      { text: "Visibilidade não paga a parcela da câmera.", from: W("s12", 12), to: end(11) - 74 },
    ],
    audioCues: [narration("s12"), sfx("whoosh-soft", W("s12", 3), 0.22), sfx("hit-final", W("s12", 12), 0.32), sfx("alarm", W("s12", 12) + 4, 0.22), sfx("badge-big", end(11) - 69, 0.28)],
  },
];

/** Valor de uma trilha de animação (ex.: "hero.x") no frame global. */
export const track = (target: string, frame: number, fallback = 0) => evaluateTrack(scenes, target, frame, FPS, fallback);

/** Cena ativa no frame global. */
export const sceneAt = (frame: number) => {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (frame >= scenes[i].startFrame) return scenes[i];
  }
  return scenes[0];
};

export const sceneIndexAt = (frame: number) => scenes.indexOf(sceneAt(frame));

export const isVisible = (id: string, frame: number) => sceneAt(frame).objects.some((o) => o.id === id && o.visible);

// Verificação de integridade da timeline (executada ao importar): contígua, começa em 0, soma DURATION.
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
