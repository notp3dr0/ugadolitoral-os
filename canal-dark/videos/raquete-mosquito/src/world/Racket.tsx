import { useCurrentFrame } from "remotion";
import { DoubleSide } from "three";
import { isVisible, track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, lerp, pulse, type Vec3 } from "../utils/animation";
import { Mat, useGridTexture } from "./materials";
import { HEAD_RX, HEAD_RY, outerZ, PART, racketPose, sceneIndex, v3 } from "./rig";

// A raquete, em coordenadas locais (origem na junção cabo/cabeça; cabo para baixo, redes para cima).
// O cabo fica transparente para mostrar pilhas → oscilador → transformador → multiplicador → capacitor;
// a cabeça tem três redes: as de fora num polo (azul), a do meio no outro (vermelha).

const hex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};

const Grid: React.FC<{ z: number; color: string; coarse?: boolean; glow: number }> = ({ z, color, coarse, glow }) => {
  const alpha = useGridTexture(coarse ? 46 : 30, coarse ? 7 : 5);
  return (
    <group position={[0, PART.headCenter[1], z]}>
      <mesh scale={[HEAD_RX - 0.02, HEAD_RY - 0.02, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial color={color} alphaMap={alpha} transparent alphaTest={0.4} side={DoubleSide} roughness={0.5} metalness={0.3} emissive={color} emissiveIntensity={glow} />
      </mesh>
      {/* aro fino: deixa a camada legível de perfil */}
      <mesh scale={[HEAD_RX - 0.02, HEAD_RY - 0.02, 1]}>
        <torusGeometry args={[1, 0.022, 4, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow * 0.8} roughness={0.5} flatShading />
      </mesh>
    </group>
  );
};

/** Caminho da corrente (local), das pilhas até a rede do meio. */
const PATH: Vec3[] = [
  [0, -0.8, 0.07],
  PART.osc,
  PART.transformer,
  PART.multBottom,
  PART.multTop,
  PART.capacitor,
  [0, 0.0, 0.02],
  PART.neck,
  [0, 0.5, 0],
  [0, 0.86, 0],
];

const along = (u: number): Vec3 => {
  const n = PATH.length - 1;
  const x = clamp(u, 0, n);
  const i = Math.min(Math.floor(x), n - 1);
  return v3.lerp(PATH[i], PATH[i + 1], x - i);
};

const Current: React.FC<{ frame: number }> = ({ frame }) => {
  const i = sceneIndex(frame);
  const flow = track("current.flow", frame);
  const pulseOn = track("current.pulse", frame);
  const reject = track("transformer.reject", frame);
  const boost = track("transformer.boost", frame);
  const stage = track("multiplier.stage", frame);
  const charge = track("capacitor.charge", frame);
  const dead = track("current.deadEnd", frame);
  let reach = 2 * flow;
  if (boost > 0) reach = 2 + boost;
  reach += stage + (boost > 0 ? clamp(charge, 0, 1) : 0) + dead * 4;
  if (i === 8) reach = 9;
  if (reach < 0.02) return null;
  const N = 18;
  const dots: React.ReactNode[] = [];
  for (let k = 0; k < N; k++) {
    let u = ((k / N + frame * 0.012) % 1) * reach;
    // empacado no transformador: as partículas se amontoam e tremem
    if (reject > 0.2 && boost < 0.01) u = Math.min(u, 2 - 0.02 * k * reject);
    const blink = pulseOn > 0.5 && boost < 0.99 ? (Math.floor(frame / 3) + k) % 2 === 0 : true;
    if (!blink) continue;
    const p = along(u);
    const jit: Vec3 = reject > 0.2 && boost < 0.01 ? [Math.sin(frame * 1.7 + k) * 0.01, Math.cos(frame * 2.3 + k) * 0.01, 0] : [0, 0, 0];
    const hot = clamp((u - 2) / 3, 0, 1);
    const c = dead > 0 && u > 5 ? PALETTE.poleB : hex(PALETTE.current, "#fff1a8", hot);
    dots.push(
      <mesh key={k} position={v3.add(p, jit)}>
        <sphereGeometry args={[0.014 + 0.008 * hot, 6, 5]} />
        <meshBasicMaterial color={c} toneMapped={false} />
      </mesh>,
    );
  }
  return <group>{dots}</group>;
};

/** Final: um cometa de luz percorre o sistema inteiro, das pilhas às redes. */
const SystemPath: React.FC<{ frame: number }> = ({ frame }) => {
  const p = track("systemPath.progress", frame);
  if (p <= 0.001) return null;
  const n = PATH.length - 1;
  const head = p * n;
  const dots: React.ReactNode[] = [];
  for (let k = 0; k < 14; k++) {
    const u = head - k * 0.12;
    if (u < 0) break;
    dots.push(
      <mesh key={k} position={along(u)}>
        <sphereGeometry args={[0.03 * (1 - k / 16), 6, 5]} />
        <meshBasicMaterial color={k === 0 ? "#ffffff" : "#7fe8ff"} transparent opacity={1 - k / 14} toneMapped={false} />
      </mesh>,
    );
  }
  return <group>{dots}</group>;
};

export const Racket: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isVisible("racket", frame)) return null;
  const i = sceneIndex(frame);
  const pose = racketPose(frame);
  if (pose.scale < 0.01) return null;
  const shell = track("racket.shell", frame, 1);
  const zOut = outerZ(frame);
  const tintOuter = track("gridOuter.tint", frame);
  const tintMid = track("gridMiddle.tint", frame);
  const outerColor = hex(PALETTE.mesh, PALETTE.poleA, tintOuter);
  const midColor = hex(PALETTE.mesh, PALETTE.poleB, tintMid);
  const armed = track("led.on", frame);
  const closed = track("circuit.closed", frame);
  const glowMid = 0.15 * tintMid + 0.5 * closed * (i === 8 ? 1 : 0) + 0.25 * armed * pulse(frame, 30) * tintMid;
  const osc = track("board.osc", frame);
  const oscBlink = osc * (Math.floor(frame / 2) % 2 === 0 ? 1 : 0.15);
  const reject = track("transformer.reject", frame);
  const boost = track("transformer.boost", frame);
  const stage = track("multiplier.stage", frame);
  const charge = track("capacitor.charge", frame);
  const capSize = track("capacitor.size", frame, 1);
  const pop = track("batteries.pop", frame);
  const popBump = 1 + 0.25 * Math.sin(clamp(pop, 0, 1) * Math.PI);
  const spark = track("racket.sparkHint", frame);
  const showInside = shell < 0.95 && isVisible("board", frame);
  const showBatteries = shell < 0.95 && isVisible("batteries", frame);
  const airGlow = isVisible("airGap", frame) ? track("airGap.glow", frame) : 0;
  return (
    <group position={pose.position} rotation={[0, pose.rotY, pose.rotZ]} scale={pose.scale}>
      {/* cabo (carcaça translúcida quando abrimos) */}
      <mesh position={[0, -0.66, 0]} castShadow={shell > 0.9}>
        <cylinderGeometry args={[0.15, 0.14, 1.32, 10]} />
        <meshStandardMaterial key={shell < 0.999 ? "t" : "o"} color={PALETTE.handle} roughness={0.7} flatShading transparent={shell < 0.999} opacity={shell} depthWrite={shell > 0.9} />
      </mesh>
      <mesh position={[0, -1.34, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.05, 10]} />
        <Mat color={PALETTE.racketAccent} />
      </mesh>
      {/* botão */}
      <mesh position={[0, -0.42, 0.15]}>
        <boxGeometry args={[0.07, 0.12, 0.04]} />
        <Mat color={PALETTE.racketAccent} o={lerp(0.6, 1, shell)} />
      </mesh>
      {/* LED indicador */}
      <mesh position={PART.led}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshBasicMaterial color={armed > 0.5 ? "#3dff7a" : "#3a1414"} toneMapped={false} />
      </mesh>
      {/* pescoço e aro da cabeça */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 0.14, 8]} />
        <Mat color={PALETTE.racketBody} />
      </mesh>
      <mesh position={[0, PART.headCenter[1], 0]} scale={[HEAD_RX, HEAD_RY, 1]} castShadow>
        <torusGeometry args={[1, 0.065, 6, 48]} />
        <Mat color={PALETTE.racketBody} />
      </mesh>
      {/* três redes: fora = polo A, meio = polo B */}
      <Grid z={zOut} color={outerColor} coarse glow={0.12 * tintOuter} />
      <Grid z={0} color={midColor} glow={glowMid} />
      <Grid z={-zOut} color={outerColor} coarse glow={0.12 * tintOuter} />
      {/* faixa de ar entre as redes */}
      {airGlow > 0.01
        ? [zOut / 2, -zOut / 2].map((z, k) => (
            <mesh key={k} position={[0, PART.headCenter[1], z]} scale={[HEAD_RX - 0.05, HEAD_RY - 0.05, Math.max(zOut - 0.03, 0.01)]}>
              <cylinderGeometry args={[1, 1, 1, 40, 1, true]} />
              <meshBasicMaterial color="#bfe9ff" transparent opacity={0.16 * airGlow} side={DoubleSide} depthWrite={false} />
            </mesh>
          ))
        : null}
      {/* faisquinha de "e se...?" */}
      {spark > 0.01 && spark < 0.999 ? (
        <mesh position={[0.2, 1.1, 0.07]} rotation={[0, 0, frame]}>
          <octahedronGeometry args={[0.06 * Math.sin(spark * Math.PI), 0]} />
          <meshBasicMaterial color={PALETTE.spark} toneMapped={false} />
        </mesh>
      ) : null}
      {/* pilhas */}
      {showBatteries
        ? [-0.065, 0.065].map((x, k) => (
            <group key={k} position={[x, PART.battery[1], 0]} scale={popBump}>
              <mesh>
                <cylinderGeometry args={[0.055, 0.055, 0.34, 10]} />
                <Mat color={PALETTE.battery} />
              </mesh>
              <mesh position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.025, 8]} />
                <Mat color={PALETTE.batteryCap} metal={0.6} rough={0.3} />
              </mesh>
              <mesh position={[0, -0.0, 0.056]}>
                <boxGeometry args={[0.05, 0.1, 0.004]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))
        : null}
      {showInside ? (
        <group>
          {/* placa */}
          <mesh position={[0, -0.44, 0]}>
            <boxGeometry args={[0.22, 0.7, 0.02]} />
            <Mat color={PALETTE.board} />
          </mesh>
          {/* oscilador (transistor) */}
          <mesh position={PART.osc}>
            <boxGeometry args={[0.06, 0.07, 0.035]} />
            <meshStandardMaterial color="#151515" emissive="#53d6ff" emissiveIntensity={1.6 * oscBlink} roughness={0.5} flatShading />
          </mesh>
          {/* transformador: bobina de cobre e núcleo */}
          <group position={v3.add(PART.transformer, [Math.sin(frame * 1.4) * 0.012 * reject, 0, 0])}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.1, 10]} />
              <meshStandardMaterial color={hex(PALETTE.copper, "#ff4d4d", reject * 0.5)} emissive="#ffb347" emissiveIntensity={0.7 * boost * (0.6 + 0.4 * pulse(frame, 6))} roughness={0.4} metalness={0.5} flatShading />
            </mesh>
            <mesh>
              <boxGeometry args={[0.14, 0.1, 0.03]} />
              <Mat color="#6b6f78" metal={0.5} rough={0.4} />
            </mesh>
          </group>
          {/* multiplicador: escadinha de diodos e capacitores que acende degrau a degrau */}
          {[0, 1, 2, 3].map((k) => {
            const on = clamp(stage * 4 - k, 0, 1);
            const y = PART.multBottom[1] + k * 0.072;
            return (
              <group key={k} position={[0, y, 0.035]}>
                <mesh position={[k % 2 ? 0.045 : -0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.05, 6]} />
                  <meshStandardMaterial color="#1b1b1b" emissive="#fff1a8" emissiveIntensity={1.4 * on} flatShading />
                </mesh>
                <mesh position={[k % 2 ? -0.045 : 0.045, 0, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
                  <meshStandardMaterial color="#d9a441" emissive="#fff1a8" emissiveIntensity={0.9 * on} flatShading />
                </mesh>
              </group>
            );
          })}
          {/* capacitor de armazenamento com barra de carga */}
          <group position={PART.capacitor} scale={capSize}>
            <mesh>
              <cylinderGeometry args={[0.052, 0.052, 0.15, 12]} />
              <meshStandardMaterial color={PALETTE.capacitor} transparent opacity={0.55} roughness={0.4} depthWrite={false} />
            </mesh>
            {charge > 0.01 ? (
              <mesh position={[0, -0.075 + 0.075 * charge, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.15 * charge, 10]} />
                <meshBasicMaterial color="#7fe8ff" toneMapped={false} />
              </mesh>
            ) : null}
          </group>
          {isVisible("current", frame) ? <Current frame={frame} /> : null}
          {isVisible("systemPath", frame) ? <SystemPath frame={frame} /> : null}
        </group>
      ) : null}
    </group>
  );
};
