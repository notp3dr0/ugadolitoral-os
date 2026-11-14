// Captura determinística (rota A do artigo): abre o index.html, chama seek(t)
// quadro a quadro e manda cada quadro pro ffmpeg.
// node render.mjs --fmt h --out out/filme-16x9.mp4 [--de 0 --ate 10] [--fps 30]
// node render.mjs --stills 1.2,5,8.4 --outdir out/stills [--fmt h]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const fmt = arg("fmt", "h"), fps = Number(arg("fps", 30));
const [W, H] = fmt === "v" ? [1080, 1920] : [1920, 1080];
const url = pathToFileURL(resolve("index.html")).href + "?fmt=" + fmt + (arg("teste") ? "&teste=1" : "");

const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on("pageerror", (e) => console.error("ERRO NA PÁGINA:", e.message));
await page.goto(url);
await page.waitForFunction(() => window.PRONTO === true, null, { timeout: 30000 });
const total = await page.evaluate(() => window.DURACAO);
writeFileSync("out/cues.json", JSON.stringify(await page.evaluate(() => window.CUES), null, 1));
writeFileSync("out/planos.json", JSON.stringify(await page.evaluate(() => TL.planos.map((p) => ({ q: p.q, ini: p.ini, dur: p.dur }))), null, 1));

const quadro = async (t) => {
  const b64 = await page.evaluate((t) => { seek(t); return document.getElementById("c").toDataURL("image/jpeg", 0.93).slice(23); }, t);
  return Buffer.from(b64, "base64");
};

const meio = arg("meio");
if (arg("so-dados")) { console.log("dados ok", total.toFixed(2)); await browser.close(); process.exit(0); }
if (meio) {
  // um still por plano (fração `meio` da duração), nomeado pelos quadros
  const dir = arg("outdir", "out/planos"); mkdirSync(dir, { recursive: true });
  const filtro = arg("so");
  const lista = await page.evaluate((k) => TL.planos.map((p) => ({ q: p.q, t: p.ini + p.dur * k })), Number(meio));
  for (const { q, t } of lista) { if (filtro && !filtro.split(",").some((f) => q.startsWith(f))) continue; writeFileSync(`${dir}/${q}.jpg`, await quadro(t)); }
  console.log("planos:", lista.length, "total", total.toFixed(1) + "s");
}
const stills = arg("stills");
if (stills) {
  const dir = arg("outdir", "out/stills"); mkdirSync(dir, { recursive: true });
  for (const s of stills.split(",")) { writeFileSync(`${dir}/t${Number(s).toFixed(2)}.jpg`, await quadro(Number(s))); }
  console.log("stills:", stills);
} else if (!meio) {
  const de = Number(arg("de", 0)), ate = Math.min(Number(arg("ate", total)), total);
  const out = arg("out", `out/filme-${fmt}.mp4`); mkdirSync(dirname(out), { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round((ate - de) * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await quadro(de + i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) console.log(`quadro ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log("ok:", out, `${n} quadros, ${total.toFixed(2)}s de filme`);
}
await browser.close();
