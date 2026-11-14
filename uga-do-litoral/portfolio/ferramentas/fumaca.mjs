// Teste de fumaca: confere que os comportamentos do site continuam funcionando depois de uma mudanca.
// Uso: node fumaca.mjs [pasta=../site-lab] [--rede]
//   --rede  tambem espera o filme de verdade comecar a carregar (precisa de internet: o stream mora no Vercel Blob)
// Sai com codigo 1 se algo falhar. Depende so do "contrato de DOM" descrito em plano/LEIA-PRIMEIRO.md.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';

const pasta = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '../site-lab';
const comRede = process.argv.includes('--rede');
const srv = await servir(pasta);
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']
});
let falhas = 0;
const linha = (ok, nome, extra = '') => { if (!ok) falhas++; console.log(`${ok ? 'OK    ' : 'FALHA '} ${nome}${extra ? ' · ' + extra : ''}`); };
async function passo(nome, fn) {
  try { const extra = await fn(); linha(true, nome, typeof extra === 'string' ? extra : ''); }
  catch (erro) { linha(false, nome, String(erro.message || erro).split('\n')[0]); }
}
const exigir = (condicao, mensagem) => { if (!condicao) throw new Error(mensagem); };

async function abrir(opcoes, rota = '/') {
  const ctx = await browser.newContext(opcoes);
  const page = await ctx.newPage();
  const erros = [];
  const pedidos = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push(String(e)));
  page.on('request', r => pedidos.push(r.url()));
  await page.goto(srv.url + '/?semente=fixa' + rota.replace(/^\//, ''), { waitUntil: 'load' }); // ordem original, sem sorteio
  await page.waitForFunction(() => window.portfolioReady === true, null, { timeout: 8000 });
  return { ctx, page, erros, pedidos };
}
const fimDaIntro = page => page.evaluate(() => { const i = document.querySelector('#portfolio-intro'); return i.offsetTop + i.offsetHeight; });

// ---------- desktop, movimento normal ----------
{
  const { ctx, page, erros, pedidos } = await abrir({ viewport: { width: 1440, height: 900 } });
  console.log('\n== desktop');
  await passo('carrega sem erro no console', async () => { await page.waitForTimeout(800); exigir(!erros.length, erros[0]); });
  await passo('intro: texto embaralha no meio da rolagem', async () => {
    const fim = await fimDaIntro(page);
    await page.evaluate(y => scrollTo(0, y), fim * 0.28);
    await page.waitForTimeout(400);
    const texto = await page.locator('.intro-roles-visual').textContent();
    exigir(/[%#&+/*=]/.test(texto), `esperava simbolos, veio "${texto}"`);
    return texto;
  });
  await passo('intro: termina e avisa (portfolio:intro-complete)', async () => {
    const fim = await fimDaIntro(page);
    await page.evaluate(y => scrollTo(0, y), fim);
    await page.waitForFunction(() => window.portfolioIntroComplete === true, null, { timeout: 4000 });
    const texto = await page.locator('.intro-roles-visual').textContent();
    exigir(texto === 'FOTOGRAFIA · VÍDEO · EDIÇÃO', `texto final "${texto}"`);
  });
  await passo('fundo liquido ligado (canvas webgl2)', async () => {
    await page.waitForFunction(() => document.querySelector('#liquid-background canvas')?.dataset.renderer === 'webgl2', null, { timeout: 4000 });
  });
  await passo('previa de filme toca quando visivel', async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.preview')].some(v => v.getAttribute('src') && !v.paused), null, { timeout: 6000 });
  });
  await passo('arrastar uma foto move a foto e nao abre a galeria', async () => {
    const caixa = await page.locator('[data-photo="0"]').boundingBox();
    await page.mouse.move(caixa.x + 30, caixa.y + 80);
    await page.mouse.down();
    await page.mouse.move(caixa.x + 90, caixa.y + 130, { steps: 6 });
    await page.mouse.move(caixa.x + 150, caixa.y + 160, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const estado = await page.evaluate(() => ({
      translate: document.querySelector('[data-photo="0"]').style.translate,
      aberta: document.querySelector('#gallery-dialog').open
    }));
    exigir(estado.translate && estado.translate !== '0px 0px', `translate "${estado.translate}"`);
    exigir(!estado.aberta, 'a galeria abriu no fim do arrasto');
    return estado.translate;
  });
  await passo('vistas: GRADE, INFO e COLAGEM pela hash', async () => {
    await page.evaluate(() => { location.hash = '#fotos'; });
    await page.waitForFunction(() => document.querySelector('#portfolio').classList.contains('grid'));
    await page.evaluate(() => { location.hash = '#info'; });
    await page.waitForFunction(() => document.querySelector('#portfolio').hidden && !document.querySelector('#info').hidden);
    await page.evaluate(() => { location.hash = '#inicio'; });
    await page.waitForFunction(() => document.querySelector('#portfolio').classList.contains('pile') && !document.querySelector('#portfolio').hidden);
  });
  await passo('galeria: abre, anda com seta e botao, fecha no Esc e devolve o foco', async () => {
    await page.evaluate(() => document.querySelector('[data-photo="0"]').click());
    await page.waitForFunction(() => document.querySelector('#gallery-dialog').open);
    await page.waitForFunction(() => document.querySelector('#gallery-count').textContent.startsWith('1 de'), null, { timeout: 4000 });
    await page.waitForFunction(() => { const i = document.querySelector('#gallery-image'); return /-(lg|md)\.webp$/.test(i.currentSrc || i.src) && i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 });
    const total = (await page.locator('#gallery-count').textContent()).split(' de ')[1].trim();
    exigir(Number(total) >= 2, 'a galeria da foto 0 deveria ter mais de uma foto');
    exigir(await page.locator('#gallery-thumbs button').count() === Number(total), 'miniaturas nao batem com o total');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('#gallery-count').textContent.startsWith('2 de'), null, { timeout: 4000 });
    await page.locator('.gallery-prev').click();
    await page.waitForFunction(() => document.querySelector('#gallery-count').textContent.startsWith('1 de'), null, { timeout: 4000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#gallery-dialog').open, null, { timeout: 4000 });
    await page.waitForFunction(() => document.activeElement === document.querySelector('[data-photo="0"]'), null, { timeout: 3000 });
    exigir(!(await page.evaluate(() => document.body.classList.contains('modal-open'))), 'body ficou com modal-open');
    return `${total} fotos`;
  });
  await passo('filme: abre o player e fecha limpando', async () => {
    const antes = pedidos.some(u => u.includes('hls.min.js'));
    await page.evaluate(() => document.querySelector('.media.film').click());
    await page.waitForFunction(() => document.querySelector('#video-dialog').open && document.querySelector('#video-player video, #video-player iframe'), null, { timeout: 8000 });
    exigir((await page.locator('#video-title').textContent()).trim().length > 0, 'titulo do filme vazio');
    if (comRede) await page.waitForFunction(() => { const v = document.querySelector('#video-player video'); return v && v.readyState >= 1; }, null, { timeout: 20000 });
    await page.locator('#video-dialog .close-dialog').click();
    await page.waitForFunction(() => !document.querySelector('#video-dialog').open && !document.querySelector('#video-player').children.length, null, { timeout: 4000 });
    return `hls.js pedido antes do clique: ${antes ? 'sim' : 'nao'}${comRede ? ' · stream carregou' : ''}`;
  });
  await passo('nenhum erro no console durante o uso', async () => { exigir(!erros.length, erros[0]); });
  await ctx.close();
}

// ---------- nunca igual ----------
{
  console.log('\n== sorteio a cada visita');
  const ordem = async () => { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    await p.goto(srv.url + '/#inicio'); await p.waitForFunction(() => window.portfolioReady === true);
    const r = await p.evaluate(() => [...document.querySelectorAll('#portfolio > .media')].map(c => c.dataset.photo ?? 'f' + c.dataset.film).join());
    await ctx.close(); return r; };
  await passo('duas visitas, duas ordens; filmes no lugar', async () => {
    const a = await ordem(), b = await ordem();
    exigir(a !== b, 'as duas visitas sairam iguais');
    exigir(a.split(',').map((x, i) => x[0] === 'f' ? i : -1).join() === b.split(',').map((x, i) => x[0] === 'f' ? i : -1).join(), 'filmes mudaram de vaga');
  });
}

// ---------- celular ----------
{
  const { ctx, page, erros } = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  console.log('\n== celular');
  await passo('carrega e termina a intro', async () => {
    await page.evaluate(y => scrollTo(0, y), await fimDaIntro(page));
    await page.waitForFunction(() => window.portfolioIntroComplete === true, null, { timeout: 4000 });
  });
  await passo('toque numa foto abre a galeria; recebe a versao media (1080 px); fechar pelo botao', async () => {
    await page.locator('[data-photo="0"]').tap();
    await page.waitForFunction(() => document.querySelector('#gallery-dialog').open, null, { timeout: 4000 });
    await page.waitForFunction(() => document.querySelector('#gallery-count').textContent.startsWith('1 de'), null, { timeout: 4000 });
    await page.waitForFunction(() => /-md\.webp$/.test(document.querySelector('#gallery-image').currentSrc), null, { timeout: 8000 });
    await page.locator('#gallery-dialog .close-dialog').tap();
    await page.waitForFunction(() => !document.querySelector('#gallery-dialog').open, null, { timeout: 4000 });
  });
  await passo('sem rolagem horizontal', async () => {
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    exigir(sobra <= 1, `pagina ${sobra}px mais larga que a tela`);
  });
  await passo('nenhum erro no console', async () => { exigir(!erros.length, erros[0]); });
  await ctx.close();
}

// ---------- menos movimento ----------
{
  const { ctx, page, erros } = await abrir({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  console.log('\n== menos movimento (prefers-reduced-motion)');
  await passo('fundo liquido desligado e intro de uma tela so', async () => {
    const r = await page.evaluate(() => ({
      canvas: getComputedStyle(document.querySelector('#liquid-background canvas')).display,
      intro: document.querySelector('#portfolio-intro').offsetHeight, tela: innerHeight,
      pronta: window.portfolioIntroComplete
    }));
    exigir(r.canvas === 'none', `canvas display ${r.canvas}`);
    exigir(Math.abs(r.intro - r.tela) <= 2, `intro com ${r.intro}px numa tela de ${r.tela}px`);
    exigir(r.pronta === true, 'intro nao foi marcada como completa');
  });
  await passo('nenhuma previa tocando', async () => {
    await page.evaluate(y => scrollTo(0, y), await fimDaIntro(page));
    await page.waitForTimeout(1200);
    exigir(await page.evaluate(() => [...document.querySelectorAll('.preview')].every(v => v.paused)), 'tem previa tocando');
  });
  await passo('galeria abre e fecha', async () => {
    await page.evaluate(() => document.querySelector('[data-photo="0"]').click());
    await page.waitForFunction(() => document.querySelector('#gallery-dialog').open);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#gallery-dialog').open, null, { timeout: 4000 });
  });
  await passo('nenhum erro no console', async () => { exigir(!erros.length, erros[0]); });
  await ctx.close();
}

await browser.close();
await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo funcionando.');
process.exit(falhas ? 1 : 0);
