import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { impulse, track } from "../data/scenes";
import { SKY } from "../theme";
import { clamp } from "../utils/animation";
import { DURATION, HEIGHT, WIDTH } from "../utils/timing";

// Fundo atrás da maquete: céu azul de dia com nuvens (bg.mode 0) e roxo de fita rebobinando (1).

/** Nuvens: x, y e largura em px. Cada uma anda voltas inteiras por vídeo, então o loop emenda. */
const CLOUDS = [
  { x: 120, y: 520, w: 360, laps: 1 },
  { x: 700, y: 330, w: 280, laps: 1 },
  { x: 420, y: 860, w: 420, laps: 2 },
  { x: 880, y: 1130, w: 300, laps: 1 },
  { x: 40, y: 1500, w: 380, laps: 2 },
] as const;

const Cloud: React.FC<{ w: number; opacity: number }> = ({ w, opacity }) => (
  <div style={{ position: "relative", width: w, height: w * 0.42, opacity }}>
    {[
      [0.0, 0.3, 0.55],
      [0.22, 0.0, 0.5],
      [0.5, 0.12, 0.5],
      [0.34, 0.34, 0.66],
    ].map(([x, y, s], i) => (
      <div key={i} style={{ position: "absolute", left: x * w, top: y * w, width: s * w * 0.62, height: s * w * 0.62, borderRadius: "50%", background: "#ffffff" }} />
    ))}
  </div>
);

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = clamp(track("bg.mode", frame), 0, 1);
  const c = SKY.day.map((top, i) => interpolateColors(t, [0, 1], [top, SKY.rewind[i]]));
  const wrap = WIDTH + 700;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 55%, ${c[2]} 100%)` }} />
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {CLOUDS.map((cl, i) => {
          const x = ((cl.x + 350 + (frame / DURATION) * wrap * cl.laps) % wrap) - 350;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: Math.min(cl.y, HEIGHT - 200) }}>
              <Cloud w={cl.w} opacity={0.88 - 0.55 * t} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 55%, rgba(0,20,60,0.22) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Flash (se houver) e granulado de filme por cima de tudo. */
export const FlashAndGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = impulse("bg.flash", frame);
  return (
    <>
      {flash > 0.01 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,${0.95 * flash}) 0%, rgba(255,80,60,${0.55 * flash}) 60%, rgba(255,40,40,${0.3 * flash}) 100%)` }} /> : null}
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "overlay" }}>
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
