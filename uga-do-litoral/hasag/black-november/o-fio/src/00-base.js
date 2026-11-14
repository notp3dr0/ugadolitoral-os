// O FIO · base: constantes, paleta, easing, acaso com semente e ajudas de desenho.
// Tudo mora em window.OFIO. Scripts clássicos (sem módulos) pra abrir o index.html com dois cliques.
(function (g) {
  'use strict';
  const O = (g.OFIO = g.OFIO || {});

  O.W = 1080;
  O.H = 1920;
  O.FPS = 30;
  O.TOTAL = 1080;

  // Paleta. Papel, vermelho e preto são da marca; o resto é poeira e concreto do filme.
  O.C = {
    papel: '#F2F1ED',
    branco: '#FFFFFF',
    vermelho: '#AF0C05',
    vermelhoLuz: '#D4281C',
    vermelhoFundo: '#7E0803',
    sangue: '#3A0503',
    noite: '#140202',
    preto: '#0C0B0B',
    // poeira
    ceuAlto: '#EFEBE0',
    ceuBaixo: '#E6D8BC',
    areia1: '#DCCBA8',
    areia2: '#C9B289',
    ocre: '#B08D62',
    queimado: '#8A5F3F',
    terra: '#5C3D2B',
    // concreto, do longe pro perto
    conc1: '#D6CCB8',
    conc2: '#BEB19A',
    conc3: '#9B8D78',
    conc4: '#6F6355',
    conc5: '#403832',
    // personagem
    pele: '#8E5B3C',
    peleLuz: '#A9714B',
    peleSombra: '#6A4029',
    jaqueta: '#5F6C40',
    jaquetaLuz: '#7B8853',
    jaquetaSombra: '#434E2C',
    camiseta: '#B3140B',
    camisetaSombra: '#870B05',
    calca: '#191716',
    tenis: '#EEEBE3',
    dread: '#151312',
    // metal
    prata1: '#F4F4F2',
    prata2: '#B9BCC0',
    prata3: '#74787E',
    prata4: '#3C3F44',
    cinzaCorrente: '#8F9296',
  };

  // ---------- matemática ----------
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const E = {
    lin: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inQuart: (t) => t * t * t * t,
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    // mola amortecida: passa de 1 e assenta
    mola: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-6.5 * t) * Math.cos(11 * t)),
  };
  // progresso 0..1 do quadro f entre a e b, com easing
  const prog = (f, a, b, ease) => {
    const t = clamp((f - a) / (b - a));
    return ease ? ease(t) : t;
  };
  // sobe em [a,b], fica, desce em [c,d]
  const janela = (f, a, b, c, d, ease) => Math.min(prog(f, a, b, ease), 1 - prog(f, c, d, ease));

  // ---------- acaso com semente ----------
  const mulberry = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // valor fixo 0..1 para um índice e um sal (sem estado)
  const rnd = (i, sal = 0) => {
    let h = (Math.imul(i | 0, 374761393) + Math.imul(sal | 0, 668265263) + 0x9e3779b9) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
  // ruído suave 1D (valor), contínuo no tempo
  const ruido = (x, sal = 0) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return lerp(rnd(i, sal), rnd(i + 1, sal), u) * 2 - 1;
  };

  // ---------- cor ----------
  const hex2rgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mix = (a, b, t) => {
    const A = hex2rgb(a);
    const B = hex2rgb(b);
    t = clamp(t);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  };
  const mixHex = (a, b, t) => {
    const A = hex2rgb(a);
    const B = hex2rgb(b);
    t = clamp(t);
    const c = (i) => Math.round(lerp(A[i], B[i], t)).toString(16).padStart(2, '0');
    return '#' + c(0) + c(1) + c(2);
  };
  const rgba = (h, a) => {
    const A = hex2rgb(h);
    return `rgba(${A[0]},${A[1]},${A[2]},${a})`;
  };

  // ---------- formas ----------
  const poli = (ctx, pts) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  };
  const fpoli = (ctx, pts, cor) => {
    poli(ctx, pts);
    ctx.fillStyle = cor;
    ctx.fill();
  };
  // curva suave por pontos (Catmull-Rom em Bézier). fechada ou aberta.
  const curva = (ctx, pts, fechada = true, tensao = 0.5, comecar = true) => {
    const n = pts.length;
    const P = (i) => (fechada ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    if (comecar) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
    }
    const fim = fechada ? n : n - 1;
    for (let i = 0; i < fim; i++) {
      const p0 = P(i - 1);
      const p1 = P(i);
      const p2 = P(i + 1);
      const p3 = P(i + 2);
      const k = tensao / 3;
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * k,
        p1[1] + (p2[1] - p0[1]) * k,
        p2[0] - (p3[0] - p1[0]) * k,
        p2[1] - (p3[1] - p1[1]) * k,
        p2[0],
        p2[1]
      );
    }
    if (fechada) ctx.closePath();
  };
  const fcurva = (ctx, pts, cor, tensao) => {
    curva(ctx, pts, true, tensao);
    ctx.fillStyle = cor;
    ctx.fill();
  };
  const circ = (ctx, x, y, r, cor) => {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
    if (cor) {
      ctx.fillStyle = cor;
      ctx.fill();
    }
  };
  const elipse = (ctx, x, y, rx, ry, rot, cor) => {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot || 0, 0, Math.PI * 2);
    if (cor) {
      ctx.fillStyle = cor;
      ctx.fill();
    }
  };
  const ret = (ctx, x, y, w, h, cor) => {
    ctx.fillStyle = cor;
    ctx.fillRect(x, y, w, h);
  };
  const retArr = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const gLin = (ctx, x0, y0, x1, y1, paradas) => {
    const gr = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [p, c] of paradas) gr.addColorStop(p, c);
    return gr;
  };
  const gRad = (ctx, x0, y0, r0, x1, y1, r1, paradas) => {
    const gr = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (const [p, c] of paradas) gr.addColorStop(p, c);
    return gr;
  };
  // estrela de quatro pontas (o strass)
  const estrela = (ctx, x, y, r, rot = 0, cor = '#FFFFFF', fino = 0.11) => {
    if (r <= 0.2) return;
    const k = r * fino;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    // losangos cruzados de aresta reta: a faísca fica fina mesmo quando é grande
    ctx.moveTo(0, -r);
    ctx.lineTo(k, -k);
    ctx.lineTo(r, 0);
    ctx.lineTo(k, k);
    ctx.lineTo(0, r);
    ctx.lineTo(-k, k);
    ctx.lineTo(-r, 0);
    ctx.lineTo(-k, -k);
    ctx.closePath();
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.restore();
  };

  // ---------- texto ----------
  const FONTE = "'Jost', 'Futura', 'Century Gothic', sans-serif";
  const texto = (ctx, str, x, y, o = {}) => {
    const tam = o.tam || 48;
    ctx.save();
    ctx.font = `${o.italico ? 'italic ' : ''}${o.peso || 500} ${tam}px ${FONTE}`;
    ctx.letterSpacing = (o.entre || 0) + 'px';
    ctx.textAlign = o.alinhar || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    ctx.fillStyle = o.cor || '#000';
    if (o.alfa != null) ctx.globalAlpha *= o.alfa;
    ctx.fillText(str, x, y);
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };
  const medir = (ctx, str, o = {}) => {
    ctx.save();
    ctx.font = `${o.italico ? 'italic ' : ''}${o.peso || 500} ${o.tam || 48}px ${FONTE}`;
    ctx.letterSpacing = (o.entre || 0) + 'px';
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };

  // ---------- caminho medido: pontos com comprimento acumulado ----------
  // devolve {pts, total, em(s)} onde em(s) entrega {x,y,ang} a s px do começo
  const trilho = (pts) => {
    const acc = [0];
    for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = acc[acc.length - 1];
    const em = (s) => {
      if (s <= 0) {
        const a = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
        return {x: pts[0][0] + Math.cos(a) * s, y: pts[0][1] + Math.sin(a) * s, ang: a};
      }
      if (s >= total) {
        const n = pts.length;
        const a = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
        return {x: pts[n - 1][0] + Math.cos(a) * (s - total), y: pts[n - 1][1] + Math.sin(a) * (s - total), ang: a};
      }
      let lo = 0;
      let hi = acc.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (acc[m] <= s) lo = m;
        else hi = m;
      }
      const t = (s - acc[lo]) / (acc[hi] - acc[lo] || 1);
      return {
        x: lerp(pts[lo][0], pts[hi][0], t),
        y: lerp(pts[lo][1], pts[hi][1], t),
        ang: Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]),
      };
    };
    return {pts, total, em};
  };

  // ---------- acabamento: grão e vinheta ----------
  let graos = null;
  const fazerGraos = () => {
    graos = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const x = c.getContext('2d');
      const img = x.createImageData(512, 512);
      const r = mulberry(9001 + k * 77);
      for (let i = 0; i < 512 * 512; i++) {
        // soma de dois acasos: distribuição em tenda, mais parecida com grão de filme
        const v = (r() + r()) * 0.5;
        const n = Math.round(v * 255);
        img.data[i * 4] = n;
        img.data[i * 4 + 1] = n;
        img.data[i * 4 + 2] = n;
        img.data[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      graos.push(c);
    }
  };
  // força 0..1; escuro = quanto a vinheta pesa
  const acabamento = (ctx, frame, o = {}) => {
    const W = O.W;
    const H = O.H;
    const vin = o.vinheta == null ? 0.34 : o.vinheta;
    if (vin > 0) {
      const gr = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.48, H * 0.72);
      gr.addColorStop(0, 'rgba(20,6,2,0)');
      gr.addColorStop(0.7, `rgba(20,6,2,${vin * 0.35})`);
      gr.addColorStop(1, `rgba(20,6,2,${vin})`);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    const forca = o.grao == null ? 0.06 : o.grao;
    if (forca > 0) {
      if (!graos) fazerGraos();
      const tile = graos[frame % 4];
      const ox = Math.floor(rnd(frame, 11) * 512);
      const oy = Math.floor(rnd(frame, 12) * 512);
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = forca * 2;
      // grão um pouco maior que o pixel (1,5x, suavizado): mais de filme, e o H.264 agradece
      ctx.imageSmoothingEnabled = true;
      for (let y = -oy; y < H; y += 768) for (let x = -ox; x < W; x += 768) ctx.drawImage(tile, x, y, 768, 768);
      ctx.restore();
    }
  };

  // tela auxiliar reaproveitada (pra recortes e transições)
  const aux = {};
  const telaAux = (nome, w = O.W, h = O.H) => {
    let c = aux[nome];
    if (!c) {
      c = document.createElement('canvas');
      aux[nome] = c;
    }
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, w, h);
    return {c, x};
  };

  Object.assign(O, {
    clamp, lerp, E, prog, janela, mulberry, rnd, ruido, mix, mixHex, rgba, hex2rgb,
    poli, fpoli, curva, fcurva, circ, elipse, ret, retArr, gLin, gRad, estrela,
    FONTE, texto, medir, trilho, acabamento, telaAux,
  });
  O.TAU = Math.PI * 2;
  O.RAD = Math.PI / 180;
})(typeof window !== 'undefined' ? window : globalThis);
