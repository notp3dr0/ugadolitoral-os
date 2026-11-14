import { useCurrentFrame } from "remotion";
import { EASE, EaseName, noise, prog } from "../utils/anim";
import { H, W } from "../theme";

// Câmera 2D: o "mundo" é um painel maior que a tela; a câmera aponta pra um ponto do mundo
// com zoom e rotação. É o que dá a sensação de câmera andando sobre um desenho plano.
// Regra da série: no calmo a câmera NUNCA fica parada (deriva lenta); parada só no susto.

export type CamKey = {
  /** frame LOCAL do plano */
  f: number;
  /** ponto do mundo no centro da tela (padrão = centro do mundo) */
  x?: number;
  y?: number;
  zoom?: number;
  rot?: number; // graus
  ease?: EaseName; // easing do trecho que CHEGA neste key
};

type Cam = { x: number; y: number; zoom: number; rot: number };

export const sampleCam = (keys: CamKey[], frame: number, base: Cam): Cam => {
  if (keys.length === 0) return { ...base };
  const first = keys[0];
  let prev: Cam = { x: first.x ?? base.x, y: first.y ?? base.y, zoom: first.zoom ?? base.zoom, rot: first.rot ?? base.rot };
  if (frame <= first.f) return prev;
  let prevF = first.f;
  for (const k of keys.slice(1)) {
    const next: Cam = { x: k.x ?? prev.x, y: k.y ?? prev.y, zoom: k.zoom ?? prev.zoom, rot: k.rot ?? prev.rot };
    if (frame <= k.f) {
      const t = prog(frame, prevF, k.f, EASE[k.ease ?? "soft"]);
      return {
        x: prev.x + (next.x - prev.x) * t,
        y: prev.y + (next.y - prev.y) * t,
        zoom: prev.zoom + (next.zoom - prev.zoom) * t,
        rot: prev.rot + (next.rot - prev.rot) * t,
      };
    }
    prev = next;
    prevF = k.f;
  }
  return prev;
};

type Props = {
  worldW?: number;
  worldH?: number;
  keys: CamKey[];
  /** tremor de câmera na mão, em px (0 = nenhum). 4–8 = tensão. */
  shake?: number;
  /** impacto: a partir do frame local `f`, tremor extra que decai em `dur` frames */
  hit?: { f: number; amp: number; dur?: number };
  children: React.ReactNode;
};

export const Camera2D: React.FC<Props> = ({ worldW = W, worldH = H, keys, shake = 0, hit, children }) => {
  const frame = useCurrentFrame();
  const c = sampleCam(keys, frame, { x: worldW / 2, y: worldH / 2, zoom: 1, rot: 0 });
  let sx = shake * noise(frame / 6, "cx");
  let sy = shake * noise(frame / 6, "cy");
  if (hit && frame >= hit.f) {
    const k = Math.max(0, 1 - (frame - hit.f) / (hit.dur ?? 14));
    sx += hit.amp * k * noise(frame * 1.7, "hx");
    sy += hit.amp * k * noise(frame * 1.7, "hy");
  }
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: worldW,
          height: worldH,
          transformOrigin: "0 0",
          transform: `translate(${W / 2 + sx}px, ${H / 2 + sy}px) scale(${c.zoom}) rotate(${c.rot}deg) translate(${-c.x}px, ${-c.y}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
