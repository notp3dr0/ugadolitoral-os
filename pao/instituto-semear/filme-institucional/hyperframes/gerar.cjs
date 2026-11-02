// Gera os dois projetos HyperFrames (h16x9 e v9x16) do filme "Um gesto".
// Os desenhos vêm de fonte/logo-data.json e fonte/estampa-data.json (vetorizados dos posts do Semear).
// Uso: node gerar.cjs   (reescreve index.html e compositions/ dos dois projetos)
const fs = require('fs'), path = require('path');
const AQUI = __dirname;
const logo = JSON.parse(fs.readFileSync(path.join(AQUI, 'fonte/logo-data.json'), 'utf8'));
const est = JSON.parse(fs.readFileSync(path.join(AQUI, 'fonte/estampa-data.json'), 'utf8'));

const COR = { papel: '#EDEDED', marrom: '#975F30', amarelo: '#FFBB00', oliva: '#85933C', oliva2: '#5E682C', tinta: '#1F1F1F', contorno: '#B9B9B9' };
const DUR = 27;
const r2 = n => Math.round(n * 100) / 100;

// ---------- geometria da logo ----------
function bbox(d) { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; }
const P = logo.pessoas;                       // 17 pessoas, ordenadas de cima pra baixo
const MB = logo.maosBox;                       // mãos + chão
const TOPO = Math.min(...P.map(p => Math.min(bbox(p.body).y0, bbox(p.head).y0)));
const BASE = MB.y1, CX = MB.cx, ALTURA = BASE - TOPO, LARG = MB.x1 - MB.x0;
const SEMENTE = { x: CX, y: BASE - 62, r: 40 };
const CHAO_Y = BASE - 70;                      // faixa do chão (o resto das mãos fica escondido até subir)
const MAOS_TOPO = MB.y0 - 10;

// A = pessoa mais perto do centro baixo da copa; B e C as vizinhas dela
const dist = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy);
const iA = P.map((p, i) => [Math.hypot(p.cx - CX, p.cy - (TOPO + ALTURA * 0.42)), i]).sort((a, b) => a[0] - b[0])[0][1];
const viz = P.map((p, i) => [dist(p, P[iA]), i]).filter(v => v[1] !== iA).sort((a, b) => a[0] - b[0]);
const iB = viz[0][1], iC = viz[1][1];

// ---------- estampa: subpaths agrupados por célula ----------
const [EW, EH] = est.viewBox, ECOL = 10, EROW = 7, CW = EW / ECOL, CH = EH / EROW;
const celulas = {};
for (const [nome, d] of Object.entries(est.paths)) {
  for (const sp of d.split(/(?=M)/).map(s => s.trim()).filter(Boolean)) {
    const b = bbox(sp); const c = Math.min(ECOL - 1, Math.floor(b.cx / CW)), r = Math.min(EROW - 1, Math.floor(b.cy / CH));
    const k = r + '-' + c; (celulas[k] = celulas[k] || {}); (celulas[k][nome] = (celulas[k][nome] || '') + sp + ' ');
  }
}

// ---------- os dois formatos ----------
const FORMATOS = {
  h16x9: {
    W: 1920, H: 1080,
    arvore: { gx: 960, gy: 870, h: 810 },
    assinatura: { simbX0: 337, simbW: 222, simbBase: 703,
      inst: { x: 756, y: 495, size: 74, len: 703, anchor: 'start' }, sem: { x: 631, y: 658, size: 216, len: 954, anchor: 'start' } },
    slotA: [960, 580], slotB: [700, 440], slotC: [1250, 370],
    slots: [[330, 260], [560, 180], [820, 250], [1100, 190], [1400, 240], [1640, 330], [250, 540], [470, 660], [1500, 540], [1700, 650], [380, 400], [1060, 360], [800, 660], [1200, 650]],
    cam2: { k: 1.7, c: [960, 540] }, cam3: { k: 1.3, c: [960, 500] },
    estampa: { cel: 130, blocos: [{ x: -30, y: -30, cols: [0, 1, 2], rows: [0, 1] }, { x: 1920 - 3 * 130 + 30, y: 1080 - 2 * 130 + 30, cols: [7, 8, 9], rows: [5, 6] }] },
    leg: { base: 970, size: 54, gesto: 58, cred: 26, credY: 1014, maxW: 1500 },
  },
  v9x16: {
    W: 1080, H: 1920,
    arvore: { gx: 540, gy: 1060, h: 870 },
    assinatura: { simbX0: 540 - 193, simbW: 386, simbBase: 900,
      inst: { x: 540, y: 1000, size: 62, len: 590, anchor: 'middle' }, sem: { x: 540, y: 1180, size: 190, len: 840, anchor: 'middle' } },
    slotA: [540, 820], slotB: [300, 670], slotC: [800, 590],
    slots: [[200, 300], [450, 240], [720, 290], [910, 400], [170, 520], [430, 470], [660, 470], [900, 580], [190, 920], [880, 900], [540, 600], [330, 960], [760, 960], [120, 700]],
    cam2: { k: 1.6, c: [540, 760] }, cam3: { k: 1.25, c: [540, 700] },
    estampa: { cel: 135, blocos: [{ x: 0, y: 18, cols: [0, 1, 2, 3, 4, 5, 6, 7], rows: [0] }, { x: 0, y: 1920 - 135 - 18, cols: [2, 3, 4, 5, 6, 7, 8, 9], rows: [6] }] },
    leg: { base: 1272, size: 64, gesto: 66, cred: 30, credY: 1322, maxW: 900 },
  },
};

// ---------- texto ----------
const FALAS = [
  { id: "g", ini: 0.5, fim: 3.8, estilo: "gesto", palavras: [["Toda", .54], ["mudança", 1.10, 1], ["começa", 1.82], ["com", 2.38], ["1", 2.62], ["gesto.", 2.94, 1]] },
  { id: "b", ini: 3.85, fim: 6.75, palavras: [["A", 3.91], ["bolsa", 4.15], ["me", 4.79], ["trouxe", 4.95], ["tranquilidade.", 5.51]] },
  { id: "m", ini: 7.95, fim: 10.6, palavras: [["A", 8.01], ["mentoria", 8.17], ["me", 8.89], ["mostrou", 9.05], ["caminhos.", 9.53]] },
  { id: "r", ini: 12.3, fim: 15.3, credito: "da carta de Alan Cruz Silva, Jovem-Semente", palavras: [["E", 12.36], ["a", 12.6], ["rede", 12.76], ["me", 13.24], ["fez", 13.4], ["sentir", 13.72], ["pertencente.", 14.12]] },
];

function gerar(nome, F) {
  const { W, H } = F;
  const ts = F.arvore.h / ALTURA, tx = F.arvore.gx - CX * ts, ty = F.arvore.gy - BASE * ts;
  const ts2 = F.assinatura.simbW / LARG, tx2 = F.assinatura.simbX0 - MB.x0 * ts2, ty2 = F.assinatura.simbBase - BASE * ts2;
  const tela2logo = ([sx, sy]) => [(sx - tx) / ts, (sy - ty) / ts];

  // posição de rede de cada pessoa (offset em unidades da logo)
  const outros = P.map((p, i) => i).filter(i => ![iA, iB, iC].includes(i)).sort((a, b) => P[a].cx - P[b].cx);
  const slots = [...F.slots].sort((a, b) => a[0] - b[0]);
  const slotDe = {}; slotDe[iA] = F.slotA; slotDe[iB] = F.slotB; slotDe[iC] = F.slotC; outros.forEach((i, k) => slotDe[i] = slots[k]);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rede = P.map((p, i) => { const [lx, ly] = tela2logo(slotDe[i]); return { dx: lx - p.cx, dy: ly - p.cy, x: lx, y: ly, rot: Math.round((rnd() - .5) * 26) }; });

  // ordem em que acendem na rede (ondas a partir de A) e linhas entre vizinhas
  const ondas = outros.slice().sort((a, b) => Math.hypot(rede[a].x - rede[iA].x, rede[a].y - rede[iA].y) - Math.hypot(rede[b].x - rede[iA].x, rede[b].y - rede[iA].y));
  const acende = {}; acende[iA] = 4.5; acende[iB] = 8.2; acende[iC] = 9.4; ondas.forEach((i, k) => acende[i] = 12.0 + k * 0.17);
  const arestas = [['s', iA, 3.6, 0.9], [iA, iB, 7.4, 0.8], [iA, iC, 8.6, 0.8], [iB, iC, 9.6, 0.8]];
  const tem = new Set(arestas.map(a => [a[0], a[1]].sort().join()));
  for (const i of ondas) {
    const perto = P.map((_, j) => j).filter(j => j !== i).sort((a, b) => Math.hypot(rede[a].x - rede[i].x, rede[a].y - rede[i].y) - Math.hypot(rede[b].x - rede[i].x, rede[b].y - rede[i].y)).slice(0, 2);
    for (const j of perto) { const k = [i, j].sort().join(); if (tem.has(k)) continue; tem.add(k); arestas.push([i, j, Math.max(acende[i], acende[j]) - 0.05, 0.5]); }
  }
  const ponto = q => q === 's' ? [SEMENTE.x, SEMENTE.y] : [rede[q].x, rede[q].y];
  const curva = (a, b, k) => { const [x1, y1] = ponto(a), [x2, y2] = ponto(b); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1) * k, ny = (x2 - x1) * k;
    return `M${r2(x1)} ${r2(y1)} Q${r2(mx + nx)} ${r2(my + ny)} ${r2(x2)} ${r2(y2)}`; };

  // câmera: foco f (coordenadas de tela com k=1) vai pro ponto c da tela
  const sem = [tx + SEMENTE.x * ts, ty + SEMENTE.y * ts];
  const cam = (k, f, c) => ({ x: r2(c[0] - k * f[0]), y: r2(c[1] - k * f[1]), scale: k });
  const media = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const cam2 = cam(F.cam2.k, media([sem, F.slotA]), F.cam2.c);
  const cam3 = cam(F.cam3.k, media([sem, F.slotA, F.slotB, F.slotC]), F.cam3.c);

  // ---------- markup ----------
  const pessoas = P.map((p, i) => `
        <g id="f-p${i}" class="f-pessoa">
          <g id="f-pc${i}" class="f-contorno" opacity="0" fill="none" stroke="${COR.contorno}" stroke-width="9" stroke-linejoin="round"><path d="${p.body}"/><path d="${p.head}"/></g>
          <g id="f-pk${i}" class="f-cor"><path fill="${COR.oliva}" d="${p.body}"/><path fill="${COR.amarelo}" d="${p.head}"/></g>
        </g>`).join('');
  const linhas = arestas.map((a, n) => `<path id="f-l${n}" class="f-linha" d="${curva(a[0], a[1], n % 2 ? .07 : -.07)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`).join('\n        ');

  const blocos = [];
  F.estampa.blocos.forEach((b, bi) => b.rows.forEach((r, ri) => b.cols.forEach((c, ci) => {
    const cel = celulas[r + '-' + c]; if (!cel) return; const s = F.estampa.cel / CW;
    const x = b.x + ci * F.estampa.cel, y = b.y + ri * F.estampa.cel;
    const contorno = Object.entries(cel).map(([n, d]) => `<path fill="none" stroke="${est.cores[n]}" stroke-width="7" d="${d}"/>`).join('');
    const cheio = Object.entries(cel).map(([n, d]) => `<path fill="${est.cores[n]}" fill-rule="evenodd" d="${d}"/>`).join('');
    blocos.push({ id: `f-e${bi}-${ri}-${ci}`, html: `<g transform="translate(${r2(x - c * CW * s)} ${r2(y - r * CH * s)}) scale(${r2(s * 1000) / 1000})"><g id="f-e${bi}-${ri}-${ci}o" class="f-eo" opacity="0">${contorno}</g><g id="f-e${bi}-${ri}-${ci}f" class="f-ef" opacity="0">${cheio}</g></g>`,
      x: x + F.estampa.cel / 2, y: y + F.estampa.cel / 2 });
  })));
  const A = F.assinatura;

  const filme = `<template>
  <style>
    #root { position: absolute; inset: 0; background: ${COR.papel}; overflow: hidden; }
    #f-papel { position: absolute; inset: 0; width: ${W}px; height: ${H}px; }
    #f-camera { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
    #f-mundo, #f-estampa, #f-assinatura { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; overflow: visible; }
    .f-linha { fill: none; stroke: ${COR.oliva2}; stroke-width: 9; stroke-linecap: round; }
  </style>
  <div id="root" data-composition-id="filme" data-width="${W}" data-height="${H}">
    <img id="f-papel" class="clip" src="assets/papel.png" data-start="0" data-duration="${DUR}" data-track-index="0" alt="" />
    <div id="f-palco" class="clip" data-start="0" data-duration="${DUR}" data-track-index="1" data-layout-allow-overflow>
      <svg id="f-estampa" viewBox="0 0 ${W} ${H}">
        ${blocos.map(b => b.html).join('\n        ')}
      </svg>
      <div id="f-camera">
        <svg id="f-mundo" viewBox="0 0 ${W} ${H}">
          <defs>
            <clipPath id="f-clip-chao" clipPathUnits="userSpaceOnUse"><rect x="-200" y="${r2(CHAO_Y)}" width="2000" height="400"/></clipPath>
            <clipPath id="f-clip-maos" clipPathUnits="userSpaceOnUse"><rect id="f-maos-rect" x="-200" y="${r2(MAOS_TOPO)}" width="2000" height="${r2(BASE - MAOS_TOPO + 50)}"/></clipPath>
          </defs>
          <g id="f-arvore">
            <path id="f-chao" fill="${COR.marrom}" d="${logo.maos}" clip-path="url(#f-clip-chao)"/>
            <path id="f-maos" fill="${COR.marrom}" d="${logo.maos}" clip-path="url(#f-clip-maos)"/>
            <g id="f-linhas">
        ${linhas}
            </g>
            <circle id="f-anel" cx="${r2(SEMENTE.x)}" cy="${r2(SEMENTE.y)}" r="${SEMENTE.r}" fill="none" stroke="${COR.amarelo}" stroke-width="8" opacity="0"/>
            <circle id="f-semente" cx="${r2(SEMENTE.x)}" cy="${r2(SEMENTE.y)}" r="${SEMENTE.r}" fill="${COR.amarelo}" opacity="0"/>
            ${pessoas}
          </g>
        </svg>
      </div>
      <svg id="f-assinatura" viewBox="0 0 ${W} ${H}">
        <text id="f-inst" x="${A.inst.x}" y="${A.inst.y}" font-family="Poppins" font-weight="300" font-size="${A.inst.size}" fill="${COR.marrom}" text-anchor="${A.inst.anchor}" textLength="${A.inst.len}" lengthAdjust="spacing" opacity="0">INSTITUTO</text>
        <text id="f-sem" x="${A.sem.x}" y="${A.sem.y}" font-family="Poppins" font-weight="700" font-size="${A.sem.size}" fill="${COR.marrom}" text-anchor="${A.sem.anchor}" textLength="${A.sem.len}" lengthAdjust="spacingAndGlyphs" opacity="0">semear</text>
      </svg>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    const N = ${P.length}, A = ${iA}, B = ${iB}, C = ${iC};
    const rede = ${JSON.stringify(rede.map(r => ({ dx: r2(r.dx), dy: r2(r.dy), rot: r.rot })))};
    const acende = ${JSON.stringify(acende)};
    const arestas = ${JSON.stringify(arestas.map(a => [a[2], a[3]]))};
    const centro = ${JSON.stringify(P.map(p => [r2(p.cx), r2(p.cy)]))};
    const estampa = ${JSON.stringify(blocos.map(b => [b.id, Math.round(b.x), Math.round(b.y)]))};
    const P = i => "#f-p" + i;

    // estado inicial: a logo inteira (é a miniatura)
    tl.set("#f-arvore", { x: ${r2(tx)}, y: ${r2(ty)}, scale: ${r2(ts * 10000) / 10000}, svgOrigin: "0 0" }, 0);
    tl.set("#f-camera", { x: 0, y: 0, scale: 1, transformOrigin: "0 0" }, 0);
    tl.set("#f-maos", { scaleY: 1, svgOrigin: "${r2(CX)} ${r2(BASE)}" }, 0);
    for (let i = 0; i < N; i++) {
      tl.set(P(i), { x: 0, y: 0, scale: 1, rotation: 0, svgOrigin: centro[i].join(" ") }, 0);
    }

    // 1 · gancho: rebobina até a semente (0,4–1,1 s)
    const meio = [${r2(CX)}, ${r2(TOPO + ALTURA * 0.42)}];
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(centro[i][0] - meio[0], centro[i][1] - meio[1]);
      tl.to(P(i), { x: meio[0] - centro[i][0], y: meio[1] - centro[i][1], scale: 0.12, rotation: (i % 2 ? 1 : -1) * 80, duration: 0.42, ease: "power3.in" }, 0.4 + (1 - d / 900) * 0.06);
      tl.to("#f-pk" + i, { opacity: 0, duration: 0.08 }, 0.86);
    }
    tl.to("#f-maos", { scaleY: 0.03, duration: 0.45, ease: "power3.in" }, 0.4);
    tl.set("#f-maos-rect", { attr: { y: ${r2(BASE + 20)} } }, 0.9);
    tl.set("#f-maos", { scaleY: 1 }, 0.9);
    tl.fromTo("#f-semente", { opacity: 0, scale: 0.2, y: meio[1] - ${r2(SEMENTE.y)}, svgOrigin: "${r2(SEMENTE.x)} ${r2(SEMENTE.y)}" },
      { opacity: 1, scale: 1, duration: 0.1, ease: "power2.out" }, 0.84);
    tl.to("#f-semente", { y: 0, duration: 0.24, ease: "power2.in" }, 0.88);
    tl.to("#f-semente", { scaleY: 0.78, scaleX: 1.12, duration: 0.05, ease: "power1.out" }, 1.12);
    tl.to("#f-semente", { scaleY: 1, scaleX: 1, duration: 0.22, ease: "back.out(3)" }, 1.17);
    // pessoas vão, escondidas, pros lugares da rede
    for (let i = 0; i < N; i++) tl.set(P(i), { x: rede[i].dx, y: rede[i].dy, scale: 1, rotation: rede[i].rot }, 1.3);

    // 2 · acende (3–7 s)
    tl.to("#f-camera", { ...${JSON.stringify(cam2)}, duration: 1.1, ease: "power2.inOut" }, 2.6);
    tl.fromTo("#f-anel", { attr: { r: ${SEMENTE.r} }, opacity: 0.9 }, { attr: { r: ${SEMENTE.r * 4} }, opacity: 0, duration: 0.7, ease: "expo.out", immediateRender: false }, 3.1);
    tl.to("#f-pc" + A, { opacity: 0.95, duration: 0.5, ease: "power2.out" }, 3.0);
    [B, C].forEach((i, k) => tl.to("#f-pc" + i, { opacity: 0.4, duration: 0.6, ease: "power2.out" }, 3.4 + k * 0.2));

    // linhas: desenham da origem pro destino
    arestas.forEach(([t, d], n) => tl.to("#f-l" + n, { strokeDashoffset: 0, duration: d, ease: "power2.inOut" }, t));

    // acender cada pessoa: ganha cor e abre os braços
    for (let i = 0; i < N; i++) {
      const t = acende[i];
      tl.to("#f-pk" + i, { opacity: 1, duration: 0.25, ease: "power2.out" }, t);
      tl.to("#f-pc" + i, { opacity: 0, duration: 0.25 }, t);
      tl.fromTo(P(i), { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "back.out(2)", immediateRender: false }, t);
    }

    // 3 · caminhos (7–11,5 s)
    tl.to("#f-camera", { ...${JSON.stringify(cam3)}, duration: 1.2, ease: "power2.inOut" }, 7.0);
    estampa.forEach(([id], k) => tl.to("#" + id + "o", { opacity: 0.75, duration: 0.5, ease: "power2.out" }, 8.0 + k * 0.12));

    // 4 · rede (11,5–16,5 s)
    tl.to("#f-camera", { x: 0, y: 0, scale: 1, duration: 4.0, ease: "power2.inOut" }, 11.2);
    for (let i = 0; i < N; i++) if (![A, B, C].includes(i)) tl.to("#f-pc" + i, { opacity: 0.45, duration: 0.5 }, 11.4 + (acende[i] - 12) * 0.25);
    estampa.forEach(([id], k) => tl.to("#" + id + "f", { opacity: 1, duration: 0.35, ease: "power2.out" }, 12.0 + k * 0.16));

    // 5 · árvore (16,5–21 s)
    tl.to("#f-linhas", { opacity: 0, duration: 0.6, ease: "power2.in" }, 16.5);
    tl.to(".f-eo, .f-ef", { opacity: 0, duration: 0.6, ease: "power2.in" }, 16.6);
    const ordem = [...Array(N).keys()].sort((a, b) => centro[b][1] - centro[a][1]);
    ordem.forEach((i, k) => tl.to(P(i), { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.7, ease: "power3.inOut" }, 16.8 + k * 0.11));
    tl.to("#f-semente", { opacity: 0, duration: 0.4 }, 17.6);
    tl.to("#f-maos-rect", { attr: { y: ${r2(MAOS_TOPO)} }, duration: 2.2, ease: "power2.out" }, 17.4);

    // 6 · pouso na assinatura (21–24 s)
    tl.to("#f-arvore", { x: ${r2(tx2)}, y: ${r2(ty2)}, scale: ${r2(ts2 * 10000) / 10000}, duration: 1.4, ease: "power3.inOut" }, 21.0);
    tl.fromTo("#f-inst", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, 22.33);
    tl.fromTo("#f-sem", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power2.out" }, 23.29);

    window.__timelines["filme"] = tl;
  </script>
</template>
`;

  // legendas: uma frase por grupo, palavra por palavra
  const L = F.leg;
  const grupos = FALAS.map(f => {
    const g = f.estilo === 'gesto';
    const spans = f.palavras.map(([w, t, b], k) => `<span id="c-${f.id}${k}" class="c-w${b ? ' c-b' : ''}">${w}</span>`).join(' ');
    const cred = f.credito ? `<div id="c-${f.id}cred" class="c-cred">${f.credito}</div>` : '';
    return `<div id="c-${f.id}" class="clip c-grupo${g ? ' c-gesto' : ''}" data-start="${f.ini}" data-duration="${r2(f.fim - f.ini)}" data-track-index="0"><div class="c-linha">${spans}</div>${cred}</div>`;
  }).join('\n    ');
  const legScript = FALAS.map(f => {
    const loc = t => r2(t - f.ini);
    return f.palavras.map(([w, t], k) => `tl.fromTo("#c-${f.id}${k}", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.13, ease: "power2.out" }, ${t});`).join('\n    ')
      + (f.credito ? `\n    tl.fromTo("#c-${f.id}cred", { opacity: 0 }, { opacity: 1, duration: 0.3 }, ${f.palavras[2][1]});` : '')
      + `\n    tl.to("#c-${f.id} .c-linha, #c-${f.id} .c-cred", { opacity: 0, duration: 0.15, ease: "power2.in" }, ${r2(f.fim - 0.15)});`;
  }).join('\n    ');
  const legendas = `<template>
  <style>
    #root { position: absolute; inset: 0; }
    .c-grupo { position: absolute; left: 0; width: ${W}px; top: 0; height: ${H}px; text-align: center; font-family: Poppins; }
    .c-linha { position: absolute; left: ${(W - L.maxW) / 2}px; width: ${L.maxW}px; bottom: ${H - L.base}px; color: ${COR.marrom}; font-weight: 600; font-size: ${L.size}px; line-height: 1.18; letter-spacing: -0.01em; }
    .c-gesto .c-linha { color: ${COR.tinta}; font-weight: 300; font-style: italic; font-size: ${L.gesto}px; }
    .c-gesto .c-b { font-weight: 800; }
    .c-w { display: inline-block; }
    .c-cred { position: absolute; left: 0; width: ${W}px; top: ${L.credY - L.cred}px; color: ${COR.tinta}; font-size: ${L.cred}px; font-weight: 400; }
  </style>
  <div id="root" data-composition-id="legendas" data-width="${W}" data-height="${H}">
    ${grupos}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${legScript}
    window.__timelines["legendas"] = tl;
  </script>
</template>
`;

  const index = `<!doctype html>
<html lang="pt-BR" data-resolution="${W > H ? 'landscape' : 'portrait'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: ${COR.papel}; }
      #filme { z-index: 1; }
      #legendas { z-index: 2; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">
      <div id="filme" data-composition-id="filme" data-composition-src="compositions/filme.html" data-start="0" data-duration="${DUR}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>
      <div id="legendas" data-composition-id="legendas" data-composition-src="compositions/legendas.html" data-start="0" data-duration="${DUR}" data-track-index="2" data-track-kind="captions" data-width="${W}" data-height="${H}"></div>
      <audio id="trilha" class="clip" src="assets/bgm/trilha.wav" data-start="0" data-duration="26.6" data-track-index="3" data-volume="1" data-fade-in="0.3" data-fade-out="2.4" data-automation="{&quot;version&quot;:1,&quot;lanes&quot;:[{&quot;target&quot;:&quot;volume&quot;,&quot;points&quot;:[{&quot;t&quot;:0,&quot;v&quot;:0.5},{&quot;t&quot;:0.35,&quot;v&quot;:0.32},{&quot;t&quot;:15.1,&quot;v&quot;:0.32},{&quot;t&quot;:15.5,&quot;v&quot;:0.85},{&quot;t&quot;:16.7,&quot;v&quot;:0.85},{&quot;t&quot;:16.95,&quot;v&quot;:0.32},{&quot;t&quot;:21.4,&quot;v&quot;:0.32},{&quot;t&quot;:21.7,&quot;v&quot;:0.8},{&quot;t&quot;:22.05,&quot;v&quot;:0.8},{&quot;t&quot;:22.2,&quot;v&quot;:0.35},{&quot;t&quot;:24.2,&quot;v&quot;:0.35},{&quot;t&quot;:24.5,&quot;v&quot;:0.7}]}]}"></audio>
      <audio id="voz-gesto" class="clip" src="assets/voice/loc-gesto.wav" data-start="0.3" data-track-index="5" data-volume="1"></audio>
      <audio id="voz-bolsa" class="clip" src="assets/voice/carta-bolsa.wav" data-start="3.75" data-track-index="5" data-volume="1"></audio>
      <audio id="voz-mentoria" class="clip" src="assets/voice/carta-mentoria.wav" data-start="7.85" data-track-index="5" data-volume="1"></audio>
      <audio id="voz-rede" class="clip" src="assets/voice/carta-rede.wav" data-start="12.2" data-track-index="5" data-volume="1"></audio>
      <audio id="voz-florescendo" class="clip" src="assets/voice/loc-rede.wav" data-start="16.9" data-track-index="5" data-volume="1"></audio>
      <audio id="voz-marca" class="clip" src="assets/voice/loc-marca.wav" data-start="22.15" data-track-index="5" data-volume="1"></audio>
      <audio id="sfx-rebobina" class="clip" src="assets/sfx/whoosh.mp3" data-start="0.54" data-track-index="4" data-volume="0.5"></audio>
      <audio id="sfx-semente" class="clip" src="assets/sfx/pop.mp3" data-start="1.03" data-track-index="4" data-volume="0.9"></audio>
      <audio id="sfx-acende-a" class="clip" src="assets/sfx/pop.mp3" data-start="4.41" data-track-index="4" data-volume="0.7"></audio>
      <audio id="sfx-acende-b" class="clip" src="assets/sfx/click-soft.mp3" data-start="8.16" data-track-index="4" data-volume="1"></audio>
      <audio id="sfx-acende-c" class="clip" src="assets/sfx/pop.mp3" data-start="9.31" data-track-index="4" data-volume="0.6" data-playback-rate="1.12"></audio>
      <audio id="sfx-pouso" class="clip" src="assets/sfx/whoosh-short.mp3" data-start="21.54" data-track-index="4" data-volume="0.4" data-playback-rate="0.85"></audio>
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
  const dir = path.join(AQUI, nome);
  fs.mkdirSync(path.join(dir, 'compositions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), index);
  fs.writeFileSync(path.join(dir, 'compositions/filme.html'), filme);
  fs.writeFileSync(path.join(dir, 'compositions/legendas.html'), legendas);
  console.log(nome, 'ok · A/B/C =', iA, iB, iC, '· linhas', arestas.length, '· células de estampa', blocos.length);
}

for (const [nome, F] of Object.entries(FORMATOS)) gerar(nome, F);
