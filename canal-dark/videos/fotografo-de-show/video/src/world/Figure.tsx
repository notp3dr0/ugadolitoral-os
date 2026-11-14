import { useCurrentFrame } from "remotion";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, rand } from "../utils/animation";

// Boneco low-poly de peças (~0,95 u de altura). Um só rig pra todo mundo: o Você, o produtor,
// a plateia, o MC no palco e os atendentes. Poses são funções puras do frame e das props.

export type FigureVariant = "hero" | "crowd" | "worker" | "rapper" | "produtor" | "produtor2" | "cashier";

export type HeroState = {
  outfit: number; // 0 casual, 1 padeiro, 2 headset
  hasCamera: number;
  lanyards: number;
  fatigue: number;
  hope: number; // 1 cabeça erguida, 0 cabisbaixo
  shoot: number; // câmera no rosto
  lift: number; // câmera erguida acima da cabeça
  edit: number; // digitando no notebook (sentado)
  walk: number; // fase da caminhada
  walkAmt: number; // 0 parado, 1 andando
};

const DEFAULT_HERO: HeroState = { outfit: 0, hasCamera: 0, lanyards: 0, fatigue: 0, hope: 1, shoot: 0, lift: 0, edit: 0, walk: 0, walkAmt: 0 };

const TOPS = ["#e3262f", "#2b6fe8", "#f2f0eb", "#1fb257", "#f6c518", "#8a3ab9", "#222", "#f08a2a"];
const LANYARD = ["#e3262f", "#f6c518", "#2b6fe8", "#1fb257", "#f08a2a", "#ffffff"];

const M: React.FC<{ c: string; e?: string; ei?: number }> = ({ c, e, ei = 0 }) => <meshStandardMaterial {...MATTE} color={c} emissive={e ?? "#000"} emissiveIntensity={ei} />;

const Arm: React.FC<{ side: 1 | -1; rotX: number; rotZ: number; color: string; children?: React.ReactNode }> = ({ side, rotX, rotZ, color, children }) => (
  <group position={[side * 0.165, 0.69, 0]} rotation={[rotX, 0, side * rotZ]}>
    <mesh position={[0, -0.13, 0]} castShadow>
      <capsuleGeometry args={[0.042, 0.2, 3, 6]} />
      <M c={color} />
    </mesh>
    <mesh position={[0, -0.27, 0]}>
      <sphereGeometry args={[0.042, 6, 5]} />
      <M c={PALETTE.skin} />
    </mesh>
    {children}
  </group>
);

const Camera: React.FC<{ flashOn?: number }> = ({ flashOn = 0 }) => (
  <group>
    <mesh castShadow>
      <boxGeometry args={[0.15, 0.095, 0.075]} />
      <M c="#121214" />
    </mesh>
    <mesh position={[0.02, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.038, 0.042, 0.075, 10]} />
      <M c="#1d1d20" />
    </mesh>
    <mesh position={[0.02, 0, 0.104]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.004, 10]} />
      <meshStandardMaterial color="#3b5a7a" roughness={0.1} metalness={0.4} />
    </mesh>
    <mesh position={[-0.045, 0.065, 0.0]}>
      <boxGeometry args={[0.04, 0.04, 0.05]} />
      <M c="#1a1a1a" e="#ffffff" ei={flashOn * 6} />
    </mesh>
  </group>
);

export const Figure: React.FC<{ position: [number, number, number]; yaw: number; variant: FigureVariant; seed: string; bounce?: number; hero?: Partial<HeroState>; flash?: number }> = ({
  position,
  yaw,
  variant,
  seed,
  bounce = 0,
  hero,
  flash = 0,
}) => {
  const frame = useCurrentFrame();
  const h = { ...DEFAULT_HERO, ...hero };
  const isHero = variant === "hero";
  const phase = rand(seed) * 10;
  // pulo da plateia/MC no ritmo (~88 bpm)
  const beat = bounce > 0 ? Math.max(0, Math.sin((frame / 30) * Math.PI * 2 * (88 / 60) * 0.5 + phase)) : 0;
  const jumpY = variant === "crowd" ? beat * 0.08 * clamp(bounce, 0, 1) : variant === "rapper" ? beat * 0.03 : 0;
  const top = isHero
    ? h.outfit === 1 ? "#f4f2ec" : h.outfit === 2 ? "#3b4a5e" : PALETTE.hoodie
    : variant === "crowd"
      ? TOPS[Math.floor(rand(seed + "t") * TOPS.length)]
      : variant === "worker"
        ? "#3b4a5e"
        : variant === "cashier"
          ? "#1f3a8a"
          : variant === "rapper"
            ? "#e3262f"
            : "#f2f0eb";
  const legs = variant === "produtor" || variant === "produtor2" ? "#1a1a1a" : PALETTE.jeans;
  const skin = variant === "crowd" ? ["#b57852", "#8a5a3a", "#e0b48c", "#6b4329"][Math.floor(rand(seed + "s") * 4)] : variant === "produtor" ? "#d8a47c" : PALETTE.skin;

  // caminhada
  const swing = Math.sin(h.walk) * 0.55 * h.walkAmt;
  const bob = Math.abs(Math.sin(h.walk)) * 0.025 * h.walkAmt;
  // postura de cansaço / esperança
  const slump = isHero ? h.fatigue * 0.12 + (1 - h.hope) * 0.1 : 0;
  const headDown = isHero ? (1 - h.hope) * 0.45 + h.fatigue * 0.08 : 0;
  const sit = isHero ? clamp(h.edit, 0, 1) : 0;

  // braços: padrão relaxado; plateia com braço pra cima; poses do herói
  let armL = { x: swing, z: 0.12 };
  let armR = { x: -swing, z: 0.12 };
  if (variant === "crowd") {
    const up = rand(seed + "u") < 0.45 ? 1 : 0;
    armR = { x: -2.6 * up - beat * 0.3 * up, z: 0.2 };
    armL = { x: 0, z: 0.15 };
  } else if (variant === "rapper") {
    armR = { x: -1.9 - beat * 0.5, z: 0.3 };
    armL = { x: -0.8 + Math.sin(frame / 7) * 0.3, z: 0.5 };
  } else if (variant === "produtor" || variant === "produtor2") {
    armR = { x: -1.3, z: 0.25 };
  } else if (variant === "worker") {
    armL = { x: -1.1, z: 0.1 };
    armR = { x: -1.1, z: 0.1 };
  }
  if (isHero) {
    const shoot = clamp(h.shoot, 0, 1);
    const lift = clamp(h.lift, 0, 1);
    const type = clamp(h.edit, 0, 1);
    armL = { x: lerp(lerp(armL.x, -1.45, shoot), -2.9, lift), z: lerp(lerp(armL.z, -0.35, shoot), 0.05, lift) };
    armR = { x: lerp(lerp(armR.x, -1.45, shoot), -2.9, lift), z: lerp(lerp(armR.z, -0.35, shoot), 0.05, lift) };
    if (type > 0) {
      const tap = Math.sin(frame * 1.7) * 0.12;
      armL = { x: -1.2 + tap, z: 0.05 };
      armR = { x: -1.2 - tap, z: 0.05 };
    }
  }

  const camAt: [number, number, number] = h.lift > 0.02
    ? [0, lerp(0.62, 1.16, clamp(h.lift, 0, 1)), lerp(0.15, 0.16, clamp(h.lift, 0, 1))]
    : [0, lerp(0.6, 0.87, clamp(h.shoot, 0, 1)), lerp(0.15, 0.19, clamp(h.shoot, 0, 1))];

  return (
    <group position={[position[0], position[1] + jumpY + bob - sit * 0.2, position[2]]} rotation={[0, (yaw * Math.PI) / 180, 0]}>
      {/* pernas */}
      {[1, -1].map((s) => (
        <group key={s} position={[s * 0.065, 0.36, 0]} rotation={[sit > 0 ? -1.4 * sit : s * swing, 0, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <boxGeometry args={[0.095, 0.34, 0.1]} />
            <M c={legs} />
          </mesh>
          <mesh position={[0, -0.335, 0.03]}>
            <boxGeometry args={[0.1, 0.05, 0.16]} />
            <M c={PALETTE.shoe} />
          </mesh>
        </group>
      ))}
      {sit > 0 ? (
        <mesh position={[0, 0.17, -0.05]}>
          <boxGeometry args={[0.28, 0.04, 0.28]} />
          <M c="#333" />
        </mesh>
      ) : null}
      <group rotation={[slump, 0, 0]} position={[0, 0, 0]}>
        {/* tronco */}
        <mesh position={[0, 0.54, 0]} castShadow>
          <capsuleGeometry args={[0.135, 0.2, 4, 8]} />
          <M c={top} />
        </mesh>
        {isHero && h.outfit === 0 ? (
          <mesh position={[0, 0.74, -0.07]} rotation={[0.4, 0, 0]}>
            <torusGeometry args={[0.1, 0.035, 5, 10]} />
            <M c={top} />
          </mesh>
        ) : null}
        {isHero && h.outfit === 1 ? (
          <mesh position={[0, 0.5, 0.125]}>
            <boxGeometry args={[0.22, 0.3, 0.02]} />
            <M c="#ffffff" />
          </mesh>
        ) : null}
        {/* corrente dourada */}
        {variant === "produtor" || variant === "produtor2" || variant === "rapper" ? (
          <mesh position={[0, 0.66, 0.06]} rotation={[1.2, 0, 0]}>
            <torusGeometry args={[0.09, 0.012, 5, 14]} />
            <meshStandardMaterial color="#e8b93a" metalness={0.8} roughness={0.25} />
          </mesh>
        ) : null}
        {/* credenciais */}
        {isHero
          ? Array.from({ length: Math.max(0, Math.floor(h.lanyards + 0.001)) }, (_, i) => (
              <group key={i} position={[(i - 2.5) * 0.028, 0, 0.135 + i * 0.004]}>
                <mesh position={[0, 0.6, 0]} rotation={[0, 0, (i - 2.5) * 0.05]}>
                  <boxGeometry args={[0.014, 0.2, 0.006]} />
                  <M c={LANYARD[i % LANYARD.length]} />
                </mesh>
                <mesh position={[0, 0.47 - i * 0.012, 0.004]} rotation={[0, 0, (i - 2.5) * 0.08]}>
                  <boxGeometry args={[0.075, 0.1, 0.006]} />
                  <M c="#ffffff" />
                </mesh>
                <mesh position={[0, 0.49 - i * 0.012, 0.008]} rotation={[0, 0, (i - 2.5) * 0.08]}>
                  <boxGeometry args={[0.06, 0.025, 0.002]} />
                  <M c={LANYARD[i % LANYARD.length]} />
                </mesh>
              </group>
            ))
          : null}
        {/* braços */}
        <Arm side={-1} rotX={armL.x} rotZ={armL.z} color={top} />
        <Arm side={1} rotX={armR.x} rotZ={armR.z} color={top}>
          {variant === "rapper" ? (
            <mesh position={[0, -0.3, 0.03]}>
              <capsuleGeometry args={[0.02, 0.07, 3, 6]} />
              <M c="#111" />
            </mesh>
          ) : null}
          {variant === "produtor" || variant === "produtor2" ? (
            <mesh position={[0, -0.3, 0.02]}>
              <boxGeometry args={[0.05, 0.09, 0.012]} />
              <M c="#111" e="#6fb6ff" ei={0.6} />
            </mesh>
          ) : null}
        </Arm>
        {/* câmera do herói */}
        {isHero && h.hasCamera > 0.5 ? (
          <group>
            {h.shoot < 0.5 && h.lift < 0.05 ? (
              <mesh position={[0, 0.68, 0.11]} rotation={[0.25, 0, 0]}>
                <torusGeometry args={[0.1, 0.008, 4, 14, Math.PI]} />
                <M c="#111" />
              </mesh>
            ) : null}
            <group position={camAt}>
              <Camera flashOn={flash} />
            </group>
          </group>
        ) : null}
        {/* cabeça */}
        <group position={[0, 0.865, 0]} rotation={[headDown, 0, 0]}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.135, 1]} />
            <M c={skin} />
          </mesh>
          {/* cabelo / boné / touca */}
          {isHero && h.outfit === 1 ? (
            <group position={[0, 0.12, 0]}>
              <mesh>
                <cylinderGeometry args={[0.1, 0.11, 0.1, 10]} />
                <M c="#ffffff" />
              </mesh>
              <mesh position={[0, 0.08, 0]}>
                <sphereGeometry args={[0.12, 8, 6]} />
                <M c="#ffffff" />
              </mesh>
            </group>
          ) : variant === "rapper" || variant === "produtor2" ? (
            <group>
              <mesh position={[0, 0.06, 0]}>
                <sphereGeometry args={[0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <M c={variant === "rapper" ? "#111" : "#f6c518"} />
              </mesh>
              <mesh position={[0, 0.06, variant === "rapper" ? -0.13 : 0.13]}>
                <boxGeometry args={[0.2, 0.02, 0.12]} />
                <M c={variant === "rapper" ? "#111" : "#f6c518"} />
              </mesh>
            </group>
          ) : (
            <mesh position={[0, 0.035, -0.015]}>
              <sphereGeometry args={[0.142, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
              <M c={variant === "crowd" ? ["#141414", "#5a3a1e", "#d9b25a", "#141414"][Math.floor(rand(seed + "h") * 4)] : PALETTE.hair} />
            </mesh>
          )}
          {/* olhos */}
          {variant === "produtor" || variant === "produtor2" ? (
            <mesh position={[0, 0.015, 0.118]}>
              <boxGeometry args={[0.17, 0.045, 0.03]} />
              <meshStandardMaterial color="#050505" roughness={0.15} metalness={0.4} />
            </mesh>
          ) : (
            [1, -1].map((s) => (
              <group key={s}>
                <mesh position={[s * 0.047, 0.012, 0.122]}>
                  <sphereGeometry args={[0.017, 6, 5]} />
                  <M c="#111" />
                </mesh>
                {isHero && h.fatigue > 0.05 ? (
                  <mesh position={[s * 0.047, -0.018, 0.124]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.045, 0.014, 0.01]} />
                    <meshStandardMaterial color="#3b2a40" transparent opacity={clamp(h.fatigue, 0, 1) * 0.9} />
                  </mesh>
                ) : null}
              </group>
            ))
          )}
          {/* boca */}
          <mesh position={[0, -0.06, 0.12]}>
            <boxGeometry args={[0.05, 0.01, 0.01]} />
            <M c="#4a2a22" />
          </mesh>
          {/* headset */}
          {(isHero && h.outfit === 2) || variant === "worker" ? (
            <group>
              <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.01, 0]}>
                <torusGeometry args={[0.145, 0.012, 4, 14, Math.PI]} />
                <M c="#222" />
              </mesh>
              <mesh position={[0.145, -0.01, 0]}>
                <boxGeometry args={[0.03, 0.07, 0.07]} />
                <M c="#222" />
              </mesh>
              <mesh position={[0.1, -0.07, 0.08]} rotation={[0, -0.7, 0]}>
                <boxGeometry args={[0.012, 0.012, 0.12]} />
                <M c="#222" />
              </mesh>
            </group>
          ) : null}
        </group>
      </group>
    </group>
  );
};
