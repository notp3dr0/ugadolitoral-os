import { PAL } from "../theme";
import { lerp } from "../utils/anim";

// Boneco de peças articuladas, no padrão da referência (medido em 2026-11-04):
// cabeça pequena e quadrada (~1/7,5 da altura), corpo longo, peças retas que se sobrepõem
// (sem bola na junta, só um rebite discreto), contorno fino, faixa de luz em cada peça (volume de cilindro).
// Ângulos em graus RELATIVOS ao segmento pai; 0 = apontando pra baixo; positivo = pra frente.
// O boneco olha pra +x; use flip pra olhar pra -x.

export type Pose = {
  lean: number; // inclinação do tronco (0 em pé; 90 deitado pra frente)
  neck: number;
  armF: [number, number]; // [ombro, cotovelo] braço da frente
  armB: [number, number];
  legF: [number, number]; // [quadril, joelho] (joelho dobra pra trás: negativo)
  legB: [number, number];
  /** deslocamento vertical do quadril (agachar, sentar) */
  drop?: number;
};

export type Look = {
  skin: string;
  cloth: string;
  pants: string;
  shoes?: string;
  hair?: string | null;
  beard?: boolean;
  /** moletom com capuz (gola atrás do pescoço + cordões) */
  hood?: boolean;
  ghoul?: boolean;
  /** contorno colorido (use pouco; o padrão é contorno escuro fino) */
  rim?: string | null;
  /** visto de costas: sem rosto, cabelo cobrindo a nuca */
  back?: boolean;
  /** tudo numa cor só (sombra projetada, silhueta) */
  silhouette?: string;
};

export const LOOK_HERO: Look = { skin: "#e0c2a2", cloth: "#8a909e", pants: "#2a2d38", shoes: "#5a3f2c", hair: "#2a2220", beard: true, hood: true };
export const LOOK_VOCE: Look = { skin: "#e2c3a4", cloth: "#8b919f", pants: "#272a35", shoes: "#5b3e2a", hair: "#241c1a", beard: true, hood: true };
export const LOOK_GHOUL: Look = { skin: PAL.ghoul, cloth: "#8e94aa", pants: "#6a6f86", shoes: "#3a3d4c", hair: null, ghoul: true };

// proporções (px na escala 1). Altura total em pé ~ 470.
const D = { torso: 168, upper: 84, fore: 78, thigh: 108, shin: 106, headW: 66, headH: 80, bodyW: 62 };
const INK = PAL.ink;
const LINE = 2.4;

export const POSE = {
  stand: { lean: 0, neck: 0, armF: [3, 4], armB: [-3, 4], legF: [2, -2], legB: [-2, -2] } as Pose,
  sit: { lean: -4, neck: 0, armF: [20, 26], armB: [10, 20], legF: [88, -88], legB: [80, -86], drop: 50 } as Pose,
  aim: { lean: 4, neck: 0, armF: [86, -2], armB: [74, 10], legF: [10, -6], legB: [-14, -10] } as Pose,
  recoil: { lean: -8, neck: -4, armF: [70, 10], armB: [62, 16], legF: [14, -8], legB: [-18, -10] } as Pose,
  scared: { lean: -12, neck: -6, armF: [40, 60], armB: [34, 64], legF: [-8, -10], legB: [-20, -14] } as Pose,
  run: { lean: 20, neck: 0, armF: [70, 80], armB: [-60, 60], legF: [60, -70], legB: [-50, -30] } as Pose,
  crawl: { lean: 78, neck: -62, armF: [100, -14], armB: [86, -8], legF: [-8, -82], legB: [-22, -70], drop: 104 } as Pose,
};

export const blend = (a: Pose, b: Pose, t: number): Pose => ({
  lean: lerp(a.lean, b.lean, t),
  neck: lerp(a.neck, b.neck, t),
  armF: [lerp(a.armF[0], b.armF[0], t), lerp(a.armF[1], b.armF[1], t)],
  armB: [lerp(a.armB[0], b.armB[0], t), lerp(a.armB[1], b.armB[1], t)],
  legF: [lerp(a.legF[0], b.legF[0], t), lerp(a.legF[1], b.legF[1], t)],
  legB: [lerp(a.legB[0], b.legB[0], t), lerp(a.legB[1], b.legB[1], t)],
  drop: lerp(a.drop ?? 0, b.drop ?? 0, t),
});

/** Ciclo de caminhada procedural. `phase` em ciclos (1 = um passo completo). `amp` 1 = andar, 1.6 = correr. */
export const walkPose = (phase: number, amp = 1, base: Pose = POSE.stand): Pose => {
  const s = Math.sin(phase * Math.PI * 2);
  const c = Math.cos(phase * Math.PI * 2);
  return {
    ...base,
    lean: base.lean + 3 * amp,
    legF: [26 * amp * s, -(20 * amp) * Math.max(0, c) - 3],
    legB: [-26 * amp * s, -(20 * amp) * Math.max(0, -c) - 3],
    armF: [-20 * amp * s, 10 + 8 * amp],
    armB: [20 * amp * s, 10 + 8 * amp],
    drop: -4 * Math.abs(c) * amp,
  };
};

/** Escurece um hex (peça de trás, lado da sombra). */
function shade(hex: string, k = 0.72): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Uma peça reta (cápsula) com faixa de luz e sombra, girada no pivô de cima. */
const Piece: React.FC<{ len: number; w: number; fill: string; rot: number; rim?: string | null; flat?: boolean; children?: React.ReactNode }> = ({
  len,
  w,
  fill,
  rot,
  rim,
  flat,
  children,
}) => (
  <g transform={`rotate(${-rot})`}>
    <rect x={-w / 2} y={-w / 2} width={w} height={len + w} rx={w / 2} fill={fill} stroke={rim ?? INK} strokeWidth={LINE} />
    {flat ? null : (
      <>
        <rect x={w * 0.06} y={-w / 4} width={w * 0.22} height={len + w / 2} rx={w * 0.11} fill="#ffffff" opacity={0.13} />
        <rect x={-w / 2 + LINE} y={-w / 4} width={w * 0.2} height={len + w / 2} rx={w * 0.1} fill="#000000" opacity={0.16} />
      </>
    )}
    {/* rebite: a única marca de "peça" */}
    <circle cx={0} cy={0} r={2.6} fill={INK} opacity={0.45} />
    <g transform={`translate(0 ${len})`}>{children}</g>
  </g>
);

const Hand: React.FC<{ skin: string; children?: React.ReactNode }> = ({ skin, children }) => (
  <g>
    <rect x={-12} y={-4} width={24} height={30} rx={11} fill={skin} stroke={INK} strokeWidth={LINE} />
    <rect x={7} y={2} width={10} height={16} rx={5} fill={skin} stroke={INK} strokeWidth={LINE - 0.4} />
    {children}
  </g>
);

const Arm: React.FC<{ a: [number, number]; look: Look; hand?: React.ReactNode; flat?: boolean }> = ({ a, look, hand, flat }) => (
  <Piece len={D.upper} w={26} fill={look.cloth} rot={a[0]} rim={look.rim} flat={flat}>
    <Piece len={D.fore} w={23} fill={look.cloth} rot={a[1]} rim={look.rim} flat={flat}>
      {/* punho do moletom */}
      <rect x={-12} y={-8} width={24} height={9} rx={3} fill={shade(look.cloth, 0.85)} stroke={INK} strokeWidth={LINE - 0.6} />
      <Hand skin={look.skin}>{hand}</Hand>
    </Piece>
  </Piece>
);

const Leg: React.FC<{ a: [number, number]; look: Look; flat?: boolean }> = ({ a, look, flat }) => (
  <Piece len={D.thigh} w={31} fill={look.pants} rot={a[0]} rim={look.rim} flat={flat}>
    <Piece len={D.shin} w={28} fill={look.pants} rot={a[1]} rim={look.rim} flat={flat}>
      {/* bota */}
      <path d="M-15 -6 H12 Q20 -6 26 2 L38 8 Q42 18 34 20 H-15Z" fill={look.shoes ?? "#1b1b26"} stroke={INK} strokeWidth={LINE} />
      <rect x={-15} y={15} width={52} height={6} rx={3} fill={shade(look.shoes ?? "#1b1b26", 0.55)} />
    </Piece>
  </Piece>
);

/** Cabeça quadrada de perfil (olhando pra +x). Origem = base do pescoço. */
const Head: React.FC<{ look: Look }> = ({ look }) => {
  const { headW: w, headH: h } = D;
  const x0 = -w / 2 + 4;
  const y0 = -h - 8;
  const stroke = look.rim ?? INK;
  if (look.back) {
    return (
      <g>
        <rect x={x0} y={y0} width={w} height={h} rx={16} fill={look.hair ?? "#222"} stroke={stroke} strokeWidth={LINE} />
        <rect x={x0 + 10} y={y0 + h - 22} width={w - 20} height={20} rx={8} fill={look.skin} opacity={0.9} />
      </g>
    );
  }
  return (
    <g>
      <rect x={x0} y={y0} width={w} height={h} rx={16} fill={look.skin} stroke={stroke} strokeWidth={LINE} />
      {look.ghoul ? (
        <>
          <ellipse cx={x0 + w * 0.72} cy={y0 + h * 0.42} rx={9} ry={12} fill="#0a0a14" />
          <ellipse cx={x0 + w * 0.36} cy={y0 + h * 0.42} rx={8} ry={11} fill="#0a0a14" />
          <ellipse cx={x0 + w * 0.72} cy={y0 + h * 0.4} rx={3.5} ry={4.5} fill="#fff" />
          <ellipse cx={x0 + w * 0.6} cy={y0 + h * 0.8} rx={8} ry={11} fill="#0a0a14" />
        </>
      ) : (
        <>
          {/* cabelo chapado: topo + nuca */}
          {look.hair ? <path d={`M${x0 - 1} ${y0 + 30} V${y0 + 14} Q${x0 - 1} ${y0 - 2} ${x0 + 16} ${y0 - 2} H${x0 + w - 8} Q${x0 + w + 1} ${y0 - 2} ${x0 + w + 1} ${y0 + 12} V${y0 + 16} H${x0 + 26} V${y0 + 36} Q${x0 + 10} ${y0 + 34} ${x0 - 1} ${y0 + 30}Z`} fill={look.hair} stroke={INK} strokeWidth={LINE - 0.4} /> : null}
          {/* orelha */}
          <rect x={x0 + 14} y={y0 + 34} width={11} height={18} rx={5} fill={shade(look.skin, 0.86)} stroke={INK} strokeWidth={1.6} />
          {/* barba cobrindo a mandíbula até o queixo */}
          {look.beard ? <path d={`M${x0 + 12} ${y0 + 46} Q${x0 + 18} ${y0 + h + 4} ${x0 + w * 0.7} ${y0 + h + 3} Q${x0 + w + 2} ${y0 + h} ${x0 + w + 1} ${y0 + 56} Q${x0 + w * 0.8} ${y0 + 62} ${x0 + w * 0.62} ${y0 + 56} Q${x0 + 34} ${y0 + 60} ${x0 + 26} ${y0 + 46}Z`} fill={look.hair ?? "#2a2220"} opacity={0.92} /> : null}
          {/* olho grande perto da frente + sobrancelha */}
          <circle cx={x0 + w - 13} cy={y0 + 34} r={10} fill="#fff" stroke={INK} strokeWidth={LINE - 0.4} />
          <circle cx={x0 + w - 10} cy={y0 + 34} r={4.6} fill={INK} />
          <path d={`M${x0 + w - 24} ${y0 + 20} L${x0 + w - 4} ${y0 + 19}`} stroke={look.hair ?? INK} strokeWidth={4} strokeLinecap="round" />
          {/* nariz: um degrau na frente */}
          <path d={`M${x0 + w} ${y0 + 38} L${x0 + w + 6} ${y0 + 48} L${x0 + w} ${y0 + 50}`} fill={look.skin} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        </>
      )}
    </g>
  );
};

/** Tronco longo de moletom: gola de capuz atrás, cordões, bolso canguru, volume em faixa. */
const Torso: React.FC<{ look: Look; flat?: boolean }> = ({ look, flat }) => {
  const w = D.bodyW;
  const h = D.torso;
  const stroke = look.rim ?? INK;
  return (
    <g>
      {look.hood ? <rect x={-w / 2 - 4} y={-h - 14} width={w * 0.7} height={34} rx={15} fill={shade(look.cloth, 0.82)} stroke={INK} strokeWidth={LINE} /> : null}
      <rect x={-w / 2} y={-h} width={w} height={h + 10} rx={14} fill={look.cloth} stroke={stroke} strokeWidth={LINE} />
      {flat ? null : (
        <>
          <rect x={w * 0.02} y={-h + 8} width={w * 0.2} height={h - 4} rx={6} fill="#fff" opacity={0.12} />
          <rect x={-w / 2 + LINE} y={-h + 8} width={w * 0.16} height={h - 4} rx={6} fill="#000" opacity={0.15} />
        </>
      )}
      {look.hood && !look.back ? (
        <>
          <line x1={w * 0.16} y1={-h + 10} x2={w * 0.12} y2={-h + 58} stroke="#eef0f4" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
          <line x1={w * 0.34} y1={-h + 10} x2={w * 0.32} y2={-h + 54} stroke="#eef0f4" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
          <path d={`M${-w * 0.1} ${-56} H${w / 2 - 4} V${-22} H${-w * 0.1}Z`} fill="none" stroke={INK} strokeWidth={1.6} opacity={0.6} />
        </>
      ) : null}
      {/* barra do moletom */}
      <rect x={-w / 2} y={-4} width={w} height={12} rx={4} fill={shade(look.cloth, 0.86)} stroke={INK} strokeWidth={LINE - 0.6} />
    </g>
  );
};

type Props = {
  x: number;
  y: number; // y do chão (sola)
  scale?: number;
  flip?: boolean;
  pose: Pose;
  look?: Look;
  /** objeto na mão da frente (arma, lanterna, foto). Referencial da mão: +y = direção do antebraço. */
  hand?: React.ReactNode;
};

export const Puppet: React.FC<Props> = ({ x, y, scale = 1, flip = false, pose, look: look0 = LOOK_HERO, hand }) => {
  const sil = look0.silhouette;
  const look: Look = sil ? { ...look0, skin: sil, cloth: sil, pants: sil, shoes: sil, hair: sil, rim: null, back: true } : look0;
  const flat = !!sil;
  const back: Look = { ...look, cloth: shade(look.cloth), skin: shade(look.skin), pants: shade(look.pants), shoes: shade(look.shoes ?? "#1b1b26") };
  const hipY = -(D.thigh + D.shin) - 6 + (pose.drop ?? 0);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <g transform={`translate(0 ${hipY})`}>
        <g transform={`rotate(${pose.lean}) translate(-4 ${-D.torso + 26})`}>
          <Arm a={pose.armB} look={sil ? look : back} flat={flat} />
        </g>
        <Leg a={pose.legB} look={sil ? look : back} flat={flat} />
        <Leg a={pose.legF} look={look} flat={flat} />
        <g transform={`rotate(${pose.lean})`}>
          <g transform={`translate(0 ${-D.torso + 4}) rotate(${pose.neck})`}>
            <rect x={-10} y={-14} width={20} height={20} fill={look.skin} stroke={INK} strokeWidth={LINE - 0.6} />
            <Head look={look} />
          </g>
          <Torso look={look} flat={flat} />
          <g transform={`translate(4 ${-D.torso + 26})`}>
            <Arm a={pose.armF} look={look} hand={hand} flat={flat} />
          </g>
        </g>
      </g>
    </g>
  );
};

/** Altura do boneco em pé (escala 1), útil pra enquadrar. */
export const PUPPET_HEIGHT = D.thigh + D.shin + 6 + D.torso + D.headH + 8;
