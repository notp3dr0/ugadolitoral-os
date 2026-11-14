import { useCurrentFrame } from "remotion";
import { isVisible, track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, rand, smoothstep, type Vec3 } from "../utils/animation";
import { Mat, useCanvasTexture } from "./materials";
import { arc, CATAPULT, catapultTilt, mannequinPose, nadiniPose, sceneIndex, SPOT, v3 } from "./rig";

// Objetos de cena: contratos, moedas, crachá voador, baguete-catapulta e os celulares do bolso.

const Contract: React.FC<{ position: Vec3; stamp: number; tilt: number }> = ({ position, stamp, tilt }) => {
  const paper = useCanvasTexture(256, 340, (ctx) => {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, 256, 340);
    ctx.fillStyle = "#2a2a30";
    ctx.font = "900 34px Impact, 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CONTRATO", 128, 54);
    ctx.fillStyle = "#c9c4b8";
    for (let y = 88; y < 300; y += 26) ctx.fillRect(28, y, y > 260 ? 120 : 200, 9);
  });
  const seal = useCanvasTexture(200, 200, (ctx) => {
    ctx.strokeStyle = PALETTE.positive;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(100, 100, 82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.positive;
    ctx.font = "900 44px Impact, 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CONTRA", 100, 82);
    ctx.fillText("TADA!", 100, 124);
  });
  const s = clamp(stamp, 0, 1.25);
  return (
    <group position={position} rotation={[-0.2, 0, tilt]}>
      <mesh>
        <planeGeometry args={[0.3, 0.4]} />
        <meshStandardMaterial map={paper} roughness={0.9} />
      </mesh>
      {s > 0.02 ? (
        <mesh position={[0.03, -0.06, 0.004]} rotation={[0, 0, -0.35]} scale={s > 1 ? s : 1.6 - 0.6 * s}>
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial map={seal} transparent opacity={clamp(s * 1.5, 0, 1)} toneMapped={false} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

export const Contracts: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("contractLoja", frame)) return null;
  const n = nadiniPose(frame);
  if (!n.holding) return null;
  const a = track("contractLoja.stamp", frame);
  const b = track("contractPadaria.stamp", frame);
  return (
    <>
      <Contract position={v3.add(n.position, [-0.3, 0.72, 0.42])} stamp={a} tilt={0.12} />
      <Contract position={v3.add(n.position, [0.3, 0.72, 0.42])} stamp={b} tilt={-0.12} />
    </>
  );
};

export const Coins: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("coins", frame)) return null;
  const rain = track("coins.rain", frame);
  if (rain <= 0.001) return null;
  const N = 16;
  return (
    <group>
      {Array.from({ length: N }).map((_, k) => {
        const u = clamp((rain * (N + 3) - k) / 3, 0, 1);
        if (u <= 0) return null;
        const x = (rand(`cx${k}`) - 0.5) * 1.8;
        const z = 0.75 + (rand(`cz${k}`) - 0.5) * 0.8;
        const y = 3.4 - 3.37 * u * u;
        return (
          <mesh key={k} position={[x, y, z]} rotation={[u < 1 ? frame * 0.3 + k : Math.PI / 2, k, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.025, 12]} />
            <Mat color={PALETTE.coin} metal={0.6} rough={0.35} emissive="#7a5200" ei={0.25} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Crachá que voa do peito da Nadini para o manequim (cena 4). */
export const FlyingBadge: React.FC = () => {
  const frame = useCurrentFrame();
  if (sceneIndex(frame) !== 3) return null;
  const t = track("cracha.swap", frame);
  if (t <= 0.001 || t >= 0.999) return null;
  const m = mannequinPose(frame);
  const n = nadiniPose(frame);
  if (!m) return null;
  const p = arc(v3.add(n.position, [0.08, 0.8, 0.18]), v3.add(m.position, [0.08, 0.8, 0.18]), smoothstep(t), 0.35);
  return (
    <mesh position={p} rotation={[0, frame * 0.4, 0]}>
      <boxGeometry args={[0.13, 0.09, 0.015]} />
      <Mat color="#ffffff" emissive="#2fb3c9" ei={0.3} />
    </mesh>
  );
};

/** A baguete gigante sobre um calço, na rua (planos 3 e 4). */
export const Catapult: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("catapult", frame)) return null;
  const build = track("catapult.build", frame);
  if (build <= 0.01) return null;
  const tilt = catapultTilt(frame);
  return (
    <group position={CATAPULT} scale={clamp(build, 0, 1.15)}>
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.34, 3]} />
        <Mat color="#7a5a3a" />
      </mesh>
      <group position={[0, 0.36, 0]} rotation={[0, 0, tilt]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.13, 1.75, 4, 9]} />
          <Mat color={PALETTE.bread} />
        </mesh>
        {[-0.6, -0.2, 0.2, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.12, 0]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.04, 0.06, 0.2]} />
            <Mat color={PALETTE.breadDark} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/** Celulares espiando do bolso do avental e o que vai parar na mão do cliente (cena 7). */
export const Phones: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("phones", frame)) return null;
  const pocket = track("phones.pocket", frame);
  const hand = track("handoff.phone", frame);
  const n = nadiniPose(frame);
  const colors = ["#4fdcff", "#ff7aa8", "#ffd34d"];
  const from: Vec3 = v3.add(n.position, [0.2, 0.75, 0.35]);
  const to: Vec3 = v3.add(SPOT.customer2, [-0.1, 0.92, -0.32]);
  const handed = arc(from, to, smoothstep(clamp(hand, 0, 1)), 0.3);
  return (
    <group>
      {colors.map((c, k) => {
        const flying = k === 0 && hand > 0.001;
        const pos: Vec3 = flying ? handed : v3.add(n.position, [-0.06 + k * 0.06, 0.52 + 0.1 * clamp(pocket, 0, 1.2), 0.18]);
        return (
          <group key={k} position={pos} rotation={[flying ? -0.4 : 0, flying ? Math.PI : 0, (k - 1) * 0.25]} scale={flying ? 1.6 : 1}>
            <mesh>
              <boxGeometry args={[0.06, 0.11, 0.012]} />
              <Mat color={PALETTE.phoneBody} />
            </mesh>
            <mesh position={[0, 0, 0.007]}>
              <planeGeometry args={[0.05, 0.09]} />
              <meshBasicMaterial color={c} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
