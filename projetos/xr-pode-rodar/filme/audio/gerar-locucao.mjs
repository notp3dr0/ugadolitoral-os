// Gera a locução do "Pode rodar?" no VoiceStudio local (http://127.0.0.1:3900).
// Uso: node audio/gerar-locucao.mjs [id ...]   (sem id, gera todas)
// A primeira fala (L04, a mais longa) sai da voz desenhada; as outras clonam a voz dela,
// pra manter o mesmo locutor no filme inteiro.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const API = "http://127.0.0.1:3900/generate";
const DIR = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "locucao");
const VOZ = { instruct: "male, middle-aged, low pitch", seed: "42", language: "pt", speed: "0.95" };

// texto na tela / texto falado (XR = "Xis Erre", TV = "tevê")
export const FALAS = [
  { id: "L04", q: "Q04", texto: "Com a Xis Erre Brasil, a equipe encontra as versões da campanha na mesma biblioteca de anúncios." },
  { id: "L02", q: "Q02", texto: "O filme ficou pronto." },
  { id: "L03a", q: "Q03", texto: "Tem o corte de quinze pro streaming?" },
  { id: "L03b", q: "Q03", texto: "E qual é o arquivo que vai pra tevê com legenda?" },
  { id: "L05", q: "Q05", texto: "A Xis Erre confere se o formato e o áudio atendem ao veículo." },
  { id: "L06", q: "Q06", texto: "Quando a campanha pede, a Xis Erre também prepara o closed caption." },
  { id: "L07", q: "Q07", texto: "Cada versão segue pro destino certo." },
  { id: "L09", q: "Q09", texto: "E você acompanha o status de cada entrega." },
  { id: "L10", q: "Q10", texto: "Xis Erre Extreme Reach Brasil. Do arquivo à tela." },
];

// curl em vez de fetch: a primeira geração depois de abrir o app pode passar de 5 min (o limite do fetch)
function gera(fala, referencia) {
  const arquivo = path.join(DIR, `${fala.id}.wav`);
  const temp = arquivo + ".parcial";
  const args = ["-s", "-m", "1200", "-o", temp, "-w", "%{http_code}", "-X", "POST", API,
    "-F", `text=${fala.texto}`, "-F", `language=${VOZ.language}`, "-F", `speed=${VOZ.speed}`,
    "-F", `seed=${VOZ.seed}`, "-F", "effect_preset=raw"];
  if (referencia) args.push("-F", `ref_audio=@${referencia.arquivo};type=audio/wav`, "-F", `ref_text=${referencia.texto}`);
  else args.push("-F", `instruct=${VOZ.instruct}`);
  const status = execFileSync("curl", args).toString().trim();
  if (status !== "200") throw new Error(`${fala.id}: HTTP ${status} ${fs.existsSync(temp) ? fs.readFileSync(temp, "utf8").slice(0, 300) : ""}`);
  fs.renameSync(temp, arquivo);
  console.log(`${fala.id}  ${arquivo}`);
  return arquivo;
}

fs.mkdirSync(DIR, { recursive: true });
const pedidas = process.argv.slice(2);
const ref = { arquivo: path.join(DIR, "L04.wav"), texto: FALAS[0].texto };
for (const fala of FALAS) {
  if (pedidas.length && !pedidas.includes(fala.id)) continue;
  if (fala.id === "L04") await gera(fala, null);
  else await gera(fala, ref);
}
