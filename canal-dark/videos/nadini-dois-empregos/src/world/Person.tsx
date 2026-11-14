import type { Vec3 } from "../utils/animation";
import { clamp } from "../utils/animation";
import { Mat } from "./materials";

// Boneco low-poly genérico (Nadini, Aline, padeiro, clientes e o manequim). Pés no y = 0, olhando para +z.
// Altura ~1,15 u3d. Todo o movimento vem da pose, que é função pura do frame (rig.ts).

export type HairStyle = "ponytail" | "bob" | "long" | "cap" | "chef" | "none";

export type PersonLook = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants: string;
  shoes?: string;
  apron?: string;
  badge?: string;
  mustache?: boolean;
  glasses?: boolean;
  /** olhos amendoados (ligeiramente puxados) e cor dos lábios. */
  almond?: boolean;
  lips?: string;
  /** manequim: liso, sem cabelo nem olhos (só o sorriso pintado). */
  mannequin?: boolean;
};

export type Eyes = "open" | "wide" | "closed" | "x" | "angry";
export type Mouth = "smile" | "o" | "flat" | "frown" | "grin";

export type PersonPose = {
  position: Vec3;
  yaw: number;
  scale?: number;
  /** fase da caminhada (rad) e amplitude do balanço das pernas/braços. */
  walk?: number;
  walkAmp?: number;
  /** braços erguidos para a frente (rad) e abertos para o lado (rad). */
  armL?: number;
  armR?: number;
  sideL?: number;
  sideR?: number;
  /** inclinação para a frente (x) e para o lado (z), em rad. */
  lean?: number;
  roll?: number;
  /** pernas encolhidas (sentado/voando) 0→1. */
  tuck?: number;
  eyes?: Eyes;
  mouth?: Mouth;
  opacity?: number;
};

const Limb: React.FC<{ len: number; r: number; color: string; o: number }> = ({ len, r, color, o }) => (
  <mesh position={[0, -len / 2, 0]} castShadow>
    <cylinderGeometry args={[r, r * 0.92, len, 7]} />
    <Mat color={color} o={o} />
  </mesh>
);

export const Person: React.FC<{ look: PersonLook; pose: PersonPose }> = ({ look, pose }) => {
  const o = pose.opacity ?? 1;
  if (o < 0.01) return null;
  const amp = pose.walkAmp ?? 0;
  const ph = pose.walk ?? 0;
  const swing = Math.sin(ph) * amp;
  const bob = Math.abs(Math.cos(ph)) * amp * 0.06;
  const tuck = clamp(pose.tuck ?? 0, 0, 1);
  const skin = look.mannequin ? PALETTE_MANNEQUIN : look.skin;
  const eyes = pose.eyes ?? "open";
  const mouth = pose.mouth ?? "smile";
  const shoes = look.shoes ?? "#1d1d22";
  return (
    <group position={pose.position} rotation={[0, pose.yaw, 0]} scale={pose.scale ?? 1}>
      <group position={[0, bob, 0]} rotation={[pose.lean ?? 0, 0, pose.roll ?? 0]}>
        {/* pernas (pivô no quadril) */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.085, 0.47, 0]} rotation={[side * swing - tuck * 1.3, 0, 0]}>
            <Limb len={0.42} r={0.062} color={look.mannequin ? skin : look.pants} o={o} />
            <mesh position={[0, -0.43, 0.04]} castShadow>
              <boxGeometry args={[0.12, 0.07, 0.2]} />
              <Mat color={look.mannequin ? skin : shoes} o={o} />
            </mesh>
          </group>
        ))}
        {/* tronco */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.15, 0.44, 8]} />
          <Mat color={look.mannequin ? skin : look.shirt} o={o} />
        </mesh>
        {look.apron ? (
          <mesh position={[0, 0.62, 0.155]}>
            <boxGeometry args={[0.24, 0.36, 0.02]} />
            <Mat color={look.apron} o={o} />
          </mesh>
        ) : null}
        {look.badge ? (
          <group position={[0.08, 0.8, 0.165]}>
            <mesh>
              <boxGeometry args={[0.09, 0.06, 0.012]} />
              <Mat color="#ffffff" o={o} />
            </mesh>
            <mesh position={[0, 0.02, 0.007]}>
              <boxGeometry args={[0.09, 0.018, 0.004]} />
              <Mat color={look.badge} o={o} />
            </mesh>
          </group>
        ) : null}
        {/* braços (pivô no ombro) */}
        {[-1, 1].map((side) => {
          const raise = side < 0 ? (pose.armL ?? 0) : (pose.armR ?? 0);
          const open = side < 0 ? (pose.sideL ?? 0) : (pose.sideR ?? 0);
          return (
            <group key={side} position={[side * 0.215, 0.86, 0]} rotation={[-raise - side * swing * 0.8, 0, side * (0.12 + open)]}>
              <Limb len={0.36} r={0.05} color={look.mannequin ? skin : look.shirt} o={o} />
              <mesh position={[0, -0.39, 0]} castShadow>
                <sphereGeometry args={[0.055, 7, 6]} />
                <Mat color={skin} o={o} />
              </mesh>
            </group>
          );
        })}
        {/* pescoço e cabeça */}
        <mesh position={[0, 0.93, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.08, 6]} />
          <Mat color={skin} o={o} />
        </mesh>
        <group position={[0, 1.1, 0]}>
          <mesh scale={[1, 1.02, 0.96]} castShadow>
            <sphereGeometry args={[0.2, 10, 8]} />
            <Mat color={skin} o={o} />
          </mesh>
          {look.mannequin ? null : <Face eyes={eyes} o={o} almond={!!look.almond} />}
          <MouthMesh mouth={mouth} o={o} mannequin={!!look.mannequin} lips={look.lips} />
          {look.mustache ? (
            <mesh position={[0, -0.06, 0.188]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.13, 0.03, 0.02]} />
              <Mat color="#3a2416" o={o} />
            </mesh>
          ) : null}
          {look.glasses ? (
            <group position={[0, 0.03, 0.19]}>
              {[-0.07, 0.07].map((x) => (
                <mesh key={x} position={[x, 0, 0]}>
                  <torusGeometry args={[0.042, 0.009, 5, 12]} />
                  <Mat color="#1a1a1a" o={o} />
                </mesh>
              ))}
            </group>
          ) : null}
          <Hair look={look} o={o} />
        </group>
      </group>
    </group>
  );
};

const PALETTE_MANNEQUIN = "#e9e4da";

const Face: React.FC<{ eyes: Eyes; o: number; almond: boolean }> = ({ eyes, o, almond }) => (
  <>
    {[-0.07, 0.07].map((x) => (
      <group key={x} position={[x, 0.03, 0.176]} scale={[1, almond && eyes !== "wide" ? 0.7 : 1, 1]} rotation={[0, 0, almond ? (x > 0 ? -0.14 : 0.14) : 0]}>
        {eyes === "wide" ? (
          <>
            <mesh>
              <sphereGeometry args={[0.045, 8, 6]} />
              <Mat color="#ffffff" o={o} />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <sphereGeometry args={[0.018, 6, 5]} />
              <Mat color="#111111" o={o} />
            </mesh>
          </>
        ) : eyes === "closed" ? (
          <mesh>
            <boxGeometry args={[0.06, 0.012, 0.02]} />
            <Mat color="#111111" o={o} />
          </mesh>
        ) : eyes === "x" ? (
          <>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.06, 0.012, 0.02]} />
              <Mat color="#111111" o={o} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.06, 0.012, 0.02]} />
              <Mat color="#111111" o={o} />
            </mesh>
          </>
        ) : (
          <mesh>
            <sphereGeometry args={[0.028, 7, 6]} />
            <Mat color="#111111" o={o} />
          </mesh>
        )}
        {eyes === "angry" ? (
          <mesh position={[0, 0.06, 0.01]} rotation={[0, 0, x > 0 ? 0.5 : -0.5]}>
            <boxGeometry args={[0.07, 0.016, 0.02]} />
            <Mat color="#1a1a1a" o={o} />
          </mesh>
        ) : null}
      </group>
    ))}
  </>
);

const MouthMesh: React.FC<{ mouth: Mouth; o: number; mannequin: boolean; lips?: string }> = ({ mouth, o, mannequin, lips }) => {
  const c = mannequin ? "#8a8278" : (lips ?? "#4a1a14");
  if (mouth === "o")
    return (
      <mesh position={[0, -0.08, 0.18]} scale={[1, 1.2, 0.6]}>
        <sphereGeometry args={[0.032, 7, 6]} />
        <Mat color="#2a0d0a" o={o} />
      </mesh>
    );
  if (mouth === "flat")
    return (
      <mesh position={[0, -0.08, 0.185]}>
        <boxGeometry args={[0.08, 0.014, 0.02]} />
        <Mat color={c} o={o} />
      </mesh>
    );
  const frown = mouth === "frown";
  const big = mouth === "grin";
  return (
    <mesh position={[0, frown ? -0.1 : -0.06, 0.17]} rotation={[0.25, 0, frown ? 0 : Math.PI]}>
      <torusGeometry args={[big ? 0.07 : 0.05, 0.012, 5, 12, Math.PI]} />
      <Mat color={c} o={o} />
    </mesh>
  );
};

const Hair: React.FC<{ look: PersonLook; o: number }> = ({ look, o }) => {
  if (look.mannequin || look.hairStyle === "none") return null;
  if (look.hairStyle === "chef")
    return (
      <group position={[0, 0.17, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.1, 10]} />
          <Mat color="#ffffff" o={o} />
        </mesh>
        <mesh position={[0, 0.16, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.22, 10, 8]} />
          <Mat color="#ffffff" o={o} />
        </mesh>
      </group>
    );
  if (look.hairStyle === "cap")
    return (
      <group position={[0, 0.1, 0]}>
        <mesh scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color={look.hair} o={o} />
        </mesh>
        <mesh position={[0, 0, 0.2]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.26, 0.02, 0.16]} />
          <Mat color={look.hair} o={o} />
        </mesh>
      </group>
    );
  return (
    <group>
      {/* calota: na frente para acima dos olhos; atrás desce até a nuca */}
      <mesh position={[0, 0.01, -0.005]} scale={[1.07, 1.04, 1.05]}>
        <sphereGeometry args={[0.2, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
        <Mat color={look.hair} o={o} double />
      </mesh>
      <mesh position={[0, 0.0, -0.01]} scale={[1.07, 1.04, 1.06]}>
        <sphereGeometry args={[0.2, 12, 8, Math.PI, Math.PI, 0, Math.PI * 0.72]} />
        <Mat color={look.hair} o={o} double />
      </mesh>
      {look.hairStyle === "bob" ? (
        // chanel: só nas laterais e atrás (aberto na frente do rosto)
        <mesh position={[0, -0.04, -0.01]} scale={[1.12, 1, 1.08]}>
          <cylinderGeometry args={[0.2, 0.22, 0.24, 12, 1, true, 1.05, Math.PI * 2 - 2.1]} />
          <Mat color={look.hair} o={o} double />
        </mesh>
      ) : look.hairStyle === "long" ? (
        <>
          {/* cabelo longo até a cintura: cortina atrás + mechas laterais + franja reta */}
          <mesh position={[0, -0.36, -0.19]} castShadow>
            <boxGeometry args={[0.4, 0.86, 0.07]} />
            <Mat color={look.hair} o={o} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.205, -0.33, 0.035]} castShadow>
              <boxGeometry args={[0.075, 0.78, 0.17]} />
              <Mat color={look.hair} o={o} />
            </mesh>
          ))}
          <mesh position={[0, 0.115, 0.165]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.31, 0.07, 0.07]} />
            <Mat color={look.hair} o={o} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.06, -0.21]}>
            <sphereGeometry args={[0.06, 7, 6]} />
            <Mat color={look.hair} o={o} />
          </mesh>
          <mesh position={[0, -0.08, -0.25]} rotation={[Math.PI - 0.35, 0, 0]}>
            <coneGeometry args={[0.07, 0.28, 7]} />
            <Mat color={look.hair} o={o} />
          </mesh>
        </>
      )}
    </group>
  );
};
