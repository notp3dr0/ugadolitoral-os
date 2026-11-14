import React from 'react';
import {useCurrentFrame} from 'remotion';

// O mesmo embaralhado da entrada do portfólio (intro.js): símbolos %#&+/*=, as letras travam da
// esquerda pra direita, espaço e · nunca embaralham. Aqui é calculado por frame, sem estado.
const SYMBOLS = '%#&+/*=';

export const scrambleText = (text: string, frame: number, start: number, duration: number): string => {
  if (frame < start) return '';
  const reveal = duration <= 0 ? 1 : Math.min(1, (frame - start) / duration);
  if (reveal >= 1) return text;
  const resolved = Math.floor(reveal * text.length);
  const step = frame - start;
  return [...text]
    .map((ch, i) => (i < resolved || /[\s·@._]/.test(ch) ? ch : SYMBOLS[(i * 3 + step) % SYMBOLS.length]))
    .join('');
};

/** Embaralha sem parar (nunca trava): usado antes do AGENDA ABERTA travar no golpe. */
export const noiseText = (text: string, frame: number, seed = 0): string =>
  [...text].map((ch, i) => (/\s/.test(ch) ? ch : SYMBOLS[(i * 3 + frame + seed * 5) % SYMBOLS.length])).join('');

type Props = {
  text: string;
  /** frame (local) em que começa a embaralhar */
  start?: number;
  /** frames até travar tudo (o site leva ~48% da rolagem; aqui ~1 frame por letra, mínimo 8) */
  duration?: number;
  style?: React.CSSProperties;
};

export const Scramble: React.FC<Props> = ({text, start = 0, duration, style}) => {
  const frame = useCurrentFrame();
  const d = duration ?? Math.max(8, Math.round(text.length * 0.9));
  return <span style={{whiteSpace: 'pre', ...style}}>{scrambleText(text, frame, start, d)}</span>;
};
