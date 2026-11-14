import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';

// Vazamento de luz vermelho: luz de palco gerada em código atravessando a tela e escondendo o corte.
// Entra 6 frames antes do corte, pico no corte, some 12 frames depois.
export const LEAK_IN = 6;
export const LEAK_OUT = 12;

export const LightLeak: React.FC<{cut: number; from?: 'left' | 'right'}> = ({cut, from = 'left'}) => {
  const frame = useCurrentFrame();
  const t = frame - cut;
  if (t < -LEAK_IN || t > LEAK_OUT) return null;
  const k = interpolate(t, [-LEAK_IN, 0, LEAK_OUT], [0, 1, 0], {
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const dir = from === 'left' ? 1 : -1;
  const x = interpolate(t, [-LEAK_IN, LEAK_OUT], [-10, 95]) * dir + (dir < 0 ? 100 : 0);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* sem camada branca: luz colorida passando (núcleo quente, borda vermelha), não clarão.
          Mistura normal: aparece até sobre foto vermelha e sobre o off-white. */}
      <AbsoluteFill
        style={{
          opacity: 0.92 * k,
          background: `radial-gradient(ellipse 62% 40% at ${x}% 42%, rgba(255,200,110,1) 0%, rgba(255,110,30,0.92) 22%, rgba(250,23,23,0.8) 50%, rgba(250,23,23,0) 100%),
            radial-gradient(ellipse 50% 70% at ${x + 18 * dir}% 70%, rgba(255,90,20,0.8) 0%, rgba(250,23,23,0.6) 45%, rgba(250,23,23,0) 100%),
            radial-gradient(ellipse 34% 90% at ${x - 16 * dir}% 50%, rgba(250,23,23,0.65) 0%, rgba(250,23,23,0) 100%)`,
          filter: 'blur(24px)',
        }}
      />
    </AbsoluteFill>
  );
};
