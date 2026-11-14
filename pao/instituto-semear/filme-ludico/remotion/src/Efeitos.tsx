// Motion Prompt #003 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#003
// Motion Prompt #018 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#018
// Portados do Canvas 2D pro Remotion (SVG), com os mesmos tempos e curvas; cores trocadas pelas do Semear.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./marca";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eIOs = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const eOut5 = (x: number) => 1 - Math.pow(1 - x, 5);
const mola = (t: number, w = 14, d = 7) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t));

// #003 Burst: escala do objeto (antecipação 1→0,7 em 0,2 s, depois mola 1 − e^(−6,5t)·cos(16t)).
export const escalaBurst = (tt: number) => (tt < 0 ? 1 - 0.3 * eIOs(P(tt, -0.2, 0)) : 0.7 + 0.3 * mola(tt, 16, 6.5));

// #003 Burst: anel, 10 linhas radiais e 10 pontos estourando a partir de (x, y). `tt` = segundos desde o disparo.
export const Burst: React.FC<{ x: number; y: number; escala: number; disparo: number; anel?: string }> = ({ x, y, escala, disparo, anel = C.amarelo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tt = f / fps - disparo;
  if (tt <= 0 || tt >= 0.75) return null;
  const q = eOut5(Math.min(1, tt / 0.6));
  const some = 1 - P(tt, 0.3, 0.72);
  const tam = 1 - P(tt, 0.22, 0.7);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`translate(${x} ${y}) scale(${escala})`}>
        {q < 0.98 && <circle r={44 + 46 * q} fill="none" stroke={anel} strokeWidth={Math.max(0.1, 16 * (1 - q))} />}
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r1 = 64 + 66 * q, len = 36 * tam;
          const a2 = a + Math.PI / 10, r2 = 58 + 92 * q;
          return (
            <g key={i}>
              {len > 0.5 && <line x1={Math.cos(a) * (r1 - len)} y1={Math.sin(a) * (r1 - len) * 0.82} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1 * 0.82} stroke={i % 2 ? C.oliva : anel} strokeWidth={9} strokeLinecap="round" />}
              <circle cx={Math.cos(a2) * r2 * 1.45} cy={Math.sin(a2) * r2 * 0.78} r={8 * (1 - q * 0.4)} fill={i % 2 ? C.marrom : C.azul} opacity={some} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// #018 Shape transition: 4 faixas inclinadas cobrem a tela (0,62 s), a cena troca por baixo, e saem (0,63 s).
// Cada faixa atrasa 14% da fase e usa ease-in-out cúbico em 58% dela. Inclinação: 80 px no card de 539 px → 160 px em 1080.
export const FaixasTransicao: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width: w, height: h } = useVideoConfig();
  const u = f / fps;
  const p1 = P(u, 0, 0.62), p2 = P(u, 0.74, 1.37);
  const N = 4, sk = 160, cores = [C.azul, C.marrom, C.amarelo, C.oliva];
  return (
    <AbsoluteFill>
      <svg width={w} height={h}>
        {cores.map((cor, i) => {
          const d = i * 0.14, e1 = eIO(clamp((p1 - d) / (1 - 0.42))), e2 = eIO(clamp((p2 - d) / (1 - 0.42)));
          if (e1 <= 0 || e2 >= 1) return null;
          const bh = h / N + 1, y = (i * h) / N, span = w + sk + 20;
          const xa = -sk - 10 + e2 * span, xb = -sk - 10 + e1 * span;
          return <path key={i} d={`M ${xa + sk} ${y} L ${xb + sk} ${y} L ${xb} ${y + bh} L ${xa} ${y + bh} Z`} fill={cor} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
