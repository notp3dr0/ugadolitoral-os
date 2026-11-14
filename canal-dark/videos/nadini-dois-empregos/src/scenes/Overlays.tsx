import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { FONT, FONT_TEXT, PALETTE } from "../theme";
import { clamp, progress, type Vec3 } from "../utils/animation";
import { W_GLOBAL } from "../utils/words";
import { alinePose, bakerPose, CLOCK, customer2Pose, customerPose, mannequinPose, nadiniPose, v3 } from "../world/rig";
import type { SceneModule, SceneProps } from "./types";

// Camadas 2D por cena: nomes, balões de fala, legendas do relógio, cronômetro da catapulta,
// carimbos de DEMITIDA e o efeito de fita rebobinando. useCurrentFrame() aqui é LOCAL.

/** Janela de presença 0→1→0 entre dois frames globais. */
const win = (frame: number, a: number, b: number, ramp = 6) => progress(frame, a, a + ramp) * (1 - progress(frame, b - ramp, b));

const Bubble: React.FC<{ frame: number; point: Vec3; text: string; appear: number; offset?: [number, number]; accent?: string; size?: number }> = ({ frame, point, text, appear, offset = [150, -150], accent = PALETTE.warning, size = 34 }) => {
  const { fps } = useVideoConfig();
  if (appear <= 0.01) return null;
  const pop = spring({ frame: Math.round(appear * 18), fps, config: { damping: 9 } });
  return <WorldLabel pose={cameraPoseAt(frame)} point={point} text={text} appear={clamp(pop, 0, 1) * clamp(appear * 1.4, 0, 1)} offset={offset} accent={accent} size={size} />;
};

const head = (p: { position: Vec3 } | null, dy = 1.32): Vec3 => (p ? v3.add(p.position, [0, dy, 0]) : [0, -50, 0]);

// ---------------------------------------------------------------- cenas
const S1: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const a = win(frame, W_GLOBAL("s1", 1), scene.startFrame + scene.durationInFrames - 2);
  return <Bubble frame={frame} point={head(nadiniPose(frame), 1.36)} text="NADINI" appear={a} offset={[-190, -150]} accent="#ffb36b" size={38} />;
};

const S2: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const endF = scene.startFrame + scene.durationInFrames;
  const at = (h: number, r: number): Vec3 => {
    const a = Math.PI / 2 - ((h % 12) / 12) * Math.PI * 2;
    return [CLOCK.face[0] + Math.cos(a) * r, CLOCK.face[1] + Math.sin(a) * r, CLOCK.face[2] + 0.02];
  };
  const pose = cameraPoseAt(frame);
  return (
    <>
      <WorldLabel pose={pose} point={at(11.5, 0.3)} text={"LOJA\n8h–15h"} appear={win(frame, W_GLOBAL("s2", 2), endF)} offset={[-250, -40]} accent={PALETTE.arcLoja} size={36} />
      <WorldLabel pose={pose} point={at(17, 0.3)} text={"PADARIA\n14h–20h"} appear={win(frame, W_GLOBAL("s2", 7), endF)} offset={[250, 60]} accent={PALETTE.arcPadaria} size={36} />
    </>
  );
};

const S3: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const a = win(frame, W_GLOBAL("s3", 7), W_GLOBAL("s3", 13) + 2);
  return <Bubble frame={frame} point={head(alinePose(frame), 1.34)} text={"ALINE\nchefe"} appear={a} offset={[-150, -170]} accent="#ff8fa3" size={34} />;
};

const S4: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const a = win(frame, W_GLOBAL("s4", 9) + 4, scene.startFrame + scene.durationInFrames + 2);
  return <Bubble frame={frame} point={head(mannequinPose(frame), 1.3)} text={"um momentinho…"} appear={a} offset={[170, -170]} accent="#ffffff" size={34} />;
};

const S5: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const ask = win(frame, W_GLOBAL("s5", 4), W_GLOBAL("s5", 10) + 2);
  const after = win(frame, W_GLOBAL("s5", 11) + 4, scene.startFrame + scene.durationInFrames);
  const c = customerPose(frame);
  return (
    <>
      <Bubble frame={frame} point={head(c, 1.32)} text={"10% de\ndesconto?"} appear={ask} offset={[150, -190]} />
      <Bubble frame={frame} point={head(c, 1.32)} text="…" appear={after} offset={[140, -160]} accent="#ffffff" />
    </>
  );
};

const Timer: React.FC<{ frame: number }> = ({ frame }) => {
  const t = track("timer.progress", frame);
  const enter = clamp(t * 8, 0, 1) * (1 - clamp((frame - (W_GLOBAL("s6", 7) + 90)) / 8, 0, 1));
  if (enter <= 0.01) return null;
  const secs = (2 * clamp(t, 0, 1)).toFixed(2).replace(".", ",");
  return (
    <div style={{ position: "absolute", left: 92, top: 1080, padding: "14px 22px", borderRadius: 22, background: "rgba(10,10,14,0.88)", border: "3px solid rgba(255,255,255,0.85)", opacity: enter, scale: String(0.7 + 0.3 * enter), transformOrigin: "0% 50%" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#cfd3dc", letterSpacing: 1 }}>TEMPO DE VOO</div>
      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 60, color: PALETTE.warning, lineHeight: 1.05 }}>{secs} s</div>
    </div>
  );
};

const S6: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  return <Timer frame={frame} />;
};

const S7: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const order = win(frame, W_GLOBAL("s7", 9), W_GLOBAL("s7", 13) + 2);
  const huh = win(frame, W_GLOBAL("s7", 14) + 4, scene.startFrame + scene.durationInFrames + 2);
  const c = customer2Pose(frame);
  return (
    <>
      <Bubble frame={frame} point={head(c, 1.32)} text={"1 pão\nfrancês"} appear={order} offset={[160, -180]} />
      <Bubble frame={frame} point={head(c, 1.32)} text="??" appear={huh} offset={[150, -170]} accent={PALETTE.negative} size={42} />
    </>
  );
};

/** Carimbo grande de DEMITIDA, batendo na tela. */
const Stamp: React.FC<{ value: number; top: number; left: number; rot: number; from: string }> = ({ value, top, left, rot, from }) => {
  if (value <= 0.01) return null;
  const s = value < 1 ? 2.2 - 1.2 * clamp(value, 0, 1) : 1 + 0.04 * Math.sin(value * 9);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        rotate: `${rot}deg`,
        scale: String(clamp(s, 0.8, 2.4)),
        opacity: clamp(value * 2, 0, 1),
        padding: "10px 26px 6px",
        border: `9px solid ${PALETTE.negative}`,
        borderRadius: 16,
        color: PALETTE.negative,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 92,
        lineHeight: 0.95,
        textAlign: "center",
        background: "rgba(255,245,240,0.12)",
        boxShadow: "0 0 0 3px rgba(0,0,0,0.25)",
        mixBlendMode: "normal",
      }}
    >
      DEMITIDA
      <div style={{ fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 28, letterSpacing: 2 }}>{from}</div>
    </div>
  );
};

const S8: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const f1 = track("fired1", frame);
  const f2 = track("fired2", frame);
  const look = win(frame, W_GLOBAL("s8", 6), W_GLOBAL("s8", 10) + 4);
  const a = alinePose(frame);
  const b = bakerPose(frame);
  return (
    <>
      <Bubble frame={frame} point={head(a, 1.34)} text="ALINE" appear={look} offset={[-120, -170]} accent="#ff8fa3" size={32} />
      <Bubble frame={frame} point={head(b, 1.5)} text="PADEIRO" appear={look} offset={[-170, -190]} accent={PALETTE.arcPadaria} size={32} />
      <Stamp value={f1} top={560} left={150} rot={-12} from="LOJA DE CELULAR" />
      <Stamp value={f2} top={860} left={330} rot={9} from="PADARIA" />
    </>
  );
};

/** Fita rebobinando: tinta roxa, linhas de varredura e "◀◀". */
const S9: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const m = clamp(track("bg.mode", frame), 0, 1);
  if (m <= 0.01) return null;
  const roll = (frame * 37) % 1920;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "rgba(90,40,200,0.16)", opacity: m, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ opacity: 0.22 * m, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 2px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 7px)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: roll, height: 46, background: "rgba(255,255,255,0.10)", opacity: m, filter: "blur(2px)" }} />
      <div style={{ position: "absolute", right: 92, top: 520, fontFamily: FONT, fontWeight: 900, fontSize: 96, color: "#ffffff", opacity: m * (0.6 + 0.4 * Math.round((Math.sin(frame * 0.5) + 1) / 2)), WebkitTextStroke: "10px #070709", paintOrder: "stroke fill" }}>◀◀</div>
    </AbsoluteFill>
  );
};

export const SCENE_OVERLAYS: Record<string, SceneModule> = {
  "scene-01-gancho": { Overlay: S1 },
  "scene-02-hora-fantasma": { Overlay: S2 },
  "scene-03-plano-fininho": { Overlay: S3 },
  "scene-04-plano-manequim": { Overlay: S4 },
  "scene-05-cliente-desconto": { Overlay: S5 },
  "scene-06-plano-catapulta": { Overlay: S6 },
  "scene-07-pedido-errado": { Overlay: S7 },
  "scene-08-demitida-duas-vezes": { Overlay: S8 },
  "scene-09-rebobina-loop": { Overlay: S9 },
};
