// Confere a planta do bastidor (site-lab/bastidor/plan.js) sem navegador.
// Uso: node bastidor-planta.mjs [pasta=../site-lab]. Sai 1 se falhar.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pasta = path.resolve(process.argv[2] || '../site-lab');
const plan = await import(pathToFileURL(path.join(pasta, 'bastidor/plan.js')).href);
const data = await import(pathToFileURL(path.join(pasta, 'js/data.js')).href);
let falhas = 0;
const ok = (c, m) => { if (!c) falhas++; console.log(c ? 'OK   ' : 'FALHA', m); };

const L = plan.layout(data);
const cells = plan.floorCells();
const cellOf = (x, z) => `${Math.floor(x / plan.U)},${Math.floor(z / plan.U)}`;

const { lances, porParede } = plan.sizeFor(data.photos.length);
const esperado = lances * 11 * plan.U + (lances - 1) * 4 * plan.U; // lances + passagens, sem o arredondamento das esquinas
ok(Math.abs(L.rail.total - esperado) < 12, `trilho com ${L.rail.total.toFixed(1)} m (esperado ~${esperado.toFixed(0)} pra ${lances} lances)`);
ok(lances * 2 * porParede >= data.photos.length, `${lances} lances x 2 paredes x ${porParede} = ${lances * 2 * porParede} vagas para ${data.photos.length} fotos`);
ok(L.prints.length === data.photos.length, `${L.prints.length} copias para ${data.photos.length} fotos`);
ok(new Set(L.prints.map(p => p.photo.i)).size === data.photos.length, 'cada foto aparece uma vez');
ok(L.alas.length === Object.keys(data.galleries).length, `${L.alas.length} alas`);

// cada copia: 1,7 m do eixo, com parede de verdade atras (celula atras nao e piso, a da frente e)
let ruins = [];
for (const p of L.prints) {
  const behind = cellOf(p.x + p.wall[0] * 0.05, p.z + p.wall[1] * 0.05);
  const front = cellOf(p.x - p.wall[0] * 0.05, p.z - p.wall[1] * 0.05);
  // a copia ocupa ~1,45 m: confere as duas pontas tambem
  const along = [-p.wall[1], p.wall[0]];
  const ends = [-0.75, 0.75].map(k => cellOf(p.x + p.wall[0] * 0.05 + along[0] * k, p.z + p.wall[1] * 0.05 + along[1] * k));
  if (cells.has(behind) || !cells.has(front) || ends.some(c => cells.has(c))) ruins.push(p.order);
}
ok(!ruins.length, `toda copia tem parede inteira atras ${ruins.length ? '(falham: ' + ruins.join(',') + ')' : ''}`);

// distancia ate a abertura mais perto: medida no eixo do lance
const perto = L.prints.map(p => Math.min(p.a - plan.U * 0.0 - 1.7, (plan.lance(p.lance).length + plan.U) - 2 * plan.U - p.a));
ok(Math.min(...perto) >= 1.0, `cada copia a pelo menos 1 m de uma abertura (minimo ${Math.min(...perto).toFixed(2)} m)`);

// trilho: comeca em P0, termina em P11, sempre a 1u ou menos do eixo bruto (fica dentro do piso)
const fora = L.rail.points.filter(([x, z]) => !cells.has(cellOf(x, z)));
ok(!fora.length, `trilho inteiro dentro do piso (${L.rail.points.length} pontos)`);
const telas = Math.min(data.films.length, lances - 1);
ok(L.screens.length === telas && L.screens.every(sc => !cells.has(cellOf(sc.x + sc.facing[0] * -0.05, sc.z + sc.facing[1] * -0.05))), `${telas} telas de filme, todas numa parede`);
ok(!cells.has(cellOf(L.door.x - L.door.facing[0] * 0.05, L.door.z - L.door.facing[1] * 0.05)), 'porta do palco numa parede');
const { rng } = await import(pathToFileURL(path.join(pasta, 'js/shuffle.js')).href);
const A = plan.layout({ ...data, random: rng(1) }), B = plan.layout({ ...data, random: rng(2) });
ok(A.alas.map(a => a.id).join() !== B.alas.map(a => a.id).join(), 'sementes diferentes, ordem de alas diferente');
ok([A, B].every(X => new Set(X.prints.map(p => p.photo.i)).size === data.photos.length), `com sorteio, as ${data.photos.length} fotos continuam todas no corredor`);
console.log(`paredes: ${L.walls.length} faces · planta ${(L.bounds.maxX - L.bounds.minX).toFixed(1)} x ${(L.bounds.maxZ - L.bounds.minZ).toFixed(1)} m`);
console.log(falhas ? `${falhas} falha(s).` : 'Planta certa.');
process.exit(falhas ? 1 : 0);
