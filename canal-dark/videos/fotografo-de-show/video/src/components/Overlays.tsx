import { AbsoluteFill, useCurrentFrame } from "remotion";
import { sceneIndexAt, track } from "../data/scenes";
import { HEAD_TOP } from "../layout";
import { FONT, PALETTE } from "../theme";
import { clamp } from "../utils/animation";
import { heroAt } from "../world/hero";
import { cameraPoseAt, projectPoint } from "./CameraController";
import { WorldLabel } from "./WorldLabel";

// Camadas 2D por cima da cidade: a etiqueta fixa FOTOGRAFIA: R$ 0,00, o flash, o rebobinar do gancho,
// o chat do amigo e os rótulos da maquete no fim.

/** A piada que atravessa o vídeo: a etiqueta em cima da cabeça do Você nunca muda. */
const PhotoLabel: React.FC<{ frame: number }> = ({ frame }) => {
  const k = clamp(track("photoLabel.opacity", frame), 0, 1.2);
  const fade = track("fade", frame);
  if (k <= 0.01 || fade > 0.5) return null;
  const h = heroAt(frame);
  const pose = cameraPoseAt(frame);
  const p = projectPoint(pose, [h.x, h.y + HEAD_TOP + (h.outfit === 1 ? 0.18 : 0), h.z]);
  if (!p.visible || p.x < -200 || p.x > 1280) return null;
  const dist = Math.hypot(pose.position[0] - h.x, pose.position[1] - 1, pose.position[2] - h.z);
  const size = clamp(16 / dist, 0.5, 1.1);
  let x = p.x;
  let y = p.y - 30 * size;
  if (y < 560) {
    // close: o topo da cabeça está alto demais; a etiqueta vai pro lado do rosto
    const face = projectPoint(pose, [h.x, h.y + 0.95, h.z]);
    const side = face.x > 540 ? -1 : 1;
    x = face.x + side * 330 * size;
    y = clamp(face.y, 600, 1200);
  }
  y = clamp(y, 560, 1300);
  return (
    <div style={{ position: "absolute", left: clamp(x, 90 + 190 * size, 990 - 190 * size), top: y, translate: "-50% -100%", scale: String(size * Math.min(1, k)), opacity: clamp(k * 1.4, 0, 1) * (1 - fade * 2), transformOrigin: "50% 100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", borderRadius: 16, background: PALETTE.negative, border: "4px solid #ffffff", boxShadow: "0 10px 24px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#ffe3e3", letterSpacing: 1 }}>FOTOGRAFIA:</span>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color: "#ffffff" }}>R$ 0,00</span>
      </div>
      <div style={{ width: 0, height: 0, margin: "0 auto", borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderTop: "16px solid #ffffff" }} />
    </div>
  );
};

const Flash: React.FC<{ frame: number }> = ({ frame }) => {
  const f = clamp(track("flash.burst", frame), 0, 1);
  if (f < 0.02) return null;
  return <AbsoluteFill style={{ background: "#ffffff", opacity: f * 0.42, mixBlendMode: "screen" }} />;
};

const Rewind: React.FC<{ frame: number }> = ({ frame }) => {
  const r = clamp(track("rewind.amount", frame), 0, 1);
  if (r < 0.02) return null;
  const bars = Array.from({ length: 7 }, (_, i) => {
    const y = ((frame * (37 + i * 11) + i * 300) % 2100) - 90;
    return <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y, height: 14 + (i % 3) * 18, background: "rgba(255,255,255,0.22)", mixBlendMode: "screen" }} />;
  });
  return (
    <AbsoluteFill style={{ opacity: r }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 3px, transparent 3px, transparent 7px)" }} />
      <AbsoluteFill style={{ background: "rgba(40,70,160,0.16)", mixBlendMode: "multiply" }} />
      {bars}
      <div style={{ position: "absolute", left: 90, top: 1190, fontFamily: FONT, fontWeight: 900, fontSize: 92, color: "#ffffff", textShadow: "4px 0 0 rgba(255,0,60,0.7), -4px 0 0 rgba(0,200,255,0.7)", opacity: Math.floor(frame / 6) % 2 ? 1 : 0.7 }}>
        ◀◀ VOLTANDO
      </div>
    </AbsoluteFill>
  );
};

const Chat: React.FC<{ frame: number }> = ({ frame }) => {
  if (sceneIndexAt(frame) !== 10) return null;
  const k = clamp(track("chat.friend", frame), 0, 1.2);
  if (k <= 0.01) return null;
  const out = clamp(1 - track("phone.show", frame), 0, 1);
  return (
    <div style={{ position: "absolute", left: 560, top: 600, translate: "-50% -100%", scale: String(Math.min(k, 1.15)), opacity: 1 - out, transformOrigin: "30% 100%" }}>
      <div style={{ background: "#ffffff", borderRadius: 28, padding: "18px 28px", boxShadow: "0 12px 28px rgba(0,0,0,0.35)", border: "3px solid #1fb257" }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, color: "#1fb257" }}>amigo</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: "#111", whiteSpace: "nowrap" }}>e aí, já tá rico? kkkk</div>
      </div>
    </div>
  );
};

const LABELS: { text: string; p: [number, number, number]; o: [number, number] }[] = [
  { text: "TELEMARKETING", p: [-3.2, 5.6, -2.0], o: [-40, -110] },
  { text: "CASA DE SHOW", p: [0.6, 3.6, -1.6], o: [120, -150] },
  { text: "PADARIA", p: [-3.3, 1.8, 2.4], o: [-60, 120] },
  { text: "MERCADO", p: [3.3, 1.8, 2.4], o: [60, 120] },
  { text: "ÔNIBUS", p: [3.8, 1.1, -0.45], o: [120, -60] },
];

const FinalLabels: React.FC<{ frame: number }> = ({ frame }) => {
  if (sceneIndexAt(frame) !== 11) return null;
  const k = clamp(track("final.labels", frame), 0, 1);
  if (k <= 0.01) return null;
  const pose = cameraPoseAt(frame);
  return (
    <AbsoluteFill>
      {LABELS.map((l, i) => (
        <WorldLabel key={l.text} pose={pose} point={l.p} text={l.text} appear={clamp(k * 1.6 - i * 0.12, 0, 1)} offset={l.o} accent={PALETTE.negative} size={34} />
      ))}
    </AbsoluteFill>
  );
};

export const Overlays: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FinalLabels frame={frame} />
      <PhotoLabel frame={frame} />
      <Chat frame={frame} />
      <Flash frame={frame} />
      <Rewind frame={frame} />
    </AbsoluteFill>
  );
};
