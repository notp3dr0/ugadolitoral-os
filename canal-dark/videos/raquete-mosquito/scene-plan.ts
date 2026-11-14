// Scene plan · "Como a raquete de mosquito funciona?" · roteiro v1 (2026-11-03)
// Fase 1: contrato de dados, não implementação. Na Fase 2 vira src/data/scenes.ts sem tradução
// (mesmos tipos do template da skill remotion-problem-resolve-video).
//
// Configuração que vai para src/utils/timing.ts na Fase 2:
//   SECONDS = 90  (2700 frames a 30 fps, 0–2699)
//   VO_KEYS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11"]
//   PLANNED_SECONDS = [7, 8, 8, 9, 7, 9, 9, 10, 8, 7, 8]   // soma 90
//   GAPS = [0.5, 0.6, 0.6, 0.55, 0.6, 0.55, 0.6, 0.55, 0.5, 0.65]  // pausas curtas, ritmo de piada
//
// Linha do tempo determinística: tudo deriva do frame atual (useCurrentFrame). Sem timers, Date.now
// nem Math.random — o voo do mosquito usa random(seed) do Remotion e ruído por frame.
// Camada 3D: @remotion/three + R3F (diorama do quarto + raquete). Camada 2D: badges, legendas,
// rótulos ancorados e o voltímetro (overlay). Não é 2.5D.
// Antes do TTS, W("sN", i) é estimativa a ~155 ppm; depois do TTS, vira o frame real da palavra.

import { orbit, type EaseName, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";
import type { AudioCue, CameraKey, ScenePlan, VideoConfig } from "./scenes";

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-noite", language: "pt-BR" };

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status: "planned" });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "planned" });

// Mundo (u3d): cama centrada na origem, cabeça do dorminhoco em [-1.1, 0.85, 0], criado-mudo em
// [-2.2, 0, 0.4], janela com lua na parede do fundo (z = -1.5). A partir da s5 a raquete fica de pé
// na "bancada" (origem): cabo em y 0.2–1.2, cabeça (3 redes) em y 1.4–2.8 — encaixa no quadro 9:16.
const P = {
  room: orbit([-0.4, 0.9, 0], 14, 20, 16),
  ear: orbit([-1.1, 0.95, 0.1], 5.5, 35, 10),
  slap: orbit([-0.9, 1.0, 0.2], 7, 15, 12),
  racketRoom: orbit([0.3, 1.4, 0.4], 9, 22, 12),
  bounce: orbit([0.1, 1.5, 0.3], 6.5, 40, 10),
  bench: orbit([0, 1.5, 0], 11, 18, 8),
  handle: orbit([0, 0.7, 0], 5, 28, 6),
  board: orbit([0, 0.75, 0.05], 3.6, 12, 4),
  head: orbit([0, 2.1, 0], 6.5, 20, 6),
  edge: orbit([0, 2.1, 0], 5.5, 78, 4),
  zap: orbit([0.1, 2.2, 0], 3.2, 60, 6),
  finger: orbit([0.4, 1.9, 0.2], 5, 35, 8),
  final: orbit([-0.4, 1.1, 0], 16, 24, 18),
};

const ROOM = [
  { id: "bedroom", type: "quarto-low-poly", visible: true },
  { id: "sleeper", type: "dorminhoco", visible: true },
];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Três da manhã. Um zumbido no ouvido. Você quer matar esse mosquito. Parece fácil: um tapa.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.room), key(W("s1", 3), P.ear, "soft"), key(end(0), P.slap, "soft")] },
    objects: [
      ...ROOM,
      { id: "clock", type: "relogio-digital", visible: true, state: { start: "03:00", end: "03:00" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "fora de quadro", end: "pairando no ouvido" } },
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "sob o lençol", end: "erguida pra bater" } },
    ],
    animations: [
      { type: "interpolate", target: "mosquito.path", startFrame: 0, endFrame: W("s1", 4), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "sleeper.eyes", startFrame: W("s1", 4), endFrame: W("s1", 4) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "hand.raise", startFrame: W("s1", 13), endFrame: W("s1", 13) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [
      { text: "03:00", variant: "warning", appearAt: W("s1", 0), disappearAt: W("s1", 7) },
      { text: "TAPA", variant: "info", subtitle: "o plano infalível", appearAt: W("s1", 15), disappearAt: end(0) },
    ],
    highlights: ["ZUMBIDO", "MOSQUITO", "TAPA"],
    captions: [
      { text: "Três da manhã.", from: voLocal("s1"), to: W("s1", 3) },
      { text: "Um zumbido no ouvido.", from: W("s1", 3), to: W("s1", 7) },
      { text: "Você quer matar esse mosquito.", from: W("s1", 7), to: W("s1", 12) },
      { text: "Parece fácil: um tapa.", from: W("s1", 12), to: end(0) },
    ],
    audioCues: [narration("s1"), sfx("buzz", 0, 0.22), sfx("badge", W("s1", 15), 0.26)],
  },
  {
    id: "scene-02-tapa-erra",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Plaft. Na sua própria cara. Ele desviou: a mão empurra o ar, e o ar leva o mosquito.",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [key(0, P.slap), key(s(0.6), orbit([-1.0, 1.0, 0.2], 6, 15, 12), "out"), key(W("s2", 7), orbit([-0.8, 1.1, 0.4], 6.5, 60, 8), "soft"), key(end(1), orbit([-0.6, 1.1, 0.4], 7.5, 70, 10), "soft")],
    },
    objects: [
      ...ROOM,
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "erguida", end: "na própria cara" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "no ouvido", end: "surfando na onda de ar, de óculos escuros" } },
      { id: "airWave", type: "particulas-de-ar", visible: true, state: { start: "parado", end: "onda empurrada pela mão" } },
    ],
    animations: [
      { type: "interpolate", target: "hand.slap", startFrame: 0, endFrame: s(0.25), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "sleeper.redCheek", startFrame: s(0.25), endFrame: s(0.5), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "camera.shake", startFrame: s(0.25), endFrame: s(0.7), from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "slowmo.rewind", startFrame: W("s2", 7), endFrame: W("s2", 9), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "airWave.progress", startFrame: W("s2", 9), endFrame: W("s2", 15), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "mosquito.surf", startFrame: W("s2", 12), endFrame: W("s2", 17) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "mosquito.shades", startFrame: W("s2", 15), endFrame: W("s2", 15) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [
      { text: "ERROU", variant: "negative", appearAt: W("s2", 1), disappearAt: W("s2", 8) },
      { text: "ONDA DE AR", variant: "negative", subtitle: "a mão empurra o ar", appearAt: W("s2", 9), disappearAt: end(1) },
    ],
    highlights: ["PLAFT", "CARA", "DESVIOU", "AR"],
    captions: [
      { text: "Plaft. Na sua própria cara.", from: voLocal("s2"), to: W("s2", 5) },
      { text: "Ele desviou:", from: W("s2", 5), to: W("s2", 7) },
      { text: "a mão empurra o ar,", from: W("s2", 7), to: W("s2", 12) },
      { text: "e o ar leva o mosquito.", from: W("s2", 12), to: end(1) },
    ],
    audioCues: [narration("s2"), sfx("slap", 0, 0.5), sfx("rewind", W("s2", 7), 0.2), sfx("whoosh-soft", W("s2", 9), 0.26)],
  },
  {
    id: "scene-03-rede",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Então você precisa de algo que deixa o ar passar: uma rede. O vento atravessa, o mosquito fica.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([-0.6, 1.1, 0.4], 7.5, 70, 10)), key(W("s3", 10), P.racketRoom, "soft"), key(end(2), orbit([0.3, 1.45, 0.4], 7.5, 34, 10), "soft")] },
    objects: [
      ...ROOM,
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "vazia", end: "segurando a raquete" } },
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "fora de cena", end: "na mão, desligada" } },
      { id: "airWave", type: "particulas-de-ar", visible: true, state: { start: "dissipando", end: "atravessando a malha" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "de óculos, debochado", end: "preso na rede" } },
    ],
    animations: [
      { type: "spring", target: "racket.enter", startFrame: W("s3", 10) - 6, endFrame: W("s3", 10) + 26, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "racket.swing", startFrame: W("s3", 12), endFrame: W("s3", 14) + 4, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "airWave.throughMesh", startFrame: W("s3", 12), endFrame: W("s3", 15), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "mosquito.caught", startFrame: W("s3", 15), endFrame: W("s3", 17), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "mosquito.shades", startFrame: W("s3", 15), endFrame: W("s3", 15) + 30, from: 1, to: 0, damping: 14, unit: "0-1" },
    ],
    badges: [
      { text: "MALHA ABERTA", variant: "positive", subtitle: "o ar passa", appearAt: W("s3", 10), disappearAt: end(2) - 4 },
    ],
    highlights: ["AR", "PASSAR", "REDE", "VENTO", "FICA"],
    captions: [
      { text: "Então você precisa de algo", from: voLocal("s3"), to: W("s3", 5) },
      { text: "que deixa o ar passar:", from: W("s3", 5), to: W("s3", 10) },
      { text: "uma rede.", from: W("s3", 10), to: W("s3", 12) },
      { text: "O vento atravessa,", from: W("s3", 12), to: W("s3", 15) },
      { text: "o mosquito fica.", from: W("s3", 15), to: end(2) },
    ],
    audioCues: [narration("s3"), sfx("pop-in", W("s3", 10), 0.3), sfx("swoosh", W("s3", 12), 0.3), sfx("badge", W("s3", 10), 0.26)],
  },
  {
    id: "scene-04-leve-demais",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Só que ele não pesa nada. Quica na rede e volta pro seu ouvido, ofendido. Bater não basta: precisa de choque.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0.3, 1.45, 0.4], 7.5, 34, 10)), key(W("s4", 6), P.bounce, "soft"), key(W("s4", 14), P.ear, "soft"), key(end(3), P.racketRoom, "soft")] },
    objects: [
      ...ROOM,
      { id: "hand", type: "mao-low-poly", visible: true },
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "desligada", end: "desligada" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "na rede", end: "de volta ao ouvido, sobrancelha franzida" } },
      { id: "scale", type: "balanca-comica", visible: true, state: { start: "fora", end: "marcando ~0" } },
    ],
    animations: [
      { type: "spring", target: "scale.enter", startFrame: W("s4", 2), endFrame: W("s4", 2) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "scale.needle", startFrame: W("s4", 4), endFrame: W("s4", 6), from: 0, to: 0.02, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "scale.enter", startFrame: W("s4", 6), endFrame: W("s4", 6) + 8, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "mosquito.bounce", startFrame: W("s4", 6), endFrame: W("s4", 6) + 32, from: 0, to: 1, damping: 6, unit: "0-1" },
      { type: "interpolate", target: "mosquito.path", startFrame: W("s4", 9), endFrame: W("s4", 13), from: 1, to: 0.95, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "mosquito.anger", startFrame: W("s4", 14), endFrame: W("s4", 14) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "racket.sparkHint", startFrame: W("s4", 20), endFrame: W("s4", 20) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "LEVE DEMAIS", variant: "negative", appearAt: W("s4", 4), disappearAt: W("s4", 15) },
      { text: "PRECISA DE CHOQUE", variant: "warning", appearAt: W("s4", 18), disappearAt: end(3) },
    ],
    highlights: ["NADA", "QUICA", "OFENDIDO", "CHOQUE"],
    captions: [
      { text: "Só que ele não pesa nada.", from: voLocal("s4"), to: W("s4", 6) },
      { text: "Quica na rede", from: W("s4", 6), to: W("s4", 9) },
      { text: "e volta pro seu ouvido,", from: W("s4", 9), to: W("s4", 14) },
      { text: "ofendido.", from: W("s4", 14), to: W("s4", 15) },
      { text: "Bater não basta:", from: W("s4", 15), to: W("s4", 18) },
      { text: "precisa de choque.", from: W("s4", 18), to: end(3) },
    ],
    audioCues: [narration("s4"), sfx("boing", W("s4", 6), 0.32), sfx("buzz", W("s4", 9), 0.2), sfx("zap-tiny", W("s4", 20), 0.22)],
  },
  {
    id: "scene-05-pilhas",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "No cabo moram duas pilhas. Três volts. Isso não assusta nem formiga. A tensão precisa subir. Muito.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.racketRoom), key(s(1.0), P.bench, "soft"), key(W("s5", 3), P.handle, "soft"), key(end(4), orbit([0, 0.6, 0], 5.2, 34, 6), "soft")] },
    objects: [
      { id: "bedroom", type: "quarto-low-poly", visible: true, state: { start: "aceso pela lua", end: "apagado (fundo carvão)" } },
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "na mão", end: "de pé na bancada, cabo transparente" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true, state: { start: "escondidas no cabo", end: "visíveis, 1,5 V + 1,5 V" } },
      { id: "ant", type: "formiga-comica", visible: true, state: { start: "fora", end: "bocejando" } },
      { id: "voltmeter", type: "voltimetro-2d", visible: true, state: { start: "fora", end: "3 V" } },
    ],
    animations: [
      { type: "interpolate", target: "bedroom.dim", startFrame: 0, endFrame: s(1.0), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "bg.mode", startFrame: 0, endFrame: s(1.0), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "racket.toBench", startFrame: 0, endFrame: s(1.0), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "racket.shell", startFrame: W("s5", 1), endFrame: W("s5", 3), from: 1, to: 0.15, easing: "out", unit: "0-1" },
      { type: "spring", target: "batteries.pop", startFrame: W("s5", 3), endFrame: W("s5", 3) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "spring", target: "voltmeter.enter", startFrame: W("s5", 5), endFrame: W("s5", 5) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "voltmeter.value", startFrame: W("s5", 5), endFrame: W("s5", 6), from: 0, to: 3, easing: "out", unit: "u3d" },
      { type: "spring", target: "ant.enter", startFrame: W("s5", 9), endFrame: W("s5", 9) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "ant.yawn", startFrame: W("s5", 10), endFrame: W("s5", 12), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "ant.enter", startFrame: W("s5", 12), endFrame: W("s5", 12) + 10, from: 1, to: 0, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "3 VOLTS", variant: "info", subtitle: "2 pilhas de 1,5 V", appearAt: W("s5", 5), disappearAt: W("s5", 12) },
      { text: "TENSÃO BAIXA", variant: "negative", appearAt: W("s5", 12), disappearAt: end(4) },
    ],
    highlights: ["PILHAS", "TRÊS", "VOLTS", "FORMIGA", "TENSÃO", "MUITO"],
    captions: [
      { text: "No cabo moram duas pilhas.", from: voLocal("s5"), to: W("s5", 5) },
      { text: "Três volts.", from: W("s5", 5), to: W("s5", 7) },
      { text: "Isso não assusta nem formiga.", from: W("s5", 7), to: W("s5", 12) },
      { text: "A tensão precisa subir. Muito.", from: W("s5", 12), to: end(4) },
    ],
    audioCues: [narration("s5"), sfx("whoosh-deep", 0, 0.3), sfx("click", W("s5", 3), 0.3), sfx("badge", W("s5", 5), 0.26), sfx("yawn-synth", W("s5", 10), 0.16)],
  },
  {
    id: "scene-06-oscilador",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Mas transformador não funciona com a corrente contínua da pilha. Então um oscilador liga e desliga ela milhares de vezes por segundo.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 0.6, 0], 5.2, 34, 6)), key(W("s6", 1), orbit([0, 0.8, 0.05], 4.2, 20, 5), "soft"), key(W("s6", 12), P.board, "soft"), key(end(5), orbit([0, 0.78, 0.05], 3.4, 4, 4), "soft")] },
    objects: [
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "cabo transparente", end: "cabo transparente" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true, state: { start: "apagada", end: "oscilando" } },
      { id: "transformer", type: "transformador-bobina", visible: true, state: { start: "parado", end: "vibrando de leve" } },
      { id: "current", type: "particulas-de-corrente", visible: true, state: { start: "fluxo contínuo e reto", end: "pulsos liga-desliga" } },
      { id: "voltmeter", type: "voltimetro-2d", visible: true, state: { start: "3 V", end: "3 V" } },
    ],
    animations: [
      { type: "interpolate", target: "current.flow", startFrame: W("s6", 3), endFrame: W("s6", 9), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "transformer.reject", startFrame: W("s6", 6), endFrame: W("s6", 9), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "board.oscillatorGlow", startFrame: W("s6", 12), endFrame: W("s6", 12) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "current.pulse", startFrame: W("s6", 13), endFrame: end(5), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "transformer.reject", startFrame: W("s6", 13), endFrame: W("s6", 13) + 8, from: 1, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "CORRENTE CONTÍNUA", variant: "negative", subtitle: "o transformador ignora", appearAt: W("s6", 6), disappearAt: W("s6", 12) },
      { text: "OSCILADOR", variant: "positive", subtitle: "liga e desliga, rapidinho", appearAt: W("s6", 12), disappearAt: end(5) },
    ],
    highlights: ["TRANSFORMADOR", "CONTÍNUA", "OSCILADOR", "LIGA", "DESLIGA", "MILHARES"],
    captions: [
      { text: "Mas transformador não funciona", from: voLocal("s6"), to: W("s6", 4) },
      { text: "com a corrente contínua da pilha.", from: W("s6", 4), to: W("s6", 10) },
      { text: "Então um oscilador", from: W("s6", 10), to: W("s6", 13) },
      { text: "liga e desliga ela", from: W("s6", 13), to: W("s6", 17) },
      { text: "milhares de vezes por segundo.", from: W("s6", 17), to: end(5) },
    ],
    audioCues: [narration("s6"), sfx("hum-flat", W("s6", 3), 0.14), sfx("error-blip", W("s6", 6), 0.2), sfx("whine-rise", W("s6", 13), 0.12)],
  },
  {
    id: "scene-07-transformador-capacitor",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Agora o transformador eleva a tensão, e diodos com capacitores empilham mais ainda. Um capacitor guarda a carga. Luzinha acesa: armada.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([0, 0.78, 0.05], 3.4, 4, 4)), key(W("s7", 7), orbit([0, 0.95, 0.05], 3.6, -14, 5), "soft"), key(W("s7", 13), orbit([0, 1.1, 0.05], 3.8, 10, 6), "soft"), key(end(6), orbit([0, 1.2, 0], 4.6, 24, 6), "soft")] },
    objects: [
      { id: "racket", type: "raquete-eletrica", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true, state: { start: "oscilando", end: "oscilando" } },
      { id: "transformer", type: "transformador-bobina", visible: true, state: { start: "pulsando", end: "elevando a tensão" } },
      { id: "multiplier", type: "escada-diodos-capacitores", visible: true, state: { start: "apagada", end: "acesa degrau a degrau" } },
      { id: "capacitor", type: "capacitor-cilindro", visible: true, state: { start: "vazio", end: "cheio (barra de carga)" } },
      { id: "led", type: "led-indicador", visible: true, state: { start: "apagado", end: "aceso" } },
      { id: "voltmeter", type: "voltimetro-2d", visible: true, state: { start: "3 V", end: "ponteiro estoura a escala" } },
    ],
    animations: [
      { type: "interpolate", target: "transformer.boost", startFrame: W("s7", 2), endFrame: W("s7", 5) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "voltmeter.value", startFrame: W("s7", 3), endFrame: W("s7", 6), from: 3, to: 300, easing: "out", unit: "u3d" },
      { type: "interpolate", target: "multiplier.stage", startFrame: W("s7", 7), endFrame: W("s7", 12) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "voltmeter.value", startFrame: W("s7", 10), endFrame: W("s7", 12) + 6, from: 300, to: 2000, easing: "in", unit: "u3d" },
      { type: "spring", target: "voltmeter.needleBreak", startFrame: W("s7", 12), endFrame: W("s7", 12) + 30, from: 0, to: 1, damping: 8, unit: "0-1" },
      { type: "interpolate", target: "capacitor.charge", startFrame: W("s7", 14), endFrame: W("s7", 17) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "led.on", startFrame: W("s7", 18), endFrame: W("s7", 18) + 30, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "voltmeter.exit", startFrame: end(6) - 10, endFrame: end(6), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "TRANSFORMADOR", variant: "positive", appearAt: W("s7", 2), disappearAt: W("s7", 7) },
      { text: "MULTIPLICADOR DE TENSÃO", variant: "positive", subtitle: "milhares de volts", appearAt: W("s7", 7), disappearAt: W("s7", 13) },
      { text: "CAPACITOR", variant: "info", subtitle: "a carga fica guardada", appearAt: W("s7", 14), disappearAt: end(6) },
    ],
    highlights: ["TRANSFORMADOR", "TENSÃO", "DIODOS", "CAPACITORES", "CAPACITOR", "CARGA", "ARMADA"],
    captions: [
      { text: "Agora o transformador", from: voLocal("s7"), to: W("s7", 3) },
      { text: "eleva a tensão,", from: W("s7", 3), to: W("s7", 6) },
      { text: "e diodos com capacitores", from: W("s7", 6), to: W("s7", 10) },
      { text: "empilham mais ainda.", from: W("s7", 10), to: W("s7", 13) },
      { text: "Um capacitor guarda a carga.", from: W("s7", 13), to: W("s7", 18) },
      { text: "Luzinha acesa: armada.", from: W("s7", 18), to: end(6) },
    ],
    audioCues: [narration("s7"), sfx("whine-rise", W("s7", 2), 0.12), sfx("tick-ladder", W("s7", 7), 0.2), sfx("boing-metal", W("s7", 12), 0.24), sfx("charge-up", W("s7", 14), 0.2), sfx("ding", W("s7", 18), 0.28)],
  },
  {
    id: "scene-08-tres-redes",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Mas eletricidade precisa de caminho. Por isso são três redes: as de fora num polo, a do meio no outro. O ar entre elas isola.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([0, 1.2, 0], 4.6, 24, 6)), key(s(1.2), P.head, "soft"), key(W("s8", 8), P.edge, "soft"), key(end(7), orbit([0, 2.15, 0], 4.6, 70, 5), "soft")] },
    objects: [
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "redes juntas", end: "redes afastadas (vista explodida)" } },
      { id: "capacitor", type: "capacitor-cilindro", visible: true, state: { start: "cheio", end: "cheio" } },
      { id: "led", type: "led-indicador", visible: true },
      { id: "gridOuterA", type: "rede-externa", visible: true, state: { start: "cinza", end: "azul (polo A)" } },
      { id: "gridMiddle", type: "rede-central", visible: true, state: { start: "cinza", end: "vermelha (polo B)" } },
      { id: "gridOuterB", type: "rede-externa", visible: true, state: { start: "cinza", end: "azul (polo A)" } },
      { id: "airGap", type: "brilho-do-vao", visible: true, state: { start: "invisível", end: "faixa translúcida entre as redes" } },
      { id: "current", type: "particulas-de-corrente", visible: true, state: { start: "chega na rede e para", end: "parada no beco sem saída" } },
    ],
    animations: [
      { type: "interpolate", target: "current.deadEnd", startFrame: W("s8", 1), endFrame: W("s8", 4) + 4, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "racket.explode", startFrame: W("s8", 7), endFrame: W("s8", 7) + 36, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "gridOuter.tint", startFrame: W("s8", 10), endFrame: W("s8", 14), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "gridMiddle.tint", startFrame: W("s8", 15), endFrame: W("s8", 19), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "airGap.glow", startFrame: W("s8", 20), endFrame: W("s8", 24), from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "SEM CAMINHO", variant: "negative", appearAt: W("s8", 1), disappearAt: W("s8", 7) },
      { text: "3 REDES", variant: "positive", subtitle: "fora: um polo · meio: o outro", appearAt: W("s8", 7), disappearAt: W("s8", 20) },
      { text: "AR ISOLANTE", variant: "info", appearAt: W("s8", 20), disappearAt: end(7) },
    ],
    highlights: ["ELETRICIDADE", "CAMINHO", "TRÊS", "REDES", "POLO", "MEIO", "ISOLA"],
    captions: [
      { text: "Mas eletricidade", from: voLocal("s8"), to: W("s8", 2) },
      { text: "precisa de caminho.", from: W("s8", 2), to: W("s8", 5) },
      { text: "Por isso são três redes:", from: W("s8", 5), to: W("s8", 10) },
      { text: "as de fora num polo,", from: W("s8", 10), to: W("s8", 15) },
      { text: "a do meio no outro.", from: W("s8", 15), to: W("s8", 20) },
      { text: "O ar entre elas isola.", from: W("s8", 20), to: end(7) },
    ],
    audioCues: [narration("s8"), sfx("error-blip", W("s8", 3), 0.18), sfx("whoosh-soft", W("s8", 7), 0.26), sfx("tick", W("s8", 10), 0.2), sfx("tick", W("s8", 15), 0.2)],
  },
  {
    id: "scene-09-zap",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Aí o mosquito entra no meio, encosta nas duas e vira o fio que faltava. O capacitor descarrega nele. Estalo. Churrasquinho.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 2.15, 0], 4.6, 70, 5)), key(W("s9", 6), P.zap, "soft"), key(W("s9", 19), orbit([0.1, 2.2, 0], 2.9, 52, 6), "out"), key(end(8), orbit([0.1, 2.15, 0], 3.6, 40, 8), "soft")] },
    objects: [
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "explodida", end: "redes voltando a se juntar" } },
      { id: "gridOuterA", type: "rede-externa", visible: true },
      { id: "gridMiddle", type: "rede-central", visible: true },
      { id: "gridOuterB", type: "rede-externa", visible: true },
      { id: "capacitor", type: "capacitor-cilindro", visible: true, state: { start: "cheio", end: "vazio → recarregando" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "entrando no vão, confiante", end: "tostado num espetinho" } },
      { id: "spark", type: "faisca-e-fumaca", visible: true, state: { start: "nada", end: "fumacinha subindo" } },
      { id: "current", type: "particulas-de-corrente", visible: true, state: { start: "parada", end: "atravessa o mosquito de uma rede à outra" } },
    ],
    animations: [
      { type: "interpolate", target: "mosquito.path", startFrame: 0, endFrame: W("s9", 6), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "mosquito.bridge", startFrame: W("s9", 6), endFrame: W("s9", 9), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "circuit.closed", startFrame: W("s9", 10), endFrame: W("s9", 14), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "capacitor.charge", startFrame: W("s9", 17), endFrame: W("s9", 17) + 4, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "bg.flash", startFrame: W("s9", 19), endFrame: W("s9", 19) + 8, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "spark.burst", startFrame: W("s9", 19), endFrame: W("s9", 19) + 14, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "mosquito.charred", startFrame: W("s9", 19), endFrame: W("s9", 19) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "mosquito.skewer", startFrame: W("s9", 20), endFrame: W("s9", 20) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "racket.explode", startFrame: end(8) - 24, endFrame: end(8), from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "capacitor.charge", startFrame: end(8) - 24, endFrame: end(8), from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "CIRCUITO FECHADO", variant: "positive", subtitle: "o mosquito vira o fio", appearAt: W("s9", 10), disappearAt: W("s9", 19) },
      { text: "ZAP", variant: "warning", appearAt: W("s9", 19), disappearAt: end(8) },
    ],
    highlights: ["MOSQUITO", "MEIO", "FIO", "CAPACITOR", "DESCARREGA", "ESTALO", "CHURRASQUINHO"],
    captions: [
      { text: "Aí o mosquito entra no meio,", from: voLocal("s9"), to: W("s9", 6) },
      { text: "encosta nas duas", from: W("s9", 6), to: W("s9", 9) },
      { text: "e vira o fio que faltava.", from: W("s9", 9), to: W("s9", 15) },
      { text: "O capacitor descarrega nele.", from: W("s9", 15), to: W("s9", 19) },
      { text: "Estalo. Churrasquinho.", from: W("s9", 19), to: end(8) },
    ],
    audioCues: [narration("s9"), sfx("buzz", 0, 0.2), sfx("zap", W("s9", 19), 0.42), sfx("sizzle", W("s9", 19) + 6, 0.2)],
  },
  {
    id: "scene-10-dedo",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "E se for o seu dedo? A carga guardada é pequena, então o choque é curtinho. Mas dói. Não teste.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0.1, 2.15, 0], 3.6, 40, 8)), key(W("s10", 3), P.finger, "soft"), key(W("s10", 16), orbit([0.4, 1.9, 0.2], 4.4, 20, 8), "out"), key(end(9), orbit([0.2, 1.8, 0.1], 6.5, 18, 10), "soft")] },
    objects: [
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "armada", end: "armada" } },
      { id: "capacitor", type: "capacitor-cilindro", visible: true, state: { start: "cheio", end: "cheio" } },
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "dedo curioso se aproximando", end: "recolhida, tremendo" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "no espetinho", end: "no espetinho" } },
    ],
    animations: [
      { type: "interpolate", target: "hand.finger", startFrame: W("s10", 2), endFrame: W("s10", 6), from: 0, to: 0.8, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "capacitor.size", startFrame: W("s10", 6), endFrame: W("s10", 10), from: 1, to: 0.55, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "hand.finger", startFrame: W("s10", 15), endFrame: W("s10", 16), from: 0.8, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "spark.small", startFrame: W("s10", 16), endFrame: W("s10", 16) + 6, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "spring", target: "hand.recoil", startFrame: W("s10", 16), endFrame: W("s10", 16) + 30, from: 0, to: 1, damping: 7, unit: "0-1" },
      { type: "interpolate", target: "capacitor.size", startFrame: W("s10", 16), endFrame: W("s10", 16) + 10, from: 0.55, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "POUCA ENERGIA", variant: "info", subtitle: "choque rápido", appearAt: W("s10", 6), disappearAt: W("s10", 16) },
      { text: "DÓI · NÃO TESTE", variant: "negative", appearAt: W("s10", 16), disappearAt: end(9) },
    ],
    highlights: ["DEDO", "PEQUENA", "CURTINHO", "DÓI", "TESTE"],
    captions: [
      { text: "E se for o seu dedo?", from: voLocal("s10"), to: W("s10", 6) },
      { text: "A carga guardada é pequena,", from: W("s10", 6), to: W("s10", 11) },
      { text: "então o choque é curtinho.", from: W("s10", 11), to: W("s10", 16) },
      { text: "Mas dói. Não teste.", from: W("s10", 16), to: end(9) },
    ],
    audioCues: [narration("s10"), sfx("suspense-tick", W("s10", 2), 0.18), sfx("zap-tiny", W("s10", 16), 0.34), sfx("boing", W("s10", 16) + 4, 0.22)],
  },
  {
    id: "scene-11-final",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Pronto: agora você entende como a raquete elétrica funciona. Já o mosquito não vai contar pra ninguém.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.2, 1.8, 0.1], 6.5, 18, 10)), key(s(1.4), orbit([-0.2, 1.3, 0.1], 11, 22, 14), "soft"), key(end(10), P.final, "soft")] },
    objects: [
      { id: "bedroom", type: "quarto-low-poly", visible: true, state: { start: "apagado", end: "aceso pela lua" } },
      { id: "sleeper", type: "dorminhoco", visible: true, state: { start: "acordado", end: "dormindo, sorrindo" } },
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "na bancada", end: "no criado-mudo, LED aceso" } },
      { id: "systemPath", type: "trilha-de-energia", visible: true, state: { start: "apagada", end: "pilhas → oscilador → transformador → multiplicador → capacitor → redes" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "no espetinho", end: "fantasminha de auréola saindo pela janela" } },
    ],
    animations: [
      { type: "interpolate", target: "systemPath.progress", startFrame: W("s11", 0), endFrame: W("s11", 8), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "bg.mode", startFrame: s(0.6), endFrame: s(1.8), from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "bedroom.dim", startFrame: s(0.6), endFrame: s(1.8), from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "racket.toBench", startFrame: s(0.6), endFrame: s(1.8), from: 1, to: 2, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "sleeper.eyes", startFrame: W("s11", 8), endFrame: W("s11", 8) + 12, from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "mosquito.ghost", startFrame: W("s11", 9), endFrame: W("s11", 9) + 30, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "mosquito.ghostRise", startFrame: W("s11", 9), endFrame: end(10) - 10, from: 0, to: 1, easing: "soft", unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(10) - 14, endFrame: end(10), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "RAQUETE ELÉTRICA", variant: "positive", size: "large", subtitle: "pilha · oscilador · transformador · capacitor · 3 redes", appearAt: W("s11", 6), disappearAt: end(10) - 6 },
    ],
    highlights: ["RAQUETE", "ELÉTRICA", "FUNCIONA", "MOSQUITO", "NINGUÉM"],
    captions: [
      { text: "Pronto: agora você entende", from: voLocal("s11"), to: W("s11", 4) },
      { text: "como a raquete elétrica funciona.", from: W("s11", 4), to: W("s11", 9) },
      { text: "Já o mosquito", from: W("s11", 9), to: W("s11", 12) },
      { text: "não vai contar pra ninguém.", from: W("s11", 12), to: end(10) },
    ],
    audioCues: [narration("s11"), sfx("whoosh-soft", s(0.6), 0.24), sfx("badge-big", W("s11", 6), 0.3), sfx("harp-up", W("s11", 9), 0.2), sfx("crickets", s(2.0), 0.08)],
  },
];
