import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";
import { random } from "remotion";
import { SIGN_FONT } from "../theme";

// Texturas desenhadas em canvas (placas, telas, pichação, janelas). Cache por chave: cada textura
// é criada uma vez por aba do navegador e é determinística (sem Math.random).

const cache = new Map<string, CanvasTexture>();

export const canvasTexture = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, pixel = false) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g, w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  if (pixel) {
    t.magFilter = NearestFilter;
    t.minFilter = NearestFilter;
  }
  cache.set(key, t);
  return t;
};

/** Placa simples: fundo, texto centralizado, borda opcional. */
export const signTexture = (text: string, opts: { bg?: string; fg?: string; border?: string; w?: number; h?: number; size?: number; sub?: string } = {}) => {
  const { bg = "#111", fg = "#fff", border, w = 512, h = 160, size = 110, sub } = opts;
  return canvasTexture(`sign:${text}:${bg}:${fg}:${border}:${w}:${h}:${size}:${sub}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (border) {
      g.strokeStyle = border;
      g.lineWidth = Math.max(6, h * 0.06);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
    }
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `${size}px ${SIGN_FONT}`;
    const y = sub ? h * 0.4 : h * 0.53;
    g.fillText(text, w / 2, y, w * 0.9);
    if (sub) {
      g.font = `${Math.round(size * 0.42)}px ${SIGN_FONT}`;
      g.fillText(sub, w / 2, h * 0.8, w * 0.9);
    }
  });
};

/** Neon: texto com brilho (fundo transparente). */
export const neonTexture = (text: string, color: string, w = 512, h = 192) =>
  canvasTexture(`neon:${text}:${color}:${w}:${h}`, w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `${Math.round(h * 0.62)}px ${SIGN_FONT}`;
    g.shadowColor = color;
    for (const blur of [36, 18, 6]) {
      g.shadowBlur = blur;
      g.fillStyle = color;
      g.fillText(text, w / 2, h * 0.54, w * 0.92);
    }
    g.shadowBlur = 0;
    g.fillStyle = "#fff6f0";
    g.fillText(text, w / 2, h * 0.54, w * 0.92);
  });

/** Pichação (pixo): letras retas e altas em fileira, preto sobre transparente. */
export const pixoTexture = (seed: string, rows = 2, w = 512, h = 256) =>
  canvasTexture(`pixo:${seed}:${rows}`, w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = "#0d0d0f";
    g.lineCap = "square";
    const rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = 14;
      const top = r * rowH + rowH * 0.14;
      const bot = top + rowH * 0.72;
      let i = 0;
      while (x < w - 30) {
        const s = `${seed}-${r}-${i++}`;
        const lw = 4 + random(s + "w") * 4;
        const cw = 16 + random(s + "c") * 22;
        g.lineWidth = lw;
        g.beginPath();
        const kind = Math.floor(random(s + "k") * 5);
        if (kind === 0) {
          g.moveTo(x, bot); g.lineTo(x, top); g.lineTo(x + cw, top); g.lineTo(x + cw, bot);
        } else if (kind === 1) {
          g.moveTo(x, bot); g.lineTo(x + cw / 2, top); g.lineTo(x + cw, bot); g.moveTo(x + cw * 0.25, (top + bot) / 2); g.lineTo(x + cw * 0.75, (top + bot) / 2);
        } else if (kind === 2) {
          g.moveTo(x + cw, top); g.lineTo(x, top); g.lineTo(x, bot); g.lineTo(x + cw, bot);
        } else if (kind === 3) {
          g.moveTo(x, top); g.lineTo(x, bot); g.moveTo(x, top); g.lineTo(x + cw, (top + bot) / 2); g.lineTo(x, bot);
        } else {
          g.moveTo(x, top - rowH * 0.08); g.lineTo(x, bot); g.lineTo(x + cw, bot); g.moveTo(x + cw, top - rowH * 0.08); g.lineTo(x + cw, bot);
        }
        g.stroke();
        x += cw + 9 + random(s + "g") * 8;
      }
    }
  });

/** Janelas de prédio: grade com algumas acesas (usada como emissiveMap à noite). */
export const windowsTexture = (seed: string, cols: number, rows: number, lit: number) =>
  canvasTexture(`win:${seed}:${cols}:${rows}:${lit}`, cols * 16, rows * 16, (g, w, h) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = random(`${seed}-${r}-${c}`) < lit;
        g.fillStyle = on ? (random(`${seed}-h-${r}-${c}`) < 0.2 ? "#9fd0ff" : "#ffd58a") : "#000";
        g.fillRect(c * 16 + 3, r * 16 + 4, 10, 9);
      }
    }
  }, true);

/** Fachada com janelas (cor), mesma grade da textura emissiva. */
export const facadeTexture = (seed: string, cols: number, rows: number, wall: string, glass: string) =>
  canvasTexture(`fac:${seed}:${cols}:${rows}:${wall}:${glass}`, cols * 16, rows * 16, (g, w, h) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, w, h);
    g.fillStyle = glass;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g.fillRect(c * 16 + 3, r * 16 + 4, 10, 9);
  }, true);

/** Texto multi-linha em cartão (telão, celular, cartão de crédito, calendário...). */
export const cardTexture = (key: string, w: number, h: number, bg: string, lines: { text: string; size: number; color: string; y: number }[]) =>
  canvasTexture(`card:${key}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const l of lines) {
      g.font = `${l.size}px ${SIGN_FONT}`;
      g.fillStyle = l.color;
      g.fillText(l.text, w / 2, l.y * h, w * 0.92);
    }
  });

/** Foto de show estilizada (silhueta do artista com luz vermelha), usada no telão e nas fotos da parede. */
export const showPhotoTexture = (seed: string) =>
  canvasTexture(`photo:${seed}`, 256, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#1a0607");
    grd.addColorStop(1, "#000");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(227,38,47,0.75)";
    g.beginPath();
    const lx = w * (0.3 + random(seed) * 0.4);
    g.moveTo(lx - 10, 0); g.lineTo(lx + 10, 0); g.lineTo(w * 0.8, h); g.lineTo(w * 0.2, h);
    g.fill();
    g.fillStyle = "#050505";
    const cx = w * (0.4 + random(seed + "x") * 0.2);
    g.beginPath(); g.arc(cx, h * 0.42, w * 0.09, 0, Math.PI * 2); g.fill();
    g.fillRect(cx - w * 0.12, h * 0.5, w * 0.24, h * 0.5);
    g.save(); g.translate(cx + w * 0.1, h * 0.5); g.rotate(-0.9); g.fillRect(0, -6, w * 0.22, 12); g.restore();
    g.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 400; i++) g.fillRect(random(seed + "n" + i) * w, random(seed + "m" + i) * h, 1.5, 1.5);
  });
