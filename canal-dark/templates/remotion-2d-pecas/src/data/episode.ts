import type { Word } from "../engine/Captions";
import { FPS } from "../theme";

// CONTRATO DO EPISÓDIO. Tudo que o vídeo precisa está aqui: planos, legenda e efeitos sonoros.
// Em série real: copie este arquivo pra `episodios/epNN.ts`, troque os dados e aponte a Composition.
// Tempos em SEGUNDOS; o motor converte pra frames.

export type ShotDef = {
  id: string;
  from: number;
  dur: number;
  /** como o plano ENTRA. cut = corte seco (susto). dissolve = funde sobre o anterior. fadeblack = sai do preto. */
  inT: "cut" | "dissolve" | "fadeblack";
  inS?: number; // duração da entrada em segundos (dissolve/fadeblack)
  outBlack?: number; // segundos de fade pra preto no fim do plano
  note: string; // intenção do plano (tipo de plano e por que existe)
};

export const FINAL_ACCENT = "#ff9d1c";

export const SHOTS: ShotDef[] = [
  { id: "porta", from: 0.0, dur: 2.2, inT: "fadeblack", inS: 0.4, note: "DETALHE sem personagem: olho mágico. Câmera desce (tilt)." },
  { id: "quarto", from: 2.2, dur: 3.0, inT: "dissolve", inS: 0.4, note: "MÉDIO: herói + janela tapada, feixe de luz com poeira, câmera se aproxima." },
  { id: "rua", from: 5.2, dur: 4.8, inT: "dissolve", inS: 0.5, outBlack: 0.4, note: "GERAL em paralaxe: rua ao pôr do sol que escurece. Calmo = câmera andando." },
  // 10.0–10.4: PRETO E SILÊNCIO TOTAL (nenhum plano, nenhum som). É o que faz o susto funcionar.
  { id: "susto", from: 10.4, dur: 1.0, inT: "cut", note: "SUSTO: corte seco, plano fixo, rosto na fresta. Flash + grave + tremor." },
  { id: "tiro", from: 11.4, dur: 1.8, inT: "cut", note: "AÇÃO: herói mira, recuo, estilhaços e fumaça." },
  { id: "pov", from: 13.2, dur: 2.0, inT: "cut", note: "POV: mãos e cone de lanterna no corredor, algo se move ao fundo." },
  { id: "porta2", from: 15.2, dur: 2.8, inT: "cut", note: "POV: porta de aço, olhos surgindo. Segundo impacto de grave." },
  { id: "geral", from: 18.0, dur: 1.8, inT: "cut", note: "REVELAÇÃO DE ESCALA: afasta e mostra a horda." },
  { id: "titulo", from: 19.8, dur: 1.5, inT: "fadeblack", inS: 0.4, note: "FECHO: preto + título, sem voz." },
];

export const SECONDS = 21.3;
export const DURATION = Math.round(SECONDS * FPS);

/** Legenda de DEMONSTRAÇÃO. Em série real, vem do vo.json (tempo real por palavra). Uma palavra `hi` por bloco. */
export const WORDS: Word[] = [
  { t: "Imagina", from: 0.4, to: 0.8 },
  { t: "que", from: 0.8, to: 1.0 },
  { t: "você", from: 1.0, to: 1.4, hi: true },
  { t: "ouve", from: 1.6, to: 1.9 },
  { t: "alguém", from: 1.9, to: 2.4, hi: true },
  { t: "arranhando", from: 2.4, to: 3.1 },
  { t: "a", from: 3.2, to: 3.3 },
  { t: "porta", from: 3.3, to: 3.8, hi: true },
  { t: "faz", from: 4.1, to: 4.3 },
  { t: "três", from: 4.3, to: 4.6 },
  { t: "anos", from: 4.6, to: 5.0, hi: true },
  { t: "ninguém", from: 5.4, to: 5.9 },
  { t: "passa", from: 5.9, to: 6.3 },
  { t: "nessa", from: 6.3, to: 6.7 },
  { t: "rua", from: 6.7, to: 7.2, hi: true },
  { t: "e", from: 7.8, to: 7.9 },
  { t: "o", from: 7.9, to: 8.0 },
  { t: "sol", from: 8.0, to: 8.5, hi: true },
  { t: "tá", from: 8.7, to: 8.9 },
  { t: "indo", from: 8.9, to: 9.3 },
  { t: "embora", from: 9.3, to: 9.9, hi: true },
  // 10.0–10.4 sem voz (silêncio)
  { t: "eles", from: 11.6, to: 11.9 },
  { t: "voltaram", from: 11.9, to: 12.5, hi: true },
  { t: "e", from: 13.6, to: 13.7 },
  { t: "sabem", from: 13.7, to: 14.1 },
  { t: "onde", from: 14.1, to: 14.5 },
  { t: "você", from: 15.9, to: 16.3 },
  { t: "mora", from: 16.3, to: 16.9, hi: true },
];

export type Cue = { at: number; src: string; vol: number; dur?: number; note: string };

/** Efeitos sonoros e camas. Arquivos gerados por `npm run sfx` (síntese em código, nada de terceiros). */
export const CUES: Cue[] = [
  { at: 0.0, src: "audio/drone.wav", vol: 0.3, dur: 9.8, note: "cama grave com pulso lento; some ANTES do susto" },
  { at: 1.6, src: "audio/knock.wav", vol: 0.55, note: "batidas na porta (detalhe)" },
  { at: 3.1, src: "audio/creak.wav", vol: 0.4, note: "madeira estalando" },
  { at: 10.5, src: "audio/bass_hit.wav", vol: 1.0, note: "SUSTO: impacto de grave (~12 dB acima do resto)" },
  { at: 11.55, src: "audio/gunshot.wav", vol: 0.8, note: "tiro" },
  { at: 11.58, src: "audio/wood_crack.wav", vol: 0.7, note: "tábuas estilhaçando" },
  { at: 13.4, src: "audio/breath.wav", vol: 0.35, note: "respiração curta no POV" },
  { at: 15.65, src: "audio/bass_hit.wav", vol: 0.9, note: "segundo impacto: os olhos na porta" },
  { at: 18.05, src: "audio/drone.wav", vol: 0.28, dur: 1.7, note: "cama curta na revelação" },
];

/** Troque para true depois de `npm run sfx` (gera public/audio/*.wav). */
export const AUDIO_READY = true;
