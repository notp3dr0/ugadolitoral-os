import { useCurrentFrame } from "remotion";
import { DoubleSide } from "three";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, pulse } from "../utils/animation";
import { Mat, useCanvasTexture } from "./materials";
import { BAKERY_X, BASKET, CLOCK, SHOP_X } from "./rig";

// A maquete persistente: base, calçada e rua; loja de celular (esquerda), padaria (direita) e a torre
// do relógio no meio. As lojas são caixas abertas na frente, para a câmera ver o balcão.

const W = 2.6; // largura de cada loja
const D = 1.8; // profundidade
const H = 2.2; // altura
const BACK = -1.4; // z da parede do fundo

const Sign: React.FC<{ text: string; bg: string; fg: string; position: [number, number, number]; glow?: boolean }> = ({ text, bg, fg, position, glow }) => {
  const tex = useCanvasTexture(1024, 192, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 192);
    ctx.fillStyle = fg;
    ctx.font = "900 132px Impact, 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (glow) {
      ctx.shadowColor = fg;
      ctx.shadowBlur = 26;
    }
    ctx.fillText(text, 512, 104);
  }, [text, bg, fg]);
  return (
    <mesh position={position}>
      <boxGeometry args={[W + 0.2, 0.5, 0.12]} />
      <meshStandardMaterial attach="material-0" color={bg} roughness={0.9} flatShading />
      <meshStandardMaterial attach="material-1" color={bg} roughness={0.9} flatShading />
      <meshStandardMaterial attach="material-2" color={bg} roughness={0.9} flatShading />
      <meshStandardMaterial attach="material-3" color={bg} roughness={0.9} flatShading />
      <meshStandardMaterial attach="material-4" map={tex} roughness={0.8} emissive={glow ? "#ffffff" : "#000000"} emissiveMap={glow ? tex : null} emissiveIntensity={glow ? 0.55 : 0} />
      <meshStandardMaterial attach="material-5" color={bg} roughness={0.9} flatShading />
    </mesh>
  );
};

/** Caixa aberta na frente: piso, fundo, laterais e teto. */
const Shell: React.FC<{ x: number; wall: string; inner: string; floor: string }> = ({ x, wall, inner, floor }) => (
  <group position={[x, 0, 0]}>
    <mesh position={[0, 0.02, BACK + D / 2]} receiveShadow>
      <boxGeometry args={[W, 0.04, D]} />
      <Mat color={floor} />
    </mesh>
    <mesh position={[0, H / 2, BACK]} receiveShadow castShadow>
      <boxGeometry args={[W, H, 0.12]} />
      <Mat color={inner} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[(s * W) / 2, H / 2, BACK + D / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.12, H, D]} />
        <Mat color={wall} />
      </mesh>
    ))}
    <mesh position={[0, H + 0.09, BACK + D / 2 + 0.05]} castShadow>
      <boxGeometry args={[W + 0.2, 0.18, D + 0.1]} />
      <Mat color={wall} />
    </mesh>
  </group>
);

const PhoneShop: React.FC = () => {
  const screens = ["#4fdcff", "#ff7aa8", "#ffd34d", "#7dff9a", "#b48cff"];
  return (
    <group>
      <Shell x={SHOP_X} wall={PALETTE.shopWall} inner={PALETTE.shopInner} floor={PALETTE.shopFloor} />
      <Sign text="CELULAR" bg={PALETTE.shopSignBg} fg={PALETTE.shopSign} position={[SHOP_X, H - 0.18, BACK + D + 0.08]} glow />
      {/* prateleiras com celulares */}
      {[0.95, 1.4].map((y, r) => (
        <group key={y}>
          <mesh position={[SHOP_X - 0.25, y - 0.1, BACK + 0.14]}>
            <boxGeometry args={[1.7, 0.05, 0.22]} />
            <Mat color={PALETTE.shopTrim} />
          </mesh>
          {screens.map((c, i) => (
            <group key={i} position={[SHOP_X - 0.95 + i * 0.35, y + 0.06, BACK + 0.16]} rotation={[-0.15, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.16, 0.3, 0.03]} />
                <Mat color={PALETTE.phoneBody} />
              </mesh>
              <mesh position={[0, 0, 0.017]}>
                <planeGeometry args={[0.13, 0.25]} />
                <meshBasicMaterial color={screens[(i + r * 2) % screens.length]} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* porta dos fundos */}
      <group position={[SHOP_X + 0.85, 0, BACK + 0.07]}>
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[0.52, 1.24, 0.04]} />
          <Mat color="#4a3a32" />
        </mesh>
        <mesh position={[0, 1.36, 0.01]}>
          <boxGeometry args={[0.36, 0.12, 0.03]} />
          <meshBasicMaterial color="#3ecf6e" toneMapped={false} />
        </mesh>
      </group>
      {/* balcão com vitrine */}
      <group position={[SHOP_X - 0.15, 0, -0.42]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.76, 0.46]} />
          <Mat color={PALETTE.shopTrim} />
        </mesh>
        <mesh position={[0, 0.79, 0]}>
          <boxGeometry args={[1.14, 0.05, 0.5]} />
          <Mat color="#e8eef5" />
        </mesh>
        <mesh position={[0.25, 0.86, 0.05]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.14, 0.24, 0.02]} />
          <Mat color={PALETTE.phoneBody} />
        </mesh>
      </group>
    </group>
  );
};

const Bakery: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.6 + 0.25 * pulse(frame, 50);
  return (
    <group>
      <Shell x={BAKERY_X} wall={PALETTE.bakeryWall} inner={PALETTE.bakeryInner} floor={PALETTE.bakeryFloor} />
      <Sign text="PADARIA" bg={PALETTE.bakerySignBg} fg={PALETTE.bakerySign} position={[BAKERY_X, H - 0.18, BACK + D + 0.08]} />
      {/* toldo listrado */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[BAKERY_X - W / 2 + 0.1 + (i + 0.5) * ((W + 0.0) / 8), 1.78, BACK + D + 0.3]} rotation={[0.55, 0, 0]}>
          <boxGeometry args={[W / 8, 0.04, 0.5]} />
          <Mat color={i % 2 ? PALETTE.awningB : PALETTE.awningA} />
        </mesh>
      ))}
      {/* forno */}
      <group position={[BAKERY_X + 0.75, 0, BACK + 0.32]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.8, 1.2, 0.5]} />
          <Mat color={PALETTE.oven} />
        </mesh>
        <mesh position={[0, 0.65, 0.26]}>
          <circleGeometry args={[0.22, 10, 0, Math.PI]} />
          <meshBasicMaterial color={`rgb(255,${Math.round(120 + 60 * glow)},40)`} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
          <Mat color="#5a3a2a" />
        </mesh>
      </group>
      {/* prateleira de pães */}
      <mesh position={[BAKERY_X - 0.5, 1.25, BACK + 0.16]}>
        <boxGeometry args={[1.2, 0.05, 0.24]} />
        <Mat color={PALETTE.breadDark} />
      </mesh>
      {[-0.95, -0.7, -0.45, -0.2, -0.05].map((x, i) => (
        <mesh key={i} position={[BAKERY_X + x, 1.36, BACK + 0.16]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.7]}>
          <capsuleGeometry args={[0.07, 0.12, 3, 7]} />
          <Mat color={i % 2 ? PALETTE.bread : PALETTE.breadDark} />
        </mesh>
      ))}
      {/* balcão-vitrine com pães */}
      <group position={[BAKERY_X - 0.1, 0, -0.42]}>
        <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.54, 0.46]} />
          <Mat color="#c27a4a" />
        </mesh>
        <mesh position={[0, 0.66, 0]}>
          <boxGeometry args={[1.3, 0.24, 0.46]} />
          <meshStandardMaterial color="#dff3ff" transparent opacity={0.35} roughness={0.1} depthWrite={false} side={DoubleSide} />
        </mesh>
        {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0.62, 0]} rotation={[0, 0.3 * i, Math.PI / 2]} scale={[1, 1, 0.75]}>
            <capsuleGeometry args={[0.075, 0.14, 3, 7]} />
            <Mat color={PALETTE.bread} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/** Cesta de pães na calçada (onde a Nadini pousa). */
const Basket: React.FC = () => (
  <group position={BASKET}>
    <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.42, 0.34, 0.32, 10, 1, true]} />
      <Mat color={PALETTE.wicker} double />
    </mesh>
    <mesh position={[0, 0.03, 0]}>
      <cylinderGeometry args={[0.34, 0.34, 0.04, 10]} />
      <Mat color={PALETTE.wicker} />
    </mesh>
    <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.42, 0.035, 5, 14]} />
      <Mat color="#7d5230" />
    </mesh>
    {[
      [0.12, 0.26, 0.05, 0.4],
      [-0.14, 0.25, -0.06, -0.6],
      [0.0, 0.3, 0.14, 1.2],
      [-0.05, 0.28, -0.16, 2.1],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} rotation={[0, r, Math.PI / 2 - 0.3]} scale={[1, 1, 0.75]}>
        <capsuleGeometry args={[0.08, 0.16, 3, 7]} />
        <Mat color={i % 2 ? PALETTE.bread : PALETTE.breadDark} />
      </mesh>
    ))}
  </group>
);

// ---------------------------------------------------------------- relógio-pizza
/** Ângulo (rad, anti-horário a partir de +x) do ponteiro numa hora de um mostrador de 12 h. */
const hourAngle = (h: number) => Math.PI / 2 - ((h % 12) / 12) * Math.PI * 2;

const Arc: React.FC<{ from: number; hours: number; color: string; r0: number; r1: number; z: number; o?: number }> = ({ from, hours, color, r0, r1, z, o = 1 }) => {
  if (hours <= 0.01) return null;
  return (
    <mesh position={[0, 0, z]}>
      <ringGeometry args={[r0, r1, 48, 1, hourAngle(from + hours), (hours / 12) * Math.PI * 2]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent={o < 1} opacity={o} />
    </mesh>
  );
};

const ClockTower: React.FC = () => {
  const frame = useCurrentFrame();
  const face = useCanvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = PALETTE.clockFace;
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a2a30";
    ctx.font = "900 64px Impact, 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let h = 1; h <= 12; h++) {
      const a = hourAngle(h);
      ctx.fillText(String(h), 256 + Math.cos(a) * 200, 256 - Math.sin(a) * 200);
    }
  });
  const loja = clamp(track("clock.arcLoja", frame), 0, 1);
  const pad = clamp(track("clock.arcPadaria", frame), 0, 1);
  const ov = clamp(track("clock.overlap", frame), 0, 1.3);
  const time = track("clock.time", frame, 8);
  const hourA = hourAngle(time);
  const minA = hourAngle((time % 1) * 12);
  const red = ov > 0.01 ? 0.75 + 0.25 * pulse(frame, 14) : 0;
  return (
    <group position={CLOCK.base}>
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 4.0, 0.62]} />
        <Mat color={PALETTE.tower} />
      </mesh>
      <mesh position={[0, 4.62, 0]} castShadow>
        <boxGeometry args={[1.56, 1.56, 0.52]} />
        <Mat color={PALETTE.towerTrim} />
      </mesh>
      <mesh position={[0, 5.62, 0]} castShadow>
        <coneGeometry args={[0.95, 0.6, 4]} />
        <Mat color={PALETTE.towerTrim} />
      </mesh>
      <group position={[0, 4.62, 0.265]}>
        <mesh>
          <circleGeometry args={[0.66, 40]} />
          <meshBasicMaterial map={face} toneMapped={false} />
        </mesh>
        {/* pizza do dia: azul = loja (8h–15h), laranja = padaria (14h–20h), vermelho = as duas */}
        <Arc from={8} hours={7 * loja} color={PALETTE.arcLoja} r0={0.1} r1={0.4} z={0.004} o={0.92} />
        <Arc from={14} hours={6 * pad} color={PALETTE.arcPadaria} r0={0.1} r1={0.4} z={0.006} o={0.92} />
        {ov > 0.01 ? <Arc from={14} hours={1} color={PALETTE.overlap} r0={0.08} r1={0.4 + 0.12 * clamp(ov, 0, 1.3)} z={0.01} o={red} /> : null}
        {/* ponteiros */}
        <group position={[0, 0, 0.02]} rotation={[0, 0, hourA]}>
          <mesh position={[0.16, 0, 0]}>
            <boxGeometry args={[0.32, 0.05, 0.01]} />
            <meshBasicMaterial color="#141416" />
          </mesh>
        </group>
        <group position={[0, 0, 0.024]} rotation={[0, 0, minA]}>
          <mesh position={[0.24, 0, 0]}>
            <boxGeometry args={[0.48, 0.03, 0.01]} />
            <meshBasicMaterial color="#141416" />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.03]}>
          <circleGeometry args={[0.04, 12]} />
          <meshBasicMaterial color={PALETTE.negative} />
        </mesh>
      </group>
    </group>
  );
};

/** Base da maquete: laje, calçada, rua com faixa. */
const Ground: React.FC = () => (
  <group>
    <mesh position={[0, -0.2, -0.05]} receiveShadow>
      <boxGeometry args={[8.2, 0.4, 3.9]} />
      <Mat color={PALETTE.slab} />
    </mesh>
    <mesh position={[0, -0.39, -0.05]}>
      <boxGeometry args={[8.5, 0.04, 4.2]} />
      <Mat color={PALETTE.slabEdge} />
    </mesh>
    <mesh position={[0, 0.005, 0.75]} receiveShadow>
      <boxGeometry args={[8.2, 0.01, 0.7]} />
      <Mat color={PALETTE.sidewalk} />
    </mesh>
    <mesh position={[0, 0.006, 1.5]} receiveShadow>
      <boxGeometry args={[8.2, 0.012, 0.8]} />
      <Mat color={PALETTE.street} />
    </mesh>
    {Array.from({ length: 9 }).map((_, i) => (
      <mesh key={i} position={[-3.6 + i * 0.9, 0.014, 1.5]}>
        <boxGeometry args={[0.42, 0.005, 0.06]} />
        <Mat color={PALETTE.stripe} />
      </mesh>
    ))}
  </group>
);

export const Town: React.FC = () => (
  <group>
    <Ground />
    <PhoneShop />
    <Bakery />
    <ClockTower />
    <Basket />
  </group>
);
