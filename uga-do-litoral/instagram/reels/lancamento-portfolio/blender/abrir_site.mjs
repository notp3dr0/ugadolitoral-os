// Abre o bastidor do site no Chrome sem tela, do mesmo jeito que ../captura/filmar.mjs (relógio virtual,
// semente fixa), e carrega o arreio (../captura/pagina.js). Usado por exportar.mjs e exportar_camera.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CAPTURA = path.resolve(AQUI, '../captura');
const FERR = path.resolve(AQUI, '../../../../portfolio/ferramentas');
export const SITE = path.resolve(AQUI, '../../../../portfolio/site-lab');
const { chromium } = await import(pathToFileURL(path.join(FERR, 'node_modules/playwright-core/index.mjs')).href);
const { servir } = await import(pathToFileURL(path.join(FERR, 'servidor.mjs')).href);

export async function abrirSite() {
  const srv = await servir(SITE);
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await ctx.addInitScript({ content: fs.readFileSync(path.join(CAPTURA, 'relogio.js'), 'utf8') });
  await ctx.route('**/__captura/**', route => {
    const nome = new URL(route.request().url()).pathname.replace('/__captura/', '');
    route.fulfill({ path: path.join(CAPTURA, nome), contentType: 'text/javascript; charset=utf-8' });
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  [erro na pagina]', String(e).split('\n')[0]));
  await page.goto(`${srv.url}/bastidor.html?semente=fixa&s=0&encontros=nenhum`);
  for (let k = 0; k < 900; k++) {
    const ok = await page.evaluate(() => { window.__relogio.avancar(33); return Boolean(window.__bastidor?.world && window.bastidorPronto); });
    if (ok) break;
    if (k === 899) throw new Error('bastidor nao ficou pronto');
    await page.waitForTimeout(15);
  }
  await page.addScriptTag({ type: 'module', url: '/__captura/pagina.js' });
  await page.waitForFunction(() => window.__cap, null, { timeout: 30000 });
  return { page, async fechar() { await browser.close(); await srv.fechar(); } };
}
