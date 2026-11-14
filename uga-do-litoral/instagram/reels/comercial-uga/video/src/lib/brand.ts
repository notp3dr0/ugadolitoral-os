// Identidade do Uga, lida do CSS do portfólio (ugadolitoral.vercel.app) em 2026-11-04.
export const COLOR = {
  black: '#000000',
  offWhite: '#f2f0eb',
  red: '#fa1717',
  label: '#c0c0c0',
  labelDark: '#141414',
};

export const FONT = {
  // a abertura do site usa Arial/Helvetica bold, não a Barlow do guia de marca
  display: 'Arial, Helvetica, sans-serif',
  mono: 'Consolas, "Courier New", monospace',
};

// Mola do texto medida pela skill apple-motion (tokens.ts, SPRING.textIn). Usar sem durationInFrames.
export const SPRING_TEXT = {damping: 15.3, stiffness: 115, mass: 1};
export const SPRING_CAMERA = {damping: 30, stiffness: 60, mass: 1};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
