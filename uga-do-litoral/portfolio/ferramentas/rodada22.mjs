// Rodada 22: NA ESTRADA (diário de shows na INFO) e a medição da Vercel (só no site publicado).
// Prints em saida/r22/. Uso: node rodada22.mjs
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
mkdirSync('saida/r22', { recursive: true });
const TELAS = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
let falhas = 0;
const passo = async (nome, fn) => { try { const r = await fn(); console.log('OK    ', nome, r ? '· ' + r : ''); } catch (e) { falhas++; console.log('FALHA ', nome, '·', String(e.message || e).split('\n')[0]); } };
const exigir = (c, m) => { if (!c) throw new Error(m); };

for (const [tela, opts] of Object.entries(TELAS)) {
  for (const hoje of ['2026-11-18T12:00:00', '2026-12-10T12:00:00']) {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(t => { const D = Date, fixo = new D(t).getTime(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [fixo])); } static now() { return fixo + performance.now(); } }; }, hoje);
    const page = await ctx.newPage();
    const erros = [], vercel = [];
    page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    page.on('request', r => { if (r.url().includes('/_vercel/')) vercel.push(r.url()); });
    await page.goto(`${srv.url}/?semente=3#info`); await page.waitForTimeout(1800);
    const dia = hoje.slice(0, 10);
    await passo(`${tela} ${dia}: NA ESTRADA aparece na INFO`, async () => {
      const grupos = await page.$$eval('.estrada-grupo', hs => hs.map(h => h.textContent));
      const n = await page.$$eval('.estrada-show', ls => ls.length);
      const prox = await page.$$eval('.estrada-show.proxima .estrada-cidade', ls => ls.map(l => l.textContent));
      if (dia === '2026-11-18') { exigir(grupos.join() === 'PRÓXIMAS,JÁ PASSOU', grupos.join()); exigir(prox.length === 2, `${prox.length} próximas`); }
      else exigir(!grupos.includes('PRÓXIMAS') && n === 4, `depois do último show: ${grupos.join()} / ${n}`);
      await page.locator('.estrada').scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
      await page.locator('.estrada').screenshot({ path: `saida/r22/estrada-${tela}-${dia}.png` });
      return `${n} shows; próximas: ${prox.join(', ') || 'nenhuma'}`;
    });
    if (dia === '2026-11-18') {
      await passo(`${tela}: nome do artista no diário abre a galeria`, async () => {
        const b = page.locator('.estrada .info-artista').filter({ hasText: 'ALEE' }).first();
        await b.click(); await page.waitForTimeout(1000);
        exigir(await page.evaluate(() => document.querySelector('#gallery-dialog')?.open), 'galeria não abriu');
        exigir((await page.textContent('#gallery-dialog')).toUpperCase().includes('ALEE'), 'galeria errada');
        await page.keyboard.press('Escape'); await page.waitForTimeout(400);
        return (await page.$$eval('.estrada .info-artista', bs => bs.map(b => b.textContent))).join(', ');
      });
      await passo(`${tela}: nada abaixo de 11 px no diário`, async () => {
        const menor = await page.$$eval('.estrada *', els => Math.min(...els.filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => parseFloat(getComputedStyle(e).fontSize))));
        exigir(menor >= 11, `${menor}px`); return `${menor}px`;
      });
      await passo(`${tela}: medição não carrega fora do site publicado, e o marcador existe`, async () => {
        exigir(!vercel.length, vercel[0]);
        exigir(await page.evaluate(() => typeof window.va === 'function'), 'sem window.va');
      });
    }
    await passo(`${tela} ${dia}: nenhum erro`, async () => exigir(!erros.length, erros[0]));
    await ctx.close();
  }
}
await browser.close(); await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
