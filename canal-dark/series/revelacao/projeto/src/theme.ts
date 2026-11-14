import { loadFont } from "@remotion/google-fonts/Montserrat";

// Identidade visual central da série. Troque a paleta por série, mantendo os PAPÉIS:
// noite (fundo), acento (a única cor quente do episódio), pele, tecido, madeira, luz.

export const { fontFamily: FONT } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const PAL = {
  // noite: do mais escuro ao mais claro
  night0: "#05050c",
  night1: "#0b0d1c",
  night2: "#161a33",
  night3: "#2a2f55",
  dusk: ["#3a2a5a", "#7a3f6e", "#d9764a"], // pôr do sol (topo -> horizonte)
  // acento: UMA cor quente por episódio (legenda destacada, rim light, detalhe)
  accent: "#ff9d1c",
  // materiais
  wood: "#8a6a47",
  woodDark: "#5b432c",
  steel: "#9aa3b8",
  steelDark: "#505870",
  skin: "#dcc2a6",
  ghoul: "#e6e9f2",
  ghoulShade: "#a9b0c4",
  cloth: "#5b6076",
  pants: "#2b2f45",
  ink: "#0a0a14", // contorno das peças
  white: "#ffffff",
  blood: "#7a1020",
} as const;

/** Áreas seguras (Shorts/Reels/TikTok cobrem topo e base com interface). */
export const SAFE = { side: 70, top: 240, bottom: 420, captionY: 1010 } as const;
