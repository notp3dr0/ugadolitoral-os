import { loadFont as loadBarlow } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

// Configuração visual central: paleta, materiais, luz, câmera e áreas seguras.
// Marca do canal (provisória): estúdio escuro, off-white quente, vermelho pontual; Barlow Condensed + Manrope.

export const { fontFamily: FONT } = loadBarlow("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const { fontFamily: FONT_TEXT } = loadManrope("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

export const PALETTE = {
  // Estados didáticos (sempre com ícone + texto, nunca só cor)
  positive: "#3ecf6e",
  negative: "#e5372b",
  info: "#3b6cff",
  warning: "#ffc53d",
  // Interface
  text: "#f2f0eb",
  outline: "#070709",
  accent: "#53d6ff",
  // Maquete
  slab: "#3a3840",
  slabEdge: "#26252b",
  sidewalk: "#8f8a84",
  street: "#2b2b31",
  stripe: "#e9e4d6",
  // Loja de celular
  shopWall: "#c9d3dc",
  shopInner: "#9fb0c2",
  shopFloor: "#e4e8ec",
  shopTrim: "#33405a",
  shopSignBg: "#14203a",
  shopSign: "#6fe3ff",
  phoneBody: "#1c1d22",
  // Padaria
  bakeryWall: "#f1e3c6",
  bakeryInner: "#e8cfa2",
  bakeryFloor: "#c98f5b",
  awningA: "#e8873a",
  awningB: "#fff4e2",
  bakerySignBg: "#fff4e2",
  bakerySign: "#b4561e",
  bread: "#d9973f",
  breadDark: "#a8662a",
  oven: "#8a4b33",
  wicker: "#9a6a3c",
  // Torre do relógio
  tower: "#5b5560",
  towerTrim: "#3f3a44",
  clockFace: "#f2f0eb",
  arcLoja: "#3b8bff",
  arcPadaria: "#f08a2c",
  overlap: "#e5372b",
  // Personagens
  skinNadini: "#f0cdb0",
  hairNadini: "#585a66",
  shirtNadini: "#2fb3c9",
  pantsNadini: "#2c3e66",
  skinAline: "#e0a882",
  hairAline: "#5a2a1a",
  blazerAline: "#7a2d3a",
  pantsAline: "#1f1f28",
  skinBaker: "#b77a52",
  baker: "#f7f5f0",
  mannequin: "#e9e4da",
  paper: "#fbf8ef",
  coin: "#f2c14e",
} as const;

/** Acabamento levemente fosco para todo o diorama. */
export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.55,
  hemisphere: { sky: "#e6ecff", ground: "#3a3048", intensity: 1.05 },
  key: { position: [7, 16, 14] as [number, number, number], intensity: 2.5, color: "#fff4e6" },
  fill: { position: [-12, 6, 8] as [number, number, number], intensity: 0.8, color: "#cfe0ff" },
  rim: { position: [-4, 9, -12] as [number, number, number], intensity: 0.8, color: "#ffd2a6" },
  shadowMapSize: 2048,
} as const;

/** Perspectiva suave: FOV baixo e câmera afastada preservam a leitura da maquete. */
export const CAMERA = { fov: 24, near: 0.1, far: 400 } as const;

/** Faixas seguras para Shorts/Reels (px numa tela 1080x1920). */
export const SAFE = {
  top: 250,
  bottom: 1540,
  side: 90,
  badgeTop: 262,
  captionCenterY: 1418,
} as const;

/** Céu azul de dia (mode 0, pedido do Pedro) e o tom de fita rebobinando (mode 1). */
export const SKY = {
  day: ["#1f7bff", "#58b2ff", "#cfeaff"],
  rewind: ["#3a2a8f", "#6a52c8", "#bcaef0"],
} as const;

/** Cores das palavras-chave nas legendas (as demais palavras ficam brancas). */
export const KEYWORD_COLOR: Record<string, string> = {
  NADINI: "#ffb36b",
  ALINE: "#ff8fa3",
  DOIS: PALETTE.positive,
  EMPREGOS: PALETTE.positive,
  TRÊS: PALETTE.arcLoja,
  DUAS: PALETTE.arcPadaria,
  PROBLEMA: PALETTE.negative,
  RADAR: PALETTE.negative,
  BIPOU: PALETTE.negative,
  MANEQUIM: PALETTE.warning,
  DESCONTO: PALETTE.negative,
  CAIU: PALETTE.negative,
  BAGUETE: PALETTE.warning,
  CATAPULTA: PALETTE.warning,
  CELULAR: "#6fe3ff",
  PÃO: PALETTE.bread,
  FURIOSA: PALETTE.negative,
  DEMITIDA: PALETTE.negative,
  DESEMPREGADA: PALETTE.negative,
};
export const KEYWORD_DEFAULT = "#4fdcff";
