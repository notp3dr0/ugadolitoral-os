import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cenas } from "./Cenas";
import { FPS, VOZ, LEGENDA, SFX, PLANOS } from "./beats";

const AMBER = "#ffb020";

// legenda palavra por palavra: a palavra entra quando é dita; nome e número em amarelo
const Legenda = () => {
  const t = useCurrentFrame() / FPS;
  const b = LEGENDA.find((x) => t >= x.de && t < x.ate);
  if (!b) return null;
  const pop = interpolate(t - b.de, [0, 0.08], [0.82, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 1230, display: "flex", gap: 26, transform: `scale(${pop})` }}>
        {b.palavras.map((p, i) => (
          <span key={i} style={{
            fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 112, lineHeight: 1,
            color: b.destaque.includes(p.t) ? AMBER : "#fff", opacity: t >= p.s - 0.03 ? 1 : 0,
            WebkitTextStroke: "14px #0f1020", paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(0,0,0,.4)",
          }}>{p.t}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// punch de zoom de 6 quadros em cada corte: dá peso ao corte seco
const Punch = ({ children }: { children: React.ReactNode }) => {
  const t = useCurrentFrame() / FPS;
  const ultimo = [...PLANOS].reverse().find((p) => t >= p.de)!;
  const s = interpolate(t - ultimo.de, [0, 6 / FPS], [1.07, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

export const Prova = () => (
  <AbsoluteFill style={{ background: "#0f1020" }}>
    <Punch>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1, 6] }} shadows>
        <Cenas />
      </ThreeCanvas>
    </Punch>
    <Legenda />
    {Object.entries(VOZ).map(([k, s]) => (
      <Sequence key={k} from={Math.round(s * FPS)}><Audio src={staticFile(`voz2/${k}.wav`)} /></Sequence>
    ))}
    {SFX.map(([nome, s, vol], i) => (
      <Sequence key={i} from={Math.max(0, Math.round(s * FPS))}><Audio src={staticFile(`sfx/${nome}.wav`)} volume={vol} /></Sequence>
    ))}
  </AbsoluteFill>
);
