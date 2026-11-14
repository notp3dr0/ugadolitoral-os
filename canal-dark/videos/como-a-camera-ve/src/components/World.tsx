import { Line } from "@react-three/drei";
import { DoubleSide } from "three";
import { useCurrentFrame } from "remotion";
import { isVisible, track } from "../data/scenes";
import { MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, type Vec3 } from "../utils/animation";
import {
  DARK_SITE, GRID, jumpHeight, jumpPhase, LENS_X, mixRGB, OPENING_X, PALE, photoColor, RAY_COLORS,
  SENSOR_HALF, SENSOR_X, SOURCE_Y, SUBJECT_POS, toCss,
} from "./optics";

// O mundo persistente: a mesma câmera em corte do começo ao fim, o skatista e os raios.
// Tudo lê trilhas no frame GLOBAL (track), então nada pula de lugar entre cortes.

const FLOOR_Y = -2.4;

/** Peça da carcaça partida em duas metades: a de trás (z < 0) fica; a da frente some com body.cut. */
const ShellBox: React.FC<{ pos: Vec3; size: Vec3; cut: number; color?: string }> = ({ pos, size, cut, color = PALETTE.body }) => {
  const z0 = pos[2] - size[2] / 2;
  const z1 = pos[2] + size[2] / 2;
  const back = z0 < 0 ? [z0, Math.min(z1, 0)] : null;
  const front = z1 > 0 ? [Math.max(z0, 0), z1] : null;
  return (
    <>
      {back ? (
        <mesh position={[pos[0], pos[1], (back[0] + back[1]) / 2]} castShadow receiveShadow>
          <boxGeometry args={[size[0], size[1], back[1] - back[0]]} />
          <meshStandardMaterial {...MATTE} color={color} />
        </mesh>
      ) : null}
      {front && cut < 0.98 ? (
        <mesh position={[pos[0], pos[1], (front[0] + front[1]) / 2]} castShadow>
          <boxGeometry args={[size[0], size[1], front[1] - front[0]]} />
          <meshStandardMaterial {...MATTE} color={color} transparent opacity={1 - cut} depthWrite={cut < 0.05} />
        </mesh>
      ) : null}
    </>
  );
};

const Body: React.FC<{ frame: number }> = ({ frame }) => {
  const s = clamp(track("body.scale", frame), 0, 1.2);
  const cut = clamp(track("body.cut", frame), 0, 1);
  if (s < 0.001) return null;
  const T = 0.05;
  return (
    <group scale={s}>
      {/* paredes: fundo (z−), topo, base, traseira; a frente tem a boca quadrada da lente */}
      <mesh position={[0.25, 0, -0.68]} receiveShadow castShadow>
        <boxGeometry args={[2.3, 1.7, T]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.bodyDark} />
      </mesh>
      <ShellBox pos={[0.25, 0.83, 0]} size={[2.3, T, 1.4]} cut={cut} />
      <ShellBox pos={[0.25, -0.83, 0]} size={[2.3, T, 1.4]} cut={cut} />
      <ShellBox pos={[1.38, 0, 0]} size={[T, 1.7, 1.4]} cut={cut} />
      <ShellBox pos={[0.25, 0, 0.68]} size={[2.3, 1.7, T]} cut={cut} />
      <ShellBox pos={[OPENING_X, 0.65, 0]} size={[T, 0.4, 1.4]} cut={cut} />
      <ShellBox pos={[OPENING_X, -0.65, 0]} size={[T, 0.4, 1.4]} cut={cut} />
      <ShellBox pos={[OPENING_X, 0, -0.575]} size={[T, 0.9, 0.25]} cut={cut} />
      <ShellBox pos={[OPENING_X, 0, 0.575]} size={[T, 0.9, 0.25]} cut={cut} />
      {/* visor e botão */}
      <ShellBox pos={[0.15, 1.0, 0]} size={[0.75, 0.3, 0.6]} cut={cut} color={PALETTE.bodyEdge} />
      <mesh position={[1.0, 0.9, -0.35]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 12]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.red} />
      </mesh>
      {/* anel vermelho da baioneta */}
      <mesh position={[OPENING_X - 0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.5, 0.035, 8, 28]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.red} emissive={PALETTE.red} emissiveIntensity={0.25} />
      </mesh>
      {/* tripé */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.6;
        const foot: Vec3 = [0.25 + Math.cos(a) * 1.1, FLOOR_Y, Math.sin(a) * 1.1];
        const top: Vec3 = [0.25, -0.86, 0];
        const mid: Vec3 = [(foot[0] + top[0]) / 2, (foot[1] + top[1]) / 2, (foot[2] + top[2]) / 2];
        const len = Math.hypot(foot[0] - top[0], foot[1] - top[1], foot[2] - top[2]);
        const tiltX = Math.atan2(foot[2] - top[2], -(foot[1] - top[1]));
        const tiltZ = -Math.atan2(foot[0] - top[0], -(foot[1] - top[1]));
        return (
          <mesh key={i} position={mid} rotation={[tiltX, 0, tiltZ]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, len, 6]} />
            <meshStandardMaterial {...METAL} color="#4a4d52" />
          </mesh>
        );
      })}
    </group>
  );
};

const Sensor: React.FC<{ frame: number }> = ({ frame }) => {
  const s = clamp(track("body.scale", frame), 0, 1.2);
  if (s < 0.001) return null;
  const mix = clamp(track("sensor.mix", frame), 0, 1);
  const image = clamp(track("sensor.image", frame), 0, 1);
  const gain = clamp(track("sensor.gain", frame), 0, 1);
  const lit = Math.max(mix, image);
  const cw = (SENSOR_HALF.z * 2) / GRID.cols;
  const ch = (SENSOR_HALF.y * 2) / GRID.rows;
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < GRID.cols; i++) {
    for (let j = 0; j < GRID.rows; j++) {
      // a lente inverte a imagem: o sensor mostra a foto de cabeça pra baixo e espelhada
      const u = 1 - (i + 0.5) / GRID.cols;
      const v = 1 - (j + 0.5) / GRID.rows;
      const photo = lit > 0.001 ? photoColor(u, v, frame, i * 31 + j) : DARK_SITE;
      const c = mixRGB(DARK_SITE, mixRGB(photo, PALE, mix), lit);
      const depth = 0.025 + gain * 0.09 * (0.6 + 0.4 * Math.sin(i * 1.7 + j * 2.3 + frame * 0.3));
      cells.push(
        <mesh key={`${i}-${j}`} position={[SENSOR_X - depth / 2, -SENSOR_HALF.y + (j + 0.5) * ch, -SENSOR_HALF.z + (i + 0.5) * cw]}>
          <boxGeometry args={[depth, ch * 0.86, cw * 0.86]} />
          <meshStandardMaterial roughness={0.6} metalness={0} flatShading color={toCss(c)} emissive={toCss(c)} emissiveIntensity={0.25 + lit * 0.55} />
        </mesh>,
      );
    }
  }
  return (
    <group scale={s}>
      <mesh position={[SENSOR_X + 0.04, 0, 0]} castShadow>
        <boxGeometry args={[0.05, SENSOR_HALF.y * 2 + 0.14, SENSOR_HALF.z * 2 + 0.14]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.sensor} />
      </mesh>
      {cells}
    </group>
  );
};

const Lens: React.FC<{ frame: number }> = ({ frame }) => {
  const k = clamp(track("lens.install", frame), 0, 1.15);
  if (!isVisible("lens", frame) && k < 0.001) return null;
  if (k < 0.001) return null;
  const dx = lerp(-3.2, 0, clamp(k, 0, 1.1));
  return (
    <group position={[dx, 0, 0]}>
      {/* tubo partido: só a metade de trás (z < 0), aberto pro corte */}
      <mesh position={[LENS_X, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.56, 0.56, 1.3, 20, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.body} side={DoubleSide} />
      </mesh>
      <mesh position={[LENS_X - 0.65, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.56, 0.04, 8, 28]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.red} emissive={PALETTE.red} emissiveIntensity={0.3} />
      </mesh>
      {[-2.2, LENS_X, -1.3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} scale={[0.1 + (i === 1 ? 0.05 : 0), 0.5, 0.5]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial roughness={0.15} metalness={0} color={PALETTE.glass} transparent opacity={0.32} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const Iris: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("iris", frame)) return null;
  const close = clamp(track("iris.close", frame), 0, 1);
  // abertas, as lâminas ficam recolhidas dentro do tubo; fechando, avançam pro centro
  const show = clamp(close * 5, 0, 1);
  if (show < 0.001) return null;
  const d = 0.58 - 0.38 * close;
  return (
    <group position={[-1.52, 0, 0]}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2 + close * 0.6;
        return (
          <group key={i} rotation={[a, 0, 0]}>
            <mesh position={[0, d, 0.08]} rotation={[0.35, 0, 0]} scale={[1, show, show]}>
              <boxGeometry args={[0.02, 0.34, 0.34]} />
              <meshStandardMaterial {...METAL} color={PALETTE.blade} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const Shutter: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("shutter", frame)) return null;
  const k = clamp(track("shutter.install", frame), 0, 1.15);
  if (k < 0.001) return null;
  const open = clamp(track("shutter.open", frame), 0, 1);
  const off = lerp(0.2, 0.64, open);
  return (
    <group position={[SENSOR_X - 0.13, 0, 0]} scale={[1, k, 1]}>
      {[1, -1].map((sgn) => (
        <mesh key={sgn} position={[0, sgn * off, 0]} castShadow>
          <boxGeometry args={[0.02, 0.42, SENSOR_HALF.z * 2 + 0.1]} />
          <meshStandardMaterial {...METAL} color="#24262a" emissive={PALETTE.red} emissiveIntensity={0.05} />
        </mesh>
      ))}
    </group>
  );
};

const Skater: React.FC<{ frame: number }> = ({ frame }) => {
  const h = jumpHeight(jumpPhase(frame));
  const tilt = Math.sin(Math.PI * 2 * jumpPhase(frame)) * 0.25;
  return (
    <group position={SUBJECT_POS}>
      {/* rampa de concreto */}
      <mesh position={[0, -1.9, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 1.0, 1.8]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.concrete} />
      </mesh>
      <mesh position={[1.95, -1.95, 0]} rotation={[0, 0, -0.5]} receiveShadow castShadow>
        <boxGeometry args={[1.2, 0.2, 1.8]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.concreteDark} />
      </mesh>
      <group position={[0, h, 0]}>
        <group rotation={[0, 0, tilt]} position={[0, -1.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.0, 0.07, 0.3]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.board} />
          </mesh>
          {[-0.33, 0.33].map((x) => (
            <mesh key={x} position={[x, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.32, 8]} />
              <meshStandardMaterial {...MATTE} color="#e9e6df" />
            </mesh>
          ))}
        </group>
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, -0.95 - h * 0.08, 0]} castShadow>
            <boxGeometry args={[0.16, 0.66, 0.18]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.pants} />
          </mesh>
        ))}
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.52, 0.7, 0.3]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.shirt} />
        </mesh>
        {[-1, 1].map((sg) => (
          <mesh key={sg} position={[sg * 0.36, -0.25 + h * 0.15, 0]} rotation={[0, 0, sg * (0.5 + h * 0.6)]} castShadow>
            <boxGeometry args={[0.12, 0.6, 0.14]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.skin} />
          </mesh>
        ))}
        <mesh position={[0, 0.25, 0]} castShadow>
          <icosahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.skin} />
        </mesh>
        <mesh position={[0.04, 0.4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.36]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.red} />
        </mesh>
      </group>
    </group>
  );
};

const Sun: React.FC<{ frame: number }> = ({ frame }) => {
  const k = track("sun.intensity", frame, 1);
  return (
    <mesh position={[-17, 6.5, -12]} scale={1.3 * Math.sqrt(k)}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial flatShading color={PALETTE.sun} emissive={PALETTE.sun} emissiveIntensity={0.9 + (k - 1) * 0.9} />
    </mesh>
  );
};

/** Raios: de cada ponto do skatista, passando pela abertura, até o sensor. */
const Rays: React.FC<{ frame: number }> = ({ frame }) => {
  const amount = clamp(track("rays.amount", frame), 0, 1);
  const spread = clamp(track("rays.spread", frame), 0, 1);
  if (amount + spread < 0.01) return null;
  const converge = clamp(track("rays.converge", frame), 0, 1);
  const width = track("rays.width", frame, 1);
  const lens = clamp(track("lens.install", frame), 0, 1);
  const iris = clamp(track("iris.close", frame), 0, 1);
  const h = jumpHeight(jumpPhase(frame));
  const lx = lerp(OPENING_X, LENS_X, lens);
  const radius = lerp(0.42, 0.42 * (1 - 0.7 * iris), lens);
  const count = 1 + Math.round(6 * spread);
  const opacity = clamp((amount + spread * 0.6) * (1 - 0.35 * iris), 0, 0.95);
  const lines: React.ReactNode[] = [];
  SOURCE_Y.forEach((y0, pi) => {
    const p: Vec3 = [SUBJECT_POS[0], y0 + h, SUBJECT_POS[2]];
    // imagem do ponto: invertida em y e z
    const img: Vec3 = [SENSOR_X - 0.03, clamp(-p[1] * 0.2, -SENSOR_HALF.y, SENSOR_HALF.y), clamp(-p[2] * 0.22, -SENSOR_HALF.z, SENSOR_HALF.z)];
    for (let k = 0; k < count; k++) {
      const t = count === 1 ? 0 : (k / (count - 1)) * 2 - 1;
      const L: Vec3 = [lx, t * radius, t * radius * 0.35 * (k % 2 ? 1 : -1)];
      const f = (SENSOR_X - 0.03 - p[0]) / (L[0] - p[0]);
      const straight: Vec3 = [SENSOR_X - 0.03, p[1] + (L[1] - p[1]) * f, p[2] + (L[2] - p[2]) * f];
      const end: Vec3 = [straight[0], lerp(clamp(straight[1], -0.5, 0.5), img[1], converge), lerp(clamp(straight[2], -0.62, 0.62), img[2], converge)];
      lines.push(<Line key={`${pi}-${k}`} points={[p, L, end]} color={RAY_COLORS[pi]} lineWidth={2.6 * width} transparent opacity={opacity} />);
    }
  });
  return <>{lines}</>;
};

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <group>
      <mesh position={[-3, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 48]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.floor} />
      </mesh>
      <Sun frame={frame} />
      <Skater frame={frame} />
      <Body frame={frame} />
      <Sensor frame={frame} />
      <Lens frame={frame} />
      <Iris frame={frame} />
      <Shutter frame={frame} />
      <Rays frame={frame} />
    </group>
  );
};
