import { useCurrentFrame } from "remotion";
import { impulse, isVisible, track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, rand, smoothstep, type Vec3 } from "../utils/animation";
import { Mat } from "./materials";
import { animStart, EAR, handPose, mosquitoPos, outerZ, racketPose, racketToWorld, sceneIndex, v3 } from "./rig";

// Efeitos que explicam o fenômeno (nunca só enfeite): o ar empurrado pela mão, o ar que atravessa a malha,
// o arco que fecha o circuito pelo mosquito, o estalo, a fumaça e o choque no dedo.

const Dot: React.FC<{ p: Vec3; r: number; color: string; o?: number }> = ({ p, r, color, o = 1 }) => (
  <mesh position={p}>
    <sphereGeometry args={[r, 6, 5]} />
    <meshBasicMaterial color={color} transparent opacity={o} toneMapped={false} depthWrite={false} />
  </mesh>
);

const bez = (a: Vec3, b: Vec3, c: Vec3, t: number): Vec3 => v3.lerp(v3.lerp(a, b, t), v3.lerp(b, c, t), t);

/** Cena 2: a mão empurra uma onda de ar que carrega o mosquito. Cena 3: o ar atravessa a malha. */
const AirWave: React.FC<{ frame: number }> = ({ frame }) => {
  const i = sceneIndex(frame);
  const out: React.ReactNode[] = [];
  if (i === 1) {
    const prog = track("airWave.progress", frame);
    if (prog <= 0.001) return null;
    const hand = handPose(frame).position;
    const fade = 1 - clamp((prog - 0.85) / 0.15, 0, 1);
    for (let k = 0; k < 26; k++) {
      const u = (k / 26 + frame * 0.025) % 1;
      const lane = (rand(`air${k}`) - 0.5) * 0.35;
      const p = bez(v3.add(hand, [0.1, lane, 0.08]), v3.add(EAR, [0.05, 0.15 + lane, 0.1]), [0.0 + lane, 1.6, 0.7], u * prog);
      out.push(<Dot key={k} p={p} r={0.022} color="#bfe9ff" o={0.75 * fade * (1 - u * 0.6)} />);
    }
  } else if (i === 2) {
    const t = track("airWave.through", frame);
    if (t <= 0.001 || t >= 0.999) return null;
    const head = racketToWorld(racketPose(frame), [0, 0.86, 0]);
    for (let k = 0; k < 24; k++) {
      const u = (k / 24 + frame * 0.03) % 1;
      const ox = (rand(`thr${k}`) - 0.5) * 0.9;
      const oy = (rand(`thy${k}`) - 0.5) * 1.1;
      const p: Vec3 = v3.add(head, [ox - 0.9 + u * 1.8, oy, -0.1 + 0.2 * Math.sin(u * 6)]);
      out.push(<Dot key={k} p={p} r={0.02} color="#bfe9ff" o={0.7 * Math.sin(t * Math.PI)} />);
    }
  }
  return <group>{out}</group>;
};

/** Polilinha em zigue-zague (raio), determinística por frame. */
const Bolt: React.FC<{ a: Vec3; b: Vec3; seed: string; color: string; r?: number }> = ({ a, b, seed, color, r = 0.008 }) => {
  const pts: Vec3[] = [a];
  const n = 6;
  for (let k = 1; k < n; k++) {
    const p = v3.lerp(a, b, k / n);
    pts.push(v3.add(p, [(rand(`${seed}x${k}`) - 0.5) * 0.06, (rand(`${seed}y${k}`) - 0.5) * 0.06, (rand(`${seed}z${k}`) - 0.5) * 0.03]));
  }
  pts.push(b);
  return (
    <group>
      {pts.slice(1).map((p, k) => {
        const q = pts[k];
        const mid = v3.lerp(q, p, 0.5);
        const d = v3.sub(p, q);
        const len = v3.len(d);
        // orienta um cilindro fino entre q e p
        const yaw = Math.atan2(d[0], d[2]);
        const pitch = Math.acos(clamp(d[1] / (len || 1), -1, 1));
        return (
          <mesh key={k} position={mid} rotation={[pitch, yaw, 0, "YXZ"]}>
            <cylinderGeometry args={[r, r, len, 4]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Cena 9: o mosquito fecha o circuito entre a rede do meio e a de fora; estalo, faísca e fumaça. */
const Zap: React.FC<{ frame: number }> = ({ frame }) => {
  const i = sceneIndex(frame);
  if (i !== 8 && i !== 9) return null;
  const closed = track("circuit.closed", frame);
  const burst = track("spark.burst", frame);
  const pose = racketPose(frame);
  const m = mosquitoPos(frame);
  const out: React.ReactNode[] = [];
  const burstStart = animStart("spark.burst");
  if (i === 8 && closed > 0.05 && frame < burstStart) {
    const mid = racketToWorld(pose, [m[0] - pose.position[0], m[1] - pose.position[1], 0]);
    const outer = racketToWorld(pose, [m[0] - pose.position[0], m[1] - pose.position[1], outerZ(frame)]);
    const s = Math.floor(frame / 2);
    out.push(<Bolt key="b1" a={mid} b={m} seed={`z1-${s}`} color="#9fe8ff" r={0.006 + 0.006 * closed} />);
    out.push(<Bolt key="b2" a={m} b={outer} seed={`z2-${s}`} color="#9fe8ff" r={0.006 + 0.006 * closed} />);
    for (let k = 0; k < 6; k++) {
      const u = (k / 6 + frame * 0.08) % 1;
      out.push(<Dot key={`c${k}`} p={u < 0.5 ? v3.lerp(mid, m, u * 2) : v3.lerp(m, outer, u * 2 - 1)} r={0.012} color="#fff1a8" o={closed} />);
    }
  }
  if (burst > 0.001 && burst < 0.999) {
    for (let k = 0; k < 16; k++) {
      const dir: Vec3 = [rand(`sp${k}x`) - 0.5, rand(`sp${k}y`) - 0.3, rand(`sp${k}z`) - 0.5];
      const n = v3.len(dir) || 1;
      const p = v3.add(m, v3.scale(dir, (0.45 * smoothstep(burst)) / n));
      out.push(<Dot key={`s${k}`} p={p} r={0.018 * (1 - burst) + 0.004} color={k % 3 ? PALETTE.spark : "#ffffff"} />);
    }
    out.push(<Dot key="flash" p={m} r={0.22 * (1 - burst)} color="#ffffff" o={1 - burst} />);
  }
  // fumacinha que sobe depois do estalo
  const age = frame - burstStart;
  if (age > 0 && age < 110) {
    for (let k = 0; k < 6; k++) {
      const a = age - k * 8;
      if (a <= 0) continue;
      const t = a / 80;
      if (t >= 1) continue;
      const p = v3.add(m, [Math.sin(k * 2.1 + a * 0.05) * 0.08, 0.06 + t * 0.6, 0]);
      out.push(
        <mesh key={`f${k}`} position={p}>
          <sphereGeometry args={[0.035 + t * 0.08, 7, 5]} />
          <meshStandardMaterial color="#8d8a86" transparent opacity={0.55 * (1 - t)} depthWrite={false} roughness={1} flatShading />
        </mesh>,
      );
    }
  }
  // cena 10: faisquinha entre o dedo e a rede
  const small = impulse("spark.small", frame);
  if (i === 9 && small > 0.01 && small < 0.999) {
    const tip = v3.add(handPose(frame).position, [-0.2, 0.08, -0.02]);
    const grid = racketToWorld(pose, [tip[0] - pose.position[0], tip[1] - pose.position[1], outerZ(frame)]);
    out.push(<Bolt key="fb" a={tip} b={grid} seed={`f-${frame}`} color="#fff1a8" r={0.01} />);
    out.push(<Dot key="ff" p={tip} r={0.08 * small} color="#ffffff" o={small} />);
  }
  return <group>{out}</group>;
};

/** Bancada escura onde a raquete fica de pé para ser aberta. */
const Bench: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("bench", frame)) return null;
  const o = Math.min(track("bedroom.dim", frame), 1 - track("bench.hide", frame));
  if (o < 0.01) return null;
  return (
    <group>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 1.6, 0.08, 40]} />
        <Mat color={PALETTE.bench} o={o} />
      </mesh>
      <mesh position={[0, -0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.52, 48]} />
        <meshBasicMaterial color={PALETTE.racketAccent} transparent opacity={0.8 * o} />
      </mesh>
    </group>
  );
};

/** A formiga figurante que boceja para os 3 volts. */
const Ant: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("ant", frame)) return null;
  const e = track("ant.enter", frame);
  if (e < 0.01) return null;
  const yawn = track("ant.yawn", frame);
  const p: Vec3 = [0.26 + (1 - clamp(e, 0, 1)) * 0.6, 0.52, 0.16];
  const walk = Math.sin(frame * 0.9) * 0.3 * (1 - clamp(e, 0, 1));
  return (
    <group position={p} rotation={[0, -0.5, 0.15]} scale={clamp(e, 0, 1.15) * 1.1}>
      {[
        [-0.06, 0, 0.035],
        [0, 0.005, 0.025],
        [0.055, 0.012, 0.03],
      ].map(([x, y, r], k) => (
        <mesh key={k} position={[x, y, 0]}>
          <sphereGeometry args={[r, 7, 5]} />
          <Mat color="#2b1a14" />
        </mesh>
      ))}
      {/* boca aberta no bocejo */}
      <mesh position={[0.082, 0.004, 0.0]} rotation={[0, Math.PI / 2, 0]} scale={[1, 0.3 + yawn * Math.sin(yawn * Math.PI) * 1.4, 1]}>
        <circleGeometry args={[0.012, 10]} />
        <meshBasicMaterial color="#ff8a8a" />
      </mesh>
      {[0.032, -0.032].map((z, k) => (
        <mesh key={k} position={[0.07, 0.03, z * 0.5]}>
          <sphereGeometry args={[0.009, 6, 5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {[-0.04, 0, 0.04].flatMap((x, k) =>
        [1, -1].map((s) => (
          <mesh key={`${k}${s}`} position={[x, -0.025, s * 0.03]} rotation={[s * (0.9 + walk), 0, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.07, 4]} />
            <Mat color="#2b1a14" />
          </mesh>
        )),
      )}
      {[1, -1].map((s) => (
        <mesh key={`a${s}`} position={[0.095, 0.05, s * 0.012]} rotation={[s * 0.4, 0, -0.6]}>
          <cylinderGeometry args={[0.002, 0.002, 0.06, 4]} />
          <Mat color="#2b1a14" />
        </mesh>
      ))}
    </group>
  );
};

export const Effects: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {isVisible("airWave", frame) ? <AirWave frame={frame} /> : null}
      <Zap frame={frame} />
      <Bench frame={frame} />
      <Ant frame={frame} />
    </>
  );
};
