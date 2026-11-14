// O PAÓ montado em peças, seguindo o "mapa de identidade e movimento"
// (referencias/pao-mapa-identidade.png): corpo, peito, asas, pés, olhos
// (contorno, branco, pupila, brilho, pálpebras) e bico são camadas separadas,
// cada uma com o seu controle. Nada aqui é imagem: é SVG desenhado.
import React from "react";

export const COR = {
  corpo: "#242621",
  vermelho: "#A62317",
  vermelhoEscuro: "#7A160D",
  branco: "#FFFFFF",
  pupila: "#121310",
  bico: "#3D3F3A",
  pe: "#1A1B18",
  bege: "#F2E5D5",
};

export type Pose = {
  olharX: number; // -1 (esquerda da tela) .. 1 (direita)
  olharY: number; // -1 (cima) .. 1 (baixo)
  pupila: number; // escala da pupila (1 normal, 1.3 encantado, 0.8 tenso)
  palpE: number; // pálpebra de cima do olho esquerdo (0 aberto .. 1 fechado)
  palpD: number;
  baixa: number; // pálpebra de baixo, nos dois olhos (0 .. 1)
  feliz: number; // 0 .. 1: olhos em arco (∩), como no mapa
  incl: number; // inclinação da pálpebra em graus (+ triste, − determinado)
  bico: number; // 0 fechado .. 1 aberto
  asaE: number; // graus que a asa esquerda sobe (0 caída)
  asaD: number;
  achata: number; // 1 neutro; <1 achata; >1 estica (volume preservado)
  giro: number; // inclinação do corpo em graus, pivô nos pés
  y: number; // deslocamento vertical em unidades do desenho (pulo)
};

export const NEUTRA: Pose = {
  olharX: 0,
  olharY: 0,
  pupila: 1,
  palpE: 0,
  palpD: 0,
  baixa: 0,
  feliz: 0,
  incl: 0,
  bico: 0,
  asaE: 0,
  asaD: 0,
  achata: 1,
  giro: 0,
  y: 0,
};

// Medidas do desenho (viewBox 400 x 440). Pés tocam o chão em y = 372.
const CHAO = 372;
const OLHO = { rx: 50, ry: 56, anel: 13, y: 158, dx: 62 };

const Olho: React.FC<{ cx: number; p: Pose; lado: "E" | "D"; id: string }> = ({
  cx,
  p,
  lado,
  id,
}) => {
  const { rx, ry, anel } = OLHO;
  const cy = OLHO.y;
  const px = cx + p.olharX * 22;
  const py = cy + p.olharY * 20;
  // no "feliz" as duas pálpebras viram arcos paralelos e sobra só o ∩ branco do mapa
  const palp = Math.max(lado === "E" ? p.palpE : p.palpD, p.feliz * 0.575);
  const baixa = Math.max(p.baixa, p.feliz * 0.575);
  // borda da pálpebra de cima
  const yCima = cy - ry - 4 + palp * (2 * ry + 8);
  const sinal = lado === "E" ? -1 : 1;
  // pálpebra de baixo sobe com a borda em arco pra cima (dá o ∩ do "feliz")
  const yBaixo = cy + ry + 4 - baixa * (2 * ry + 8);
  const arco = 18 + p.feliz * 48;
  const curvaCima = 10 - p.feliz * 116;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx + anel} ry={ry + anel} fill={COR.vermelho} />
      <clipPath id={id}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={COR.branco} />
        <g transform={`translate(${px} ${py}) scale(${p.pupila * Math.max(0.001, 1 - p.feliz)})`}>
          <ellipse rx={19} ry={24} fill={COR.pupila} />
          <ellipse cx={-6} cy={-9} rx={6.5} ry={7.5} fill={COR.branco} />
          <circle cx={7} cy={10} r={2.6} fill={COR.branco} opacity={0.85} />
        </g>
        {/* pálpebra de cima: cobre do topo até yCima, com a borda levemente curva */}
        <path
          d={`M${cx - rx - 10},${cy - ry - 30} L${cx + rx + 10},${cy - ry - 30} L${cx + rx + 10},${yCima} Q${cx},${yCima + curvaCima} ${cx - rx - 10},${yCima} Z`}
          fill={COR.corpo}
          transform={`rotate(${p.incl * sinal} ${cx} ${yCima})`}
        />
        {/* pálpebra de baixo */}
        <path
          d={`M${cx - rx - 10},${cy + ry + 30} L${cx - rx - 10},${yBaixo + arco * 0.6} Q${cx},${yBaixo - arco} ${cx + rx + 10},${yBaixo + arco * 0.6} L${cx + rx + 10},${cy + ry + 30} Z`}
          fill={COR.corpo}
        />
      </g>
    </g>
  );
};

const Asa: React.FC<{ lado: "E" | "D"; ang: number }> = ({ lado, ang }) => {
  const s = lado === "E" ? 1 : -1;
  const pivoX = lado === "E" ? 66 : 334;
  // asa caída, levemente aberta pra fora; "ang" sobe girando em torno do ombro
  return (
    <g transform={`rotate(${ang * s} ${pivoX} 222)`}>
      <ellipse
        cx={pivoX - 20 * s}
        cy={272}
        rx={27}
        ry={56}
        fill={COR.corpo}
        transform={`rotate(${22 * s} ${pivoX - 20 * s} 272)`}
      />
    </g>
  );
};

const Bico: React.FC<{ a: number }> = ({ a }) => {
  const abre = a * 14;
  return (
    <g>
      {a > 0.02 && (
        <ellipse cx={200} cy={226 + abre * 0.5} rx={16} ry={4 + abre * 0.6} fill={COR.vermelhoEscuro} />
      )}
      {/* parte de baixo do bico: desce quando abre */}
      <path
        d={`M184,${224 + abre} C190,${236 + abre} 210,${236 + abre} 216,${224 + abre} C210,${228 + abre} 190,${228 + abre} 184,${224 + abre} Z`}
        fill={COR.bico}
      />
      {/* parte de cima do bico */}
      <path d="M176,210 C181,198 219,198 224,210 C222,222 211,230 200,231 C189,230 178,222 176,210 Z" fill={COR.bico} />
    </g>
  );
};

export const Pao: React.FC<{
  pose: Partial<Pose>;
  // posição dos pés na tela (px) e altura total do personagem (px)
  x: number;
  y: number;
  altura: number;
  id: string;
  sombra?: boolean;
}> = ({ pose, x, y, altura, id, sombra = true }) => {
  const p: Pose = { ...NEUTRA, ...pose };
  const escala = altura / 360;
  const sy = p.achata;
  const sx = 1 + (1 - sy) * 0.7;
  return (
    <svg
      viewBox="0 0 400 440"
      width={400 * escala}
      height={440 * escala}
      style={{
        position: "absolute",
        left: x - 200 * escala,
        top: y - CHAO * escala,
        overflow: "visible",
      }}
    >
      {sombra && (
        <ellipse
          cx={200}
          cy={CHAO + 2}
          rx={130 * (1 - Math.min(Math.abs(p.y), 120) / 300)}
          ry={16}
          fill="#000"
          opacity={0.22}
        />
      )}
      <g
        transform={`translate(0 ${p.y}) rotate(${p.giro} 200 ${CHAO}) translate(200 ${CHAO}) scale(${sx} ${sy}) translate(-200 ${-CHAO})`}
      >
        {/* pés */}
        <ellipse cx={158} cy={CHAO - 6} rx={24} ry={12} fill={COR.pe} />
        <ellipse cx={242} cy={CHAO - 6} rx={24} ry={12} fill={COR.pe} />
        <Asa lado="E" ang={p.asaE} />
        <Asa lado="D" ang={p.asaD} />
        {/* corpo (cabeça e corpo são uma peça só, como no mapa) */}
        <path
          d="M200,40 C318,40 354,112 352,200 C350,292 312,362 200,364 C88,362 50,292 48,200 C46,112 82,40 200,40 Z"
          fill={COR.corpo}
        />
        {/* peito (babador), com o recorte no meio do topo */}
        <path
          d="M96,276 C96,232 146,218 186,220 L200,230 L214,220 C254,218 304,232 304,276 C304,326 258,356 200,356 C142,356 96,326 96,276 Z"
          fill={COR.vermelho}
        />
        <Olho cx={200 - OLHO.dx} p={p} lado="E" id={`${id}-oe`} />
        <Olho cx={200 + OLHO.dx} p={p} lado="D" id={`${id}-od`} />
        <Bico a={p.bico} />
      </g>
    </svg>
  );
};
