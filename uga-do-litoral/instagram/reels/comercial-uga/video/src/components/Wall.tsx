import React from 'react';
import {AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, SPRING_CAMERA} from '../lib/brand';

// Parede gigante com as 80 fotos do acervo. Começa com uma foto enchendo a tela; a câmera recua
// numa mola até a parede ficar maior que a tela, e segue recuando devagar até o corte.
const COLS = 12;
const ROWS = 10; // maior que o acervo (repete fotos) pra borda nunca entrar na tela
const CW = 360;
const CH = 480;
const GAP = 14;
const CENTER = 4 * COLS + 5; // célula que começa enchendo a tela
const HERO = 1; // ALEE no vermelho (acervo nº 1) vai pra célula do centro

export const Wall: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const order = Array.from({length: COLS * ROWS}, (_, i) => i);
  [order[CENTER], order[HERO]] = [order[HERO], order[CENTER]];

  const s0 = height / CH; // a célula enche a altura da tela
  const s1 = 0.5; // a 0,5 a tela mostra ~5,8 colunas por ~7,8 linhas: parede bem maior que a tela
  const k = spring({frame, fps, config: {...SPRING_CAMERA, stiffness: 90}});
  const drift = 1 - 0.06 * (frame / Math.max(1, duration)); // continua recuando
  const scale = s0 * Math.pow(s1 / s0, k) * drift;

  const cx = (CENTER % COLS) * (CW + GAP) + CW / 2;
  const cy = Math.floor(CENTER / COLS) * (CH + GAP) + CH / 2;
  const slide = 60 * k; // a parede escorrega um pouco pro lado enquanto abre

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.black, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: width / 2,
          top: height / 2,
          width: COLS * (CW + GAP),
          height: ROWS * (CH + GAP),
          transformOrigin: '0 0',
          transform: `scale(${scale}) translate(${-cx - slide}px, ${-cy}px)`,
        }}
      >
        {order.map((src, cell) => (
          <Img
            key={cell}
            src={staticFile(`acervo/${String(src % 80).padStart(2, '0')}.jpg`)}
            style={{
              position: 'absolute',
              left: (cell % COLS) * (CW + GAP),
              top: Math.floor(cell / COLS) * (CH + GAP),
              width: CW,
              height: CH,
              objectFit: 'cover',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
