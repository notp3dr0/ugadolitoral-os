import { random, useCurrentFrame } from "remotion";
import { noise } from "../utils/anim";
import { H, W } from "../theme";

// Luz: feixe volumétrico com poeira (entra por frestas) e cone de lanterna em POV.
// São os dois recursos que mais separam "boneco no fundo chapado" de "cena com atmosfera".

type BeamProps = {
  /** ponto de origem do feixe (na janela/fresta) e ponto de destino (chão/parede) */
  from: [number, number];
  to: [number, number];
  /** largura do feixe na origem e no destino */
  w0?: number;
  w1?: number;
  color?: string;
  opacity?: number;
  /** oscilação suave de intensidade (0 = nenhuma) */
  flicker?: number;
};

export const LightBeam: React.FC<BeamProps> = ({ from, to, w0 = 120, w1 = 360, color = "#ffd9a0", opacity = 0.42, flicker = 0.08 }) => {
  const frame = useCurrentFrame();
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const pts = [
    [from[0] + (nx * w0) / 2, from[1] + (ny * w0) / 2],
    [to[0] + (nx * w1) / 2, to[1] + (ny * w1) / 2],
    [to[0] - (nx * w1) / 2, to[1] - (ny * w1) / 2],
    [from[0] - (nx * w0) / 2, from[1] - (ny * w0) / 2],
  ]
    .map((p) => p.join(","))
    .join(" ");
  const o = opacity * (1 + flicker * noise(frame / 12, "beam"));
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "screen", pointerEvents: "none", overflow: "visible" }}>
      <defs>
        <linearGradient id="beamg" gradientUnits="userSpaceOnUse" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
          <stop offset="0" stopColor={color} stopOpacity={o} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id="beamblur">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <polygon points={pts} fill="url(#beamg)" filter="url(#beamblur)" />
    </svg>
  );
};

type DustProps = { box: [number, number, number, number]; count?: number; seed?: string; color?: string; speed?: number };

/** Poeira em suspensão dentro de uma caixa [x, y, largura, altura]. Determinística. */
export const Dust: React.FC<DustProps> = ({ box, count = 36, seed = "dust", color = "#ffe2b0", speed = 1 }) => {
  const frame = useCurrentFrame();
  const [bx, by, bw, bh] = box;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const x = bx + ((r("x") * bw + frame * speed * (0.15 + r("vx") * 0.35)) % bw);
        const y = by + ((r("y") * bh - frame * speed * (0.1 + r("vy") * 0.3) + bh * 4) % bh);
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / (18 + r("t") * 30) + r("p") * 6));
        return <circle key={i} cx={x} cy={y} r={1.2 + r("r") * 2.4} fill={color} opacity={tw * 0.75} />;
      })}
    </svg>
  );
};

type FlashProps = {
  /** origem do cone (tela, px) e direção em graus (0 = direita, 90 = baixo) */
  x: number;
  y: number;
  angle: number;
  length?: number;
  spread?: number; // meio-ângulo em graus
  /** escuridão fora do cone, 0–1 */
  dark?: number;
  color?: string;
  /** treme levemente, como lanterna na mão */
  shake?: number;
};

/** Lanterna em POV: tudo escuro fora do cone, cone com luz fria e borda suave. Coloque POR CIMA da cena. */
export const Flashlight: React.FC<FlashProps> = ({ x, y, angle, length = 1500, spread = 16, dark = 0.88, color = "#cfd8ff", shake = 2 }) => {
  const frame = useCurrentFrame();
  const a = angle + shake * noise(frame / 5, "fl");
  const rad = (d: number) => (d * Math.PI) / 180;
  const p = (deg: number): [number, number] => [x + Math.cos(rad(deg)) * length, y + Math.sin(rad(deg)) * length];
  const [ax, ay] = p(a - spread);
  const [bx, by] = p(a + spread);
  const cone = `${x},${y} ${ax},${ay} ${bx},${by}`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="flblur">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <mask id="flmask">
          <rect width={W} height={H} fill="white" />
          <polygon points={cone} fill="black" filter="url(#flblur)" />
        </mask>
        <radialGradient id="flcore" gradientUnits="userSpaceOnUse" cx={x} cy={y} r={length}>
          <stop offset="0" stopColor={color} stopOpacity={0.55} />
          <stop offset="0.6" stopColor={color} stopOpacity={0.2} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`rgba(3,3,10,${dark})`} mask="url(#flmask)" />
      <polygon points={cone} fill="url(#flcore)" filter="url(#flblur)" style={{ mixBlendMode: "screen" }} />
    </svg>
  );
};
