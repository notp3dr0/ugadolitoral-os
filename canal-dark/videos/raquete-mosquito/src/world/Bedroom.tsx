import { useCurrentFrame } from "remotion";
import { impulse, isVisible, track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp } from "../utils/animation";
import { JG_HEAD } from "./rig";
import { Mat, useCanvasTexture } from "./materials";

// O quarto às 3 da manhã: cama, João Gabriel dormindo, criado-mudo com relógio, abajur e a janela com a lua.

const Clock: React.FC<{ o: number }> = ({ o }) => {
  const tex = useCanvasTexture(256, 128, (ctx) => {
    ctx.fillStyle = "#120607";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#ff3b30";
    ctx.font = "bold 92px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("03:00", 128, 68);
  });
  return (
    <group position={[-2.5, 0.83, 0.42]} rotation={[0, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.46, 0.25, 0.14]} />
        <Mat color="#2a2a30" o={o} />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <planeGeometry args={[0.4, 0.19]} />
        <meshBasicMaterial key={o < 0.999 ? "t" : "o"} map={tex} transparent={o < 0.999} opacity={o} toneMapped={false} />
      </mesh>
    </group>
  );
};

export const Bedroom: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("bedroom", frame)) return null;
  const o = 1 - track("bedroom.dim", frame);
  if (o < 0.01) return null;
  return (
    <group>
      {/* chão e paredes */}
      <mesh position={[-0.3, -0.05, 0.6]} receiveShadow>
        <boxGeometry args={[7.6, 0.1, 4.4]} />
        <Mat color={PALETTE.floor} o={o} />
      </mesh>
      <mesh position={[-0.3, 1.8, -1.55]} receiveShadow>
        <boxGeometry args={[7.6, 3.7, 0.1]} />
        <Mat color={PALETTE.wall} o={o} />
      </mesh>
      <mesh position={[-4.05, 1.8, 0.6]} receiveShadow>
        <boxGeometry args={[0.1, 3.7, 4.4]} />
        <Mat color={PALETTE.wallSide} o={o} />
      </mesh>
      {/* janela com a lua */}
      <group position={[-0.75, 2.3, -1.49]}>
        <mesh>
          <planeGeometry args={[1.3, 1.05]} />
          <meshBasicMaterial key={o < 0.999 ? "t" : "o"} color={PALETTE.windowSky} transparent={o < 0.999} opacity={o} />
        </mesh>
        <mesh position={[0.28, 0.18, 0.01]}>
          <circleGeometry args={[0.2, 20]} />
          <meshBasicMaterial key={o < 0.999 ? "t" : "o"} color={PALETTE.moon} transparent={o < 0.999} opacity={o} toneMapped={false} />
        </mesh>
        <mesh position={[0.36, 0.24, 0.015]}>
          <circleGeometry args={[0.17, 20]} />
          <meshBasicMaterial key={o < 0.999 ? "t" : "o"} color={PALETTE.windowSky} transparent={o < 0.999} opacity={o} />
        </mesh>
        {[
          [0, 0.56, 1.42, 0.08],
          [0, -0.56, 1.42, 0.08],
          [-0.69, 0, 0.08, 1.2],
          [0.69, 0, 0.08, 1.2],
          [0, 0, 0.05, 1.05],
          [0, 0, 1.3, 0.05],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.04]}>
            <boxGeometry args={[w, h, 0.06]} />
            <Mat color="#e9e4f2" o={o} />
          </mesh>
        ))}
      </group>
      {/* cama */}
      <mesh position={[-0.1, 0.25, 0.25]} castShadow receiveShadow>
        <boxGeometry args={[3.7, 0.4, 1.95]} />
        <Mat color={PALETTE.bedFrame} o={o} />
      </mesh>
      <mesh position={[-1.98, 0.8, 0.25]} castShadow>
        <boxGeometry args={[0.14, 1.2, 1.95]} />
        <Mat color={PALETTE.bedFrame} o={o} />
      </mesh>
      <mesh position={[-0.1, 0.55, 0.25]} receiveShadow>
        <boxGeometry args={[3.55, 0.2, 1.85]} />
        <Mat color={PALETTE.mattress} o={o} />
      </mesh>
      <mesh position={[-1.45, 0.73, 0.25]} castShadow>
        <boxGeometry args={[0.7, 0.18, 1.1]} />
        <Mat color={PALETTE.pillow} o={o} />
      </mesh>
      {/* corpo sob o lençol */}
      <mesh position={[0.35, 0.72, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 0.16, 1.9]} />
        <Mat color={PALETTE.blanket} o={o} />
      </mesh>
      <mesh position={[0.25, 0.86, 0.3]} castShadow>
        <boxGeometry args={[1.9, 0.18, 0.75]} />
        <Mat color={PALETTE.blanket} o={o} />
      </mesh>
      <mesh position={[-0.86, 0.82, 0.3]} castShadow>
        <boxGeometry args={[0.16, 0.06, 1.92]} />
        <Mat color={PALETTE.blanketFold} o={o} />
      </mesh>
      {/* criado-mudo, relógio e abajur */}
      <mesh position={[-2.75, 0.35, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.7, 0.75]} />
        <Mat color={PALETTE.nightstand} o={o} />
      </mesh>
      <Clock o={o} />
      <mesh position={[-3.0, 0.95, 0.15]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.5, 6]} />
        <Mat color="#3a3a40" o={o} />
      </mesh>
      <mesh position={[-3.0, 1.25, 0.15]} castShadow>
        <coneGeometry args={[0.2, 0.25, 7, 1, true]} />
        <Mat color={PALETTE.lamp} o={o} double />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- João Gabriel
/** João Gabriel: avatar low-poly (sem foto). Cabeça, cabelo, óculos, olhos que abrem e fecham e
 * a bochecha vermelha do tapa. */
export const JoaoGabriel: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("sleeper", frame)) return null;
  const o = 1 - track("bedroom.dim", frame);
  if (o < 0.01) return null;
  const eyes = track("sleeper.eyes", frame);
  const red = track("sleeper.redCheek", frame);
  // tranco do tapa: a cabeça balança e ele faz cara de "ai"
  const hit = impulse("camera.shake", frame);
  const wobble = Math.sin(frame * 1.9) * 0.12 * hit;
  const ouch = hit > 0.05;
  const lid = clamp(1 - eyes, 0, 1);
  const R = 0.31;
  const HAIR = "#1d1613";
  const DARK = "#14110f";
  return (
    <group position={JG_HEAD} rotation={[-0.18, 0.32, 0.08 + wobble]}>
      {/* cabeça e orelhas */}
      <mesh scale={[1, 1.06, 0.96]} castShadow>
        <sphereGeometry args={[R, 12, 10]} />
        <Mat color={PALETTE.skin} o={o} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * R * 0.97, -0.01, -0.02]} scale={[0.5, 1, 0.8]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <Mat color={PALETTE.skin} o={o} />
        </mesh>
      ))}
      {/* cabelo curto: calota na parte de cima, deixando a testa livre */}
      <mesh position={[0, 0.02, -0.03]} rotation={[-0.4, 0, 0]} castShadow>
        <sphereGeometry args={[R * 1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
        <Mat color={HAIR} o={o} />
      </mesh>
      {/* nariz */}
      <mesh position={[0, -0.035, R * 0.96]} scale={[1, 1, 0.9]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <Mat color={PALETTE.skin} o={o} />
      </mesh>
      {[-0.105, 0.105].map((x) => (
        <group key={x}>
          {/* olho aberto: bola branca com pupila */}
          <mesh position={[x, 0.04, 0.27]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <Mat color="#ffffff" o={o} rough={0.4} />
          </mesh>
          <mesh position={[x, 0.04, 0.311]}>
            <sphereGeometry args={[0.02, 8, 6]} />
            <Mat color={DARK} o={o} />
          </mesh>
          {/* pálpebra: cobre o olho quando ele dorme */}
          {lid > 0.03 ? (
            <mesh position={[x, 0.04, 0.285]} scale={[1, lid, 1]}>
              <sphereGeometry args={[0.058, 10, 8]} />
              <Mat color={PALETTE.skin} o={o} />
            </mesh>
          ) : null}
          {lid > 0.6 ? (
            <mesh position={[x, 0.035, 0.346]}>
              <boxGeometry args={[0.08, 0.009, 0.008]} />
              <Mat color={DARK} o={o} />
            </mesh>
          ) : null}
          {/* sobrancelha: sobe quando ele acorda e fecha a cara com o tapa */}
          <mesh position={[x, 0.115 + 0.012 * (1 - lid), 0.285]} rotation={[0, 0, ouch ? (x > 0 ? 0.35 : -0.35) : 0]}>
            <boxGeometry args={[0.085, 0.014, 0.012]} />
            <Mat color={HAIR} o={o} />
          </mesh>
          {/* aro dos óculos */}
          <mesh position={[x, 0.04, 0.318]}>
            <torusGeometry args={[0.064, 0.0085, 5, 14]} />
            <Mat color={DARK} o={o} rough={0.3} />
          </mesh>
        </group>
      ))}
      {/* ponte e hastes dos óculos */}
      <mesh position={[0, 0.048, 0.32]}>
        <boxGeometry args={[0.05, 0.009, 0.009]} />
        <Mat color={DARK} o={o} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.232, 0.04, 0.2]} rotation={[0, -s * 0.59, 0]}>
          <boxGeometry args={[0.009, 0.009, 0.2]} />
          <Mat color={DARK} o={o} />
        </mesh>
      ))}
      {/* boca: sorriso, ou um "ai" no tapa */}
      {ouch ? (
        <mesh position={[0, -0.12, 0.285]} scale={[1, 1.3, 0.4]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <Mat color="#4a1c1c" o={o} />
        </mesh>
      ) : (
        <mesh position={[0, -0.095, 0.29]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.07, 0.012, 5, 12, Math.PI]} />
          <Mat color="#6b2b2b" o={o} />
        </mesh>
      )}
      {/* marca vermelha do tapa na bochecha */}
      {red > 0.01 ? (
        <mesh position={[0.16, -0.05, 0.255]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          <meshBasicMaterial color="#ff3b3b" transparent opacity={0.6 * red * o} />
        </mesh>
      ) : null}
    </group>
  );
};
