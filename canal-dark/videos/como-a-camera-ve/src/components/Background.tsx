import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { track } from "../data/scenes";
import { clamp } from "../utils/animation";

// Estúdio escuro em degradê; um brilho quente do lado do sol cresce quando o sol estoura.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const sun = clamp((track("sun.intensity", frame, 1) - 1) / 1.4, 0, 1);
  const warm = interpolateColors(sun, [0, 1], ["rgba(255,150,70,0.10)", "rgba(255,190,110,0.32)"]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #1b1b1b 0%, #101010 55%, #050505 100%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 30% 30%, ${warm} 0%, rgba(0,0,0,0) 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
