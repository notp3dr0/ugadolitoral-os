// Teste dos encontros do bastidor (rodada 6): sorteio, cada cena forçada, falas e desfechos.
// Uso: node encontros.mjs [pasta=../site-lab] [cena ...]   (sem cena: todas). Sai 1 se falhar.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';

const args = process.argv.slice(2);
const pasta = args[0] && args[0].startsWith('.') ? args.shift() : '../site-lab';
const so = new Set(args);
const quer = id => !so.size || so.has(id);
const srv = await servir(pasta);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
let falhas = 0;
async function passo(nome, fn) {
  try { const extra = await fn(); console.log(`OK     ${nome}${extra ? ' · ' + extra : ''}`); }
  catch (e) { falhas++; console.log(`FALHA  ${nome} · ${String(e.message || e).split('\n')[0]}`); }
}
const exigir = (c, m) => { if (!c) throw new Error(m); };

/** abre o bastidor com uma cena forçada, entra sem som e devolve a página e ajudantes */
async function abrir(id, extra = '', viewport = { width: 1440, height: 900 }) {
  const page = await (await browser.newContext({ viewport })).newPage();
  const erros = [], falas = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.exposeFunction('__fala', t => falas.push(t));
  await page.goto(`${srv.url}/bastidor.html?encontros=${id}&semente=5${extra}${process.env.EXTRA || ""}`);
  await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 15000 });
  await page.click('.entrar-mudo');
  await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 5000 });
  await page.evaluate(() => {
    const el = document.querySelector('.fala-texto');
    let last = '';
    new MutationObserver(() => { if (el.textContent && el.textContent !== last) { last = el.textContent; window.__fala(last); } }).observe(el, { childList: true, characterData: true, subtree: true });
  });
  const est = () => page.evaluate(() => window.__bastidor.world.encounters.estado()[0]);
  const s = () => page.evaluate(() => window.__bastidor.world.controls.state.s);
  const irPara = v => page.evaluate(v => { window.__bastidor.world.controls.state.s = v; }, v);
  const andar = async ms => { await page.mouse.move(720, 450); await page.keyboard.down('w'); await page.waitForTimeout(ms); await page.keyboard.up('w'); };
  const esperarFala = (txt, ms = 9000) => page.waitForFunction(t => [...document.querySelectorAll('.fala-texto')].some(e => e.textContent === t), txt, { timeout: ms });
  return { page, erros, falas, est, s, irPara, andar, esperarFala };
}

// ---------- sorteio ----------
await passo('sorteio: 3 cenas + 1 achado, sempre com agua ou seguranca, e muda com a semente', async () => {
  const page = await (await browser.newContext()).newPage();
  const vistos = new Set();
  for (let k = 1; k <= 30; k++) {
    await page.goto(`${srv.url}/bastidor.html?semente=${k}`);
    await page.waitForFunction(() => window.__bastidor?.world?.encounters, null, { timeout: 10000 });
    const ids = await page.evaluate(() => window.__bastidor.world.encounters.ids);
    const cenas = ids.filter(i => !['lista', 'semflash'].includes(i)), achados = ids.filter(i => ['lista', 'semflash'].includes(i));
    exigir(cenas.length === 3 && achados.length <= 1, `semente ${k}: ${ids}`);
    exigir(cenas.includes('agua') || cenas.includes('seguranca'), `semente ${k} sem agua nem seguranca: ${ids}`);
    vistos.add(ids.join());
  }
  exigir(vistos.size > 10, `so ${vistos.size} combinacoes em 30 visitas`);
  return `${vistos.size} combinacoes diferentes em 30 visitas`;
});

// ---------- a água ----------
if (quer('agua')) {
  console.log('\n== agua');
  const t = await abrir('agua');
  await passo('chegando: "Agua? E so pra artista."', async () => {
    const { gatilho } = await t.est(); await t.irPara(gatilho - 1); await t.andar(900);
    await t.esperarFala('Água? É só pra artista.');
  });
  await passo('clicar na garrafa: "Fotografo bebe luz, nao bebe?" e depois o bebedouro ou a garrafa', async () => {
    const clicar = () => t.page.evaluate(() => { const w = window.__bastidor.world; const c = w.encounters.clickables().find(o => o.visible); w.encounters.click(c); });
    await clicar(); await t.esperarFala('Fotógrafo bebe luz, não bebe?');
    await clicar(); await t.page.waitForFunction(() => /bebedouro|Toma\./.test(document.querySelector('.fala-texto').textContent), null, { timeout: 9000 });
    return await t.page.textContent('.fala-texto');
  });
  await t.page.screenshot({ path: 'saida/r6-agua.png' });
  await passo('nenhum erro', async () => exigir(!t.erros.length, t.erros[0]));
}

// ---------- o segurança ----------
if (quer('seguranca')) {
  console.log('\n== seguranca');
  const t = await abrir('seguranca');
  let parar = 0;
  await passo('barra: nao passa antes de responder', async () => {
    const { gatilho } = await t.est(); parar = gatilho + .05;
    await t.irPara(gatilho - 1.5); await t.andar(2500);
    await t.esperarFala('Você é o quê do evento?');
    const s = await t.s(); exigir(s <= parar + .05, `passou: s ${s.toFixed(2)} > ${parar.toFixed(2)}`);
    return `parou em ${s.toFixed(2)} m`;
  });
  await t.page.screenshot({ path: 'saida/r6-seguranca.png' });
  await passo('respondeu FOTOGRAFO: silencio, "Fotografo de quem?", "Pode ir." e libera', async () => {
    await t.page.click('.fala-opcoes button >> nth=0');
    await t.esperarFala('Fotógrafo de quem?', 6000);
    await t.esperarFala('Pode ir.', 16000);
    await t.page.waitForTimeout(400);
    await t.andar(1500);
    const s = await t.s(); exigir(s > parar + 1, `nao liberou: s ${s.toFixed(2)}`);
  });
  await passo('nenhum erro', async () => exigir(!t.erros.length, t.erros[0]));
  const u = await abrir('seguranca', '&x=2');
  await passo('sem resposta em 8 s: "Vai, vai." e libera sozinho', async () => {
    const { gatilho } = await u.est(); await u.irPara(gatilho - 1); await u.andar(1200);
    await u.esperarFala('Você é o quê do evento?');
    await u.esperarFala('Vai, vai.', 11000);
    await u.page.waitForTimeout(600); await u.andar(1500);
    exigir((await u.s()) > gatilho + 1, 'nao liberou');
  });
  await passo('mostrar a pulseira: a pulseira sobe do pe da tela', async () => {
    const v = await abrir('seguranca', '&x=3');
    const { gatilho } = await v.est(); await v.irPara(gatilho - 1); await v.andar(1200);
    await v.esperarFala('Você é o quê do evento?');
    await v.page.click('.fala-opcoes button >> nth=2');
    await v.page.waitForSelector('.braco', { state: 'visible', timeout: 6000 });
    exigir(await v.page.isVisible('.braco img[src*="pulseira"]'), 'a pulseira nao apareceu'); // rodada 19: sem braço, so a pulseira (render)
    await v.page.waitForTimeout(500);
    await v.page.screenshot({ path: 'saida/r7-braco.png' });
    await v.esperarFala('É a de hoje mesmo?', 12000);
    await v.page.waitForTimeout(3000);
    exigir(!(await v.page.isVisible('.braco')), 'o braco nao desceu');
  });
  await passo('ele barra de novo toda vez que a pessoa volta e passa', async () => {
    const v = await abrir('seguranca', '&x=4');
    const { gatilho } = await v.est();
    for (const vez of [1, 2]) {
      await v.irPara(gatilho - 1); await v.andar(1200);
      await v.esperarFala(vez === 1 ? 'Você é o quê do evento?' : 'De novo. Você é o quê do evento?', 9000);
      exigir((await v.est()).vezes === vez, `era a vez ${vez}, o encontro conta ${(await v.est()).vezes}`);
      await v.page.click('.fala-opcoes button >> nth=0');
      await v.esperarFala('Vai.', 14000).catch(() => {});
      await v.page.waitForTimeout(800);
      await v.irPara(gatilho - 9);   // volta pra trás: re-arma
      await v.page.waitForTimeout(400);
    }
    return 'barrou nas duas passagens';
  });
}

// ---------- "tira uma minha?" ----------
if (quer('foto')) {
  console.log('\n== foto');
  const t = await abrir('foto');
  await passo('pede a foto; FOTOGRAFAR dispara o flash e "Manda no meu insta, ta?"', async () => {
    const { gatilho } = await t.est(); await t.irPara(gatilho - 1); await t.andar(900);
    await t.esperarFala('Ei, fotógrafo! Tira uma minha?');
    await t.page.screenshot({ path: 'saida/r6-foto.png' });
    await t.page.click('.fala-opcoes button >> nth=0');
    await t.esperarFala('Manda no meu insta, tá?', 4000);
  });
  const u = await abrir('foto', '&x=2');
  await passo('ignorou e passou: "Nem pra isso serve."', async () => {
    const { gatilho } = await u.est(); await u.irPara(gatilho - 1); await u.andar(900);
    await u.esperarFala('Ei, fotógrafo! Tira uma minha?');
    await u.irPara(gatilho + 4.6);
    await u.esperarFala('Nem pra isso serve.', 12000);
  });
  await passo('nenhum erro', async () => exigir(!t.erros.length && !u.erros.length, t.erros[0] || u.erros[0]));
}

// ---------- cartão cheio ----------
if (quer('cartao')) {
  console.log('\n== cartao');
  const t = await abrir('cartao');
  await passo('na ala maior: visor com CARTAO CHEIO e "Logo agora."', async () => {
    const { gatilho } = await t.est(); await t.irPara(gatilho - 1); await t.andar(900);
    await t.esperarFala('Logo agora.');
    exigir(await t.page.isVisible('.visor'), 'sem visor');
    await t.page.screenshot({ path: 'saida/r6-cartao.png' });
    await t.page.waitForTimeout(4300);
    exigir(!(await t.page.isVisible('.visor')), 'visor nao sumiu');
  });
}

// ---------- passagem de som ----------
if (quer('som')) {
  console.log('\n== som');
  const t = await abrir('som');
  await passo('escurece, TESTANDO. UM. DOIS. SOM., a luz volta e "Ta bom ai, fotografo?"', async () => {
    const { gatilho } = await t.est(); await t.irPara(gatilho - 1); await t.andar(900);
    await t.esperarFala('TESTANDO.');
    const escuro = await t.page.evaluate(() => getComputedStyle(document.querySelector('.penumbra')).opacity);
    await t.page.screenshot({ path: 'saida/r6-som.png' });
    await t.esperarFala('Tá bom aí, fotógrafo?', 8000);
    const claro = await t.page.evaluate(() => getComputedStyle(document.querySelector('.penumbra')).opacity);
    exigir(Number(escuro) > .5 && Number(claro) < .1, `penumbra ${escuro} -> ${claro}`);
    exigir(['TESTANDO.', 'UM.', 'DOIS.', 'SOM.'].every(w => t.falas.includes(w)), `falas: ${t.falas.join(' ')}`);
  });
}

// ---------- o artista passando ----------
if (quer('artista')) {
  console.log('\n== artista');
  const t = await abrir('artista');
  await passo('o grupo cruza o fundo e some; fica a toalha', async () => {
    const { gatilho } = await t.est(); await t.irPara(gatilho - .5); await t.andar(700);
    await t.page.waitForTimeout(1300);
    const meio = await t.page.evaluate(() => window.__bastidor.world.encounters.group.children.filter(o => o.name.startsWith('pessoa')).length);
    await t.page.screenshot({ path: 'saida/r6-artista.png' });
    await t.page.waitForTimeout(2600);
    const depois = await t.page.evaluate(() => window.__bastidor.world.encounters.group.children.map(o => o.name || o.type));
    exigir(meio === 4, `${meio} pessoas cruzando`);
    exigir(!depois.some(n => n.startsWith('pessoa')) && depois.includes('Mesh'), `depois: ${depois}`);
  });
}

// ---------- achados ----------
if (quer('lista')) {
  console.log('\n== lista');
  const t = await abrir('lista');
  await passo('clicar na prancheta: chega perto, IMPRENSA / FOTO, VOLTAR devolve ao trilho', async () => {
    await t.page.evaluate(() => { const w = window.__bastidor.world; w.encounters.click(w.encounters.clickables()[0]); });
    await t.page.waitForTimeout(1200);
    exigir((await t.page.textContent('.legenda-nome')) === 'IMPRENSA / FOTO', 'legenda errada');
    await t.page.screenshot({ path: 'saida/r6-lista-perto.png' });
    await t.page.click('.legenda-voltar'); await t.page.waitForTimeout(900);
    exigir(await t.page.evaluate(() => window.__bastidor.world.controls.state.enabled && !window.__bastidor.world.override), 'nao voltou');
  });
}
if (quer('semflash')) {
  console.log('\n== semflash');
  const t = await abrir('semflash');
  await passo('a placa PROIBIDO FLASH existe perto da porta', async () => {
    exigir(await t.page.evaluate(() => window.__bastidor.world.encounters.group.children.some(o => o.geometry?.parameters?.width === 1.25)), 'sem placa');
  });
}

// ---------- orçamento com cada encontro forçado ----------
await passo('orcamento: no maximo 96 chamadas de desenho com todos os encontros', async () => {
  let pior = 0;
  for (const ids of ['agua,seguranca,foto,lista', 'cartao,som,artista,semflash']) {
    const t = await abrir(ids);
    for (let s = 0; s <= 136; s += 8) for (const g of [0, -60, 60, 180]) {
      await t.page.evaluate(([s, g]) => { const w = window.__bastidor.world; w.controls.state.s = s; w.controls.setYaw(g * Math.PI / 180); w.controls.state.lastLook = Infinity; }, [s, g]);
      await t.page.waitForTimeout(110);
      pior = Math.max(pior, await t.page.evaluate(() => window.__bastidor.world.renderer.info.render.calls));
    }
  }
  exigir(pior <= 96, `pior caso ${pior}`); return `pior caso ${pior}`;
});
export { abrir, passo, exigir, quer };
const extras = globalThis.__extras || [];
for (const fn of extras) await fn();

await browser.close(); await srv.fechar();
console.log(falhas ? `\n${falhas} falha(s).` : '\nEncontros funcionando.');
process.exit(falhas ? 1 : 0);
