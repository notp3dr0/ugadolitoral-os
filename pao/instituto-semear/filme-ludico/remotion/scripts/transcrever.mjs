// Tempo de cada palavra das falas (Whisper do Remotion, na GPU). Saída: src/dados/legendas.json
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { canUseWhisperWebGpu, downloadWhisperModel, loadWhisperModel, transcribe, toCaptions } from "@remotion/whisper-webgpu";
const sup = await canUseWhisperWebGpu(); console.log("gpu:", JSON.stringify(sup).slice(0, 200));
const model = "small";
await downloadWhisperModel({ model });
const handle = await loadWhisperModel({ model });
const out = {};
for (let i = 1; i <= 9; i++) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", `public/voz/final/n${i}.wav`, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
  const channelWaveform = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  const t = await transcribe({ channelWaveform, model, language: "portuguese" });
  const { captions } = toCaptions({ whisperWebGpuOutput: t });
  out["n" + i] = captions.map(c => ({ texto: c.text.trim(), ini: c.startMs, fim: c.endMs }));
  console.log("n" + i, out["n" + i].map(c => c.texto + "@" + c.ini).join(" "));
}
mkdirSync("src/dados", { recursive: true });
writeFileSync("src/dados/legendas.json", JSON.stringify(out, null, 1));
await handle[Symbol.asyncDispose]?.();
