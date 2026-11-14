import { random, useCurrentFrame } from "remotion";
import { EASE, prog } from "../utils/anim";
import { H, W } from "../theme";

// Acabamento e efeitos. Tudo determinístico (função do frame).

/** Grão + vinheta + tinta de cor. Vai SEMPRE por cima do plano, abaixo da legenda. */
export const Film: React.FC<{ grain?: number; vignette?: number; tint?: string; tintOpacity?: number }> = ({
  grain = 0.16,
  vignette = 0.75,
  tint,
  tintOpacity = 0,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2); // grão muda a cada 2 frames: "vivo" sem cintilar
  return (
    <>
      {tint ? <div style={{ position: "absolute", inset: 0, background: tint, opacity: tintOpacity, mixBlendMode: "multiply" }} /> : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,6,${vignette}) 100%)`,
        }}
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: grain, pointerEvents: "none" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </>
  );
};

/** Flash branco curto (susto, estouro de luz). `at` = frame local. */
export const Flash: React.FC<{ at: number; dur?: number; color?: string; peak?: number }> = ({ at, dur = 8, color = "#ffffff", peak = 0.9 }) => {
  const frame = useCurrentFrame();
  const t = prog(frame, at, at + dur, EASE.out);
  const o = frame < at ? 0 : peak * (1 - t);
  return <div style={{ position: "absolute", inset: 0, background: color, opacity: o, pointerEvents: "none" }} />;
};

/** Preto por cima: entrada e saída do plano. `inF` e `outF` em frames; `total` = duração do plano. */
export const FadeBlack: React.FC<{ total: number; inF?: number; outF?: number }> = ({ total, inF = 0, outF = 0 }) => {
  const frame = useCurrentFrame();
  const a = inF > 0 ? 1 - prog(frame, 0, inF, EASE.soft) : 0;
  const b = outF > 0 ? prog(frame, total - outF, total, EASE.soft) : 0;
  return <div style={{ position: "absolute", inset: 0, background: "#000", opacity: Math.max(a, b), pointerEvents: "none" }} />;
};

type ShardsProps = {
  /** origem em coordenadas da tela */
  x: number;
  y: number;
  at: number; // frame local do estouro
  count?: number;
  color?: string;
  power?: number;
  seed?: string;
};

/** Estilhaços (madeira, vidro) com gravidade. */
export const Shards: React.FC<ShardsProps> = ({ x, y, at, count = 22, color = "#8a6a47", power = 1, seed = "shard" }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 40) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const ang = (r("a") - 0.5) * Math.PI * 1.2 + Math.PI; // pra esquerda por padrão
        const v = (6 + r("v") * 18) * power;
        const px = x + Math.cos(ang) * v * t;
        const py = y + Math.sin(ang) * v * t + 0.9 * t * t;
        const rot = r("r") * 360 + t * (r("w") - 0.5) * 40;
        const w = 10 + r("w") * 26;
        const h = 4 + r("h") * 8;
        return <rect key={i} x={px - w / 2} y={py - h / 2} width={w} height={h} fill={color} stroke="#0a0a14" strokeWidth={1.5} opacity={1 - t / 42} transform={`rotate(${rot} ${px} ${py})`} />;
      })}
    </svg>
  );
};

/** Fumaça de tiro: bolhas que crescem e somem. */
export const Smoke: React.FC<{ x: number; y: number; at: number; dir?: number; seed?: string }> = ({ x, y, at, dir = 1, seed = "smoke" }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 36) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const r = random(`${seed}-${i}`);
        const cx = x + dir * (t * (3 + r * 5) + i * 4);
        const cy = y - t * (1 + r * 2) - i * 2;
        const rad = 14 + t * (1.6 + r * 1.2);
        return <circle key={i} cx={cx} cy={cy} r={rad} fill="#c9ccd8" opacity={Math.max(0, 0.55 - t / 60)} />;
      })}
    </svg>
  );
};
