// Prepara as falas de uma pasta (ex.: public/voz/sulafat) pro vídeo:
// corta silêncio, acelera cada fala só o necessário pra caber no tempo da cena (máx. 1,25x), transcreve e
// grava src/dados/tempos.json ({ n1: { dur, palavras: [ms...] } }), lido pelo roteiro.
// Uso: node scripts/processar.mjs public/voz/sulafat
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { canUseWhisperWebGpu, downloadWhisperModel, loadWhisperModel, transcribe, toCaptions } from "@remotion/whisper-webgpu";

const pasta = process.argv[2];
const saida = "public/voz/final";
mkdirSync(saida, { recursive: true });
const VAGA = { n1: 2.5, n2: 2.35, n3: 4.4, n4: 2.75, n5: 2.1, n6: 1.8, n7: 2.35, n8: 3.0, n9: 4.3 }; // segundos disponíveis por fala
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString();

const tempos = {};
for (const id of Object.keys(VAGA)) {
  const cru = `${pasta}/${id}.wav`, cortado = `${pasta}/${id}-cortado.wav`;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", cru, "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse", cortado]);
  const d = dur(cortado);
  const tempo = 1.0; // velocidade natural (o vídeo se ajusta à voz)
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", cortado, "-af", `atempo=${tempo.toFixed(3)},highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=80`, "-ar", "48000", `${saida}/${id}.wav`]);
  tempos[id] = { dur: +dur(`${saida}/${id}.wav`).toFixed(2), tempo: +tempo.toFixed(3) };
  console.log(id, d.toFixed(2), "->", tempos[id].dur, "s (x" + tempo.toFixed(2) + ")", tempos[id].dur > VAGA[id] + 0.05 ? "  ⚠ passou da vaga" : "");
}

const sup = await canUseWhisperWebGpu();
if (!sup.supported) throw new Error(JSON.stringify(sup));
await downloadWhisperModel({ model: "small" });
await loadWhisperModel({ model: "small" });
for (const id of Object.keys(VAGA)) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", `${saida}/${id}.wav`, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
  const t = await transcribe({ channelWaveform: new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4), model: "small", language: "portuguese" });
  const { captions } = toCaptions({ whisperWebGpuOutput: t });
  tempos[id].transcrito = captions.map((c) => c.text.trim());
  tempos[id].palavras = captions.map((c) => c.startMs);
  console.log(id, captions.map((c) => `${c.text.trim()}@${c.startMs}`).join(" "));
}
writeFileSync("src/dados/tempos.json", JSON.stringify(tempos, null, 1));
