// Rodada 18: entradas novas (credencial, visor; a do nome continua com ?entrada=nome), o monitor do bastidor,
// a colagem curta e a rolagem leve. Prints em saida/r18/. Uso: node rodada18.mjs
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
mkdirSync('saida/r18', { recursive: true });
const TELAS = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
let falhas = 0;
const passo = async (nome, fn) => { try { const r = await fn(); console.log('OK    ', nome, r ? '· ' + r : ''); } catch (e) { falhas++; console.log('FALHA ', nome, '·', String(e.message || e).split('\n')[0]); } };
const exigir = (c, m) => { if (!c) throw new Error(m); };

for (const entrada of ['nome', 'visor']) {
  for (const [tela, opts] of Object.entries(TELAS)) {
    const page = await (await browser.newContext(opts)).newPage();
    const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.goto(`${srv.url}/?semente=3&entrada=${entrada}`);
    for (const ms of [700, 1500, 2600]) { await page.waitForTimeout(ms === 700 ? 700 : ms - (ms === 1500 ? 700 : 1500)); await page.screenshot({ path: `saida/r18/${entrada}-${tela}-${ms}.png` }); }
    await passo(`${entrada} ${tela}: a entrada termina e libera a página`, async () => {
      await page.waitForFunction(() => window.portfolioIntroComplete === true, null, { timeout: 8000 });
    });
    await page.mouse.wheel(0, 900); await page.waitForTimeout(1400);
    await passo(`${entrada} ${tela}: o monitor do bastidor aparece depois da entrada`, async () => {
      exigir(await page.isVisible('.monitor.visivel'), 'monitor não apareceu');
      exigir(await page.getAttribute('.monitor', 'href') === './bastidor.html', 'link errado');
      const tocando = await page.evaluate(() => { const v = document.querySelector('.monitor video'); return !!v.getAttribute('src'); });
      return tocando ? 'vídeo carregado' : 'só o pôster';
    });
    if (entrada === 'nome') {
      await page.screenshot({ path: `saida/r18/monitor-${tela}.png` });
      if (tela === 'desktop') { await page.hover('.monitor'); await page.waitForTimeout(500); await page.screenshot({ path: `saida/r18/monitor-hover.png`, clip: { x: 0, y: 500, width: 600, height: 400 } }); }
      await passo('colagem curta: 42 na colagem, o resto na grade, convite pro acervo no fim', async () => {
        const n = await page.$$eval('#portfolio > .media', cs => cs.filter(c => getComputedStyle(c).display !== 'none').length);
        exigir(n === 42, `${n} visíveis`);
        exigir(await page.isVisible('.colagem-tudo') || await page.$('.colagem-tudo'), 'sem convite');
        await page.click('.colagem-tudo'); await page.waitForTimeout(800);
        const g = await page.$$eval('#portfolio > .media', cs => cs.filter(c => getComputedStyle(c).display !== 'none').length);
        exigir(g > 100, `grade com ${g}`);
        return `grade com ${g}`;
      });
      await page.goto(`${srv.url}/?semente=3#inicio`); await page.waitForTimeout(1500);
      await passo(`rodada 19 ${tela}: sem as contagens de fotos e filmes`, async () => {
        const t = await page.evaluate(() => document.body.innerText);
        exigir(!/\d+\s*FOTOGRAFIAS/i.test(t) && !/\d+\s*FILMES/i.test(t), 'ainda tem contagem');
      });
      await page.evaluate(() => document.querySelector('.porta-bastidor').scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(1500); await page.screenshot({ path: `saida/r18/colagem-fim-${tela}.png` });
      await passo(`rodada 19 ${tela}: o fim é uma janela só pro bastidor, com o corredor tocando, e o monitor do canto sai`, async () => {
        exigir(!(await page.$('.porta-folha')), 'ainda tem as duas folhas');
        exigir(!(await page.textContent('.porta-bastidor')).includes('ARTISTAS'), 'ainda fala em entrada de artistas');
        const v = await page.evaluate(() => { const v = document.querySelector('.porta-bastidor video'); return !!v.getAttribute('src') && !v.paused; });
        exigir(v, 'o vídeo da janela não tocou');
        exigir(!(await page.isVisible('.monitor.visivel')), 'o monitor do canto continuou junto');
      });
    }
    await passo(`${entrada} ${tela}: nenhum erro`, async () => exigir(!erros.length, erros[0]));
    await page.context().close();
  }
}
await browser.close(); srv.close?.();
console.log(falhas ? `${falhas} falha(s)` : 'Rodada 18 funcionando.');
process.exit(falhas ? 1 : 0);
