import { loadFont } from "@remotion/google-fonts/Poppins";
import { Easing } from "remotion";
import logo from "./dados/logo-data.json";
import estampa from "./dados/estampa-data.json";

// Cores observadas na identidade do Semear (ver pao/instituto-semear/marca/design-guide.md)
export const C = {
  papel: "#EDEDED",
  marrom: "#975F30",
  amarelo: "#FFBB00",
  oliva: "#85933C",
  oliva2: "#5E682C",
  azul: "#237B9F",
  azul2: "#196282",
  petroleo: "#0F3A4A",
  tinta: "#1F1F1F",
  branco: "#FFFFFF",
};

export const { fontFamily: POPPINS } = loadFont("normal", {
  weights: ["400", "600", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const CHEGA = Easing.bezier(0.16, 1, 0.3, 1);
export const SAI = Easing.bezier(0.7, 0, 0.84, 0);
export const VAIVEM = Easing.bezier(0.65, 0, 0.35, 1);

// tremida de câmera curta, determinística (some em `dur` frames)
export const tremor = (frame: number, inicio: number, dur = 10, amp = 22) => {
  const t = frame - inicio;
  if (t < 0 || t > dur) return "0px 0px";
  const k = (1 - t / dur) * amp;
  return `${(Math.sin(t * 2.3) * k).toFixed(1)}px ${(Math.cos(t * 3.1) * k).toFixed(1)}px`;
};

// ---------- geometria dos desenhos vetorizados dos posts do Semear ----------
export type Caixa = { x0: number; y0: number; x1: number; y1: number };
export const bbox = (d: string): Caixa => {
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
  }
  return { x0, y0, x1, y1 };
};

export const PESSOAS = logo.pessoas.map((p) => {
  const a = bbox(p.body), b = bbox(p.head);
  return { ...p, caixa: { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) } };
});
export const MAOS = logo.maos;
export const MAOS_CAIXA = logo.maosBox as Caixa & { cx: number; cy: number };
export const TOPO = Math.min(...PESSOAS.map((p) => p.caixa.y0));

// estampa agrupada por célula (10 colunas x 7 linhas no post P56-04)
const [EW, EH] = estampa.viewBox;
export const CEL_W = EW / 10, CEL_H = EH / 7;
export const ESTAMPA_CORES = estampa.cores as Record<string, string>;
export const CELULAS: Record<string, Record<string, string>> = {};
for (const [nome, d] of Object.entries(estampa.paths as Record<string, string>)) {
  for (const sp of d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean)) {
    const b = bbox(sp);
    const c = Math.min(9, Math.floor((b.x0 + b.x1) / 2 / CEL_W));
    const r = Math.min(6, Math.floor((b.y0 + b.y1) / 2 / CEL_H));
    const k = `${r}-${c}`;
    CELULAS[k] = CELULAS[k] ?? {};
    CELULAS[k][nome] = (CELULAS[k][nome] ?? "") + sp + " ";
  }
}
