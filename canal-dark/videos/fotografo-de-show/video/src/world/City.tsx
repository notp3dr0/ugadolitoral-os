import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { BufferGeometry, CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, RepeatWrapping, Shape, TubeGeometry, Vector3 } from "three";
import { cameraPoseAt } from "../components/CameraController";
import { MATTE, PALETTE } from "../theme";
import { facadeTexture, pixoTexture, canvasTexture, windowsTexture } from "./textures";
import { nightness } from "./time";

// O entorno de São Paulo: rua, calçada de pedra portuguesa, postes com fiação embolada,
// skyline (Copan, MASP, Banespa, antenas vermelhas), pichação no topo dos prédios e garoa de dia.

const sidewalkTex = () =>
  canvasTexture("calcada", 256, 256, (g, w, h) => {
    g.fillStyle = "#cfcac0";
    g.fillRect(0, 0, w, h);
    // pedra portuguesa: manchas pretas em ondas largas (mosaico paulistano)
    g.fillStyle = "#2a2a2c";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      const y0 = (i / 6) * h;
      g.moveTo(0, y0);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, y0 + Math.sin((x / w) * Math.PI * 2 + i) * 12);
      for (let x = w; x >= 0; x -= 8) g.lineTo(x, y0 + 16 + Math.sin((x / w) * Math.PI * 2 + i + 0.6) * 12);
      g.closePath();
      g.fill();
    }
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 1;
    for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 8) g.strokeRect(x + random(`c${x}${y}`) * 2, y, 7, 7);
  });

const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; rot?: [number, number, number]; shadow?: boolean }> = ({ p, s, c, rot, shadow = true }) => (
  <mesh position={p} rotation={rot} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial {...MATTE} color={c} />
  </mesh>
);

const Street: React.FC = () => {
  const tex = useMemo(() => {
    const t = sidewalkTex().clone();
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(14, 1.3);
    t.needsUpdate = true;
    return t;
  }, []);
  return (
    <group>
      {/* chão da cidade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial {...MATTE} color="#55575b" />
      </mesh>
      {/* rua principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -0.1]} receiveShadow>
        <planeGeometry args={[40, 1.8]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.asphalt} />
      </mesh>
      {Array.from({ length: 26 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-19 + i * 1.5, 0.004, -0.1]}>
          <planeGeometry args={[0.6, 0.05]} />
          <meshBasicMaterial color={PALETTE.asphaltLine} />
        </mesh>
      ))}
      {/* faixa de pedestre */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`z${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-1.55, 0.005, -0.85 + i * 0.25]}>
          <planeGeometry args={[0.7, 0.13]} />
          <meshBasicMaterial color="#e9e6df" />
        </mesh>
      ))}
      {/* calçadas */}
      {[
        [-1.5, 1.0],
        [1.2, 0.8],
      ].map(([z, d], i) => (
        <group key={i}>
          <mesh position={[0, 0.03, z]} receiveShadow>
            <boxGeometry args={[40, 0.06, d]} />
            <meshStandardMaterial {...MATTE} color="#cfcac0" map={tex} />
          </mesh>
          <Box p={[0, 0.03, z + (i === 0 ? d / 2 : -d / 2)]} s={[40, 0.07, 0.05]} c={PALETTE.curb} shadow={false} />
        </group>
      ))}
    </group>
  );
};

/** Poste de concreto com luminária e cruzeta. */
const POLES: [number, number][] = [
  [-4.9, -1.08],
  [-1.95, -1.08],
  [2.95, -1.08],
  [5.6, -1.08],
  [-4.9, 0.88],
  [-1.1, 0.88],
  [2.0, 0.88],
  [5.4, 0.88],
];
const POLE_H = 2.7;

const wireGeo = (a: Vector3, b: Vector3, sag: number, seed: string) => {
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= sag;
  mid.x += (random(seed) - 0.5) * 0.15;
  const curve = new CatmullRomCurve3([a, a.clone().lerp(mid, 0.5).setY(lerpY(a, mid, 0.62)), mid, mid.clone().lerp(b, 0.5).setY(lerpY(mid, b, 0.38)), b]);
  return new TubeGeometry(curve, 24, 0.009, 4, false);
};
const lerpY = (a: Vector3, b: Vector3, t: number) => a.y + (b.y - a.y) * t;

const Wires: React.FC = () => {
  const geos = useMemo(() => {
    const out: TubeGeometry[] = [];
    const rows = [POLES.slice(0, 4), POLES.slice(4)];
    for (const row of rows) {
      for (let i = 0; i < row.length - 1; i++) {
        for (let k = 0; k < 4; k++) {
          const y = POLE_H - 0.12 - k * 0.09;
          const a = new Vector3(row[i][0] + (k % 2 ? 0.14 : -0.14), y, row[i][1]);
          const b = new Vector3(row[i + 1][0] + (k % 2 ? 0.14 : -0.14), y - 0.02 * k, row[i + 1][1]);
          out.push(wireGeo(a, b, 0.25 + 0.1 * k + random(`w${i}${k}`) * 0.12, `w${i}${k}`));
        }
      }
    }
    // fios cruzando a rua (as gambiarras de sempre)
    for (let i = 0; i < 4; i++) {
      const a = new Vector3(POLES[i][0], POLE_H - 0.2, POLES[i][1]);
      const b = new Vector3(POLES[4 + ((i + 1) % 4)][0], POLE_H - 0.28, POLES[4 + ((i + 1) % 4)][1]);
      out.push(wireGeo(a, b, 0.35, `x${i}`));
    }
    return out;
  }, []);
  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color="#121214" />
        </mesh>
      ))}
      {/* bolo de fios embolados num poste */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`r${i}`} position={[-1.95, POLE_H - 0.55 - i * 0.03, -1.08]} rotation={[Math.PI / 2 + (i % 3) * 0.3, i * 0.6, 0]}>
          <torusGeometry args={[0.09 + (i % 3) * 0.015, 0.008, 4, 14]} />
          <meshBasicMaterial color="#121214" />
        </mesh>
      ))}
    </group>
  );
};

const Poles: React.FC<{ night: number }> = ({ night }) => (
  <group>
    {POLES.map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <Box p={[0, POLE_H / 2, 0]} s={[0.09, POLE_H, 0.09]} c="#9a978f" />
        <Box p={[0, POLE_H - 0.12, 0]} s={[0.5, 0.05, 0.06]} c="#7d7a73" />
        <mesh position={[0, POLE_H - 0.42, z < 0 ? 0.28 : -0.28]}>
          <boxGeometry args={[0.16, 0.06, 0.26]} />
          <meshStandardMaterial {...MATTE} color="#3a3a3a" emissive="#ffc46b" emissiveIntensity={night * 2.2} />
        </mesh>
        {night > 0.05 ? (
          <mesh position={[0, (POLE_H - 0.45) / 2, z < 0 ? 0.35 : -0.35]}>
            <coneGeometry args={[0.55, POLE_H - 0.45, 16, 1, true]} />
            <meshBasicMaterial color="#ffc46b" transparent opacity={0.07 * night} depthWrite={false} side={DoubleSide} />
          </mesh>
        ) : null}
      </group>
    ))}
  </group>
);

// ---------------------------------------------------------------- skyline
type Tower = { x: number; z: number; w: number; d: number; h: number; wall: string; seed: string; pixo: boolean; antenna: boolean };

const TOWERS: Tower[] = (() => {
  const out: Tower[] = [];
  const walls = [PALETTE.grey1, PALETTE.grey2, PALETTE.grey3, PALETTE.grey4, "#9b958b", "#7e8a8f", "#b0a99c"];
  let n = 0;
  const add = (x: number, z: number, hmin: number, hmax: number) => {
    const seed = `t${n++}`;
    const w = 1.6 + random(seed + "w") * 1.6;
    const d = 1.6 + random(seed + "d") * 1.4;
    const h = hmin + random(seed + "h") * (hmax - hmin);
    out.push({ x, z, w, d, h, wall: walls[Math.floor(random(seed + "c") * walls.length)], seed, pixo: random(seed + "p") < 0.55, antenna: h > 8.5 && random(seed + "a") < 0.7 });
  };
  // fileiras de trás (as mais altas), deixando buracos pros marcos
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 9; i++) {
      const x = -13 + i * 3.25 + (row % 2) * 1.4 + (random(`jx${row}${i}`) - 0.5);
      const z = -6.6 - row * 3.4 + (random(`jz${row}${i}`) - 0.5);
      if (row === 0 && x > -8.2 && x < -2.3) continue; // Copan
      if (row === 0 && x > 2.2 && x < 7.8) continue; // MASP
      add(x, z, 3.5 + row * 2.5, 8 + row * 3.5);
    }
  }
  // laterais
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      const x = side * (9.4 + random(`sx${i}${side}`) * 1.6);
      const z = -4 + i * 2.8;
      add(x, z, 2.8, 7.5);
    }
  }
  return out;
})();

const TowerMesh: React.FC<{ t: Tower; night: number; frame: number }> = ({ t, night, frame }) => {
  const cols = Math.max(3, Math.round(t.w * 3.2));
  const rows = Math.max(4, Math.round(t.h * 2.6));
  const map = facadeTexture(t.seed, cols, rows, t.wall, "#2f3d4a");
  const emissive = windowsTexture(t.seed, cols, rows, 0.32);
  const blink = 0.5 + 0.5 * Math.sin(frame / 9 + t.x);
  return (
    <group position={[t.x, 0, t.z]}>
      <mesh position={[0, t.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t.w, t.h, t.d]} />
        <meshStandardMaterial {...MATTE} color="#ffffff" map={map} emissive="#ffffff" emissiveMap={emissive} emissiveIntensity={night * 1.1} />
      </mesh>
      <mesh position={[0, t.h + 0.05, 0]}>
        <boxGeometry args={[t.w * 0.6, 0.1, t.d * 0.6]} />
        <meshStandardMaterial {...MATTE} color="#555" />
      </mesh>
      {t.pixo ? (
        <mesh position={[0, t.h - 0.55, t.d / 2 + 0.012]}>
          <planeGeometry args={[t.w * 0.92, 0.85]} />
          <meshBasicMaterial map={pixoTexture(t.seed, 2)} transparent depthWrite={false} color={night > 0.5 ? "#2a2a33" : "#ffffff"} />
        </mesh>
      ) : null}
      {t.antenna ? (
        <group position={[0, t.h, 0]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.03, 0.06, 2.2, 5]} />
            <meshStandardMaterial {...MATTE} color="#c9c9c9" />
          </mesh>
          <mesh position={[0, 2.25, 0]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color={blink > 0.5 ? "#ff2a2a" : "#5a1010"} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/** Copan: lâmina ondulada com brises horizontais. */
const Copan: React.FC<{ night: number }> = ({ night }) => {
  const { body, brises } = useMemo(() => {
    const band = (thick: number) => {
      const N = 40;
      const top: [number, number][] = [];
      const bot: [number, number][] = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const x = -3.4 + 6.8 * u;
        const y = 0.75 * Math.sin(u * Math.PI * 1.5 - 0.4);
        const dy = 0.75 * Math.cos(u * Math.PI * 1.5 - 0.4) * ((Math.PI * 1.5) / 6.8);
        const nx = -dy / Math.hypot(1, dy);
        const ny = 1 / Math.hypot(1, dy);
        top.push([x + nx * thick, y + ny * thick]);
        bot.push([x - nx * thick, y - ny * thick]);
      }
      const s = new Shape();
      s.moveTo(...top[0]);
      top.slice(1).forEach((p) => s.lineTo(...p));
      bot.reverse().forEach((p) => s.lineTo(...p));
      s.closePath();
      return s;
    };
    const body = new ExtrudeGeometry(band(0.34), { depth: 8.6, bevelEnabled: false });
    const brises = new ExtrudeGeometry(band(0.39), { depth: 0.045, bevelEnabled: false });
    return { body, brises };
  }, []);
  return (
    <group position={[-5.3, 0, -8.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={body} castShadow receiveShadow>
        <meshStandardMaterial {...MATTE} color="#4a4a4c" emissive="#ffd08a" emissiveIntensity={night * 0.35} />
      </mesh>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} geometry={brises} position={[0, 0, 0.35 + i * 0.28]}>
          <meshStandardMaterial {...MATTE} color={PALETTE.copan} />
        </mesh>
      ))}
    </group>
  );
};

/** MASP: caixa suspensa por duas vigas vermelhas sobre quatro pilares. */
const Masp: React.FC = () => (
  <group position={[5.0, 0, -8.2]}>
    {[-1, 1].map((sz) => (
      <group key={sz} position={[0, 0, sz * 0.95]}>
        <Box p={[-2.5, 1.55, 0]} s={[0.38, 3.1, 0.5]} c={PALETTE.masp} />
        <Box p={[2.5, 1.55, 0]} s={[0.38, 3.1, 0.5]} c={PALETTE.masp} />
        <Box p={[0, 3.05, 0]} s={[5.4, 0.42, 0.5]} c={PALETTE.masp} />
      </group>
    ))}
    <Box p={[0, 2.08, 0]} s={[4.9, 1.45, 1.55]} c="#2b3238" />
    <mesh position={[0, 2.08, 0.79]}>
      <planeGeometry args={[4.7, 1.2]} />
      <meshStandardMaterial {...MATTE} color="#5f7685" roughness={0.3} />
    </mesh>
    <Box p={[0, 0.04, 0]} s={[6.4, 0.08, 3.2]} c="#9c978e" />
  </group>
);

/** Banespa: torre escalonada com mastro. */
const Banespa: React.FC<{ night: number; frame: number }> = ({ night, frame }) => {
  const map = facadeTexture("banespa", 6, 30, "#c8bfae", "#3a4450");
  const em = windowsTexture("banespa", 6, 30, 0.35);
  const blink = Math.sin(frame / 8) > 0;
  return (
    <group position={[0.8, 0, -15.5]}>
      {[
        [3.2, 7, 2.6],
        [2.4, 3.6, 2.0],
        [1.5, 2.2, 1.3],
        [0.8, 1.2, 0.8],
      ].reduce<{ y: number; els: React.ReactNode[] }>(
        (acc, [w, h, d], i) => {
          acc.els.push(
            <mesh key={i} position={[0, acc.y + h / 2, 0]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial {...MATTE} color="#ffffff" map={map} emissive="#ffffff" emissiveMap={em} emissiveIntensity={night} />
            </mesh>,
          );
          acc.y += h;
          return acc;
        },
        { y: 0, els: [] },
      ).els}
      <mesh position={[0, 15.4, 0]}>
        <cylinderGeometry args={[0.04, 0.07, 3.2, 5]} />
        <meshStandardMaterial {...MATTE} color="#d0d0d0" />
      </mesh>
      <mesh position={[0, 17.05, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshBasicMaterial color={blink ? "#ff2a2a" : "#5a1010"} />
      </mesh>
    </group>
  );
};

/** Garoa: riscos finos caindo, só de dia. */
const Garoa: React.FC<{ frame: number; amount: number }> = ({ frame, amount }) => {
  const geo = useMemo(() => new BufferGeometry(), []);
  const N = 420;
  const pos = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) {
    const s = `g${i}`;
    const x = (random(s + "x") - 0.5) * 16;
    const z = (random(s + "z") - 0.5) * 12;
    const speed = 0.16 + random(s + "v") * 0.06;
    const y = 7 - (((frame * speed + random(s + "y") * 7) % 7) + 7) % 7;
    pos.set([x, y, z, x - 0.02, y - 0.28, z], i * 6);
  }
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  if (amount < 0.02) return null;
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#e6eef2" transparent opacity={0.28 * amount} depthWrite={false} />
    </lineSegments>
  );
};

export const City: React.FC = () => {
  const frame = useCurrentFrame();
  const night = nightness(frame);
  return (
    <group>
      <Street />
      <Poles night={night} />
      {/* fiação só nos planos abertos: nos fechados ela risca a frente do assunto */}
      {Math.hypot(...cameraPoseAt(frame).position) > 15 ? <Wires /> : null}
      {TOWERS.map((t) => (
        <TowerMesh key={t.seed} t={t} night={night} frame={frame} />
      ))}
      <Copan night={night} />
      <Masp />
      <Banespa night={night} frame={frame} />
      <Garoa frame={frame} amount={1 - night} />
    </group>
  );
};
