// Rodada 14: os manequins em fila dentro do corredor, de frente, de lado e de costas (prints em saida/gente/).
// Uso: node gente.mjs [recorte]   (com "recorte", a mesma fila com as silhuetas 2D de antes, pra comparar)
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
import { mkdirSync } from 'node:fs';

const recorte = process.argv.includes('recorte');
const modo = process.argv.includes('elenco') ? 'elenco' : recorte ? 'recorte' : 'manequim';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
const erros = []; page.on('pageerror', e => erros.push(String(e.stack || e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
const luz = process.argv.includes('luz') ? '&luz=blender' : '';
await page.goto(`${srv.url}/bastidor.html?semente=3&encontros=nenhum&gente=${modo}${luz}`);
await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
await page.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 8000 });
await page.waitForFunction(async () => (await import('./bastidor/people.js')).elencoPronto(), null, { timeout: 20000 });
await page.waitForTimeout(1500);
mkdirSync('saida/gente', { recursive: true });
const POSES = [['seguranca', 1.92, 0xff2a2a, .4], ['radio', 1.92, 0xff2a2a, .4], ['produtor', 1.74, 0xffe7c4, .28], ['pose', 1.7, 0xffd9b0, .3], ['artista', 1.8, 0xffffff, .12], ['equipe', 1.72, 0xffffff, .12]];
for (const [nome, giro] of [['frente', 0], ['tres-quartos', .8], ['lado', Math.PI / 2], ['costas', Math.PI]]) {
  await page.evaluate(async ({ POSES, giro }) => {
    const { person, animatePerson } = await import('./bastidor/people.js');
    const w = window.__bastidor.world, cam = w.camera;
    (w.__fila || []).forEach(p => w.scene.remove(p));
    const fwd = { x: -Math.sin(cam.rotation.y), z: -Math.cos(cam.rotation.y) }, right = { x: -fwd.z, z: fwd.x };
    w.__fila = POSES.map(([pose, h, glow, op], k) => {
      const p = person(pose, { height: h, glow, glowOpacity: op });
      const off = (k - (POSES.length - 1) / 2) * .52;
      p.position.set(cam.position.x + fwd.x * 3.4 + right.x * off, 0, cam.position.z + fwd.z * 3.4 + right.z * off);
      w.scene.add(p);
      const fake = { position: { x: cam.position.x, z: cam.position.z } };
      animatePerson(p, fake, performance.now(), true);
      if (p.userData.rig || p.userData.elenco) { p.userData.yaw = Math.atan2(cam.position.x - p.position.x, cam.position.z - p.position.z) + giro; animatePerson(p, fake, performance.now(), true); p.userData.corpo.rotation.y = p.userData.yaw; }
      return p;
    });
  }, { POSES, giro });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `saida/gente/${modo}-${nome}.png` });
}
// de perto: o segurança, a 1,2 m
await page.evaluate(() => {
  const w = window.__bastidor.world, cam = w.camera, p = w.__fila[0];
  w.__fila.forEach((q, k) => { q.visible = k === 0; });
  const fwd = { x: -Math.sin(cam.rotation.y), z: -Math.cos(cam.rotation.y) };
  p.position.set(cam.position.x + fwd.x * 1.3, 0, cam.position.z + fwd.z * 1.3);
});
await page.waitForTimeout(300);
await page.screenshot({ path: `saida/gente/${modo}-perto.png` });
console.log(erros.length ? 'ERROS: ' + erros.join('\n') : 'sem erros');
await browser.close(); srv.close?.();
process.exit(erros.length ? 1 : 0);
