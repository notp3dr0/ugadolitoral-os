// Rodada 13: o mesmo ponto do corredor com e sem a luz do Blender (?luz=blender). Prints em saida/luz/.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
mkdirSync('saida/luz', { recursive: true });
const PONTOS = [['entrada', 3, 0], ['lance2', 26, 0], ['parede', 30, 70], ['porta', -6, 0]];
let falhas = 0;
const GANHOS = process.argv.slice(2).filter(a => !isNaN(a));
const MODOS = GANHOS.length ? GANHOS.map(g => ['blender' + g, '&luz=blender&ganho=' + g]) : [['hoje', ''], ['blender', '&luz=blender']];
for (const [modo, q] of MODOS) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/bastidor.html?semente=3&encontros=nenhum${q}`);
  await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
  await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 8000 });
  await page.waitForTimeout(1500);
  if (modo.startsWith('blender')) {
    const r = await page.evaluate(() => window.__bastidor.world.luz);
    console.log('luz:', JSON.stringify(r)); if (!r?.ligou) falhas++;
  }
  for (const [nome, s, olhar] of PONTOS) {
    await page.evaluate(({ s, olhar }) => { const w = window.__bastidor.world, st = w.controls.state; st.s = s < 0 ? w.plan.rail.total + s : s; st.v = 0; w.controls.setYaw(olhar * Math.PI / 180); st.lastLook = Infinity; }, { s, olhar });
    await page.mouse.move(720, 450); await page.waitForTimeout(1600);
    await page.screenshot({ path: `saida/luz/${nome}-${modo}.png` });
  }
  if (erros.length) { falhas++; console.log(modo, 'ERROS', erros.join(' | ')); }
  await page.context().close();
}
await browser.close(); srv.close?.();
console.log(falhas ? `${falhas} falha(s)` : 'tudo certo');
process.exit(falhas ? 1 : 0);
