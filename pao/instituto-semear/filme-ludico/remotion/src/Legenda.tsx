import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, CHEGA, CL, POPPINS } from "./marca";
import { CENAS, FALAS } from "./roteiro";

// Legenda palavra por palavra, estilo TikTok, dentro da faixa que a interface do app não cobre.
export const Legenda: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  for (const f of FALAS) {
    if (!f.legenda || t < f.ini || t > f.ini + f.dur + 0.15) continue;
    // separa em blocos e acha o bloco da vez
    const blocos: [string, number][][] = [[]];
    for (const p of f.palavras) (p[0] === "|" ? blocos.push([]) : blocos[blocos.length - 1].push(p));
    const ms = (t - f.ini) * 1000;
    let atual = 0;
    blocos.forEach((b, k) => { if (b.length && ms >= b[0][1] - 120) atual = k; });
    const bloco = blocos[atual];
    const fimBloco = atual < blocos.length - 1 ? blocos[atual + 1][0][1] - 120 : f.dur * 1000 + 150;
    return (
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <div style={{ position: "absolute", top: 1360, left: 60, width: 860, textAlign: "center", fontFamily: POPPINS, fontWeight: 900, fontSize: 70, lineHeight: 1.12, letterSpacing: "-0.01em" }}>
          {bloco.map(([w, ini], k) => {
            const local = ms - ini;
            const ativo = local >= 0 && (k === bloco.length - 1 ? ms < fimBloco : local < bloco[k + 1][1] - ini);
            const visivel = local >= -40;
            return (
              <span
                key={k}
                style={{
                  display: "inline-block",
                  margin: "0 10px",
                  color: ativo ? C.branco : t >= CENAS.caixas[0] && t < CENAS.caixas[1] ? C.branco : C.tinta,
                  background: ativo ? C.marrom : "transparent",
                  borderRadius: 16,
                  padding: "2px 14px",
                  opacity: visivel ? 1 : 0,
                  scale: interpolate(local, [-40, 90], [0.6, ativo ? 1.08 : 1], { ...CL, easing: CHEGA }),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }
  return null;
};
