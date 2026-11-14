import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { AdditiveBlending, DoubleSide, ExtrudeGeometry, Shape, type Texture } from "three";
import { isVisible, sceneIndexAt, track } from "../data/scenes";
import { EXTRA_CASAS } from "../layout";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, rand, smoothstep, type Vec3 } from "../utils/animation";
import { Figure } from "./Figure";
import { animWindow, heroAt } from "./hero";
import { cardTexture, showPhotoTexture, signTexture } from "./textures";

// Objetos de cena ligados às trilhas: aparecem, voam e somem pelo frame global.

const Card: React.FC<{ p: Vec3; s: [number, number]; map: Texture; rot?: Vec3; scale?: number; glow?: number }> = ({ p, s, map, rot, scale = 1, glow = 0.25 }) => (
  <mesh position={p} rotation={rot} scale={scale}>
    <planeGeometry args={s} />
    <meshStandardMaterial {...MATTE} map={map} emissive="#ffffff" emissiveMap={map} emissiveIntensity={glow} side={DoubleSide} />
  </mesh>
);

const arc = (a: Vec3, b: Vec3, t: number, h: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) + Math.sin(t * Math.PI) * h, lerp(a[2], b[2], t)];

const PIGGY: Vec3 = [0.62, 1.07, 2.22];

// ---------------------------------------------------------------- cofrinho
const Piggy: React.FC<{ frame: number }> = ({ frame }) => {
  const idx = sceneIndexAt(frame);
  const brk = clamp(track("piggy.break", frame), 0, 1.2);
  const fill = clamp(track("piggy.fill", frame), 0, 1);
  const scale = idx === 2 ? track("piggy.scale", frame, 1) : 1;
  const crack = clamp(track("piggy.crack", frame), 0, 1);
  const shake = crack > 0 ? Math.sin(frame * 3.1) * 0.04 * crack : 0;
  if (brk > 0.02) {
    if (brk >= 1.15 || idx > 3) return null;
    return (
      <group position={PIGGY}>
        {Array.from({ length: 12 }, (_, i) => {
          const s = `pg${i}`;
          const dir: Vec3 = [rand(s + "x") - 0.5, rand(s + "y") * 0.8 + 0.2, rand(s + "z") - 0.5];
          const t = brk;
          return (
            <mesh key={i} position={[dir[0] * t * 1.6, dir[1] * t * 1.4 - t * t * 1.2, dir[2] * t * 1.6]} rotation={[t * 6 * dir[0], t * 5, t * 4 * dir[2]]} scale={1 - t * 0.6}>
              <tetrahedronGeometry args={[0.06, 0]} />
              <meshStandardMaterial {...MATTE} color={i % 4 === 0 ? "#e8b93a" : "#f19bb0"} />
            </mesh>
          );
        })}
      </group>
    );
  }
  return (
    <group position={[PIGGY[0] + shake, PIGGY[1], PIGGY[2]]} scale={scale} rotation={[0, -0.5, 0]}>
      <mesh scale={[1.25, 1, 1]} castShadow>
        <icosahedronGeometry args={[0.13, 1]} />
        <meshStandardMaterial {...MATTE} color="#f19bb0" transparent opacity={0.78} />
      </mesh>
      <mesh position={[0, -0.13 + fill * 0.12, 0]} scale={[1.15, Math.max(0.02, fill), 0.9]}>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshStandardMaterial {...MATTE} color="#e8b93a" emissive="#e8b93a" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.17, 0.0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
        <meshStandardMaterial {...MATTE} color="#e87d99" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.1, 0.1, s * 0.07]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.035, 0.07, 4]} />
          <meshStandardMaterial {...MATTE} color="#e87d99" />
        </mesh>
      ))}
      {[[-0.08, -0.06], [0.08, -0.06], [-0.08, 0.06], [0.08, 0.06]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.12, z]}>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 6]} />
          <meshStandardMaterial {...MATTE} color="#e87d99" />
        </mesh>
      ))}
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.07, 0.01, 0.015]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {crack > 0.05 ? (
        <mesh position={[0, 0.02, 0.105]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.15 * crack, 0.008, 0.01]} />
          <meshBasicMaterial color="#5a2a32" />
        </mesh>
      ) : null}
    </group>
  );
};

const Coins: React.FC<{ frame: number }> = ({ frame }) => {
  if (sceneIndexAt(frame) !== 2) return null;
  const [a, b] = animWindow("coins.emit");
  const N = 26;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const birth = a + ((b - a) * i) / N;
    const age = (frame - birth) / 18;
    if (age < 0 || age > 1) continue;
    const src: Vec3 = i % 2 === 0 ? [-3.3, 1.0, 2.6] : [-3.2, 1.4, -2.0];
    const p = arc(src, [PIGGY[0], PIGGY[1] + 0.16, PIGGY[2]], smoothstep(age), 1.6);
    out.push(
      <mesh key={i} position={p} rotation={[Math.PI / 2, frame * 0.3 + i, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.015, 10]} />
        <meshStandardMaterial {...MATTE} color="#e8b93a" emissive="#e8b93a" emissiveIntensity={0.35} metalness={0.4} />
      </mesh>,
    );
  }
  return <>{out}</>;
};

const AngryBubbles: React.FC<{ frame: number }> = ({ frame }) => {
  const k = clamp(track("angry.bubbles", frame), 0, 1);
  if (k < 0.02 || sceneIndexAt(frame) !== 2) return null;
  const map = signTexture("#$%&!", { bg: "#ffffff", fg: "#e3262f", w: 256, h: 140, size: 100, border: "#e3262f" });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <Card key={i} p={[-3.2 + (i - 1) * 0.55, 2.0 + i * 0.35 + Math.sin(frame / 5 + i) * 0.05, -1.75]} s={[0.55, 0.3]} map={map} scale={k * (0.9 + 0.2 * Math.sin(frame / 3 + i))} rot={[0, 0, (i - 1) * 0.15]} glow={0.5} />
      ))}
    </group>
  );
};

const CreditCard: React.FC<{ frame: number }> = ({ frame }) => {
  const k = clamp(track("card.installments", frame), 0, 1.2);
  if (k < 0.02) return null;
  const late = track("card.variant", frame) > 0.5;
  const map = cardTexture(late ? "card-late" : "card", 320, 200, "#1b2a4a", [
    { text: late ? "PARCELA 7/24" : "24x SEM JUROS", size: 52, color: late ? "#ff5a5a" : "#f6c518", y: 0.42 },
    { text: "•••• 0000", size: 34, color: "#c9d2e0", y: 0.78 },
  ]);
  const at: Vec3 = late ? [-3.05, 1.32, 2.8] : [PIGGY[0] - 0.05, PIGGY[1] + 0.3, PIGGY[2] + 0.3];
  return <Card p={at} s={[0.3, 0.19]} map={map} rot={[0, (1 - Math.min(k, 1)) * Math.PI * 2 + 0.2, 0]} scale={k} glow={0.5} />;
};

// ---------------------------------------------------------------- sonho: balão com a câmera e a etiqueta $$$$
const DreamBubble: React.FC<{ frame: number; h: ReturnType<typeof heroAt> }> = ({ frame, h }) => {
  if (sceneIndexAt(frame) !== 1) return null;
  const k = clamp(track("dream.camera", frame), 0, 1.2);
  const tag = clamp(track("price.tag", frame), 0, 1.2);
  if (k < 0.02) return null;
  const at: Vec3 = [h.x - 0.38, 1.5, h.z + 0.1];
  const swing = Math.sin(frame / 6) * 0.25 * Math.max(0, 1.2 - tag);
  return (
    <group>
      {/* bolinhas do pensamento */}
      {[0.1, 0.18].map((r, i) => (
        <mesh key={i} position={[h.x - 0.1 - i * 0.12, 1.08 + i * 0.16, h.z + 0.1]} scale={k}>
          <sphereGeometry args={[r * 0.45, 8, 6]} />
          <meshStandardMaterial {...MATTE} color="#ffffff" />
        </mesh>
      ))}
      <group position={at} scale={k}>
        {[[0, 0, 0, 0.28], [-0.22, -0.04, 0, 0.2], [0.22, -0.03, 0, 0.21], [0.1, 0.15, 0, 0.18], [-0.12, 0.14, 0, 0.17]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z - 0.06]}>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial {...MATTE} color="#ffffff" />
          </mesh>
        ))}
        <group position={[0, 0.02, 0.2]} rotation={[0.1, frame * 0.03, 0]} scale={1.6}>
          <mesh>
            <boxGeometry args={[0.15, 0.095, 0.075]} />
            <meshStandardMaterial {...MATTE} color="#121214" />
          </mesh>
          <mesh position={[0.02, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.042, 0.075, 10]} />
            <meshStandardMaterial {...MATTE} color="#1d1d20" />
          </mesh>
        </group>
        {tag > 0.02 ? (
          <group position={[0.18, -0.08, 0.3]} rotation={[0, 0, swing]}>
            <mesh position={[0, -0.12, 0]}>
              <boxGeometry args={[0.006, 0.24, 0.006]} />
              <meshBasicMaterial color="#333" />
            </mesh>
            <Card p={[0, -0.3, 0]} s={[0.36, 0.18]} map={signTexture("$$$$", { bg: "#f6c518", fg: "#1a1405", size: 120, h: 150, border: "#1a1405" })} scale={tag} glow={0.55} />
          </group>
        ) : null}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- caixa da câmera
const CameraBox: React.FC<{ frame: number }> = ({ frame }) => {
  if (sceneIndexAt(frame) !== 3) return null;
  const drop = track("cameraBox.drop", frame);
  const open = clamp(track("cameraBox.open", frame), 0, 1);
  const rays = clamp(track("godrays.intensity", frame), 0, 1);
  const spark = clamp(track("sparkles", frame), 0, 1);
  const y = lerp(3.2, 0.13, clamp(drop, 0, 1.1));
  const base: Vec3 = [0.25, y, 3.62];
  return (
    <group>
      <group position={base}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.24, 0.28]} />
          <meshStandardMaterial {...MATTE} color="#1d1d20" />
        </mesh>
        <mesh position={[0, 0.001, 0.141]}>
          <planeGeometry args={[0.3, 0.2]} />
          <meshBasicMaterial map={signTexture("CÂMERA", { bg: "#1d1d20", fg: "#f2f0eb", size: 90, w: 300, h: 200 })} />
        </mesh>
        <group position={[0, 0.12, -0.14]} rotation={[-open * 1.9, 0, 0]}>
          <mesh position={[0, 0.0, 0.14]}>
            <boxGeometry args={[0.35, 0.03, 0.29]} />
            <meshStandardMaterial {...MATTE} color="#e3262f" />
          </mesh>
        </group>
      </group>
      {rays > 0.02 ? (
        <group position={[0.25, 0.2, 3.62]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0, 1.4, 0]} rotation={[0, (i * Math.PI) / 5 + frame * 0.01, (i - 2) * 0.07]}>
              <coneGeometry args={[0.2 + i * 0.04, 2.8, 4, 1, true]} />
              <meshBasicMaterial color="#fff2c4" transparent opacity={0.03 * rays} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} />
            </mesh>
          ))}
        </group>
      ) : null}
      {spark > 0.02
        ? Array.from({ length: 14 }, (_, i) => {
            const s = `sp${i}`;
            const tw = 0.5 + 0.5 * Math.sin(frame / 3 + i * 1.7);
            return (
              <mesh key={i} position={[0.25 + (rand(s + "x") - 0.5) * 1.1, 0.6 + rand(s + "y") * 1.2, 3.35 + (rand(s + "z") - 0.5) * 0.6]} scale={spark * tw}>
                <octahedronGeometry args={[0.03, 0]} />
                <meshBasicMaterial color="#fff6c8" />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

// ---------------------------------------------------------------- celular, grilo, pão, polaroide
const Phone: React.FC<{ frame: number; h: ReturnType<typeof heroAt> }> = ({ frame, h }) => {
  const k = clamp(track("phone.show", frame), 0, 1.2);
  if (k < 0.02) return null;
  const idx = sceneIndexAt(frame);
  const at: Vec3 = idx >= 10 ? [h.x + 0.3, 0.92, h.z + 0.3] : [h.x - 0.45, 0.95, h.z + 0.15];
  const saldo = idx >= 10 && track("balance.show", frame) > 0.5;
  const map = cardTexture(saldo ? "phone-saldo" : idx >= 10 ? "phone-chat" : "phone0", 180, 340, "#0f1115", saldo
    ? [
        { text: "SALDO", size: 34, color: "#9aa3b2", y: 0.3 },
        { text: "R$ 3,47", size: 50, color: "#ff5a5a", y: 0.48 },
      ]
    : idx >= 10
    ? [{ text: "AMIGO", size: 30, color: "#9aa3b2", y: 0.12 }]
    : [
        { text: "0", size: 150, color: "#f2f0eb", y: 0.42 },
        { text: "MENSAGENS", size: 34, color: "#9aa3b2", y: 0.66 },
      ]);
  const jump = clamp(track("cricket.jump", frame), 0, 1);
  const hop = Math.abs(Math.sin(jump * Math.PI * 3));
  return (
    <group position={at} scale={k} rotation={[0, -0.25, Math.sin(frame / 20) * 0.05]}>
      <mesh>
        <boxGeometry args={[0.24, 0.44, 0.03]} />
        <meshStandardMaterial {...MATTE} color="#111" />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.21, 0.4]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      {idx === 4 && jump > 0 ? (
        <group position={[lerp(-0.08, 0.08, jump), 0.25 + hop * 0.18, 0.02]} rotation={[0, 1.2, 0]}>
          <mesh scale={[1.6, 0.7, 0.7]}>
            <sphereGeometry args={[0.03, 6, 5]} />
            <meshStandardMaterial {...MATTE} color="#3d7a2a" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[-0.03, 0.02, s * 0.02]} rotation={[0, 0, 0.9]}>
              <boxGeometry args={[0.07, 0.008, 0.008]} />
              <meshStandardMaterial {...MATTE} color="#2c5a1e" />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
};

const Bread: React.FC<{ frame: number }> = ({ frame }) => {
  const g = clamp(track("bread.glam", frame), 0, 1);
  if (g < 0.02 || sceneIndexAt(frame) !== 4) return null;
  const print = clamp(track("photo.print", frame), 0, 1.2);
  const tag = clamp(track("photo.priceTag", frame), 0, 1.2);
  const photo = cardTexture("polaroid", 220, 260, "#f8f6f0", [
    { text: "🥖", size: 120, color: "#d9a15b", y: 0.42 },
  ]);
  return (
    <group>
      <group position={[-3.95, 0.64, 2.62]}>
        <mesh position={[0, g * 0.12, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.08 + g * 0.24, 10]} />
          <meshStandardMaterial {...MATTE} color="#f2f0eb" />
        </mesh>
        <mesh position={[0, 0.12 + g * 0.26, 0]} rotation={[0, frame * 0.05, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.06, 0.13, 4, 8]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.bread} emissive="#ffcc80" emissiveIntensity={g * 0.35} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[0.32, 1.3, 16, 1, true]} />
          <meshBasicMaterial color="#fff5d8" transparent opacity={0.13 * g} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} />
        </mesh>
        <pointLight position={[0, 0.9, 0.2]} intensity={1.6 * g} distance={1.8} color="#fff3d0" />
      </group>
      {print > 0.02 ? (
        <group position={[-3.6, lerp(0.85, 1.12, Math.min(print, 1)), 3.3]} rotation={[0, -0.2, 0.08]} scale={print}>
          <Card p={[0, 0, 0]} s={[0.26, 0.3]} map={photo} glow={0.5} />
          {tag > 0.02 ? <Card p={[0.05, -0.1, 0.01]} s={[0.24, 0.09]} map={signTexture("R$ 0,00", { bg: "#e3262f", fg: "#fff", size: 110, h: 150 })} scale={tag} rot={[0, 0, -0.15]} glow={0.6} /> : null}
        </group>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- casa de show: produtor, chamada, vitrine, moeda XP
const Produtor: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("produtor", frame)) return null;
  const k = clamp(track("produtor.pop", frame), 0, 1.2);
  const pockets = clamp(track("produtor.pockets", frame), 0, 1.2);
  if (k < 0.02) return null;
  return (
    <group position={[0.4, 0.06, -1.25]} scale={k}>
      <Figure position={[0, 0, 0]} yaw={60} variant="produtor" seed="prod" />
      {pockets > 0.02
        ? [-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.15 * Math.cos(1.05), 0.36, s * -0.15 * Math.sin(1.05)]} scale={pockets}>
              <boxGeometry args={[0.07, 0.09, 0.07]} />
              <meshStandardMaterial {...MATTE} color="#f2f0eb" />
            </mesh>
          ))
        : null}
    </group>
  );
};

const CallBubble: React.FC<{ frame: number }> = ({ frame }) => {
  if (sceneIndexAt(frame) !== 5) return null;
  const k = clamp(track("call.ring", frame), 0, 1);
  if (k < 0.01 || k >= 0.999) return null;
  const map = signTexture("📞 TRIIIM", { bg: "#ffffff", fg: "#111", w: 360, h: 140, size: 84, border: "#1fb257" });
  return <Card p={[2.0, 2.0 + Math.sin(k * 30) * 0.03, -1.2]} s={[0.9, 0.35]} map={map} rot={[0, 0, Math.sin(k * 60) * 0.08]} scale={Math.min(1, k * 5)} glow={0.6} />;
};

const VitrineFrame: React.FC<{ frame: number; h: ReturnType<typeof heroAt> }> = ({ frame, h }) => {
  const k = clamp(track("vitrine.frame", frame), 0, 1.2);
  if (k < 0.02 || sceneIndexAt(frame) !== 5) return null;
  const y = lerp(3.0, 0.55, Math.min(k, 1.15));
  const gold = { ...MATTE, color: "#e8b93a", metalness: 0.6, roughness: 0.3 };
  return (
    <group position={[h.x, y, h.z + 0.12]} rotation={[0, 0.3, 0]}>
      {[
        [0, 0.5, 0, 0.76, 0.07],
        [0, -0.5, 0, 0.76, 0.07],
        [-0.35, 0, 0, 0.07, 1.07],
        [0.35, 0, 0, 0.07, 1.07],
      ].map(([x, yy, z, w, hh], i) => (
        <mesh key={i} position={[x, yy, z]}>
          <boxGeometry args={[w, hh, 0.06]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
      <Card p={[0, 0.66, 0]} s={[0.66, 0.18]} map={signTexture("VITRINE", { bg: "#e8b93a", fg: "#2a1a05", size: 120, h: 150 })} glow={0.5} />
    </group>
  );
};

const XpCoin: React.FC<{ frame: number; h: ReturnType<typeof heroAt> }> = ({ frame, h }) => {
  if (sceneIndexAt(frame) !== 5) return null;
  const t = clamp(track("xpCoin.drop", frame), 0, 1);
  if (t <= 0.001) return null;
  // cai até a mão (y 0.5), atravessa e quica no chão duas vezes
  let y: number;
  if (t < 0.35) y = lerp(1.9, 0.5, smoothstep(t / 0.35));
  else if (t < 0.5) y = lerp(0.5, 0.05, (t - 0.35) / 0.15);
  else y = 0.05 + Math.abs(Math.sin(((t - 0.5) / 0.5) * Math.PI * 2)) * 0.22 * (1 - (t - 0.5) / 0.5);
  const map = signTexture("XP", { bg: "#e8b93a", fg: "#5a3a05", w: 128, h: 128, size: 90 });
  return (
    <group position={[h.x + 0.2, y, h.z + 0.25]} rotation={[0, frame * 0.25, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.025, 14]} />
        <meshStandardMaterial {...MATTE} color="#e8b93a" metalness={0.5} roughness={0.3} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0, s * 0.014]} rotation={[0, s < 0 ? Math.PI : 0, 0]}>
          <circleGeometry args={[0.09, 14]} />
          <meshBasicMaterial map={map} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- show: caixa de som, fotos voando, relógio
const SpeakerCase: React.FC<{ frame: number; h: ReturnType<typeof heroAt> }> = ({ frame, h }) => {
  if (sceneIndexAt(frame) !== 6 || h.y < 0.01) return null;
  return (
    <mesh position={[h.x, h.y / 2 + 0.03, h.z]} castShadow>
      <boxGeometry args={[0.42, h.y, 0.42]} />
      <meshStandardMaterial {...MATTE} color="#111" />
    </mesh>
  );
};

const PhotoCards: React.FC<{ frame: number }> = ({ frame }) => {
  const idx = sceneIndexAt(frame);
  if (idx !== 6) return null;
  const fly = clamp(track("photos.fly", frame), 0, 1);
  const toScreen = clamp(track("photos.toScreen", frame), 0, 1);
  const N = 12;
  const out: React.ReactNode[] = [];
  const onDesk = track("hero.edit", frame) > 0.5;
  for (let i = 0; i < N; i++) {
    const born = i / N;
    if (fly < born) continue;
    const t = clamp((fly - born) * N * 0.5, 0, 1);
    let p: Vec3;
    let rot: Vec3 = [0, 0, (rand(`pc${i}`) - 0.5) * 0.5];
    if (!onDesk) {
      p = arc([0.6, 0.95, -3.3], [1.45 + (i % 3) * 0.05, 0.42 + i * 0.012, -3.75], t, 0.6);
    } else if (toScreen <= 0.001) {
      p = [-0.82, 0.48 + i * 0.008, 3.25];
      rot = [-Math.PI / 2, 0, (rand(`pc${i}`) - 0.5) * 0.6];
    } else {
      const u = clamp(toScreen * 1.6 - i * 0.05, 0, 1);
      p = arc([-0.82, 0.5, 3.25], [0.6, 3.07, -1.5], smoothstep(u), 2.2);
      if (u >= 1) continue;
    }
    out.push(<Card key={i} p={p} s={[0.16, 0.16]} map={showPhotoTexture(`p${i}`)} rot={rot} glow={0.4} />);
  }
  return <>{out}</>;
};

const DeskClock: React.FC<{ frame: number }> = ({ frame }) => {
  const idx = sceneIndexAt(frame);
  if (idx !== 6 || track("hero.edit", frame) < 0.5) return null;
  const v = track("clock.time", frame, 23);
  const hour = Math.floor(v) % 24;
  const min = Math.floor((v % 1) * 60 / 15) * 15;
  const text = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  return (
    <group position={[-0.78, 0.53, 3.36]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[0.22, 0.1, 0.06]} />
        <meshStandardMaterial {...MATTE} color="#111" />
      </mesh>
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshBasicMaterial map={signTexture(text, { bg: "#111", fg: "#ff3a3a", size: 120, w: 300, h: 120 })} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- DMs e credencial
const planeGeo = () => {
  const s = new Shape();
  s.moveTo(0, 0.12);
  s.lineTo(0.07, -0.08);
  s.lineTo(0, -0.03);
  s.lineTo(-0.07, -0.08);
  s.closePath();
  return new ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false });
};

const DmPlanes: React.FC<{ frame: number; h: ReturnType<typeof heroAt> }> = ({ frame, h }) => {
  const geo = useMemo(planeGeo, []);
  const idx = sceneIndexAt(frame);
  if (idx !== 7 && idx !== 8) return null;
  const fly = clamp(track("dms.fly", frame), 0, 1);
  const seen = Math.floor(track("seen.marks", frame));
  const targets: Vec3[] = [...EXTRA_CASAS.map((c) => [c.p[0], 1.6, c.p[1]] as Vec3), [0.6, 2.6, -1.6]];
  const out: React.ReactNode[] = [];
  targets.forEach((tg, i) => {
    const t = clamp(fly * 1.4 - i * 0.1, 0, 1);
    if (t <= 0) return;
    let p = arc([h.x, 1.0, h.z], tg, smoothstep(t), 2.2);
    if (i < seen) p = [tg[0], Math.max(0.05, tg[1] - 1.6), tg[2] + 0.9];
    out.push(
      <mesh key={i} geometry={geo} position={p} rotation={[-Math.PI / 2 + 0.3, 0, Math.atan2(tg[0] - h.x, tg[2] - h.z) + Math.PI]} scale={4.5}>
        <meshStandardMaterial {...MATTE} color="#f2f0eb" side={DoubleSide} />
      </mesh>,
    );
  });
  const reply = clamp(track("reply.plane", frame), 0, 1);
  if (idx === 8 && reply > 0 && reply < 1) {
    const p = arc([5.9, 1.6, -2.7], [h.x, 1.1, h.z], smoothstep(reply), 1.8);
    out.push(
      <mesh key="reply" geometry={geo} position={p} rotation={[-Math.PI / 2 + 0.3, 0, Math.atan2(h.x - 5.9, h.z + 2.7) + Math.PI]} scale={4}>
        <meshStandardMaterial {...MATTE} color="#e8b93a" emissive="#e8b93a" emissiveIntensity={0.4} side={DoubleSide} />
      </mesh>,
    );
  }
  return <>{out}</>;
};

const Produtor2: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("produtor2", frame)) return null;
  const k = clamp(track("produtor2.pop", frame), 0, 1.2);
  const thumb = clamp(track("produtor2.thumb", frame), 0, 1.2);
  if (k < 0.02) return null;
  return (
    <group position={[5.4, 0, -1.8]} scale={k}>
      <Figure position={[0, 0, 0]} yaw={-60} variant="produtor2" seed="prod2" />
      {thumb > 0.02 ? (
        <mesh position={[-0.05, 1.12, 0.12]} scale={thumb}>
          <boxGeometry args={[0.06, 0.12, 0.06]} />
          <meshStandardMaterial {...MATTE} color="#d8a47c" />
        </mesh>
      ) : null}
    </group>
  );
};

const Credential: React.FC<{ frame: number; h: ReturnType<typeof heroAt> }> = ({ frame, h }) => {
  if (sceneIndexAt(frame) !== 8) return null;
  const k = track("credential.drop", frame);
  const halo = clamp(track("halo.credential", frame), 0, 1);
  if (k <= 0.001 || h.lanyards >= 1) return null;
  const y = lerp(2.4, 0.52, clamp(k, 0, 1.15));
  const map = cardTexture("cred", 200, 260, "#ffffff", [
    { text: "CREDENCIAL", size: 34, color: "#e3262f", y: 0.2 },
    { text: "FOTO", size: 70, color: "#111", y: 0.55 },
    { text: "(não remunerado)", size: 22, color: "#777", y: 0.85 },
  ]);
  return (
    <group position={[h.x, y, h.z + 0.16]}>
      <Card p={[0, 0, 0]} s={[0.14, 0.18]} map={map} glow={0.5} />
      <mesh position={[0, 0.16, -0.02]}>
        <torusGeometry args={[0.1, 0.008, 4, 14, Math.PI]} />
        <meshStandardMaterial {...MATTE} color="#e3262f" />
      </mesh>
      {halo > 0.02 ? (
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[0.13, 0.2 + halo * 0.05, 24]} />
          <meshBasicMaterial color="#fff1b0" transparent opacity={0.8 * halo} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- camarim: água
const Water: React.FC<{ frame: number }> = ({ frame }) => {
  if (sceneIndexAt(frame) !== 9) return null;
  const k = clamp(track("water.bottle", frame), 0, 1.2);
  const w = clamp(track("water.withdraw", frame), 0, 1);
  if (k < 0.02 || w >= 1) return null;
  const z = lerp(-4.75, -5.35, w);
  return (
    <group>
      <group position={[-1.0, 0.85, z]} scale={k}>
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.2, 10]} />
          <meshStandardMaterial color="#9fd6ff" transparent opacity={0.75} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
          <meshStandardMaterial {...MATTE} color="#2b6fe8" />
        </mesh>
        <mesh position={[0, -0.02, 0.046]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshBasicMaterial map={signTexture("ÁGUA", { bg: "#2b6fe8", fg: "#fff", size: 100, w: 200, h: 150 })} />
        </mesh>
      </group>
      {w > 0 ? (
        <mesh position={[-1.0, 0.85, lerp(-5.15, -4.8, Math.sin(w * Math.PI))]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.04, 0.3, 3, 6]} />
          <meshStandardMaterial {...MATTE} color="#c58a62" />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- seis meses: corações
const heartGeo = () => {
  const s = new Shape();
  s.moveTo(0, -0.06);
  s.bezierCurveTo(-0.09, 0.0, -0.06, 0.08, 0, 0.04);
  s.bezierCurveTo(0.06, 0.08, 0.09, 0.0, 0, -0.06);
  return new ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false });
};

const Likes: React.FC<{ frame: number }> = ({ frame }) => {
  const geo = useMemo(heartGeo, []);
  if (sceneIndexAt(frame) !== 10) return null;
  const burst = clamp(track("likes.burst", frame), 0, 1);
  const bounce = clamp(track("likes.bounce", frame), 0, 1);
  if (burst <= 0.001) return null;
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => {
        const s = `lk${i}`;
        const src: Vec3 = [0.5 + rand(s + "x") * 0.4, 0.6 + rand(s + "y") * 0.5, 2.1];
        const t = clamp(burst * 1.3 - i * 0.02, 0, 1);
        let p = arc(src, [PIGGY[0], PIGGY[1] + 0.05, PIGGY[2] + 0.12], smoothstep(t), 0.25 + rand(s) * 0.2);
        if (bounce > 0) {
          const dir = rand(s + "d") - 0.5;
          p = [PIGGY[0] + dir * bounce * 1.2, PIGGY[1] + Math.sin(bounce * Math.PI) * 0.35 - bounce * bounce * 0.9, PIGGY[2] + 0.12 + bounce * 0.6];
        }
        return (
          <mesh key={i} geometry={geo} position={p} rotation={[0, 0, bounce * 4 * (rand(s + "r") - 0.5)]} scale={1.3}>
            <meshStandardMaterial {...MATTE} color="#e3262f" emissive="#e3262f" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- final: despertador
const Alarm: React.FC<{ frame: number }> = ({ frame }) => {
  if (sceneIndexAt(frame) !== 11) return null;
  const k = clamp(track("alarm.ring", frame), 0, 1);
  if (k <= 0.001) return null;
  const shake = Math.sin(frame * 2.4) * 0.12 * (1 - k * 0.5);
  return (
    <group position={[-3.75, 0.98, 2.62]} rotation={[0, 0.2, shake]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.07, 14]} />
        <meshStandardMaterial {...MATTE} color="#e3262f" />
      </mesh>
      <mesh position={[0, 0, 0.037]}>
        <circleGeometry args={[0.1, 14]} />
        <meshBasicMaterial map={signTexture("05:00", { bg: "#f2f0eb", fg: "#111", size: 100, w: 256, h: 256 })} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.08, 0.13, 0]}>
          <sphereGeometry args={[0.04, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...MATTE} color="#c9c9c9" />
        </mesh>
      ))}
    </group>
  );
};

export const Props: React.FC = () => {
  const frame = useCurrentFrame();
  const h = heroAt(frame);
  return (
    <group>
      <Piggy frame={frame} />
      <DreamBubble frame={frame} h={h} />
      <Coins frame={frame} />
      <AngryBubbles frame={frame} />
      <CreditCard frame={frame} />
      <CameraBox frame={frame} />
      <Phone frame={frame} h={h} />
      <Bread frame={frame} />
      <Produtor frame={frame} />
      <CallBubble frame={frame} />
      <VitrineFrame frame={frame} h={h} />
      <XpCoin frame={frame} h={h} />
      <SpeakerCase frame={frame} h={h} />
      <PhotoCards frame={frame} />
      <DeskClock frame={frame} />
      <DmPlanes frame={frame} h={h} />
      <Produtor2 frame={frame} />
      <Credential frame={frame} h={h} />
      <Water frame={frame} />
      <Likes frame={frame} />
      <Alarm frame={frame} />
    </group>
  );
};
