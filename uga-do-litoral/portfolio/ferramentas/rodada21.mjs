// Rodada 21: foto dentro do nome (padrão), nomes da INFO clicáveis, OUVIR O SHOW, fotômetro (segurar no vazio),
// monitor que troca de câmera com o artista em foco, 404 de corredor e FOTOGRAFAR no bastidor.
// Prints e a foto do bastidor em saida/r21/. Uso: node rodada21.mjs
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync, readFileSync } from 'node:fs';
const tamanhoJpeg = b => { for (let i = 2; i < b.length - 9; i++) if (b[i] === 0xFF && (b[i + 1] === 0xC0 || b[i + 1] === 0xC2)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; return null; };
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
mkdirSync('saida/r21', { recursive: true });
const TELAS = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
let falhas = 0;
const passo = async (nome, fn) => { try { const r = await fn(); console.log('OK    ', nome, r ? '· ' + r : ''); } catch (e) { falhas++; console.log('FALHA ', nome, '·', String(e.message || e).split('\n')[0]); } };
const exigir = (c, m) => { if (!c) throw new Error(m); };
const menorLetra = page => page.evaluate(() => {
  let menor = 99, quem = '';
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode; if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el || !el.getClientRects().length) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0 || el.closest('[hidden],[aria-hidden="true"]')) continue;
    const f = parseFloat(cs.fontSize); if (f < menor) { menor = f; quem = (el.className || el.tagName) + ': ' + n.textContent.trim().slice(0, 30); }
  }
  return { menor, quem };
});

for (const [tela, opts] of Object.entries(TELAS)) {
  const ctx = await browser.newContext({ ...opts, acceptDownloads: true });
  const page = await ctx.newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });

  // 1. a foto dentro do nome, por padrão
  await page.goto(`${srv.url}/?semente=3`);
  await page.waitForFunction(() => window.portfolioIntroComplete === true, null, { timeout: 9000 });
  await passo(`${tela}: a foto mora dentro de PEDRO AUGUSTO (padrão)`, async () => {
    await page.waitForSelector('#portfolio-intro.letras-foto.revela', { timeout: 6000 });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `saida/r21/letras-${tela}.png` });
  });
  // 2. OUVIR O SHOW saiu (2026-11-18, o Pedro não quis som na página inicial)
  await passo(`${tela}: sem OUVIR O SHOW na página inicial`, async () => exigir(await page.locator('.som-show').count() === 0, 'o botão ainda está lá'));
  // 3. o monitor reage ao artista em foco
  await page.mouse.wheel(0, 900); await page.waitForTimeout(1500);
  await passo(`${tela}: o monitor troca pra CAM da ala do artista em foco`, async () => {
    const artista = await page.evaluate(async () => {
      const { photos } = await import('./js/data.js');
      const p = photos.find(x => x.artist);
      document.dispatchEvent(new CustomEvent('acervo:foco', { detail: { card: null, photo: p } }));
      return p.artist;
    });
    await page.waitForTimeout(300);
    const cam = await page.textContent('.monitor .monitor-cam, .monitor [class*="cam"]').catch(() => '');
    exigir(cam && cam.toUpperCase().includes(artista.toUpperCase()), `câmera: "${cam}"`);
    if (await page.isVisible('.monitor.visivel')) { const r = await page.locator('.monitor').boundingBox(); await page.screenshot({ path: `saida/r21/monitor-${tela}.png`, clip: { x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 20), width: Math.min(opts.viewport.width, r.width + 40), height: r.height + 40 } }); }
    return cam;
  });
  // 4. o fotômetro: segurar no vazio entre as fotos e soltar rearruma a colagem
  await passo(`${tela}: segurar no vazio mede a luz; soltar dispara e rearruma`, async () => {
    const ponto = await page.evaluate(() => {
      const pf = document.querySelector('#portfolio');
      for (let y = 160; y < innerHeight - 60; y += 23) for (let x = 20; x < innerWidth - 20; x += 23) {
        // folga em volta: o celular puxa o toque pro card mais perto (ajuste de toque do Chrome)
        const vazio = (a, b) => { const el = document.elementFromPoint(a, b); return el && pf.contains(el) && !el.closest('.media, a, button, video'); };
        if ([[0, 0], [-26, 0], [26, 0], [0, -26], [0, 26]].every(([dx, dy]) => vazio(x + dx, y + dy))) return { x, y };
      }
      return null;
    });
    exigir(ponto, 'não achei espaço vazio na colagem');
    const antes = await page.$$eval('#portfolio > .media', cs => cs.slice(0, 8).map(c => c.dataset.i || c.querySelector('img')?.getAttribute('src')).join('|'));
    if (opts.hasTouch) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ponto.x, y: ponto.y }] });
      await page.waitForTimeout(800);
      exigir(await page.isVisible('.fotometro.medindo'), 'o fotômetro não apareceu');
      await page.screenshot({ path: `saida/r21/fotometro-${tela}.png` });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(ponto.x, ponto.y); await page.mouse.down(); await page.waitForTimeout(800);
      exigir(await page.isVisible('.fotometro.medindo'), 'o fotômetro não apareceu');
      await page.screenshot({ path: `saida/r21/fotometro-${tela}.png` });
      await page.mouse.up();
    }
    await page.waitForTimeout(160); await page.screenshot({ path: `saida/r21/fotometro-flash-${tela}.png` });
    await page.waitForTimeout(900);
    const depois = await page.$$eval('#portfolio > .media', cs => cs.slice(0, 8).map(c => c.dataset.i || c.querySelector('img')?.getAttribute('src')).join('|'));
    exigir(antes !== depois, 'a colagem não mudou');
    const n = await page.$$eval('#portfolio > .media', cs => cs.filter(c => getComputedStyle(c).display !== 'none').length);
    exigir(n === 42, `${n} na colagem depois`);
    exigir((await page.$$('.colagem-fim')).length === 1, 'convite duplicado');
  });
  await passo(`${tela}: nada abaixo de 11 px na home`, async () => { const r = await menorLetra(page); exigir(r.menor >= 11, `${r.menor}px em ${r.quem}`); return `${r.menor}px`; });

  // 5. INFO: os nomes abrem a galeria
  await page.goto(`${srv.url}/?semente=3#info`); await page.waitForTimeout(1800);
  await passo(`${tela}: na INFO, os nomes de JÁ REGISTREI abrem a galeria do artista`, async () => {
    const n = await page.locator('.info-artista').count();
    exigir(n >= 5, `${n} nomes clicáveis`);
    await page.locator('.info-nomes').scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
    await page.screenshot({ path: `saida/r21/info-${tela}.png` });
    const nome = (await page.locator('.info-artista').nth(1).textContent()).trim();
    await page.locator('.info-artista').nth(1).click(); await page.waitForTimeout(1200);
    exigir(await page.evaluate(() => document.querySelector('#gallery-dialog')?.open), 'a galeria não abriu');
    const t = (await page.textContent('#gallery-dialog')).toUpperCase();
    await page.screenshot({ path: `saida/r21/info-galeria-${tela}.png` });
    exigir(t.includes(nome.toUpperCase().slice(0, 4)), `galeria sem "${nome}"`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    return `${n} nomes; abriu ${nome}`;
  });
  await passo(`${tela}: nada abaixo de 11 px na INFO`, async () => { const r = await menorLetra(page); exigir(r.menor >= 11, `${r.menor}px em ${r.quem}`); return `${r.menor}px`; });
  // 6. ?letras=branco volta pro branco
  await page.goto(`${srv.url}/?semente=3&letras=branco`);
  await page.waitForFunction(() => window.portfolioIntroComplete === true, null, { timeout: 9000 }); await page.waitForTimeout(900);
  await passo(`${tela}: ?letras=branco desliga a foto no nome`, async () => exigir(!(await page.$('#portfolio-intro.letras-foto')), 'ainda com foto'));

  // 7. 404
  await page.goto(`${srv.url}/404.html`); await page.waitForTimeout(1200);
  await passo(`${tela}: 404 do corredor errado`, async () => {
    exigir((await page.textContent('h1')).includes('corredor'), 'sem título');
    exigir(await page.locator('.acoes a').count() === 2, 'sem os dois caminhos');
    await page.screenshot({ path: `saida/r21/404-${tela}.png`, fullPage: true });
    const r = await menorLetra(page); exigir(r.menor >= 11, `${r.menor}px em ${r.quem}`);
  });

  // 8. FOTOGRAFAR no bastidor
  await page.goto(`${srv.url}/bastidor.html?encontros=nenhum&semente=2`);
  await page.click('.entrar-mudo');
  await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 6000 });
  await page.evaluate(() => { window.__bastidor.world.controls.state.s = 30; });
  await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 6000 });
  await page.waitForTimeout(1800);
  await passo(`${tela}: FOTOGRAFAR entrega o corredor em 1080 x 1920`, async () => {
    const b = page.locator('.barra-foto');
    exigir(await b.isVisible(), 'sem o botão');
    await page.screenshot({ path: `saida/r21/bastidor-barra-${tela}.png` });
    if (opts.hasTouch) {
      // no celular a foto vai pro menu de compartilhar (lá tem "Salvar imagem"): aqui o menu é de mentira e guarda o arquivo
      await page.evaluate(() => { navigator.canShare = () => true; navigator.share = async d => { window.__foto = d.files[0]; }; });
      await b.click();
      await page.waitForFunction(() => window.__foto, null, { timeout: 15000 });
      const [nome, b64] = await page.evaluate(async () => { const f = window.__foto; const u8 = new Uint8Array(await f.arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192)); return [f.name, btoa(s)]; });
      const buf = Buffer.from(b64, 'base64'); const destino = `saida/r21/foto-bastidor-${tela}.jpg`;
      (await import('node:fs')).writeFileSync(destino, buf);
      const dims = tamanhoJpeg(buf); exigir(dims && dims[0] === 1080 && dims[1] === 1920, `tamanho ${dims}`);
      return `${nome} · ${dims.join('x')} · ${(buf.length / 1024 | 0)} KB`;
    }
    const baixou = page.waitForEvent('download', { timeout: 15000 });
    await b.click();
    const d = await baixou;
    const destino = `saida/r21/foto-bastidor-${tela}.jpg`; await d.saveAs(destino);
    const buf = readFileSync(destino), dims = tamanhoJpeg(buf);
    exigir(dims && dims[0] === 1080 && dims[1] === 1920, `tamanho ${dims}`);
    return `${d.suggestedFilename()} · ${dims.join('x')} · ${(buf.length / 1024 | 0)} KB`;
  });
  await passo(`${tela}: o corredor continua do mesmo tamanho depois da foto`, async () => {
    const [w, h, iw, ih] = await page.evaluate(() => { const c = document.querySelector('#palco3d'); return [c.width, c.height, innerWidth, innerHeight]; });
    exigir(w !== 1080 || h !== 1920, 'ficou no tamanho da foto');
    exigir(Math.abs(w / h - iw / ih) < .02, `proporção ${w}x${h}`);
    await page.waitForTimeout(400); await page.screenshot({ path: `saida/r21/bastidor-depois-${tela}.png` });
    return `${w}x${h}`;
  });
  await passo(`${tela}: nenhum erro`, async () => exigir(!erros.length, erros[0]));
  await ctx.close();
}
await browser.close(); await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
