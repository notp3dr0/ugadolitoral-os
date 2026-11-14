// Gera falas com a voz do Gemini (API do Google, direto). Uso: node scripts/voz.mjs <arquivo.json>
// JSON: { "voz": "Puck", "estilo": "...", "falas": [{ "id": "f1", "texto": "..." }] }
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
const env = readFileSync(process.env.USERPROFILE + "/.hyperframes/gemini.env", "utf8").match(/GEMINI_API_KEY=(\S+)/)[1];
const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = cfg.saida ?? "public/voz"; mkdirSync(out, { recursive: true });
const modelos = [process.env.TTS_MODEL ?? "gemini-3.8-flash-tts"];
function wav(pcm, rate) {
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]);
}
const espera = ms => new Promise(r => setTimeout(r, ms));
for (const f of cfg.falas) {
  const arq = `${out}/${f.id}.wav`; if (existsSync(arq) && !cfg.refazer) { console.log("já existe", arq); continue; }
  for (let tent = 0; tent < 12; tent++) {
    const modelo = modelos[tent % 2 === 0 ? 0 : 0];
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": env, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: cfg.estilo ? `${cfg.estilo}\n\n${f.texto}` : f.texto }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: f.voz ?? cfg.voz } } } } }) });
    const j = await r.json();
    if (r.status === 429 || r.status >= 500) { await espera(20000); continue; }
    const part = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) { console.log("ERRO", f.id, r.status, JSON.stringify(j).slice(0, 300)); break; }
    const rate = +(part.inlineData.mimeType.match(/rate=(\d+)/)?.[1] ?? 24000);
    const pcm = Buffer.from(part.inlineData.data, "base64");
    writeFileSync(arq, wav(pcm, rate)); console.log("ok", arq, (pcm.length / 2 / rate).toFixed(2) + "s"); break;
  }
}
