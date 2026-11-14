// Narração com a voz do Gemini (API do Google, plano grátis: ~3 pedidos/min).
// A chave vem de ~/.hyperframes/gemini.env (GEMINI_API_KEY) e nunca é impressa.
// Uso (na raiz do projeto):
//   node scripts/voiceover_gemini.mjs                       # todas as falas de scripts/narration.json
//   node scripts/voiceover_gemini.mjs --voice Charon s3 s5  # só essas, com outra voz
//   node scripts/voiceover_gemini.mjs --out public/audio/amostras --voice Puck s1
// Saída: <out>/<fala>.src.wav (PCM 24 kHz). Depois: python scripts/align_words.py e python scripts/prepare_vo.py
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  if (i === -1) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const voice = opt("--voice", "Charon");
const out = opt("--out", "public/audio/vo");
// Cada modelo tem a própria cota grátis: no 429, passa para o próximo (mesma voz pré-definida).
const MODELS = (opt("--models", process.env.TTS_MODELS ?? "gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts,gemini-2.5-pro-preview-tts")).split(",");
let m = 0;

// Este modelo lê em voz alta qualquer instrução de estilo junto do texto (testado em 2026-11-03, igual no
// filme do Semear). Por isso o padrão é só o texto; o tom vem da voz escolhida e da pontuação.
const STYLE = opt("--style", "");
const only = new Set(args);

const key = readFileSync(process.env.USERPROFILE + "/.hyperframes/gemini.env", "utf8").match(/GEMINI_API_KEY=(\S+)/)?.[1];
if (!key) throw new Error("GEMINI_API_KEY não encontrada em ~/.hyperframes/gemini.env");
const lines = JSON.parse(readFileSync("scripts/narration.json", "utf8").replace(/^﻿/, ""));
mkdirSync(out, { recursive: true });

const wav = (pcm, rate) => {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [id, text] of Object.entries(lines)) {
  if (only.size && !only.has(id)) continue;
  const file = `${out}/${id}.src.wav`;
  let done = false;
  for (let attempt = 0; attempt < 30 && !done; attempt++) {
    const model = MODELS[m % MODELS.length];
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: STYLE ? `${STYLE}: "${text}"` : text }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      }),
    });
    if (r.status === 429 || r.status >= 500 || r.status === 404) {
      m++;
      const lap = m % MODELS.length === 0;
      console.log(`${id}: ${model} respondeu ${r.status}; vou para ${MODELS[m % MODELS.length]}${lap ? " (volta completa, espero 20 s)" : ""}`);
      await wait(lap ? 20000 : 1500);
      continue;
    }
    const j = await r.json();
    const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part) {
      console.log(`ERRO ${id} ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
      process.exitCode = 1;
      break;
    }
    const rate = +(part.inlineData.mimeType.match(/rate=(\d+)/)?.[1] ?? 24000);
    const pcm = Buffer.from(part.inlineData.data, "base64");
    writeFileSync(file, wav(pcm, rate));
    console.log(`ok ${file} ${(pcm.length / 2 / rate).toFixed(2)}s (${voice}, ${model})`);
    const logFile = "scripts/out/vo-models.json";
    const log = existsSync(logFile) ? JSON.parse(readFileSync(logFile, "utf8")) : {};
    log[id] = { model, voice };
    mkdirSync("scripts/out", { recursive: true });
    writeFileSync(logFile, JSON.stringify(log, null, 2));
    done = true;
  }
  if (!done && !existsSync(file)) process.exitCode = 1;
}
