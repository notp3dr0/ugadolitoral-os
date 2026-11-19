// O arreio dentro da página: toma a câmera e o relógio do bastidor e filma quadro a quadro, em três passes
// (cor, fio, prof). Carregado como módulo depois que o bastidor ficou pronto (filmar.mjs).
import * as THREE from 'three';
import { criarPlanos } from './planos.js';

const B = window.__bastidor, W = B.world, plan = B.plan;
const { scene, camera, renderer } = W;
const FPS = 30, LARG = 1080, ALT = 1920;
const gl = renderer.getContext();

// ---------------------------------------------------------------- o motor fica nas nossas mãos
W.pause();                      // o laço do site para; quem desenha agora é o arreio
W.debug.planta = true;          // desliga o corte por distância (o passe fio veria coisa aparecendo)
W.sound.pulse = () => .5;       // luz estável: quem pulsa na batida é o laboratório
W.controls.state.enabled = false;
renderer.setPixelRatio(2); renderer.setSize(540, 960, false);
camera.aspect = 540 / 960; camera.fov = 80; camera.far = 200; camera.updateProjectionMatrix();
const FOG = scene.fog, FUNDO = scene.background;

function tudoVisivel() {
  for (const m of W.prints.meshes) m.visible = true;
  for (const o of W.dressing.cullable) o.visible = true;
  for (const o of W.projections.group.children) o.visible = true;
  W.dressing.door.stage.visible = false;
}
tudoVisivel();

// ---------------------------------------------------------------- cópias: todas carregadas antes, nada some
const loader = new THREE.TextureLoader();
W.prints.update = () => 0;
async function texturaDe(url) {
  const tex = await loader.loadAsync(url);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  return tex;
}
async function carregarCopias() {
  const fila = [...W.prints.items];
  async function trabalhador() {
    while (fila.length) {
      const it = fila.shift();
      const tex = await texturaDe(it.p.photo.md || it.p.photo.src);
      it.texture = tex; it.loading = false; it.fade = 1; it.big = null;
      it.material.map = tex; it.material.color.set(0xffffff); it.material.needsUpdate = true;
    }
  }
  await Promise.all([0, 1, 2, 3, 4, 5].map(trabalhador));
  for (const it of W.prints.items) renderer.initTexture(it.texture);
}
/** a versão grande (-lg) numa cópia */
async function copiaGrande(item) {
  const tex = await texturaDe(item.p.photo.src);
  item.material.map = tex; item.material.needsUpdate = true; renderer.initTexture(tex);
  return tex;
}

// ---------------------------------------------------------------- filmes: pôster e vídeo posicionado à mão
W.projections.update = () => {};
const telas = W.projections.screens.map(item => ({ item, video: null, tex: null, poster: null, usando: null }));
async function prepararTelas() {
  for (const t of telas) {
    t.poster = await texturaDe(t.item.sc.film.poster);
    t.item.mat.map = t.item.reflMat.map = t.poster;
    t.item.mat.color.set(0xffffff); t.item.reflMat.color.set(0xffffff);
    t.item.mat.needsUpdate = t.item.reflMat.needsUpdate = true;
  }
}
async function videoDe(t) {
  if (t.video) return t.video;
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
  const src = t.item.sc.film.preview;
  v.src = src.startsWith('./') ? src : './' + src;
  await new Promise((ok, falha) => { v.addEventListener('loadeddata', ok, { once: true }); v.addEventListener('error', falha, { once: true }); v.load(); });
  v.pause();
  t.video = v;
  // o quadro do vídeo passa por um canvas 2D (subir o <video> direto pra placa dá preto no Chrome sem tela)
  const k = Math.min(1, 1080 / Math.max(v.videoWidth, v.videoHeight));
  t.canvas = Object.assign(document.createElement('canvas'), { width: Math.round(v.videoWidth * k), height: Math.round(v.videoHeight * k) });
  t.ctx2d = t.canvas.getContext('2d');
  t.tex = new THREE.CanvasTexture(t.canvas); t.tex.colorSpace = THREE.SRGBColorSpace;
  t.tex.minFilter = THREE.LinearFilter; t.tex.generateMipmaps = false;
  return v;
}
async function buscar(v, tempo) {
  const alvo = Math.max(0, Math.min(v.duration - .05, tempo));
  if (Math.abs(v.currentTime - alvo) < 1e-4 && v.readyState >= 2) return;
  await new Promise(ok => { v.addEventListener('seeked', ok, { once: true }); v.currentTime = alvo; });
  // garante o quadro decodificado
  if ('requestVideoFrameCallback' in v) await Promise.race([new Promise(ok => v.requestVideoFrameCallback(() => ok())), window.__esperaReal(60)]);
}
/** cada tela perto da câmera mostra o filme no tempo certo; as outras, o pôster */
async function sincronizarTelas(pose, tFilme, plano) {
  for (const t of telas) {
    const sc = t.item.sc;
    const d = Math.hypot(sc.x - pose.x, sc.z - pose.z);
    const querVideo = d < (plano.alcanceFilme ?? 22);
    if (querVideo) {
      const v = await videoDe(t);
      const tempo = ((plano.filmeInicio?.[t.item.sc.lance] ?? 4) + tFilme) % Math.max(1, v.duration - .1);
      await buscar(v, tempo);
      t.ctx2d.drawImage(v, 0, 0, t.canvas.width, t.canvas.height);
      t.tex.needsUpdate = true;
      if (t.usando !== 'video') { t.item.mat.map = t.item.reflMat.map = t.tex; t.item.mat.needsUpdate = t.item.reflMat.needsUpdate = true; t.usando = 'video'; }
    } else if (t.usando !== 'poster') {
      t.item.mat.map = t.item.reflMat.map = t.poster; t.item.mat.needsUpdate = t.item.reflMat.needsUpdate = true; t.usando = 'poster';
    }
  }
}
/** a poeira no facho, com o relógio virtual (a mesma conta de projections.js) */
function poeira(now) {
  for (const { item } of telas) {
    const arr = item.dustGeo.attributes.position.array, t = now / 1000;
    const mid = new THREE.Vector3().addVectors(item.corners[0], item.corners[2]).multiplyScalar(.5);
    item.seeds.forEach(([u, a, b, ph], k) => {
      const uu = (u + t * .015) % 1;
      const p = item.apex.clone().lerp(mid, uu);
      arr[k * 3] = p.x + (item.corners[1].x - item.corners[0].x) * a * uu * .9 + Math.sin(t * .3 + ph) * .03;
      arr[k * 3 + 1] = p.y + item.h * b * uu * .9 + Math.cos(t * .25 + ph) * .03;
      arr[k * 3 + 2] = p.z + (item.corners[1].z - item.corners[0].z) * a * uu * .9;
    });
    item.dustGeo.attributes.position.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- categorias de objeto (pros passes fio e prof)
const ehPessoa = o => { for (let p = o.parent; p; p = p.parent) if (p.name?.startsWith('pessoa-')) return true; return false; };
function categoria(o) {
  const m = o.material;
  if (Array.isArray(m)) return 'solido';
  if (m.visible === false) return 'invisivel';
  if (m.blending === THREE.AdditiveBlending) return 'luz';
  if (m.alphaTest > 0 && m.map && ehPessoa(o)) return 'pessoa';
  if (m.alphaMap) return 'luz';
  if (m.transparent && m.map) return 'letreiro';
  if (m.transparent && !m.depthWrite && o.geometry?.type === 'CircleGeometry') return 'luz';
  return 'solido';
}

// ---------------------------------------------------------------- linha grossa (desenho técnico)
const U = {
  uRes: { value: new THREE.Vector2(LARG, ALT) }, uLargura: { value: 2.2 }, uNear: { value: camera.near },
  uRevela: { value: 1e9 }, uPonta: { value: 0 }, uGanho: { value: 1 }, uPerto: { value: 6 }, uLonge: { value: 32 },
  uLetreiro: { value: 1 }
};
const matLinha = new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: /* glsl */`
    uniform vec2 uRes; uniform float uLargura; uniform float uNear;
    attribute vec3 iA; attribute vec3 iB; attribute float iSA; attribute float iSB; attribute float iW;
    varying float vDist; varying float vS; varying float vW;
    void main() {
      vec4 a = modelViewMatrix * vec4(iA, 1.0);
      vec4 b = modelViewMatrix * vec4(iB, 1.0);
      float sa = iSA, sb = iSB;
      float nz = -uNear * 1.02;
      if (a.z > nz && b.z > nz) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vDist = 0.0; vS = 0.0; vW = 0.0; return; }
      if (a.z > nz) { float t = (nz - a.z) / (b.z - a.z); a = mix(a, b, t); sa = mix(sa, sb, t); }
      else if (b.z > nz) { float t = (nz - b.z) / (a.z - b.z); b = mix(b, a, t); sb = mix(sb, sa, t); }
      vec4 ca = projectionMatrix * a, cb = projectionMatrix * b;
      vec2 na = ca.xy / ca.w, nb = cb.xy / cb.w;
      vec2 dir = (nb - na) * uRes; float L = length(dir);
      dir = L > 1e-5 ? dir / L : vec2(1.0, 0.0);
      vec2 nrm = vec2(-dir.y, dir.x);
      bool fim = position.x > 0.5;
      vec4 c = fim ? cb : ca;
      vec2 off = nrm * position.y * uLargura * 0.5 + dir * (fim ? 1.0 : -1.0) * uLargura * 0.5;
      c.xy += off / uRes * 2.0 * c.w;
      gl_Position = c;
      vec4 v = fim ? b : a;
      vDist = length(v.xyz); vS = fim ? sb : sa; vW = iW;
    }`,
  fragmentShader: /* glsl */`
    uniform float uRevela; uniform float uPonta; uniform float uGanho; uniform float uPerto; uniform float uLonge;
    varying float vDist; varying float vS; varying float vW;
    void main() {
      if (vS > uRevela) discard;
      float f = 1.0 - 0.8 * smoothstep(uPerto, uLonge, vDist);
      float ponta = uPonta * exp(-max(0.0, uRevela - vS) / 1.2);
      float g = clamp((f * vW + ponta) * uGanho, 0.0, 1.0);
      gl_FragColor = vec4(vec3(g), 1.0);
    }`,
  depthTest: true, depthWrite: true, side: THREE.DoubleSide
});
// o teto tem ganho próprio (no A1 ele acende quando a câmera desce pra dentro)
const UT = { ...U, uGanho: { value: 1 } };
const matLinhaTeto = matLinha.clone(); matLinhaTeto.uniforms = UT;
const quadGeo = (() => {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 0, 1, 0, 1, 1, 0, 0, -1, 0, 1, 1, 0, 1, -1, 0], 3));
  return g;
})();
/** pares de pontos (no espaço local do dono) → objeto de linha grossa */
function linhaGrossa(pos, sVals, peso) {
  const n = pos.length / 6;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', quadGeo.getAttribute('position'));
  const A = new Float32Array(n * 3), Bv = new Float32Array(n * 3), SA = new Float32Array(n), SB = new Float32Array(n), Wt = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    A.set(pos.subarray(k * 6, k * 6 + 3), k * 3); Bv.set(pos.subarray(k * 6 + 3, k * 6 + 6), k * 3);
    SA[k] = sVals[k * 2]; SB[k] = sVals[k * 2 + 1]; Wt[k] = peso;
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(Bv, 3));
  g.setAttribute('iSA', new THREE.InstancedBufferAttribute(SA, 1)); g.setAttribute('iSB', new THREE.InstancedBufferAttribute(SB, 1));
  g.setAttribute('iW', new THREE.InstancedBufferAttribute(Wt, 1));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, matLinha);
  m.frustumCulled = false; m.visible = false; m.userData.__linha = true; m.renderOrder = 5;
  return m;
}
const arestasCache = new Map();
function arestas(geo) {
  if (!arestasCache.has(geo.uuid)) arestasCache.set(geo.uuid, new THREE.EdgesGeometry(geo, 20).attributes.position.array);
  return arestasCache.get(geo.uuid);
}
function pesoDe(o) {
  const n = o.name;
  if (n === 'paredes') return 1.0;
  if (n === 'piso' || n === 'teto') return .3;
  if (n === 'margens') return .55;
  if (n === 'fitas') return .45;
  if (o.userData.print) return 1.0;
  return .75;
}
const linhas = [];
const grupoLinhas = new THREE.Group(); grupoLinhas.name = '__linhas';
function construirLinhas() {
  scene.updateMatrixWorld(true);
  const objs = []; scene.traverse(o => { if (o.isMesh && !o.userData.__linha) objs.push(o); });
  const v = new THREE.Vector3(), mt = new THREE.Matrix4(), mi = new THREE.Matrix4();
  for (const o of objs) {
    if (categoria(o) !== 'solido' || ehPessoa(o)) continue;
    if (!o.geometry?.attributes?.position) continue;
    const pos = arestas(o.geometry), peso = pesoDe(o);
    if (o.isInstancedMesh) {
      const out = new Float32Array(pos.length * o.count), sv = new Float32Array(pos.length / 3 * o.count);
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, mi); mt.multiplyMatrices(o.matrixWorld, mi);
        for (let k = 0; k < pos.length / 3; k++) {
          v.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]).applyMatrix4(mt);
          const j = i * pos.length / 3 + k;
          out[j * 3] = v.x; out[j * 3 + 1] = v.y; out[j * 3 + 2] = v.z;
          sv[j] = plan.rail.nearest(v.x, v.z);
        }
      }
      const l = linhaGrossa(out, sv, peso); grupoLinhas.add(l); linhas.push(l);
    } else {
      const sv = new Float32Array(pos.length / 3);
      for (let k = 0; k < sv.length; k++) { v.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]).applyMatrix4(o.matrixWorld); sv[k] = plan.rail.nearest(v.x, v.z); }
      const l = linhaGrossa(pos, sv, peso); o.add(l); linhas.push(l);
      if (o.name === 'teto') l.material = matLinhaTeto;
    }
  }
  scene.add(grupoLinhas);
}

// ---------------------------------------------------------------- materiais de substituição
const preto = new Map();
function matPreto(side) {
  if (!preto.has(side)) preto.set(side, new THREE.MeshBasicMaterial({ color: 0x000000, side, fog: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 }));
  return preto.get(side);
}
const contorno = new Map();
function matContorno(src) {
  if (!contorno.has(src)) contorno.set(src, new THREE.ShaderMaterial({
    uniforms: { map: { value: src.map }, uLetreiro: U.uLetreiro, uGanho: U.uGanho },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform float uLetreiro; uniform float uGanho; varying vec2 vUv;
      void main() {
        float a = texture2D(map, vUv).a;
        if (a < 0.5) discard;
        vec2 dx = dFdx(vUv) * 1.7, dy = dFdy(vUv) * 1.7;
        float m = min(min(texture2D(map, vUv + dx).a, texture2D(map, vUv - dx).a), min(texture2D(map, vUv + dy).a, texture2D(map, vUv - dy).a));
        float borda = m < 0.5 ? 1.0 : 0.0;
        gl_FragColor = vec4(vec3(borda * uLetreiro * uGanho), 1.0);
      }`,
    side: THREE.DoubleSide
  }));
  const m = contorno.get(src); m.uniforms.map.value = src.map; return m;
}
const letreiro = new Map();
function matLetreiro(src) {
  if (!letreiro.has(src)) letreiro.set(src, new THREE.ShaderMaterial({
    uniforms: { map: { value: src.map }, uOp: { value: 1 }, uLetreiro: U.uLetreiro, uGanho: U.uGanho },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform float uOp; uniform float uLetreiro; uniform float uGanho; varying vec2 vUv; void main(){ float a = texture2D(map, vUv).a * uOp * uLetreiro * uGanho; gl_FragColor = vec4(vec3(0.85), a); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide
  }));
  const m = letreiro.get(src); m.uniforms.uOp.value = Math.min(1, src.opacity * 1.2); return m;
}
const profVS = /* glsl */`
  #include <common>
  varying vec3 vView; varying vec2 vUv;
  void main() {
    vUv = uv;
    #include <begin_vertex>
    #include <project_vertex>
    vView = mvPosition.xyz;
  }`;
const profFS = /* glsl */`
  uniform sampler2D map; uniform float uCorte; varying vec3 vView; varying vec2 vUv;
  void main() {
    if (uCorte > 0.0 && texture2D(map, vUv).a < uCorte) discard;
    float d = clamp(length(vView) / 30.0, 0.0, 1.0);
    float v = floor(d * 65535.0 + 0.5);
    float hi = floor(v / 256.0); float lo = v - hi * 256.0;
    gl_FragColor = vec4(hi / 255.0, lo / 255.0, 0.0, 1.0);
  }`;
const profMats = new Map();
function matProf(side, map = null, corte = 0) {
  const k = `${side}:${map?.uuid || ''}:${corte}`;
  if (!profMats.has(k)) profMats.set(k, new THREE.ShaderMaterial({ uniforms: { map: { value: map }, uCorte: { value: corte } }, vertexShader: profVS, fragmentShader: profFS, side }));
  return profMats.get(k);
}
const rtProf = new THREE.WebGLRenderTarget(LARG, ALT, { type: THREE.UnsignedByteType, depthBuffer: true, samples: 0 });
rtProf.texture.colorSpace = THREE.NoColorSpace;

// ---------------------------------------------------------------- passes
function trocar(fn) {
  const salvos = [];
  scene.traverse(o => fn(o, (obj, chave, valor) => { salvos.push([obj, chave, obj[chave]]); obj[chave] = valor; }));
  return () => { for (let i = salvos.length - 1; i >= 0; i--) { const [o, k, v] = salvos[i]; o[k] = v; } };
}
function renderCor() {
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}
function renderFio() {
  const desfazer = trocar((o, set) => {
    if (o.isPoints) return set(o, 'visible', false);
    if (o.userData.__linha) return set(o, 'visible', o.userData.__desligada ? false : true);
    if (!o.isMesh) return;
    const c = categoria(o);
    if (c === 'luz' || c === 'invisivel') return set(o, 'visible', false);
    if (c === 'pessoa') return set(o, 'material', matContorno(o.material));
    if (c === 'letreiro') return set(o, 'material', matLetreiro(o.material));
    set(o, 'material', matPreto(o.material.side));
  });
  scene.background = new THREE.Color(0); scene.fog = null;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
  scene.background = FUNDO; scene.fog = FOG;
  desfazer();
}
function renderProf(buf) {
  const desfazer = trocar((o, set) => {
    if (o.isPoints) return set(o, 'visible', false);
    if (o.userData.__linha) return;
    if (!o.isMesh) return;
    const c = categoria(o);
    if (c === 'luz' || c === 'invisivel' || c === 'letreiro') return set(o, 'visible', false);
    if (c === 'pessoa') return set(o, 'material', matProf(THREE.DoubleSide, o.material.map, .5));
    set(o, 'material', matProf(o.material.side));
  });
  scene.background = null; scene.fog = null;
  const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
  renderer.setClearColor(0xffff00, 1);
  renderer.setRenderTarget(rtProf); renderer.clear(); renderer.render(scene, camera);
  renderer.readRenderTargetPixels(rtProf, 0, 0, LARG, ALT, buf);
  renderer.setRenderTarget(null); renderer.setClearColor(cc, ca);
  scene.background = FUNDO; scene.fog = FOG;
  desfazer();
}

// ---------------------------------------------------------------- 2D: compor e codificar
const tela = document.createElement('canvas'); tela.width = LARG; tela.height = ALT;
const ctx = tela.getContext('2d');
const img = ctx.createImageData(LARG, ALT);
const px = new Uint8Array(LARG * ALT * 4);
const lin = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; lin[i] = c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }
const paraSRGB = x => { x = Math.max(0, Math.min(1, x)); return Math.round((x <= .0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - .055) * 255); };
const lutSaida = new Uint8Array(4097); for (let i = 0; i <= 4096; i++) lutSaida[i] = paraSRGB(i / 4096);
const acc = new Float32Array(LARG * ALT * 3);
function lerTela() { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, LARG, ALT, gl.RGBA, gl.UNSIGNED_BYTE, px); }
function acumular(peso) {
  lerTela();
  for (let i = 0, j = 0; i < px.length; i += 4, j += 3) { acc[j] += lin[px[i]] * peso; acc[j + 1] += lin[px[i + 1]] * peso; acc[j + 2] += lin[px[i + 2]] * peso; }
}
function acumuladoParaImg() {
  const d = img.data;
  for (let y = 0; y < ALT; y++) {
    const src = (ALT - 1 - y) * LARG * 3, dst = y * LARG * 4;
    for (let x = 0; x < LARG; x++) {
      const s = src + x * 3, t = dst + x * 4;
      d[t] = lutSaida[Math.min(4096, Math.round(acc[s] * 4096))]; d[t + 1] = lutSaida[Math.min(4096, Math.round(acc[s + 1] * 4096))]; d[t + 2] = lutSaida[Math.min(4096, Math.round(acc[s + 2] * 4096))]; d[t + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
function bufParaImg(buf) {
  const d = img.data;
  for (let y = 0; y < ALT; y++) d.set(buf.subarray((ALT - 1 - y) * LARG * 4, (ALT - y) * LARG * 4), y * LARG * 4);
  ctx.putImageData(img, 0, 0);
}
function escurecer(g) { if (g < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - Math.max(0, g)})`; ctx.fillRect(0, 0, LARG, ALT); } }
const jpg = () => tela.toDataURL('image/jpeg', .95);

// ---------------------------------------------------------------- utilidades pros planos
const v3 = new THREE.Vector3();
function projetar(x, y, z) {
  v3.set(x, y, z).applyMatrix4(scene.matrixWorld).project(camera);
  return { x: (v3.x + 1) / 2 * LARG, y: (1 - v3.y) / 2 * ALT, atras: v3.z > 1 };
}
const cena = {
  THREE, W, plan, scene, camera, U, UT, linhas, telas, copiaGrande, projetar,
  paredes(k) { scene.scale.y = Math.max(.002, k); },
  teto() { return scene.getObjectByName('teto'); },
  porta: W.dressing.door
};

// ---------------------------------------------------------------- o laço do arreio
let atual = null, T0 = 0, ultimoMs = null, preparado = false;
function aplicarPose(p) {
  camera.position.set(p.x, p.y, p.z);
  camera.rotation.set(p.pitch || 0, p.yaw || 0, p.roll || 0);
  const fov = p.fov ?? 80;
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld(true);
}
function irPara(t) {
  const plano = atual;
  const ms = T0 + t * 1000;
  window.__relogio.ir(ms);
  const pose = plano.pose(t);
  const dt = ultimoMs === null ? 1 / FPS : Math.max(0, (ms - ultimoMs) / 1000);
  ultimoMs = ms;
  plano.antes?.(t, cena, pose);
  W.controls.state.s = pose.s ?? plan.rail.nearest(pose.x, pose.z);
  W.override = plano.encontros ? null : pose;
  W.update(dt, ms, pose);
  W.override = pose;
  poeira(ms);
  aplicarPose(pose);
  plano.depois?.(t, cena, pose);
  scene.updateMatrixWorld(true);
  return pose;
}

window.__cap = {
  U, cena, matLinha,
  async preparar(id) {
    const planos = criarPlanos(cena);
    atual = planos[id];
    if (!atual) throw new Error('plano desconhecido: ' + id);
    atual.id = id;
    if (!preparado) {
      await carregarCopias();
      await prepararTelas();
      construirLinhas();
      preparado = true;
    }
    await atual.preparar?.(cena);
    T0 = window.__relogio.agora + 500;
    ultimoMs = null;
    // pré-rolagem: o mundo anda antes do quadro 0 (encontros, balanço), sem gravar
    const pre = atual.preRolagem ?? .2;
    for (let t = -pre; t < -1e-6; t += 1 / FPS) irPara(t);
    return { quadros: atual.quadros, passes: atual.passes, info: atual.info?.(cena) ?? null };
  },
  async quadro(n) {
    const p = atual, t = n / FPS, out = {};
    const quer = new Set(p.passes);
    const borrao = quer.has('cor') && p.borrao?.(n);
    const S = (p.obturador ?? .5) / FPS;
    const offs = borrao ? [-.375, -.125, .125, .375].map(k => k * S) : [];
    const poseC = p.pose(t);
    await sincronizarTelas(poseC, t, p);
    const ganho = p.ganho?.(t) ?? 1;
    if (borrao) acc.fill(0);
    for (const o of offs.filter(o => o < 0)) { irPara(t + o); renderCor(); acumular(1 / offs.length); }
    irPara(t);
    const ganhoFio = p.ganhoFio?.(t) ?? ganho;
    if (quer.has('fio')) {
      U.uGanho.value = 1;
      renderFio();
      ctx.drawImage(renderer.domElement, 0, 0);
      p.sobreposicao?.(ctx, t, cena);
      escurecer(ganhoFio);
      out.fio = jpg();
    }
    if (quer.has('prof')) {
      const buf = new Uint8Array(LARG * ALT * 4);
      renderProf(buf);
      bufParaImg(buf);
      out.prof = tela.toDataURL('image/png');
    }
    if (quer.has('cor') && !borrao) {
      renderCor();
      ctx.drawImage(renderer.domElement, 0, 0);
      escurecer(ganho);
      out.cor = jpg();
    }
    for (const o of offs.filter(o => o > 0)) { irPara(t + o); renderCor(); acumular(1 / offs.length); }
    if (borrao) { acumuladoParaImg(); escurecer(ganho); out.cor = jpg(); }
    return out;
  },
  /** quanto falta: cópia sem foto, filme sem quadro */
  conferir() {
    const brancas = W.prints.items.filter(i => !i.material.map || !i.material.map.image).map(i => i.p.order);
    return { brancas, telas: telas.map(t => t.usando) };
  }
};
