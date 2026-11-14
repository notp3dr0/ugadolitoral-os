// Testes da rodada 8 (plano/rodada-8.md). Uso: node rodada8.mjs [bloco]   bloco = mira | volta | (vazio = todos)
// Os blocos `mira` e `volta` já estão escritos e FALHAM no ponto de partida de propósito: são os dois
// consertos (8.1 e 8.2). Os blocos dos passos 8.5 a 8.8 quem escreve é o executor, no fim de cada passo,
// seguindo o que o plano pede em "Teste". Sai 1 se falhar.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import require_fs from 'node:fs';

const so = process.argv[2] || '';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
let falhas = 0;
async function passo(nome, fn) {
  try { const extra = await fn(); console.log(`OK     ${nome}${extra ? ' · ' + extra : ''}`); }
  catch (e) { falhas++; console.log(`FALHA  ${nome} · ${String(e.message || e).split('\n')[0]}`); }
}
const exigir = (c, m) => { if (!c) throw new Error(m); };
const quer = bloco => !so || so === bloco;

/** abre o bastidor no desktop, entra sem som e devolve a página já andando */
async function entrar(query = 'semente=3&encontros=nenhum', contexto = { viewport: { width: 1440, height: 900 } }) {
  const page = await (await browser.newContext(contexto)).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/bastidor.html?${query}`);
  await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
  // andando, ou já em foco (quem chega por ?foto= cai direto na foto)
  await page.waitForFunction(() => { const w = window.__bastidor.world; return w.controls.state.enabled || w.focus.current; }, null, { timeout: 8000 });
  return { page, erros };
}
const graus = page => page.evaluate(() => +(window.__bastidor.world.controls.state.yaw * 180 / Math.PI).toFixed(1));
const mirando = page => page.evaluate(() => window.__bastidor.world.controls.state.mirando);
/** onde, na tela, está o centro da cópia mais perto à frente que esteja visível e ao alcance do clique */
const copiaNaTela = page => page.evaluate(() => {
  const w = window.__bastidor.world;
  for (const it of w.prints.items) {
    if (!it.mesh.visible) continue;
    const d = w.camera.position.distanceTo(it.mesh.position); if (d > 4.5 || d < 1.5) continue;
    const v = it.mesh.position.clone().project(w.camera); if (v.z > 1 || Math.abs(v.x) > .8 || Math.abs(v.y) > .8) continue;
    return { x: Math.round((v.x + 1) / 2 * innerWidth), y: Math.round((1 - v.y) / 2 * innerHeight), d: +d.toFixed(1) };
  }
  return null;
});

// ---------- 8.1 a mira ----------
if (quer('mira')) {
  let cursorX = 1000;
  console.log('\n== mira (8.1)');
  const { page, erros } = await entrar();
  await page.evaluate(() => { window.__bastidor.world.controls.state.s = 8; });
  await page.mouse.move(720, 450); await page.waitForTimeout(1200);
  await passo('olhar reto pro fundo do corredor nao trava o giro (a tela de filme esta longe)', async () => {
    exigir(!(await mirando(page)), 'mirando=true com o cursor no meio da tela, a mais de 8 m da projecao');
  });
  await passo('pousar numa copia perto trava o olhar', async () => {
    await page.mouse.move(1000, 450); await page.waitForTimeout(900); // vira um pouco pra direita
    const alvo = await copiaNaTela(page); exigir(alvo, 'nenhuma copia perto na tela');
    await page.mouse.move(alvo.x, alvo.y); await page.waitForTimeout(500);
    const a = await copiaNaTela(page); cursorX = a ? a.x : alvo.x; await page.mouse.move(cursorX, a ? a.y : alvo.y); await page.waitForTimeout(500);
    exigir(await mirando(page), 'cursor em cima da copia e mirando=false'); return `copia a ${alvo.d} m`;
  });
  await passo('sair da copia sem mexer o cursor de lado nao da tranco (menos de 4 graus)', async () => {
    const antes = await graus(page);
    // sobe o cursor em linha reta até o teto: mesmo x, sem alvo
    await page.mouse.move(cursorX, 40); // mesmo x de onde o cursor estava await page.waitForTimeout(1500);
    const depois = await graus(page);
    const oque = await page.evaluate(x => { const w = window.__bastidor.world, h = w.pick(x, 40, w.alvos()); return h ? `${h.object.name || h.object.type} ${Object.keys(h.object.userData).join(',')} a ${h.distance.toFixed(1)} m` : 'nada'; }, cursorX);
    const ma = await page.evaluate(async () => { const w = window.__bastidor.world, f0 = w.renderer.info.render.frame; await new Promise(r => setTimeout(r, 300)); return JSON.stringify({ ...w.mouseAt, quadros: w.renderer.info.render.frame - f0, foco: !!w.focus.current, override: !!w.override, en: w.controls.state.enabled }); });
    exigir(!(await mirando(page)), 'continuou mirando no teto: ' + oque + ' cursor ' + ma + ' x ' + cursorX);
    exigir(Math.abs(depois - antes) < 4, `o olhar pulou ${(depois - antes).toFixed(1)} graus`); return `${(depois - antes).toFixed(1)} graus`;
  });
  await passo('andar com o mouse parado solta a trava quando o alvo sai de baixo do cursor', async () => {
    await page.mouse.move(1000, 450); await page.waitForTimeout(700);
    const alvo = await copiaNaTela(page); exigir(alvo, 'nenhuma copia perto na tela');
    await page.mouse.move(alvo.x, alvo.y); await page.waitForTimeout(600);
    await page.keyboard.down('w'); await page.waitForTimeout(3500); await page.keyboard.up('w'); await page.waitForTimeout(300);
    const temAlvo = await page.evaluate(([x, y]) => { const w = window.__bastidor.world; return w.perto(w.pick(x, y, w.alvos())); }, [alvo.x, alvo.y]);
    exigir(temAlvo || !(await mirando(page)), 'mirando ficou true sem alvo nenhum embaixo do cursor');
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await page.context().close();
}

// ---------- 8.2 a volta do fim ----------
if (quer('volta')) {
  console.log('\n== volta do fim (8.2)');
  const { page, erros } = await entrar();
  await passo('VOLTAR PRO BASTIDOR cai no ultimo lance, qualquer que seja o tamanho do corredor', async () => {
    await page.evaluate(() => { const w = window.__bastidor.world; w.controls.state.s = w.plan.rail.total - 3; });
    await page.keyboard.down('w'); await page.waitForSelector('.fim:not([hidden])', { timeout: 12000 }); await page.keyboard.up('w');
    await page.click('.fim-voltar'); await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const w = window.__bastidor.world, ult = Math.max(...w.plan.prints.map(q => q.lance));
      const primeira = w.plan.prints.find(q => q.lance === ult); return { s: w.controls.state.s, esperado: Math.max(0, primeira.s - 2), on: w.controls.state.enabled }; });
    exigir(r.on, 'controles nao religaram'); exigir(Math.abs(r.s - r.esperado) < 1, `voltou pra s=${r.s.toFixed(1)}, o ultimo lance comeca em ${r.esperado.toFixed(1)}`);
    return `s=${r.s.toFixed(1)}`;
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await page.context().close();
}

// ---------- 8.5 link direto ----------
if (quer('link')) {
  console.log('\n== link direto (8.5)');
  const desk = { viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] };
  {
    const { page, erros } = await entrar('foto=kayg-03&encontros=nenhum', desk);
    await passo('?foto=kayg-03 chega em foco na foto certa', async () => {
      await page.waitForFunction(() => window.__bastidor.world.focus.current, null, { timeout: 6000 });
      const r = await page.evaluate(() => { const w = window.__bastidor.world; return { slug: w.slugOf(w.focus.current.p.photo), nome: document.querySelector('.legenda-nome').textContent }; });
      exigir(r.slug === 'kayg-03', `focou ${r.slug}`); exigir(/kayg/i.test(r.nome), `legenda: ${r.nome}`); return r.nome;
    });
    await passo('a barra de endereco mostra a foto em foco, e limpa ao sair', async () => {
      exigir(/foto=kayg-03/.test(await page.evaluate(() => location.search)), 'sem foto= na barra');
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1100);
      const outra = await page.evaluate(() => location.search); exigir(/foto=/.test(outra) && !/kayg-03/.test(outra), `depois da seta: ${outra}`);
      await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
      const fora = await page.evaluate(() => location.search); exigir(!/foto=/.test(fora), `fora do foco ainda tem ${fora}`);
    });
    await passo('COPIAR LINK copia o endereco da foto e vira COPIADO', async () => {
      await page.evaluate(() => { const w = window.__bastidor.world; w.focus.enter(w.prints.items[5]); }); await page.waitForTimeout(1000);
      await page.click('.legenda-link'); await page.waitForTimeout(150);
      const txt = await page.textContent('.legenda-link');
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      const slug = await page.evaluate(() => { const w = window.__bastidor.world; return w.slugOf(w.prints.items[5].p.photo); });
      exigir(txt === 'COPIADO', `botao diz ${txt}`); exigir(clip.endsWith('?foto=' + slug), `clipboard: ${clip}`); return clip.replace(/^https?:\/\/[^/]+/, '');
    });
    await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
    await page.context().close();
  }
  {
    const { page } = await entrar('ala=matue&encontros=nenhum', desk);
    await passo('?ala=matue chega na primeira copia do Matue', async () => {
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => { const w = window.__bastidor.world, p = w.plan.prints.find(q => q.first && q.photo.galleryId === 'matue'); return { s: w.controls.state.s, alvo: p.s }; });
      exigir(Math.abs(r.s - r.alvo) < 2, `s=${r.s.toFixed(1)}, a ala esta em ${r.alvo.toFixed(1)}`); return `s=${r.s.toFixed(1)}`;
    });
    await page.context().close();
  }
  {
    const { page, erros } = await entrar('foto=nao-existe&encontros=nenhum');
    await passo('slug que nao existe: entra normal', async () => {
      await page.waitForTimeout(800);
      exigir(!(await page.evaluate(() => window.__bastidor.world.focus.current)), 'entrou em foco em algo');
      exigir(!erros.length, erros[0]);
    });
    await page.context().close();
  }
}

// ---------- 8.6 chamado no foco ----------
if (quer('chamado')) {
  console.log('\n== chamado (8.6)');
  const { page, erros } = await entrar();
  const visivel = () => page.evaluate(() => { const a = document.querySelector('.legenda-chamado'); return !a.hidden && getComputedStyle(a).opacity > .5; });
  await passo('foto com artista: o chamado espera 2,5 s e leva pro WhatsApp com o nome', async () => {
    const artista = await page.evaluate(() => { const w = window.__bastidor.world, it = w.prints.items.find(i => i.p.photo.artist); w.focus.enter(it); return it.p.photo.artist; });
    await page.waitForTimeout(500); exigir(!(await visivel()), 'apareceu antes da hora');
    await page.waitForTimeout(2700); exigir(await visivel(), 'nao apareceu em 3,2 s');
    const href = await page.getAttribute('.legenda-chamado', 'href');
    exigir(href.includes('wa.me/5512982612374'), href); exigir(href.includes(encodeURIComponent(artista)), `sem ${artista} no texto`); return artista;
  });
  await passo('trocar de foto reinicia a espera', async () => {
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
    exigir(!(await visivel()), 'continuou visivel logo depois da troca');
  });
  await passo('projecao de filme: sem chamado', async () => {
    await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const w = window.__bastidor.world; w.hud.filmCaption(w.projections.screens[0]); });
    await page.waitForTimeout(3000); exigir(!(await visivel()), 'chamado na legenda de filme');
    await page.evaluate(() => window.__bastidor.world.hud.filmCaption(null));
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await page.context().close();
}

// ---------- 8.7 folha de contato ----------
if (quer('folha')) {
  console.log('\n== folha de contato (8.7)');
  const { page, erros } = await entrar('semente=3&encontros=nenhum', { viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await passo('sem foto vista: o botao da barra nao aparece', async () => exigir(!(await page.isVisible('.barra-folha')), 'FOLHA na barra antes de ver foto'));
  await passo('tres fotos vistas: FOLHA · 3 na barra', async () => {
    for (const [n, ms] of [[2, 400], [7, 1200], [11, 400]]) {
      await page.evaluate(n => { const w = window.__bastidor.world; w.focus.enter(w.prints.items[n], .01); }, n); await page.waitForTimeout(ms);
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
    const txt = await page.textContent('.barra-folha'); exigir(txt === 'FOLHA · 3', `barra diz "${txt}"`); return txt;
  });
  await passo('abrir: canvas 1080x1920, foto no primeiro quadro, circulo vermelho, imagem > 60 KB', async () => {
    await page.click('.barra-folha'); await page.waitForSelector('.folha:not([hidden]) canvas', { timeout: 8000 });
    const r = await page.evaluate(async () => {
      const cv = document.querySelector('.folha canvas'), c = cv.getContext('2d');
      const px = (x, y) => [...c.getImageData(x, y, 1, 1).data];
      // centro do primeiro quadro: x 40 + (250-216)/2 + 108, y da primeira tira + 28 + 108
      const gap = (1790 - 250 - 5 * 300) / 6, y1 = 250 + gap + 28 + 108;
      const centro = px(40 + 17 + 108, Math.round(y1));
      // procura vermelho do lapis na area das tiras
      const area = c.getImageData(0, 250, 1080, 1540).data; let vermelho = 0;
      for (let k = 0; k < area.length; k += 4) if (area[k] > 200 && area[k + 1] < 60 && area[k + 2] < 60) vermelho++;
      const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', .92));
      return { w: cv.width, h: cv.height, centro, vermelho, kb: Math.round(blob.size / 1024) };
    });
    exigir(r.w === 1080 && r.h === 1920, `canvas ${r.w}x${r.h}`);
    exigir(r.centro.slice(0, 3).some(v => v > 30), `primeiro quadro preto: ${r.centro}`);
    exigir(r.vermelho > 200, `so ${r.vermelho} pixels vermelhos na area das tiras`);
    exigir(r.kb > 60, `imagem com ${r.kb} KB`); return `${r.kb} KB, ${r.vermelho} px de lapis`;
  });
  await passo('SALVAR IMAGEM baixa um jpg', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 6000 }), page.click('.folha-salvar')]);
    exigir(/\.jpg$/.test(dl.suggestedFilename()), dl.suggestedFilename()); return dl.suggestedFilename();
  });
  await passo('Esc fecha e os controles voltam', async () => {
    await page.screenshot({ path: 'saida/r8-folha-tela.png' });
    await page.evaluate(async () => { const cv = document.querySelector('.folha canvas'); window.__folhaPng = cv.toDataURL('image/jpeg', .9); });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    exigir(!(await page.isVisible('.folha')), 'folha continuou aberta');
    exigir(await page.evaluate(() => window.__bastidor.world.controls.state.enabled), 'controles nao voltaram');
  });
  await passo('recarregar a pagina mantem a folha', async () => {
    const img = await page.evaluate(() => window.__folhaPng);
    require_fs.writeFileSync('saida/r8-folha.jpg', Buffer.from(img.split(',')[1], 'base64'));
    await page.reload(); await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
    await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 8000 });
    const txt = await page.textContent('.barra-folha'); exigir(txt === 'FOLHA · 3', `depois de recarregar: "${txt}"`);
  });
  await passo('no fim: SUA FOLHA DE CONTATO', async () => {
    await page.evaluate(() => { const w = window.__bastidor.world; w.controls.state.s = w.plan.rail.total - 3; });
    await page.keyboard.down('w'); await page.waitForSelector('.fim:not([hidden])', { timeout: 12000 }); await page.keyboard.up('w');
    exigir(await page.isVisible('.fim-folha'), 'botao da folha nao apareceu no fim');
    exigir(!(await page.isVisible('.fim-frase-folha')), 'frase de "nenhuma" apareceu com 3 fotos');
    await page.click('.fim-folha'); await page.waitForSelector('.folha:not([hidden]) canvas', { timeout: 8000 });
    await page.keyboard.press('Escape');
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await page.context().close();
}

// ---------- 8.8 giroscópio ----------
if (quer('giro')) {
  console.log('\n== giroscopio (8.8)');
  const cel = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const { page, erros } = await entrar('semente=3&encontros=nenhum', cel);
  const girar = (alpha, beta = 60) => page.evaluate(([a, b]) => dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: a, beta: b, gamma: 0 })), [alpha, beta]);
  const alvo = () => page.evaluate(() => window.__bastidor.world.controls.state.yawTarget * 180 / Math.PI);
  await passo('o botao GIRO aparece no celular', async () => exigir(await page.isVisible('.barra-giro'), 'sem botao GIRO'));
  await passo('ligado: virar o aparelho 30 graus vira o olhar 30 graus', async () => {
    await page.click('.barra-giro'); // a permissão (iPhone, Chrome novo) é assíncrona
    await page.waitForFunction(() => document.querySelector('.barra-giro')?.classList.contains('aceso'), null, { timeout: 3000 }).catch(() => { throw new Error('botao nao acendeu'); });
    await girar(10); await page.waitForTimeout(80); const a0 = await alvo();
    await girar(40); await page.waitForTimeout(80); const a1 = await alvo();
    exigir(Math.abs((a1 - a0) - 30) < 2, `virou ${(a1 - a0).toFixed(1)} graus`); return `${(a1 - a0).toFixed(1)} graus`;
  });
  await passo('passando pelo 0/360 nao da volta inteira', async () => {
    await girar(350); await page.waitForTimeout(60); const a0 = await alvo();
    await girar(5); await page.waitForTimeout(60); const a1 = await alvo();
    exigir(Math.abs((a1 - a0) - 15) < 2, `virou ${(a1 - a0).toFixed(1)} graus`);
  });
  await passo('desligado: o aparelho nao mexe mais no olhar', async () => {
    await page.click('.barra-giro'); await page.waitForFunction(() => !window.__bastidor.world.controls.gyroOn, null, { timeout: 3000 }); const a0 = await alvo();
    await girar(120); await page.waitForTimeout(80);
    exigir(Math.abs((await alvo()) - a0) < .5, 'mexeu com o giro desligado');
  });
  await passo('nenhum erro no console', async () => exigir(!erros.length, erros[0]));
  await page.context().close();
  {
    const { page: p2 } = await entrar('semente=3&encontros=nenhum');
    await passo('no desktop nao tem GIRO', async () => exigir(!(await p2.isVisible('.barra-giro')), 'GIRO no desktop'));
    await p2.context().close();
  }
}


// (o executor acrescenta um bloco por passo aqui, com `if (quer('link'))`, `quer('chamado')`, `quer('folha')`, `quer('giro')`)

await browser.close(); await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s).` : '\nRodada 8 funcionando.');
process.exit(falhas ? 1 : 0);
