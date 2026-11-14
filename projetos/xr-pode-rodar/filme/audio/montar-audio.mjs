// Monta o áudio do "Pode rodar?" a partir de audio/faixas.json.
// 1. normaliza a locução (audio/locucao/*.wav -> assets/locucao/*.wav, -16 LUFS, pico -1,5 dBTP)
// 2. reescreve o bloco entre <!-- AUDIO --> e <!-- /AUDIO --> do index.html (faixas 10, 11 e 12)
// 3. exporta os stems separados em audio/stems/ (voz.wav, trilha.wav, efeitos.wav) e uma mixagem de conferência
// Uso: node audio/montar-audio.mjs [--sem-stems]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, "audio/faixas.json"), "utf8"));
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const r3 = (n) => Math.round(n * 1000) / 1000;

// 1. locução normalizada
fs.mkdirSync(path.join(RAIZ, "assets/locucao"), { recursive: true });
for (const c of cfg.faixas.voz.cues) {
  const origem = path.join(RAIZ, "audio/locucao", path.basename(c.src));
  const destino = path.join(RAIZ, c.src);
  if (!fs.existsSync(origem)) { console.warn(`falta a fala ${origem}`); continue; }
  if (!fs.existsSync(destino) || fs.statSync(destino).mtimeMs < fs.statSync(origem).mtimeMs) {
    ff(["-i", origem, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000", "-ar", "48000", "-ac", "1", destino]);
  }
}

// 2. bloco de áudio do index.html
const linhas = [];
const todas = [];
for (const [grupo, faixa] of Object.entries(cfg.faixas)) {
  linhas.push(`      <hf-audio-group id="${grupo}"></hf-audio-group>`);
  // cada grupo tem uma ou mais lanes; um clipe vai pra primeira lane livre no tempo dele
  const lanes = [].concat(faixa.track);
  const ocupado = Object.fromEntries(lanes.map((l) => [l, []]));
  for (const c of faixa.cues) {
    const arquivo = path.join(RAIZ, c.src);
    if (!fs.existsSync(arquivo)) { console.warn(`pulando ${c.id}: falta ${c.src}`); continue; }
    const ms = c.mediaStart || 0;
    const d = r3(c.duration ?? Math.min(dur(arquivo) - ms, cfg.duracao - c.start));
    const lane = lanes.find((l) => ocupado[l].every(([a, b]) => c.start >= b || c.start + d <= a)) ?? lanes[lanes.length - 1];
    ocupado[lane].push([c.start, c.start + d]);
    const cue = { ...c, grupo, track: lane, d, ms };
    todas.push(cue);
    const attrs = [
      `id="${c.id}"`, `class="clip"`, `src="${c.src}"`,
      `data-start="${r3(c.start)}"`, `data-duration="${d}"`,
      ms ? `data-media-start="${r3(ms)}"` : "",
      `data-volume="${c.volume ?? 1}"`,
      c.fadeIn ? `data-fade-in="${c.fadeIn}"` : "",
      c.fadeOut ? `data-fade-out="${c.fadeOut}"` : "",
      c.automation ? `data-automation="${JSON.stringify({ version: 1, lanes: [{ target: "volume", points: c.automation }] }).replace(/"/g, "&quot;")}"` : "",
      `data-track-index="${lane}"`, `data-audio-group="${grupo}"`,
    ].filter(Boolean);
    linhas.push(`      <audio ${attrs.join(" ")}></audio>${c.nota ? ` <!-- ${c.nota} -->` : ""}`);
  }
}
const idx = path.join(RAIZ, "index.html");
let html = fs.readFileSync(idx, "utf8");
const bloco = `<!-- AUDIO -->\n${linhas.join("\n")}\n      <!-- /AUDIO -->`;
html = /<!-- AUDIO -->[\s\S]*?<!-- \/AUDIO -->/.test(html)
  ? html.replace(/<!-- AUDIO -->[\s\S]*?<!-- \/AUDIO -->/, bloco)
  : html.replace("<!-- AUDIO -->", bloco);
fs.writeFileSync(idx, html);
console.log(`index.html: ${todas.length} clipes de áudio em ${Object.keys(cfg.faixas).length} faixas`);

// 3. stems
if (process.argv.includes("--sem-stems")) process.exit(0);
const pasta = path.join(RAIZ, "audio/stems");
fs.mkdirSync(pasta, { recursive: true });
const volumeExpr = (c) => {
  if (!c.automation) return `volume=${c.volume ?? 1}`;
  const p = c.automation; let e = `${p[p.length - 1].v}`;
  for (let i = p.length - 2; i >= 0; i--) {
    const a = p[i], b = p[i + 1];
    const seg = b.t > a.t ? `${a.v}+(${b.v}-${a.v})*(t-${a.t})/${b.t - a.t}` : `${b.v}`;
    e = `if(lt(t,${b.t}),${seg},${e})`;
  }
  return `volume='(${c.volume ?? 1})*(${e})':eval=frame`;
};
const stems = [];
for (const grupo of Object.keys(cfg.faixas)) {
  const cues = todas.filter((c) => c.grupo === grupo);
  const args = [];
  const filtros = [];
  cues.forEach((c, i) => {
    args.push("-i", path.join(RAIZ, c.src));
    const f = [`atrim=start=${c.ms}:duration=${c.d}`, "asetpts=PTS-STARTPTS", "aresample=48000", "aformat=channel_layouts=stereo", volumeExpr(c)];
    if (c.fadeIn) f.push(`afade=t=in:d=${c.fadeIn}`);
    if (c.fadeOut) f.push(`afade=t=out:st=${Math.max(0, c.d - c.fadeOut)}:d=${c.fadeOut}`);
    f.push(`adelay=${Math.round(c.start * 1000)}|${Math.round(c.start * 1000)}`);
    filtros.push(`[${i}:a]${f.join(",")}[a${i}]`);
  });
  filtros.push(`${cues.map((_, i) => `[a${i}]`).join("")}amix=inputs=${cues.length}:normalize=0:dropout_transition=0,apad,atrim=duration=${cfg.duracao}[out]`);
  const saida = path.join(pasta, `${grupo}.wav`);
  ff([...args, "-filter_complex", filtros.join(";"), "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s24le", saida]);
  stems.push(saida);
  console.log(`stem ${grupo}: ${saida}`);
}
const mix = path.join(pasta, "mix-conferencia.wav");
ff([...stems.flatMap((s) => ["-i", s]), "-filter_complex", `amix=inputs=${stems.length}:normalize=0`, "-ar", "48000", "-c:a", "pcm_s24le", mix]);
console.log(`mix: ${mix}`);
