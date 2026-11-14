// Tira um print de uma pagina do site, pra olhar o resultado de um passo.
// Uso: node foto.mjs <rota> <saida.png> [opcoes]
//   --pasta=../site-lab     pasta servida
//   --tela=celular|desktop  (padrao desktop 1440x900; celular 390x844 com toque)
//   --pronto="expr JS"      espera a expressao ficar verdadeira (padrao: window.portfolioReady === true || window.bastidorPronto === true)
//   --js="codigo"           roda na pagina antes do print (pode ser async), ex.: "scrollTo(0, 3000)"
//   --hover="seletor"       poe o cursor em cima do elemento
//   --clique="seletor"      clica no elemento (via element.click())
//   --espera=800            ms de espera depois das acoes (padrao 800)
//   --menos-movimento       emula prefers-reduced-motion
//   --inteira               pagina inteira
// A rota vai SEM a barra inicial: "#fotos", "bastidor.html?s=30", "" para a home.
// Exemplo: node foto.mjs "#fotos" saida/grade.png --tela=celular --inteira
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { servir } from './servidor.mjs';

// O Git Bash troca um argumento que comeca com "/" por um caminho do Windows. Aceite a rota sem a barra
// inicial ("#fotos", "bastidor.html?s=30") e conserte se ela chegou trocada.
const rotaLimpa = r => { r = String(r).replace(/^[A-Za-z]:[\/].*?Git[\/]/, ''); return r.startsWith('/') ? r : '/' + r; };
const [rotaBruta = '', saida = 'saida/foto.png', ...resto] = process.argv.slice(2);
const rota = rotaLimpa(rotaBruta);
const op = Object.fromEntries(resto.map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const telas = {
  desktop: { viewport: { width: 1440, height: 900 } },
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
};
fs.mkdirSync(path.dirname(saida), { recursive: true });
const srv = await servir(op.pasta || '../site-lab');
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']
});
const ctx = await browser.newContext({ ...telas[op.tela || 'desktop'], reducedMotion: op['menos-movimento'] ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const erros = [];
page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
page.on('pageerror', e => erros.push(String(e)));
await page.goto(srv.url + rota, { waitUntil: 'load' });
const pronto = op.pronto || 'window.portfolioReady === true || window.bastidorPronto === true';
await page.waitForFunction(pronto, null, { timeout: 15000 }).catch(() => console.log('aviso: a condicao de pronto nao chegou em 15 s:', pronto));
if (op.js) await page.evaluate(`(async () => { ${op.js} })()`);
if (op.hover) { const c = await page.locator(op.hover).first().boundingBox(); await page.mouse.move(c.x + Math.min(40, c.width / 2), c.y + Math.min(60, c.height / 2)); }
if (op.clique) await page.evaluate(s => document.querySelector(s).click(), op.clique);
await page.waitForTimeout(Number(op.espera || 800));
await page.screenshot({ path: saida, fullPage: Boolean(op.inteira) });
console.log('print em', saida, erros.length ? `· ${erros.length} erro(s) no console: ${erros[0]}` : '· sem erro no console');
await browser.close();
await srv.fechar();
