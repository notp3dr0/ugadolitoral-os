import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLOR, FONT} from '../lib/brand';
import {noiseText, Scramble, scrambleText} from './Scramble';

const SENTENCE: React.CSSProperties = {
  fontFamily: FONT.display,
  fontWeight: 700,
  fontSize: 140,
  letterSpacing: '-0.05em',
  lineHeight: 1,
  textAlign: 'center',
};

/** Etiqueta do acervo (o `media-label` do site): monoespaçada, caixa-alta, canto de baixo. */
export const Label: React.FC<{text: string; start?: number; dark?: boolean}> = ({text, start = 6, dark}) => (
  <div
    style={{
      position: 'absolute',
      left: 64,
      bottom: 120,
      fontFamily: FONT.mono,
      fontSize: 26,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: dark ? COLOR.labelDark : COLOR.label,
    }}
  >
    <Scramble text={text} start={start} duration={12} />
  </div>
);

/** Uma frase no meio da tela, entrando embaralhada. */
export const Sentence: React.FC<{text: string; bg: 'black' | 'off' | 'none'; start?: number}> = ({text, bg, start = 0}) => (
  <AbsoluteFill
    style={{
      backgroundColor: bg === 'black' ? COLOR.black : bg === 'off' ? COLOR.offWhite : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <div style={{...SENTENCE, color: bg === 'off' ? COLOR.black : COLOR.offWhite}}>
      <Scramble text={text} start={start} />
    </div>
  </AbsoluteFill>
);

/** Palavras trocando no mesmo lugar: cada uma embaralha a anterior até virar a nova. */
export const WordSwap: React.FC<{words: string[]; every: number}> = ({words, every}) => {
  const frame = useCurrentFrame();
  const i = Math.min(words.length - 1, Math.floor(frame / every));
  const local = frame - i * every;
  const d = Math.max(8, Math.round(words[i].length * 0.9));
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{...SENTENCE, color: COLOR.offWhite}}>
        <span style={{whiteSpace: 'pre'}}>{scrambleText(words[i], local, 0, d)}</span>
      </div>
    </AbsoluteFill>
  );
};

/** O fecho: AGENDA ABERTA sorteando sem parar, travando no golpe; o @ entra depois. */
export const Agenda: React.FC<{lockAt: number; handleAt: number}> = ({lockAt, handleAt}) => {
  const frame = useCurrentFrame();
  const RESOLVE = 8; // trava letra a letra nos 8 frames antes do golpe
  const line = (t: string, seed: number) =>
    frame < lockAt - RESOLVE ? noiseText(t, frame, seed) : scrambleText(t, frame, lockAt - RESOLVE, RESOLVE);
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.black, justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 250,
          letterSpacing: '-0.06em',
          lineHeight: 0.83,
          color: COLOR.red,
          textAlign: 'center',
          whiteSpace: 'pre',
        }}
      >
        {line('AGENDA', 0)}
        {'\n'}
        {line('ABERTA', 1)}
      </div>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 270,
          fontFamily: FONT.display,
          fontSize: 46,
          letterSpacing: '-0.02em',
          color: COLOR.offWhite,
        }}
      >
        <Scramble text="@uga_do_litoral" start={handleAt} duration={14} />
      </div>
    </AbsoluteFill>
  );
};
