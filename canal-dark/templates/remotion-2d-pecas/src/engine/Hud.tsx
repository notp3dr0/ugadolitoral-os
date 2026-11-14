import { FONT, PAL } from "../theme";
import { EASE, prog } from "../utils/anim";
import { useCurrentFrame } from "remotion";

// Elementos de interface que moram DENTRO da cena e dão cara de série: relógio e contagem de dias.

/** Relógio/cartão do dia, no canto. Dá o "quando" sem narrar. */
export const ClockBadge: React.FC<{ time: string; label?: string; x?: number; y?: number }> = ({ time, label, x = 70, y = 250 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      padding: "10px 18px",
      borderRadius: 12,
      background: "rgba(8,8,18,.62)",
      border: "2px solid rgba(255,255,255,.14)",
      fontFamily: FONT,
      color: "#fff",
    }}
  >
    {label ? <div style={{ fontSize: 20, fontWeight: 700, opacity: 0.7, letterSpacing: 2 }}>{label.toUpperCase()}</div> : null}
    <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 1 }}>{time}</div>
  </div>
);

/** Parede de marcas de contagem (cinco em cinco). `count` aparece progressivamente entre os frames `from` e `to`. */
export const TallyWall: React.FC<{ x: number; y: number; w: number; h: number; count: number; from?: number; to?: number; color?: string }> = ({
  x,
  y,
  w,
  h,
  count,
  from = 0,
  to = 0,
  color = "rgba(214,220,238,.78)",
}) => {
  const frame = useCurrentFrame();
  const shown = to > from ? Math.floor(count * prog(frame, from, to, EASE.out)) : count;
  const groups = Math.ceil(count / 5);
  const cols = Math.max(1, Math.round(Math.sqrt((groups * w) / h)));
  const rows = Math.ceil(groups / cols);
  const cw = w / cols;
  const rh = h / rows;
  const marks: React.ReactNode[] = [];
  for (let g = 0; g < groups; g++) {
    const gx = x + (g % cols) * cw;
    const gy = y + Math.floor(g / cols) * rh;
    const inGroup = Math.min(5, count - g * 5);
    for (let m = 0; m < inGroup; m++) {
      if (g * 5 + m >= shown) break;
      const jitter = ((g * 7 + m * 3) % 5) - 2;
      if (m < 4) {
        const lx = gx + cw * (0.14 + m * 0.17) + jitter * 0.6;
        marks.push(<line key={`${g}-${m}`} x1={lx} y1={gy + rh * 0.2} x2={lx + jitter * 0.4} y2={gy + rh * 0.78} stroke={color} strokeWidth={3.2} strokeLinecap="round" />);
      } else {
        marks.push(<line key={`${g}-${m}`} x1={gx + cw * 0.06} y1={gy + rh * 0.7} x2={gx + cw * 0.82} y2={gy + rh * 0.28} stroke={color} strokeWidth={3.2} strokeLinecap="round" />);
      }
    }
  }
  return <g>{marks}</g>;
};

export const TitleCard: React.FC<{ title: string; sub?: string; tag?: string; accent?: string }> = ({ title, sub, tag, accent = PAL.accent }) => (
  <div style={{ position: "absolute", inset: 0, background: PAL.night0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff", textAlign: "center" }}>
    <div style={{ fontSize: 116, fontWeight: 900, letterSpacing: 4, lineHeight: 1 }}>{title.toUpperCase()}</div>
    {sub ? <div style={{ marginTop: 26, fontSize: 40, fontWeight: 800, letterSpacing: 8, color: accent }}>{sub.toUpperCase()}</div> : null}
    {tag ? <div style={{ marginTop: 120, fontSize: 28, fontWeight: 700, letterSpacing: 10, opacity: 0.7 }}>{tag.toUpperCase()}</div> : null}
  </div>
);
