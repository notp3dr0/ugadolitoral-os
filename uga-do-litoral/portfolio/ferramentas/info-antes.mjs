// Prints da INFO inteira (antes/depois de mexer). Uso: node info-antes.mjs <rotulo>
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';
const rot = process.argv[2] || 'antes';
const srv = await servir('../site-lab');
const b = await chromium.launch({ channel: 'chrome', headless: true });
mkdirSync('saida/info', { recursive: true });
for (const [tela, o] of Object.entries({ desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } })) {
  const p = await (await b.newContext(o)).newPage(); const e = []; p.on('pageerror', x => e.push(String(x))); p.on('console', m => { if (m.type() === 'error') e.push(m.text()); });
  await p.goto(`${srv.url}/?semente=3#info`); await p.waitForTimeout(2500);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
  await p.screenshot({ path: `saida/info/${rot}-${tela}.png`, fullPage: true });
  console.log(tela, h, e);
}
await b.close(); await srv.fechar();
