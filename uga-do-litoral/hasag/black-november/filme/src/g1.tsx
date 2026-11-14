import React from "react";
import {C} from "./theme";
import {Estrela, Perola} from "./pecas";

// A Pulseira G1 fechada em anel, vista de cima: 15 pérolas e 4 rondelas de strass
// (3-R-3-R-3-R-3-R-3, contagem pela foto da loja), corrente extensora e fecho lagosta em cima.
// O fio de pérolas ocupa 260 graus; a corrente fecha os 100 graus do alto.

const SEQ = ["p", "p", "p", "r", "p", "p", "p", "r", "p", "p", "p", "r", "p", "p", "p", "r", "p", "p", "p"];
const AP = 15.85; // graus por pérola
const AR = 5.55; // graus por rondela
const INICIO = 50; // horário a partir do alto: começa em cima à direita, onde o sol vai voltar

export type ContaG1 = {tipo: "p" | "r"; ang: number; x: number; y: number; i: number};

export const contasG1 = (cx: number, cy: number, raio: number): ContaG1[] => {
  let cursor = INICIO;
  return SEQ.map((tipo, i) => {
    const w = tipo === "p" ? AP : AR;
    const ang = cursor + w / 2;
    cursor += w;
    const a = (ang * Math.PI) / 180;
    return {tipo: tipo as "p" | "r", ang, x: cx + raio * Math.sin(a), y: cy - raio * Math.cos(a), i};
  });
};

export const N_CONTAS = SEQ.length;
export const ehRondela = (i: number) => SEQ[i] === "r";

const ELOS = [-42, -31.5, -21, -10.5, 0, 10.5, 21, 31.5];

type AnelProps = {
  cx: number;
  cy: number;
  raio: number; // raio do fio (centro das pérolas)
  escala?: (i: number) => number; // tamanho de cada conta, 0..1+ (0 = ainda não acendeu)
  estrela?: (i: number) => number; // tamanho do clarão em estrela sobre a conta (0 = nenhum)
  elos?: number; // quantos elos da corrente já apareceram (0..8)
  fecho?: number; // 0 = aberto, 1 = fechado (pode passar de 1 no tranco)
  clarao?: number; // clarão no fecho, 0..1
  claro?: boolean; // versão ilustração: pérola branca com crescente de sombra por fora
};

export const AnelG1: React.FC<AnelProps> = ({cx, cy, raio, escala, estrela, elos = ELOS.length, fecho = 1, clarao = 0, claro}) => {
  const k = raio / 393; // tudo foi desenhado para o raio 393 do P5
  const rp = 51 * k;
  const contas = contasG1(cx, cy, raio);
  const pos = (ang: number) => {
    const a = (ang * Math.PI) / 180;
    return {x: cx + raio * Math.sin(a), y: cy - raio * Math.cos(a)};
  };
  const pf = pos(42.5);
  return (
    <g>
      {ELOS.slice(0, Math.max(0, Math.ceil(elos))).map((ang, i) => {
        const p = pos(ang);
        const s = Math.min(1, Math.max(0, elos - i));
        return (
          <ellipse
            key={ang}
            transform={`translate(${p.x} ${p.y}) rotate(${ang}) scale(${s})`}
            rx={25 * k}
            ry={(i % 2 ? 5 : 13) * k}
            fill="none"
            stroke={claro ? C.paper : "#8C8580"}
            strokeWidth={7 * k}
          />
        );
      })}
      {elos >= ELOS.length ? (
        <g transform={`translate(${pf.x} ${pf.y}) rotate(${42.5 + 34 * (1 - fecho)}) scale(${k})`}>
          <path
            d="M-34 0 Q-30 -17 -6 -18 L22 -12 Q36 -6 34 4 Q30 16 10 18 L-10 18 Q-30 16 -34 0Z M-8 -6 Q-16 0 -8 7 L12 7 Q20 0 12 -6Z"
            fill={C.paper}
            fillRule="evenodd"
          />
        </g>
      ) : null}
      {contas.map((c) => {
        const s = escala ? escala(c.i) : 1;
        const e = estrela ? estrela(c.i) : 0;
        if (s <= 0.001 && e <= 0.001) return null;
        let corpo: React.ReactNode = null;
        if (c.tipo === "r") {
          corpo = (
            <g transform={`translate(${c.x} ${c.y}) rotate(${c.ang}) scale(${s})`}>
              <rect x={-9 * k} y={-43 * k} width={18 * k} height={86 * k} fill={C.paper} />
              {[-26, 0, 26].map((d) => (
                <circle key={d} cx={0} cy={d * k} r={5 * k} fill={C.black} />
              ))}
            </g>
          );
        } else if (s > 0.001) {
          // o crescente fica do lado do centro: a luz vem de trás do disco
          const paraCentro = (Math.atan2(cy - c.y, cx - c.x) * 180) / Math.PI;
          corpo = claro ? (
            <Perola x={c.x} y={c.y} r={rp * s} modo="eclipse" luz={paraCentro + 180} cor={C.paper} corCrescente={C.pearlDim} />
          ) : (
            <Perola x={c.x} y={c.y} r={rp * s} modo="eclipse" luz={paraCentro} />
          );
        }
        return (
          <g key={c.i}>
            {corpo}
            {e > 0.001 ? <Estrela x={c.x} y={c.y} r={(c.tipo === "p" ? 78 : 64) * k * e} rot={c.ang} /> : null}
          </g>
        );
      })}
      {clarao > 0.001 ? <Estrela x={pf.x} y={pf.y} r={140 * k * clarao} /> : null}
    </g>
  );
};
