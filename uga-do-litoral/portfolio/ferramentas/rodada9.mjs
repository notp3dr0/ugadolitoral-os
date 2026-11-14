// Rodada 9 (quem contrata): INFO nova, botão AGENDA ABERTA, WhatsApp com mensagem pronta.
// Uso: node rodada9.mjs  → prints em saida/r9-*.png
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';

const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let falhas = 0;
const exigir = (ok, msg) => { if (!ok) throw new Error(msg); };
async function passo(nome, fn) {
  try { const r = await fn(); console.log(`  ok  ${nome}${r ? ' · ' + r : ''}`); }
  catch (e) { falhas++; console.log(`  XX  ${nome} · ${e.message}`); }
}

for (const [rotulo, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]
]) {
  console.log(`\n== ${rotulo}`);
  const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/`); await page.waitForTimeout(1500);
  const visivel = () => page.evaluate(() => document.querySelector('.agenda-flutua').classList.contains('visivel'));
  await passo('na intro o botao AGENDA ABERTA nao aparece', async () => exigir(!(await visivel()), 'apareceu na intro'));
  await passo('no acervo ele aparece, com WhatsApp e mensagem pronta', async () => {
    await page.goto(`${srv.url}/#fotos`); await page.waitForTimeout(1200);
    await page.evaluate(() => scrollBy(0, innerHeight * 3)); await page.waitForTimeout(800);
    exigir(await visivel(), 'nao apareceu');
    const href = await page.getAttribute('.agenda-flutua', 'href');
    exigir(href.includes('wa.me/') && href.includes('?text='), href);
    await page.screenshot({ path: `saida/r9-acervo-${rotulo}.png` });
  });
  await passo('na INFO o botao some e a pagina tem nomes, servicos e bio', async () => {
    await page.goto(`${srv.url}/#info`); await page.waitForTimeout(1200);
    exigir(!(await visivel()), 'botao em cima da INFO');
    const r = await page.evaluate(() => ({
      nomes: document.querySelector('.info-nomes')?.textContent.includes('Matuê'),
      servicos: document.querySelectorAll('.info-servicos li').length,
      idade: document.querySelector('.bio').textContent.includes('19 anos'),
      vazio: [...document.querySelectorAll('.info a[href*="wa.me"]')].every(a => a.href.includes('text='))
    }));
    exigir(r.nomes && r.servicos === 6 && !r.idade && r.vazio, JSON.stringify(r));
    await page.screenshot({ path: `saida/r9-info-${rotulo}.png`, fullPage: true });
  });
  await passo('nada passa da largura da tela', async () => {
    const w = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    exigir(w <= 0, `${w}px a mais`);
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await ctx.close();
}
await browser.close(); srv.close?.();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
