import { loadFont } from "@remotion/google-fonts/BarlowCondensed";

// Configuração visual central do "Fotógrafo de show" (Canal Dark, São Paulo):
// cinza de garoa, concreto, azul cobalto de noite e um único acento, o vermelho do canal.

export const { fontFamily: FONT } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

/** Fonte das placas desenhadas em canvas (texturas). Fonte do sistema: já existe quando o canvas desenha. */
export const SIGN_FONT = "Impact, 'Arial Black', sans-serif";

export const PALETTE = {
  // Estados didáticos (sempre com ícone + texto, nunca só cor)
  positive: "#3ecf6e",
  negative: "#e5372b",
  info: "#3b6cff",
  warning: "#ffc53d",
  // Interface
  text: "#ffffff",
  outline: "#0b0d12",
  accent: "#e5372b",
  // Cidade
  asphalt: "#34373c",
  asphaltLine: "#e8c547",
  sidewalk: "#b3aea5",
  curb: "#8a857d",
  plinth: "#2a2b2f",
  plinthTop: "#57585c",
  concrete: "#a29d94",
  concreteDark: "#7c7871",
  grey1: "#8d9298",
  grey2: "#6c7279",
  grey3: "#a6a9ab",
  grey4: "#5a6067",
  copan: "#d9d2c3",
  masp: "#d8262b",
  glass: "#3d5568",
  black: "#17171a",
  white: "#f2f0eb",
  wood: "#8a5a3a",
  bread: "#d9a15b",
  // Personagens
  skin: "#b57852",
  hoodie: "#1c1c1f",
  jeans: "#2c3c5a",
  shoe: "#efefef",
  hair: "#141414",
} as const;

/** Acabamento fosco do diorama. */
export const MATTE = { roughness: 0.9, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.4, metalness: 0.5, flatShading: true } as const;

/** Perspectiva suave: FOV baixo preserva a leitura de maquete. */
export const CAMERA = { fov: 24, near: 0.3, far: 400 } as const;

/** Faixas seguras para Reels/TikTok (px numa tela 1080x1920). */
export const SAFE = {
  top: 250,
  bottom: 1540,
  side: 90,
  badgeTop: 262,
  captionCenterY: 1418,
} as const;

/** Céu por hora do dia (sky.time em módulo 1): [topo, meio, base]. */
export const SKY_KEYS: { t: number; c: [string, string, string] }[] = [
  { t: 0.0, c: ["#070d22", "#13254d", "#22376a"] },
  { t: 0.19, c: ["#070d22", "#13254d", "#22376a"] },
  { t: 0.26, c: ["#283769", "#d9734b", "#f4bf86"] },
  { t: 0.36, c: ["#8794a0", "#bcc3c7", "#dddcd6"] },
  { t: 0.7, c: ["#8794a0", "#bcc3c7", "#dddcd6"] },
  { t: 0.79, c: ["#272452", "#9c4569", "#ee8a4c"] },
  { t: 0.87, c: ["#070d22", "#13254d", "#22376a"] },
  { t: 1.0, c: ["#070d22", "#13254d", "#22376a"] },
];

/** Cores das palavras-chave nas legendas. Padrão amarelo; vermelho pra perda, verde pra conquista. */
export const KEYWORD_COLOR: Record<string, string> = {
  NUNCA: "#ff4a4a",
  REAL: "#ff4a4a",
  CARA: "#ff4a4a",
  NINGUÉM: "#ff4a4a",
  PAGA: "#ff4a4a",
  CRÉDITO: "#ff4a4a",
  VISUALIZADO: "#ff4a4a",
  ÁGUA: "#ff4a4a",
  TRÊS: "#ff4a4a",
  PRIMEIRA: "#4be38a",
  CÂMERA: "#4be38a",
  LINDO: "#4be38a",
  MELHOR: "#4be38a",
  VIDA: "#4be38a",
};
export const KEYWORD_DEFAULT = "#ffd23f";
