// Rodada 24: os ajustes do Pedro na INFO, que virou SOBRE. Sem nome e sem funções no topo, sem rótulo numerado,
// sem as tours pequenas, títulos como frase em branco, bio em texto corrido, AGENDA ABERTA maior, link antigo #info
// continua abrindo. Prints em saida/r24/. Uso: node rodada24.mjs
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
mkdirSync('saida/r24', { recursive: true });
const TELAS = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
let falhas = 0;
const passo = async (nome, fn) => { try { const r = await fn(); console.log('OK    ', nome, r ? '· ' + r : ''); } catch (e) { falhas++; console.log('FALHA ', nome, '·', String(e.message || e).split('\n')[0]); } };
const exigir = (c, m) => { if (!c) throw new Error(m); };
const FRASE = 'Fotografo e filmo rap e trap: o show, a turnê, o ensaio e o que acontece atrás do palco.';

for (const [tela, opts] of Object.entries(TELAS)) {
  const page = await (await browser.newContext(opts)).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/?semente=3`); await page.waitForTimeout(2500);

  await passo(`${tela}: o cabeçalho diz SOBRE e abre a página`, async () => {
    const link = page.locator('.site-header a[data-view="info"]');
    exigir((await link.textContent()).trim() === 'SOBRE', await link.textContent());
    await link.click(); await page.waitForTimeout(1600);
    const r = await page.evaluate(() => ({ hash: location.hash, aberta: !document.querySelector('#info').hidden, titulo: document.title, atual: document.querySelector('.site-header a[data-view="info"]').getAttribute('aria-current') }));
    exigir(r.hash === '#sobre' && r.aberta && r.titulo.startsWith('Sobre') && r.atual === 'page', JSON.stringify(r));
    return r.titulo;
  });
  await passo(`${tela}: topo só com a frase, AGENDA ABERTA maior e os links`, async () => {
    const r = await page.evaluate(() => {
      const t = document.querySelector('.info-title');
      return { h1: t.querySelector('h1')?.textContent, ps: t.querySelectorAll(':scope > p').length, texto: document.querySelector('#info').innerText,
        agenda: parseFloat(getComputedStyle(document.querySelector('.info-agenda')).fontSize), links: t.querySelectorAll('.contact a').length };
    });
    exigir(r.h1 === FRASE, `título: ${r.h1}`);
    exigir(!r.ps, `${r.ps} parágrafo(s) sobrando no topo`);
    exigir(!/PEDRO\s+AUGUSTO/i.test(r.texto) && !/FOTOGRAFIA · VÍDEO/.test(r.texto) && !/cultura urbana/i.test(r.texto), 'nome ou funções ainda aparecem');
    exigir(r.agenda >= 13, `AGENDA ABERTA com ${r.agenda}px`);
    exigir(r.links === 3, `${r.links} links`);
    await page.screenshot({ path: `saida/r24/abertura-${tela}.png` });
    return `agenda ${r.agenda}px`;
  });
  await passo(`${tela}: sem rótulo numerado, sem vermelhinho, sem as tours pequenas`, async () => {
    const r = await page.evaluate(() => {
      const vis = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('.sr-only');
      const numerados = [...document.querySelectorAll('#info *')].filter(el => vis(el) && [...el.childNodes].some(n => n.nodeType === 3 && /^\s*0\d\s*·/.test(n.textContent))).map(el => el.textContent.slice(0, 24));
      return { numerados, rotulos: document.querySelectorAll('#info .info-rotulo').length, tours: document.querySelectorAll('#info .info-tours').length, numeros: document.querySelectorAll('#info .servico-n').length,
        ja: /JÁ REGISTREI|NA ESTRADA|DE ONDE EU VENHO/.test(document.querySelector('#info').innerText), fkt: /FKTOUR|Odisseya|Adulto Ideal|O Melhor Dia/.test(document.querySelector('#info').innerText) };
    });
    exigir(!r.numerados.length && !r.rotulos && !r.tours && !r.numeros && !r.ja && !r.fkt, JSON.stringify(r));
  });
  await passo(`${tela}: títulos como frase em branco`, async () => {
    const r = await page.$$eval('#info .info-frase', hs => hs.map(h => ({ t: h.textContent, c: getComputedStyle(h).color, f: parseFloat(getComputedStyle(h).fontSize) })));
    exigir(r.map(x => x.t).join('|') === 'O que dá pra contratar?|Sobre mim', r.map(x => x.t).join('|'));
    exigir(r.every(x => x.c === 'rgb(242, 240, 235)' && x.f >= 28), JSON.stringify(r));
    return r.map(x => `${x.t} ${x.f}px`).join(', ');
  });
  await passo(`${tela}: PRÓXIMAS continua no diário de shows`, async () => {
    const g = await page.$$eval('#info .estrada-grupo', hs => hs.map(h => h.textContent));
    exigir(g[0] === 'PRÓXIMAS', g.join()); return g.join(', ');
  });
  await passo(`${tela}: sobre mim em texto corrido`, async () => {
    const r = await page.evaluate(() => ({ ps: document.querySelectorAll('.info-sobre .bio > p').length, tempo: document.querySelectorAll('.linha-tempo, .parada-marco').length, t: document.querySelector('.info-sobre .bio').textContent }));
    exigir(r.ps === 3 && !r.tempo && r.t.includes('Caraguatatuba') && r.t.includes('R10') && r.t.includes('gastronomia'), JSON.stringify({ ps: r.ps, tempo: r.tempo }));
  });
  await passo(`${tela}: rolando até o fim, tudo aparece`, async () => {
    for (let k = 0; k < 40 && await page.evaluate(() => innerHeight + scrollY < document.documentElement.scrollHeight - 4); k++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(140); }
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => [...document.querySelectorAll('#info .surge')].filter(e => getComputedStyle(e).opacity < .9).map(e => e.className + ': ' + e.textContent.slice(0, 20)));
    exigir(!r.length, r.join(' / '));
    for (const [q, n] of [['.info-lineup', 'lineup'], ['#info-estrada', 'estrada'], ['.info-servicos', 'servicos'], ['.info-sobre', 'sobre'], ['.info-fecho', 'fecho']]) {
      const sel = q === '.info-servicos' ? '.info-servicos' : q;
      await page.locator(sel).first().screenshot({ path: `saida/r24/${n}-${tela}.png` });
    }
    // o título dos serviços entra no print junto com a grade
    await page.locator('.info-frase').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await page.screenshot({ path: `saida/r24/contratar-${tela}.png` });
    await page.screenshot({ path: `saida/r24/pagina-${tela}.png`, fullPage: true });
  });
  await passo(`${tela}: a foto do Pedro embaixo do "Sobre mim", ao lado do texto`, async () => {
    const r = await page.evaluate(() => {
      const img = document.querySelector('.sobre-foto img'), q = s => document.querySelector(s).getBoundingClientRect();
      const h = q('.info-sobre .info-frase'), f = q('.sobre-foto'), b = q('.info-sobre .bio');
      return { ok: img.complete && img.naturalWidth > 0, hB: h.bottom, fT: f.top, fB: f.bottom, fL: f.left, fW: f.width, bT: b.top, bL: b.left };
    });
    exigir(r.ok, 'a foto não carregou');
    exigir(r.fT > r.hB, 'a foto não está embaixo do título');
    if (tela === 'desktop') exigir(r.fL < r.bL && Math.abs(r.fT - r.bT) < 4, `foto ${Math.round(r.fL)}/${Math.round(r.fT)}, texto ${Math.round(r.bL)}/${Math.round(r.bT)}`);
    else exigir(r.bT >= r.fB, 'no celular o texto devia vir depois da foto');
    await page.locator('.info-sobre').screenshot({ path: `saida/r24/sobre-${tela}.png` });
    return `foto ${Math.round(r.fW)}px de largura`;
  });
  await passo(`${tela}: link antigo #info abre o SOBRE e o endereço vira #sobre`, async () => {
    await page.goto(`${srv.url}/?semente=3#info`); await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ hash: location.hash, aberta: !document.querySelector('#info').hidden, flutua: document.querySelector('.agenda-flutua')?.classList.contains('visivel') }));
    exigir(r.hash === '#sobre' && r.aberta && !r.flutua, JSON.stringify(r));
  });
  await passo(`${tela}: a página não passa da largura da tela`, async () => {
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    exigir(sw <= iw, `${sw} > ${iw}`); return `${sw}`;
  });
  await passo(`${tela}: nada abaixo de 11 px`, async () => {
    const r = await page.evaluate(() => { let m = 99, q = ''; const w = document.createTreeWalker(document.querySelector('#info'), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el.getClientRects().length || el.closest('.sr-only')) continue; const f = parseFloat(getComputedStyle(el).fontSize); if (f < m) { m = f; q = el.className + ': ' + n.textContent.trim().slice(0, 24); } } return { m, q }; });
    exigir(r.m >= 11, `${r.m}px em ${r.q}`); return `${r.m}px`;
  });
  await passo(`${tela}: nenhum erro`, async () => exigir(!erros.length, erros[0]));
  await page.context().close();
}
await browser.close(); await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
