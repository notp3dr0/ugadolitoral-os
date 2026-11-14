// Scene plan · "Nadini e os dois empregos" · roteiro v1 (2026-11-03) — REFERÊNCIA da versão aprovada.
// O final mudou para o loop (v2) e os tempos vieram da voz real: a versão produzida está em src/data/scenes.ts.
// Fase 1: contrato de dados, não implementação. Na Fase 2 vira src/data/scenes.ts sem tradução
// (mesmos tipos do template da skill remotion-problem-resolve-video).
//
// Configuração que vai para src/utils/timing.ts na Fase 2:
//   SECONDS = 60  (1800 frames a 30 fps, 0–1799)
//   VO_KEYS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9"]
//   PLANNED_SECONDS = [6, 7, 7, 6, 7, 7, 7, 7, 6]   // soma 60
//   GAPS = [0.5, 0.6, 0.6, 0.55, 0.6, 0.55, 0.6, 0.5]  // pausas curtas, ritmo de piada
//
// Linha do tempo determinística: tudo deriva do frame atual (useCurrentFrame). Sem timers, Date.now
// nem Math.random — vapor, radar e confete usam random(seed) do Remotion.
// Camada 3D: @remotion/three + R3F (maquete, relógio, personagens). Camada 2D: badges, legendas,
// balões de fala e o cronômetro da catapulta. Não é 2.5D.
// Antes do TTS, W("sN", i) é estimativa a ~155 ppm; depois do TTS, vira o frame real da palavra.

import { orbit, type EaseName, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";
import type { AudioCue, CameraKey, ScenePlan, VideoConfig } from "./scenes";

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-palco", language: "pt-BR" };

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status: "planned" });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "planned" });

// Mundo (u3d), formato retrato: loja de celular centrada em [-1.9, 0, 0], padaria em [1.9, 0, 0] (cada uma
// com ~2,4 de largura), rua na frente (z > 0) e torre de relógio em [0, 0, -0.4], mostrador em y ≈ 4,6.
// O relógio é um gráfico de pizza de 12 h: arco azul 8h→15h (loja), arco laranja 14h→20h (padaria),
// fatia vermelha onde se sobrepõem (14h–15h). Largura visível no plano aberto (dist 30, FOV ~24°): ~7,2.
const P = {
  wide: orbit([0, 2.2, 0], 30, 10, 14),
  street: orbit([0, 0.8, 1.2], 14, 0, 6),
  clock: orbit([0, 4.6, 0.5], 12, 0, 6),
  lojaDoor: orbit([-1.9, 1.2, 0.8], 11, 22, 8),
  aline: orbit([-1.9, 1.5, 0.5], 8, 18, 6),
  counter: orbit([-2.1, 1.0, -0.2], 7, 14, 8),
  catapult: orbit([-0.4, 1.4, 0.6], 15, 6, 10),
  padCounter: orbit([2.1, 1.0, -0.2], 7, -14, 8),
  padDoor: orbit([1.9, 1.2, 0.8], 11, -22, 8),
  lineup: orbit([0.8, 1.2, 0.5], 12, -8, 10),
  sign: orbit([0, 3.4, 0.5], 18, 0, 8),
  final: orbit([0, 2.2, 0], 26, 8, 12),
};

// Objetos persistentes: o mesmo id em todas as cenas em que aparecem.
const TOWN = [
  { id: "town", type: "maquete-quarteirao", visible: true },
  { id: "lojaCelular", type: "loja-de-celular", visible: true },
  { id: "padaria", type: "padaria", visible: true },
  { id: "clock", type: "torre-relogio-pizza", visible: true },
];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "A Nadini arrumou dois empregos. Loja de celular de manhã. Padaria de tarde.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(end(0), P.street, "soft")] },
    objects: [
      ...TOWN,
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "fora de quadro", end: "entre as lojas, com dois contratos" } },
      { id: "contractLoja", type: "contrato", visible: true, state: { start: "em branco", end: "carimbado" } },
      { id: "contractPadaria", type: "contrato", visible: true, state: { start: "em branco", end: "carimbado" } },
      { id: "coins", type: "moedas", visible: true, state: { start: "ausentes", end: "caindo" } },
    ],
    animations: [
      { type: "interpolate", target: "town.rise", startFrame: 0, endFrame: s(1.2), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "nadini.enter", startFrame: W("s1", 1), endFrame: W("s1", 1) + s(0.9), from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "contractLoja.stamp", startFrame: W("s1", 5), endFrame: W("s1", 5) + s(0.5), from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "spring", target: "contractPadaria.stamp", startFrame: W("s1", 10), endFrame: W("s1", 10) + s(0.5), from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "interpolate", target: "coins.rain", startFrame: W("s1", 10), endFrame: end(0), from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [{ text: "2 EMPREGOS", variant: "positive", subtitle: "dois salários", appearAt: W("s1", 3), disappearAt: end(0) - 6 }],
    highlights: ["NADINI", "DOIS", "EMPREGOS", "LOJA", "PADARIA"],
    captions: [
      { text: "A Nadini arrumou dois empregos.", from: voLocal("s1"), to: W("s1", 5) },
      { text: "Loja de celular de manhã.", from: W("s1", 5), to: W("s1", 10) },
      { text: "Padaria de tarde.", from: W("s1", 10), to: end(0) },
    ],
    audioCues: [narration("s1"), sfx("whoosh-soft", 0, 0.3), sfx("stamp", W("s1", 5), 0.34), sfx("stamp", W("s1", 10), 0.34), sfx("coins", W("s1", 10), 0.22)],
  },
  {
    id: "scene-02-hora-fantasma",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "A loja vai até as três. A padaria começa às duas. Sobra uma hora de problema.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, P.street), key(s(0.8), P.clock, "soft"), key(end(1), P.clock)] },
    objects: [
      ...TOWN,
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "no pé da torre", end: "suando" } },
    ],
    animations: [
      { type: "interpolate", target: "clock.focus", startFrame: 0, endFrame: s(0.8), from: 0, to: 1, easing: "soft", unit: "0-1" },
      { type: "interpolate", target: "clock.arcLoja", startFrame: voLocal("s2"), endFrame: W("s2", 5) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "clock.arcPadaria", startFrame: W("s2", 6), endFrame: W("s2", 10) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "clock.overlap", startFrame: W("s2", 11), endFrame: W("s2", 11) + s(1), from: 0, to: 1, damping: 8, unit: "0-1" },
      { type: "interpolate", target: "nadini.sweat", startFrame: W("s2", 14), endFrame: end(1), from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "LOJA ATÉ 15H", variant: "info", appearAt: W("s2", 3), disappearAt: W("s2", 6) },
      { text: "PADARIA ÀS 14H", variant: "info", appearAt: W("s2", 8), disappearAt: W("s2", 11) },
      { text: "HORA FANTASMA", variant: "negative", subtitle: "14h às 15h", appearAt: W("s2", 12), disappearAt: end(1) },
    ],
    highlights: ["TRÊS", "DUAS", "HORA", "PROBLEMA"],
    captions: [
      { text: "A loja vai até as três.", from: voLocal("s2"), to: W("s2", 6) },
      { text: "A padaria começa às duas.", from: W("s2", 6), to: W("s2", 11) },
      { text: "Sobra uma hora de problema.", from: W("s2", 11), to: end(1) },
    ],
    audioCues: [narration("s2"), sfx("tick", 0, 0.2), sfx("arc-fill", voLocal("s2"), 0.2), sfx("arc-fill", W("s2", 6), 0.2), sfx("alarm-soft", W("s2", 11), 0.3)],
  },
  {
    id: "scene-03-plano-fininho",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Plano um: sair de fininho. Mas a chefe, Aline, tem radar de funcionário. Bipou.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [key(0, P.clock), key(s(0.8), P.lojaDoor, "soft"), key(W("s3", 8), P.aline, "soft"), key(end(2), P.counter, "soft")],
    },
    objects: [
      ...TOWN,
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "dentro da loja, de costas pra chefe", end: "congelada de susto" } },
      { id: "aline", type: "personagem-aline", visible: true, state: { start: "de braços cruzados", end: "radar travado na Nadini" } },
    ],
    animations: [
      { type: "interpolate", target: "clock.hand", startFrame: 0, endFrame: W("s3", 2), from: 45, to: 60, easing: "linear", unit: "deg" },
      { type: "interpolate", target: "nadini.sneak", startFrame: W("s3", 2), endFrame: W("s3", 9), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "aline.radar", startFrame: W("s3", 9), endFrame: W("s3", 13), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "nadini.freeze", startFrame: W("s3", 13), endFrame: W("s3", 13) + s(0.7), from: 0, to: 1, damping: 7, unit: "0-1" },
      { type: "interpolate", target: "camera.shake", startFrame: W("s3", 13), endFrame: W("s3", 13) + s(0.5), from: 1, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "PLANO 1", variant: "info", subtitle: "sair de fininho", appearAt: 0, disappearAt: W("s3", 5) },
      { text: "RADAR", variant: "negative", subtitle: "chefe Aline", appearAt: W("s3", 9), disappearAt: end(2) - 4 },
      { text: "BIPOU", variant: "negative", appearAt: W("s3", 13), disappearAt: end(2) - 4 },
    ],
    highlights: ["FININHO", "CHEFE", "ALINE", "RADAR", "BIPOU"],
    captions: [
      { text: "Plano um: sair de fininho.", from: voLocal("s3"), to: W("s3", 5) },
      { text: "Mas a chefe, Aline,", from: W("s3", 5), to: W("s3", 9) },
      { text: "tem radar de funcionário.", from: W("s3", 9), to: W("s3", 13) },
      { text: "Bipou.", from: W("s3", 13), to: end(2) },
    ],
    audioCues: [narration("s3"), sfx("tick", 0, 0.18), sfx("tiptoe", W("s3", 2), 0.2), sfx("radar-ping", W("s3", 9), 0.3), sfx("bip", W("s3", 13), 0.36)],
  },
  {
    id: "scene-04-plano-manequim",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Plano dois: um manequim de crachá no balcão. Ele atende. Ele sorri.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.counter), key(W("s4", 7), orbit([-2.1, 1.0, -0.2], 6, 6, 6), "soft"), key(end(3), P.counter, "soft")] },
    objects: [
      ...TOWN,
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "de crachá, no balcão", end: "saindo pela porta dos fundos" } },
      { id: "mannequin", type: "manequim-de-vitrine", visible: true, state: { start: "fora de quadro", end: "de crachá, sorrindo" } },
      { id: "cracha", type: "crachá", visible: true, state: { start: "no peito da Nadini", end: "no manequim" } },
    ],
    animations: [
      { type: "spring", target: "mannequin.enter", startFrame: W("s4", 3), endFrame: W("s4", 3) + s(0.8), from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "cracha.swap", startFrame: W("s4", 5), endFrame: W("s4", 7), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "nadini.exitBack", startFrame: W("s4", 7), endFrame: W("s4", 9), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "spring", target: "mannequin.nod", startFrame: W("s4", 9), endFrame: W("s4", 9) + s(0.8), from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "mannequin.smile", startFrame: W("s4", 11), endFrame: W("s4", 11) + s(1), from: 0, to: 1, damping: 9, unit: "0-1" },
    ],
    badges: [
      { text: "PLANO 2", variant: "info", appearAt: 0, disappearAt: W("s4", 3) },
      { text: "CLONE DE VITRINE", variant: "positive", subtitle: "ele atende", appearAt: W("s4", 3), disappearAt: end(3) - 4 },
    ],
    highlights: ["MANEQUIM", "CRACHÁ", "ATENDE", "SORRI"],
    captions: [
      { text: "Plano dois: um manequim", from: voLocal("s4"), to: W("s4", 4) },
      { text: "de crachá no balcão.", from: W("s4", 4), to: W("s4", 8) },
      { text: "Ele atende. Ele sorri.", from: W("s4", 8), to: end(3) },
    ],
    audioCues: [narration("s4"), sfx("pop", W("s4", 3), 0.3), sfx("whoosh-soft", W("s4", 7), 0.26), sfx("voice-bips", W("s4", 9), 0.2), sfx("ding", W("s4", 11), 0.22)],
  },
  {
    id: "scene-05-cliente-desconto",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Funcionou até um cliente pedir desconto. O manequim não negociou. Caiu duro.",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [key(0, P.counter), key(W("s5", 5), orbit([-2.1, 1.0, -0.2], 5.5, 10, 6), "soft"), key(W("s5", 10), orbit([-2.1, 1.0, -0.2], 6, 14, 8)), key(end(4), P.catapult, "soft")],
    },
    objects: [
      ...TOWN,
      { id: "mannequin", type: "manequim-de-vitrine", visible: true, state: { start: "sorrindo no balcão", end: "caído de cara no chão" } },
      { id: "customer", type: "cliente-loja", visible: true, state: { start: "fora de quadro", end: "pasmo diante do manequim caído" } },
      { id: "aline", type: "personagem-aline", visible: true, state: { start: "fora de quadro", end: "espiando pela porta" } },
    ],
    animations: [
      { type: "spring", target: "customer.enter", startFrame: 0, endFrame: s(0.8), from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "customer.ask", startFrame: W("s5", 4), endFrame: W("s5", 5) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "mannequin.fall", startFrame: W("s5", 9), endFrame: W("s5", 10) + 10, from: 0, to: 90, easing: "in", unit: "deg" },
      { type: "interpolate", target: "camera.shake", startFrame: W("s5", 10), endFrame: W("s5", 10) + s(0.7), from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "spring", target: "aline.peek", startFrame: W("s5", 11), endFrame: W("s5", 11) + s(0.6), from: 0, to: 1, damping: 10, unit: "0-1" },
    ],
    badges: [
      { text: "PEDIU DESCONTO", variant: "negative", appearAt: W("s5", 3), disappearAt: W("s5", 9) },
      { text: "CLONE CAIU", variant: "negative", subtitle: "plano 2: falhou", appearAt: W("s5", 10), disappearAt: end(4) - 4 },
    ],
    highlights: ["CLIENTE", "DESCONTO", "MANEQUIM", "NEGOCIOU", "CAIU"],
    captions: [
      { text: "Funcionou até um cliente", from: voLocal("s5"), to: W("s5", 4) },
      { text: "pedir desconto.", from: W("s5", 4), to: W("s5", 6) },
      { text: "O manequim não negociou.", from: W("s5", 6), to: W("s5", 10) },
      { text: "Caiu duro.", from: W("s5", 10), to: end(4) },
    ],
    audioCues: [narration("s5"), sfx("pop", 0, 0.24), sfx("bubble", W("s5", 4), 0.22), sfx("crash", W("s5", 10), 0.4), sfx("gasp", W("s5", 11), 0.24)],
  },
  {
    id: "scene-06-plano-catapulta",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Plano três: física. Uma baguete vira catapulta. Da loja pra padaria em dois segundos.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [
        key(0, P.catapult),
        key(W("s6", 5), orbit([-1.0, 1.2, 0.6], 10, 8, 10), "soft"),
        key(W("s6", 7), orbit([-0.8, 1.4, 0.6], 11, 4, 8), "soft"),
        key(W("s6", 7) + s(2), orbit([1.0, 1.6, 0.6], 11, -4, 8), "linear"),
        key(end(5), P.padCounter, "soft"),
      ],
    },
    objects: [
      ...TOWN,
      { id: "catapult", type: "baguete-catapulta", visible: true, state: { start: "ausente", end: "disparada" } },
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "na loja", end: "dentro da cesta de pães da padaria" } },
      { id: "basket", type: "cesta-de-paes", visible: true },
      { id: "timer", type: "cronometro-2d", visible: true, state: { start: "00:00", end: "00:02" } },
    ],
    animations: [
      { type: "spring", target: "catapult.build", startFrame: W("s6", 3), endFrame: W("s6", 3) + s(0.9), from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "catapult.pull", startFrame: W("s6", 5), endFrame: W("s6", 7), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "nadini.flight", startFrame: W("s6", 7), endFrame: W("s6", 7) + s(2), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "timer.progress", startFrame: W("s6", 7), endFrame: W("s6", 7) + s(2), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "nadini.land", startFrame: W("s6", 7) + s(2), endFrame: W("s6", 7) + s(2) + s(0.9), from: 0, to: 1, damping: 8, unit: "0-1" },
    ],
    badges: [
      { text: "PLANO 3", variant: "info", subtitle: "física", appearAt: 0, disappearAt: W("s6", 3) },
      { text: "CATAPULTA DE BAGUETE", variant: "positive", appearAt: W("s6", 3), disappearAt: W("s6", 7) },
      { text: "2 SEGUNDOS", variant: "info", appearAt: W("s6", 11), disappearAt: end(5) - 4 },
    ],
    highlights: ["FÍSICA", "BAGUETE", "CATAPULTA", "PADARIA", "SEGUNDOS"],
    captions: [
      { text: "Plano três: física.", from: voLocal("s6"), to: W("s6", 3) },
      { text: "Uma baguete vira catapulta.", from: W("s6", 3), to: W("s6", 7) },
      { text: "Da loja pra padaria", from: W("s6", 7), to: W("s6", 11) },
      { text: "em dois segundos.", from: W("s6", 11), to: end(5) },
    ],
    audioCues: [narration("s6"), sfx("build", W("s6", 3), 0.24), sfx("stretch", W("s6", 5), 0.28), sfx("launch", W("s6", 7), 0.4), sfx("whoosh-soft", W("s6", 7), 0.3), sfx("thud-basket", W("s6", 7) + s(2), 0.36)],
  },
  {
    id: "scene-07-pedido-errado",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Chegou na hora, com celular no bolso. O cliente pediu um pão. Levou um celular.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.padCounter), key(W("s7", 9), orbit([2.1, 1.0, -0.2], 5.5, -10, 6), "soft"), key(end(6), P.padDoor, "soft")] },
    objects: [
      ...TOWN,
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "de avental na padaria", end: "entregando um celular" } },
      { id: "phones", type: "celulares-no-bolso", visible: true, state: { start: "escondidos", end: "um na mão do cliente" } },
      { id: "customer2", type: "cliente-padaria", visible: true, state: { start: "fora de quadro", end: "confuso olhando a tela" } },
    ],
    animations: [
      { type: "interpolate", target: "nadini.apron", startFrame: 0, endFrame: s(0.5), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "phones.pocket", startFrame: W("s7", 3), endFrame: W("s7", 3) + s(0.6), from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "customer2.enter", startFrame: W("s7", 7), endFrame: W("s7", 7) + s(0.8), from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "customer2.order", startFrame: W("s7", 9), endFrame: W("s7", 9) + s(0.7), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "handoff.phone", startFrame: W("s7", 12), endFrame: W("s7", 13) + 10, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "customer2.confused", startFrame: W("s7", 14), endFrame: W("s7", 14) + s(0.7), from: 0, to: 1, damping: 9, unit: "0-1" },
    ],
    badges: [
      { text: "CELULAR NO BOLSO", variant: "negative", appearAt: W("s7", 3), disappearAt: W("s7", 8) },
      { text: "PEDIDO ERRADO", variant: "negative", subtitle: "pediu pão, levou celular", appearAt: W("s7", 12), disappearAt: end(6) - 4 },
    ],
    highlights: ["CHEGOU", "CELULAR", "BOLSO", "PÃO", "LEVOU"],
    captions: [
      { text: "Chegou na hora,", from: voLocal("s7"), to: W("s7", 3) },
      { text: "com celular no bolso.", from: W("s7", 3), to: W("s7", 7) },
      { text: "O cliente pediu um pão.", from: W("s7", 7), to: W("s7", 12) },
      { text: "Levou um celular.", from: W("s7", 12), to: end(6) },
    ],
    audioCues: [narration("s7"), sfx("ding", W("s7", 3), 0.22), sfx("bubble", W("s7", 9), 0.22), sfx("hand-off", W("s7", 12), 0.24), sfx("record-scratch", W("s7", 14), 0.3)],
  },
  {
    id: "scene-08-ideia-da-aline",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Aline chegou furiosa. Viu a fila: todo mundo querendo pão com capinha. Aline teve uma ideia.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [key(0, P.padDoor), key(W("s8", 3), P.lineup, "soft"), key(W("s8", 12), orbit([0.8, 1.3, 0.5], 7, -6, 6), "soft"), key(end(7), P.lineup, "soft")],
    },
    objects: [
      ...TOWN,
      { id: "aline", type: "personagem-aline", visible: true, state: { start: "entrando furiosa", end: "com lâmpada sobre a cabeça" } },
      { id: "fila", type: "fila-de-clientes", visible: true, state: { start: "ausente", end: "longa, todos com pão-capinha" } },
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "atrás do balcão", end: "atrás do balcão, de olhos arregalados" } },
    ],
    animations: [
      { type: "interpolate", target: "aline.arrive", startFrame: 0, endFrame: W("s8", 2), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "aline.steam", startFrame: W("s8", 1), endFrame: W("s8", 3), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "fila.grow", startFrame: W("s8", 3), endFrame: W("s8", 6), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "pao.capinha", startFrame: W("s8", 9), endFrame: W("s8", 9) + s(0.8), from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "aline.eyes", startFrame: W("s8", 12), endFrame: W("s8", 12) + s(0.8), from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "spring", target: "aline.idea", startFrame: W("s8", 15), endFrame: W("s8", 15) + s(0.8), from: 0, to: 1, damping: 9, unit: "0-1" },
    ],
    badges: [
      { text: "FILA", variant: "warning", appearAt: W("s8", 3), disappearAt: W("s8", 9) },
      { text: "PÃO COM CAPINHA", variant: "info", appearAt: W("s8", 9), disappearAt: W("s8", 13) },
      { text: "IDEIA DA ALINE", variant: "positive", appearAt: W("s8", 14), disappearAt: end(7) },
    ],
    highlights: ["ALINE", "FURIOSA", "FILA", "CAPINHA", "IDEIA"],
    captions: [
      { text: "Aline chegou furiosa.", from: voLocal("s8"), to: W("s8", 3) },
      { text: "Viu a fila: todo mundo", from: W("s8", 3), to: W("s8", 8) },
      { text: "querendo pão com capinha.", from: W("s8", 8), to: W("s8", 12) },
      { text: "Aline teve uma ideia.", from: W("s8", 12), to: end(7) },
    ],
    audioCues: [narration("s8"), sfx("stomp", 0, 0.28), sfx("steam", W("s8", 1), 0.24), sfx("murmur", W("s8", 5), 0.2), sfx("cash", W("s8", 12), 0.26), sfx("ding-idea", W("s8", 15), 0.32)],
  },
  {
    id: "scene-09-fusao-final",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Hoje é a Padaria Celular. Um lugar só. Dois horários. Zero conflito.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.lineup), key(W("s9", 3), P.sign, "soft"), key(W("s9", 8), P.final, "soft"), key(end(8), orbit([0, 2.2, 0], 25, 6, 12), "soft")] },
    objects: [
      ...TOWN,
      { id: "sign", type: "letreiro-padaria-celular", visible: true, state: { start: "ausente", end: "aceso" } },
      { id: "nadini", type: "personagem-nadini", visible: true, state: { start: "atrás do balcão", end: "acenando com os dois braços" } },
      { id: "confetti", type: "confete", visible: true, state: { start: "ausente", end: "caindo" } },
    ],
    animations: [
      { type: "interpolate", target: "town.merge", startFrame: 0, endFrame: W("s9", 4), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "sign.enter", startFrame: W("s9", 3), endFrame: W("s9", 3) + s(0.9), from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "interpolate", target: "clock.overlapGreen", startFrame: W("s9", 8), endFrame: W("s9", 10), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "nadini.wave", startFrame: W("s9", 10), endFrame: end(8), from: 0, to: 12.57, easing: "linear", unit: "rad" },
      { type: "interpolate", target: "confetti.burst", startFrame: W("s9", 11), endFrame: end(8), from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "FUSÃO", variant: "positive", appearAt: W("s9", 3), disappearAt: W("s9", 10) },
      { text: "ZERO CONFLITO", variant: "positive", size: "large", appearAt: W("s9", 10), disappearAt: end(8) },
    ],
    highlights: ["PADARIA", "CELULAR", "LUGAR", "HORÁRIOS", "CONFLITO"],
    captions: [
      { text: "Hoje é a Padaria Celular.", from: voLocal("s9"), to: W("s9", 5) },
      { text: "Um lugar só.", from: W("s9", 5), to: W("s9", 8) },
      { text: "Dois horários.", from: W("s9", 8), to: W("s9", 10) },
      { text: "Zero conflito.", from: W("s9", 10), to: end(8) },
    ],
    audioCues: [narration("s9"), sfx("slide-thump", W("s9", 3), 0.34), sfx("fanfare", W("s9", 3), 0.28), sfx("ding", W("s9", 8), 0.24), sfx("confetti", W("s9", 11), 0.3)],
  },
];

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
