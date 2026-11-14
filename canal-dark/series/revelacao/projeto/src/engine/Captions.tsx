import { interpolate, useCurrentFrame } from "remotion";
import { FONT, FPS, PAL, SAFE, W } from "../theme";
import { clamp } from "../utils/anim";

// Legenda do formato: 2 a 3 palavras por vez, centralizada, caixa-alta, UMA palavra colorida
// (a que carrega o sentido). A legenda troca mais rápido que o plano.

export type Word = { t: string; from: number; to: number; hi?: boolean }; // from/to em SEGUNDOS no episódio

type Page = { words: Word[]; from: number; to: number };

const MAX_WORDS = 3;
const MAX_CHARS = 16;

export const buildPages = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  let chars = 0;
  const flush = () => {
    if (cur.length) pages.push({ words: cur, from: cur[0].from, to: cur[cur.length - 1].to });
    cur = [];
    chars = 0;
  };
  for (const w of words) {
    const prev = cur[cur.length - 1];
    // pausa longa (fim de fala, silêncio, susto) sempre quebra o bloco
    if (cur.length && (cur.length >= MAX_WORDS || chars + w.t.length > MAX_CHARS || w.from - prev.to > 0.45)) flush();
    cur.push(w);
    chars += w.t.length + 1;
    if (/[.!?]$/.test(w.t)) flush();
  }
  flush();
  // cada página fica até a próxima começar, ou 0,25 s depois da última palavra
  return pages.map((p, i) => {
    const next = pages[i + 1];
    return { ...p, to: next && next.from - p.to < 0.4 ? next.from : p.to + 0.25 };
  });
};

export const Captions: React.FC<{ words: Word[]; accent?: string; size?: number; y?: number }> = ({ words, accent = PAL.accent, size = 64, y = SAFE.captionY }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const page = buildPages(words).find((p) => t >= p.from - 0.03 && t < p.to);
  if (!page) return null;
  const k = clamp((t - page.from + 0.03) / 0.12, 0, 1);
  const scale = interpolate(k, [0, 1], [0.9, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.side,
        width: W - SAFE.side * 2,
        top: y - 70,
        height: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 18,
        flexWrap: "nowrap",
        opacity: k,
        transform: `scale(${scale})`,
      }}
    >
      {page.words.map((w, i) => (
        <span
          key={i}
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: size,
            textTransform: "uppercase",
            color: w.hi ? accent : PAL.white,
            textShadow: "0 3px 0 rgba(0,0,0,.55), 0 0 18px rgba(0,0,0,.8)",
            WebkitTextStroke: "1px rgba(0,0,0,.35)",
            letterSpacing: -1,
            whiteSpace: "nowrap",
          }}
        >
          {w.t.replace(/[.,:;]+$/, "")}
        </span>
      ))}
    </div>
  );
};
