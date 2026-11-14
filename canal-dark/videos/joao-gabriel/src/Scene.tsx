import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame, interpolate, Easing, staticFile } from "remotion";
import { sceneAt } from "./timeline";

const INK = "#0f1020", AMBER = "#ffb020", RED = "#e5484d", MINT = "#4be0b0";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

const foto = new THREE.TextureLoader().load(staticFile("assets/joao.png"));
foto.colorSpace = THREE.SRGBColorSpace;

const flat = (c: string, e = 0) => (
  <meshStandardMaterial color={c} flatShading roughness={0.85} emissive={c} emissiveIntensity={e} />
);

// Cabeça-adesivo: a foto real do João num disco com borda branca. Nunca rosto gerado.
const Cabeca = ({ fone = true }: { fone?: boolean }) => (
  <group>
    <mesh position={[0, 0, -0.03]}><circleGeometry args={[0.6, 48]} /><meshBasicMaterial color="#fff" /></mesh>
    <mesh><circleGeometry args={[0.54, 48]} /><meshBasicMaterial map={foto} toneMapped={false} /></mesh>
    {fone && (<>
      <mesh position={[0, 0.08, -0.05]}><torusGeometry args={[0.66, 0.06, 6, 24, Math.PI]} />{flat("#16172e")}</mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.66, 0.02, 0.02]}><boxGeometry args={[0.16, 0.32, 0.2]} />{flat(AMBER, 0.35)}</mesh>
      ))}
    </>)}
  </group>
);

// O João sentado: camiseta cinza + camisa xadrez (cores da foto), braços no teclado.
const Joao = ({ pos = [0, 0, 0] as [number, number, number], s = 1, slump = 0, digita = 0, f = 0, fone = true }) => {
  const tremor = digita ? Math.sin(f * 1.7) * 0.03 : 0;
  return (
    <group position={pos} scale={s}>
      <mesh position={[0, -0.55, -0.35]}><boxGeometry args={[1.25, 1.6, 0.15]} />{flat("#1a1b30")}</mesh>
      <group rotation={[slump * 0.35, 0, 0]} position={[0, -0.9, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.95, 1.0, 0.45]} />{flat("#4a4b52")}</mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * 0.38, 0.45, 0.05]} castShadow><boxGeometry args={[0.28, 1.02, 0.47]} />{flat("#5d6475")}</mesh>
        ))}
        {[-1, 1].map((k) => (
          <mesh key={`b${k}`} position={[k * 0.42, 0.25 + (k > 0 ? tremor : -tremor), 0.42]} rotation={[1.2, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.75, 0.2]} />{flat("#5d6475")}
          </mesh>
        ))}
        <group position={[0, 1.35 - slump * 0.1, 0.05]} rotation={[0, 0, slump * 0.18]}>
          <Cabeca fone={fone} />
        </group>
      </group>
    </group>
  );
};

const Quarto = ({ noite, tela }: { noite: number; tela: string }) => {
  const ceu = new THREE.Color().lerpColors(new THREE.Color("#7cc0ff"), new THREE.Color("#0a0b24"), noite);
  return (
    <group>
      <mesh position={[0, -1.6, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 12]} />{flat("#1d1f3a")}</mesh>
      <mesh position={[0, 2, -4.2]} receiveShadow><planeGeometry args={[16, 9]} />{flat("#262850")}</mesh>
      <mesh position={[-2.6, 1.9, -4.15]}><planeGeometry args={[1.8, 2.2]} /><meshBasicMaterial color={ceu} /></mesh>
      <mesh position={[-2.6, 1.9, -4.12]}><boxGeometry args={[0.08, 2.2, 0.02]} />{flat("#e8e8ff")}</mesh>
      <mesh position={[-2.6, 1.9, -4.12]}><boxGeometry args={[1.8, 0.08, 0.02]} />{flat("#e8e8ff")}</mesh>
      {/* mesa entre a câmera e o João; monitor de costas pra nós, a luz dele bate no João */}
      <mesh position={[0, -0.75, -1.1]} castShadow receiveShadow><boxGeometry args={[3.6, 0.14, 1.3]} />{flat("#3a2c28")}</mesh>
      <group position={[1.15, -0.2, -0.95]} rotation={[0, -2.6, 0]}>
        <mesh castShadow><boxGeometry args={[1.3, 0.8, 0.08]} />{flat("#121326")}</mesh>
        <mesh position={[0, 0, 0.05]}><planeGeometry args={[1.2, 0.7]} /><meshBasicMaterial color={tela} /></mesh>
        <pointLight color={tela} intensity={4} distance={4} position={[0, 0, 0.5]} />
      </group>
      <mesh position={[-0.2, -0.66, -1.0]}><boxGeometry args={[1.1, 0.05, 0.35]} />{flat("#121326")}</mesh>
    </group>
  );
};

const Latas = ({ n }: { n: number }) => (
  <group>{Array.from({ length: n }).map((_, i) => (
    <mesh key={i} position={[-1.55 + (i % 3) * 0.24, -0.53 + Math.floor(i / 3) * 0.32, -0.75 - (i % 2) * 0.1]} castShadow>
      <cylinderGeometry args={[0.09, 0.09, 0.3, 10]} />{flat(i % 2 ? RED : MINT)}
    </mesh>))}</group>
);

const Relogio = ({ ang }: { ang: number }) => (
  <group position={[2.3, 2.1, -4.1]}>
    <mesh position={[0, 0, -0.01]}><circleGeometry args={[0.62, 32]} /><meshBasicMaterial color={INK} /></mesh>
    <mesh><circleGeometry args={[0.56, 32]} /><meshBasicMaterial color="#fff" /></mesh>
    <mesh rotation={[0, 0, -ang]} position={[0, 0, 0.02]}><planeGeometry args={[0.05, 0.9]} /><meshBasicMaterial color={INK} /></mesh>
    <mesh rotation={[0, 0, -ang / 12]} position={[0, 0, 0.03]}><planeGeometry args={[0.08, 0.55]} /><meshBasicMaterial color={RED} /></mesh>
  </group>
);

const Celular = ({ f }: { f: number }) => (
  <group position={[1.35, 0.9 + Math.sin(f * 0.12) * 0.06, 0.4]} rotation={[0, -0.35, 0.12]}>
    <mesh><boxGeometry args={[0.7, 1.3, 0.08]} />{flat("#121326")}</mesh>
    <mesh position={[0, 0, 0.045]}><planeGeometry args={[0.62, 1.18]} /><meshBasicMaterial color="#e9edf5" /></mesh>
    {[0, 1, 2].map((k) => (
      <mesh key={k} position={[k % 2 ? -0.08 : 0.08, 0.35 - k * 0.28, 0.05]}>
        <planeGeometry args={[0.42, 0.18]} /><meshBasicMaterial color={k === 2 ? MINT : "#c5cbe0"} />
      </mesh>))}
  </group>
);

const Boneco = ({ pos, cor, f, fase = 0, cabeca = "#e8d0b0" }: { pos: [number, number, number]; cor: string; f: number; fase?: number; cabeca?: string }) => (
  <group position={[pos[0], pos[1] + Math.abs(Math.sin(f * 0.25 + fase)) * 0.12, pos[2]]}>
    <mesh position={[0, 0.5, 0]} castShadow><capsuleGeometry args={[0.28, 0.6, 4, 8]} />{flat(cor)}</mesh>
    <mesh position={[0, 1.2, 0]} castShadow><icosahedronGeometry args={[0.3, 0]} />{flat(cabeca)}</mesh>
  </group>
);

const Mapa = ({ t, f }: { t: number; f: number }) => {
  const k = ease(Math.min(1, t * 1.25));
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[8, 8]} />{flat("#1f4a3a")}</mesh>
      {/* três rotas: topo, meio e baixo */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.01, 0]}><planeGeometry args={[0.55, 10]} />{flat("#c9a45c")}</mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.01, 0]}><planeGeometry args={[0.45, 8]} />{flat("#9c8250")}</mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.01, 3.2]}><planeGeometry args={[0.45, 8]} />{flat("#9c8250")}</mesh>
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.005, 0]}><planeGeometry args={[0.4, 10]} />{flat("#2b6f8a")}</mesh>
      {/* a Senna (boneca genérica com a arma) indo sozinha pro meio */}
      <group position={[-2.6 + 2.6 * k, 0, 2.6 - 2.6 * k]} rotation={[0, Math.PI * 0.75, 0]}>
        <Boneco pos={[0, 0, 0]} cor="#e8e8ff" f={f} cabeca="#e8e8ff" />
        <mesh position={[0.45, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.12, 1.3, 0.12]} />{flat(AMBER, 0.5)}</mesh>
      </group>
      {/* o atirador abandonado no bot, sozinho */}
      <group position={[2.4, 0, 3.2]}>
        <Boneco pos={[0, 0, 0]} cor={RED} f={f * 0.2} />
      </group>
      {/* torres */}
      {[[0.9, -0.9], [-3.2, -1.5], [1.5, 3.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]} castShadow><cylinderGeometry args={[0.18, 0.3, 1.2, 6]} />{flat("#5a5f7a")}</mesh>
      ))}
    </group>
  );
};

const Lanterna = ({ f, t }: { f: number; t: number }) => (
  <group position={[0, 0.6, -1.2]} rotation={[0, Math.sin(f * 0.03) * 0.4, Math.sin(f * 0.05) * 0.06]}>
    <mesh position={[0, 1.55, 0]}><torusGeometry args={[0.3, 0.05, 6, 16]} />{flat("#8c91b5")}</mesh>
    <mesh position={[0, 1.2, 0]}><coneGeometry args={[1.0, 0.45, 6]} />{flat("#2d3050")}</mesh>
    <mesh position={[0, -1.2, 0]}><cylinderGeometry args={[0.9, 1.0, 0.25, 6]} />{flat("#2d3050")}</mesh>
    {Array.from({ length: 6 }).map((_, k) => (
      <mesh key={k} position={[Math.cos((k / 6) * Math.PI * 2) * 0.92, 0, Math.sin((k / 6) * Math.PI * 2) * 0.92]}>
        <boxGeometry args={[0.07, 2.3, 0.07]} />{flat("#8c91b5")}
      </mesh>))}
    <mesh><cylinderGeometry args={[0.88, 0.88, 2.2, 6, 1, true]} /><meshStandardMaterial color="#7ee8ff" transparent opacity={0.18} emissive="#7ee8ff" emissiveIntensity={0.6} side={THREE.DoubleSide} /></mesh>
    {/* o João preso lá dentro, encolhido */}
    <group position={[0, -0.1 + Math.sin(f * 0.08) * 0.05, 0]} scale={0.75}>
      <Cabeca fone={false} />
    </group>
    <pointLight color="#7ee8ff" intensity={5 + Math.sin(f * 0.2) * 1.2} distance={6} />
  </group>
);

const Baloes = ({ t }: { t: number }) => (
  <group>
    {[0, 1, 2, 3].map((k) => {
      const e = interpolate(t, [0.1 + k * 0.12, 0.2 + k * 0.12], [0, 1], clamp);
      return (
        <group key={k} position={[k % 2 ? 0.95 : -0.95, 1.9 - k * 0.6, 0.6 + k * 0.05]} scale={e * 0.7} rotation={[0, 0, k % 2 ? 0.06 : -0.06]}>
          <mesh><boxGeometry args={[1.5, 0.48, 0.08]} />{flat(k === 3 ? MINT : "#e9edf5", 0.25)}</mesh>
          <mesh position={[k % 2 ? 0.55 : -0.55, -0.28, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.18, 0.18, 0.08]} />{flat(k === 3 ? MINT : "#e9edf5", 0.25)}</mesh>
        </group>
      );
    })}
  </group>
);

const Ventilador = ({ f }: { f: number }) => (
  <group position={[0, 0.3, -1.4]}>
    <mesh position={[0, 0, -0.12]}><torusGeometry args={[1.0, 0.05, 6, 32]} />{flat("#3a3d5c")}</mesh>
    {[0, 1, 2].map((k) => (
      <mesh key={k} rotation={[0, 0.25, f * 0.55 + (k * Math.PI * 2) / 3]}>
        <boxGeometry args={[0.32, 1.7, 0.03]} />{flat("#9aa0c8", 0.1)}
      </mesh>))}
    <mesh position={[0, 0, 0.05]}><sphereGeometry args={[0.14, 8, 8]} />{flat("#3a3d5c")}</mesh>
    <mesh position={[0, -1.6, -0.12]}><boxGeometry args={[0.1, 2.2, 0.1]} />{flat("#3a3d5c")}</mesh>
  </group>
);

// câmera de cada cena: [de, até, olhando pra]
const CAMS: Record<string, [number[], number[], number[]]> = {
  hook: [[0, 0.75, 0.6], [0, 0.95, 6.6], [0, 0.6, -2.4]],
  atraso: [[-0.5, 0.6, 4.6], [0.4, 0.5, 3.8], [0.3, 0.3, -1.8]],
  senna: [[0.6, 10.5, 7.5], [0.3, 8.6, 5.6], [0.2, 0, 0.6]],
  noite: [[-0.9, 0.7, 5.2], [0.7, 0.5, 4.4], [-0.3, 0.6, -2.4]],
  derrota: [[0, 0.4, 4.2], [0, 0.55, 2.6], [0, 0.35, -2.4]],
  lanterna: [[0, 0.9, 5.6], [0, 0.7, 4.3], [0, 0.6, -1.2]],
  ventilador: [[0, 0.3, 3.4], [0, 0.3, 2.6], [0, 0.3, -1.4]],
  final: [[0, 0.8, 3.0], [0, 2.4, 8.8], [0, 0.0, -1.0]],
};

export const Scene = () => {
  const f = useCurrentFrame();
  const { camera } = useThree();
  const { id, local, len } = sceneAt(f);
  const t = local / len;
  const k = ease(Math.min(1, t));

  const [a, b, look] = CAMS[id];
  const tremor = id === "derrota" && local < 10 ? Math.sin(local * 3) * 0.04 : 0;
  camera.position.set(a[0] + (b[0] - a[0]) * k + tremor, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  camera.lookAt(look[0], look[1], look[2]);

  const noite = id === "noite" ? (1 - Math.cos(t * Math.PI * 6)) / 2 : id === "hook" || id === "atraso" ? 0.15 : 1;
  const tela = id === "derrota" ? RED : AMBER;
  const latas = id === "noite" ? Math.floor(t * 15) : ["derrota", "final"].includes(id) ? 15 : id === "atraso" ? 3 : 1;
  const ang = id === "atraso" ? t * Math.PI * 2 * 3 : id === "noite" ? t * Math.PI * 2 * 12 : 0.8;
  const quarto = ["hook", "atraso", "noite", "derrota", "final"].includes(id);
  const escuro = id === "ventilador";

  return (
    <>
      <color attach="background" args={[INK]} />
      <ambientLight intensity={escuro ? 0.08 : id === "derrota" ? 0.35 : 0.7} />
      <directionalLight position={[3, 6, 5]} intensity={escuro ? 0.1 : id === "derrota" ? 0.5 : 1.3} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <fog attach="fog" args={[INK, 7, 18]} />

      {quarto && (<>
        <Quarto noite={noite} tela={tela} />
        <Latas n={latas} />
        <Relogio ang={ang} />
      </>)}

      {id === "hook" && (<>
        <Joao pos={[0, 0, -2.4]} f={f} digita={1} />
        {/* o "seu" João Gabriel também existe: os outros aparecem no fundo enquanto a câmera recua */}
        {[[-2.2, -3.6], [2.2, -3.6], [-3.6, -5.2], [3.6, -5.2]].map(([x, z], i) => {
          const e = interpolate(t, [0.35 + i * 0.08, 0.5 + i * 0.08], [0, 1], clamp);
          return <Joao key={i} pos={[x, 0, z]} s={e * 0.85} f={f + i * 7} digita={1} />;
        })}
      </>)}

      {id === "atraso" && (<>
        <Joao pos={[0, 0, -2.4]} f={f} digita={1} />
        <Celular f={f} />
      </>)}

      {id === "senna" && <Mapa t={t} f={f} />}

      {id === "noite" && <Joao pos={[0, 0, -2.4]} f={f} digita={1} />}

      {id === "derrota" && <Joao pos={[0, 0, -2.4]} f={f} slump={interpolate(t, [0, 0.25], [0, 1], clamp)} />}

      {id === "lanterna" && (<>
        <Lanterna f={f} t={t} />
        <Baloes t={t} />
      </>)}

      {escuro && (<>
        <Ventilador f={f} />
        {/* fresta de luz da porta */}
        <mesh position={[2.2, 0.4, -2.6]}><planeGeometry args={[0.12, 3]} /><meshBasicMaterial color="#ffd27a" /></mesh>
      </>)}

      {id === "final" && (<>
        <Joao pos={[0, 0, -2.4]} f={f} />
        {Array.from({ length: 7 }).map((_, i) => {
          const ang2 = Math.PI * 0.15 + (i / 6) * Math.PI * 0.7;
          const e = interpolate(t, [0.15 + i * 0.05, 0.3 + i * 0.05], [0, 1], clamp);
          return (
            <group key={i} scale={e}>
              <Boneco pos={[Math.cos(ang2) * 2.2, -1.6, 0.9 - Math.sin(ang2) * 0.9]} cor={[RED, MINT, AMBER, "#7ee8ff", "#b48cff"][i % 5]} f={f} fase={i} />
            </group>
          );
        })}
      </>)}
    </>
  );
};
