import { useCurrentFrame } from "remotion";
import { DoubleSide } from "three";
import { isVisible, track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp } from "../utils/animation";
import { Mat } from "./materials";
import { handPose, mosquitoPos, mosquitoYaw, sceneIndex } from "./rig";

// Personagens: o mosquito (olhos grandes, óculos escuros, sobrancelha de ofendido, espetinho,
// fantasminha) e a mão do João.

const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};

export const Mosquito: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("mosquito", frame)) return null;
  const i = sceneIndex(frame);
  const ghost = i === 10 ? track("mosquito.ghost", frame) : 0;
  if (i === 10 && ghost < 0.01) return null;
  const shades = track("mosquito.shades", frame);
  const anger = i === 3 ? track("mosquito.anger", frame) : 0;
  const charred = i >= 8 ? track("mosquito.charred", frame) : 0;
  const skewer = i >= 8 ? track("mosquito.skewer", frame) : 0;
  const dead = charred > 0.5;
  const pos = mosquitoPos(frame);
  const yaw = mosquitoYaw(frame);
  const flap = dead && !ghost ? 0 : Math.sin(frame * 2.6) * 0.6;
  const o = ghost > 0 ? 0.55 * clamp(ghost, 0, 1) * (1 - clamp((track("mosquito.ghostRise", frame) - 0.85) / 0.15, 0, 1)) : 1;
  const body = ghost > 0 ? "#f4f8ff" : mix(PALETTE.mosquito, "#120d0a", charred);
  const stripe = ghost > 0 ? "#ffffff" : mix(PALETTE.mosquitoStripe, "#2a221c", charred);
  const scale = i >= 8 ? 1.25 : 1;
  const tilt = dead && !ghost ? 0.35 : 0;
  if (o < 0.01) return null;
  return (
    <group position={pos} rotation={[0, yaw, tilt]} scale={scale}>
      {/* abdômen listrado, tórax e cabeça */}
      <mesh position={[-0.11, 0.0, 0]} scale={[0.15, 0.05, 0.05]} castShadow>
        <sphereGeometry args={[1, 8, 6]} />
        <Mat color={body} o={o} />
      </mesh>
      {[-0.07, -0.13, -0.19].map((x, k) => (
        <mesh key={k} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05 - Math.abs(x + 0.11) * 0.25, 0.05 - Math.abs(x + 0.11) * 0.25, 0.018, 8]} />
          <Mat color={stripe} o={o} />
        </mesh>
      ))}
      <mesh position={[0.02, 0.01, 0]} castShadow>
        <sphereGeometry args={[0.05, 8, 6]} />
        <Mat color={body} o={o} />
      </mesh>
      <mesh position={[0.085, 0.022, 0]} castShadow>
        <sphereGeometry args={[0.038, 8, 6]} />
        <Mat color={body} o={o} />
      </mesh>
      {/* olhos grandes */}
      {[0.026, -0.026].map((z, k) => (
        <group key={k} position={[0.1, 0.045, z]}>
          <mesh>
            <sphereGeometry args={[0.027, 10, 8]} />
            <Mat color={dead && !ghost ? "#d9d0c4" : "#ffffff"} o={o} rough={0.4} />
          </mesh>
          {dead && !ghost ? (
            <group position={[0.018, 0, z * 0.35]}>
              <mesh rotation={[0, Math.PI / 2, Math.PI / 4]}>
                <boxGeometry args={[0.03, 0.006, 0.006]} />
                <Mat color="#111111" o={o} />
              </mesh>
              <mesh rotation={[0, Math.PI / 2, -Math.PI / 4]}>
                <boxGeometry args={[0.03, 0.006, 0.006]} />
                <Mat color="#111111" o={o} />
              </mesh>
            </group>
          ) : (
            <mesh position={[0.016, -0.002, z * 0.3]}>
              <sphereGeometry args={[0.013, 8, 6]} />
              <Mat color="#111111" o={o} />
            </mesh>
          )}
        </group>
      ))}
      {/* sobrancelhas de ofendido */}
      {anger > 0.02
        ? [0.026, -0.026].map((z, k) => (
            <mesh key={k} position={[0.112, 0.08, z]} rotation={[z > 0 ? 0.5 : -0.5, 0, 0]} scale={[1, 1, anger]}>
              <boxGeometry args={[0.012, 0.008, 0.04]} />
              <Mat color="#1a1a1a" o={o} />
            </mesh>
          ))
        : null}
      {/* óculos escuros de surfista */}
      {shades > 0.02 ? (
        <group position={[0.125, 0.05, 0]} scale={clamp(shades, 0, 1.2)}>
          {[0.027, -0.027].map((z, k) => (
            <mesh key={k} position={[0, 0, z]}>
              <boxGeometry args={[0.012, 0.03, 0.042]} />
              <Mat color="#0b0b0f" o={o} rough={0.2} />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.01, 0.008, 0.11]} />
            <Mat color="#0b0b0f" o={o} />
          </mesh>
        </group>
      ) : null}
      {/* tromba */}
      <mesh position={[0.16, 0.005, 0]} rotation={[0, 0, Math.PI / 2 + 0.25]}>
        <cylinderGeometry args={[0.004, 0.006, 0.13, 5]} />
        <Mat color={body} o={o} />
      </mesh>
      {/* patas */}
      {[-0.03, 0.01, 0.05].flatMap((x, k) =>
        [1, -1].map((side) => (
          <mesh key={`${k}${side}`} position={[x, -0.05, side * 0.04]} rotation={[side * 0.6, 0, -0.3 + k * 0.25]}>
            <cylinderGeometry args={[0.003, 0.003, 0.12, 4]} />
            <Mat color={body} o={o} />
          </mesh>
        )),
      )}
      {/* asas batendo */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[-0.01, 0.05, side * 0.02]} rotation={[side * (0.5 + flap), 0, 0.12]}>
          <planeGeometry args={[0.15, 0.06]} />
          <meshStandardMaterial color={PALETTE.wing} transparent opacity={0.45 * o} side={DoubleSide} depthWrite={false} roughness={0.3} />
        </mesh>
      ))}
      {/* espetinho de churrasco */}
      {skewer > 0.02 && !ghost ? (
        <group scale={clamp(skewer, 0, 1.2)}>
          <mesh position={[0.0, 0.0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.7, 5]} />
            <Mat color="#c8a06a" o={o} />
          </mesh>
          <mesh position={[0.36, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.007, 0.03, 5]} />
            <Mat color="#c8a06a" o={o} />
          </mesh>
        </group>
      ) : null}
      {/* auréola do fantasminha */}
      {ghost > 0.02 ? (
        <mesh position={[0.02, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.008, 6, 20]} />
          <meshBasicMaterial color="#ffe27a" transparent opacity={o * 1.5} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

/** Mão low-poly. `pointing` estica o indicador e fecha os outros dedos. */
export const Hand: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("hand", frame)) return null;
  const h = handPose(frame);
  if (h.scale < 0.01 || h.opacity < 0.01) return null;
  const o = h.opacity;
  const fingers = [-0.09, -0.03, 0.03, 0.09];
  return (
    <group position={h.position} rotation={[0, h.rotY, h.rotZ]} scale={h.scale}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.32, 0.1]} />
        <Mat color={PALETTE.skin} o={o} />
      </mesh>
      {fingers.map((x, k) => {
        const index = k === 3;
        const long = h.pointing > 0.5 ? (index ? 0.26 : 0.1) : 0.21 - Math.abs(x) * 0.25;
        return (
          <mesh key={k} position={[x, 0.16 + long / 2, h.pointing > 0.5 && !index ? 0.04 : 0]} castShadow>
            <boxGeometry args={[0.055, long, 0.075]} />
            <Mat color={PALETTE.skin} o={o} />
          </mesh>
        );
      })}
      <mesh position={[-0.18, 0.02, 0.02]} rotation={[0, 0, 0.7]} castShadow>
        <boxGeometry args={[0.06, 0.16, 0.07]} />
        <Mat color={PALETTE.skin} o={o} />
      </mesh>
      {/* manga da camiseta */}
      <mesh position={[0, -0.36, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.15, 0.42, 7]} />
        <Mat color={PALETTE.shirt} o={o} />
      </mesh>
    </group>
  );
};
