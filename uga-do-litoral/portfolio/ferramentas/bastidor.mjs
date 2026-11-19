// Teste de fumaça do bastidor (bastidor.html): entrada, andar, foco, setlist, filme, fim, celular,
// menos movimento e orçamento de chamadas de desenho. Uso: node bastidor.mjs [pasta=../site-lab] [--rede]
// Sai 1 se falhar. Usa o Chrome da máquina com placa de vídeo.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';

const pasta = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '../site-lab';
const srv = await servir(pasta);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
let falhas = 0;
async function passo(nome, fn) {
  try { const extra = await fn(); console.log(`OK     ${nome}${extra ? ' · ' + extra : ''}`); }
  catch (e) { falhas++; console.log(`FALHA  ${nome} · ${String(e.message || e).split('\n')[0]}`); }
}
const exigir = (c, m) => { if (!c) throw new Error(m); };
const estado = p => p.evaluate(() => { const w = window.__bastidor.world, c = w.controls.state; return { s: c.s, on: c.enabled, foco: w.focus.current?.p.order ?? null }; });

// ---------- desktop ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  console.log('\n== desktop');
  await page.goto(srv.url + '/bastidor.html?encontros=nenhum');
  await passo('credencial e botoes de entrada', async () => {
    await page.waitForSelector('.entrar-som', { state: 'visible', timeout: 15000 });
    exigir(await page.isVisible('.cracha-giro'), 'credencial nao apareceu');
  });
  await passo('entrar sem som: giro de abertura e controles ligados', async () => {
    await page.click('.entrar-mudo');
    await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 4000 });
    exigir(await page.isVisible('.barra'), 'barra do passeio nao apareceu');
  });
  await passo('W anda pelo corredor', async () => {
    await page.mouse.move(720, 450);
    await page.keyboard.down('w'); await page.waitForTimeout(1500); await page.keyboard.up('w'); await page.waitForTimeout(400);
    const e = await estado(page); exigir(e.s > 3, `andou so ${e.s.toFixed(1)} m`); return `${e.s.toFixed(1)} m`;
  });
  await passo('meia-volta com R: W anda pra tras de frente; outra meia-volta, volta a andar pra frente', async () => {
    await page.mouse.move(720, 450);
    const s0 = (await estado(page)).s;
    await page.keyboard.press('r'); await page.waitForTimeout(900);
    await page.keyboard.down('w'); await page.waitForTimeout(1000); await page.keyboard.up('w'); await page.waitForTimeout(400);
    const s1 = (await estado(page)).s;
    exigir(s1 < s0 - 1, `de costas, s foi de ${s0.toFixed(1)} pra ${s1.toFixed(1)}`);
    await page.keyboard.press('r'); await page.waitForTimeout(900);
    await page.keyboard.down('w'); await page.waitForTimeout(1000); await page.keyboard.up('w'); await page.waitForTimeout(400);
    const s2 = (await estado(page)).s;
    exigir(s2 > s1 + 1, `de frente de novo, s foi de ${s1.toFixed(1)} pra ${s2.toFixed(1)}`);
    return `${s0.toFixed(1)} -> ${s1.toFixed(1)} -> ${s2.toFixed(1)} m`;
  });
  await passo('clique numa copia: foco, versao grande, setas e Esc', async () => {
    const mira = () => page.evaluate(() => { const w = window.__bastidor.world;
      for (const it of w.prints.items) { const v = it.mesh.position.clone().project(w.camera); const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight;
        if (v.z < 1 && x > 200 && x < 1240 && w.camera.position.distanceTo(it.mesh.position) < 8) return [x, y]; } return null; });
    let a = await mira(); exigir(a, 'nenhuma copia na tela');
    await page.mouse.move(a[0], a[1]); await page.waitForTimeout(1200); a = await mira();
    await page.mouse.click(a[0], a[1]); await page.waitForTimeout(1300);
    const e1 = await estado(page); exigir(e1.foco !== null, 'nao entrou em foco');
    await page.waitForFunction(() => /-(lg|md)\.webp$/.test(window.__bastidor.world.focus.current?.material.map?.userData?.src || window.__bastidor.world.focus.current?.material.map?.image?.src || ''), null, { timeout: 8000 });
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1100);
    exigir((await estado(page)).foco === e1.foco + 1, 'seta nao foi pra proxima');
    await page.keyboard.press('Escape'); await page.waitForTimeout(900);
    const e2 = await estado(page); exigir(e2.foco === null && e2.on, 'Esc nao devolveu ao trilho');
  });
  await passo('clicar na setlist da parede abre a setlist com o mapa', async () => {
    await page.evaluate(() => { const w = window.__bastidor.world; w.controls.state.s = 0.3; w.controls.setYaw(70 * Math.PI / 180); });
    await page.mouse.move(720, 450); await page.waitForTimeout(900);
    const alvo = () => page.evaluate(() => { const w = window.__bastidor.world; const v = w.dressing.sheet.position.clone().project(w.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
    let a = await alvo(); await page.mouse.move(a[0], a[1]); await page.waitForTimeout(1000); a = await alvo();
    await page.mouse.click(a[0], a[1]); await page.waitForTimeout(400);
    exigir(await page.isVisible('.setlist'), 'setlist nao abriu pelo clique na folha');
    exigir(await page.locator('.setlist-mapa .mapa-ala').count() === await page.evaluate(() => window.__bastidor.plan.alas.length), 'mapa sem um ponto por ala');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    exigir(!(await page.isVisible('.setlist')), 'Esc nao fechou');
  });
  await passo('setlist leva a outra ala (blecaute)', async () => {
    await page.click('.barra-setlist'); await page.waitForTimeout(200);
    exigir(await page.isVisible('.setlist'), 'setlist nao abriu');
    const nome = await page.evaluate(() => { const n = window.__bastidor.plan.alas.map(a => a.name); return n.slice().reverse().slice(3).find(x => n.filter(y => y === x).length === 1); });
    await page.locator('.setlist-lista button').filter({ hasText: new RegExp('^' + nome + '$') }).click(); await page.waitForTimeout(900);
    const alvo = await page.evaluate(n => window.__bastidor.plan.prints.find(p => p.first && p.alaName === n).s - 1.2, nome);
    const e = await estado(page); exigir(Math.abs(e.s - alvo) < 1.5 && e.on, `foi pra s=${e.s.toFixed(1)}, a ala esta em ${alvo.toFixed(1)}`); return `${nome} em ${e.s.toFixed(1)} m`;
  });
  await passo('projecao: legenda, ASSISTIR abre o player, Esc fecha', async () => {
    // os filmes do corredor sao sorteados: pega a projecao que esta no setlist desta visita
    await page.click('.barra-setlist');
    const filme = await page.evaluate(() => window.__bastidor.world.projections.screens[1].sc.film.title);
    await page.locator('.setlist-lista button').filter({ hasText: 'PROJEÇÃO · ' + filme }).first().click();
    await page.waitForTimeout(1500);
    const alvo = () => page.evaluate(() => { const w = window.__bastidor.world;
      const sc = w.projections.screens[1];
      const v = sc.screen.position.clone().project(w.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
    let a = await alvo(); await page.mouse.move(a[0], a[1]); await page.waitForTimeout(1000); a = await alvo();
    await page.mouse.click(a[0], a[1]); await page.waitForTimeout(1300);
    exigir(await page.isVisible('.legenda-assistir'), 'ASSISTIR nao apareceu');
    await page.click('.legenda-assistir'); await page.waitForTimeout(800);
    exigir(await page.evaluate(() => document.querySelector('#video-dialog').open), 'player nao abriu');
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    await page.keyboard.press('Escape'); await page.waitForTimeout(900);
    exigir((await estado(page)).on, 'nao voltou ao trilho depois do filme');
  });
  await passo('fim: porta, tela AGENDA ABERTA e volta pro bastidor', async () => {
    await page.evaluate(() => { window.__bastidor.world.controls.state.s = window.__bastidor.plan.rail.total - 2.4; });
    await page.waitForSelector('.fim', { state: 'visible', timeout: 6000 });
    await page.click('.fim-voltar'); await page.waitForTimeout(600);
    exigir((await estado(page)).on && !(await page.isVisible('.fim')), 'nao voltou');
  });
  await passo('orcamento: no maximo 96 chamadas de desenho no corredor inteiro', async () => {
    let pior = 0;
    for (let s = 0; s <= await page.evaluate(() => window.__bastidor.plan.rail.total); s += 8) for (const g of [0, -55, 55, 180]) {
      await page.evaluate(([s, g]) => { const c = window.__bastidor.world.controls.state; c.s = s; window.__bastidor.world.controls.setYaw(g * Math.PI / 180); c.lastLook = Infinity; }, [s, g]);
      await page.waitForTimeout(120);
      pior = Math.max(pior, await page.evaluate(() => window.__bastidor.world.renderer.info.render.calls));
    }
    exigir(pior <= 96, `pior caso ${pior}`); return `pior caso ${pior}`;
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
}

// ---------- credencial ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e)));
  console.log('\n== credencial');
  await page.goto(srv.url + '/bastidor.html?semente=1&encontros=nenhum');
  await page.waitForSelector('.entrar-som', { state: 'visible', timeout: 15000 });
  const foto1 = await page.getAttribute('img.cracha-foto', 'src');
  await passo('balanca sozinha', async () => {
    const tr = () => page.evaluate(() => document.querySelector('.cracha-pendulo').style.transform);
    const a = await tr(); await page.waitForTimeout(700); exigir(a !== await tr(), 'parada');
  });
  await passo('clique vira pro verso', async () => {
    const b = await page.locator('.cracha-giro').boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(1500);
    exigir(await page.getAttribute('.cracha', 'data-face') === 'verso', 'nao virou');
  });
  await passo('arrastar leva o cracha junto (cordao com fisica)', async () => {
    const b = await page.locator('.cracha-giro').boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height * .6); await page.mouse.down();
    for (let k = 1; k <= 10; k++) { await page.mouse.move(b.x + b.width / 2 + k * 14, b.y + b.height * .6); await page.waitForTimeout(16); }
    // rodada 20: o cordão tem física; o crachá anda com o dedo (translate) e balança (rotate)
    const t = await page.evaluate(() => document.querySelector('.cracha-pendulo').style.transform);
    await page.mouse.up();
    const x = parseFloat((t.match(/translate\(([-\d.]+)px/) || [])[1]), ang = parseFloat((t.match(/rotate\(([-\d.]+)rad/) || [])[1]);
    exigir(Math.abs(x) > 20 || Math.abs(ang) > .15, `nao mexeu: ${t}`);
  });
  await passo('a foto 3x4 muda com a visita', async () => {
    const q = await (await browser.newContext()).newPage();
    await q.goto(srv.url + '/bastidor.html?semente=2&encontros=nenhum'); await q.waitForSelector('img.cracha-foto');
    exigir(foto1 !== await q.getAttribute('img.cracha-foto', 'src'), 'mesma foto');
  });
  await passo('depois de entrar, fica pequena no topo', async () => {
    await page.click('.entrar-mudo'); await page.waitForTimeout(800);
    exigir(await page.locator('.cracha.mini').count() === 1, 'sem a credencial mini');
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
}

// ---------- rádio ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const erros = [], audio = []; page.on('pageerror', e => erros.push(String(e)));
  page.on('request', r => { if (/radio-\d\.mp3/.test(r.url())) audio.push(r.url()); });
  console.log('\n== rádio');
  await page.goto(srv.url + '/bastidor.html?encontros=nenhum&semente=4');
  await page.waitForSelector('.entrar-som', { state: 'visible', timeout: 15000 });
  await passo('nenhuma faixa baixada antes de entrar', async () => exigir(!audio.length, `${audio.length} pedidos de áudio`));
  await passo('entrar com som: toca e mostra a faixa', async () => {
    await page.click('.entrar-som');
    await page.waitForSelector('.radio.tocando', { timeout: 15000 });
    return await page.textContent('.radio-titulo');
  });
  await passo('as luzes pulsam com o grave da faixa', async () => {
    let pico = 0;
    for (let k = 0; k < 90; k++) { pico = Math.max(pico, await page.evaluate(() => window.__bastidor.world.sound.pulse())); await page.waitForTimeout(75); }
    exigir(pico > .15, `pico ${pico.toFixed(2)}`); return `pico ${pico.toFixed(2)}`;
  });
  await passo('▶ troca a faixa; ◀ volta', async () => {
    const a = await page.textContent('.radio-titulo');
    await page.click('.radio-prox'); await page.waitForFunction(t => document.querySelector('.radio.tocando .radio-titulo')?.textContent !== t, a, { timeout: 15000 });
    const b = await page.textContent('.radio-titulo');
    await page.click('.radio-ant'); await page.waitForFunction(t => document.querySelector('.radio.tocando .radio-titulo')?.textContent === t, a, { timeout: 15000 });
    return `${a} -> ${b} -> ${a}`;
  });
  await passo('desligar', async () => {
    await page.click('.radio-liga'); await page.waitForTimeout(300);
    exigir((await page.textContent('.radio-titulo')) === 'desligada' && !(await page.evaluate(() => window.__bastidor.world.sound.on)), 'nao desligou');
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
}

// ---------- celular ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const erros = []; page.on('pageerror', e => erros.push(String(e)));
  console.log('\n== celular');
  await page.goto(srv.url + '/bastidor.html?encontros=nenhum');
  await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 15000 });
  await page.tap('.entrar-mudo'); await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 4000 });
  const cdp = await ctx.newCDPSession(page);
  const toque = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await passo('arrastar pra cima anda, com inercia', async () => {
    await toque('touchStart', 200, 700); for (let k = 1; k <= 20; k++) { await toque('touchMove', 200, 700 - k * 25); await page.waitForTimeout(16); } await toque('touchEnd');
    const a = (await estado(page)).s; await page.waitForTimeout(1000); const b = (await estado(page)).s;
    exigir(a > 4 && b > a, `s ${a.toFixed(1)} -> ${b.toFixed(1)}`); return `${a.toFixed(1)} -> ${b.toFixed(1)} m`;
  });
  await passo('toque rapido numa copia entra em foco; arrastar sai', async () => {
    await page.waitForTimeout(2000);
    const a = await page.evaluate(() => { const w = window.__bastidor.world; let best = null, bd = 1e9;
      for (const it of w.prints.items) { const v = it.mesh.position.clone().project(w.camera); const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight; const d = w.camera.position.distanceTo(it.mesh.position);
        if (v.z < 1 && x > 30 && x < 360 && y > 100 && y < 700 && d < bd) { bd = d; best = [x, y]; } } return best; });
    exigir(a, 'nenhuma copia na tela');
    await toque('touchStart', a[0], a[1]); await page.waitForTimeout(60); await toque('touchEnd'); await page.waitForTimeout(1300);
    exigir((await estado(page)).foco !== null, 'nao entrou em foco');
    await toque('touchStart', 200, 400); for (let k = 1; k <= 6; k++) { await toque('touchMove', 200 - k * 12, 400); await page.waitForTimeout(16); } await toque('touchEnd'); await page.waitForTimeout(900);
    exigir((await estado(page)).foco === null, 'arrastar nao saiu do foco');
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
}

// ---------- menos movimento ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e)));
  console.log('\n== menos movimento');
  await page.goto(srv.url + '/bastidor.html?encontros=nenhum');
  await passo('entra sem giro e o fim troca sem clarao', async () => {
    await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 15000 });
    await page.click('.entrar-mudo'); await page.waitForTimeout(200);
    exigir((await estado(page)).on, 'controles nao ligaram na hora');
    await page.evaluate(() => { window.__bastidor.world.controls.state.s = window.__bastidor.plan.rail.total - 2.4; });
    await page.waitForSelector('.fim', { state: 'visible', timeout: 2000 });
  });
  await passo('nenhum filme tocando', async () => exigir(await page.evaluate(() => window.__bastidor.world.projections.screens.every(s => !s.video || s.video.paused)), 'tem video tocando'));
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
}

// ---------- sem 3D ----------
{
  const page = await (await browser.newContext()).newPage();
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = function () { return null; }; });
  console.log('\n== sem WebGL');
  await page.goto(srv.url + '/bastidor.html?encontros=nenhum');
  await passo('aviso com link pro acervo', async () => { await page.waitForSelector('#queda', { state: 'visible', timeout: 5000 }); });
}

await browser.close(); await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s).` : '\nBastidor funcionando.');
process.exit(falhas ? 1 : 0);
