import { loadFont as loadBarlow } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

// Identidade provisória do canal dark (canal-dark/marca/design-guide.md): estúdio escuro,
// off-white quente, vermelho pontual; Barlow Condensed nos títulos, Manrope nos subtítulos.

export const { fontFamily: FONT } = loadBarlow("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
export const { fontFamily: FONT_SUB } = loadManrope("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] });

export const PALETTE = {
  // Estados didáticos (sempre com ícone + texto, nunca só cor)
  positive: "#2fbf63",
  negative: "#e5372b",
  info: "#3b6cff",
  warning: "#ffc53d",
  // Interface
  text: "#f2f0eb",
  outline: "#070707",
  accent: "#e5372b",
  // Mundo
  floor: "#151515",
  body: "#2b2d31",
  bodyDark: "#1c1d20",
  bodyEdge: "#3a3d42",
  red: "#e5372b",
  glass: "#9fc3ff",
  blade: "#101113",
  sensor: "#0d1a14",
  concrete: "#8d8a85",
  concreteDark: "#6d6a66",
  skin: "#c98f6a",
  shirt: "#f2f0eb",
  pants: "#2d3a55",
  board: "#d8a24a",
  sun: "#ffb35a",
  // Raios: um por ponto do skatista (topo, meio, base)
  rayTop: "#ff4a3d",
  rayMid: "#f2f0eb",
  rayLow: "#3b6cff",
} as const;

export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.42, metalness: 0.5, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.45,
  hemisphere: { sky: "#ffe2c4", ground: "#1a1a1a", intensity: 0.85 },
  key: { position: [-10, 12, 9] as [number, number, number], intensity: 2.4, color: "#ffe1bd" },
  fill: { position: [10, 5, 9] as [number, number, number], intensity: 0.7, color: "#c9d6ff" },
  rim: { position: [4, 8, -12] as [number, number, number], intensity: 0.9, color: "#ffffff" },
  shadowMapSize: 2048,
} as const;

export const CAMERA = { fov: 24, near: 0.5, far: 400 } as const;

export const SAFE = {
  top: 250,
  bottom: 1540,
  side: 90,
  badgeTop: 262,
  captionCenterY: 1418,
} as const;

/** Cores das palavras-chave nas legendas: problema vermelho, solução verde, termo azul, o resto amarelo. */
export const KEYWORD_COLOR: Record<string, string> = {
  MANCHA: PALETTE.negative,
  ESTOURA: PALETTE.negative,
  BORRÃO: PALETTE.negative,
  ESCURECE: PALETTE.negative,
  RUÍDO: PALETTE.negative,
  LENTE: PALETTE.positive,
  LÂMINAS: PALETTE.positive,
  DIAFRAGMA: PALETTE.positive,
  OBTURADOR: PALETTE.positive,
  CONGELA: PALETTE.positive,
  AMPLIFICA: PALETTE.positive,
  ISO: "#7f9dff",
  ABERTURA: "#7f9dff",
};
export const KEYWORD_DEFAULT = PALETTE.warning;
