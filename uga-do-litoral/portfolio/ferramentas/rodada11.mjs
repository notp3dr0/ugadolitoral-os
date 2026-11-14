// Rodada 11: a intro toca sozinha (sem rolagem), pula com qualquer gesto, só na 1ª visita da sessão;
// a INFO se revela com o embaralhado. Uso: node rodada11.mjs
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
const SIMB = /[%#&+\/*=]/;
const LABEL = 'FOTOGRAFIA · VÍDEO · EDIÇÃO';

for (const [rotulo, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]
]) {
  console.log(`\n== ${rotulo}`);
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  const estado = () => page.evaluate(() => ({ fim: window.portfolioIntroComplete, txt: document.querySelector('.intro-roles-visual').textContent, y: scrollY }));

  await page.goto(`${srv.url}/`);
  await passo('a intro toca sozinha: embaralha no meio, resolve no fim, sem rolar', async () => {
    let viuEmbaralhado = false, t = 0;
    while (t < 6000) { const s = await estado(); if (SIMB.test(s.txt)) viuEmbaralhado = true; if (s.fim) break; await page.waitForTimeout(80); t += 80; }
    const s = await estado();
    exigir(viuEmbaralhado, 'nunca embaralhou'); exigir(s.fim && s.txt === LABEL, JSON.stringify(s)); exigir(s.y === 0, `rolou ${s.y}px`);
    return `terminou em ~${(t / 1000).toFixed(1)} s (com a cortina)`;
  });
  await passo('a primeira foto fica a no maximo 1,1 tela', async () => {
    const telas = await page.evaluate(() => (document.querySelector('#portfolio .media').getBoundingClientRect().top + scrollY) / innerHeight);
    exigir(telas <= 1.1, `${telas.toFixed(2)} telas`); return `${telas.toFixed(2)} telas`;
  });
  await page.screenshot({ path: `saida/r11-intro-${rotulo}.png` });
  await passo('voltando na mesma sessao, o nome ja aparece montado', async () => {
    await page.reload(); await page.waitForTimeout(400);
    const s = await estado(); exigir(s.fim && s.txt === LABEL, JSON.stringify(s));
  });
  await passo('INFO: textos curtos embaralham e depois resolvem', async () => {
    await page.goto(`${srv.url}/#info`); await page.waitForTimeout(450);
    const meio = await page.evaluate(() => [...document.querySelectorAll('.info-rotulo, .info-title > p, .info-servicos strong')].map(e => e.textContent).join('|'));
    await page.waitForTimeout(2200);
    const depois = await page.evaluate(() => [...document.querySelectorAll('.info-rotulo, .info-title > p')].map(e => e.textContent).join('|'));
    exigir(/[%#&+*=]/.test(meio), 'nada embaralhado aos 450 ms');
    exigir(!/[%#&+*=]/.test(depois) && depois.includes('JÁ REGISTREI') && depois.includes('FOTOGRAFIA · VÍDEO · EDIÇÃO · SÃO PAULO'), depois);
  });
  await passo('INFO: rolando ate o fim, tudo aparece (bio inclusive)', async () => {
    for (let k = 0; k < 8; k++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(150); }
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const els = [...document.querySelectorAll('#info .surge')];
      return { total: els.length, escondidos: els.filter(e => getComputedStyle(e).opacity < .9).map(e => e.textContent.slice(0, 20)) };
    });
    exigir(r.total > 15 && !r.escondidos.length, JSON.stringify(r)); return `${r.total} blocos`;
  });
  await page.screenshot({ path: `saida/r11-info-${rotulo}.png`, fullPage: true });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await ctx.close();

  // qualquer gesto pula
  const ctx2 = await browser.newContext(opts); const p2 = await ctx2.newPage();
  await p2.goto(`${srv.url}/`);
  await passo('um toque/rolagem no meio termina a intro na hora', async () => {
    await p2.waitForFunction(() => /[%#&+\/*=]/.test(document.querySelector('.intro-roles-visual').textContent), null, { timeout: 5000 });
    await p2.mouse.wheel(0, 120); await p2.waitForTimeout(120);
    const s = await p2.evaluate(() => ({ fim: window.portfolioIntroComplete, txt: document.querySelector('.intro-roles-visual').textContent }));
    exigir(s.fim && s.txt === LABEL, JSON.stringify(s));
  });
  await ctx2.close();
}

// menos movimento: nada anima
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const page = await ctx.newPage();
  await page.goto(`${srv.url}/`); await page.waitForTimeout(500);
  console.log('\n== menos movimento');
  await passo('intro ja montada e INFO sem animacao', async () => {
    const s = await page.evaluate(() => ({ fim: window.portfolioIntroComplete, txt: document.querySelector('.intro-roles-visual').textContent, anima: document.documentElement.classList.contains('info-anima') }));
    exigir(s.fim && s.txt === LABEL && !s.anima, JSON.stringify(s));
  });
  await ctx.close();
}
await browser.close(); srv.close?.();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
