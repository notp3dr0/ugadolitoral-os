import { useCurrentFrame } from "remotion";
import { PALETTE } from "../theme";
import { clamp, rand } from "../utils/animation";
import { Mat } from "./materials";
import { Person, type PersonLook } from "./Person";
import { alinePose, bakerPose, customer2Pose, customerPose, mannequinPose, nadiniPose, v3 } from "./rig";

// Elenco: Nadini, Aline (a chefe com radar), o padeiro, dois clientes e o manequim de vitrine.

const NADINI: PersonLook = { skin: PALETTE.skinNadini, hair: PALETTE.hairNadini, hairStyle: "long", shirt: PALETTE.shirtNadini, pants: PALETTE.pantsNadini, almond: true, lips: "#c2455a" };
const ALINE: PersonLook = { skin: PALETTE.skinAline, hair: PALETTE.hairAline, hairStyle: "bob", shirt: PALETTE.blazerAline, pants: PALETTE.pantsAline, badge: "#3b6cff" };
const BAKER: PersonLook = { skin: PALETTE.skinBaker, hair: "#ffffff", hairStyle: "chef", shirt: PALETTE.baker, pants: "#3a3a42", apron: "#e8873a", mustache: true };
const CUSTOMER: PersonLook = { skin: "#d9a07f", hair: "#3e6b3a", hairStyle: "cap", shirt: "#5c9b4e", pants: "#3b3b45" };
const CUSTOMER2: PersonLook = { skin: "#8d5a3b", hair: "#1a1a1a", hairStyle: "bob", shirt: "#8a5cc2", pants: "#2a2a35", glasses: true };
const MANNEQUIN: PersonLook = { skin: PALETTE.mannequin, hair: "", hairStyle: "none", shirt: PALETTE.mannequin, pants: PALETTE.mannequin, mannequin: true };

/** Gotas de suor saindo da testa (determinístico por frame). */
const Sweat: React.FC<{ amount: number; frame: number }> = ({ amount, frame }) => {
  if (amount <= 0.02) return null;
  return (
    <group position={[0, 1.2, 0]}>
      {[0, 1, 2].map((k) => {
        const age = ((frame + k * 9) % 27) / 27;
        const side = k % 2 ? 1 : -1;
        return (
          <mesh key={k} position={[side * (0.2 + age * 0.12), 0.05 - age * 0.35, 0.08]} scale={clamp(amount, 0, 1) * (1 - age * 0.4)}>
            <sphereGeometry args={[0.035, 6, 5]} />
            <meshStandardMaterial color="#9fe3ff" roughness={0.2} transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
};

export const NadiniChar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = nadiniPose(frame);
  if ((p.opacity ?? 1) < 0.01) return null;
  const look: PersonLook = { ...NADINI, apron: p.apron ? PALETTE.awningA : undefined, badge: p.badge && !p.apron ? "#2fb3c9" : undefined };
  return (
    <group>
      <Person look={look} pose={p} />
      <group position={p.position} rotation={[0, p.yaw, 0]} scale={p.scale ?? 1}>
        <Sweat amount={p.sweat} frame={frame} />
      </group>
    </group>
  );
};

export const AlineChar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = alinePose(frame);
  if (!p) return null;
  const o = p.opacity ?? 1;
  return (
    <group>
      <Person look={ALINE} pose={p} />
      <group position={p.position} rotation={[0, p.yaw, 0]}>
        {/* antena do radar de funcionário */}
        {p.antenna > 0.01 ? (
          <group position={[0, 1.3, 0]} scale={clamp(p.antenna, 0, 1)}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.24, 5]} />
              <Mat color="#c7ccd4" />
            </mesh>
            <mesh position={[0, 0.26, 0]}>
              <sphereGeometry args={[0.045, 8, 6]} />
              <meshBasicMaterial color={p.radar > 0.95 ? PALETTE.negative : "#ffdd55"} toneMapped={false} />
            </mesh>
          </group>
        ) : null}
        {/* vapor de raiva saindo das orelhas */}
        {p.steam > 0.02
          ? [0, 1, 2, 3, 4, 5].map((k) => {
              const age = ((frame * 1.3 + k * 11) % 36) / 36;
              const side = k % 2 ? 1 : -1;
              return (
                <mesh key={k} position={[side * (0.24 + age * 0.3), 1.12 + age * 0.55, 0]} scale={(0.4 + age) * clamp(p.steam, 0, 1)}>
                  <sphereGeometry args={[0.07, 7, 5]} />
                  <meshStandardMaterial color="#f4f4f4" transparent opacity={(1 - age) * 0.8 * o} roughness={1} depthWrite={false} />
                </mesh>
              );
            })
          : null}
      </group>
    </group>
  );
};

/** Anéis do radar saindo da antena da Aline e varrendo a loja. */
export const RadarRings: React.FC = () => {
  const frame = useCurrentFrame();
  const p = alinePose(frame);
  if (!p || p.radar <= 0.001 || p.radar >= 1.6) return null;
  const locked = p.radar > 0.95;
  return (
    <group position={v3.add(p.position, [0, 1.56, 0])}>
      {[0, 1, 2].map((k) => {
        const t = (((frame + k * 10) % 30) / 30) * clamp(p.radar * 1.4, 0, 1);
        return (
          <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} scale={0.2 + t * 2.2}>
            <ringGeometry args={[0.9, 1, 40]} />
            <meshBasicMaterial color={locked ? PALETTE.negative : "#ffdd55"} transparent opacity={(1 - t) * 0.75} toneMapped={false} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

export const MannequinChar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = mannequinPose(frame);
  if (!p || (p.scale ?? 1) < 0.01) return null;
  // sorriso pintado: só aparece com mannequin.smile
  return <Person look={{ ...MANNEQUIN, badge: p.badge ? "#2fb3c9" : undefined }} pose={{ ...p, mouth: p.smile > 0.3 ? "grin" : "flat" }} />;
};

export const Extras: React.FC = () => {
  const frame = useCurrentFrame();
  const c1 = customerPose(frame);
  const c2 = customer2Pose(frame);
  const b = bakerPose(frame);
  return (
    <>
      {c1 ? <Person look={CUSTOMER} pose={c1} /> : null}
      {c2 ? <Person look={CUSTOMER2} pose={c2} /> : null}
      {b ? <Person look={BAKER} pose={b} /> : null}
    </>
  );
};

/** Semente estável para efeitos que precisam de variação. */
export const jitter = (seed: string) => rand(seed) - 0.5;
