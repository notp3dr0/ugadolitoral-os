import React from "react";
import {C} from "./theme";
import {arcoColar, BolaStrass, Cruz, Perola} from "./pecas";

// Personagem em silhueta. Estilização tirada dos reposts: dreads com ponta colorida,
// óculos ovais vermelhos, jaqueta larga aberta sobre camiseta vermelha, colares em camadas.

// ---------- P1: a figura minúscula, de costas ----------

export const Figurinha: React.FC<{x: number; pes: number; altura: number; cor?: string}> = ({x, pes, altura, cor = C.black}) => {
  const k = altura / 260;
  return (
    <g transform={`translate(${x} ${pes - altura}) scale(${k})`} fill={cor}>
      {/* dreads vistos de trás */}
      <path d="M-19 16 Q0 -8 19 16 L27 52 L21 70 L16 54 L11 74 L6 56 L0 76 L-6 56 L-11 74 L-16 54 L-21 70 L-27 52Z" />
      {/* jaqueta larga */}
      <path d="M-20 50 L20 50 L47 62 L58 150 L41 154 L36 150 L34 160 L-34 160 L-36 150 L-41 154 L-58 150 L-47 62Z" />
      {/* calça larga e tênis */}
      <path d="M-32 158 L32 158 L38 246 L7 248 L0 184 L-7 248 L-38 246Z" />
      <path d="M-44 260 L-40 246 L-5 246 L-5 260Z M44 260 L40 246 L5 246 L5 260Z" />
    </g>
  );
};

// ---------- P2 e P6: o busto, de frente, câmera baixa ----------

type Dread = {r: [number, number]; c: [number, number]; t: [number, number]; w: number; k: number};

const DREADS_TRAS: Dread[] = [
  {r: [452, 300], c: [380, 420], t: [372, 640], w: 30, k: 1},
  {r: [470, 280], c: [408, 470], t: [420, 716], w: 28, k: 0.8},
  {r: [440, 340], c: [348, 500], t: [326, 592], w: 28, k: 1.2},
  {r: [628, 300], c: [700, 420], t: [708, 650], w: 30, k: 1},
  {r: [610, 280], c: [672, 470], t: [662, 726], w: 28, k: 0.8},
  {r: [640, 340], c: [735, 500], t: [754, 600], w: 28, k: 1.2},
];
const DREADS_FRENTE: Dread[] = [
  {r: [508, 258], c: [468, 380], t: [452, 524], w: 26, k: 0.9},
  {r: [582, 258], c: [644, 360], t: [630, 498], w: 26, k: 0.9},
];

const dreadD = (d: Dread, sway: number, dx: number, t0 = 0) => {
  const r = [d.r[0] + dx, d.r[1]];
  const c = [d.c[0] + dx + sway * d.k * 0.5, d.c[1]];
  const t = [d.t[0] + dx + sway * d.k, d.t[1]];
  if (t0 === 0) return `M${r[0]} ${r[1]} Q${c[0]} ${c[1]} ${t[0]} ${t[1]}`;
  // trecho final da curva (de t0 a 1), para a ponta colorida
  const lerp = (a: number[], b: number[], u: number) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const a = lerp(r, c, t0);
  const b = lerp(c, t, t0);
  const p = lerp(a, b, t0);
  return `M${p[0].toFixed(1)} ${p[1].toFixed(1)} Q${b[0].toFixed(1)} ${b[1].toFixed(1)} ${t[0]} ${t[1]}`;
};

const Dreads: React.FC<{lista: Dread[]; cor: string; sway: number; dx: number; pontas?: string}> = ({lista, cor, sway, dx, pontas}) => (
  <g fill="none" strokeLinecap="round">
    {lista.map((d, i) => (
      <path key={i} d={dreadD(d, sway, dx)} stroke={cor} strokeWidth={d.w} />
    ))}
    {pontas
      ? lista.map((d, i) => <path key={`p${i}`} d={dreadD(d, sway, dx, 0.74)} stroke={pontas} strokeWidth={d.w} />)
      : null}
  </g>
);

const Silhueta: React.FC<{cor: string; turn: number; dread: number}> = ({cor, turn, dread}) => {
  const hx = 22 * turn; // a cabeça acompanha o giro
  const j: [number, number][] = [
    [610 + 10 * turn, 650],
    [688 + 18 * turn, 580],
    [742 + 20 * turn, 705],
    [965 + 22 * turn, 790 + 6 * turn],
    [1130 + 10 * turn, 905],
    [1170, 2700],
    [-90, 2700],
    [-50 + 30 * turn, 905],
    [115 + 60 * turn, 790 - 8 * turn],
    [338 + 30 * turn, 705],
    [392 + 18 * turn, 580],
    [470 + 10 * turn, 650],
    [540 + 10 * turn, 720],
  ];
  return (
    <g fill={cor}>
      <Dreads lista={DREADS_TRAS} cor={cor} sway={dread} dx={hx} />
      <path d={"M" + j.map((p) => p.join(" ")).join(" L") + "Z"} />
      <path d={`M${486 + 12 * turn} 540 L${594 + 12 * turn} 540 L${612 + 10 * turn} 705 L${468 + 10 * turn} 705Z`} />
      <path
        transform={`translate(${hx} 0)`}
        d="M436 300 Q540 214 644 300 L654 430 Q644 522 586 566 L494 566 Q436 522 426 430Z"
      />
    </g>
  );
};

export type BustoProps = {
  modo: "dia" | "eclipse";
  turn?: number; // 0..1, giro de uns 15 graus
  faixa?: number; // largura da faixa de sol na borda direita (dia)
  corTee?: string;
  cruzes?: [number, number, number]; // balanço das três cruzes do 1K2Q, em graus
  curto?: number; // balanço lateral do 1K2Q, px
  longo?: number; // balanço lateral do Radiant, px
  cruzLonga?: number; // graus
  luz?: number; // direção da luz nos crescentes
  dread?: number;
  brilho?: {esq?: boolean; meio?: boolean; dir?: boolean; longa?: boolean};
};

const SEQ_1K2Q = ["p", "p", "p", "b", "p", "p", "b", "p", "p", "p", "p", "b", "p", "p", "p", "p"];
const SEQ_RADIANT = ["o", "o", "o", "o", "b", "o", "o", "o", "o", "o", "b", "o", "o", "o", "o", "o", "b", "o", "o", "o", "o", "o", "o"];

export const Busto: React.FC<BustoProps> = ({
  modo,
  turn = 0,
  faixa = 0,
  corTee = C.red,
  cruzes = [0, 0, 0],
  curto = 0,
  longo = 0,
  cruzLonga = 0,
  luz = 270,
  dread = 0,
  brilho = {},
}) => {
  const hx = 22 * turn;
  const cx = 540 + 10 * turn + 55 * turn; // o centro dos colares desloca uns 6% no giro
  const aperto = 1 - 0.07 * turn;

  // 1K2Q: curto, na base do pescoço (41 cm). Radiant: aberto no ajuste máximo (56 cm).
  const k = arcoColar(cx, 668, 115 * aperto, 190);
  const r = arcoColar(cx, 690, 165 * aperto, 440);
  const passoK = 36;
  const passoR = 35;
  const pesoK = (prof: number) => curto * Math.pow(prof, 1.6);
  const pesoR = (prof: number) => longo * Math.pow(prof, 1.6);

  const contasK: React.ReactNode[] = [];
  SEQ_1K2Q.forEach((tipo, i) => {
    const s = (i + 0.5) * passoK;
    if (s > k.max - 6) return;
    [-1, 1].forEach((lado) => {
      const p = k.em(lado * s);
      const x = p.x + pesoK(p.prof);
      const key = `${i}${lado}`;
      contasK.push(
        tipo === "b" ? (
          <BolaStrass key={key} x={x} y={p.y} r={20} modo={modo} luz={luz} fundo={C.black} />
        ) : (
          <Perola key={key} x={x} y={p.y} r={17} modo={modo} luz={luz} />
        ),
      );
    });
  });

  const contasR: React.ReactNode[] = [];
  SEQ_RADIANT.forEach((tipo, i) => {
    const s = (i + 0.5) * passoR;
    if (s > r.max - 6) return;
    [-1, 1].forEach((lado) => {
      const p = r.em(lado * s);
      const x = p.x + pesoR(p.prof);
      const key = `${i}${lado}`;
      contasR.push(
        tipo === "b" ? (
          <BolaStrass key={key} x={x} y={p.y} r={17} modo={modo} luz={luz} fundo={C.black} />
        ) : (
          <Perola key={key} x={x} y={p.y} r={15} modo={modo} luz={luz} oca />
        ),
      );
    });
  });

  const pc = k.em(0);
  const pe = k.em(-3 * passoK);
  const pd = k.em(3 * passoK);
  const pr = r.em(0);
  const fundoCruz = corTee;

  const lente = (x: number, rot: number) => (
    <g transform={`translate(${x + hx + 8 * turn} 402) rotate(${rot})`}>
      <ellipse rx={40} ry={21} fill={C.red} />
      {modo === "eclipse" ? <circle cx={9} cy={-2} r={8} fill="none" stroke={C.paper} strokeWidth={3.5} /> : null}
    </g>
  );

  return (
    <g>
      {modo === "dia" ? (
        <>
          {/* sol: faixa vermelha de borda dura no lado direito das formas */}
          {faixa > 0 ? (
            <g transform={`translate(${faixa} ${-faixa * 0.15})`}>
              <Silhueta cor={C.red} turn={turn} dread={dread} />
            </g>
          ) : null}
          <Silhueta cor={C.black} turn={turn} dread={dread} />
        </>
      ) : (
        <>
          {/* totalidade: a luz vem de cima, do anel. Um filete nas arestas de cima. */}
          <g transform="translate(0 -7)">
            <Silhueta cor={C.paper} turn={turn} dread={dread} />
          </g>
          <Silhueta cor={C.black} turn={turn} dread={dread} />
        </>
      )}

      {/* camiseta na abertura da jaqueta */}
      <path
        d={`M${472 + 10 * turn} 657 Q${540 + 12 * turn} 752 ${608 + 10 * turn} 657 L${748 + 30 * turn} 2700 L${332 + 50 * turn} 2700Z`}
        fill={corTee}
      />

      <Dreads lista={DREADS_TRAS} cor="none" sway={dread} dx={hx} pontas={C.red} />
      {lente(493, -7)}
      {lente(587, 7)}
      <rect x={530 + hx + 8 * turn} y={397} width={20} height={7} fill={C.red} />
      <Dreads lista={DREADS_FRENTE} cor={C.black} sway={dread} dx={hx} pontas={C.red} />

      {/* Radiant por baixo, 1K2Q por cima */}
      {contasR}
      <Cruz
        x={pr.x + pesoR(pr.prof)}
        y={pr.y + 18}
        h={235}
        ang={cruzLonga}
        modo={modo}
        ornada
        fundo={fundoCruz}
        brilho={brilho.longa}
      />
      {contasK}
      <Cruz x={pe.x + pesoK(pe.prof)} y={pe.y + 19} h={96} ang={cruzes[0]} modo={modo} fundo={fundoCruz} brilho={brilho.esq} />
      <Cruz x={pd.x + pesoK(pd.prof)} y={pd.y + 19} h={96} ang={cruzes[2]} modo={modo} fundo={fundoCruz} brilho={brilho.dir} />
      <Cruz x={pc.x + pesoK(pc.prof)} y={pc.y + 19} h={136} ang={cruzes[1]} modo={modo} fundo={fundoCruz} brilho={brilho.meio} />
    </g>
  );
};

// ---------- P7: antebraço e mão ----------

const BracoForma: React.FC<{cor: string}> = ({cor}) => (
  <g fill={cor}>
    {/* manga da jaqueta, com o punho da manga em 700 */}
    <path d="M-400 -250 L700 -206 L700 206 L-400 262Z" />
    {/* antebraço */}
    <path d="M640 -152 L1100 -128 L1100 128 L640 152Z" />
    {/* mão fechada sem força, polegar por baixo */}
    <path d="M1100 -128 L1172 -158 L1300 -170 L1394 -150 L1452 -92 L1470 0 L1454 88 L1402 140 L1300 152 L1240 152 L1258 198 L1332 238 L1322 282 L1230 270 L1150 206 L1100 128Z" />
  </g>
);

export type BracoProps = {
  px: number; // cotovelo (pivô), em tela
  py: number;
  ang: number; // graus; negativo = mão para cima
  pulseira: number; // posição da G1 ao longo do antebraço (px a partir do cotovelo)
  estica?: number; // 1 = normal; >1 no desenho esticado do deslize
  rabicho?: number; // graus de balanço da ponta da corrente
  ceu: string;
};

export const Braco: React.FC<BracoProps> = ({px, py, ang, pulseira, estica = 1, rabicho = 0, ceu}) => {
  const rot = `translate(${px} ${py}) rotate(${ang})`;
  // meia largura do braço na posição da pulseira
  const hw = 152 - ((pulseira - 640) / 460) * 24 + 8;
  const bojo = 46 * estica;
  const seq = ["p", "p", "r", "p", "p", "p", "r", "p"];
  const luzLocal = 270 - ang; // luz de cima, na tela
  const amostras: {phi: number; s: number}[] = [];
  let comp = 0;
  for (let i = 0; i <= 160; i++) {
    const phi = ((-80 + i) * Math.PI) / 180;
    if (i > 0) {
      const p0 = ((-80 + i - 1) * Math.PI) / 180;
      comp += Math.hypot(bojo * (Math.cos(phi) - Math.cos(p0)), hw * (Math.sin(phi) - Math.sin(p0)));
    }
    amostras.push({phi, s: comp});
  }
  const larguras = seq.map((t) => (t === "p" ? 52 : 22));
  const totalL = larguras.reduce((a, b) => a + b, 0);
  let cursor = (comp - totalL) / 2;
  const contas = seq.map((tipo, i) => {
    const alvo = cursor + larguras[i] / 2;
    cursor += larguras[i];
    const phi = (amostras.find((a) => a.s >= alvo) ?? amostras[amostras.length - 1]).phi;
    const x = pulseira + bojo * Math.cos(phi);
    const y = hw * Math.sin(phi);
    if (tipo === "r") {
      const deg = (Math.atan2(hw * Math.cos(phi), -bojo * Math.sin(phi)) * 180) / Math.PI;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${deg})`}>
          <rect x={-7} y={-27} width={14} height={54} fill={C.paper} />
          {[-16, 0, 16].map((d) => (
            <circle key={d} cx={0} cy={d} r={3.6} fill={C.black} />
          ))}
        </g>
      );
    }
    return <Perola key={i} x={x} y={y} r={24} modo="eclipse" luz={luzLocal} />;
  });

  // ponta da corrente extensora: pendura do alto do punho e cai na vertical da tela
  const a = (ang * Math.PI) / 180;
  const phi0 = (-80 * Math.PI) / 180;
  const lx = pulseira + bojo * Math.cos(phi0);
  const ly = hw * Math.sin(phi0) - 6;
  const tx = px + lx * Math.cos(a) - ly * Math.sin(a);
  const ty = py + lx * Math.sin(a) + ly * Math.cos(a);

  return (
    <g>
      <g transform="translate(-5 -8)">
        <g transform={rot}>
          <BracoForma cor={C.paper} />
        </g>
      </g>
      <g transform={rot}>
        <BracoForma cor={C.black} />
        {/* separação entre os dedos, e o punho da manga */}
        <g stroke={ceu} strokeWidth={7} strokeLinecap="butt">
          <path d="M1456 -50 L1378 -38" />
          <path d="M1468 12 L1386 16" />
          <path d="M1452 72 L1378 66" />
        </g>
        <rect x={694} y={-206} width={7} height={412} fill={ceu} />
        {/* anel vermelho, como no repost */}
        <rect x={1400} y={-28} width={30} height={34} fill={C.red} />
        {contas}
      </g>
      <g transform={`translate(${tx} ${ty}) rotate(${rabicho})`} fill="none" stroke={C.pearlDim} strokeWidth={6}>
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx={0} cy={22 + i * 34} rx={i % 2 ? 5 : 11} ry={20} />
        ))}
        <circle cx={0} cy={22 + 4 * 34 + 2} r={9} fill={C.paper} stroke="none" />
      </g>
    </g>
  );
};
