import React from "react";
import { C, CELULAS, CEL_H, CEL_W, ESTAMPA_CORES, MAOS, MAOS_CAIXA, PESSOAS, TOPO } from "./marca";

// A pessoinha da logo do Semear, como personagem.
export const Pessoa: React.FC<{ i?: number; altura: number; style?: React.CSSProperties; contorno?: boolean; borda?: boolean }> = ({ i = 4, altura, style, contorno, borda }) => {
  const p = PESSOAS[i % PESSOAS.length];
  const { x0, y0, x1, y1 } = p.caixa;
  const w = x1 - x0, h = y1 - y0;
  return (
    <svg viewBox={`${x0 - 10} ${y0 - 10} ${w + 20} ${h + 20}`} style={{ height: altura, width: (altura * (w + 20)) / (h + 20), overflow: "visible", ...style }}>
      {contorno ? (
        <g fill="none" stroke={C.branco} strokeWidth={10} strokeLinejoin="round"><path d={p.body} /><path d={p.head} /></g>
      ) : (
        <g stroke={borda ? C.tinta : "none"} strokeWidth={borda ? 16 : 0} strokeLinejoin="round" style={{ paintOrder: "stroke" }}><path d={p.body} fill={C.oliva} /><path d={p.head} fill={C.amarelo} /></g>
      )}
    </svg>
  );
};

// Célula da estampa (vetorizada do post P56-04).
export const Celula: React.FC<{ r: number; c: number; tam: number; style?: React.CSSProperties }> = ({ r, c, tam, style }) => {
  const cel = CELULAS[`${r}-${c}`] ?? {};
  return (
    <svg viewBox={`${c * CEL_W} ${r * CEL_H} ${CEL_W} ${CEL_H}`} style={{ width: tam, height: tam, ...style }}>
      {Object.entries(cel).map(([nome, d]) => <path key={nome} d={d} fill={ESTAMPA_CORES[nome]} fillRule="evenodd" />)}
    </svg>
  );
};

// A árvore da logo. `voo` (0..1 por pessoa) traz cada pessoinha de `origens` até o lugar dela; `maos` (0..1) faz as mãos subirem do chão.
export const Arvore: React.FC<{
  altura: number;
  voo?: (i: number) => number;
  origens?: (i: number) => [number, number];
  maos?: number;
  style?: React.CSSProperties;
}> = ({ altura, voo = () => 1, origens = () => [0, 0], maos = 1, style }) => {
  const x0 = MAOS_CAIXA.x0 - 20, x1 = MAOS_CAIXA.x1 + 20, y0 = TOPO - 20, y1 = MAOS_CAIXA.y1 + 10;
  const w = x1 - x0, h = y1 - y0;
  const topoMaos = MAOS_CAIXA.y0 - 10;
  const corte = y1 - (y1 - topoMaos) * maos;
  return (
    <svg viewBox={`${x0} ${y0} ${w} ${h}`} style={{ height: altura, width: (altura * w) / h, overflow: "visible", ...style }}>
      <defs>
        <clipPath id="arvore-chao" clipPathUnits="userSpaceOnUse"><rect x={-500} y={y1 - 70} width={3000} height={200} /></clipPath>
        <clipPath id="arvore-maos" clipPathUnits="userSpaceOnUse"><rect x={-500} y={corte} width={3000} height={3000} /></clipPath>
      </defs>
      <path d={MAOS} fill={C.marrom} clipPath="url(#arvore-chao)" />
      <path d={MAOS} fill={C.marrom} clipPath="url(#arvore-maos)" />
      {PESSOAS.map((p, i) => {
        const k = Math.max(0, Math.min(1, voo(i)));
        const [ox, oy] = origens(i);
        const cx = (p.caixa.x0 + p.caixa.x1) / 2, cy = (p.caixa.y0 + p.caixa.y1) / 2;
        const dx = (ox - cx) * (1 - k), dy = (oy - cy) * (1 - k);
        return (
          <g key={i} transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${((1 - k) * (i % 2 ? 160 : -160)).toFixed(1)} ${cx} ${cy})`} opacity={k > 0 ? 1 : 0}>
            <path d={p.body} fill={C.oliva} />
            <path d={p.head} fill={C.amarelo} />
          </g>
        );
      })}
    </svg>
  );
};
