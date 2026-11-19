// Passo 1 da etapa 1: lê a planta e a cena do motor do site e grava blender/dados/corredor.json (metros,
// eixos do three.js: Y pra cima). Texturas desenhadas em canvas (estênceis, cases, setlist...) viram PNG em
// blender/dados/texturas/. Fotos e pôsteres: só o caminho (montar_cena.py converte).
// Uso: node exportar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { abrirSite, AQUI } from './abrir_site.mjs';

const DADOS = path.join(AQUI, 'dados'), TEX = path.join(DADOS, 'texturas');
fs.mkdirSync(TEX, { recursive: true });

const { page, fechar } = await abrirSite();
try {
  const out = await page.evaluate(async () => {
    const P = await import('/bastidor/plan.js');
    const B = window.__bastidor, W = B.world, plan = B.plan, THREE = window.__cap.cena.THREE;
    W.scene.updateMatrixWorld(true);
    const r6 = v => Math.round(v * 1e6) / 1e6;
    const arr = a => Array.from(a, r6);

    // ---- casca
    const paredes = plan.walls.map(w => ({ a: w.a, b: w.b, normal: w.normal }));
    const piso = [...P.floorCells()].map(k => k.split(',').map(Number));

    // ---- trilho a cada 5 cm
    const trilho = [];
    for (let s = 0; s <= plan.rail.total + 1e-9; s += .05) { const p = plan.rail.at(s); trilho.push([r6(s), r6(p.x), r6(p.z), r6(p.dx), r6(p.dz)]); }
    let soma = 0; for (let k = 1; k < plan.rail.points.length; k++) soma += Math.hypot(plan.rail.points[k][0] - plan.rail.points[k - 1][0], plan.rail.points[k][1] - plan.rail.points[k - 1][1]);

    // ---- cópias
    const copias = W.prints.items.map(it => {
      const m = it.mesh; m.updateMatrixWorld(true);
      const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
      m.matrixWorld.decompose(pos, q, sc);
      return { ordem: it.p.order, pos: arr(pos.toArray()), quat: arr([q.x, q.y, q.z, q.w]), w: r6(it.w), h: r6(it.h),
        facing: it.p.facing.map(r6), foto: it.p.photo.src, artista: it.p.photo.artist || '', ala: it.p.ala, alaNome: it.p.alaName,
        primeira: it.p.first, lance: it.p.lance, lado: it.p.side, s: r6(it.p.s) };
    });

    // ---- tudo o mais da cena, genérico (o que os grupos clima e projecoes desenham)
    const texturas = {}; let nTex = 0;
    const idTex = t => {
      if (!t) return null;
      if (texturas[t.uuid]) return texturas[t.uuid].id;
      const img = t.image; let png = null, src = null;
      if (img instanceof HTMLCanvasElement) png = img.toDataURL('image/png');
      else if (img?.src) src = img.src;
      else if (img && img.width) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); png = c.toDataURL('image/png'); }
      texturas[t.uuid] = { id: `t${String(nTex++).padStart(3, '0')}`, png, src, repeat: [t.repeat.x, t.repeat.y], wrap: t.wrapS === THREE.RepeatWrapping };
      return texturas[t.uuid].id;
    };
    const folhas = W.dressing.door.leaves.map(l => l.pivot);
    const geo = g => {
      const p = g.parameters || {};
      if (g.type === 'PlaneGeometry') return { tipo: 'plano', w: p.width, h: p.height };
      if (g.type === 'BoxGeometry') return { tipo: 'caixa', w: p.width, h: p.height, d: p.depth };
      if (g.type === 'CylinderGeometry') return { tipo: 'cilindro', rt: p.radiusTop, rb: p.radiusBottom, h: p.height, n: p.radialSegments };
      if (g.type === 'CircleGeometry') return { tipo: 'disco', r: p.radius, n: p.segments };
      const pos = g.attributes.position; if (!pos || pos.count > 20000) return null;
      return { tipo: 'malha', pos: arr(pos.array), idx: g.index ? Array.from(g.index.array) : null, uv: g.attributes.uv ? arr(g.attributes.uv.array) : null };
    };
    const objetos = [];
    const grupo = o => { for (let p = o; p; p = p.parent) if (['clima', 'projecoes', 'copias'].includes(p.name)) return p.name; return null; };
    W.scene.traverse(o => {
      if (!o.isMesh || o.userData.__linha) return;
      const gname = grupo(o); if (!gname) return;
      if (o.userData.print || o.name === 'margens') return; // a cópia e o papel saem de "copias"
      const g = geo(o.geometry); if (!g) return;
      const m = o.material; if (Array.isArray(m)) return;
      let folha = null; for (let p = o.parent; p; p = p.parent) { const k = folhas.indexOf(p); if (k >= 0) folha = k; }
      const base = { grupo: gname, nome: o.name || '', geo: g, cor: '#' + m.color.getHexString(), opacidade: m.opacity,
        aditivo: m.blending === THREE.AdditiveBlending, transparente: m.transparent, mapa: idTex(m.map), alphaMapa: Boolean(m.alphaMap),
        semNevoa: m.fog === false, dupla: m.side === THREE.DoubleSide, folha,
        palco: o === W.dressing.door.stage, tela: o.userData.screen ? o.userData.screen.lance : null };
      if (o.isInstancedMesh) {
        const mi = new THREE.Matrix4(), mt = new THREE.Matrix4(), c = new THREE.Color();
        base.instancias = [];
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, mi); mt.multiplyMatrices(o.matrixWorld, mi); const inst = { m: arr(mt.elements) }; if (o.instanceColor) { o.getColorAt(i, c); inst.cor = [c.r, c.g, c.b]; } base.instancias.push(inst); }
      } else base.m = arr(o.matrixWorld.elements);
      objetos.push(base);
    });

    // ---- porta, telas, setlist
    const d = plan.door;
    const porta = { x: d.x, z: d.z, facing: d.facing, folhas: W.dressing.door.leaves.map(l => ({ s: l.s, pivo: arr(l.pivot.position.toArray()), yaw: l.pivot.rotation.y, w: .9, h: 2.25, e: .06 })), vao: { w: 1.84, h: 2.25 } };
    const telas = W.projections.screens.map(t => ({ lance: t.sc.lance, x: t.sc.x, z: t.sc.z, facing: t.sc.facing, cy: t.cy, w: t.w, h: t.h,
      filme: t.sc.film.title, poster: t.sc.film.poster, preview: t.sc.film.preview }));
    const sheet = W.dressing.sheet;

    return {
      unidades: 'metros; eixos do three.js (Y pra cima, câmera nasce olhando -Z); matrizes em coluna (three .elements)',
      U: P.U, HALL_HEIGHT: P.HALL_HEIGHT, EYE: P.EYE, PRINT_Y: P.PRINT_Y, LANCES: P.LANCES,
      bounds: plan.bounds, eixo: P.axisMeters(),
      paredes, piso, trilho: { total: plan.rail.total, soma_pontos: soma, passo: .05, colunas: ['s', 'x', 'z', 'dx', 'dz'], pontos: trilho },
      copias, porta, telas, setlist: { pos: arr(sheet.position.toArray()) }, alas: plan.alas.map(a => ({ n: a.n, nome: a.name, fotos: a.photos.length })),
      objetos, texturas: Object.values(texturas)
    };
  });

  // texturas de canvas viram arquivo
  for (const t of out.texturas) {
    if (t.png) { fs.writeFileSync(path.join(TEX, t.id + '.png'), Buffer.from(t.png.slice(t.png.indexOf(',') + 1), 'base64')); t.arquivo = `texturas/${t.id}.png`; }
    delete t.png;
  }
  fs.writeFileSync(path.join(DADOS, 'corredor.json'), JSON.stringify(out));

  const porTipo = {}; for (const o of out.objetos) porTipo[o.geo.tipo] = (porTipo[o.geo.tipo] || 0) + (o.instancias?.length || 1);
  console.log('corredor.json');
  console.log(`  cópias: ${out.copias.length} (esperado 109)`);
  console.log(`  paredes: ${out.paredes.length}  células de piso: ${out.piso.length}  lances: ${out.LANCES}`);
  console.log(`  trilho: total ${out.trilho.total.toFixed(3)} m, soma dos pontos ${out.trilho.soma_pontos.toFixed(3)} m, ${out.trilho.pontos.length} amostras`);
  console.log(`  porta: (${out.porta.x.toFixed(2)}, ${out.porta.z.toFixed(2)}) facing ${out.porta.facing.map(v => v.toFixed(2))}`);
  console.log(`  telas: ${out.telas.map(t => t.filme).join(' | ')}`);
  console.log(`  objetos: ${out.objetos.length} (${Object.entries(porTipo).map(([k, v]) => `${k} ${v}`).join(', ')}), texturas: ${out.texturas.length}`);
} finally { await fechar(); }
