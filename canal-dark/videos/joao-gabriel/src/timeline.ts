// Linha do tempo gerada a partir da duração real de cada fala (voz/duracoes.json, VoiceStudio).
// Cena = respiro antes + fala + respiro depois. 30 fps.
import dur from "./duracoes.json";

export const FPS = 30;
const ANTES = 0.3, DEPOIS = 0.6;

const BASE = [
  { id: "hook", legenda: ["TODO GRUPO TEM", "UM JOÃO GABRIEL"] },
  { id: "atraso", legenda: ["CHEGO EM", "10 MINUTOS"] },
  { id: "senna", legenda: ["SENNA MID", "SOZINHA"] },
  { id: "noite", legenda: ["SÓ MAIS UMA"] },
  { id: "derrota", legenda: ["CULPA DO JUNGLE"] },
  { id: "lanterna", legenda: ["PRESO NA FILA", "VISUALIZADO"] },
  { id: "ventilador", legenda: ["NINGUÉM PERGUNTA"] },
  { id: "final", legenda: ["MARCA O", "JOÃO GABRIEL"] },
] as const;

type Id = (typeof BASE)[number]["id"];
const d = dur as Record<Id, number>;

let cursor = 0;
export const SCENES = BASE.map((s) => {
  const len = Math.ceil((ANTES + d[s.id] + DEPOIS) * FPS);
  const out = { ...s, start: cursor, len, voz: `voz/${s.id}.wav`, vozFrom: cursor + Math.round(ANTES * FPS) };
  cursor += len;
  return out;
});
// créditos/encerramento: 1,5 s a mais no final
export const TOTAL = cursor + Math.round(1.5 * FPS);

export const sceneAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (f >= SCENES[k].start) i = k;
  const s = SCENES[i];
  const len = i + 1 < SCENES.length ? s.len : TOTAL - s.start;
  return { i, id: s.id as Id, local: f - s.start, len, legenda: s.legenda };
};
