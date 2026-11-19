// Rodada 17: a cabeça de cada pessoa do elenco olha pra câmera e PARA (não pode acumular giro quadro a quadro).
// Câmera de lado (70°), 200 quadros: o giro da cabeça tem que se assentar e ficar abaixo de ~70°.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
const erros = []; page.on('pageerror', e => erros.push(String(e)));
await page.goto(`${srv.url}/bastidor.html?semente=3&encontros=nenhum`);
await page.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 20000 }); await page.click('.entrar-mudo');
await page.waitForFunction(async () => (await import('./bastidor/people.js')).elencoPronto(), null, { timeout: 30000 });
const r = await page.evaluate(async () => {
  const { person, animatePerson } = await import('./bastidor/people.js');
  const THREE = await import('three');
  const out = {};
  for (const pose of ['seguranca', 'radio', 'produtor', 'pose', 'artista', 'equipe']) {
    const p = person(pose, { height: 1.75 }); p.position.set(0, 0, 0); p.updateMatrixWorld(true);
    let cab; p.traverse(o => { if (o.isBone && o.name === 'Head') cab = o; });
    const cam = { position: { x: 0, z: 3 } };
    const giro = () => { p.updateMatrixWorld(true); const q = cab.getWorldQuaternion(new THREE.Quaternion()); const f = new THREE.Vector3(0, 0, 1).applyQuaternion(q); return Math.atan2(f.x, f.z) * 180 / Math.PI; };
    let t = 1000; for (let k = 0; k < 60; k++) animatePerson(p, cam, t += 16, false);       // parado de frente: assenta
    cam.position = { x: Math.sin(1.22) * 3, z: Math.cos(1.22) * 3 };                       // câmera vai 70° pro lado
    const amostras = []; for (let k = 0; k < 200; k++) { animatePerson(p, cam, t += 16, false); if (k % 20 === 19) amostras.push(Math.round(giro())); }
    out[pose] = amostras;
  }
  return out;
});
let ok = !erros.length;
for (const [pose, a] of Object.entries(r)) {
  const fim = a.slice(-4), espalha = Math.max(...fim) - Math.min(...fim);
  const bom = espalha < 8 && Math.abs(fim[3]) < 100;
  if (!bom) ok = false;
  console.log(`${bom ? 'OK   ' : 'FALHA'} ${pose.padEnd(10)} ${a.join(' ')}`);
}
console.log(erros.length ? 'ERROS ' + erros.join(' | ') : '', ok ? 'tudo certo' : 'FALHA');
await browser.close(); srv.close?.(); process.exit(ok ? 0 : 1);
