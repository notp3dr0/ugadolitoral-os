// Grava uma cena quadro a quadro.
//   node cenas/gravar.mjs G3_agenda            grava tudo em quadros/G3_agenda/cor/ e escreve pronto.json
//   node cenas/gravar.mjs G3_agenda 0,14,41    grava só esses quadros (pra olhar), sem pronto.json
//   node cenas/gravar.mjs G3_agenda --teste    determinismo: grava o quadro do meio em sequência e direto, compara
// Chrome da máquina com GPU (como portfolio/ferramentas/bastidor.mjs), viewport 540 × 960 a 2x = 1080 × 1920.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.resolve(AQUI, '..');
const RAIZ = path.resolve(PROJ, '../../..'); // uga-do-litoral: enxerga a cena e o site-lab
const FERR = path.join(RAIZ, 'portfolio/ferramentas');
const { chromium } = await import(pathToFileURL(path.join(FERR, 'node_modules/playwright-core/index.mjs')).href);
const { servir } = await import(pathToFileURL(path.join(FERR, 'servidor.mjs')).href);

const id = process.argv[2];
if (!id || !fs.existsSync(path.join(AQUI, `${id}.html`))) { console.log('uso: node cenas/gravar.mjs <G1_nome|G2_acervo|G3_agenda> [q,q,q | --teste]'); process.exit(1); }
const H_ = process.argv.includes('--h'); // formato horizontal: 1920 x 1080, saída em quadros/<ID>_h/
const argv = process.argv.filter(a => a !== '--h');
const arg = argv[3] || '';
const teste = arg === '--teste';
const lista = arg && !teste ? arg.split(',').map(Number) : null;

const srv = await servir(RAIZ);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
const ctx = await browser.newContext({ viewport: H_ ? { width: 960, height: 540 } : { width: 540, height: 960 }, deviceScaleFactor: 2 });
const url = `${srv.url}/${path.relative(RAIZ, AQUI).split(path.sep).join('/')}/${id}.html${H_ ? '?fmt=h' : ''}`;

async function abrir() {
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(url);
  try { await page.waitForFunction(() => window.pronto === true, null, { timeout: 60000 }); }
  catch { throw new Error('a cena nao ficou pronta: ' + erros.join(' | ')); }
  if (erros.length) console.log('avisos da pagina:', erros.join(' | '));
  return page;
}
async function quadro(page, n, tipo) {
  await page.evaluate(async n => { await window.desenhar(n); }, n);
  // o compositor às vezes entrega o quadro anterior: fotografa até duas capturas seguidas baterem
  const foto = async () => {
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    return page.screenshot({ type: 'png', omitBackground: tipo === 'png' });
  };
  let a = await foto(), b = await foto();
  for (let k = 0; k < 4 && !a.equals(b); k++) { a = b; b = await foto(); }
  if (tipo === 'png') return b;
  return page.screenshot({ type: 'jpeg', quality: 95 });
}

const page = await abrir();
const cena = await page.evaluate(() => window.CENA);
const ext = cena.formato === 'png' ? 'png' : 'jpg';
const ID_SAIDA = id + (H_ ? '_h' : '');
const pasta = path.join(PROJ, 'quadros', ID_SAIDA, 'cor');

if (teste) {
  const alvo = Math.floor(cena.quadros * .6);
  for (let n = 0; n < alvo; n++) await page.evaluate(async n => { await window.desenhar(n); }, n);
  const a = await quadro(page, alvo, 'png');
  const p2 = await abrir();
  const b = await quadro(p2, alvo, 'png');
  const c = await quadro(p2, 3, 'png'), d = await quadro(p2, alvo, 'png'); // ida e volta
  console.log(`quadro ${alvo}: sequencia x direto ${a.equals(b) ? 'IGUAL' : 'DIFERENTE'} · volta ${b.equals(d) ? 'IGUAL' : 'DIFERENTE'}`);
} else {
  fs.mkdirSync(pasta, { recursive: true });
  const ns = lista || Array.from({ length: cena.quadros }, (_, i) => i);
  const t0 = Date.now();
  for (const n of ns) {
    fs.writeFileSync(path.join(pasta, `${String(n).padStart(6, '0')}.${ext}`), await quadro(page, n, ext));
    if (n % 10 === 0) process.stdout.write(`${n} `);
  }
  console.log(`\n${ns.length} quadros em ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${pasta}`);
  if (!lista) {
    fs.writeFileSync(path.join(PROJ, 'quadros', ID_SAIDA, 'pronto.json'), JSON.stringify({
      quadros: cena.quadros, passes: ['cor'], formato: `${ext}, ${H_ ? '1920x1080' : '1080x1920'}${ext === 'png' ? ', com transparencia' : ', opaco'}`,
      marcos_locais: cena.marcos, obs: cena.obs || ''
    }, null, 1));
  }
}
await browser.close();
await srv.fechar();
