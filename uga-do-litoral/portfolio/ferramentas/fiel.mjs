// Rodada 15: o site ao lado do filme, no MESMO quadro. Tira prints do site (1920x1080) em 4 pontos e grava a pose
// da câmera de cada um em showreel/blender/dados/camera/REF_site.json, pro Blender renderizar o mesmo enquadramento:
//   blender.exe -b cena/corredor.blend --python render.py -- --plano REF_site --quadros 0-3 --formato h --motor cycles
//               --sem-borrao --sem-foco --amostras 64 --saida revisao/site-ref
// Uso: node fiel.mjs [modo ...]   modos: hoje | luz (?luz=blender&materia=0) | filme (?luz=blender) | qualquer "&chave=valor"
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
mkdirSync('saida/fiel', { recursive: true });
const PONTOS = [['entrada', 3, 0], ['lance2', 26, 0], ['parede', 30, 70], ['porta', -6, 0]];
const QS = { hoje: '&luz=hoje', luz: '&luz=blender&materia=0', filme: '' };
const modos = process.argv.slice(2).length ? process.argv.slice(2) : ['hoje', 'filme'];
let falhas = 0, poses = null;
for (const modo of modos) {
  const q = QS[modo] ?? modo, nome = QS[modo] !== undefined ? modo : modo.replace(/[^a-z0-9.]+/gi, '_');
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${srv.url}/bastidor.html?semente=3&encontros=nenhum${q}`);
  await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
  await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 8000 });
  await page.waitForTimeout(1500);
  if (q.includes('luz=blender')) { const r = await page.evaluate(() => window.__bastidor.world.luz); console.log(nome, 'luz:', JSON.stringify(r)); if (!r?.ligou) falhas++; }
  const p = [];
  for (const [ponto, s, olhar] of PONTOS) {
    await page.evaluate(({ s, olhar }) => { const w = window.__bastidor.world, st = w.controls.state; st.s = s < 0 ? w.plan.rail.total + s : s; st.v = 0; w.controls.setYaw(olhar * Math.PI / 180); st.lastLook = Infinity; }, { s, olhar });
    await page.mouse.move(960, 540); await page.waitForTimeout(1800);
    await page.screenshot({ path: `saida/fiel/${ponto}-${nome}.png` });
    p.push(await page.evaluate(() => { const c = window.__bastidor.world.camera; c.updateMatrixWorld(); return { pos: c.position.toArray(), quat: c.quaternion.toArray(), fov: c.fov, calls: window.__bastidor.world.renderer?.info.render.calls }; }));
  }
  poses = poses || p;
  if (erros.length) { falhas++; console.log(nome, 'ERROS', erros.join(' | ')); }
  await page.context().close();
}
// pose no formato do showreel; no horizontal o render.py usa fov * 62/80, então grava 80 pra sair 62 (o do site deitado)
const REF = '../../instagram/reels/lancamento-portfolio/blender/dados/camera/REF_site.json';
writeFileSync(REF, JSON.stringify({ id: 'REF_site', fps: 30, quadros: poses.length, eixos: 'three.js', pontos: PONTOS.map(p => p[0]),
  pose: poses.map((x, n) => ({ n, pos: x.pos, quat: x.quat, fov: x.fov * 80 / 62, s: null })) }));
console.log('poses:', poses.map(x => x.pos.map(v => v.toFixed(2)).join(',')).join(' | '));
await browser.close(); srv.close?.();
console.log(falhas ? `${falhas} falha(s)` : 'tudo certo');
process.exit(falhas ? 1 : 0);
