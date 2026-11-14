import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Contrato de dados do vídeo (o scene-plan.ts da Fase 1 vira este arquivo na Fase 2).
// Frames de animações, badges, legendas, câmera e áudio são LOCAIS à cena; startFrame é global.
// Os cortes vêm de utils/timing.ts (planejados antes do TTS, medidos depois).

export type VideoConfig = {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  theme: string;
  language: string;
};

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d", language: "pt-BR" };

/** negative = problema (✖ vermelho), positive = solução (✔ verde), info = termo/neutro, warning = pergunta/atenção. */
export type BadgeVariant = "positive" | "negative" | "info" | "warning";

/** Pose de passagem da câmera (a câmera interpola em coordenadas orbitais entre as chaves). */
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };

export type CameraPlan = {
  projection: "perspective" | "orthographic";
  movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split" | "hold";
  /** keys[0] é a pose inicial do plano; inclua uma chave no último frame para continuidade. */
  keys: CameraKey[];
};

/** Objeto persistente do sistema: ids estáveis entre cenas; `visible` controla a montagem. */
export type SceneObject = { id: string; type: string; visible: boolean; state?: { start: string; end: string } };

export type SceneBadge = {
  text: string;
  variant: BadgeVariant;
  appearAt: number;
  disappearAt?: number;
  subtitle?: string;
  /** Coluna central (padrão) ou metade esquerda/direita de uma tela dividida. */
  slot?: "center" | "left" | "right";
  icon?: "?";
  size?: "normal" | "large";
};

/** Legenda provisória (antes do TTS). Depois do alinhamento, as legendas vêm palavra a palavra de vo.json. */
export type CaptionBlock = { text: string; from: number; to: number };

export type AudioCue = {
  kind: "narration" | "sfx";
  /** Caminho em public/ (ex.: "audio/vo/s1.wav", "audio/sfx/whoosh.wav"). */
  src: string;
  at: number;
  volume: number;
  /** "planned" ainda não existe em disco e não é tocado; "ready" foi gerado/medido. */
  status: "planned" | "ready";
};

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
  /** Palavras-chave (MAIÚSCULAS, sem pontuação) coloridas na legenda. */
  highlights: string[];
  captions: CaptionBlock[];
  audioCues: AudioCue[];
};

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey, status: AudioCue["status"]): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status });
// efeitos sintetizados por scripts/sfx.py (todos gerados antes do render)
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "ready" });

// Poses compartilhadas entre cenas (continuidade espacial).
// Mundo (u3d): cama na origem, cabeça do João Gabriel em [-1.35, 0.95, 0.25], criado-mudo em
// [-2.7, 0, 0.3], janela na parede do fundo (z = -1.5). Da s5 à s10 a raquete fica de pé na bancada:
// cabo em y -0.1–1.2, cabeça (3 redes) centrada em y ≈ 2.05.
const P = {
  room: orbit([-0.5, 1.0, 0], 13, 18, 14),
  ear: orbit([-1.22, 1.12, 0.4], 4.8, 24, 10),
  slap: orbit([-0.9, 1.1, 0.35], 6.2, 16, 12),
  racketRoom: orbit([0.15, 1.35, 0.5], 8.5, 22, 10),
  bounce: orbit([0.0, 1.45, 0.5], 6.5, 38, 10),
  bench: orbit([0, 1.35, 0], 9.5, 18, 8),
  handle: orbit([0, 0.38, 0], 4.6, 26, 6),
  board: orbit([0, 0.58, 0.05], 3.3, 12, 4),
  head: orbit([0, 2.05, 0], 6.2, 20, 6),
  edge: orbit([0, 2.05, 0], 5.6, 76, 4),
  zap: orbit([0.05, 2.15, 0.1], 3.0, 62, 6),
  finger: orbit([0.35, 1.55, 0.2], 5.6, 32, 8),
  final: orbit([-1.6, 1.35, 0], 17, 18, 14),
};

const ROOM: SceneObject[] = [
  { id: "bedroom", type: "quarto-low-poly", visible: true },
  { id: "sleeper", type: "joao-gabriel", visible: true },
];
const BENCH: SceneObject[] = [{ id: "bench", type: "bancada", visible: true }];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Três da manhã. Zumbido no ouvido do João Gabriel. Ele quer matar esse mosquito. Parece fácil: um tapa.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.room), key(W("s1", 3), P.ear, "soft"), key(W("s1", 13), orbit([-1.1, 1.1, 0.35], 5.0, 22, 11), "soft"), key(end(0), P.slap, "soft")] },
    objects: [
      ...ROOM,
      { id: "clock", type: "relogio-digital", visible: true, state: { start: "03:00", end: "03:00" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "entrando no quadro", end: "pairando no ouvido" } },
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "sob o lençol", end: "erguida pra bater" } },
    ],
    animations: [
      { type: "interpolate", target: "mosquito.path", startFrame: 0, endFrame: W("s1", 3) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "sleeper.eyes", startFrame: W("s1", 3), endFrame: W("s1", 3) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "hand.raise", startFrame: W("s1", 14), endFrame: W("s1", 14) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [
      { text: "03:00", variant: "warning", icon: "?", subtitle: "madrugada", appearAt: W("s1", 0), disappearAt: W("s1", 9) },
      { text: "TAPA", variant: "info", subtitle: "o plano infalível", appearAt: W("s1", 16), disappearAt: end(0) },
    ],
    highlights: ["ZUMBIDO", "JOÃO", "GABRIEL", "MOSQUITO", "TAPA"],
    captions: [{ text: "Três da manhã.", from: voLocal("s1"), to: end(0) }],
    audioCues: [narration("s1", "ready"), sfx("buzz", 0, 0.2), sfx("badge", W("s1", 0), 0.22), sfx("badge", W("s1", 16), 0.24)],
  },
  {
    id: "scene-02-tapa-erra",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Plaft. Na própria cara. O mosquito desviou: a mão empurra o ar, e o ar leva o bicho.",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [key(0, P.slap), key(s(0.6), orbit([-1.0, 1.1, 0.35], 5.6, 18, 12), "out"), key(W("s2", 7), orbit([-0.7, 1.2, 0.45], 6.4, 52, 8), "soft"), key(end(1), orbit([-0.4, 1.25, 0.5], 7.4, 64, 10), "soft")],
    },
    objects: [
      ...ROOM,
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "erguida", end: "na própria cara" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "no ouvido", end: "surfando na onda de ar, de óculos escuros" } },
      { id: "airWave", type: "particulas-de-ar", visible: true, state: { start: "parado", end: "onda empurrada pela mão" } },
    ],
    animations: [
      { type: "interpolate", target: "hand.slap", startFrame: -2, endFrame: s(0.22), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "sleeper.redCheek", startFrame: s(0.22), endFrame: s(0.45), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "camera.shake", startFrame: s(0.22), endFrame: s(0.7), from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "slowmo.rewind", startFrame: W("s2", 6), endFrame: W("s2", 8), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "airWave.progress", startFrame: W("s2", 9), endFrame: W("s2", 16), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "mosquito.surf", startFrame: W("s2", 12), endFrame: W("s2", 17) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "mosquito.shades", startFrame: W("s2", 15), endFrame: W("s2", 15) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [
      { text: "ERROU", variant: "negative", appearAt: W("s2", 1), disappearAt: W("s2", 8) },
      { text: "ONDA DE AR", variant: "negative", subtitle: "a mão empurra o ar", appearAt: W("s2", 9), disappearAt: end(1) },
    ],
    highlights: ["PLAFT", "CARA", "DESVIOU", "AR", "BICHO"],
    captions: [{ text: "Plaft.", from: voLocal("s2"), to: end(1) }],
    audioCues: [narration("s2", "ready"), sfx("slap", s(0.2), 0.55), sfx("rewind", W("s2", 6), 0.22), sfx("whoosh-soft", W("s2", 9), 0.26), sfx("badge", W("s2", 1), 0.22)],
  },
  {
    id: "scene-03-rede",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Então o João precisa de algo que deixa o ar passar: uma rede. O vento atravessa, o mosquito fica.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([-0.4, 1.25, 0.5], 7.4, 64, 10)), key(W("s3", 11), P.racketRoom, "soft"), key(end(2), orbit([0.15, 1.4, 0.5], 7.6, 34, 10), "soft")] },
    objects: [
      ...ROOM,
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "vazia", end: "segurando a raquete" } },
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "fora de cena", end: "na mão, desligada" } },
      { id: "airWave", type: "particulas-de-ar", visible: true, state: { start: "dissipando", end: "atravessando a malha" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "de óculos, debochado", end: "preso na rede" } },
    ],
    animations: [
      { type: "spring", target: "racket.enter", startFrame: W("s3", 12) - 8, endFrame: W("s3", 12) + 26, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "racket.swing", startFrame: W("s3", 13), endFrame: W("s3", 15) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "airWave.through", startFrame: W("s3", 13), endFrame: W("s3", 16) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "mosquito.caught", startFrame: W("s3", 15), endFrame: W("s3", 17), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "mosquito.shades", startFrame: W("s3", 16), endFrame: W("s3", 16) + 30, from: 1, to: 0, damping: 14, unit: "0-1" },
    ],
    badges: [{ text: "MALHA ABERTA", variant: "positive", subtitle: "o ar passa, o mosquito não", appearAt: W("s3", 12), disappearAt: end(2) - 4 }],
    highlights: ["JOÃO", "AR", "PASSAR", "REDE", "VENTO", "FICA"],
    captions: [{ text: "Então", from: voLocal("s3"), to: end(2) }],
    audioCues: [narration("s3", "ready"), sfx("pop-in", W("s3", 12) - 4, 0.3), sfx("swoosh", W("s3", 13), 0.3), sfx("net", W("s3", 15) + 4, 0.22), sfx("badge", W("s3", 12), 0.24)],
  },
  {
    id: "scene-04-leve-demais",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Só que o mosquito não pesa nada. Quica na rede e volta pro ouvido do João, ofendido. Bater não basta: precisa de choque.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0.15, 1.4, 0.5], 7.6, 34, 10)), key(W("s4", 7), P.bounce, "soft"), key(W("s4", 15), P.ear, "soft"), key(W("s4", 18), P.ear, "soft"), key(end(3), P.racketRoom, "soft")] },
    objects: [
      ...ROOM,
      { id: "hand", type: "mao-low-poly", visible: true },
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "desligada", end: "desligada" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "na rede", end: "de volta ao ouvido, sobrancelha franzida" } },
      { id: "scale", type: "balanca-2d", visible: true, state: { start: "fora", end: "marcando 0,002 g" } },
    ],
    animations: [
      { type: "spring", target: "scale.enter", startFrame: W("s4", 3), endFrame: W("s4", 3) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "scale.value", startFrame: W("s4", 4), endFrame: W("s4", 6) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "scale.enter", startFrame: W("s4", 7) + 4, endFrame: W("s4", 7) + 14, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "mosquito.bounce", startFrame: W("s4", 7), endFrame: W("s4", 7) + 32, from: 0, to: 1, damping: 6, unit: "0-1" },
      { type: "interpolate", target: "mosquito.back", startFrame: W("s4", 10), endFrame: W("s4", 15), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "mosquito.anger", startFrame: W("s4", 16), endFrame: W("s4", 16) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "racket.sparkHint", startFrame: W("s4", 22), endFrame: W("s4", 22) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "LEVE DEMAIS", variant: "negative", subtitle: "cerca de 2 miligramas", appearAt: W("s4", 5), disappearAt: W("s4", 17) },
      { text: "PRECISA DE CHOQUE", variant: "warning", icon: "?", appearAt: W("s4", 20), disappearAt: end(3) },
    ],
    highlights: ["MOSQUITO", "NADA", "QUICA", "JOÃO", "OFENDIDO", "CHOQUE"],
    captions: [{ text: "Só que", from: voLocal("s4"), to: end(3) }],
    audioCues: [narration("s4", "ready"), sfx("scale", W("s4", 4), 0.2), sfx("boing", W("s4", 7), 0.32), sfx("buzz", W("s4", 10), 0.16), sfx("badge", W("s4", 5), 0.22), sfx("zap-tiny", W("s4", 22), 0.24)],
  },
  {
    id: "scene-05-pilhas",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "No cabo moram duas pilhas. Três volts. Isso não assusta nem formiga. A tensão precisa subir. Muito.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.racketRoom), key(s(1.0), P.bench, "soft"), key(W("s5", 4), P.handle, "soft"), key(end(4), orbit([0, 0.4, 0], 4.3, 34, 6), "soft")] },
    objects: [
      { id: "bedroom", type: "quarto-low-poly", visible: true, state: { start: "aceso pela lua", end: "apagado (fundo carvão)" } },
      { id: "sleeper", type: "joao-gabriel", visible: true, state: { start: "acordado", end: "some com o quarto" } },
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "segurando", end: "some com o quarto" } },
      ...BENCH,
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "na mão", end: "de pé na bancada, cabo transparente" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true, state: { start: "escondidas no cabo", end: "visíveis, 1,5 V + 1,5 V" } },
      { id: "ant", type: "formiga-comica", visible: true, state: { start: "fora", end: "bocejando" } },
      { id: "voltmeter", type: "voltimetro-2d", visible: true, state: { start: "fora", end: "3 V" } },
    ],
    animations: [
      { type: "interpolate", target: "bedroom.dim", startFrame: 0, endFrame: s(1.0), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "bg.mode", startFrame: 0, endFrame: s(1.0), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "racket.toBench", startFrame: 0, endFrame: s(1.0), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "racket.shell", startFrame: W("s5", 1), endFrame: W("s5", 4), from: 1, to: 0.18, easing: "out", unit: "0-1" },
      { type: "spring", target: "batteries.pop", startFrame: W("s5", 4), endFrame: W("s5", 4) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "spring", target: "voltmeter.enter", startFrame: W("s5", 5) - 4, endFrame: W("s5", 5) + 26, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "voltmeter.value", startFrame: W("s5", 5), endFrame: W("s5", 6) + 4, from: 0, to: 3, easing: "out", unit: "u3d" },
      { type: "spring", target: "ant.enter", startFrame: W("s5", 8), endFrame: W("s5", 8) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "ant.yawn", startFrame: W("s5", 10), endFrame: W("s5", 12), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "ant.enter", startFrame: W("s5", 13), endFrame: W("s5", 13) + 12, from: 1, to: 0, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "3 VOLTS", variant: "info", subtitle: "2 pilhas de 1,5 V", appearAt: W("s5", 5), disappearAt: W("s5", 12) },
      { text: "TENSÃO BAIXA", variant: "negative", appearAt: W("s5", 12), disappearAt: end(4) },
    ],
    highlights: ["PILHAS", "TRÊS", "VOLTS", "FORMIGA", "TENSÃO", "MUITO"],
    captions: [{ text: "No cabo", from: voLocal("s5"), to: end(4) }],
    audioCues: [narration("s5", "ready"), sfx("whoosh-deep", 0, 0.3), sfx("click", W("s5", 4), 0.3), sfx("badge", W("s5", 5), 0.22), sfx("yawn", W("s5", 10), 0.2), sfx("badge", W("s5", 12), 0.22)],
  },
  {
    id: "scene-06-oscilador",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Mas transformador não funciona com a corrente contínua da pilha. Então um oscilador liga e desliga ela milhares de vezes por segundo.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 0.4, 0], 4.3, 34, 6)), key(W("s6", 1), orbit([0, 0.5, 0.05], 3.7, 20, 5), "soft"), key(W("s6", 12), P.board, "soft"), key(end(5), orbit([0, 0.62, 0.05], 3.1, 4, 4), "soft")] },
    objects: [
      ...BENCH,
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "cabo transparente", end: "cabo transparente" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true, state: { start: "apagada", end: "oscilando" } },
      { id: "current", type: "particulas-de-corrente", visible: true, state: { start: "fluxo contínuo e reto", end: "pulsos liga-desliga" } },
      { id: "voltmeter", type: "voltimetro-2d", visible: true, state: { start: "3 V", end: "3 V" } },
    ],
    animations: [
      { type: "interpolate", target: "current.flow", startFrame: W("s6", 3), endFrame: W("s6", 9), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "transformer.reject", startFrame: W("s6", 6), endFrame: W("s6", 9), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "board.osc", startFrame: W("s6", 12), endFrame: W("s6", 12) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "current.pulse", startFrame: W("s6", 13), endFrame: W("s6", 13) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "transformer.reject", startFrame: W("s6", 13), endFrame: W("s6", 13) + 8, from: 1, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "CORRENTE CONTÍNUA", variant: "negative", subtitle: "o transformador ignora", appearAt: W("s6", 6), disappearAt: W("s6", 12) },
      { text: "OSCILADOR", variant: "positive", subtitle: "liga e desliga, rapidinho", appearAt: W("s6", 12), disappearAt: end(5) },
    ],
    highlights: ["TRANSFORMADOR", "CONTÍNUA", "OSCILADOR", "LIGA", "DESLIGA", "MILHARES"],
    captions: [{ text: "Mas", from: voLocal("s6"), to: end(5) }],
    audioCues: [narration("s6", "ready"), sfx("hum", W("s6", 3), 0.12), sfx("error", W("s6", 7), 0.2), sfx("badge", W("s6", 6), 0.2), sfx("whine", W("s6", 13), 0.1), sfx("badge", W("s6", 12), 0.22)],
  },
  {
    id: "scene-07-transformador-capacitor",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Agora o transformador eleva a tensão, e diodos com capacitores empilham mais ainda. Um capacitor guarda a carga. Luzinha acesa: armada.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([0, 0.62, 0.05], 3.1, 4, 4)), key(W("s7", 7), orbit([0, 0.82, 0.05], 3.2, -14, 5), "soft"), key(W("s7", 13), orbit([0, 1.0, 0.05], 3.4, 10, 6), "soft"), key(end(6), orbit([0, 1.15, 0], 4.4, 24, 6), "soft")] },
    objects: [
      ...BENCH,
      { id: "racket", type: "raquete-eletrica", visible: true },
      { id: "batteries", type: "2-pilhas-AA", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true, state: { start: "oscilando", end: "oscilando" } },
      { id: "current", type: "particulas-de-corrente", visible: true, state: { start: "pulsando", end: "chegando ao capacitor" } },
      { id: "voltmeter", type: "voltimetro-2d", visible: true, state: { start: "3 V", end: "ponteiro estoura a escala" } },
    ],
    animations: [
      { type: "interpolate", target: "transformer.boost", startFrame: W("s7", 2), endFrame: W("s7", 5) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "voltmeter.value", startFrame: W("s7", 3), endFrame: W("s7", 6), from: 3, to: 300, easing: "out", unit: "u3d" },
      { type: "interpolate", target: "multiplier.stage", startFrame: W("s7", 7), endFrame: W("s7", 12) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "voltmeter.value", startFrame: W("s7", 10), endFrame: W("s7", 12) + 6, from: 300, to: 2000, easing: "in", unit: "u3d" },
      { type: "spring", target: "voltmeter.break", startFrame: W("s7", 12), endFrame: W("s7", 12) + 30, from: 0, to: 1, damping: 8, unit: "0-1" },
      { type: "interpolate", target: "capacitor.charge", startFrame: W("s7", 14), endFrame: W("s7", 17) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "led.on", startFrame: W("s7", 18), endFrame: W("s7", 18) + 30, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "voltmeter.exit", startFrame: end(6) - 10, endFrame: end(6), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "TRANSFORMADOR", variant: "positive", subtitle: "eleva a tensão", appearAt: W("s7", 2), disappearAt: W("s7", 7) },
      { text: "MULTIPLICADOR", variant: "positive", subtitle: "milhares de volts", appearAt: W("s7", 7), disappearAt: W("s7", 13) },
      { text: "CAPACITOR", variant: "info", subtitle: "a carga fica guardada", appearAt: W("s7", 14), disappearAt: end(6) },
    ],
    highlights: ["TRANSFORMADOR", "TENSÃO", "DIODOS", "CAPACITORES", "CAPACITOR", "CARGA", "ARMADA"],
    captions: [{ text: "Agora", from: voLocal("s7"), to: end(6) }],
    audioCues: [narration("s7", "ready"), sfx("whine", W("s7", 2), 0.1), sfx("ladder", W("s7", 7), 0.18), sfx("boing-metal", W("s7", 12), 0.24), sfx("charge", W("s7", 14), 0.18), sfx("ding", W("s7", 18), 0.28), sfx("badge", W("s7", 2), 0.2), sfx("badge", W("s7", 7), 0.2), sfx("badge", W("s7", 14), 0.2)],
  },
  {
    id: "scene-08-tres-redes",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Mas eletricidade precisa de caminho. Por isso são três redes: as de fora num polo, a do meio no outro. O ar entre elas isola.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([0, 1.15, 0], 4.4, 24, 6)), key(s(1.3), P.head, "soft"), key(W("s8", 8), P.edge, "soft"), key(end(7), orbit([0, 2.1, 0.1], 4.6, 68, 5), "soft")] },
    objects: [
      ...BENCH,
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "redes juntas", end: "redes afastadas (vista explodida)" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true },
      { id: "current", type: "particulas-de-corrente", visible: true, state: { start: "chega na rede e para", end: "parada no beco sem saída" } },
      { id: "airGap", type: "brilho-do-vao", visible: true, state: { start: "invisível", end: "faixa translúcida entre as redes" } },
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
      { text: "AR ISOLANTE", variant: "info", subtitle: "o vão segura a carga", appearAt: W("s8", 20), disappearAt: end(7) },
    ],
    highlights: ["ELETRICIDADE", "CAMINHO", "TRÊS", "REDES", "POLO", "MEIO", "ISOLA"],
    captions: [{ text: "Mas", from: voLocal("s8"), to: end(7) }],
    audioCues: [narration("s8", "ready"), sfx("error", W("s8", 3), 0.18), sfx("whoosh-soft", W("s8", 7), 0.26), sfx("tick", W("s8", 10), 0.2), sfx("tick", W("s8", 15), 0.2), sfx("badge", W("s8", 1), 0.2), sfx("badge", W("s8", 7), 0.22), sfx("badge", W("s8", 20), 0.2)],
  },
  {
    id: "scene-09-zap",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Aí o mosquito entra no meio, encosta nas duas e vira o fio que faltava. O capacitor descarrega nele. Estalo. Churrasquinho.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 2.1, 0.1], 4.6, 68, 5)), key(W("s9", 6), P.zap, "soft"), key(W("s9", 19), orbit([0.05, 2.15, 0.1], 2.6, 54, 6), "out"), key(end(8), orbit([0.1, 2.1, 0.1], 3.4, 40, 8), "soft")] },
    objects: [
      ...BENCH,
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "explodida", end: "redes voltando a se juntar" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true },
      { id: "current", type: "particulas-de-corrente", visible: true, state: { start: "parada", end: "atravessa o mosquito de uma rede à outra" } },
      { id: "airGap", type: "brilho-do-vao", visible: true },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "entrando no vão, confiante", end: "tostado num espetinho" } },
      { id: "spark", type: "faisca-e-fumaca", visible: true, state: { start: "nada", end: "fumacinha subindo" } },
    ],
    animations: [
      { type: "interpolate", target: "mosquito.enter", startFrame: 0, endFrame: W("s9", 6), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "racket.explode", startFrame: W("s9", 3), endFrame: W("s9", 6), from: 1, to: 0.3, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "mosquito.bridge", startFrame: W("s9", 6), endFrame: W("s9", 9), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "circuit.closed", startFrame: W("s9", 10), endFrame: W("s9", 14), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "capacitor.charge", startFrame: W("s9", 19) - 2, endFrame: W("s9", 19) + 3, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "bg.flash", startFrame: W("s9", 19), endFrame: W("s9", 19) + 9, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "spark.burst", startFrame: W("s9", 19), endFrame: W("s9", 19) + 16, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "mosquito.charred", startFrame: W("s9", 19), endFrame: W("s9", 19) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "mosquito.skewer", startFrame: W("s9", 20), endFrame: W("s9", 20) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "racket.explode", startFrame: end(8) - 26, endFrame: end(8), from: 0.3, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "capacitor.charge", startFrame: end(8) - 26, endFrame: end(8), from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "CIRCUITO FECHADO", variant: "positive", subtitle: "o mosquito vira o fio", appearAt: W("s9", 10), disappearAt: W("s9", 19) },
      { text: "ZAP!", variant: "warning", appearAt: W("s9", 19), disappearAt: end(8) },
    ],
    highlights: ["MOSQUITO", "MEIO", "FIO", "CAPACITOR", "DESCARREGA", "ESTALO", "CHURRASQUINHO"],
    captions: [{ text: "Aí", from: voLocal("s9"), to: end(8) }],
    audioCues: [narration("s9", "ready"), sfx("buzz", 0, 0.18), sfx("badge", W("s9", 10), 0.22), sfx("zap", W("s9", 19) - 1, 0.42), sfx("sizzle", W("s9", 19) + 6, 0.2), sfx("pop-in", W("s9", 20), 0.22)],
  },
  {
    id: "scene-10-dedo",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "E se for o dedo do João? A carga guardada é pequena, então o choque é curtinho. Mas dói. Não teste.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0.1, 2.1, 0.1], 3.4, 40, 8)), key(W("s10", 4), P.finger, "soft"), key(W("s10", 17), orbit([0.35, 1.6, 0.2], 5.0, 22, 8), "out"), key(end(9), orbit([0.2, 1.55, 0.1], 6.6, 18, 10), "soft")] },
    objects: [
      ...BENCH,
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "armada", end: "armada" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true },
      { id: "hand", type: "mao-low-poly", visible: true, state: { start: "dedo curioso se aproximando", end: "recolhida, tremendo" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "no espetinho", end: "no espetinho" } },
      { id: "spark", type: "faisca-e-fumaca", visible: true },
    ],
    animations: [
      { type: "interpolate", target: "hand.finger", startFrame: W("s10", 2), endFrame: W("s10", 7), from: 0, to: 0.8, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "capacitor.size", startFrame: W("s10", 7), endFrame: W("s10", 11) + 4, from: 1, to: 0.5, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "hand.finger", startFrame: W("s10", 16), endFrame: W("s10", 17), from: 0.8, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "spark.small", startFrame: W("s10", 17), endFrame: W("s10", 17) + 7, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "spring", target: "hand.recoil", startFrame: W("s10", 17), endFrame: W("s10", 17) + 32, from: 0, to: 1, damping: 7, unit: "0-1" },
      { type: "interpolate", target: "capacitor.size", startFrame: W("s10", 17), endFrame: W("s10", 17) + 10, from: 0.5, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "POUCA ENERGIA", variant: "info", subtitle: "choque rápido", appearAt: W("s10", 7), disappearAt: W("s10", 17) },
      { text: "DÓI · NÃO TESTE", variant: "negative", appearAt: W("s10", 17), disappearAt: end(9) },
    ],
    highlights: ["DEDO", "JOÃO", "PEQUENA", "CURTINHO", "DÓI", "TESTE"],
    captions: [{ text: "E se", from: voLocal("s10"), to: end(9) }],
    audioCues: [narration("s10", "ready"), sfx("suspense", W("s10", 2), 0.16), sfx("badge", W("s10", 7), 0.2), sfx("zap-tiny", W("s10", 17), 0.32), sfx("boing", W("s10", 17) + 4, 0.22)],
  },
  {
    id: "scene-11-final",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Pronto: agora você entende como a raquete elétrica funciona. O João dorme. E o mosquito não conta pra ninguém.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.2, 1.55, 0.1], 6.6, 18, 10)), key(s(1.6), orbit([-1.0, 1.3, 0.2], 11, 22, 14), "soft"), key(end(10), P.final, "soft")] },
    objects: [
      { id: "bedroom", type: "quarto-low-poly", visible: true, state: { start: "apagado", end: "aceso pela lua" } },
      { id: "sleeper", type: "joao-gabriel", visible: true, state: { start: "acordado", end: "dormindo" } },
      ...BENCH,
      { id: "racket", type: "raquete-eletrica", visible: true, state: { start: "na bancada", end: "no criado-mudo, LED aceso" } },
      { id: "batteries", type: "2-pilhas-AA", visible: true },
      { id: "board", type: "placa-de-circuito", visible: true },
      { id: "systemPath", type: "trilha-de-energia", visible: true, state: { start: "apagada", end: "pilhas → oscilador → transformador → multiplicador → capacitor → redes" } },
      { id: "mosquito", type: "mosquito-personagem", visible: true, state: { start: "no espetinho", end: "fantasminha de auréola saindo pela janela" } },
    ],
    animations: [
      { type: "interpolate", target: "systemPath.progress", startFrame: W("s11", 0), endFrame: W("s11", 8) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "bg.mode", startFrame: s(0.5), endFrame: s(1.7), from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "bedroom.dim", startFrame: s(0.5), endFrame: s(1.7), from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "bench.hide", startFrame: s(0.5), endFrame: s(1.2), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "racket.toBench", startFrame: s(0.5), endFrame: s(1.7), from: 1, to: 2, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "sleeper.eyes", startFrame: W("s11", 10), endFrame: W("s11", 11) + 10, from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "mosquito.ghost", startFrame: W("s11", 13), endFrame: W("s11", 13) + 30, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "mosquito.ghostRise", startFrame: W("s11", 13), endFrame: end(10) - 8, from: 0, to: 1, easing: "soft", unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(10) - 16, endFrame: end(10), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "RAQUETE ELÉTRICA", variant: "positive", size: "large", subtitle: "pilha · oscilador · capacitor · 3 redes", appearAt: W("s11", 6), disappearAt: end(10) - 10 },
    ],
    highlights: ["RAQUETE", "ELÉTRICA", "FUNCIONA", "JOÃO", "DORME", "MOSQUITO", "NINGUÉM"],
    captions: [{ text: "Pronto", from: voLocal("s11"), to: end(10) }],
    audioCues: [narration("s11", "ready"), sfx("whoosh-soft", s(0.5), 0.24), sfx("badge-big", W("s11", 6), 0.3), sfx("harp", W("s11", 13), 0.22), sfx("crickets", s(1.8), 0.1)],
  },
];

/** Valor de uma trilha de animação (ex.: "subject.scale") no frame global. */
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
