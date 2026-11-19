// Grava a pose da câmera de um plano do filme, quadro a quadro, avaliando ../captura/planos.js no motor.
// Saída: blender/dados/camera/<ID>.json com, por quadro: posição e quaternion (three.js, ordem YXZ já
// resolvida), fov vertical do motor, s no trilho e, no C7_porta, o ângulo de abertura das folhas.
// Uso: node exportar_camera.mjs <ID> [<ID> ...]   (ex.: B1_travessia C2a C7_porta)
import fs from 'node:fs';
import path from 'node:path';
import { abrirSite, AQUI } from './abrir_site.mjs';

const ids = process.argv.slice(2);
if (!ids.length) { console.log('uso: node exportar_camera.mjs <ID ...>'); process.exit(1); }
const DIR = path.join(AQUI, 'dados', 'camera'); fs.mkdirSync(DIR, { recursive: true });

const { page, fechar } = await abrirSite();
try {
  for (const id of ids) {
    const out = await page.evaluate(async id => {
      const { criarPlanos } = await import('/__captura/planos.js');
      const cena = window.__cap.cena, THREE = cena.THREE;
      const plano = criarPlanos(cena)[id];
      if (!plano) throw new Error('plano desconhecido: ' + id);
      if (id === 'C2e_mergulho') await plano.preparar(cena); // a distância final depende do tamanho da cópia
      const FPS = 30, o = new THREE.Object3D(); o.rotation.order = 'YXZ';
      const easeInOut = u => (u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
      const quadros = [];
      for (let n = 0; n < plano.quadros; n++) {
        const t = n / FPS, p = plano.pose(t);
        o.position.set(p.x, p.y, p.z); o.rotation.set(p.pitch || 0, p.yaw || 0, p.roll || 0); o.updateMatrix();
        const q = o.quaternion;
        const q1 = { n, pos: [p.x, p.y, p.z], quat: [q.x, q.y, q.z, q.w], fov: p.fov ?? 80, s: p.s ?? null };
        if (id === 'C7_porta') { const u = Math.min(1, Math.max(0, (t - 80 / FPS) / (14 / FPS))); q1.porta = 1.75 * easeInOut(u); }
        if (plano.ganho) q1.ganho = plano.ganho(t);
        quadros.push(q1);
      }
      return { id, fps: FPS, quadros: plano.quadros, eixos: 'three.js', pose: quadros };
    }, id);
    fs.writeFileSync(path.join(DIR, id + '.json'), JSON.stringify(out));
    console.log(`${id}: ${out.quadros} quadros`);
  }
} finally { await fechar(); }
