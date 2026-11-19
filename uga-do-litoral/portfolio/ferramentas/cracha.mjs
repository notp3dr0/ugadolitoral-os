// Rodada 20: o crachá com física de cordão. Prints da queda, do descanso, de uma puxada (pra cima e pro lado)
// e da soltura, no computador e no celular, mais o crachá pequeno depois de entrar. Prints em saida/r20/.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
mkdirSync('saida/r20', { recursive: true });
let falhas = 0;
const TELAS = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
for (const [tela, o] of Object.entries(TELAS)) {
  const p = await (await browser.newContext(o)).newPage();
  const erros = []; p.on('pageerror', e => erros.push(String(e))); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(`${srv.url}/bastidor.html?semente=3&encontros=nenhum`);
  for (const ms of [250, 700, 1400, 3000]) { await p.waitForTimeout(ms === 250 ? 250 : ms === 700 ? 450 : ms === 1400 ? 700 : 1600); await p.screenshot({ path: `saida/r20/${tela}-${ms}.png` }); }
  // puxa o cartão pra cima e pro lado (a fita tem que afrouxar) e solta
  const b = await p.$eval('.cracha-giro', el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .6 }; });
  await p.mouse.move(b.x, b.y); await p.mouse.down();
  for (let k = 1; k <= 12; k++) { await p.mouse.move(b.x + k * 18, b.y - k * 16); await p.waitForTimeout(16); }
  await p.waitForTimeout(200); await p.screenshot({ path: `saida/r20/${tela}-puxado.png` });
  await p.mouse.up(); await p.waitForTimeout(260); await p.screenshot({ path: `saida/r20/${tela}-solto.png` });
  await p.waitForTimeout(1500);
  await p.click('.entrar-mudo'); await p.waitForTimeout(2600); await p.screenshot({ path: `saida/r20/${tela}-dentro.png` });
  if (erros.length) { falhas++; console.log(tela, 'ERROS', erros.join(' | ')); } else console.log(tela, 'sem erros');
  await p.context().close();
}
await browser.close(); srv.close?.();
process.exit(falhas ? 1 : 0);
