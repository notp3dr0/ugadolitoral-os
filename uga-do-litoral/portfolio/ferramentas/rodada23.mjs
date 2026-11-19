// Rodada 23: a INFO com foto (maço de cópias, line-up, serviços com foto, linha do tempo, fecho ME CHAMA) e sem o
// OUVIR O SHOW na home. Prints em saida/r23/. Uso: node rodada23.mjs
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
mkdirSync('saida/r23', { recursive: true });
const TELAS = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
let falhas = 0;
const passo = async (nome, fn) => { try { const r = await fn(); console.log('OK    ', nome, r ? '· ' + r : ''); } catch (e) { falhas++; console.log('FALHA ', nome, '·', String(e.message || e).split('\n')[0]); } };
const exigir = (c, m) => { if (!c) throw new Error(m); };

for (const [tela, opts] of Object.entries(TELAS)) {
  const page = await (await browser.newContext(opts)).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/?semente=3`); await page.waitForTimeout(2500);
  await passo(`${tela}: sem OUVIR O SHOW na home`, async () => exigir(!(await page.$('.som-show')), 'ainda tem o botão'));
  // entra na INFO pelo menu (o caminho de quem está navegando)
  await page.click('.site-header a[href="#sobre"]'); await page.waitForTimeout(1800);   // rodada 24: INFO virou SOBRE
  await passo(`${tela}: abertura com o maço de cópias`, async () => {
    const n = await page.$$eval('.info-copias .copia img', is => is.filter(i => i.complete && i.naturalWidth).length);
    exigir(n >= 3, `${n} cópias carregadas`);
    await page.screenshot({ path: `saida/r23/abertura-${tela}.png` });
    const antes = await page.$eval('.info-copias', c => [...c.children].find(x => x.style.getPropertyValue('--pos') === '0')?.textContent);
    await page.mouse.move(5, 5); await page.waitForTimeout(3900);
    const depois = await page.$eval('.info-copias', c => [...c.children].find(x => x.style.getPropertyValue('--pos') === '0')?.textContent);
    exigir(antes !== depois, `não folheou (${antes})`);
    return `${antes} → ${depois}`;
  });
  await passo(`${tela}: tocar na cópia de cima abre a galeria`, async () => {
    await page.locator('.copia:not(.fundo)').filter({ has: page.locator('img') }).first().evaluate(c => c.click());
    await page.waitForTimeout(900);
    exigir(await page.evaluate(() => document.querySelector('#gallery-dialog')?.open), 'não abriu');
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  });
  await passo(`${tela}: line-up sem linha começando com ponto`, async () => {
    const r = await page.$$eval('.info-nomes .lineup-item', its => {
      let ruins = 0; for (const it of its) { const sep = it.querySelector('.sep'); if (!sep) continue; const a = it.firstElementChild.getClientRects(), b = sep.getClientRects(); if (b[0] && a[a.length - 1] && Math.abs(b[0].top - a[a.length - 1].top) > 4) ruins++; } return { n: its.length, ruins };
    });
    exigir(r.n >= 20 && !r.ruins, JSON.stringify(r));
    await page.locator('.info-lineup').screenshot({ path: `saida/r23/lineup-${tela}.png` });
    return `${r.n} nomes`;
  });
  if (!opts.hasTouch) await passo('desktop: passar o mouse num nome mostra a foto do artista', async () => {
    const b = page.locator('.info-nomes .info-artista').first(); await b.scrollIntoViewIfNeeded();
    const r = await b.boundingBox(); await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2, { steps: 4 }); await page.waitForTimeout(500);
    exigir(await page.isVisible('.nome-foto.visivel'), 'a foto não apareceu');
    await page.screenshot({ path: `saida/r23/nome-foto.png` });
    await page.mouse.move(5, 5); await page.waitForTimeout(300);
  });
  await passo(`${tela}: cada serviço com foto e o fecho com a foto deitada`, async () => {
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
    await page.waitForTimeout(1200);
    const s = await page.$$eval('.servico-foto img', is => is.filter(i => i.complete && i.naturalWidth).length);
    const f = await page.$$eval('.fecho-foto img', is => is.filter(i => i.complete && i.naturalWidth).length);
    exigir(s === 6 && f === 1, `serviços ${s}, fecho ${f}`);
    await page.locator('.info-servicos').screenshot({ path: `saida/r23/servicos-${tela}.png` });
    await page.locator('.info-sobre').screenshot({ path: `saida/r23/sobre-${tela}.png` });
    await page.locator('.info-fecho').screenshot({ path: `saida/r23/fecho-${tela}.png` });
  });
  await passo(`${tela}: a página não passa da largura da tela`, async () => {
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    exigir(sw <= iw, `${sw} > ${iw}`); return `${sw}`;
  });
  await passo(`${tela}: nada abaixo de 11 px na INFO`, async () => {
    const r = await page.evaluate(() => { let m = 99, q = ''; const w = document.createTreeWalker(document.querySelector('#info'), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el.getClientRects().length) continue; const f = parseFloat(getComputedStyle(el).fontSize); if (f < m) { m = f; q = el.className + ': ' + n.textContent.trim().slice(0, 24); } } return { m, q }; });
    exigir(r.m >= 11, `${r.m}px em ${r.q}`); return `${r.m}px`;
  });
  await passo(`${tela}: nenhum erro`, async () => exigir(!erros.length, erros[0]));
  await page.context().close();
}
await browser.close(); await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
