import { AbsoluteFill, useCurrentFrame } from "remotion";
import { skyColors } from "../world/time";

// Céu atrás da cidade: degradê pela hora do dia (garoa cinza, amanhecer, noite cobalto).
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const c = skyColors(frame);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 55%, ${c[2]} 100%)` }} />
    </AbsoluteFill>
  );
};
