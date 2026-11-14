// Renderiza frames específicos como PNG para revisão rápida (um único bundle).
// Uso: node scripts/stills.mjs 0 60 123 ...   -> out/stills/f0000.png ...
// Opcional: SCALE=0.5 (padrão 0.5). COMP=<id> troca a composição (padrão EpisodioDemo).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const frames = process.argv.slice(2).map(Number);
const outDir = path.resolve("out/stills");
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const port = 3125;
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? "EpisodioDemo", port });

for (const fr of frames) {
  const frame = Math.min(composition.durationInFrames - 1, fr);
  const output = path.join(outDir, `f${String(frame).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: Number(process.env.SCALE ?? 0.5), port });
  console.log(output);
}
