import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Bolsa, Caixas, Final, Gancho, Mapa, Marca, Mentoria, Obstaculos, Rede } from "./Cenas";
import { Legenda } from "./Legenda";
import { FaixasTransicao } from "./Efeitos";
import { C } from "./marca";
import { CENAS, FALAS, quando } from "./roteiro";

// Efeitos sonoros CC0 (Kenney.nl via soundcn e @remotion/sfx), cada um preso à palavra ou ação que acompanha.
// Sem whoosh nem chicote nas trocas de cena (pedido do Pedro, 2026-11-02). [arquivo, segundo, volume]
const C0 = (c: keyof typeof CENAS, s = 0) => CENAS[c][0] + s;
const SFX: [string, number, number][] = [
  ["rm-whoosh", 0.0, 0.6], ["jingle-a", 0.4, 0.55], ["impacto-1", quando("n1", "tutorial") - 0.03, 0.8],
  ["rm-page-turn", C0("mapa", 0.1), 0.6],
  ["queda-1", quando("n3", "Passagem"), 0.8], ["queda-2", quando("n3", "xerox"), 0.8], ["queda-3", quando("n3", "aluguel"), 0.8],
  ["impacto-chefe", quando("n3", "fim"), 1],
  ["caixa", C0("caixas", 0.13), 0.5], ["caixa", C0("caixas", 0.3), 0.5], ["caixa", C0("caixas", 0.47), 0.5], ["powerup-1", quando("n4", "power"), 0.6],
  ["abre", C0("bolsa"), 0.6], ["moeda", C0("bolsa", 0.25), 0.6], ["powerup-3", quando("n5", "segura"), 0.6],
  ["abre", C0("mentoria"), 0.6], ["rm-page-turn", quando("n6", "mostra"), 0.5], ["powerup-5", quando("n6", "mapa"), 0.6],
  ["rm-whoosh", quando("n7", "ninguém") - 0.3, 0.6], ["rm-whoosh", quando("n7", "ninguém") + 0.17, 0.55], ["rm-whoosh", quando("n7", "ninguém") + 0.63, 0.5], ["confirma", quando("n7", "sozinho"), 0.6],
  ["jingle-b", quando("n8", "diploma"), 0.55], ["pulo", quando("n8", "diploma") + 0.4, 0.5], ["jingle-d", quando("n8", "diploma") + 1.7, 0.55],
];

export const SoTutorial: React.FC = () => {
  const { fps } = useVideoConfig();
  const cena = (k: keyof typeof CENAS) => ({ from: Math.round(CENAS[k][0] * fps), durationInFrames: Math.round((CENAS[k][1] - CENAS[k][0]) * fps) });
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <Sequence name="1 · Gancho" {...cena("gancho")}><Gancho /></Sequence>
      <Sequence name="2 · Mapa" {...cena("mapa")}><Mapa /></Sequence>
      <Sequence name="3 · Obstáculos" {...cena("obstaculos")}><Obstaculos /></Sequence>
      <Sequence name="4 · Caixas" {...cena("caixas")}><Caixas /></Sequence>
      <Sequence name="5 · Bolsa" {...cena("bolsa")}><Bolsa /></Sequence>
      <Sequence name="6 · Mentoria" {...cena("mentoria")}><Mentoria /></Sequence>
      <Sequence name="7 · Rede" {...cena("rede")}><Rede /></Sequence>
      <Sequence name="8 · Fase final" {...cena("final")}><Final /></Sequence>
      <Sequence name="9 · Marca" {...cena("marca")}><Marca /></Sequence>
      <Legenda />
      <Sequence name="transição #018 (faixas)" from={Math.round((CENAS.caixas[0] - 0.62) * fps)} durationInFrames={Math.round(1.45 * fps)}><FaixasTransicao /></Sequence>
      {FALAS.map((f) => (
        <Sequence key={f.id} name={`voz ${f.id}`} from={Math.round(f.ini * fps)} layout="none">
          <Audio src={staticFile(`voz/final/${f.id}.wav`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map(([arq, t, v], k) => (
        <Sequence key={k} name={`sfx ${arq}`} from={Math.round(t * fps)} layout="none">
          <Audio src={staticFile(`sfx/${arq}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
