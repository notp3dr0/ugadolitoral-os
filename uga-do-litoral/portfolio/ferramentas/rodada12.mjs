// Rodada 12: o olhar dá a volta inteira, parado ou andando, no desktop e no celular.
// Uso: node rodada12.mjs [camera]
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';

const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const quer = b => process.argv.length < 3 || process.argv.includes(b);
let falhas = 0;
const exigir = (ok, msg) => { if (!ok) throw new Error(msg); };
async function passo(nome, fn) {
  try { const r = await fn(); console.log(`  ok  ${nome}${r ? ' · ' + r : ''}`); }
  catch (e) { falhas++; console.log(`  XX  ${nome} · ${e.message}`); }
}
async function entrar(contexto = { viewport: { width: 1440, height: 900 } }, query = 'semente=3&encontros=nenhum') {
  const page = await (await browser.newContext(contexto)).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/bastidor.html?${query}`);
  await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
  await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 8000 });
  await page.waitForTimeout(600);
  return { page, erros };
}
const graus = page => page.evaluate(() => window.__bastidor.world.controls.state.yaw * 180 / Math.PI);
const alvo = page => page.evaluate(() => window.__bastidor.world.controls.state.yawTarget * 180 / Math.PI);

if (quer('camera')) {
  console.log('\n== desktop');
  const { page, erros } = await entrar();
  await passo('cursor parado na borda direita: da a volta inteira (360)', async () => {
    await page.mouse.move(1430, 450); const a0 = await graus(page);
    await page.waitForTimeout(4200); const a1 = await graus(page);
    exigir(Math.abs(a1 - a0) > 360, `girou ${Math.abs(a1 - a0).toFixed(0)} graus`); return `${Math.abs(a1 - a0).toFixed(0)} graus em 4,2 s`;
  });
  await passo('borda em cima de botao do HUD (barra no topo) continua girando', async () => {
    const box = await page.evaluate(() => { const b = [...document.querySelectorAll('.barra button, .barra a')].map(e => e.getBoundingClientRect()).filter(r => r.width).sort((a, b) => b.right - a.right)[0]; return b && { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    exigir(box && box.x > 1440 * .8, `sem botao na borda: ${JSON.stringify(box)}`);
    await page.mouse.move(box.x, box.y); const a0 = await graus(page);
    await page.waitForTimeout(1500); const a1 = await graus(page);
    exigir(Math.abs(a1 - a0) > 90, `girou so ${Math.abs(a1 - a0).toFixed(0)} graus`); return `${Math.abs(a1 - a0).toFixed(0)} graus`;
  });
  await passo('borda com a mira travada numa foto perto: girar vence', async () => {
    await page.mouse.move(720, 450); await page.waitForTimeout(300);
    const a0 = await graus(page);
    for (let k = 0; k < 20; k++) { await page.evaluate(() => { window.__bastidor.world.controls.state.mirando = true; }); await page.mouse.move(1420 + (k % 2), 450); await page.waitForTimeout(70); }
    const a1 = await graus(page);
    exigir(Math.abs(a1 - a0) > 90, `girou so ${Math.abs(a1 - a0).toFixed(0)} graus`); return `${Math.abs(a1 - a0).toFixed(0)} graus`;
  });
  await passo('seta segurada gira sem parar (2 s > 180)', async () => {
    await page.mouse.move(720, 450); await page.waitForTimeout(400); const a0 = await graus(page);
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(2000); await page.keyboard.up('ArrowRight'); await page.waitForTimeout(400);
    const a1 = await graus(page); exigir(Math.abs(a1 - a0) > 180, `girou ${Math.abs(a1 - a0).toFixed(0)}`); return `${Math.abs(a1 - a0).toFixed(0)} graus`;
  });
  await passo('andando (W) e girando pela borda ao mesmo tempo: 360', async () => {
    const a0 = await graus(page); await page.mouse.move(5, 450); await page.keyboard.down('w');
    await page.waitForTimeout(4200); await page.keyboard.up('w');
    const a1 = await graus(page); exigir(Math.abs(a1 - a0) > 360, `girou ${Math.abs(a1 - a0).toFixed(0)}`); return `${Math.abs(a1 - a0).toFixed(0)} graus`;
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await page.context().close();

  console.log('\n== celular');
  const cel = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const { page: p, erros: e2 } = await entrar(cel);
  const cdp = await p.context().newCDPSession(p);
  async function arrastar(x0, y0, x1, y1, passos = 12) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let k = 1; k <= passos; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * k / passos, y: y0 + (y1 - y0) * k / passos }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await passo('tres arrastos pro lado: passa de 360', async () => {
    const a0 = await alvo(p);
    for (let k = 0; k < 3; k++) { await arrastar(360, 500, 30, 500); await p.waitForTimeout(150); }
    const a1 = await alvo(p); exigir(Math.abs(a1 - a0) > 360, `girou ${Math.abs(a1 - a0).toFixed(0)}`); return `${Math.abs(a1 - a0).toFixed(0)} graus`;
  });
  await passo('virou 90 e parou: o olhar fica onde deixou (3 s depois)', async () => {
    await arrastar(200, 500, 200 - 390 * 90 / 160, 500); await p.waitForTimeout(500);
    const a0 = await graus(p); await p.waitForTimeout(3000); const a1 = await graus(p);
    exigir(Math.abs(a1 - a0) < 4, `voltou ${Math.abs(a1 - a0).toFixed(1)} graus`); return `mexeu ${Math.abs(a1 - a0).toFixed(1)} graus`;
  });
  await passo('andando de lado (arrasto pra cima depois de virar 90): o olhar nao volta pro eixo', async () => {
    const a0 = await graus(p);
    await arrastar(200, 700, 200, 300); await p.waitForTimeout(3000);
    const a1 = await graus(p); exigir(Math.abs(a1 - a0) < 6, `voltou ${Math.abs(a1 - a0).toFixed(1)} graus`); return `mexeu ${Math.abs(a1 - a0).toFixed(1)} graus`;
  });
  await passo('nenhum erro no console', async () => exigir(!e2.length, e2[0]));
  await p.context().close();
}
await browser.close(); srv.close?.();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
