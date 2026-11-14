import { loadFont as loadBarlow } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

// Configuração visual central: paleta, materiais, luz, câmera e áreas seguras.
// Fontes da marca Uga do Litoral: Barlow Condensed (títulos, badges, legendas) e Manrope (texto de apoio).

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
  positive: "#20b85a",
  negative: "#e5383b",
  info: "#2f7df6",
  warning: "#f8c815",
  // Interface
  text: "#ffffff",
  outline: "#070709",
  accent: "#53d6ff",
  // Quarto à noite
  floor: "#3b3550",
  wall: "#2a3256",
  wallSide: "#232a49",
  bedFrame: "#6b4a3a",
  mattress: "#d9d4e8",
  blanket: "#c0392b",
  blanketFold: "#e0574a",
  pillow: "#f2f0eb",
  nightstand: "#7a5a46",
  lamp: "#f2d49b",
  moon: "#fff3c4",
  windowSky: "#0f1d45",
  skin: "#d9a07f",
  shirt: "#4a5568",
  // Raquete
  racketBody: "#f2f0eb",
  racketAccent: "#e5383b",
  handle: "#2b2b31",
  mesh: "#a5a5a5",
  poleA: "#3fa2ff",
  poleB: "#ff4040",
  board: "#1f7a4a",
  copper: "#d08a4a",
  battery: "#2f7df6",
  batteryCap: "#c7ccd4",
  capacitor: "#3c66c9",
  spark: "#fff6b0",
  current: "#7fe8ff",
  bench: "#18181c",
  // Mosquito
  mosquito: "#4a4038",
  mosquitoStripe: "#e8e2d6",
  wing: "#dfeeff",
} as const;

/** Acabamento levemente fosco para todo o diorama. */
export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.38, metalness: 0.55, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.6,
  hemisphere: { sky: "#c9d6ff", ground: "#3a3048", intensity: 1.1 },
  key: { position: [6, 14, 12] as [number, number, number], intensity: 2.4, color: "#e8eeff" },
  fill: { position: [-12, 6, 8] as [number, number, number], intensity: 0.8, color: "#ffd9b0" },
  rim: { position: [-4, 8, -12] as [number, number, number], intensity: 0.7, color: "#9fb8ff" },
  shadowMapSize: 2048,
} as const;

/** Perspectiva suave: FOV baixo e câmera afastada preservam a leitura do esquema. */
export const CAMERA = { fov: 24, near: 0.1, far: 400 } as const;

/** Faixas seguras para Shorts/Reels (px numa tela 1080x1920). */
export const SAFE = {
  top: 250,
  bottom: 1540,
  side: 90,
  badgeTop: 262,
  captionCenterY: 1418,
} as const;

/** Fundo: noite no quarto (mode 0) e carvão da marca dentro da raquete (mode 1). */
export const SKY = {
  night: ["#0b1638", "#1c2c5c", "#0a0f24"],
  inside: ["#0d0d10", "#17171c", "#050505"],
} as const;

/** Cores das palavras-chave nas legendas (as demais palavras ficam brancas). */
export const KEYWORD_COLOR: Record<string, string> = {
  PLAFT: PALETTE.warning,
  ERROU: PALETTE.negative,
  OFENDIDO: PALETTE.negative,
  NADA: PALETTE.negative,
  CHOQUE: PALETTE.warning,
  REDE: PALETTE.positive,
  OSCILADOR: PALETTE.positive,
  TRANSFORMADOR: PALETTE.positive,
  CAPACITOR: PALETTE.positive,
  CAPACITORES: PALETTE.positive,
  DIODOS: PALETTE.positive,
  ARMADA: PALETTE.positive,
  REDES: PALETTE.positive,
  ESTALO: PALETTE.warning,
  CHURRASQUINHO: PALETTE.warning,
  DÓI: PALETTE.negative,
  TESTE: PALETTE.negative,
  JOÃO: "#ffb36b",
  GABRIEL: "#ffb36b",
};
export const KEYWORD_DEFAULT = "#4fdcff";
