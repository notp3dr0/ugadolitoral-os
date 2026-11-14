import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { FONT, FONT_TEXT, PALETTE } from "../theme";
import { clamp, progress, type Vec3 } from "../utils/animation";
import { W_GLOBAL } from "../utils/words";
import { JG_HEAD, mosquitoPos, outerZ, PART, racketPose, racketToWorld, v3 } from "../world/rig";
import type { SceneModule, SceneProps } from "./types";

// Camadas 2D por cena: nome do João, balança, voltímetro, rótulos das peças e o bocejo da formiga.
// useCurrentFrame() aqui é LOCAL; somamos scene.startFrame para ler as trilhas globais.

/** Janela de presença 0→1→0 entre dois frames globais. */
const win = (frame: number, a: number, b: number, ramp = 8) => progress(frame, a, a + ramp) * (1 - progress(frame, b - ramp, b));

const Card: React.FC<{ enter: number; children: React.ReactNode; top?: number }> = ({ enter, children, top = 1060 }) => {
  if (enter <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        top,
        width: 300,
        padding: "18px 20px",
        borderRadius: 26,
        background: "rgba(10,10,14,0.88)",
        border: "3px solid rgba(255,255,255,0.85)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        opacity: clamp(enter * 1.6, 0, 1),
        scale: String(0.6 + 0.4 * clamp(enter, 0, 1.1)),
        transformOrigin: "0% 50%",
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- voltímetro (cenas 5–7)
const Voltmeter: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = track("voltmeter.enter", frame) * (1 - track("voltmeter.exit", frame));
  const value = track("voltmeter.value", frame);
  const broke = track("voltmeter.break", frame);
  const max = 12;
  const base = -62 + 124 * clamp(value / max, 0, 1);
  const pinned = value > max ? Math.sin(frame * 3.1) * 3 : 0;
  const angle = base + pinned + broke * 58;
  const readout = broke > 0.4 ? "ERRO" : value < 1000 ? `${Math.round(value)} V` : `${(Math.round(value / 100) / 10).toFixed(1).replace(".", ".")} mil V`;
  return (
    <Card enter={enter}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#ffffff", letterSpacing: 1 }}>VOLTÍMETRO</div>
      <svg width={260} height={150} viewBox="0 0 260 150">
        <path d="M30 130 A100 100 0 0 1 230 130" fill="none" stroke="#3a3a44" strokeWidth={14} strokeLinecap="round" />
        <path d="M190 52 A100 100 0 0 1 230 130" fill="none" stroke={PALETTE.negative} strokeWidth={14} strokeLinecap="round" />
        {[0, 3, 6, 9, 12].map((t) => {
          const a = ((-62 + (124 * t) / 12 - 90) * Math.PI) / 180;
          return (
            <text key={t} x={130 + Math.cos(a) * 78} y={130 + Math.sin(a) * 78 + 8} fill="#cfd3dc" fontSize={20} textAnchor="middle" fontFamily={FONT} fontWeight={700}>
              {t}
            </text>
          );
        })}
        <g transform={`rotate(${angle} 130 130)`}>
          <path d={broke > 0.4 ? "M130 130 L130 70 Q138 52 156 46" : "M130 130 L130 38"} stroke={broke > 0.4 ? PALETTE.warning : "#ffffff"} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
        <circle cx={130} cy={130} r={11} fill={PALETTE.racketAccent} />
      </svg>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: broke > 0.4 ? PALETTE.warning : "#7fe8ff", lineHeight: 1 }}>{readout}</div>
    </Card>
  );
};

// ---------------------------------------------------------------- balança (cena 4)
const Scale: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = track("scale.enter", frame);
  const v = track("scale.value", frame);
  return (
    <Card enter={enter} top={1000}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#ffffff", letterSpacing: 1 }}>PESO DO MOSQUITO</div>
      <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 12, background: "#0f2a1a", fontFamily: "monospace", fontWeight: 700, fontSize: 54, color: "#5dff8f", textAlign: "right" }}>
        {(0.002 * v).toFixed(3).replace(".", ",")} g
      </div>
      <div style={{ marginTop: 8, fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 22, color: "#cfd3dc" }}>quase nada, literalmente</div>
    </Card>
  );
};

// ---------------------------------------------------------------- rótulos das peças
type LabelSpec = { text: string; local: Vec3; from: number; to: number; offset: [number, number]; accent?: string };

const PartLabels: React.FC<{ frame: number; specs: LabelSpec[] }> = ({ frame, specs }) => {
  const pose = racketPose(frame);
  const cam = cameraPoseAt(frame);
  return (
    <>
      {specs.map((l) => (
        <WorldLabel key={l.text} pose={cam} point={racketToWorld(pose, l.local)} text={l.text} appear={win(frame, l.from, l.to)} offset={l.offset} accent={l.accent} size={34} />
      ))}
    </>
  );
};

const Bubble: React.FC<{ frame: number; point: Vec3; text: string; appear: number }> = ({ frame, point, text, appear }) => {
  const { fps } = useVideoConfig();
  if (appear <= 0.01) return null;
  const pop = spring({ frame: Math.round(appear * 20), fps, config: { damping: 9 } });
  return <WorldLabel pose={cameraPoseAt(frame)} point={point} text={text} appear={clamp(pop, 0, 1)} offset={[170, -120]} accent={PALETTE.warning} size={32} />;
};

// ---------------------------------------------------------------- cenas
const S1: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const a = win(frame, W_GLOBAL("s1", 7), W_GLOBAL("s1", 14) + 6);
  return <WorldLabel pose={cameraPoseAt(frame)} point={v3.add(JG_HEAD, [0.05, 0.38, 0])} text="JOÃO GABRIEL" appear={a} offset={[160, -150]} accent="#ffb36b" size={38} />;
};

const S2: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const rew = win(frame, W_GLOBAL("s2", 6), W_GLOBAL("s2", 9) + 4, 4);
  if (rew <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: 92, top: 560, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: "#ffffff", opacity: rew, WebkitTextStroke: "10px #070709", paintOrder: "stroke fill" }}>◀◀ REPLAY</div>
  );
};

const S4: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const a = win(frame, W_GLOBAL("s4", 16), W_GLOBAL("s4", 17) + 14, 5);
  return (
    <>
      <Scale frame={frame} />
      <Bubble frame={frame} point={v3.add(mosquitoPos(frame), [0.05, 0.1, 0])} text="AFF." appear={a} />
    </>
  );
};

const S5: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const yawn = win(frame, W_GLOBAL("s5", 10), W_GLOBAL("s5", 13) + 4, 5);
  return (
    <>
      <Voltmeter frame={frame} />
      <PartLabels frame={frame} specs={[{ text: "PILHAS\n1,5 V + 1,5 V", local: [0.07, PART.battery[1], 0.06], from: W_GLOBAL("s5", 4), to: scene.startFrame + scene.durationInFrames, offset: [230, 40] }]} />
      <Bubble frame={frame} point={[0.32, 0.56, 0.16]} text="*bocejo*" appear={yawn} />
    </>
  );
};

const S6: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const end = scene.startFrame + scene.durationInFrames;
  return (
    <>
      <Voltmeter frame={frame} />
      <PartLabels
        frame={frame}
        specs={[
          { text: "TRANSFORMADOR", local: PART.transformer, from: W_GLOBAL("s6", 1), to: end, offset: [250, -150] },
          { text: "OSCILADOR", local: PART.osc, from: W_GLOBAL("s6", 12), to: end, offset: [240, 110], accent: PALETTE.positive },
        ]}
      />
    </>
  );
};

const S7: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const end = scene.startFrame + scene.durationInFrames;
  return (
    <>
      <Voltmeter frame={frame} />
      <PartLabels
        frame={frame}
        specs={[
          { text: "DIODOS +\nCAPACITORES", local: [0.05, -0.37, 0.04], from: W_GLOBAL("s7", 7), to: W_GLOBAL("s7", 13), offset: [250, 30], accent: PALETTE.positive },
          { text: "CAPACITOR", local: PART.capacitor, from: W_GLOBAL("s7", 14), to: end, offset: [240, -40] },
          { text: "LED", local: PART.led, from: W_GLOBAL("s7", 18), to: end, offset: [200, -150], accent: "#3dff7a" },
        ]}
      />
    </>
  );
};

const S8: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const end = scene.startFrame + scene.durationInFrames;
  const z = outerZ(frame);
  return (
    <PartLabels
      frame={frame}
      specs={[
        { text: "POLO A", local: [0.0, 1.38, z], from: W_GLOBAL("s8", 10), to: end, offset: [-160, -130], accent: PALETTE.poleA },
        { text: "POLO B", local: [0.0, 1.45, 0], from: W_GLOBAL("s8", 15), to: end, offset: [170, -150], accent: PALETTE.poleB },
        { text: "POLO A", local: [0.0, 1.38, -z], from: W_GLOBAL("s8", 10) + 6, to: end, offset: [190, 120], accent: PALETTE.poleA },
        { text: "AR", local: [0.0, 0.5, z / 2], from: W_GLOBAL("s8", 20), to: end, offset: [-190, 120], accent: "#bfe9ff" },
      ]}
    />
  );
};

export const SCENE_OVERLAYS: Record<string, SceneModule> = {
  "scene-01-gancho": { Overlay: S1 },
  "scene-02-tapa-erra": { Overlay: S2 },
  "scene-04-leve-demais": { Overlay: S4 },
  "scene-05-pilhas": { Overlay: S5 },
  "scene-06-oscilador": { Overlay: S6 },
  "scene-07-transformador-capacitor": { Overlay: S7 },
  "scene-08-tres-redes": { Overlay: S8 },
};
