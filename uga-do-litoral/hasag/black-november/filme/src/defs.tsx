import React from "react";
import {C} from "./theme";

// Gradientes compartilhados. Cada <svg> de plano inclui <Defs/>; as ids se repetem com o mesmo conteúdo.
export const Defs: React.FC = () => (
  <defs>
    {/* nácar: brilho no alto à esquerda, borda que escurece */}
    <radialGradient id="g-perola" cx="0.38" cy="0.32" r="0.78">
      <stop offset="0" stopColor="#B5AEA8" />
      <stop offset="0.55" stopColor="#756E69" />
      <stop offset="1" stopColor="#3E3936" />
    </radialGradient>
    <radialGradient id="g-perola-dia" cx="0.38" cy="0.32" r="0.8">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.55" stopColor={C.paper} />
      <stop offset="1" stopColor="#CBC6BD" />
    </radialGradient>
    {/* metal apagado das cruzes na totalidade */}
    <linearGradient id="g-metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ADA6A0" />
      <stop offset="0.42" stopColor="#6E6762" />
      <stop offset="0.58" stopColor="#938C86" />
      <stop offset="1" stopColor="#433E3A" />
    </linearGradient>
    {/* céu de dia: um pouco mais fechado no alto */}
    <linearGradient id="g-ceu-dia" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#E2DED6" />
      <stop offset="0.5" stopColor={C.paper} />
    </linearGradient>
    {/* sombra no alto do céu, por cima de qualquer cor de fundo */}
    <linearGradient id="g-ceu-sombra" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#000" stopOpacity="0.16" />
      <stop offset="0.6" stopColor="#000" stopOpacity="0" />
    </linearGradient>
    {/* halo quente em volta do sol */}
    <radialGradient id="g-halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFD7C4" stopOpacity="0.9" />
      <stop offset="0.45" stopColor="#FFE6DA" stopOpacity="0.45" />
      <stop offset="1" stopColor="#FFF" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="g-chao" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8E0A04" />
      <stop offset="0.35" stopColor={C.red} />
      <stop offset="1" stopColor="#8A0904" />
    </linearGradient>
    {/* coroa da totalidade: a luz que vaza em volta da lua */}
    <radialGradient id="g-corona" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFE2CF" stopOpacity="0.9" />
      <stop offset="0.42" stopColor="#FFE2CF" stopOpacity="0.85" />
      <stop offset="0.5" stopColor="#F7B9A0" stopOpacity="0.38" />
      <stop offset="0.7" stopColor="#D9634A" stopOpacity="0.12" />
      <stop offset="1" stopColor="#B0201A" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="g-raio" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFE2CF" stopOpacity="0.5" />
      <stop offset="1" stopColor="#FFE2CF" stopOpacity="0" />
    </linearGradient>
  </defs>
);
