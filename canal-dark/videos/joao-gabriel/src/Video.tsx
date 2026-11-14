import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Scene } from "./Scene";
import { SCENES, sceneAt } from "./timeline";

const INK = "#0f1020", AMBER = "#ffb020";

// Rótulo: até 2 linhas de até 3 palavras, sempre numa tira (suporte), dentro da zona segura (y 260–1420).
const Legenda = () => {
  const f = useCurrentFrame();
  const { legenda, local, id } = sceneAt(f);
  const atraso = id === "hook" ? 45 : 8;
  const entra = interpolate(local, [atraso, atraso + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const topo = id === "senna" || id === "lanterna" ? 300 : 1290;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: topo, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {legenda.map((l, i) => {
          const ultima = i === legenda.length - 1;
          const e = interpolate(local, [atraso + i * 6, atraso + 10 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 84, lineHeight: 1.05,
              color: ultima ? INK : "#fff", background: ultima ? AMBER : INK,
              padding: "6px 26px", margin: 6, opacity: Math.min(entra, e),
              transform: `translateY(${(1 - e) * 40}px) rotate(${i % 2 ? 1.5 : -1.5}deg) scale(${0.9 + e * 0.1})`,
              boxShadow: "0 10px 0 rgba(0,0,0,.35)",
            }}>{l}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Video = () => (
  <AbsoluteFill style={{ background: INK }}>
    <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.6, 6] }} shadows>
      <Scene />
    </ThreeCanvas>
    <Legenda />
    {SCENES.map((s) => (
      <Sequence key={s.id} from={s.vozFrom}>
        <Audio src={staticFile(s.voz)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
