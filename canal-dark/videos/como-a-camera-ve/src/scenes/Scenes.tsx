import { interpolate, useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { LENS_X, SENSOR_X } from "../components/optics";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { FONT, PALETTE } from "../theme";
import { clamp, progress } from "../utils/animation";
import { wordLocal } from "../utils/timing";
import type { SceneModule, SceneProps } from "./types";

// Camadas 2D por cena. useCurrentFrame() é LOCAL; some scene.startFrame para ler trilhas.

const LenteOverlay: React.FC<SceneProps> = ({ scene }) => {
  const local = useCurrentFrame();
  const frame = local + scene.startFrame;
  const pose = cameraPoseAt(frame);
  const a = track("labels.lens", frame);
  const b = progress(local, wordLocal("s3", 15), wordLocal("s3", 15) + 10);
  const out = 1 - progress(local, scene.durationInFrames - 10, scene.durationInFrames - 2);
  return (
    <>
      <WorldLabel pose={pose} point={[LENS_X, 0.5, -0.3]} text="LENTE" appear={a * out} offset={[150, -230]} accent={PALETTE.positive} size={40} />
      <WorldLabel pose={pose} point={[SENSOR_X, 0.3, -0.3]} text={"SENSOR\nimagem invertida"} appear={b * out} offset={[60, -200]} accent={PALETTE.warning} size={34} />
    </>
  );
};

const DiafragmaOverlay: React.FC<SceneProps> = ({ scene }) => {
  const local = useCurrentFrame();
  const frame = local + scene.startFrame;
  const a = progress(local, wordLocal("s4", 13), wordLocal("s4", 13) + 10) * (1 - progress(local, wordLocal("s4", 17) + 20, wordLocal("s4", 17) + 30));
  return <WorldLabel pose={cameraPoseAt(frame)} point={[-1.52, 0.42, 0]} text="LÂMINAS" appear={a} offset={[170, -200]} accent={PALETTE.positive} size={40} />;
};

const ObturadorOverlay: React.FC<SceneProps> = ({ scene }) => {
  const local = useCurrentFrame();
  const frame = local + scene.startFrame;
  const a = track("labels.speed", frame) * (1 - progress(local, wordLocal("s6", 15) - 4, wordLocal("s6", 15) + 4));
  return <WorldLabel pose={cameraPoseAt(frame)} point={[SENSOR_X - 0.13, 0.45, -0.3]} text={"1/1000 s\n(exemplo)"} appear={a} offset={[-60, -220]} accent={PALETTE.positive} size={38} />;
};

const Vertex: React.FC<{ x: number; y: number; k: number; label: string; color: string }> = ({ x, y, k, label, color }) => {
  if (k < 0.001) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", scale: String(interpolate(k, [0, 1], [0.4, 1])), opacity: clamp(k * 1.8, 0, 1) }}>
      <div style={{ padding: "12px 26px", borderRadius: 40, background: "rgba(7,7,7,0.86)", border: `4px solid ${color}`, fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#f2f0eb", letterSpacing: 1, whiteSpace: "nowrap" }}>
        {label}
      </div>
    </div>
  );
};

const TrianguloOverlay: React.FC<SceneProps> = ({ scene }) => {
  const local = useCurrentFrame();
  const frame = local + scene.startFrame;
  const out = 1 - progress(local, wordLocal("s8", 20) - 8, wordLocal("s8", 20));
  if (out <= 0.001) return null;
  const A = clamp(track("triangle.vertexA", frame), 0, 1.1);
  const B = clamp(track("triangle.vertexB", frame), 0, 1.1);
  const C = clamp(track("triangle.vertexC", frame), 0, 1.1);
  const e = clamp(track("triangle.edges", frame), 0, 1);
  const pts = { a: [540, 520], b: [250, 960], c: [830, 960] };
  const per = 3 * 520;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 32% at 50% 42%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <polygon
          points={`${pts.a.join(",")} ${pts.c.join(",")} ${pts.b.join(",")}`}
          fill="rgba(229,55,43,0.08)"
          stroke="#f2f0eb"
          strokeWidth={6}
          strokeLinejoin="round"
          strokeDasharray={per}
          strokeDashoffset={per * (1 - e)}
        />
      </svg>
      <Vertex x={pts.a[0]} y={pts.a[1]} k={A} label="ABERTURA" color={PALETTE.info} />
      <Vertex x={pts.b[0]} y={pts.b[1]} k={B} label="OBTURADOR" color={PALETTE.positive} />
      <Vertex x={pts.c[0]} y={pts.c[1]} k={C} label="ISO" color={PALETTE.warning} />
    </div>
  );
};

export const MODULES: Record<string, SceneModule> = {
  "scene-03-lente": { Overlay: LenteOverlay },
  "scene-04-diafragma": { Overlay: DiafragmaOverlay },
  "scene-06-obturador": { Overlay: ObturadorOverlay },
  "scene-08-triangulo": { Overlay: TrianguloOverlay },
};
