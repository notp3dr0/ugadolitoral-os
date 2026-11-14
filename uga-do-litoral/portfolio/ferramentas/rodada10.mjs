// Rodada 10: intro mais curta, nenhuma letra abaixo de 11 px, vista FILMES com todos os filmes.
// Uso: node rodada10.mjs  → prints em saida/r10-*.png
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
  ['celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ['celular-360', { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]
]) {
  console.log(`\n== ${rotulo}`);
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/`); await page.waitForTimeout(1500);
  await passo('primeira foto a no maximo 2 telas de rolagem', async () => {
    const telas = await page.evaluate(() => (document.querySelector('#portfolio .media').getBoundingClientRect().top + scrollY) / innerHeight);
    exigir(telas <= 2, `${telas.toFixed(2)} telas`); return `${telas.toFixed(2)} telas`;
  });
  await passo('a intro ainda anima (o texto das funcoes aparece rolando)', async () => {
    const antes = await page.evaluate(() => getComputedStyle(document.querySelector('.intro-roles-visual')).opacity);
    await page.mouse.wheel(0, 400); await page.evaluate(() => scrollBy(0, innerHeight * .4)); await page.waitForTimeout(500);
    const depois = await page.evaluate(() => getComputedStyle(document.querySelector('.intro-roles-visual')).opacity);
    exigir(+depois > +antes, `opacidade ${antes} -> ${depois}`);
  });
  const letrasPequenas = () => page.evaluate(() => {
    const achadas = new Set();
    for (const el of document.querySelectorAll('body *')) {
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      if (el.closest('.sr-only,[hidden],dialog:not([open])')) continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) continue;
      if (parseFloat(cs.fontSize) < 10.5) achadas.add(`${(el.className || el.tagName).toString().slice(0, 24)} ${cs.fontSize}`);
    }
    return [...achadas];
  });
  await passo('nenhuma letra abaixo de 10,5 px na colagem', async () => { const p = await letrasPequenas(); exigir(!p.length, p.join(', ')); });
  await passo('cabecalho e barra cabem na largura', async () => {
    const r = await page.evaluate(() => {
      const fora = [...document.querySelectorAll('.site-header nav > *, .nav-dir > a, .acervo-bar *')].filter(el => { const b = el.getBoundingClientRect(); return b.width && (b.right > innerWidth + .5 || b.left < -.5); }).map(el => el.textContent.trim());
      const sobra = document.documentElement.scrollWidth - innerWidth;
      return { fora, sobra };
    });
    exigir(!r.fora.length && r.sobra <= 0, JSON.stringify(r));
  });
  await passo('FILMES mostra os 8 filmes e nenhuma foto', async () => {
    await page.goto(`${srv.url}/#filmes`); await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const vis = el => getComputedStyle(el).display !== 'none';
      const filmes = [...document.querySelectorAll('#portfolio .media.film')].filter(vis);
      return { filmes: filmes.length, titulos: new Set(filmes.map(f => f.dataset.title)).size, fotos: [...document.querySelectorAll('#portfolio .media.photo')].filter(vis).length,
        atual: document.querySelector('.view-switch [aria-current=page]')?.textContent };
    });
    exigir(r.filmes === 8 && r.titulos === 8 && r.fotos === 0 && r.atual === 'FILMES', JSON.stringify(r));
    await page.screenshot({ path: `saida/r10-filmes-${rotulo}.png` });
    return `${r.filmes} filmes`;
  });
  await passo('abrir um filme da vista FILMES (inclusive o que ficou fora da colagem)', async () => {
    await page.click('#portfolio .so-filmes'); await page.waitForSelector('#video-dialog[open]', { timeout: 5000 });
    const t = await page.textContent('#video-title'); await page.keyboard.press('Escape'); return t;
  });
  await passo('na colagem o filme extra fica escondido', async () => {
    await page.goto(`${srv.url}/#inicio`); await page.waitForTimeout(800);
    exigir(await page.evaluate(() => [...document.querySelectorAll('.so-filmes')].every(el => getComputedStyle(el).display === 'none')), 'apareceu na colagem');
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await ctx.close();
}
await browser.close(); srv.close?.();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
