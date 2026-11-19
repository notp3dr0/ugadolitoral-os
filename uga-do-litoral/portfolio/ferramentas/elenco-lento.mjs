// Rodada 17: internet lenta. Os arquivos do elenco atrasam 8 s; o encontro do segurança acontece antes.
// Tem que aparecer o recorte e, quando o elenco chega, virar o personagem 3D no mesmo lugar (sem erro).
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
await page.route('**/bastidor/elenco/*.glb', async r => { await new Promise(ok => setTimeout(ok, 8000)); await r.continue(); });
await page.goto(`${srv.url}/bastidor.html?semente=3&encontros=seguranca`);
await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 8000 });
const g = await page.evaluate(() => window.__bastidor.world.encounters.estado().find(e => e.id === 'seguranca').gatilho);
await page.evaluate(s => { const st = window.__bastidor.world.controls.state; st.s = s - .3; }, g);
await page.keyboard.down('w'); await page.waitForTimeout(900); await page.keyboard.up('w');
const tipo = () => page.evaluate(() => window.__bastidor.world.encounters.group.children.filter(o => o.name.startsWith('pessoa')).map(o => o.userData.elenco ? '3d' : 'recorte').join(','));
const antes = await tipo();
await page.waitForTimeout(10000);
const depois = await tipo();
await page.screenshot({ path: 'saida/elenco-lento.png' });
console.log('antes do elenco:', antes || '(ninguém)', '| depois:', depois || '(ninguém)', erros.length ? '| ERROS ' + erros.join(' | ') : '| sem erros');
const ok = depois && !depois.includes('recorte') && !erros.length;
console.log(ok ? 'tudo certo' : 'FALHA');
await browser.close(); srv.close?.(); process.exit(ok ? 0 : 1);
