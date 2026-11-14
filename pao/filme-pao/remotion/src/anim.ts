// Ferramentas de tempo. Todo movimento do filme passa por aqui:
// chave = [quadro, valor, easing do trecho que CHEGA nesse quadro].
import { Easing, interpolate } from "remotion";

export const FPS = 30;

export const E = {
  lin: (t: number) => t,
  in: Easing.in(Easing.cubic),
  out: Easing.out(Easing.cubic),
  io: Easing.inOut(Easing.cubic),
  // estouro com sobra (balão acendendo, pose de alegria)
  back: Easing.out(Easing.back(1.7)),
  // estalo: chega quase instantâneo (contato com botão)
  snap: Easing.out(Easing.exp),
};

export type Chave = [number, number, ((t: number) => number)?];

export const track = (f: number, ks: Chave[]): number => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [f1, v1, e] = ks[i];
    const [f0, v0] = ks[i - 1];
    if (f <= f1) {
      if (f1 === f0) return v1;
      return interpolate(f, [f0, f1], [v0, v1], { easing: e ?? E.io });
    }
  }
  return ks[ks.length - 1][1];
};

// Piscada medida no original (24 fps: fecha 2, fechada 1, abre 2) levada a 30 fps.
// Devolve o quanto a pálpebra cobre (0 aberto, 1 fechado). `depois` = onde ela para.
export const piscada = (f: number, inicio: number, antes = 0, depois = antes) =>
  track(f, [
    [inicio, antes],
    [inicio + 3, 1, E.in],
    [inicio + 4, 1],
    [inicio + 7, depois, E.out],
  ]);

// Respiração sutil (achatamento do corpo), pra ninguém ficar congelado no "segurar".
export const respira = (f: number, amp = 0.012, periodo = 52) =>
  1 + Math.sin((f / periodo) * Math.PI * 2) * amp;

// Tremidinha de câmera (contato, estouro). Decai em `dur` quadros.
export const tremor = (f: number, inicio: number, dur = 6, amp = 6) => {
  const t = f - inicio;
  if (t < 0 || t > dur) return { x: 0, y: 0 };
  const k = (1 - t / dur) * amp;
  return { x: Math.sin(t * 2.7) * k, y: Math.cos(t * 3.9) * k };
};
