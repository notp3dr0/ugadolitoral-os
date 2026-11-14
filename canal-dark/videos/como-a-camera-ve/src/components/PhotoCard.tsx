import { interpolate, useCurrentFrame } from "remotion";
import { scenes, track } from "../data/scenes";
import { FONT, PALETTE } from "../theme";
import { clamp, lerp } from "../utils/animation";
import { wordLocal } from "../utils/timing";
import { jumpHeight, photoState } from "./optics";

// Card "RESULTADO": a foto que a câmera está produzindo. Esquemático: o mesmo motivo do 3D,
// com foco, exposição, rastro e ruído vindos das trilhas photo.*.

const W0 = 320;
const H0 = 240;

const Skater: React.FC<{ lift: number; opacity?: number }> = ({ lift, opacity = 1 }) => {
  const y = -lift * 44;
  return (
    <g transform={`translate(0 ${y})`} opacity={opacity}>
      <rect x={128} y={164} width={64} height={7} rx={3} fill="#d8a24a" />
      <circle cx={140} cy={175} r={4} fill="#e9e6df" />
      <circle cx={180} cy={175} r={4} fill="#e9e6df" />
      <rect x={148} y={124} width={10} height={40} fill="#2d3a55" />
      <rect x={162} y={124} width={10} height={40} fill="#2d3a55" />
      <rect x={144} y={82} width={32} height={44} rx={4} fill="#f2f0eb" />
      <rect x={134} y={86} width={9} height={34} rx={3} fill="#c98f6a" transform="rotate(18 138 88)" />
      <rect x={177} y={86} width={9} height={34} rx={3} fill="#c98f6a" transform="rotate(-18 181 88)" />
      <circle cx={160} cy={68} r={13} fill="#c98f6a" />
      <rect x={146} y={52} width={30} height={9} rx={4} fill="#e5372b" />
    </g>
  );
};

const HERO_AT = scenes[7].startFrame + wordLocal("s8", 20);

export const PhotoCard: React.FC = () => {
  const frame = useCurrentFrame();
  const show = clamp(track("photoCard.show", frame), 0, 1.2);
  if (show < 0.001) return null;
  const hero = frame >= HERO_AT - 1 ? clamp(track("photoCard.hero", frame), 0, 1.1) : 0;
  const st = photoState(frame);
  const blurPx = (1 - clamp(st.focus, 0, 1)) * 16;
  const wash = (1 - clamp(st.focus, 0, 1)) * 0.78;
  const bright = Math.pow(2, st.exposure * 0.75);
  const white = clamp(st.exposure / 2.2, 0, 1) * 0.7;
  const lift = jumpHeight(st.phase);
  // posição: canto direito, entre o assunto e a legenda; no fim vira a foto grande no centro
  const w = lerp(330, 860, hero);
  const left = lerp(1080 - 90 - 330, (1080 - 860) / 2, hero);
  const top = lerp(1040, 560, hero);
  const rot = lerp(-3, 0, hero);
  const pop = interpolate(show, [0, 1], [0.6, 1]);
  const seed = Math.floor(frame / 2) % 97;
  return (
    <div style={{ position: "absolute", left, top, width: w, scale: String(pop), rotate: `${rot}deg`, opacity: clamp(show * 1.6, 0, 1), transformOrigin: "50% 50%" }}>
      <div style={{ background: "#f2f0eb", padding: w * 0.03, paddingBottom: w * 0.1, borderRadius: 6, boxShadow: "0 22px 50px rgba(0,0,0,0.6)" }}>
        <svg viewBox={`0 0 ${W0} ${H0}`} width="100%" style={{ display: "block", filter: `brightness(${bright}) blur(${blurPx * (w / 330)}px)` }}>
          <defs>
            <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2b1a3a" />
              <stop offset="1" stopColor="#ff8a4a" />
            </linearGradient>
            <filter id="grao">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed={seed} />
              <feColorMatrix type="saturate" values="2.2" />
            </filter>
          </defs>
          <rect width={W0} height={H0} fill="url(#ceu)" />
          <circle cx={76} cy={70} r={26} fill="#ffe0a0" />
          <rect y={170} width={W0} height={70} fill="#7d7a76" />
          <polygon points="230,170 320,120 320,170" fill="#6d6a66" />
          {st.blur > 0.01
            ? [1, 2, 3, 4, 5].map((k) => <Skater key={k} lift={jumpHeight((st.phase - k * 0.09 + 1) % 1)} opacity={0.32 * st.blur} />)
            : null}
          <Skater lift={lift} opacity={1 - st.blur * 0.55} />
          <rect width={W0} height={H0} fill="#ffffff" opacity={Math.max(wash, white)} />
          {st.noise > 0.01 ? <rect width={W0} height={H0} filter="url(#grao)" opacity={st.noise * 0.55} style={{ mixBlendMode: "overlay" }} /> : null}
        </svg>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: w * 0.075, color: "#1b1b1b", marginTop: w * 0.022, letterSpacing: 2, display: "flex", justifyContent: "space-between" }}>
          <span>RESULTADO</span>
          <span style={{ color: PALETTE.red }}>●</span>
        </div>
      </div>
    </div>
  );
};
