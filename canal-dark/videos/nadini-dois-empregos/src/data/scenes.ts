import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordEndLocal, wordLocal, type VoKey } from "../utils/timing";

// Contrato de dados do vídeo "Nadini e os dois empregos" (roteiro v2, 2026-11-03: v1 aprovado + final em loop).
// Frames de animações, badges, legendas, câmera e áudio são LOCAIS à cena; startFrame é global.
// Os cortes vêm de utils/timing.ts (medidos na voz do Gemini). O último quadro emenda no primeiro.

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-palco", language: "pt-BR" };

/** negative = problema (✖ vermelho), positive = solução (✔ verde), info = termo/neutro, warning = pergunta/atenção. */
export type BadgeVariant = "positive" | "negative" | "info" | "warning";
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };
export type CameraPlan = { projection: "perspective" | "orthographic"; movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split" | "hold"; keys: CameraKey[] };
export type SceneObject = { id: string; type: string; visible: boolean; state?: { start: string; end: string } };
export type SceneBadge = { text: string; variant: BadgeVariant; appearAt: number; disappearAt?: number; subtitle?: string; slot?: "center" | "left" | "right"; icon?: "?"; size?: "normal" | "large" };
export type CaptionBlock = { text: string; from: number; to: number };
export type AudioCue = { kind: "narration" | "sfx"; src: string; at: number; volume: number; status: "planned" | "ready" };
export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: VoKey;
  narration: string;
  camera: CameraPlan;
  objects: SceneObject[];
  animations: TrackAnimation[];
  badges: SceneBadge[];
  highlights: string[];
  captions: CaptionBlock[];
  audioCues: AudioCue[];
};

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const WE = wordEndLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status: "ready" });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "ready" });
const spring = (target: string, startFrame: number, len = 30, damping = 11, from = 0, to = 1): TrackAnimation => ({ type: "spring", target, startFrame, endFrame: startFrame + Math.max(len, 30), from, to, damping, unit: "0-1" });
const lin = (target: string, startFrame: number, endFrame: number, from: number, to: number, easing: EaseName = "inOut", unit: TrackAnimation["unit"] = "0-1"): TrackAnimation => ({ type: "interpolate", target, startFrame, endFrame: Math.max(endFrame, startFrame + 1), from, to, easing, unit });

// Mundo (u3d): loja de celular centrada em x = -1,9, padaria em x = 1,9 (cada uma 2,6 × 1,8 × 2,2),
// torre do relógio em [0, 0, -0,95] com o mostrador em y = 4,62; calçada em z ≈ 0,75 e rua em z ≈ 1,5.
// Plano aberto: dist 36 → ~125 px por unidade, a maquete inteira entre os badges e a legenda.
const P = {
  wide: orbit([0, 2.5, 0.3], 36, 10, 12),
  street: orbit([0, 0.8, 0.95], 8.5, 6, 8),
  clock: orbit([0, 4.5, -0.68], 10.5, 0, 4),
  shop: orbit([-1.85, 0.95, -0.35], 11.5, 16, 10),
  aline: orbit([-2.3, 1.05, -0.5], 8.5, 24, 8),
  counter: orbit([-1.45, 0.85, -0.25], 9, 12, 8),
  street3: orbit([-0.15, 1.7, 1.15], 15.5, 4, 8),
  bakery: orbit([1.8, 0.9, -0.3], 9, -12, 8),
  arrival: orbit([0.7, 1.4, 0.3], 16, -4, 9),
  chefs: orbit([1.65, 1.0, 0.0], 12, -6, 8),
  fired: orbit([1.75, 1.05, -0.6], 8, -4, 6),
};

const TOWN: SceneObject[] = [{ id: "town", type: "maquete-quarteirao", visible: true }];
const nadini = (start: string, endState: string): SceneObject => ({ id: "nadini", type: "personagem-nadini", visible: true, state: { start, end: endState } });

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "A Nadini arrumou dois empregos. Loja de celular de manhã. Padaria de tarde.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(W("s1", 4), orbit([0, 1.4, 0.8], 16, 8, 10), "soft"), key(end(0), P.street, "soft")] },
    objects: [
      ...TOWN,
      nadini("no meio da rua, com dois contratos", "contratada duas vezes"),
      { id: "contractLoja", type: "contrato", visible: true, state: { start: "em branco", end: "carimbado" } },
      { id: "contractPadaria", type: "contrato", visible: true, state: { start: "em branco", end: "carimbado" } },
      { id: "coins", type: "moedas", visible: true },
    ],
    animations: [
      spring("contractLoja.stamp", W("s1", 7), 30, 9),
      spring("contractPadaria.stamp", W("s1", 10), 30, 9),
      lin("coins.rain", W("s1", 10), end(0) + 6, 0, 1, "linear"),
    ],
    badges: [{ text: "2 EMPREGOS", variant: "positive", subtitle: "dois salários", appearAt: W("s1", 3), disappearAt: end(0) - 4 }],
    highlights: ["NADINI", "DOIS", "EMPREGOS", "CELULAR", "PÃO"],
    captions: [{ text: "A Nadini arrumou dois empregos.", from: voLocal("s1"), to: end(0) }],
    audioCues: [narration("s1"), sfx("whoosh-soft", 0, 0.22), sfx("badge", W("s1", 3), 0.24), sfx("stamp", W("s1", 7), 0.34), sfx("stamp", W("s1", 10), 0.34), sfx("coins", W("s1", 11), 0.2)],
  },
  {
    id: "scene-02-hora-fantasma",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "A loja vai até as três. A padaria começa às duas. Sobra uma hora de problema.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, P.street), key(s(0.8), P.clock, "soft"), key(W("s2", 11), orbit([0, 4.5, -0.68], 9.2, -6, 4), "soft"), key(end(1), orbit([0, 4.4, -0.68], 8.6, 4, 2), "soft")] },
    objects: [...TOWN, nadini("no meio da rua", "suando")],
    animations: [
      lin("clock.arcLoja", W("s2", 1), WE("s2", 5) + 4, 0, 1, "linear"),
      lin("clock.arcPadaria", W("s2", 7), WE("s2", 10) + 4, 0, 1, "linear"),
      lin("clock.time", W("s2", 1), W("s2", 12), 8, 14, "inOut"),
      spring("clock.overlap", W("s2", 11), 30, 7),
      lin("nadini.sweat", W("s2", 12), end(1), 0, 1, "out"),
    ],
    badges: [
      { text: "LOJA ATÉ 15H", variant: "info", appearAt: W("s2", 2), disappearAt: W("s2", 6) },
      { text: "PADARIA ÀS 14H", variant: "info", appearAt: W("s2", 7), disappearAt: W("s2", 11) },
      { text: "HORA FANTASMA", variant: "negative", subtitle: "14h às 15h", appearAt: W("s2", 12), disappearAt: end(1) },
    ],
    highlights: ["TRÊS", "DUAS", "PROBLEMA"],
    captions: [{ text: "A loja vai até as três.", from: voLocal("s2"), to: end(1) }],
    audioCues: [narration("s2"), sfx("tick", s(0.2), 0.16), sfx("fill", W("s2", 1), 0.18), sfx("fill", W("s2", 7), 0.18), sfx("alarm", W("s2", 11), 0.24), sfx("badge", W("s2", 12), 0.24)],
  },
  {
    id: "scene-03-plano-fininho",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Plano um: sair de fininho. Mas a chefe, Aline, tem radar de funcionário. Bipou.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([0, 4.4, -0.68], 8.6, 4, 2)), key(s(0.9), P.shop, "soft"), key(W("s3", 7), P.aline, "soft"), key(W("s3", 13), orbit([-1.6, 1.0, -0.2], 9.5, 20, 8), "out"), key(end(2), P.counter, "soft")] },
    objects: [...TOWN, nadini("atrás do balcão", "congelada de susto"), { id: "aline", type: "personagem-aline", visible: true, state: { start: "de braços cruzados", end: "radar travado na Nadini" } }],
    animations: [
      lin("nadini.sneak", W("s3", 2), W("s3", 9), 0, 1, "linear"),
      lin("aline.radar", W("s3", 9), W("s3", 13), 0, 1, "linear"),
      spring("nadini.freeze", W("s3", 13), 24, 7),
      lin("camera.shake", W("s3", 13), W("s3", 13) + s(0.5), 1, 0, "out"),
    ],
    badges: [
      { text: "PLANO 1", variant: "info", subtitle: "sair de fininho", appearAt: voLocal("s3"), disappearAt: W("s3", 5) },
      { text: "RADAR DA CHEFE", variant: "negative", appearAt: W("s3", 9), disappearAt: end(2) - 2 },
      { text: "BIPOU", variant: "negative", appearAt: W("s3", 13), disappearAt: end(2) - 2 },
    ],
    highlights: ["FININHO", "ALINE", "RADAR", "BIPOU"],
    captions: [{ text: "Plano um: sair de fininho.", from: voLocal("s3"), to: end(2) }],
    audioCues: [narration("s3"), sfx("whoosh-soft", 0, 0.2), sfx("tiptoe", W("s3", 2), 0.22), sfx("radar", W("s3", 9), 0.26), sfx("bip", W("s3", 13), 0.34)],
  },
  {
    id: "scene-04-plano-manequim",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Plano dois: um manequim de crachá no balcão. Ele atende. Ele sorri.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.counter), key(W("s4", 8), orbit([-1.3, 0.95, -0.4], 7, 8, 6), "soft"), key(end(3), orbit([-1.25, 0.95, -0.4], 6.6, 4, 6), "soft")] },
    objects: [...TOWN, nadini("no balcão", "saindo pela porta dos fundos"), { id: "mannequin", type: "manequim-de-vitrine", visible: true, state: { start: "fora de quadro", end: "de crachá, sorrindo" } }],
    animations: [
      spring("mannequin.enter", W("s4", 3) - 4, 30, 10),
      lin("cracha.swap", W("s4", 5), WE("s4", 7), 0, 1, "inOut"),
      lin("nadini.exitBack", WE("s4", 7), WE("s4", 7) + s(0.9), 0, 1, "in"),
      spring("mannequin.nod", W("s4", 9), 30, 10),
      spring("mannequin.smile", W("s4", 11), 30, 9),
    ],
    badges: [
      { text: "PLANO 2", variant: "info", appearAt: voLocal("s4"), disappearAt: W("s4", 3) },
      { text: "CLONE DE VITRINE", variant: "positive", subtitle: "ele atende", appearAt: W("s4", 3), disappearAt: end(3) - 2 },
    ],
    highlights: ["MANEQUIM", "CRACHÁ", "ATENDE", "SORRI"],
    captions: [{ text: "Plano dois:", from: voLocal("s4"), to: end(3) }],
    audioCues: [narration("s4"), sfx("pop", W("s4", 3), 0.28), sfx("whoosh-soft", W("s4", 5), 0.2), sfx("door", WE("s4", 7) + s(0.6), 0.2), sfx("voice-bips", W("s4", 9), 0.18), sfx("ding", W("s4", 11), 0.2)],
  },
  {
    id: "scene-05-cliente-desconto",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Funcionou até um cliente pedir desconto. O manequim não negociou. Caiu duro.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([-1.25, 0.95, -0.4], 6.6, 4, 6)), key(s(0.6), orbit([-1.15, 0.9, 0.0], 8.5, 18, 8), "soft"), key(W("s5", 10), orbit([-1.1, 0.7, 0.2], 7.5, 26, 10), "soft"), key(end(4), P.street3, "soft")] },
    objects: [
      ...TOWN,
      { id: "mannequin", type: "manequim-de-vitrine", visible: true, state: { start: "sorrindo", end: "caído de cara no chão" } },
      { id: "customer", type: "cliente-loja", visible: true, state: { start: "chegando", end: "pasmo" } },
      { id: "aline", type: "personagem-aline", visible: true, state: { start: "fora de quadro", end: "espiando" } },
    ],
    animations: [
      spring("customer.enter", 0, 30, 14),
      lin("customer.ask", W("s5", 4), W("s5", 5) + 6, 0, 1, "out"),
      lin("mannequin.fall", WE("s5", 9), W("s5", 10) + 8, 0, 90, "in", "deg"),
      lin("camera.shake", W("s5", 10) + 6, W("s5", 10) + s(0.7), 1, 0, "out"),
      spring("aline.peek", W("s5", 11) + 6, 30, 10),
    ],
    badges: [
      { text: "PEDIU DESCONTO", variant: "warning", icon: "?", appearAt: W("s5", 5), disappearAt: W("s5", 10) },
      { text: "CLONE CAIU", variant: "negative", subtitle: "plano 2: falhou", appearAt: W("s5", 10) + 6, disappearAt: end(4) - 2 },
    ],
    highlights: ["DESCONTO", "MANEQUIM", "CAIU"],
    captions: [{ text: "Funcionou até um cliente", from: voLocal("s5"), to: end(4) }],
    audioCues: [narration("s5"), sfx("steps", 0, 0.16), sfx("bubble", W("s5", 4), 0.2), sfx("crash", W("s5", 10) + 6, 0.36), sfx("gasp", W("s5", 11) + 6, 0.18)],
  },
  {
    id: "scene-06-plano-catapulta",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Plano três: física. Uma baguete vira catapulta. Da loja pra padaria em dois segundos.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, P.street3), key(W("s6", 3), orbit([-0.7, 1.0, 1.3], 10, 10, 10), "soft"), key(W("s6", 7), orbit([-0.4, 1.3, 1.3], 11, 6, 8), "soft"), key(W("s6", 7) + s(2.0), orbit([0.6, 1.4, 1.0], 12.5, -6, 8), "soft"), key(end(5), orbit([0.75, 1.0, 0.9], 10.5, -8, 9), "soft")] },
    objects: [...TOWN, nadini("sentada na baguete", "dentro da cesta de pães"), { id: "catapult", type: "baguete-catapulta", visible: true, state: { start: "ausente", end: "disparada" } }],
    animations: [
      spring("catapult.build", W("s6", 3) - 6, 30, 10),
      lin("catapult.pull", W("s6", 5), WE("s6", 6), 0, 1, "in"),
      lin("nadini.flight", W("s6", 7), W("s6", 7) + s(2.0), 0, 1, "linear"),
      lin("timer.progress", W("s6", 7), W("s6", 7) + s(2.0), 0, 1, "linear"),
      spring("nadini.land", W("s6", 7) + s(2.0), 30, 8),
    ],
    badges: [
      { text: "PLANO 3", variant: "info", subtitle: "física", appearAt: voLocal("s6"), disappearAt: W("s6", 3) },
      { text: "CATAPULTA DE BAGUETE", variant: "positive", appearAt: W("s6", 4), disappearAt: W("s6", 11) },
      { text: "2 SEGUNDOS", variant: "info", appearAt: W("s6", 12), disappearAt: end(5) - 2 },
    ],
    highlights: ["FÍSICA", "BAGUETE", "CATAPULTA", "SEGUNDOS"],
    captions: [{ text: "Plano três: física.", from: voLocal("s6"), to: end(5) }],
    audioCues: [narration("s6"), sfx("build", W("s6", 3) - 6, 0.22), sfx("stretch", W("s6", 5), 0.24), sfx("launch", W("s6", 7), 0.34), sfx("whoosh", W("s6", 7) + 4, 0.26), sfx("thud", W("s6", 7) + s(2.0), 0.32)],
  },
  {
    id: "scene-07-pedido-errado",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Chegou na hora, com celular no bolso. O cliente pediu um pão. Levou um celular.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.bakery), key(W("s7", 9), orbit([1.8, 0.95, -0.25], 7.6, -14, 7), "soft"), key(end(6), orbit([1.8, 0.95, -0.2], 7.2, -20, 7), "soft")] },
    objects: [
      ...TOWN,
      nadini("de avental na padaria", "entregando um celular"),
      { id: "phones", type: "celulares-no-bolso", visible: true },
      { id: "customer2", type: "cliente-padaria", visible: true, state: { start: "chegando", end: "confuso" } },
      { id: "catapult", type: "baguete-catapulta", visible: true },
    ],
    animations: [
      lin("catapult.pull", 0, 6, 1, 0, "linear"),
      spring("phones.pocket", W("s7", 4), 30, 9),
      spring("customer2.enter", W("s7", 6), 30, 14),
      lin("customer2.order", W("s7", 9), W("s7", 9) + s(0.6), 0, 1, "out"),
      lin("handoff.phone", W("s7", 12), WE("s7", 13) + 4, 0, 1, "inOut"),
      spring("customer2.confused", W("s7", 14), 30, 9),
    ],
    badges: [
      { text: "CELULAR NO BOLSO", variant: "warning", appearAt: W("s7", 4), disappearAt: W("s7", 8) },
      { text: "PEDIDO ERRADO", variant: "negative", subtitle: "pediu pão, levou celular", appearAt: W("s7", 13), disappearAt: end(6) - 2 },
    ],
    highlights: ["CELULAR", "BOLSO", "PÃO"],
    captions: [{ text: "Chegou na hora,", from: voLocal("s7"), to: end(6) }],
    audioCues: [narration("s7"), sfx("whoosh-soft", 0, 0.18), sfx("pop", W("s7", 4), 0.2), sfx("bubble", W("s7", 9), 0.2), sfx("whoosh-soft", W("s7", 12), 0.18), sfx("scratch", W("s7", 14), 0.24)],
  },
  {
    id: "scene-08-demitida-duas-vezes",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Aline chegou furiosa. De baguete. Os dois chefes se olharam. A Nadini foi demitida duas vezes.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([-0.5, 1.2, 1.1], 12, 8, 9)), key(W("s8", 3), P.arrival, "soft"), key(W("s8", 5) + 6, P.chefs, "soft"), key(W("s8", 11), P.chefs, "soft"), key(W("s8", 13), P.fired, "soft"), key(end(7), orbit([1.75, 1.05, -0.6], 7.6, 2, 6), "soft")] },
    objects: [
      ...TOWN,
      nadini("atrás do balcão da padaria", "demitida duas vezes"),
      { id: "aline", type: "personagem-aline", visible: true, state: { start: "na baguete, furiosa", end: "na padaria, encarando o padeiro" } },
      { id: "baker", type: "padeiro", visible: true, state: { start: "fora de quadro", end: "encarando a Aline" } },
      { id: "catapult", type: "baguete-catapulta", visible: true },
    ],
    animations: [
      lin("aline.steam", 0, W("s8", 2), 0, 1, "out"),
      lin("aline.flight", W("s8", 3), W("s8", 3) + s(1.1), 0, 1, "linear"),
      spring("baker.enter", W("s8", 5) - 4, 30, 12),
      lin("chefs.look", W("s8", 8), WE("s8", 9), 0, 1, "inOut"),
      spring("fired1", W("s8", 13), 30, 8),
      spring("fired2", W("s8", 14), 30, 8),
      lin("camera.shake", W("s8", 13), W("s8", 13) + s(0.4), 1, 0, "out"),
      lin("camera.shake", W("s8", 14), W("s8", 14) + s(0.5), 1, 0, "out"),
    ],
    badges: [
      { text: "DE BAGUETE", variant: "warning", appearAt: W("s8", 3), disappearAt: W("s8", 7) },
      { text: "2 CHEFES", variant: "negative", appearAt: W("s8", 7), disappearAt: W("s8", 12) },
    ],
    highlights: ["ALINE", "FURIOSA", "BAGUETE", "CHEFES", "DEMITIDA", "DUAS"],
    captions: [{ text: "Aline chegou furiosa.", from: voLocal("s8"), to: end(7) }],
    audioCues: [narration("s8"), sfx("steam", 0, 0.2), sfx("launch", W("s8", 3), 0.3), sfx("whoosh", W("s8", 3) + 4, 0.24), sfx("thud", W("s8", 3) + s(1.1), 0.28), sfx("tension", W("s8", 8), 0.2), sfx("stamp-big", W("s8", 13), 0.36), sfx("stamp-big", W("s8", 14), 0.36)],
  },
  {
    id: "scene-09-rebobina-loop",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Desempregada, ela fez o que qualquer pessoa faria:",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([1.75, 1.05, -0.6], 7.6, 2, 6)), key(W("s9", 2), orbit([1.4, 1.2, -0.4], 8, 0, 6), "soft"), key(end(8), P.wide, "inOut")] },
    objects: [
      ...TOWN,
      nadini("demitida, na padaria", "de volta ao meio da rua, com dois contratos novos"),
      { id: "contractLoja", type: "contrato", visible: true, state: { start: "carimbado", end: "em branco" } },
      { id: "contractPadaria", type: "contrato", visible: true, state: { start: "carimbado", end: "em branco" } },
      { id: "aline", type: "personagem-aline", visible: true, state: { start: "na padaria", end: "rebobinada pra fora" } },
      { id: "baker", type: "padeiro", visible: true, state: { start: "na padaria", end: "rebobinado pra dentro" } },
      { id: "catapult", type: "baguete-catapulta", visible: true, state: { start: "montada", end: "desmontada" } },
    ],
    animations: [
      lin("rewind", W("s9", 6), end(8) - 3, 0, 1, "inOut"),
      lin("bg.mode", W("s9", 6), W("s9", 6) + 8, 0, 1, "out"),
      lin("bg.mode", end(8) - 14, end(8) - 3, 1, 0, "in"),
      lin("clock.arcLoja", W("s9", 6), end(8) - 8, 1, 0, "inOut"),
      lin("clock.arcPadaria", W("s9", 6), end(8) - 8, 1, 0, "inOut"),
      lin("clock.overlap", W("s9", 6), end(8) - 14, 1, 0, "inOut"),
      lin("clock.time", W("s9", 6), end(8) - 4, 14, -16, "inOut"),
      lin("contractLoja.stamp", W("s9", 6), end(8) - 10, 1, 0, "linear"),
      lin("contractPadaria.stamp", W("s9", 6), end(8) - 10, 1, 0, "linear"),
      lin("catapult.build", W("s9", 6), end(8) - 10, 1, 0, "inOut"),
      lin("fired1", W("s9", 6), W("s9", 6) + 10, 1, 0, "linear"),
      lin("fired2", W("s9", 6), W("s9", 6) + 10, 1, 0, "linear"),
      lin("nadini.sweat", W("s9", 6), W("s9", 6) + 12, 1, 0, "linear"),
    ],
    badges: [{ text: "PLANO 4", variant: "warning", subtitle: "fazer tudo de novo", appearAt: W("s9", 5), disappearAt: end(8) - 14 }],
    highlights: ["DESEMPREGADA", "QUALQUER", "PESSOA"],
    captions: [{ text: "Desempregada,", from: voLocal("s9"), to: end(8) }],
    audioCues: [narration("s9"), sfx("rewind", W("s9", 6), 0.3)],
  },
];

/** Valor de uma trilha de animação (ex.: "clock.arcLoja") no frame global. */
export const track = (target: string, frame: number, fallback = 0) => evaluateTrack(scenes, target, frame, FPS, fallback);

/** Trilha de impulso (flash, tranco): vale 0 antes da 1ª animação, mesmo que ela comece em 1. */
export const impulse = (target: string, frame: number) => {
  for (const sc of scenes) {
    const an = sc.animations.find((x) => x.target === target);
    if (an) return frame < sc.startFrame + an.startFrame ? 0 : track(target, frame);
  }
  return 0;
};

/** Cena ativa no frame global. */
export const sceneAt = (frame: number) => {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (frame >= scenes[i].startFrame) return scenes[i];
  }
  return scenes[0];
};

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
