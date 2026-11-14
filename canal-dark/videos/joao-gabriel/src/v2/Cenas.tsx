import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame, interpolate, Easing, staticFile, spring } from "remotion";
import { FPS, planoEm, w, fim, VOZ } from "./beats";
import { balao, cabecalhoZap, telaSelecao } from "./texto";

const INK = "#0f1020", AMBER = "#ffb020", RED = "#e5484d", MINT = "#4be0b0";
const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.out(Easing.cubic);

const foto = new THREE.TextureLoader().load(staticFile("assets/joao.png"));
foto.colorSpace = THREE.SRGBColorSpace;

const flat = (c: string, e = 0) => <meshStandardMaterial color={c} flatShading roughness={0.85} emissive={c} emissiveIntensity={e} />;

const Cabeca = ({ fone = true }: { fone?: boolean }) => (
  <group>
    <mesh position={[0, 0, -0.03]}><circleGeometry args={[0.6, 48]} /><meshBasicMaterial color="#fff" /></mesh>
    <mesh><circleGeometry args={[0.54, 48]} /><meshBasicMaterial map={foto} toneMapped={false} /></mesh>
    {fone && (<>
      <mesh position={[0, 0.08, -0.05]}><torusGeometry args={[0.66, 0.06, 6, 24, Math.PI]} />{flat("#16172e")}</mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.66, 0.02, 0.02]}><boxGeometry args={[0.16, 0.32, 0.2]} />{flat(AMBER, 0.35)}</mesh>)}
    </>)}
  </group>
);

const Joao = ({ f, digita = false, fone = true }: { f: number; digita?: boolean; fone?: boolean }) => {
  const tr = digita ? Math.sin(f * 1.9) * 0.035 : 0;
  return (
    <group>
      <mesh position={[0, -0.45, 0]} castShadow><boxGeometry args={[0.95, 1.0, 0.45]} />{flat("#4a4b52")}</mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.38, -0.45, 0.05]} castShadow><boxGeometry args={[0.28, 1.02, 0.47]} />{flat("#5d6475")}</mesh>)}
      {[-1, 1].map((k) => (
        <mesh key={`b${k}`} position={[k * 0.42, -0.65 + (k > 0 ? tr : -tr), 0.42]} rotation={[1.2, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.75, 0.2]} />{flat("#5d6475")}
        </mesh>))}
      <group position={[0, 0.45, 0.05]}><Cabeca fone={fone} /></group>
    </group>
  );
};

const Amigo = ({ pos, cor, olhaPara, f, fase }: { pos: [number, number, number]; cor: string; olhaPara: number; f: number; fase: number }) => (
  <group position={pos} rotation={[0, olhaPara, 0]}>
    <mesh position={[0, 0.5 + Math.sin(f * 0.15 + fase) * 0.02, 0]} castShadow><capsuleGeometry args={[0.32, 0.7, 4, 8]} />{flat(cor)}</mesh>
    <mesh position={[0, 1.3, 0]} castShadow><icosahedronGeometry args={[0.33, 0]} />{flat("#e8d0b0")}</mesh>
    <mesh position={[0, 1.3, 0.3]}><boxGeometry args={[0.3, 0.06, 0.05]} />{flat(INK)}</mesh>
  </group>
);

// ---------- plano 1: a mesa do bar, todo grupo tem um ----------
const Bar = ({ f, t }: { f: number; t: number }) => {
  const tJ = w("h1", 6);
  const cai = spring({ frame: f - Math.round(tJ * FPS), fps: FPS, config: { damping: 11, stiffness: 160 } });
  const olhar = interpolate(t, [tJ + 0.1, tJ + 0.4], [0, 1], C);
  const amigos: [number, number, string][] = [[-2.0, 0.6, RED], [-1.3, -0.9, MINT], [1.3, -0.9, "#7ee8ff"], [2.0, 0.6, "#b48cff"]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><circleGeometry args={[9, 32]} />{flat("#2a1f2e")}</mesh>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow><cylinderGeometry args={[1.25, 1.25, 0.12, 24]} />{flat("#6b4a35")}</mesh>
      <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.12, 0.2, 0.85, 8]} />{flat("#3a2c28")}</mesh>
      {[[-0.5, 0.2], [0.4, -0.3], [0.1, 0.5], [-0.2, -0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.08, z]} castShadow><cylinderGeometry args={[0.1, 0.08, 0.34, 10]} />{flat(i % 2 ? AMBER : "#f2e3c6", 0.15)}</mesh>))}
      {amigos.map(([x, z, cor], i) => {
        const base = Math.atan2(-x, -z);
        const paraJoao = Math.atan2(0 - x, -1.5 - z);
        return <Amigo key={i} pos={[x, 0, z]} cor={cor} f={f} fase={i} olhaPara={base + (paraJoao - base) * olhar} />;
      })}
      {/* o lugar do João, no fundo do meio; ele cai do céu na palavra "João" */}
      <mesh position={[0, 0.45, -1.75]} castShadow><boxGeometry args={[0.8, 0.9, 0.2]} />{flat("#1a1b30")}</mesh>
      <group position={[0, 1.3 + (1 - cai) * 4, -1.5]}>
        <Joao f={f} />
      </group>
      <spotLight position={[0, 6, -1.5]} target-position={[0, 0, -1.5]} angle={0.35} penumbra={0.4}
        intensity={t > tJ ? 60 : 0} color="#fff3d0" castShadow />
      <mesh position={[0, 3.6, -1.5]} visible={t > tJ}>
        <coneGeometry args={[1.4, 5, 24, 1, true]} />
        <meshBasicMaterial color="#fff3d0" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ---------- plano 2: no PC ----------
const PC = ({ f }: { f: number }) => (
  <group>
    <mesh position={[0, 0, -1.5]}><planeGeometry args={[14, 10]} />{flat("#262850")}</mesh>
    <group position={[0, 0.1, 0]}><Joao f={f} digita /></group>
    <mesh position={[0, -0.85, 0.75]} castShadow><boxGeometry args={[3, 0.12, 1]} />{flat("#3a2c28")}</mesh>
    <group position={[0.95, -0.3, 0.75]} rotation={[0, -2.5, 0]}>
      <mesh><boxGeometry args={[1.1, 0.7, 0.08]} />{flat("#121326")}</mesh>
      <pointLight color={AMBER} intensity={5} distance={4} position={[0, 0, 0.6]} />
    </group>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[-1.1 + i * 0.22, -0.62, 0.7]}><cylinderGeometry args={[0.09, 0.09, 0.3, 10]} />{flat(i % 2 ? RED : MINT)}</mesh>))}
  </group>
);

// ---------- plano 3: a tela de seleção ----------
const Tela = () => {
  const tex = useMemo(() => telaSelecao(), []);
  return (
    <group>
      <mesh><boxGeometry args={[3.3, 2.15, 0.1]} />{flat("#121326")}</mesh>
      <mesh position={[0, 0, 0.06]}><planeGeometry args={[3.1, 1.96]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
};

// ---------- planos 4 e 5: o grupo do zap ----------
const Balao = ({ tex, aspecto, y, meu, aparece, f }: { tex: THREE.Texture; aspecto: number; y: number; meu: boolean; aparece: number; f: number }) => {
  const s = spring({ frame: f - aparece, fps: FPS, config: { damping: 12, stiffness: 220 } });
  const largura = 1.75;
  return (
    <mesh position={[meu ? 0.15 : -0.15, y, 0.07]} scale={[s, s, 1]}>
      <planeGeometry args={[largura, largura / aspecto]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
};

const Zap = ({ f, tarde }: { f: number; tarde: boolean }) => {
  const cab = useMemo(() => [cabecalhoZap("ROLÊ HOJE", "18:00"), cabecalhoZap("ROLÊ HOJE", "21:07")], []);
  const b = useMemo(() => ({
    cade: balao("cadê vc?", false, "17:58", "Lucas"),
    chego: balao("chego em 10 min", true, "18:00"),
    q: balao("???", false, "20:12", "Bia"),
    mano: balao("mano", false, "20:48", "Lucas"),
    morreu: balao("MORREU?", false, "21:07", "Davi"),
  }), []);
  const fr = (s: number) => Math.round(s * FPS);
  const sobe = tarde ? 0.75 : 0;
  return (
    <group>
      <mesh><boxGeometry args={[2.3, 4.4, 0.12]} />{flat("#121326")}</mesh>
      <mesh position={[0, 0, 0.065]}><planeGeometry args={[2.15, 4.25]} /><meshBasicMaterial color="#efe7de" /></mesh>
      <mesh position={[0, 1.83, 0.08]}><planeGeometry args={[2.15, 0.62]} /><meshBasicMaterial map={cab[tarde ? 1 : 0]} toneMapped={false} /></mesh>
      <group position={[0, sobe, 0]}>
        <Balao {...b.cade} y={1.05} meu={false} aparece={-99} f={f} />
        <Balao {...b.chego} y={0.55} meu aparece={tarde ? -99 : fr(w("a1", 4))} f={f} />
        {tarde && (<>
          <Balao {...b.q} y={-0.05} meu={false} aparece={fr(fim("a2") + 0.05)} f={f} />
          <Balao {...b.mano} y={-0.6} meu={false} aparece={fr(fim("a2") + 0.3)} f={f} />
          <Balao {...b.morreu} y={-1.15} meu={false} aparece={fr(fim("a2") + 0.52)} f={f} />
        </>)}
      </group>
    </group>
  );
};

// ---------- câmera e montagem dos planos ----------
export const Cenas = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const { camera } = useThree();
  const p = planoEm(t);
  const k = p.local / p.len;

  // cada plano: câmera com intenção; tremor só no impacto
  let pos: [number, number, number] = [0, 0, 5], alvo: [number, number, number] = [0, 0, 0];
  const impacto = (t0: number) => { const d = t - t0; return d > 0 && d < 0.2 ? Math.sin(d * 90) * 0.05 * (1 - d / 0.2) : 0; };
  if (p.id === "bar") {
    const tJ = w("h1", 6);
    const empurra = easeOut(interpolate(t, [tJ + 0.15, tJ + 0.6], [0, 1], C));
    const z = interpolate(t, [0, tJ], [10.5, 9.2], C) - empurra * 4.6;
    pos = [0, 4.2 - empurra * 2.2 + impacto(tJ), z]; alvo = [0, 0.6 + empurra * 0.9, -1.0];
  } else if (p.id === "pc") {
    pos = [0.25, 0.2, 3.6 - k * 0.5]; alvo = [0, -0.05, 0];
  } else if (p.id === "tela") {
    pos = [impacto(p.de), -0.55, 6.6 - easeOut(Math.min(1, k * 2)) * 0.6]; alvo = [0, -0.55, 0];
  } else if (p.id === "zap") {
    pos = [0.15 - k * 0.3, -0.3, 7.0 - k * 0.4]; alvo = [0, -0.3, 0];
  } else {
    pos = [impacto(p.de), -0.3, 6.8 - k * 0.3]; alvo = [0, -0.3, 0];
  }
  camera.position.set(...pos);
  camera.lookAt(...alvo);

  return (
    <>
      <color attach="background" args={[INK]} />
      <ambientLight intensity={p.id === "bar" ? 0.55 : 0.75} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      {p.id === "bar" && <Bar f={f} t={t} />}
      {p.id === "pc" && <PC f={f} />}
      {p.id === "tela" && <Tela />}
      {p.id === "zap" && <group rotation={[0, 0.08 - k * 0.12, -0.03]}><Zap f={f} tarde={false} /></group>}
      {p.id === "zap-tarde" && <group rotation={[0, -0.06, 0.03]}><Zap f={f} tarde /></group>}
    </>
  );
};

export { VOZ };
