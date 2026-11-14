import { useCurrentFrame } from "remotion";
import { FONT, H, PAL, W } from "../theme";
import { EASE, prog } from "../utils/anim";
import { LOOK_VOCE, POSE, Puppet } from "../engine/Puppet";

// Cenários da série Revelação (estúdio Foto Aurora). Coordenadas em px do "mundo" de cada cenário.
// Paleta: noite azul (recepção, cais) × vermelho de laboratório (lab). Um acento: ACCENT.

export const ACCENT = "#ff4a2e";
export const LAB = { bg0: "#120303", bg1: "#2a0707", bg2: "#4a0d0b", glow: "#ff2a1a", paper: "#d8a89c" } as const;

const Grad: React.FC = () => (
  <defs>
    <linearGradient id="rv-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0d0f1f" />
      <stop offset="1" stopColor="#1c2140" />
    </linearGradient>
    <linearGradient id="rv-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#1f1a22" />
      <stop offset="1" stopColor="#09080c" />
    </linearGradient>
    <linearGradient id="rv-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#070912" />
      <stop offset="1" stopColor="#38425e" />
    </linearGradient>
    <linearGradient id="rv-sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2a3350" />
      <stop offset="1" stopColor="#05060c" />
    </linearGradient>
    <linearGradient id="rv-lab" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={LAB.bg0} />
      <stop offset="0.6" stopColor={LAB.bg1} />
      <stop offset="1" stopColor={LAB.bg0} />
    </linearGradient>
    <radialGradient id="rv-safe" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={LAB.glow} stopOpacity="0.9" />
      <stop offset="1" stopColor={LAB.glow} stopOpacity="0" />
    </radialGradient>
    <linearGradient id="rv-wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6b4c33" />
      <stop offset="1" stopColor="#3d2a1c" />
    </linearGradient>
  </defs>
);

/** Ponteiros de relógio parados em 03:17 (centro cx, cy; raio r). */
const ClockHands: React.FC<{ cx: number; cy: number; r: number; color?: string }> = ({ cx, cy, r, color = "#1a1a22" }) => {
  const hour = ((3 + 17 / 60) / 12) * 360;
  const min = (17 / 60) * 360;
  const hand = (ang: number, len: number, w: number) => {
    const a = ((ang - 90) * Math.PI) / 180;
    return <line x1={cx} y1={cy} x2={cx + Math.cos(a) * len} y2={cy + Math.sin(a) * len} stroke={color} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <g>
      {hand(hour, r * 0.5, r * 0.09)}
      {hand(min, r * 0.78, r * 0.06)}
      <circle cx={cx} cy={cy} r={r * 0.07} fill={color} />
    </g>
  );
};

/* ================= 1. Fachada com letreiro apagado ================= */
// mundo 1080×1920. Letreiro em y 560–860. Porta em y 1100–1700.
export const Fachada: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <Grad />
    <rect width={W} height={H} fill="url(#rv-sky)" />
    <rect x={0} y={300} width={W} height={H - 300} fill="#1a1d31" />
    {Array.from({ length: 12 }).map((_, i) => (
      <line key={i} x1={i * 96} y1={300} x2={i * 96} y2={H} stroke="#11131f" strokeWidth={5} />
    ))}
    <path d="M-20 300 L540 120 L1100 300Z" fill="#12141f" />
    {/* letreiro */}
    <rect x={110} y={540} width={860} height={330} rx={16} fill="#0e0f18" stroke="#3b3e52" strokeWidth={6} />
    <text x={540} y={720} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={100} fill="none" stroke="#5a3a36" strokeWidth={6} letterSpacing={4}>
      FOTO AURORA
    </text>
    <text x={540} y={820} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill="#4a4a5e" letterSpacing={14}>
      DESDE 1961
    </text>
    {/* parafusos e cabos do tubo */}
    {[150, 930].map((x) => (
      <circle key={x} cx={x} cy={575} r={9} fill="#3b3e52" />
    ))}
    <path d="M540 870 V1040" stroke="#2a2c3a" strokeWidth={6} />
    {/* porta com vidro */}
    <rect x={330} y={1100} width={420} height={640} fill="#251a16" stroke={PAL.ink} strokeWidth={6} />
    <rect x={380} y={1150} width={320} height={260} fill="#0b0d16" stroke="#3b2e26" strokeWidth={6} />
    <circle cx={700} cy={1450} r={14} fill="#8c7a5a" />
    <rect x={0} y={1740} width={W} height={180} fill="#0d0c12" />
  </svg>
);

/* ================= 2. Cais na névoa ================= */
// mundo 1080×1920. Ponto de fuga (540, 880). O estúdio é a casinha no fim.
export const Cais: React.FC = () => {
  const vy = 880;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const N = 18;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <Grad />
      <rect width={W} height={vy} fill="url(#rv-sky)" />
      <rect y={vy} width={W} height={H - vy} fill="url(#rv-sea)" />
      {Array.from({ length: 14 }).map((_, i) => {
        const y = vy + 20 + i * i * 6;
        return <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#56618a" strokeWidth={1.5 + i * 0.2} opacity={0.18} />;
      })}
      {/* estúdio no fim */}
      <g transform="translate(540 868)">
        <rect x={-70} y={-70} width={140} height={70} fill="#0b0c14" />
        <path d="M-82 -70 L0 -112 L82 -70Z" fill="#0b0c14" />
        <rect x={-46} y={-56} width={92} height={18} fill="#1f1418" />
      </g>
      {/* tábuas em perspectiva */}
      <path d={`M140 ${H} L505 ${vy} H575 L940 ${H}Z`} fill="#2b2420" />
      {Array.from({ length: N }).map((_, k) => {
        const t = (k / N) ** 2;
        const y = lerp(vy, H, t);
        const xl = lerp(505, 140, t);
        const xr = lerp(575, 940, t);
        return <line key={k} x1={xl} y1={y} x2={xr} y2={y} stroke="#15110f" strokeWidth={1 + t * 6} />;
      })}
      {/* postes do corrimão */}
      {Array.from({ length: 9 }).map((_, k) => {
        const t = ((k + 1) / 10) ** 2;
        const y = lerp(vy, H, t);
        const h = 20 + t * 300;
        const w = 3 + t * 22;
        return (
          <g key={k}>
            <rect x={lerp(505, 140, t) - w} y={y - h} width={w} height={h} fill="#120e0c" />
            <rect x={lerp(575, 940, t)} y={y - h} width={w} height={h} fill="#120e0c" />
          </g>
        );
      })}
      <path d={`M495 ${vy - 20} L120 ${H - 300}`} stroke="#120e0c" strokeWidth={10} />
      <path d={`M585 ${vy - 20} L960 ${H - 300}`} stroke="#120e0c" strokeWidth={10} />
    </svg>
  );
};

/* ================= 3. Recepção (o estúdio por dentro) ================= */
// mundo 2400×1920. Chão em y 1500.
// Âncoras: porta da frente x 170–470 (tranca em 440,1130) · janela 560–860 · retrato (1080,720)
// relógio (1350,560) · balcão 950–1500 (câmera de fole em 1230,1230) · sala de pose 1560–1960
// canto vazio ~ x 2000 · porta do laboratório 2070–2330 · interruptor da luz branca (2030,1120)
export const REC = { w: 2400, h: 1920, floorY: 1500, lock: [440, 1130], corner: 2000, camera: [1230, 1230], switch: [2030, 1120] } as const;

export const Recepcao: React.FC<{ doorOpen?: number; lockTurn?: number; labGlow?: number; children?: React.ReactNode }> = ({ doorOpen = 0, lockTurn = 1, labGlow = 1, children }) => {
  const dw = 300 * (1 - 0.82 * doorOpen);
  return (
    <svg width={REC.w} height={REC.h} style={{ position: "absolute", left: 0, top: 0 }}>
      <Grad />
      <rect width={REC.w} height={REC.floorY} fill="url(#rv-wall)" />
      <rect y={1250} width={REC.w} height={250} fill="#141832" />
      <rect y={1244} width={REC.w} height={10} fill="#0b0d1c" />
      <rect y={REC.floorY} width={REC.w} height={REC.h - REC.floorY} fill="url(#rv-floor)" />
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={i * 84} y1={REC.floorY} x2={i * 84 - 40} y2={REC.h} stroke="#0c0a0e" strokeWidth={3} />
      ))}
      {/* porta da frente: vão mostra o cais na névoa quando aberta */}
      <rect x={170} y={760} width={300} height={740} fill="#4a5672" />
      <path d="M200 1500 L320 1000 H330 L450 1500Z" fill="#2b2420" opacity={doorOpen} />
      <rect x={170} y={760} width={300} height={740} fill="none" stroke="#0a0a12" strokeWidth={10} />
      <rect x={170} y={760} width={dw} height={740} fill="#2a1e18" stroke={PAL.ink} strokeWidth={5} />
      {doorOpen < 0.3 ? (
        <g>
          <rect x={210} y={810} width={220} height={300} fill="#191210" stroke="#3a2a20" strokeWidth={5} opacity={1 - doorOpen * 3} />
          <circle cx={REC.lock[0]} cy={REC.lock[1]} r={18} fill="#9c8a62" stroke={PAL.ink} strokeWidth={3} />
          <rect x={REC.lock[0] - 4} y={REC.lock[1] - 14} width={8} height={28} rx={3} fill="#3a3022" transform={`rotate(${lockTurn * 90} ${REC.lock[0]} ${REC.lock[1]})`} />
        </g>
      ) : null}
      {/* janela com persiana */}
      <rect x={560} y={700} width={300} height={400} fill="#203058" stroke="#0a0a12" strokeWidth={8} />
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={566} y={708 + i * 36} width={288} height={22} fill="#323a52" />
      ))}
      {/* retrato da Aurora */}
      <g>
        <ellipse cx={1080} cy={720} rx={120} ry={150} fill="#6a5130" stroke={PAL.ink} strokeWidth={5} />
        <ellipse cx={1080} cy={720} rx={98} ry={128} fill="#b9a585" />
        <path d="M990 840 Q1080 760 1170 840 L1170 848 H990Z" fill="#4a3c2c" />
        <ellipse cx={1080} cy={700} rx={38} ry={46} fill="#8f7b5e" />
        <ellipse cx={1080} cy={652} rx={30} ry={20} fill="#3d3024" />
      </g>
      {/* relógio parado */}
      <circle cx={1350} cy={560} r={70} fill="#d9d4c5" stroke="#3a2a20" strokeWidth={8} />
      <ClockHands cx={1350} cy={560} r={64} />
      {/* balcão */}
      <rect x={950} y={1230} width={550} height={270} fill="url(#rv-wood)" stroke={PAL.ink} strokeWidth={5} />
      <rect x={930} y={1210} width={590} height={28} rx={6} fill="#7a573a" stroke={PAL.ink} strokeWidth={4} />
      <MiniCamera x={REC.camera[0]} y={REC.camera[1] - 22} s={0.42} />
      {/* sala de pose: fundo de papel e banquinho */}
      <rect x={1560} y={410} width={400} height={22} rx={10} fill="#2a2d40" />
      <path d="M1580 430 H1940 V1430 Q1940 1500 2010 1500 H1510 Q1580 1500 1580 1430Z" fill="#3a3f5a" />
      <g stroke={PAL.ink} strokeWidth={4}>
        <rect x={1700} y={1340} width={120} height={22} rx={8} fill="#6b4c33" />
        <rect x={1712} y={1360} width={12} height={140} fill="#4b3727" />
        <rect x={1796} y={1360} width={12} height={140} fill="#4b3727" />
      </g>
      {/* canto vazio (de onde a foto foi tirada) */}
      <rect x={1960} y={0} width={110} height={REC.floorY} fill="#090b17" opacity={0.85} />
      <line x1={2010} y1={0} x2={2010} y2={REC.floorY} stroke="#05060c" strokeWidth={4} />
      {/* interruptor da luz branca */}
      <rect x={REC.switch[0] - 17} y={REC.switch[1] - 27} width={34} height={54} rx={5} fill="#d9d9e0" stroke={PAL.ink} strokeWidth={3} />
      <rect x={REC.switch[0] - 5} y={REC.switch[1] - 12} width={10} height={14} rx={2} fill="#8a8a96" />
      {/* porta do laboratório, com luz vermelha vazando por baixo */}
      <rect x={2070} y={780} width={260} height={720} fill="#170c0c" stroke={PAL.ink} strokeWidth={5} />
      <rect x={2140} y={860} width={120} height={36} rx={4} fill="#2a1414" />
      <text x={2200} y={886} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={16} fill="#8a4a44" letterSpacing={2}>
        LABORATÓRIO
      </text>
      <rect x={2076} y={1486} width={248} height={14} fill={LAB.glow} opacity={0.85 * labGlow} />
      <ellipse cx={2200} cy={1505} rx={240} ry={30} fill={LAB.glow} opacity={0.25 * labGlow} />
      {children}
    </svg>
  );
};

/** Câmera de fole (pequena, pra ficar em cena). */
export const MiniCamera: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={PAL.ink} strokeWidth={4}>
    <rect x={-150} y={-90} width={90} height={150} rx={6} fill="#22232c" />
    <path d="M-60 -70 L-40 -80 L-20 -60 L0 -80 L20 -60 L40 -80 L60 -70 V40 L40 50 L20 30 L0 50 L-20 30 L-40 50 L-60 40Z" fill="#1a1416" />
    <rect x={60} y={-80} width={60} height={130} rx={6} fill="#2b2c36" />
    <circle cx={150} cy={-15} r={42} fill="#15161c" />
    <circle cx={150} cy={-15} r={26} fill="#34405a" />
  </g>
);

/* ================= 4. Relógio (detalhe) ================= */
export const RelogioDetalhe: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <Grad />
    <rect width={W} height={H} fill="url(#rv-wall)" />
    <circle cx={540} cy={900} r={400} fill="#3a2a20" />
    <circle cx={540} cy={900} r={360} fill="#d9d4c5" />
    {Array.from({ length: 60 }).map((_, i) => {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      const r1 = big ? 300 : 325;
      return <line key={i} x1={540 + Math.cos(a) * r1} y1={900 + Math.sin(a) * r1} x2={540 + Math.cos(a) * 345} y2={900 + Math.sin(a) * 345} stroke="#2a2a30" strokeWidth={big ? 10 : 4} />;
    })}
    <text x={540} y={760} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#5a4a3a" letterSpacing={6}>
      AURORA
    </text>
    <ClockHands cx={540} cy={900} r={330} />
    {/* vidro rachado */}
    <path d="M700 620 L620 760 L660 860 M620 760 L520 800 M660 860 L760 980" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={4} fill="none" />
    <ellipse cx={430} cy={760} rx={150} ry={60} fill="#ffffff" opacity={0.08} transform="rotate(-30 430 760)" />
  </svg>
);

/* ================= 5. Câmera de fole (detalhe) ================= */
// mundo 1080×1920. Lente em (720, 820); contador em (300, 1150).
export const CameraDetalhe: React.FC<{ counter?: string }> = ({ counter = "36" }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <Grad />
    <rect width={W} height={H} fill="#0d0f1c" />
    <rect y={1300} width={W} height={620} fill="#4a3424" />
    <rect y={1290} width={W} height={20} fill="#6b4c33" />
    <g stroke={PAL.ink} strokeWidth={6}>
      <rect x={130} y={620} width={330} height={680} rx={18} fill="#22232c" />
      <path d="M460 680 L520 650 L580 700 L640 650 L700 700 L760 660 V1240 L700 1280 L640 1230 L580 1280 L520 1230 L460 1270Z" fill="#1a1416" />
      <rect x={760} y={640} width={150} height={640} rx={14} fill="#2b2c36" />
      <circle cx={835} cy={900} r={130} fill="#15161c" />
      <circle cx={835} cy={900} r={88} fill="#34405a" />
      <circle cx={815} cy={875} r={22} fill="#7f8bb0" opacity={0.6} />
      {/* janela do contador */}
      <rect x={210} y={1080} width={170} height={130} rx={10} fill="#0a0a10" />
    </g>
    <text x={295} y={1168} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={76} fill={ACCENT}>
      {counter}
    </text>
    <text x={295} y={1060} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill="#7a7a8a" letterSpacing={4}>
      POSES
    </text>
  </svg>
);

/* ================= 6. Laboratório (luz vermelha) ================= */
// mundo 1500×1920. Chão em y 1500. Bancada y 1180. Interruptor da luz branca (1130, 1100). Lâmpada (700, 360).
export const LABSET = { w: 1500, h: 1920, floorY: 1500, switch: [1130, 1100], lamp: [700, 360] } as const;

export const Laboratorio: React.FC<{ safe?: number; children?: React.ReactNode }> = ({ safe = 1, children }) => (
  <svg width={LABSET.w} height={LABSET.h} style={{ position: "absolute", left: 0, top: 0 }}>
    <Grad />
    <rect width={LABSET.w} height={LABSET.h} fill="url(#rv-lab)" />
    <rect y={LABSET.floorY} width={LABSET.w} height={LABSET.h - LABSET.floorY} fill="#0a0202" />
    {/* lâmpada de segurança */}
    <ellipse cx={LABSET.lamp[0]} cy={LABSET.lamp[1] + 40} rx={520} ry={420} fill="url(#rv-safe)" opacity={0.55 * safe} />
    <rect x={LABSET.lamp[0] - 90} y={LABSET.lamp[1] - 40} width={180} height={80} rx={10} fill={safe > 0.1 ? "#ff3a22" : "#3a0a08"} stroke={PAL.ink} strokeWidth={5} opacity={0.5 + 0.5 * safe} />
    <line x1={LABSET.lamp[0]} y1={0} x2={LABSET.lamp[0]} y2={LABSET.lamp[1] - 40} stroke="#1a0606" strokeWidth={6} />
    {/* varal com cópias */}
    <path d="M100 520 Q700 560 1300 520" stroke="#2a0808" strokeWidth={4} fill="none" />
    {[260, 480, 900, 1120].map((x, i) => (
      <g key={x}>
        <rect x={x - 70} y={540 + (i % 2) * 6} width={140} height={180} fill={LAB.paper} opacity={0.55} stroke={PAL.ink} strokeWidth={3} />
        <rect x={x - 8} y={524} width={16} height={30} fill="#1a0606" />
      </g>
    ))}
    {/* ampliadora */}
    <g stroke={PAL.ink} strokeWidth={5}>
      <rect x={180} y={720} width={26} height={460} fill="#1c0808" />
      <rect x={130} y={720} width={180} height={120} rx={10} fill="#2a0c0a" />
      <rect x={170} y={840} width={100} height={60} fill="#1a0606" />
    </g>
    {/* bancada com três bandejas */}
    <rect x={100} y={1180} width={1060} height={40} fill="#2a0a08" stroke={PAL.ink} strokeWidth={5} />
    <rect x={120} y={1220} width={30} height={280} fill="#1a0505" />
    <rect x={1110} y={1220} width={30} height={280} fill="#1a0505" />
    {[400, 640, 880].map((x) => (
      <rect key={x} x={x - 100} y={1158} width={200} height={26} rx={6} fill="#3a0d0b" stroke={PAL.ink} strokeWidth={3} />
    ))}
    {/* porta e interruptor da luz branca (com fita escrito BRANCA) */}
    <rect x={1180} y={760} width={250} height={740} fill="#1a0505" stroke={PAL.ink} strokeWidth={5} />
    <rect x={LABSET.switch[0] - 20} y={LABSET.switch[1] - 32} width={40} height={64} rx={6} fill="#e8e4e0" stroke={PAL.ink} strokeWidth={3} />
    <rect x={LABSET.switch[0] - 6} y={LABSET.switch[1] - 14} width={12} height={16} rx={2} fill="#8a8a96" />
    <rect x={LABSET.switch[0] - 34} y={LABSET.switch[1] + 42} width={68} height={22} fill="#e9d38a" transform={`rotate(-4 ${LABSET.switch[0]} ${LABSET.switch[1] + 52})`} />
    <text x={LABSET.switch[0]} y={LABSET.switch[1] + 59} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={15} fill="#3a2a10" transform={`rotate(-4 ${LABSET.switch[0]} ${LABSET.switch[1] + 52})`}>
      BRANCA
    </text>
    {children}
  </svg>
);

/* ================= 7. Bandeja vista de cima, com a foto ================= */
// mundo 1080×1920. Papel em x 210–870, y 640–1320 (4:4.1). `slide` 0→1 desliza o papel pra dentro.
export const PAPER = { x: 210, y: 640, w: 660, h: 680 } as const;

export const Bandeja: React.FC<{ slide?: number; children?: React.ReactNode; tongs?: boolean }> = ({ slide = 1, children, tongs = true }) => {
  const frame = useCurrentFrame();
  const dy = (1 - slide) * -760;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <Grad />
        <rect width={W} height={H} fill="#1c0404" />
        <rect x={110} y={500} width={860} height={960} rx={40} fill="#2c0707" stroke={PAL.ink} strokeWidth={8} />
        <rect x={150} y={540} width={780} height={880} rx={28} fill="#3a0a08" />
      </svg>
      <div style={{ position: "absolute", left: PAPER.x, top: PAPER.y + dy, width: PAPER.w, height: PAPER.h, background: LAB.paper, boxShadow: "0 6px 0 rgba(0,0,0,.35)", overflow: "hidden" }}>
        {children}
      </div>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        {/* reflexo do líquido e ondinhas */}
        {[0, 1, 2].map((i) => {
          const r = 120 + ((frame * 1.2 + i * 90) % 280);
          return <ellipse key={i} cx={620} cy={980} rx={r * 1.3} ry={r} fill="none" stroke="#ff6a50" strokeOpacity={0.12 * (1 - r / 400)} strokeWidth={3} />;
        })}
        <rect x={150} y={540} width={780} height={880} rx={28} fill="#ff3a22" opacity={0.12} />
        {tongs ? (
          <g transform={`translate(0 ${dy})`} stroke={PAL.ink} strokeWidth={4}>
            <rect x={760} y={300} width={26} height={380} rx={8} fill="#c9c2b0" transform="rotate(-10 773 490)" />
            <rect x={800} y={300} width={26} height={380} rx={8} fill="#b4ad9b" transform="rotate(-4 813 490)" />
          </g>
        ) : null}
      </svg>
    </div>
  );
};

/* ================= 8. A foto revelada ================= */
// Conteúdo de uma pose: a recepção vista de um ponto, em p&b com o carimbo de hora.
// `emerge` 0→1 faz a imagem aparecer como no revelador (contraste e densidade sobem).
export const Foto: React.FC<{
  w: number;
  h: number;
  emerge?: number;
  /** recorte do mundo da recepção mostrado na foto: x, y, zoom */
  view?: { x: number; y: number; zoom: number };
  doorOpen?: number;
  stamp?: string;
  /** você de costas na foto (segunda imagem) */
  voceDeCostas?: boolean;
}> = ({ w, h, emerge = 1, view = { x: 760, y: 1000, zoom: 0.62 }, doorOpen = 1, stamp = "03:17", voceDeCostas = false }) => {
  const e = Math.max(0, Math.min(1, emerge));
  const z = view.zoom * (w / PAPER.w); // a mesma composição em qualquer tamanho de foto
  const tx = w / 2 - view.x * z;
  const ty = h / 2 - view.y * z;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: LAB.paper }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: REC.w,
          height: REC.h,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${z})`,
          filter: `grayscale(1) sepia(0.25) brightness(${1.9 - 0.9 * e}) contrast(${0.35 + 0.85 * e}) blur(${(1 - e) * 3}px)`,
          opacity: 0.15 + 0.85 * e,
        }}
      >
        <Recepcao doorOpen={doorOpen} labGlow={0}>
          {voceDeCostas ? <Puppet x={1240} y={REC.floorY} scale={1.05} pose={POSE.stand} look={{ ...LOOK_VOCE, back: true }} /> : null}
        </Recepcao>
      </div>
      {/* carimbo de data em laranja, como os de câmera antiga */}
      <div style={{ position: "absolute", right: w * 0.05, bottom: h * 0.04, fontFamily: "Courier New, monospace", fontWeight: 700, fontSize: h * 0.06, color: "#ff7a2e", opacity: e, textShadow: "0 0 8px rgba(255,90,30,.8)", letterSpacing: 2 }}>
        {stamp}
      </div>
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 ${w * 0.08}px rgba(60,20,10,.45)` }} />
    </div>
  );
};

/* ================= 9. Parede no flash: as duas sombras ================= */
// mundo 1080×1920. `lit` 1 = parede estourada de luz; 0 = escuro.
export const ParedeFlash: React.FC<{ lit: number }> = ({ lit }) => {
  const wall = `rgb(${Math.round(30 + 205 * lit)}, ${Math.round(32 + 205 * lit)}, ${Math.round(48 + 200 * lit)})`;
  const sh = "#07070c";
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id="rv-shblur">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={wall} />
      <rect y={1560} width={W} height={360} fill="#141218" opacity={0.8} />
      <g filter="url(#rv-shblur)" opacity={0.92}>
        {/* sua sombra */}
        <Puppet x={360} y={1580} scale={1.5} pose={{ ...POSE.stand, neck: 6 }} look={{ ...LOOK_VOCE, silhouette: sh }} />
        {/* sombra do tripé com a câmera de fole, ao lado da sua */}
        <g fill={sh} stroke={sh}>
          <line x1={760} y1={980} x2={640} y2={1580} strokeWidth={16} />
          <line x1={760} y1={980} x2={880} y2={1580} strokeWidth={16} />
          <line x1={760} y1={980} x2={770} y2={1580} strokeWidth={14} />
          <rect x={690} y={880} width={150} height={110} rx={8} />
          <path d="M840 900 L900 880 V990 L840 970Z" />
          <circle cx={920} cy={935} r={36} />
        </g>
      </g>
    </svg>
  );
};

/** Lâmpada vermelha morrendo: piscadas e apagão. Use como `safe` do Laboratorio. */
export const dyingLight = (frame: number, start: number, end: number) => {
  if (frame < start) return 1;
  if (frame >= end) return 0;
  const t = prog(frame, start, end, EASE.linear);
  const flick = Math.sin(frame * 2.7) > 0.2 ? 1 : 0.25;
  return (1 - t) * flick;
};
