import React from "react";
import {ESTRUTURA, CRESCENTE_PATH} from "./simbolo-paths";
import {C, SIM} from "./theme";

// As seis peças da estrutura do símbolo, em coordenadas do vetor (522 x 311).
export const Estrutura: React.FC<{cor: string}> = ({cor}) => (
  <g fill={cor} fillRule="evenodd">
    {Object.entries(ESTRUTURA).map(([id, d]) => (
      <path key={id} d={d} />
    ))}
  </g>
);

// O eclipse como dois círculos de verdade. Em dx = SIM.dxSimbolo ele bate com o desenho do símbolo.
// A lua tem a cor do céu: não se vê lua, se vê o sol sendo comido. Ela é recortada no vão redondo
// para não apagar a estrutura quando ainda está fora do sol.
export const Eclipse: React.FC<{dx: number; ceu: string; sol?: string; id: string}> = ({dx, ceu, sol, id}) => (
  <g>
    <clipPath id={id}>
      <circle cx={SIM.disco.cx} cy={SIM.disco.cy} r={SIM.disco.r} />
    </clipPath>
    <circle cx={SIM.disco.cx} cy={SIM.disco.cy} r={SIM.disco.r} fill={ceu} />
    <circle cx={SIM.sol.cx} cy={SIM.sol.cy} r={SIM.sol.r} fill={sol ?? C.red} />
    <circle cx={SIM.sol.cx + dx} cy={SIM.sol.cy} r={SIM.luaR} fill={ceu} clipPath={`url(#${id})`} />
  </g>
);

// O símbolo inteiro, como a marca publica (para a tela final).
export const Simbolo: React.FC<{cor?: string; fundo?: string}> = ({cor = C.red, fundo = C.paper}) => (
  <g>
    <Estrutura cor={cor} />
    <circle cx={SIM.disco.cx} cy={SIM.disco.cy} r={SIM.disco.r} fill={fundo} />
    <path d={CRESCENTE_PATH} fill={cor} />
  </g>
);

// Transform que põe o sol do símbolo num ponto da tela, com o raio pedido em px.
export const encaixe = (x: number, y: number, raioSol: number) => {
  const s = raioSol / SIM.sol.r;
  return {s, transform: `translate(${x - SIM.sol.cx * s} ${y - SIM.sol.cy * s}) scale(${s})`};
};
