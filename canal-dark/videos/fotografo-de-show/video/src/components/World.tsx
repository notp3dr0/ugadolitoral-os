import { useCurrentFrame } from "remotion";
import { track } from "../data/scenes";
import { clamp } from "../utils/animation";
import { Buildings } from "../world/Buildings";
import { City } from "../world/City";
import { Figure } from "../world/Figure";
import { heroAt } from "../world/hero";
import { Props } from "../world/Props";

// O cenário persistente: a mesma São Paulo do começo ao fim. Cada objeto lê seu estado das trilhas
// no frame GLOBAL, então nada "pula" de lugar entre cortes; só a câmera se move.

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const h = heroAt(frame);
  const flash = clamp(track("flash.burst", frame), 0, 1);
  const hasCamera = Math.max(h.hasCamera, h.lift > 0.02 ? 1 : 0);
  return (
    <group>
      <Figure
        position={[h.x, h.y + 0.06, h.z]}
        yaw={h.yaw}
        variant="hero"
        seed="voce"
        flash={flash}
        hero={{ outfit: h.outfit, hasCamera, lanyards: h.lanyards, fatigue: h.fatigue, hope: h.hope, shoot: h.shoot, lift: h.lift, edit: h.edit, walk: h.walk, walkAmt: h.walkAmt }}
      />
      {flash > 0.02 ? <pointLight position={[h.x + Math.sin((h.yaw * Math.PI) / 180) * 0.4, 1.0 + h.y, h.z + Math.cos((h.yaw * Math.PI) / 180) * 0.4]} intensity={9 * flash} distance={5} decay={1.6} color="#ffffff" /> : null}
    </group>
  );
};

export const World: React.FC = () => (
  <group>
    <City />
    <Buildings />
    <Props />
    <Hero />
  </group>
);
