import { useCurrentFrame } from "remotion";
import { AdditiveBlending, DoubleSide, type Texture } from "three";
import { isVisible, sceneIndexAt, track } from "../data/scenes";
import { cameraPoseAt } from "../components/CameraController";
import { EXTRA_CASAS } from "../layout";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, rand } from "../utils/animation";
import { Figure } from "./Figure";
import { cardTexture, facadeTexture, neonTexture, pixoTexture, showPhotoTexture, signTexture, windowsTexture } from "./textures";
import { nightness } from "./time";

// Os prédios do quarteirão. Fileira da frente em corte (aberta pro +z, sem teto), fileira de trás com
// fachada. Tudo lê o frame global: neon, luzes de palco, telão e portas mudam pelas trilhas.

export const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; rot?: [number, number, number]; emissive?: string; ei?: number; shadow?: boolean }> = ({ p, s, c, rot, emissive, ei = 0, shadow = true }) => (
  <mesh position={p} rotation={rot} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial {...MATTE} color={c} emissive={emissive ?? "#000000"} emissiveIntensity={ei} />
  </mesh>
);

const Plane: React.FC<{ p: [number, number, number]; s: [number, number]; map: Texture; rot?: [number, number, number]; transparent?: boolean; emissive?: number; basic?: boolean }> = ({ p, s, map, rot, transparent, emissive = 0, basic }) => (
  <mesh position={p} rotation={rot}>
    <planeGeometry args={s} />
    {basic ? (
      <meshBasicMaterial map={map} transparent={transparent} depthWrite={!transparent} toneMapped={false} />
    ) : (
      <meshStandardMaterial {...MATTE} map={map} transparent={transparent} emissive="#ffffff" emissiveMap={map} emissiveIntensity={emissive} />
    )}
  </mesh>
);

/** Sala em corte: chão, paredes de trás/esquerda/direita, sem frente e sem teto. */
const Cutaway: React.FC<{ x: [number, number]; z: [number, number]; h: number; wall: string; floor: string; side?: string; children?: React.ReactNode }> = ({ x, z, h, wall, floor, side, children }) => {
  const w = x[1] - x[0];
  const d = z[1] - z[0];
  const cx = (x[0] + x[1]) / 2;
  const cz = (z[0] + z[1]) / 2;
  const t = 0.09;
  return (
    <group>
      <Box p={[cx, 0.04, cz]} s={[w, 0.08, d]} c={floor} />
      <Box p={[cx, h / 2, z[0] + t / 2]} s={[w, h, t]} c={wall} />
      <Box p={[x[0] + t / 2, h / 2, cz]} s={[t, h, d]} c={side ?? wall} />
      <Box p={[x[1] - t / 2, h / 2, cz]} s={[t, h, d]} c={side ?? wall} />
      {/* rodapé e borda de corte (leitura de maquete) */}
      <Box p={[cx, h + 0.02, z[0] + t / 2]} s={[w + 0.02, 0.04, t + 0.02]} c="#2b2b2e" shadow={false} />
      <Box p={[x[0] + t / 2, h + 0.02, cz]} s={[t + 0.02, 0.04, d]} c="#2b2b2e" shadow={false} />
      <Box p={[x[1] - t / 2, h + 0.02, cz]} s={[t + 0.02, 0.04, d]} c="#2b2b2e" shadow={false} />
      {children}
    </group>
  );
};

// ---------------------------------------------------------------- padaria
const Padaria: React.FC<{ night: number }> = ({ night }) => {
  const x0 = -4.4;
  const x1 = -2.2;
  return (
    <Cutaway x={[x0, x1]} z={[1.6, 3.8]} h={1.5} wall="#eae6dc" side="#e2ddd1" floor="#8b5e44">
      {/* azulejo na meia parede */}
      <Box p={[-3.3, 0.35, 1.7]} s={[2.0, 0.6, 0.02]} c="#9fc3c9" shadow={false} />
      {/* prateleira de pães atrás do balcão */}
      {[0.75, 1.05].map((y, r) => (
        <group key={r}>
          <Box p={[-3.3, y, 1.75]} s={[1.9, 0.04, 0.2]} c={PALETTE.wood} />
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[-4.1 + i * 0.2, y + 0.06, 1.76]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <capsuleGeometry args={[0.045, 0.07, 3, 6]} />
              <meshStandardMaterial {...MATTE} color={i % 3 === 0 ? "#c98c48" : PALETTE.bread} />
            </mesh>
          ))}
        </group>
      ))}
      {/* forno na parede esquerda */}
      <Box p={[-4.15, 0.45, 2.3]} s={[0.4, 0.9, 0.7]} c="#4a4d52" />
      <Box p={[-3.94, 0.5, 2.3]} s={[0.02, 0.35, 0.5]} c="#1a1a1a" emissive="#ff7a2a" ei={0.6} />
      {/* balcão com vitrine */}
      <Box p={[-3.3, 0.32, 2.62]} s={[1.9, 0.62, 0.42]} c="#d9d4ca" />
      <mesh position={[-3.3, 0.78, 2.62]}>
        <boxGeometry args={[1.9, 0.3, 0.42]} />
        <meshStandardMaterial color="#cfe8ef" transparent opacity={0.28} roughness={0.1} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-4.0 + i * 0.27, 0.69, 2.62]} castShadow>
          <sphereGeometry args={[0.06, 6, 5]} />
          <meshStandardMaterial {...MATTE} color={i % 2 ? "#e0a250" : "#f0d28a"} />
        </mesh>
      ))}
      {/* banquinhos */}
      {[-3.9, -3.3, -2.7].map((x) => (
        <group key={x} position={[x, 0, 3.25]}>
          <Box p={[0, 0.2, 0]} s={[0.05, 0.4, 0.05]} c="#888" />
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.05, 10]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.negative} />
          </mesh>
        </group>
      ))}
      {/* placa */}
      <Plane p={[-3.3, 1.78, 1.64]} s={[1.9, 0.46]} map={signTexture("PADARIA", { bg: PALETTE.negative, fg: "#fff7e6", border: "#fff7e6", size: 120 })} emissive={night * 0.6} />
      <Plane p={[-2.55, 1.26, 1.66]} s={[0.55, 0.3]} map={signTexture("PÃO NA CHAPA", { bg: "#f6e7b0", fg: "#2a1a10", w: 512, h: 260, size: 86 })} />
    </Cutaway>
  );
};

// ---------------------------------------------------------------- telemarketing (pilotis)
const CallCenter: React.FC<{ night: number }> = ({ night }) => {
  const cx = -3.2;
  const cz = -3.2;
  const fac = facadeTexture("callc", 8, 14, "#7f8a92", "#24435a");
  const em = windowsTexture("callc", 8, 14, 0.75);
  return (
    <group>
      {/* pilotis */}
      {[-1.05, 1.05].map((dx) =>
        [-1.05, 1.05].map((dz) => <Box key={`${dx}${dz}`} p={[cx + dx, 0.7, cz + dz]} s={[0.14, 1.4, 0.14]} c="#a7a39a" />),
      )}
      <Box p={[cx, 0.02, cz]} s={[2.4, 0.04, 2.4]} c="#8f8b84" />
      {/* bloco de cima */}
      <mesh position={[cx, 1.4 + 2.0, cz]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 4.0, 2.4]} />
        <meshStandardMaterial {...MATTE} color="#ffffff" map={fac} emissive="#ffffff" emissiveMap={em} emissiveIntensity={0.25 + night * 1.0} />
      </mesh>
      <Plane p={[cx, 5.75, cz + 1.21]} s={[2.2, 0.6]} map={signTexture("ALÔ CALL CENTER", { bg: "#0f2340", fg: "#7fd3ff", size: 80 })} emissive={0.3 + night} />
      <mesh position={[cx + 1.0, 5.4, cz + 1.0]}>
        <cylinderGeometry args={[0.03, 0.05, 1.4, 5]} />
        <meshStandardMaterial {...MATTE} color="#ccc" />
      </mesh>
      {/* baias de atendimento embaixo */}
      {[-0.7, 0.7].map((dx) => (
        <group key={dx} position={[cx + dx, 0, cz - 0.35]}>
          <Box p={[0, 0.34, 0]} s={[0.6, 0.04, 0.35]} c="#d6d2c8" />
          <Box p={[0, 0.5, -0.1]} s={[0.26, 0.2, 0.03]} c="#1d1f24" emissive="#6fb6ff" ei={0.8} />
          <Figure position={[0, 0, -0.42]} yaw={0} variant="worker" seed={`w${dx}`} />
        </group>
      ))}
      <group position={[cx, 0, cz + 0.85]}>
        <Box p={[0.32, 0.34, 0]} s={[0.36, 0.04, 0.5]} c="#d6d2c8" />
        <Box p={[0.44, 0.5, 0]} s={[0.03, 0.2, 0.26]} c="#1d1f24" emissive="#6fb6ff" ei={0.8} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- quartinho
const Quarto: React.FC<{ frame: number; night: number }> = ({ frame, night }) => {
  const months = Math.floor(clamp(track("calendar.flip", frame), 0, 6));
  const photos = Math.round(lerp(3, 18, clamp(track("wall.photos", frame), 0, 1)));
  const flipK = track("calendar.flip", frame) - months;
  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL"];
  return (
    <Cutaway x={[-1.05, 1.1]} z={[2.0, 4.0]} h={1.45} wall="#c9c3b5" side="#bdb7a8" floor="#6d6a64">
      {/* mofo e reboco */}
      <Box p={[0.9, 1.25, 2.06]} s={[0.25, 0.18, 0.01]} c="#9a957f" shadow={false} />
      {/* janela */}
      <Box p={[-0.35, 1.0, 2.05]} s={[0.5, 0.4, 0.02]} c={night > 0.5 ? "#1b2a4a" : "#a9bcc8"} emissive="#9fb7ff" ei={night * 0.15} shadow={false} />
      {/* colchão no chão */}
      <Box p={[0.62, 0.13, 3.2]} s={[0.75, 0.14, 1.25]} c="#e9e4d8" />
      <Box p={[0.62, 0.22, 3.62]} s={[0.55, 0.08, 0.28]} c="#ffffff" />
      <Box p={[0.62, 0.21, 3.05]} s={[0.76, 0.03, 0.85]} c="#7d2a2f" />
      {/* mesa com notebook */}
      <Box p={[-0.8, 0.42, 3.0]} s={[0.4, 0.04, 0.8]} c={PALETTE.wood} />
      {[-0.3, 0.3].map((dz) => <Box key={dz} p={[-0.8, 0.2, 3.0 + dz]} s={[0.04, 0.4, 0.04]} c={PALETTE.wood} />)}
      <Box p={[-0.8, 0.455, 3.0]} s={[0.22, 0.012, 0.3]} c="#2b2d33" />
      <Box p={[-0.9, 0.56, 3.0]} rot={[0, 0, 0.25]} s={[0.012, 0.2, 0.3]} c="#2b2d33" emissive="#8fc2ff" ei={0.9} />
      {/* calendário */}
      <group position={[0.15, 1.02, 2.06]}>
        <Plane p={[0, 0, 0]} s={[0.34, 0.4]} map={cardTexture(`cal${months}`, 160, 190, "#f4f1ea", [
          { text: monthNames[months], size: 60, color: PALETTE.negative, y: 0.28 },
          { text: "▦▦▦▦", size: 40, color: "#444", y: 0.62 },
          { text: "▦▦▦▦", size: 40, color: "#444", y: 0.85 },
        ])} />
        {flipK > 0.02 && flipK < 0.98 ? (
          <mesh position={[0, 0.2, 0.01]} rotation={[-flipK * Math.PI, 0, 0]}>
            <planeGeometry args={[0.34, 0.4]} />
            <meshStandardMaterial {...MATTE} color="#f4f1ea" side={DoubleSide} />
          </mesh>
        ) : null}
      </group>
      {/* fotos coladas na parede */}
      {Array.from({ length: photos }, (_, i) => {
        const onSide = i >= 9;
        const k = onSide ? i - 9 : i;
        const col = k % 3;
        const row = Math.floor(k / 3);
        const tilt = (rand(`ph${i}`) - 0.5) * 0.3;
        return onSide ? (
          <Plane key={i} p={[1.04, 0.62 + row * 0.24, 2.4 + col * 0.26]} rot={[0, -Math.PI / 2, tilt]} s={[0.18, 0.18]} map={showPhotoTexture(`p${i}`)} />
        ) : (
          <Plane key={i} p={[0.5 + col * 0.18, 0.55 + row * 0.2, 2.06]} rot={[0, 0, tilt]} s={[0.15, 0.15]} map={showPhotoTexture(`p${i}`)} />
        );
      })}
      {/* prateleira do cofrinho */}
      <Box p={[0.62, 0.92, 2.2]} s={[0.5, 0.04, 0.26]} c={PALETTE.wood} />
    </Cutaway>
  );
};

// ---------------------------------------------------------------- casa de show
const CROWD = Array.from({ length: 24 }, (_, i) => {
  const s = `c${i}`;
  const left = i % 2 === 0;
  const x = left ? -1.2 + rand(s + "x") * 1.2 : 1.2 + rand(s + "x") * 1.25;
  const z = -3.3 + rand(s + "z") * 1.5;
  return { x, z, seed: s };
});

/** O neon da fachada atrapalha os planos de dentro do show: some quando a câmera está perto e mirando lá dentro. */
const neonVisible = (frame: number) => {
  const pose = cameraPoseAt(frame);
  const d = Math.hypot(pose.position[0] - 0.6, pose.position[1] - 2.4, pose.position[2] + 1.5);
  return !(pose.target[2] < -2.6 && d < 9 && pose.position[2] > -1.5);
};

const CasaShow: React.FC<{ frame: number; night: number }> = ({ frame, night }) => {
  const idx = sceneIndexAt(frame);
  const neonT = idx === 5 ? track("casaShow.neon", frame) : 1;
  const flick = neonT >= 1 ? 1 : neonT * (Math.sin(frame * 2.7) > 0.2 ? 1 : 0.15);
  const lights = track("stage.lights", frame);
  const jump = track("crowd.jump", frame);
  const showCrowd = isVisible("crowd", frame);
  const post = clamp(track("screen.post", frame), 0, 1);
  const cut = clamp(track("credit.cut", frame), 0, 1);
  const door = clamp(track("camarim.door", frame), 0, 1);
  const x0 = -1.4;
  const x1 = 2.6;
  const z0 = -5.2;
  const z1 = -1.6;
  const cx = (x0 + x1) / 2;
  return (
    <group>
      {/* caixa preta (sem frente) */}
      <Box p={[cx, 0.03, (z0 + z1) / 2]} s={[x1 - x0, 0.06, z1 - z0]} c="#1b1b1e" />
      <Box p={[cx, 1.3, z0 + 0.05]} s={[x1 - x0, 2.6, 0.1]} c="#141416" />
      <Box p={[x0 + 0.05, 1.3, (z0 + z1) / 2]} s={[0.1, 2.6, z1 - z0]} c="#222226" />
      <Box p={[x1 - 0.05, 1.3, (z0 + z1) / 2]} s={[0.1, 2.6, z1 - z0]} c="#222226" />
      <Box p={[cx, 2.6, (z0 + z1) / 2]} s={[x1 - x0, 0.1, z1 - z0]} c="#1a1a1c" />
      {/* fachada: viga com neon */}
      <Box p={[cx, 2.38, z1 + 0.02]} s={[x1 - x0, 0.44, 0.12]} c="#0d0d0f" />
      {neonVisible(frame) ? <Plane p={[cx, 2.38, z1 + 0.09]} s={[2.4, 0.45]} map={neonTexture("AO VIVO", "#ff2e3a")} transparent basic /> : null}
      {flick > 0.3 ? <pointLight position={[cx, 2.2, z1 + 0.5]} color="#ff2e3a" intensity={1.6 * flick} distance={4} decay={2} /> : null}
      {/* pichação lateral */}
      <Plane p={[x1 + 0.005, 1.7, -3.4]} rot={[0, Math.PI / 2, 0]} s={[2.4, 0.9]} map={pixoTexture("casa", 2)} transparent basic />
      {/* telão */}
      <group position={[cx, 3.05, z1 - 0.02]}>
        <Box p={[0, 0, -0.06]} s={[1.75, 1.05, 0.1]} c="#101012" />
        <Plane p={[0, 0.02, 0.0]} s={[1.6, 0.9]} map={post > 0.05 ? showPhotoTexture("telao") : signTexture("HOJE: RAP", { bg: "#0a0a0c", fg: "#ff3a44", size: 120 })} emissive={0.9} basic />
        {post > 0.05 ? (
          <>
            <Plane p={[0, 0.33, 0.01]} s={[1.6 * post, 0.18]} map={signTexture("@casadeshow", { bg: "#ffffff", fg: "#111", size: 100, h: 140 })} basic />
            <group position={[0.45, -0.34 - cut * 2.6, 0.012 + cut * 0.4]} rotation={[0, 0, cut * 2.4]}>
              <Plane p={[0, 0, 0]} s={[0.62, 0.15]} map={signTexture("@você", { bg: "#e3262f", fg: "#fff", size: 100, h: 140 })} basic />
            </group>
            {cut > 0 && cut < 0.7 ? <Scissors at={[0.15 + cut * 0.6, -0.34, 0.08]} k={cut} /> : null}
          </>
        ) : null}
      </group>
      {/* palco */}
      <Box p={[0.6, 0.18, -4.75]} s={[2.4, 0.36, 0.9]} c="#2a2a2e" />
      <Box p={[0.6, 0.37, -4.32]} s={[2.4, 0.02, 0.04]} c="#e3262f" emissive="#e3262f" ei={1.5 * lights} shadow={false} />
      {[-0.45, 1.65].map((x) => (
        <group key={x}>
          <Box p={[x, 0.62, -4.8]} s={[0.4, 0.55, 0.36]} c="#0f0f10" />
          <Box p={[x, 1.08, -4.8]} s={[0.4, 0.38, 0.36]} c="#0f0f10" />
          <mesh position={[x, 0.62, -4.61]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
            <meshStandardMaterial {...MATTE} color="#333" />
          </mesh>
        </group>
      ))}
      {/* artista no palco */}
      {lights > 0.02 ? <Figure position={[1.3, 0.36, -4.8]} yaw={-15} variant="rapper" seed="mc" bounce={jump} /> : null}
      {/* treliça e luzes */}
      <Box p={[0.6, 2.3, -4.4]} s={[2.8, 0.06, 0.06]} c="#555" shadow={false} />
      {[-0.4, 0.6, 1.6].map((x, i) => {
        const sweep = Math.sin(frame / 13 + i * 2.1) * 0.45;
        const col = i === 1 ? "#ff2e3a" : "#3a6bff";
        return (
          <group key={x} position={[x, 2.25, -4.4]} rotation={[0.55 + 0.15 * Math.sin(frame / 17 + i), 0, sweep]}>
            <mesh>
              <cylinderGeometry args={[0.06, 0.09, 0.14, 8]} />
              <meshStandardMaterial {...MATTE} color="#222" emissive={col} emissiveIntensity={lights} />
            </mesh>
            {lights > 0.02 ? (
              <mesh position={[0, -1.1, 0]}>
                <coneGeometry args={[0.42, 2.2, 18, 1, true]} />
                <meshBasicMaterial color={col} transparent opacity={0.08 * lights} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      {lights > 0.02 ? <pointLight position={[0.6, 1.6, -4.0]} color="#ff4050" intensity={1.8 * lights} distance={5} decay={2} /> : null}
      {lights > 0.02 ? <pointLight position={[-0.2, 1.8, -2.8]} color="#4a6bff" intensity={1.6 * lights} distance={5} decay={2} /> : null}
      {/* plateia */}
      {showCrowd
        ? CROWD.map((c, i) => (
            <Figure key={i} position={[c.x, 0.06, c.z]} yaw={180 + (rand(c.seed + "y") - 0.5) * 50} variant="crowd" seed={c.seed} bounce={jump} />
          ))
        : null}
      {/* porta do camarim */}
      <group position={[-1.0, 0, -5.13]}>
        <Box p={[0, 0.55, 0]} s={[0.62, 1.1, 0.04]} c="#0b0b0c" />
        <group position={[-0.27, 0, 0.03]} rotation={[0, (1 - door) * -1.4, 0]}>
          <Box p={[0.27, 0.53, 0]} s={[0.54, 1.04, 0.04]} c="#5a2a2e" />
          <Plane p={[0.27, 0.78, 0.025]} s={[0.24, 0.24]} map={signTexture("★", { bg: "#5a2a2e", fg: "#f6c518", w: 128, h: 128, size: 110 })} />
        </group>
        <Plane p={[0, 1.22, 0.03]} s={[0.6, 0.14]} map={signTexture("CAMARIM", { bg: "#111", fg: "#f2f0eb", size: 100, h: 140 })} />
        {door < 0.5 ? <pointLight position={[0, 0.9, 0.6]} color="#ffd59a" intensity={2.2} distance={3.2} decay={1.6} /> : null}
      </group>
    </group>
  );
};

const Scissors: React.FC<{ at: [number, number, number]; k: number }> = ({ at, k }) => {
  const open = 0.35 * Math.abs(Math.sin(k * 30));
  return (
    <group position={at}>
      {[1, -1].map((sg) => (
        <group key={sg} rotation={[0, 0, sg * open]}>
          <Box p={[0.12, 0, 0]} s={[0.24, 0.025, 0.01]} c="#d9d9d9" shadow={false} />
          <mesh position={[-0.05, sg * 0.04, 0]}>
            <torusGeometry args={[0.035, 0.012, 5, 10]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.negative} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- mercadinho
const Mercado: React.FC<{ frame: number; night: number }> = ({ frame, night }) => {
  const deny = clamp(track("register.deny", frame), 0, 1.3);
  return (
    <Cutaway x={[2.2, 4.4]} z={[1.6, 3.8]} h={1.5} wall="#ece7da" side="#e3decf" floor="#9d968a">
      {[0.4, 0.75, 1.1].map((y, r) => (
        <group key={r}>
          <Box p={[3.0, y, 1.78]} s={[1.5, 0.04, 0.26]} c="#c9c4b8" />
          {Array.from({ length: 8 }, (_, i) => (
            <Box key={i} p={[2.35 + i * 0.18, y + 0.1, 1.78]} s={[0.12, 0.16, 0.12]} c={["#e3262f", "#f6c518", "#2b6fe8", "#1fb257", "#f08a2a"][(i + r * 2) % 5]} />
          ))}
        </group>
      ))}
      {/* caixotes de fruta */}
      {[2.55, 2.95].map((x, i) => (
        <group key={x} position={[x, 0, 3.35]}>
          <Box p={[0, 0.12, 0]} s={[0.34, 0.24, 0.3]} c={PALETTE.wood} />
          {Array.from({ length: 6 }, (_, k) => (
            <mesh key={k} position={[-0.1 + (k % 3) * 0.1, 0.27, -0.06 + Math.floor(k / 3) * 0.12]}>
              <sphereGeometry args={[0.055, 6, 5]} />
              <meshStandardMaterial {...MATTE} color={i ? "#f2c230" : "#f08a2a"} />
            </mesh>
          ))}
        </group>
      ))}
      {/* caixa registradora */}
      <Box p={[3.95, 0.38, 2.85]} s={[0.5, 0.76, 0.9]} c="#cfc9bc" />
      <Box p={[3.92, 0.86, 2.75]} s={[0.26, 0.2, 0.3]} c="#3b3e44" />
      <mesh position={[3.78, 0.9, 2.75]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.24, 0.14]} />
        <meshBasicMaterial color={deny > 0.05 ? "#ff2a2a" : "#7affb0"} toneMapped={false} />
      </mesh>
      {deny > 0.05 ? <DenyX at={[3.75, 1.25, 2.8]} k={deny} /> : null}
      <Figure position={[4.12, 0.08, 2.85]} yaw={-90} variant="cashier" seed="caixa" />
      <Plane p={[3.3, 1.78, 1.64]} s={[1.9, 0.46]} map={signTexture("MERCADINHO", { bg: "#1f3a8a", fg: "#ffffff", border: "#f6c518", size: 104 })} emissive={night * 0.6} />
    </Cutaway>
  );
};

export const DenyX: React.FC<{ at: [number, number, number]; k: number }> = ({ at, k }) => (
  <group position={at} scale={clamp(k, 0, 1.3)}>
    {[1, -1].map((s) => (
      <mesh key={s} rotation={[0, 0, s * Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.11, 0.08]} />
        <meshStandardMaterial {...MATTE} color="#e3262f" emissive="#e3262f" emissiveIntensity={0.7} />
      </mesh>
    ))}
  </group>
);

// ---------------------------------------------------------------- ponto de ônibus
const Onibus: React.FC<{ frame: number; night: number }> = ({ frame, night }) => {
  const deny = clamp(track("turnstile.deny", frame), 0, 1.3);
  const fac = facadeTexture("pred-onibus", 5, 9, "#9b958b", "#33424f");
  const em = windowsTexture("pred-onibus", 5, 9, 0.4);
  return (
    <group>
      {/* prédio de trás */}
      <mesh position={[3.9, 1.8, -3.3]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 3.6, 2.2]} />
        <meshStandardMaterial {...MATTE} color="#ffffff" map={fac} emissive="#ffffff" emissiveMap={em} emissiveIntensity={night} />
      </mesh>
      <Plane p={[3.9, 3.1, -2.19]} s={[1.7, 0.8]} map={pixoTexture("onibus", 2)} transparent basic />
      <Plane p={[3.9, 1.0, -2.19]} s={[0.9, 0.36]} map={signTexture("VENDE-SE", { bg: "#f6c518", fg: "#111", size: 110 })} />
      {/* abrigo */}
      <Box p={[3.7, 1.02, -1.88]} s={[1.3, 0.05, 0.42]} c="#5b6066" />
      {[3.1, 4.3].map((x) => <Box key={x} p={[x, 0.5, -1.95]} s={[0.05, 1.0, 0.05]} c="#5b6066" />)}
      <Box p={[3.7, 0.55, -2.05]} s={[1.2, 0.7, 0.02]} c="#a9c4d4" />
      {/* ônibus */}
      <group position={[6.3, 0, -0.45]}>
        <Box p={[0, 0.58, 0]} s={[2.9, 0.95, 0.82]} c="#ececea" />
        <Box p={[0, 0.42, 0.001]} s={[2.92, 0.12, 0.84]} c="#c7262e" shadow={false} />
        <Box p={[0, 0.82, 0]} s={[2.7, 0.3, 0.84]} c="#2b3d4c" shadow={false} />
        <Box p={[-0.85, 0.55, -0.42]} s={[0.4, 0.75, 0.02]} c="#2b3d4c" shadow={false} />
        {[-0.95, 0.95].map((x) => (
          <mesh key={x} position={[x, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.86, 10]} />
            <meshStandardMaterial {...MATTE} color="#151515" />
          </mesh>
        ))}
        <Plane p={[1.452, 0.83, 0]} rot={[0, Math.PI / 2, 0]} s={[0.7, 0.2]} map={signTexture("CENTRO", { bg: "#111", fg: "#ffb02e", size: 110, h: 150 })} emissive={0.8} />
      </group>
      {/* catraca */}
      <group position={[3.6, 0, -1.4]}>
        <Box p={[0, 0.4, 0]} s={[0.16, 0.8, 0.22]} c="#8e9196" />
        <Box p={[0, 0.85, 0]} s={[0.2, 0.1, 0.26]} c="#3a3d42" />
        <mesh position={[-0.105, 0.86, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.16, 0.06]} />
          <meshBasicMaterial color={deny > 0.05 ? "#ff2a2a" : "#7affb0"} toneMapped={false} />
        </mesh>
        <group position={[-0.1, 0.6, 0]} rotation={[0, 0, deny > 0.05 ? 0 : (frame / 30) % 1]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} rotation={[(k * Math.PI * 2) / 3, 0, 0]} position={[-0.12, 0, 0]}>
              <boxGeometry args={[0.24, 0.03, 0.03]} />
              <meshStandardMaterial {...METAL_MAT} />
            </mesh>
          ))}
        </group>
        {deny > 0.05 ? <DenyX at={[-0.05, 1.3, 0]} k={deny} /> : null}
      </group>
    </group>
  );
};
const METAL_MAT = { roughness: 0.35, metalness: 0.6, flatShading: true, color: "#c9ccd1" } as const;

// ---------------------------------------------------------------- casas extras (cena das DMs)
const ExtraCasas: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("casasExtra", frame)) return null;
  const rise = clamp(track("casasExtra.rise", frame), 0, 1.2);
  const seen = Math.floor(track("seen.marks", frame));
  return (
    <group>
      {EXTRA_CASAS.map((c, i) => {
        const k = clamp(rise * 1.3 - i * 0.08, 0, 1.15);
        if (k <= 0.001) return null;
        return (
          <group key={i} position={[c.p[0], 0, c.p[1]]} scale={[1, k, 1]}>
            <Box p={[0, 0.75, 0]} s={[1.6, 1.5, 1.4]} c="#18181b" />
            <Plane p={[0, 1.25, 0.71]} s={[1.3, 0.42]} map={neonTexture(c.name, i % 2 ? "#3aa0ff" : "#ff2e3a")} transparent basic />
            <Box p={[0, 0.45, 0.71]} s={[0.45, 0.8, 0.02]} c="#2d2d31" />
            {i < seen ? <SeenMark at={[0, 2.4, 0.4]} /> : null}
          </group>
        );
      })}
    </group>
  );
};

const SeenMark: React.FC<{ at: [number, number, number] }> = ({ at }) => (
  <group position={at}>
    <Plane p={[0, 0, 0]} s={[1.7, 0.95]} map={cardTexture("visto", 256, 140, "#f2f0eb", [
      { text: "👁 VISTO", size: 64, color: "#3a3d42", y: 0.4 },
      { text: "✓✓", size: 54, color: "#2b6fe8", y: 0.8 },
    ])} basic />
  </group>
);

export const Buildings: React.FC = () => {
  const frame = useCurrentFrame();
  const night = nightness(frame);
  return (
    <group>
      <Padaria night={night} />
      <CallCenter night={night} />
      <Quarto frame={frame} night={night} />
      <CasaShow frame={frame} night={night} />
      <Mercado frame={frame} night={night} />
      <Onibus frame={frame} night={night} />
      <ExtraCasas frame={frame} />
    </group>
  );
};
