import { orbit, type Vec3 } from "./utils/animation";

// Planta do quarteirão em São Paulo (u3d). Rua principal ao longo de x em z∈[-1,0.8].
// Fileira de trás (fachada pra rua e pra câmera): telemarketing em pilotis, casa de show, prédio do ponto.
// Fileira da frente (em corte, tipo casa de boneca, aberta pro +z): padaria, quartinho, mercadinho.
// Em volta: skyline (Copan, MASP, antenas da Paulista), fios, garoa.

/** Onde o Você fica em cada lugar: [x, z] e pra onde olha (yaw em graus; 0 = +z, de frente pra câmera). */
export const SPOT = {
  quarto: { p: [0.25, 3.25] as [number, number], yaw: 0 },
  desk: { p: [-0.15, 3.0] as [number, number], yaw: -90 },
  padaria: { p: [-3.3, 2.05] as [number, number], yaw: 0 },
  callcenter: { p: [-3.2, -2.45] as [number, number], yaw: 0 },
  stage: { p: [0.6, -3.4] as [number, number], yaw: 180 },
  door: { p: [1.3, -1.2] as [number, number], yaw: -40 },
  city: { p: [0, -0.1] as [number, number], yaw: 0 },
  mercado: { p: [3.05, 2.85] as [number, number], yaw: 90 },
  onibus: { p: [3.1, -1.4] as [number, number], yaw: 90 },
  camarim: { p: [-1.0, -4.45] as [number, number], yaw: 180 },
} as const;

/** Casas de show extras que brotam na cena das DMs (fora do quarteirão, nas laterais). */
export const EXTRA_CASAS: { p: [number, number]; name: string }[] = [
  { p: [-5.7, -2.7], name: "SHOW" },
  { p: [5.9, -2.7], name: "LIVE" },
  { p: [-5.7, 2.6], name: "BAILE" },
  { p: [5.7, 2.6], name: "BAR" },
];

/** Poses de câmera compartilhadas (orbit(alvo, distância, azimute°, elevação°)). */
export const P = {
  stageClose: { ...orbit([0.6, 0.8, -3.4], 1.7, 196, 9), zoom: 0.6 },
  stageClose2: { ...orbit([0.6, 0.8, -3.4], 1.6, 186, 8), zoom: 0.68 },
  rewindMid: { ...orbit([0.4, 1.4, -1.5], 14, 110, 48), zoom: 1 },
  wide: { ...orbit([0, 1.2, -0.6], 46, 24, 26), zoom: 1 },
  quarto: orbit([0.05, 0.8, 3.0], 6.5, 6, 16),
  padaria: orbit([-3.3, 0.85, 2.3], 6.2, -12, 23),
  callcenter: orbit([-3.2, 1.2, -2.4], 8, -4, 26),
  rig: orbit([-1.7, 1.4, 0.2], 24, -12, 22),
  rig2: orbit([-1.7, 1.4, 0.2], 24, 8, 22),
  piggy: orbit([0.6, 1.08, 2.25], 3.0, 8, 6),
  heroLow: orbit([0.25, 0.72, 3.25], 3.8, 10, 2),
  heroLowIn: orbit([0.25, 0.75, 3.25], 3.1, 12, 2),
  quartoMid: orbit([0.1, 0.8, 3.0], 5.5, -6, 14),
  padariaClose: orbit([-3.5, 0.78, 2.85], 5.0, 8, 14),
  padariaClose2: orbit([-3.5, 0.78, 2.85], 4.9, 9, 14),
  showFacade: orbit([0.6, 1.4, -2.3], 10, 8, 15),
  door: orbit([0.85, 0.75, -1.25], 5.2, 14, 22),
  door2: orbit([0.85, 0.75, -1.25], 5.2, 20, 22),
  showInside: orbit([0.6, 0.8, -3.5], 6.8, -6, 26),
  showInside2: orbit([0.6, 0.8, -3.5], 6.8, 8, 26),
  quartoNight: orbit([-0.3, 0.8, 3.0], 4.6, 8, 12),
  telao: orbit([0.6, 2.85, -1.55], 6.5, 0, 4),
  city: orbit([0, 0.5, -0.4], 52, 4, 56),
  city2: orbit([0, 0.5, -0.4], 52, 14, 56),
  casa2: orbit([5.5, 0.9, -1.9], 6, 30, 12),
  heroChest: orbit([0, 0.68, -0.1], 3.2, 35, 6),
  mercado: orbit([3.4, 0.8, 2.8], 5, 30, 10),
  onibus: orbit([3.5, 0.8, -1.25], 5.2, 40, 10),
  camarim: orbit([-0.9, 0.8, -4.5], 4.4, 8, 16),
  quarto11: orbit([0.15, 0.9, 3.0], 5.6, 0, 12),
  quarto11b: orbit([0.15, 0.9, 3.0], 4.2, 12, 10),
  wideFinal: orbit([0, 1.2, -0.6], 48, 28, 24),
  wideFinal2: orbit([0, 1.2, -0.6], 48, 40, 24),
  padariaDawn: orbit([-3.3, 0.9, 2.3], 6, -16, 12),
};

/** Ponto acima da cabeça do Você (pra etiqueta FOTOGRAFIA: R$ 0,00). */
export const HEAD_TOP = 1.12;

export type XZ = [number, number];
export const v3 = (p: XZ, y = 0): Vec3 => [p[0], y, p[1]];
