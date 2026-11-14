import React from "react";
import {C, CRESCENTE} from "./theme";

// Crescente na proporção do símbolo: o disco de raio r menos uma "lua" 13% maior,
// deslocada 41% do raio para longe da luz. `luz` é a direção de onde vem a luz, em graus
// (0 = direita, 90 = baixo, 180 = esquerda, 270 = cima).
export const crescentePath = (cx: number, cy: number, r: number, luz: number) => {
  const R = CRESCENTE.razaoLua * r;
  const d = CRESCENTE.desloc * r;
  const la = (luz * Math.PI) / 180;
  const ux = -Math.cos(la);
  const uy = -Math.sin(la);
  const a = (r * r - R * R + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const vx = -uy;
  const vy = ux;
  const p1x = cx + a * ux + h * vx;
  const p1y = cy + a * uy + h * vy;
  const p2x = cx + a * ux - h * vx;
  const p2y = cy + a * uy - h * vy;
  const n = (v: number) => v.toFixed(2);
  return `M${n(p1x)} ${n(p1y)} A${n(r)} ${n(r)} 0 0 1 ${n(p2x)} ${n(p2y)} A${n(R)} ${n(R)} 0 0 0 ${n(p1x)} ${n(p1y)}Z`;
};

type PerolaProps = {
  x: number;
  y: number;
  r: number;
  modo: "dia" | "eclipse";
  luz?: number;
  oca?: boolean; // conta de cristal do Radiant: anel em vez de disco
  cor?: string;
  corCrescente?: string;
};

// De dia a pérola é um disco liso. Na totalidade ela escurece um tom e ganha o crescente.
export const Perola: React.FC<PerolaProps> = ({x, y, r, modo, luz = 270, oca, cor, corCrescente}) => {
  // gradientes definidos em defs.tsx: brilho de nácar no alto à esquerda
  if (modo === "dia") {
    return oca ? (
      <circle cx={x} cy={y} r={r * 0.72} fill="none" stroke={cor ?? "url(#g-perola-dia)"} strokeWidth={r * 0.56} />
    ) : (
      <circle cx={x} cy={y} r={r} fill={cor ?? "url(#g-perola-dia)"} />
    );
  }
  return (
    <>
      {oca ? (
        <circle cx={x} cy={y} r={r * 0.72} fill="none" stroke={cor ?? "url(#g-perola)"} strokeWidth={r * 0.56} />
      ) : (
        <circle cx={x} cy={y} r={r} fill={cor ?? "url(#g-perola)"} />
      )}
      <path d={crescentePath(x, y, r, luz)} fill={corCrescente ?? C.paper} />
    </>
  );
};

// Bola de strass do 1K2Q: um disco um pouco maior, pontilhado.
export const BolaStrass: React.FC<{x: number; y: number; r: number; modo: "dia" | "eclipse"; luz?: number; fundo: string}> = ({
  x,
  y,
  r,
  modo,
  luz = 270,
  fundo,
}) => {
  const pontos = [
    [0, 0],
    [-0.45, -0.4],
    [0.45, -0.4],
    [-0.45, 0.42],
    [0.45, 0.42],
  ];
  return (
    <>
      <Perola x={x} y={y} r={r} modo={modo} luz={luz} />
      {pontos.map(([px, py], i) => (
        <circle key={i} cx={x + px * r} cy={y + py * r} r={r * 0.16} fill={fundo} />
      ))}
    </>
  );
};

// Estrela de quatro pontas: o strass. Dura de 2 a 4 frames.
export const Estrela: React.FC<{x: number; y: number; r: number; cor?: string; rot?: number}> = ({x, y, r, cor, rot = 0}) => {
  const k = r * 0.13;
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rot})`}
      d={`M0 ${-r} Q${k} ${-k} ${r} 0 Q${k} ${k} 0 ${r} Q${-k} ${k} ${-r} 0 Q${-k} ${-k} 0 ${-r}Z`}
      fill={cor ?? C.paper}
    />
  );
};

// Cruz de pontas abertas, desenhada a partir do ponto em que pendura (0,0) para baixo.
// h = altura total. `ornada` é a cruz grande do Radiant, com braços mais pontudos.
export const cruzPath = (h: number, ornada = false) => {
  const pts: [number, number][] = ornada
    ? [
        [-0.1, 0.03],
        [0, 0],
        [0.1, 0.03],
        [0.13, 0.1],
        [0.055, 0.2],
        [0.05, 0.3],
        [0.2, 0.275],
        [0.3, 0.22],
        [0.36, 0.25],
        [0.33, 0.36],
        [0.36, 0.47],
        [0.3, 0.5],
        [0.2, 0.445],
        [0.05, 0.42],
        [0.07, 0.72],
        [0.15, 0.86],
        [0.12, 0.95],
        [0, 1],
        [-0.12, 0.95],
        [-0.15, 0.86],
        [-0.07, 0.72],
        [-0.05, 0.42],
        [-0.2, 0.445],
        [-0.3, 0.5],
        [-0.36, 0.47],
        [-0.33, 0.36],
        [-0.36, 0.25],
        [-0.3, 0.22],
        [-0.2, 0.275],
        [-0.05, 0.3],
        [-0.055, 0.2],
        [-0.13, 0.1],
      ]
    : [
        [-0.13, 0],
        [0, 0.04],
        [0.13, 0],
        [0.05, 0.3],
        [0.34, 0.235],
        [0.3, 0.36],
        [0.34, 0.485],
        [0.05, 0.42],
        [0.16, 1],
        [0, 0.955],
        [-0.16, 1],
        [-0.05, 0.42],
        [-0.34, 0.485],
        [-0.3, 0.36],
        [-0.34, 0.235],
        [-0.05, 0.3],
      ];
  return "M" + pts.map(([x, y]) => `${(x * h).toFixed(1)} ${(y * h).toFixed(1)}`).join(" L") + "Z";
};

type CruzProps = {
  x: number;
  y: number;
  h: number;
  ang: number; // graus, balanço em torno do ponto de pendurar
  modo: "dia" | "eclipse";
  ornada?: boolean;
  fundo: string; // cor de quem está atrás, para a pedra do centro
  brilho?: boolean; // strass estourando
};

export const Cruz: React.FC<CruzProps> = ({x, y, h, ang, modo, ornada, fundo, brilho}) => {
  const d = cruzPath(h, ornada);
  const argola = h * 0.05;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <circle cx={0} cy={-argola * 0.6} r={argola} fill="none" stroke={modo === "dia" ? C.paper : C.pearlDim} strokeWidth={argola * 0.7} />
      {modo === "dia" ? (
        <path d={d} fill={C.paper} />
      ) : (
        <>
          {/* metal apagado, com um filete de luz na aresta de cima */}
          <path d={d} fill={C.paper} transform={`translate(${-h * 0.016} ${-h * 0.03})`} />
          <path d={d} fill="url(#g-metal)" />
        </>
      )}
      <circle cx={0} cy={h * 0.36} r={h * (ornada ? 0.045 : 0.04)} fill={modo === "dia" ? fundo : C.black} />
      {brilho ? <Estrela x={0} y={h * 0.36} r={h * 0.3} /> : null}
    </g>
  );
};

// Arco do colar: meia elipse pendurada. Devolve uma função que entrega o ponto a uma
// distância s (em px, ao longo do fio) do centro de baixo. `prof` vai de 0 (no pescoço) a 1 (embaixo).
export const arcoColar = (cx: number, topo: number, a: number, b: number) => {
  const N = 480;
  const tMax = 1.5;
  const pts: {x: number; y: number; s: number}[] = [];
  let acc = 0;
  for (let i = 0; i <= N; i++) {
    const th = -tMax + (2 * tMax * i) / N;
    const x = cx + a * Math.sin(th);
    const y = topo + b * Math.cos(th);
    if (i > 0) acc += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
    pts.push({x, y, s: acc});
  }
  const meio = pts[N / 2].s;
  const max = meio;
  const em = (s: number) => {
    const alvo = Math.max(0, Math.min(acc, meio + s));
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (pts[m].s < alvo) lo = m;
      else hi = m;
    }
    const p = pts[lo];
    const q = pts[hi];
    const t = q.s === p.s ? 0 : (alvo - p.s) / (q.s - p.s);
    const x = p.x + (q.x - p.x) * t;
    const y = p.y + (q.y - p.y) * t;
    return {x, y, prof: Math.max(0, (y - topo) / b)};
  };
  return {em, max};
};

// Etiqueta de catálogo: o código da peça, pequeno, com um fio.
export const Etiqueta: React.FC<{x: number; y: number; texto: string; fonte: string; cor?: string; fio?: number; lado?: "esq" | "dir"; ponto?: boolean}> = ({
  x,
  y,
  texto,
  fonte,
  cor,
  fio = 70,
  lado = "dir",
  ponto,
}) => {
  const c = cor ?? C.paper;
  const dir = lado === "dir" ? 1 : -1;
  return (
    <g>
      <rect x={lado === "dir" ? x : x - fio} y={y - 2} width={fio} height={4} fill={c} />
      {/* quando o fio passa por cima de outra peça, um ponto marca onde ele chega */}
      {ponto ? <circle cx={x} cy={y} r={8} fill={c} /> : null}
      <text
        x={x + dir * (fio + 18)}
        y={y + 16}
        textAnchor={lado === "dir" ? "start" : "end"}
        fontFamily={fonte}
        fontWeight={600}
        fontSize={46}
        letterSpacing={4}
        fill={c}
      >
        {texto}
      </text>
    </g>
  );
};
