import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { impulse, track } from "../data/scenes";
import { SKY } from "../theme";
import { clamp } from "../utils/animation";

// Fundo atrás do diorama: noite azul no quarto (bg.mode 0), carvão da marca dentro da raquete (1).
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = clamp(track("bg.mode", frame), 0, 1);
  const c = SKY.night.map((top, i) => interpolateColors(t, [0, 1], [top, SKY.inside[i]]));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 52%, ${c[2]} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 48%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Flash branco-avermelhado do estalo e granulado de filme por cima de tudo. */
export const FlashAndGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = impulse("bg.flash", frame);
  return (
    <>
      {flash > 0.01 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,${0.95 * flash}) 0%, rgba(255,80,60,${0.55 * flash}) 60%, rgba(255,40,40,${0.3 * flash}) 100%)` }} /> : null}
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 24} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};
