// Folha de poses: confere o boneco contra o mapa de identidade.
import React from "react";
import { AbsoluteFill } from "remotion";
import { COR, Pao, Pose } from "./Pao";

const POSES: [string, Partial<Pose>][] = [
  ["neutra", {}],
  ["piscada meia", { palpE: 0.5, palpD: 0.5 }],
  ["fechado", { palpE: 1, palpD: 1 }],
  ["feliz", { feliz: 1, bico: 0.6, asaE: 40, asaD: 40 }],
  ["curiosa", { olharX: 0.7, olharY: -0.5, giro: 6, pupila: 1.1 }],
  ["triste", { palpE: 0.4, palpD: 0.4, incl: 14, olharY: 0.6, achata: 0.94 }],
  ["determinada", { palpE: 0.35, palpD: 0.35, incl: -16, pupila: 0.85 }],
  ["surpresa", { pupila: 0.75, bico: 1, achata: 1.08, asaE: 25, asaD: 25 }],
];

export const Folha: React.FC = () => (
  <AbsoluteFill style={{ background: COR.bege }}>
    {POSES.map(([nome, p], i) => {
      const x = 240 + (i % 4) * 480;
      const y = 470 + Math.floor(i / 4) * 520;
      return (
        <React.Fragment key={nome}>
          <Pao pose={p} x={x} y={y} altura={380} id={`f${i}`} />
          <div style={{ position: "absolute", left: x - 200, width: 400, top: y + 12, textAlign: "center", font: "600 30px Segoe UI, sans-serif", color: COR.corpo }}>{nome}</div>
        </React.Fragment>
      );
    })}
  </AbsoluteFill>
);
