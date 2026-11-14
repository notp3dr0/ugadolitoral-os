import vo from "../data/vo.json";

// Linha do tempo única do vídeo. Antes do TTS, os cortes vêm de PLANNED_SECONDS (roteiro aprovado).
// Depois de voiceover_gemini.mjs + align_words.py + prepare_vo.py preencherem src/data/vo.json, os
// cortes passam a ser derivados da duração REAL de cada fala: cada fala começa LEAD s depois do corte
// da sua cena e as falas são encadeadas com GAPS. Cenas, legendas, efeitos e trilha leem estes valores.
//
// O vídeo é um LOOP: o último quadro emenda no primeiro. Por isso a duração total também sai da voz:
// fim da última fala + TAIL (o rebobinar termina) e, no começo, FIRST_VO até a 1ª fala.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const f = (seconds: number) => Math.round(seconds * FPS);
/** Segundo local (dentro da cena) -> frame local. */
export const s = (seconds: number) => Math.round(seconds * FPS);

/** Uma fala por cena, na ordem das cenas. */
export const VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"] as const;
export type VoKey = (typeof VO_KEYS)[number];

/** Durações planejadas no roteiro (s), uma por cena (antes da voz real). */
const PLANNED_SECONDS = [6, 7, 7, 6, 7, 7, 7, 7, 6];
/** A 1ª fala entra logo depois do corte do loop. */
const FIRST_VO = 0.3;
/** O corte de cada cena acontece este tanto antes da 1ª sílaba da sua fala. */
const LEAD = 0.25;
/** Pausa entre o fim de uma fala e o início da próxima (len = cenas - 1): ritmo de piada. */
const GAPS: number[] = [0.45, 0.5, 0.55, 0.85, 0.6, 0.5, 0.6, 0.5];
/** Depois da última fala: o rebobinar termina e o vídeo volta ao quadro 0. */
const TAIL = 1.15;

type VoWord = { text: string; start: number; end: number };
type VoLine = { text: string; seconds: number; words: VoWord[] };
const VO_DATA = vo as unknown as Partial<Record<string, VoLine>>;

/** true quando todas as falas já têm áudio medido. */
export const HAS_VO = VO_KEYS.every((k) => VO_DATA[k] !== undefined);

const voStart = {} as Record<VoKey, number>;
let voEnd = 0;
{
  let t = FIRST_VO;
  let planned = 0;
  VO_KEYS.forEach((key, i) => {
    const line = VO_DATA[key];
    voStart[key] = HAS_VO ? t : planned + LEAD;
    voEnd = t + (line?.seconds ?? 0);
    t += (line?.seconds ?? 0) + (GAPS[i] ?? 0);
    planned += PLANNED_SECONDS[i];
  });
}

/** Duração total (s): medida pela voz no loop, ou a planejada antes do TTS. */
export const SECONDS = HAS_VO ? Math.round((voEnd + TAIL) * FPS) / FPS : PLANNED_SECONDS.reduce((a, b) => a + b, 0);
export const DURATION = f(SECONDS);

/** Segundo absoluto em que cada fala começa. */
export const VO_START: Readonly<Record<VoKey, number>> = voStart;

export const VO = VO_KEYS.filter((k) => VO_DATA[k]).map((id) => ({ id, at: VO_START[id], seconds: VO_DATA[id]!.seconds, text: VO_DATA[id]!.text }));

/** Cortes das cenas em frames globais: [início, fim). Somam exatamente DURATION. */
export const SCENE_FRAMES = VO_KEYS.map((key, i) => {
  const next = VO_KEYS[i + 1];
  if (!HAS_VO) {
    const from = f(PLANNED_SECONDS.slice(0, i).reduce((a, b) => a + b, 0));
    const to = next ? f(PLANNED_SECONDS.slice(0, i + 1).reduce((a, b) => a + b, 0)) : DURATION;
    return { from, durationInFrames: to - from };
  }
  const from = i === 0 ? 0 : f(VO_START[key] - LEAD);
  const to = next ? f(VO_START[next] - LEAD) : DURATION;
  return { from, durationInFrames: to - from };
});

/** Palavras da fala com tempos (relativos ao início da fala), ou [] antes do TTS. */
export const voWords = (key: VoKey): VoWord[] => VO_DATA[key]?.words ?? [];

/**
 * Frame LOCAL (dentro da cena) em que a palavra `index` da fala começa.
 * Antes do TTS devolve uma estimativa a ~155 palavras/min — provisória, realinhe depois.
 */
export const wordLocal = (key: VoKey, index: number) => {
  const scene = SCENE_FRAMES[VO_KEYS.indexOf(key)];
  const w = VO_DATA[key]?.words[index];
  const t = w ? w.start : index * (60 / 155);
  return f(VO_START[key] + t) - scene.from;
};

/** Frame LOCAL em que a palavra `index` termina. */
export const wordEndLocal = (key: VoKey, index: number) => {
  const scene = SCENE_FRAMES[VO_KEYS.indexOf(key)];
  const w = VO_DATA[key]?.words[index];
  const t = w ? w.end : (index + 1) * (60 / 155);
  return f(VO_START[key] + t) - scene.from;
};

/** Frame local em que a fala da cena começa. */
export const voLocal = (key: VoKey) => f(VO_START[key]) - SCENE_FRAMES[VO_KEYS.indexOf(key)].from;
