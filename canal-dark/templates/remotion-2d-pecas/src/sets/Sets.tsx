import { random, useCurrentFrame } from "remotion";
import { Puppet, LOOK_GHOUL, POSE, blend, walkPose } from "../engine/Puppet";
import { TallyWall } from "../engine/Hud";
import { EASE, prog } from "../utils/anim";
import { H, PAL, W } from "../theme";

// Cenários em SVG. Cada um declara o tamanho do seu "mundo" (a Camera2D passeia por ele).
// Regra de cor: noite azul-arroxeada + UM acento quente. O resto é neutro.
// Troque os desenhos por série; mantenha os contratos (tamanho do mundo e âncoras documentadas).

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.night1} />
      <stop offset="1" stopColor={PAL.night2} />
    </linearGradient>
    <linearGradient id="floorg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#1c1a2c" />
      <stop offset="1" stopColor="#0a0a14" />
    </linearGradient>
    <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.dusk[0]} />
      <stop offset="0.55" stopColor={PAL.dusk[1]} />
      <stop offset="1" stopColor={PAL.dusk[2]} />
    </linearGradient>
    <linearGradient id="steelg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#b7bfd4" />
      <stop offset="1" stopColor="#6c7494" />
    </linearGradient>
  </defs>
);

/* ---------- Planks: tábuas pregadas numa abertura ---------- */
const Planks: React.FC<{ x: number; y: number; w: number; h: number; n?: number; gap?: string; broken?: number }> = ({ x, y, w, h, n = 5, gap = "#101a3a", broken = 0 }) => {
  const ph = h / n;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={gap} stroke={PAL.ink} strokeWidth={4} />
      {Array.from({ length: n }).map((_, i) => {
        const skip = i < broken;
        const ry = y + i * ph + 6;
        return skip ? null : (
          <g key={i}>
            <rect x={x - 14 + (i % 2) * 8} y={ry} width={w + 28 - (i % 2) * 16} height={ph - 14} rx={3} fill={i % 2 ? PAL.wood : "#7a5c3c"} stroke={PAL.ink} strokeWidth={3} />
            <circle cx={x + 16} cy={ry + (ph - 14) / 2} r={5} fill={PAL.woodDark} />
            <circle cx={x + w - 16} cy={ry + (ph - 14) / 2} r={5} fill={PAL.woodDark} />
          </g>
        );
      })}
    </g>
  );
};

/* ---------- 1. Porta com olho mágico (detalhe, sem personagem) ---------- */
// mundo 1080x1920. Âncora do olho mágico: (540, 760).
export const DoorDetail: React.FC = () => (
  <svg width={W} height={H}>
    <Defs />
    <rect width={W} height={H} fill="#1b1d2e" />
    {Array.from({ length: 6 }).map((_, i) => (
      <line key={i} x1={i * 200} y1={0} x2={i * 200} y2={H} stroke="#0f1020" strokeWidth={5} />
    ))}
    <ellipse cx={600} cy={380} rx={180} ry={120} fill="#4a3a28" opacity={0.35} />
    {/* rachaduras */}
    <path d="M80 330 L260 400 L330 560 L220 700 M330 560 L520 660 L600 880 M520 660 L760 600 L960 700" stroke="#05050c" strokeWidth={5} fill="none" strokeLinecap="round" />
    <path d="M600 880 L560 1000 M260 400 L300 250" stroke="#05050c" strokeWidth={4} fill="none" strokeLinecap="round" />
    <circle cx={540} cy={800} r={58} fill="#7d849c" stroke={PAL.ink} strokeWidth={5} />
    <circle cx={540} cy={800} r={36} fill="#0b0b16" stroke="#3a3f58" strokeWidth={4} />
    <path d="M530 788 L548 800 L530 812" stroke="#aeb6cf" strokeWidth={5} fill="none" strokeLinecap="round" />
  </svg>
);

/* ---------- 2. Quarto com janela tapada ---------- */
// mundo 1500x1920. Janela: x 860..1280, y 420..940. Chão (pé do boneco): y = 1500.
export const ROOM = { w: 1500, h: 1920, floorY: 1500, window: { x: 860, y: 420, w: 420, h: 520 } } as const;

export const RoomSet: React.FC<{ tally?: number; children?: React.ReactNode; broken?: number }> = ({ tally = 190, children, broken = 0 }) => (
  <svg width={ROOM.w} height={ROOM.h} style={{ position: "absolute", left: 0, top: 0 }}>
    <Defs />
    <rect width={ROOM.w} height={ROOM.floorY} fill="url(#wallg)" />
    <rect y={ROOM.floorY} width={ROOM.w} height={ROOM.h - ROOM.floorY} fill="url(#floorg)" />
    <rect y={ROOM.floorY - 6} width={ROOM.w} height={10} fill="#0a0a14" />
    <g opacity={0.9}>
      <TallyWall x={90} y={250} w={700} h={520} count={tally} />
    </g>
    <Planks x={ROOM.window.x} y={ROOM.window.y} w={ROOM.window.w} h={ROOM.window.h} broken={broken} />
    {/* cama */}
    <g>
      <rect x={90} y={1290} width={520} height={30} rx={8} fill="#4b3727" stroke={PAL.ink} strokeWidth={4} />
      <rect x={96} y={1210} width={34} height={290} rx={8} fill="#4b3727" stroke={PAL.ink} strokeWidth={4} />
      <rect x={590} y={1250} width={30} height={250} rx={8} fill="#4b3727" stroke={PAL.ink} strokeWidth={4} />
      <rect x={130} y={1250} width={110} height={52} rx={22} fill="#dfe3ee" stroke={PAL.ink} strokeWidth={3.5} />
      <path d="M240 1262 H590 V1318 H240Z" fill="#33498a" stroke={PAL.ink} strokeWidth={3.5} />
    </g>
    {children}
  </svg>
);

/* ---------- 3. Rua ao pôr do sol com paralaxe ---------- */
// mundo 1080x1920; `pan` 0..1 desloca as camadas em velocidades diferentes (poste da frente passa rápido).
const house = (x: number, y: number, w: number, h: number, c: string, key: number) => (
  <g key={key}>
    <rect x={x} y={y} width={w} height={h} fill={c} />
    <path d={`M${x - 14} ${y} L${x + w / 2} ${y - w * 0.32} L${x + w + 14} ${y}Z`} fill={c} />
    <rect x={x + w * 0.2} y={y + h * 0.3} width={w * 0.18} height={h * 0.2} fill="#1b1124" />
    <rect x={x + w * 0.62} y={y + h * 0.3} width={w * 0.18} height={h * 0.2} fill="#1b1124" />
  </g>
);

export const StreetDusk: React.FC<{ pan: number; darkness?: number }> = ({ pan, darkness = 0 }) => {
  const PAN = 560;
  const tx = (factor: number) => `translate(${-pan * PAN * factor} 0)`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <Defs />
      <rect width={W} height={H} fill="url(#skyg)" />
      <circle cx={760 - pan * 40} cy={760} r={78} fill="#ffe3b0" opacity={0.95} />
      <g transform={tx(0.25)}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => house(-80 + i * 300, 880 - (i % 3) * 30, 230, 220 + (i % 3) * 30, "#3a2a4e", i))}
      </g>
      <g transform={tx(0.6)}>
        {[0, 1, 2, 3, 4].map((i) => house(-30 + i * 420, 940, 330, 280, "#2a1f3e", 10 + i))}
        {/* postes e fios */}
        {[200, 780, 1360, 1940].map((px, i) => (
          <g key={i}>
            <rect x={px} y={720} width={12} height={560} fill="#171024" />
            <rect x={px - 50} y={760} width={112} height={8} fill="#171024" />
          </g>
        ))}
        <path d="M200 770 Q490 830 780 770 T1360 770 T1940 770" stroke="#171024" strokeWidth={4} fill="none" />
      </g>
      {/* rua */}
      <rect y={1260} width={W} height={H - 1260} fill="#231a30" />
      <rect y={1250} width={W} height={14} fill="#3a2d46" />
      <g transform={tx(0.9)}>
        {/* carro abandonado */}
        <g transform="translate(240 1150)">
          <path d="M0 110 L20 50 Q40 20 90 20 H210 Q250 20 270 60 L300 110 Z" fill="#8f8ca3" stroke={PAL.ink} strokeWidth={5} />
          <path d="M50 52 H130 V98 H34Z M146 52 H220 L246 98 H146Z" fill="#26273a" stroke={PAL.ink} strokeWidth={3} />
          <circle cx={74} cy={116} r={30} fill="#17171f" stroke={PAL.ink} strokeWidth={4} />
          <circle cx={238} cy={116} r={30} fill="#17171f" stroke={PAL.ink} strokeWidth={4} />
        </g>
        {/* mato */}
        {Array.from({ length: 40 }).map((_, i) => {
          const gx = i * 62 - 40;
          return <path key={i} d={`M${gx} 1330 q6 -50 ${(i % 3) * 8 - 8} -90`} stroke="#2f3a32" strokeWidth={4} fill="none" opacity={0.75} />;
        })}
      </g>
      {/* poste da frente: passa rápido, escuro, dá profundidade */}
      <g transform={tx(1.9)}>
        <rect x={1240} y={0} width={46} height={H} fill="#07060d" />
      </g>
      <rect width={W} height={H} fill="#05061a" opacity={darkness} />
    </svg>
  );
};

/* ---------- 4. Corredor em POV (para a lanterna) ---------- */
// mundo 1080x1920. Fundo do corredor em (540, 760).
export const CorridorSet: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <Defs />
    <rect width={W} height={H} fill="#0a0a14" />
    <path d="M0 0 L420 560 V1020 L0 1500Z" fill="#17182b" />
    <path d="M1080 0 L660 560 V1020 L1080 1500Z" fill="#14152a" />
    <path d="M0 1500 L420 1020 H660 L1080 1500 V1920 H0Z" fill="#1c1a2c" />
    <rect x={420} y={560} width={240} height={460} fill="#05050c" />
    <rect x={150} y={420} width={60} height={46} fill="#e9c88a" opacity={0.5} />
    {children}
  </svg>
);

/* ---------- 5. Porta de aço com olhos ---------- */
// mundo 1080x1920. `eyes` 0..1 faz os olhos aparecerem um a um.
const EYES: [number, number, number][] = [
  [470, 560, 66],
  [700, 800, 58],
  [430, 960, 74],
  [660, 1120, 62],
  [540, 1280, 52],
];
export const SteelDoor: React.FC<{ eyes: number }> = ({ eyes }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <Defs />
      <rect width={W} height={H} fill="#0a0b16" />
      <rect x={170} y={260} width={740} height={1360} rx={10} fill="url(#steelg)" stroke={PAL.ink} strokeWidth={6} />
      <rect x={170} y={920} width={740} height={22} fill={PAL.steelDark} />
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={i}>
          <circle cx={210} cy={300 + i * 148} r={8} fill={PAL.steelDark} />
          <circle cx={870} cy={300 + i * 148} r={8} fill={PAL.steelDark} />
        </g>
      ))}
      <rect x={720} y={904} width={170} height={56} rx={10} fill="#3d4258" stroke={PAL.ink} strokeWidth={4} />
      {EYES.map(([ex, ey, er], i) => {
        const t = prog(eyes * EYES.length, i, i + 0.6, EASE.out);
        if (t <= 0) return null;
        const look = Math.sin(frame / 14 + i) * 5;
        return (
          <g key={i} opacity={t} transform={`translate(${ex} ${ey}) scale(${0.7 + 0.3 * t})`}>
            <ellipse rx={er} ry={er * 0.8} fill="#eef0fa" stroke={PAL.ink} strokeWidth={4} />
            <ellipse cx={look} cy={er * 0.08} rx={er * 0.42} ry={er * 0.46} fill="#1a1a28" />
            <circle cx={look - er * 0.12} cy={-er * 0.08} r={er * 0.1} fill="#fff" />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------- 6. Fresta da janela com o rosto (susto) ---------- */
// O rosto vive ATRÁS das tábuas: só se vê pelos vãos. Três tábuas finas deixam o rosto legível.
export const WindowGapScare: React.FC<{ rise?: number }> = ({ rise = 1 }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <Defs />
    <rect width={W} height={H} fill="#1a1411" />
    <rect x={0} y={700} width={W} height={520} fill="#16224a" />
    <g transform={`translate(0 ${(1 - rise) * 200})`}>
      <ellipse cx={540} cy={980} rx={200} ry={250} fill={PAL.ghoul} stroke={PAL.ink} strokeWidth={5} />
      <ellipse cx={465} cy={930} rx={46} ry={56} fill="#0a0a14" />
      <ellipse cx={615} cy={930} rx={46} ry={56} fill="#0a0a14" />
      <ellipse cx={465} cy={921} rx={17} ry={22} fill="#fff" />
      <ellipse cx={615} cy={921} rx={17} ry={22} fill="#fff" />
      <ellipse cx={540} cy={1090} rx={56} ry={92} fill="#0a0a14" />
      {/* mãos batendo nas tábuas */}
      <g stroke={PAL.ink} strokeWidth={4} fill={PAL.ghoulShade}>
        <rect x={250} y={690} width={38} height={150} rx={17} transform="rotate(-8 268 765)" />
        <rect x={304} y={670} width={34} height={160} rx={16} transform="rotate(4 320 750)" />
        <rect x={800} y={690} width={38} height={150} rx={17} transform="rotate(10 818 765)" />
        <rect x={744} y={670} width={34} height={160} rx={16} transform="rotate(-4 760 750)" />
      </g>
    </g>
    {[760, 1000, 1150].map((y, i) => (
      <g key={i}>
        <rect x={-10} y={y} width={W + 20} height={i === 0 ? 70 : 54} fill={i % 2 ? PAL.wood : "#7a5c3c"} stroke={PAL.ink} strokeWidth={4} />
        <circle cx={60} cy={y + 30} r={6} fill={PAL.woodDark} />
        <circle cx={W - 60} cy={y + 30} r={6} fill={PAL.woodDark} />
      </g>
    ))}
    <rect x={0} y={1230} width={W} height={H - 1230} fill="#2a1f19" />
    <rect x={0} y={0} width={W} height={690} fill="#2a1f19" />
  </svg>
);

/* ---------- 7. Fachada com a horda (revelação de escala) ---------- */
export const HordeWide: React.FC<{ reveal: number }> = ({ reveal }) => {
  const frame = useCurrentFrame();
  const n = 30;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <Defs />
      <rect width={W} height={H} fill="#0a0c1e" />
      <rect x={160} y={260} width={760} height={1000} fill="#1b2146" stroke={PAL.ink} strokeWidth={5} />
      {[0, 1].map((c) =>
        [0, 1, 2].map((r) => (
          <g key={`${c}-${r}`}>
            <rect x={240 + c * 360} y={340 + r * 300} width={160} height={190} fill="#0a0b18" stroke={PAL.ink} strokeWidth={4} />
            {[0, 1, 2].map((b) => (
              <rect key={b} x={240 + c * 360} y={360 + r * 300 + b * 60} width={160} height={10} fill="#4a3a2a" />
            ))}
            <ellipse cx={290 + c * 360} cy={430 + r * 300} rx={13} ry={16} fill="#eef0fa" opacity={0.85 * prog(reveal, 0.15 + r * 0.1, 0.6)} />
            <ellipse cx={350 + c * 360} cy={430 + r * 300} rx={13} ry={16} fill="#eef0fa" opacity={0.85 * prog(reveal, 0.15 + r * 0.1, 0.6)} />
          </g>
        )),
      )}
      <rect x={470} y={980} width={140} height={280} fill="#0a0b18" stroke={PAL.ink} strokeWidth={4} />
      <rect y={1260} width={W} height={660} fill="#10112a" />
      {Array.from({ length: n }).map((_, i) => {
        const rr = (k: string) => random(`horde-${i}-${k}`);
        const x = 60 + rr("x") * 960;
        const y = 1330 + rr("y") * 480;
        const sc = 0.2 + (y - 1330) / 480 * 0.28;
        const pose = blend(POSE.stand, walkPose(frame / 40 + rr("p"), 0.7, { ...POSE.stand, armF: [70, 4], armB: [64, 6] }), 1);
        return (
          <g key={i} opacity={prog(reveal, rr("d") * 0.7, rr("d") * 0.7 + 0.3)}>
            <Puppet x={x} y={y} scale={sc} pose={pose} look={LOOK_GHOUL} flip={rr("f") > 0.5} />
          </g>
        );
      })}
    </svg>
  );
};
