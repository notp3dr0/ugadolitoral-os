import { useMemo } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import { MATTE } from "../theme";

/** Material fosco com opacidade (o quarto some e volta inteiro). */
export const Mat: React.FC<{ color: string; o?: number; emissive?: string; ei?: number; double?: boolean; rough?: number; metal?: number }> = ({ color, o = 1, emissive, ei = 0, double, rough, metal }) => (
  <meshStandardMaterial
    // remonta o material quando a transparência liga/desliga (o Three não recompila sozinho)
    key={o < 0.999 ? "t" : "o"}
    {...MATTE}
    roughness={rough ?? MATTE.roughness}
    metalness={metal ?? 0}
    color={color}
    transparent={o < 0.999}
    opacity={o}
    depthWrite={o > 0.6}
    emissive={emissive ?? "#000000"}
    emissiveIntensity={ei}
    side={double ? DoubleSide : undefined}
  />
);

/** Textura desenhada num canvas (síncrona e determinística). */
export const useCanvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[] = []) =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    draw(ctx);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

/** Grade da rede: linhas brancas em fundo transparente (usada como alphaMap). */
export const useGridTexture = (step: number, line: number) =>
  useCanvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#fff";
    for (let p = step / 2; p < 512; p += step) {
      ctx.fillRect(p - line / 2, 0, line, 512);
      ctx.fillRect(0, p - line / 2, 512, line);
    }
  }, [step, line]);
