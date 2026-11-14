import React from "react";
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from "remotion";
import {Audio} from "@remotion/media";
import {C, PLANOS, ramp} from "./theme";
import {P1, P2, P3, P4, P5, P6, P7, P8} from "./planos";
import {Defs} from "./defs";

// Grão de papel que "ferve" a cada dois frames: textura de impressão em cima do chapado.
const Grao: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 12;
  return (
    <AbsoluteFill style={{mixBlendMode: "multiply", opacity: 0.22, pointerEvents: "none"}}>
      <svg width="100%" height="100%">
        <filter id={`grao-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grao-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Vinheta: fecha as bordas nas cenas; some na tela final para o off-white ficar limpo.
const Vinheta: React.FC = () => {
  const frame = useCurrentFrame();
  const forca = 1 - ramp(frame, PLANOS.p8.from, PLANOS.p8.from + 14);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: forca,
        background: "radial-gradient(ellipse 75% 60% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
      }}
    />
  );
};

export const Filme: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: C.black}}>
      {/* gradientes numa definição só, sempre montada: os planos pré-carregados ficam ocultos
          e um gradiente dentro de um svg oculto não pinta */}
      <svg width={0} height={0} style={{position: "absolute"}} aria-hidden>
        <Defs />
      </svg>
      <Sequence name="P1 · geral, o símbolo é o lugar" from={PLANOS.p1.from} durationInFrames={PLANOS.p1.dur}>
        <P1 />
      </Sequence>
      <Sequence name="P2 · peito, avanço" from={PLANOS.p2.from} durationInFrames={PLANOS.p2.dur}>
        <P2 />
      </Sequence>
      <Sequence name="P3 · close no sol" from={PLANOS.p3.from} durationInFrames={PLANOS.p3.dur}>
        <P3 />
      </Sequence>
      <Sequence name="P4 · totalidade" from={PLANOS.p4.from} durationInFrames={PLANOS.p4.dur}>
        <P4 />
      </Sequence>
      <Sequence name="P5 · contas de Baily, G1" from={PLANOS.p5.from} durationInFrames={PLANOS.p5.dur}>
        <P5 />
      </Sequence>
      <Sequence name="P6 · peito, giro e balanço" from={PLANOS.p6.from} durationInFrames={PLANOS.p6.dur}>
        <P6 />
      </Sequence>
      {/* o P7 segue por baixo enquanto o crescente da tela final abre */}
      <Sequence name="P7 · punho, a G1 desliza" from={PLANOS.p7.from} durationInFrames={PLANOS.p7.dur + 14}>
        <P7 />
      </Sequence>
      <Sequence name="P8 · tela final" from={PLANOS.p8.from} durationInFrames={PLANOS.p8.dur}>
        <P8 />
      </Sequence>
      <Vinheta />
      <Grao />
      <Audio src={staticFile("audio/trilha.wav")} />
    </AbsoluteFill>
  );
};
