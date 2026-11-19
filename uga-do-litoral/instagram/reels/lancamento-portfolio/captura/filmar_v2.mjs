// Filma planos do bastidor por dentro do motor, quadro a quadro.
// Uso: node filmar.mjs <ID> [<ID> ...] [--de N] [--ate M] [--saida pasta] [--sem-pronto]
//   IDs: A1_planta B1_travessia C7_porta C2a C2b C2c C2d C2e_mergulho C5a_seguranca C5b_projecao
//        C5c_camarim C5d_artista C5e_setlist B2_credencial B3_vulto  (ou "todos")
// Saída: ../quadros/<ID>/<passe>/000000.jpg (prof em .png) e ../quadros/<ID>/pronto.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FERR = path.resolve(AQUI, '../../../../portfolio/ferramentas');
const SITE = path.resolve(AQUI, '../../../../portfolio/site-lab');
const { chromium } = await import(pathToFileURL(path.join(FERR, 'node_modules/playwright-core/index.mjs')).href);
const { servir } = await import(pathToFileURL(path.join(FERR, 'servidor.mjs')).href);

const ORDEM = ['A1_planta', 'B1_travessia', 'C7_porta', 'C2a', 'C2b', 'C2c', 'C2d', 'C2e_mergulho', 'C5a_seguranca', 'C5b_projecao', 'C5c_camarim', 'C5d_artista', 'C5e_setlist', 'B2_credencial', 'B3_vulto'];
const ENCONTROS = { C5a_seguranca: 'seguranca,agua,artista', C5d_artista: 'seguranca,agua,artista', B3_vulto: 'seguranca,agua,artista', C5c_camarim: 'seguranca,agua,artista' };

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const js = opt('--js', null);
const de = Number(opt('--de', 0)), ate = opt('--ate', null), saidaBase = path.resolve(AQUI, opt('--saida', '../quadros'));
const semPronto = args.includes('--sem-pronto'); if (semPronto) args.splice(args.indexOf('--sem-pronto'), 1);
const ids = args.includes('todos') ? ORDEM : args;
if (!ids.length) { console.log('uso: node filmar.mjs <ID ...|todos> [--de N] [--ate M] [--saida pasta]'); process.exit(1); }

const srv = await servir(SITE);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-accelerated-video-decode'] });
const relogio = fs.readFileSync(path.join(AQUI, 'relogio.js'), 'utf8');

async function abrir(params) {
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await ctx.addInitScript({ content: relogio });
  await ctx.route('**/__captura/**', (route) => {
    const nome = new URL(route.request().url()).pathname.replace('/__captura/', '');
    route.fulfill({ path: path.join(AQUI, nome), contentType: 'text/javascript; charset=utf-8' });
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  [erro na pagina]', String(e).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') console.log('  [console]', m.text().slice(0, 200)); });
  await page.goto(`${srv.url}/bastidor.html?${params}`);
  return { ctx, page };
}
async function esperarBastidor(page) {
  for (let k = 0; k < 900; k++) {
    const ok = await page.evaluate(() => { window.__relogio.avancar(33); return Boolean(window.__bastidor?.world && window.bastidorPronto); });
    if (ok) return;
    await page.waitForTimeout(15);
  }
  throw new Error('bastidor nao ficou pronto');
}
const salvar = (arq, dataUrl) => fs.writeFileSync(arq, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
const nomeQ = (n, ext) => String(n).padStart(6, '0') + '.' + ext;

async function filmar(id) {
  const t0 = Date.now();
  const dir = path.join(saidaBase, id);
  if (id === 'B2_credencial') return filmarCredencial(dir, t0);
  const { ctx, page } = await abrir(`semente=fixa&s=0&encontros=${ENCONTROS[id] || 'nenhum'}`);
  await esperarBastidor(page);
  await page.addScriptTag({ type: 'module', url: '/__captura/pagina.js' });
  await page.waitForFunction(() => window.__cap, null, { timeout: 30000 });
  const prep = await page.evaluate(id => window.__cap.preparar(id), id);
  if (js) await page.evaluate(js);
  const fim = Math.min(prep.quadros, ate === null ? prep.quadros : Number(ate));
  for (const p of prep.passes) fs.mkdirSync(path.join(dir, p), { recursive: true });
  const conf = await page.evaluate(() => window.__cap.conferir());
  if (conf.brancas.length) console.log(`  AVISO: copias sem foto: ${conf.brancas.join(',')}`);
  for (let n = de; n < fim; n++) {
    const out = await page.evaluate(n => window.__cap.quadro(n), n);
    for (const [passe, url] of Object.entries(out)) salvar(path.join(dir, passe, nomeQ(n, passe === 'prof' ? 'png' : 'jpg')), url);
    if (n % 20 === 0) process.stdout.write(`  ${id} ${n}/${fim}\r`);
  }
  const info = prep.info || {};
  if (!semPronto && de === 0 && fim === prep.quadros) writePronto(dir, prep.quadros, prep.passes, info);
  await ctx.close();
  console.log(`${id}: ${fim - de} quadros, ${prep.passes.join('+')}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
function writePronto(dir, quadros, passes, info) {
  const obs = info.obs || '';
  const pronto = { quadros, passes, fps: 30, largura: 1080, altura: 1920,
    prof: 'PNG 16 bits em RG: distancia da camera em metros = (R*256+G)/65535*30; 65535 = nada (fundo). B=0',
    fio: 'tons de cinza, branco sobre preto (tingir depois)', ...info, obs };
  fs.writeFileSync(path.join(dir, 'pronto.json'), JSON.stringify(pronto, null, 2));
}

// ---------------------------------------------------------------- B2: a credencial (HTML da página)
async function filmarCredencial(dir, t0) {
  const QUADROS = 32;
  const { ctx, page } = await abrir('semente=fixa&encontros=nenhum');
  await page.waitForFunction(() => document.querySelector('.cracha-giro'), null, { timeout: 15000 });
  // só a credencial, grande, no escuro da entrada
  await page.addStyleTag({ content: `
    .entrada > :not(.cracha) { visibility: hidden !important; }
    .entrada { background: #050505 !important; }
    .cracha { --cw: 320px !important; --cordao: 220px !important; top: 60px !important; }
    #palco3d { visibility: hidden !important; }` });
  for (let k = 0; k < 40; k++) { await page.evaluate(() => window.__relogio.avancar(33)); await page.waitForTimeout(10); }
  await page.evaluate(() => Promise.all([...document.querySelectorAll('img')].map(i => i.decode?.().catch(() => {}))));
  // empurrão: puxa a credencial pro lado (o giro completa uma volta e assenta de frente) e solta
  const b = await page.locator('.cracha-giro').boundingBox();
  const x0 = b.x + b.width * .15, y0 = b.y + b.height * .55;
  await page.mouse.move(x0, y0); await page.mouse.down();
  await page.evaluate(() => window.__relogio.avancar(16));
  const passos = 26, dx = 400;
  for (let k = 1; k <= passos; k++) { await page.mouse.move(x0 + dx * k / passos, y0); await page.evaluate(() => window.__relogio.avancar(16)); }
  await page.evaluate(() => window.__relogio.avancar(120));
  await page.mouse.move(x0 + dx + .4, y0); await page.evaluate(() => window.__relogio.avancar(120));
  await page.mouse.up();
  fs.mkdirSync(path.join(dir, 'cor'), { recursive: true });
  const PRE = 24; // o tranco da soltura assenta antes do quadro 0; o mouse já embala
  for (let n = -PRE; n < QUADROS; n++) {
    // o mouse passeia de um lado pro outro no ritmo do pêndulo (~1 s): a credencial inclina pro cursor e o balanço não morre
    await page.mouse.move(270 + 190 * Math.sin(2 * Math.PI * (n + 8) / 30), 900);
    await page.evaluate(() => window.__relogio.avancar(1000 / 30));
    if (n < 0) continue;
    const buf = await page.screenshot({ type: 'jpeg', quality: 95, animations: 'allow', caret: 'initial' });
    fs.writeFileSync(path.join(dir, 'cor', nomeQ(n, 'jpg')), buf);
  }
  writePronto(dir, QUADROS, ['cor'], { obs: 'credencial HTML da propria pagina (badge.js), fisica no relogio virtual; puxada e solta antes do quadro 0, balanca e assenta de frente' });
  await ctx.close();
  console.log(`B2_credencial: ${QUADROS} quadros, cor, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

try { for (const id of ids) await filmar(id); }
finally { await browser.close(); await srv.fechar(); }
