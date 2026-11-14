// Plano 3 (0:08 a 0:12) · as três sombras surgem no fim da rua, em contraluz. Ele para.
// Três painéis verticais estreitos: o olho dele (a lente), o olho da sombra, a mão fechando.
// A sacola passa entre eles.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, janela, clamp, lerp, rgba, gLin, gRad, rnd, ruido, estrela, circ, fpoli} = O;
  const INI = 240;
  const VX = 540;
  const VY = 1240;
  const FOCO = 1000;
  O.RUA = {VX, VY, FOCO, SOL: {x: 540, y: 990, r: 360}, XW: 3.2};
  const SOMBRAS = [
    {X: -1.5, alt: 2.35, sem: 1},
    {X: 0.05, alt: 2.7, sem: 2},
    {X: 1.6, alt: 2.25, sem: 3},
  ];

  // a rua vista do chão, comum aos planos 3 e 7. camZ = quanto a câmera já andou; hc = altura dela
  O.ruaFundo = (ctx, f, o = {}) => {
    const K = O.cen;
    const hc = o.hc == null ? 1.2 : o.hc;
    const camZ = o.camZ || 0;
    const proj = K.fazerRua(VX, VY, FOCO, hc);
    K.ceuDia(ctx, VY + 2);
    if (o.sol !== false) K.sol(ctx, O.RUA.SOL.x, O.RUA.SOL.y, O.RUA.SOL.r, {halo: 1});
    if (o.atrasDoSol) o.atrasDoSol(proj);
    // skyline baixinho no horizonte
    const c1 = K.fazerCidade(o.semCidade || 71, -300, 1500, {lMin: 24, lMax: 80, aMin: 14, aMax: 90, pJan: 0, curva: 1.8});
    K.desenharCidade(ctx, c1, VY + 2, '#D8CCB4', {corVar: '#CEC1A7', extra: 0.5, fundo: 4});
    // chão
    K.chao(ctx, VY, {c0: '#EFE4CB', c1: '#DDCBA6', c2: '#C7AE84', c3: '#A98659'});
    // luz do sol escorrendo pela rua
    fpoli(ctx, [[VX - 40, VY], [VX + 40, VY], [VX + 520, H], [VX - 520, H]], 'rgba(255,250,236,0.4)');
    if (o.noChao) o.noChao(proj);
    const preds = K.ruaPredios(o.semRua || 77, 8)
      .map((p) => Object.assign({}, p, {z0: Math.max(0.45, p.z0 - camZ), z1: p.z1 - camZ}))
      .filter((p) => p.z1 > 0.7);
    K.desenharRua(ctx, proj, preds, O.RUA.XW, {perto: '#7C6D5A', pertoF: '#4A3F35', longe: '#D6C9B0', zMax: 34});
    // meio-fio: duas linhas de sombra convergindo
    for (const s of [-1, 1]) {
      const a = proj(s * O.RUA.XW, 0, 0.5);
      const b = proj(s * O.RUA.XW, 0, 60);
      const c = proj(s * (O.RUA.XW - 0.35), 0, 0.5);
      fpoli(ctx, [[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]], 'rgba(92,61,43,0.22)');
    }
    return proj;
  };

  const base = (ctx, f) => {
    const l = f - INI;
    const K = O.cen;
    const F = O.fig;
    const zoom = 1 + clamp(l / 120) * 0.035;
    ctx.save();
    ctx.translate(540, 1200);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -1200);
    const proj = O.ruaFundo(ctx, f);
    K.pedras(ctx, VY + 30, 0, {n: 30, sal: 4});

    // as três sombras: sobem do chão como calor, em contraluz
    const Zs = 11;
    SOMBRAS.forEach((s, i) => {
      const [x, y, k] = proj(s.X, 0, Zs);
      const sobe = prog(l, 4 + i * 7, 34 + i * 7, E.outCubic);
      if (sobe <= 0) return;
      const alt = s.alt * k * sobe;
      K.sombraLonga(ctx, x, y + 4, alt * 0.36, alt * 2.6, VX, VY - 60, 'rgba(60,36,24,0.42)');
      F.sombraFig(ctx, x, y + 4, alt, {dir: i === 2 ? -1 : 1, t: f, semente: s.sem, vento: 0.5, olho: prog(l, 40 + i * 6, 46 + i * 6, E.outBack), largura: 0.9});
    });

    // a sacola atravessa entre eles e as sombras
    {
      const p = prog(l, 58, 122);
      if (p > 0 && p < 1) {
        const bx = lerp(1220, -140, p);
        const q = Math.abs(Math.sin(p * Math.PI * 3.3 + 0.6));
        const cy = 1530;
        ctx.beginPath();
        ctx.ellipse(bx - 10, cy + 40, 56 - q * 16, 9 - q * 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(92,61,43,${0.3 - q * 0.14})`;
        ctx.fill();
        K.sacola(ctx, bx, cy - q * 110 - ruido(f * 0.08, 3) * 12, 50, -p * 8, f, {});
      }
    }
    K.vento(ctx, f, VY - 40, H - 80, {n: 16, vel: 24, alfa: 0.34});

    // ele, de costas, em primeiro plano: chega e para
    {
      const [x, y, k] = proj(-0.95, 0, 2.4);
      const alt = 1.75 * k;
      const anda = 1 - prog(l, 2, 26, E.outCubic);
      K.sombraLonga(ctx, x, y - 6, alt * 0.34, alt * 0.8, VX, VY - 60, 'rgba(60,36,24,0.4)');
      F.figCostas(ctx, x, y, alt, {fase: l * 0.26, andar: anda, t: f, vento: 0.5, punho: prog(l, 70, 92, E.inOutCubic), tons: F.tonsContraluz(0.3, '#2A1E16')});
    }
    K.ciscos(ctx, f, {n: 24, vx: 8, alfa: 0.5, tam: 2.4, cor: '#FFFBF0', sal: 2});
    ctx.restore();

    // os três painéis verticais
    const PX = [70, 390, 710];
    const PW = 300;
    const PY = 250;
    const PH = 760;
    for (let i = 0; i < 3; i++) {
      const pin = prog(l, 46 + i * 8, 60 + i * 8, E.outExpo);
      if (pin <= 0) continue;
      const pout = prog(l, 95 + i * 3, 107 + i * 3, E.inCubic);
      if (pout >= 1) continue;
      const dirY = i === 1 ? -1 : 1; // o do meio sobe, os de fora descem
      const dy = dirY * (-(1 - pin) * 1150 + pout * 1750);
      ctx.save();
      ctx.translate(0, dy);
      ctx.fillStyle = '#000';
      ctx.fillRect(PX[i] - 10, PY - 10, PW + 20, PH + 20);
      ctx.beginPath();
      ctx.rect(PX[i], PY, PW, PH);
      ctx.clip();
      ctx.translate(PX[i], PY);
      if (i === 0) painelLente(ctx, l, f, PW, PH);
      else if (i === 1) painelOlho(ctx, l, f, PW, PH);
      else painelMao(ctx, l, f, PW, PH);
      ctx.restore();
    }
  };

  // painel 1: o olho dele é a lente, e nela as três sombras
  const painelLente = (ctx, l, f, w, h) => {
    const F = O.fig;
    const T = F.TONS;
    const z = 1 + prog(l, 46, 112) * 0.1;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(z, z);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = T.pele;
    ctx.fillRect(-40, -40, w + 80, h + 80);
    fpoli(ctx, [[-40, -40], [w + 40, -40], [w + 40, 250], [-40, 300]], O.mixHex(T.peleS, '#000000', 0.2));
    fpoli(ctx, [[-40, 520], [w + 40, 470], [w + 40, h + 40], [-40, h + 40]], T.peleS);
    ctx.lineCap = 'round';
    for (let j = 0; j < 3; j++) F.dread(ctx, w - 6 + j * 30, -60, Math.PI / 2 + 0.05 * j, 520 + j * 120, 62, {t: f * 0.3, fase: j, balanco: 0.08, vento: 0.1, cor: T.dread, ponta: T.ponta, corte: 0.75, grav: 0.2});
    F.oculos(ctx, w / 2 - 88 * 2.05 - 4, h / 2 - 10, 2.05, {
      T,
      reflexo: (c, s, rx, ry) => {
        c.fillStyle = gLin(c, 0, -ry, 0, ry, [[0, '#F4EFE2'], [0.62, '#E6D8BA'], [1, '#B79F78']]);
        c.fillRect(-rx, -ry, rx * 2, ry * 2);
        c.fillStyle = '#FFFFFF';
        c.beginPath();
        c.arc(0, 6, 30, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#C9B48C';
        c.fillRect(-rx, 17, rx * 2, ry);
        // as três sombras, pequenas, crescendo na lente
        const cres = prog(l, 50, 110, E.inQuad);
        [[-15, 20], [0, 23], [15, 19]].forEach(([sx, sh], i) => {
          F.sombraFig(c, sx * (1 + cres * 0.5), 19, sh * (1 + cres * 0.6), {dir: i === 2 ? -1 : 1, t: f, semente: i + 1, semOlho: true});
        });
        c.fillStyle = 'rgba(255,255,255,0.28)';
        c.beginPath();
        c.moveTo(-rx, -ry);
        c.lineTo(-rx * 0.2, -ry);
        c.lineTo(-rx * 0.75, ry);
        c.lineTo(-rx, ry);
        c.fill();
      },
    });
    ctx.restore();
  };

  // painel 2: o capuz e um olho só
  const painelOlho = (ctx, l, f, w, h) => {
    ctx.fillStyle = '#0A0909';
    ctx.fillRect(0, 0, w, h);
    // dobras do capuz, um tom acima do preto
    fpoli(ctx, [[0, 0], [w * 0.5, 0], [w * 0.2, h * 0.5], [w * 0.42, h], [0, h]], '#151211');
    fpoli(ctx, [[w, 0], [w * 0.8, 0], [w * 0.92, h * 0.45], [w * 0.74, h], [w, h]], '#1B1513');
    const cx = w * 0.54;
    const cy = h * 0.47;
    const aperta = prog(l, 62, 104, E.inOutCubic);
    const acende = prog(l, 54, 64, E.outBack);
    const pulsa = 1 + Math.sin(f * 0.5) * 0.05;
    ctx.fillStyle = gRad(ctx, cx, cy, 0, cx, cy, 260 * pulsa, [[0, rgba(C.vermelhoLuz, 0.85 * acende)], [0.4, rgba(C.vermelho, 0.4 * acende)], [1, rgba(C.vermelho, 0)]]);
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 104 * acende, lerp(30, 9, aperta) * acende, -0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF4EA';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy, 30 * acende, lerp(30, 9, aperta) * acende, -0.12, 0, Math.PI * 2);
    ctx.fillStyle = C.vermelho;
    ctx.fill();
    O.cen.ciscos(ctx, f, {n: 14, vx: 2, vy: -3, alfa: 0.7, tam: 2.2, cor: '#FF8A6A', sal: 21});
  };

  // painel 3: a mão dele fecha
  const painelMao = (ctx, l, f, w, h) => {
    const F = O.fig;
    const T = F.TONS;
    ctx.fillStyle = T.jaqS;
    ctx.fillRect(0, 0, w, h);
    fpoli(ctx, [[0, 0], [w * 0.62, 0], [w * 0.3, h], [0, h]], T.jaq);
    fpoli(ctx, [[w * 0.62, 0], [w * 0.74, 0], [w * 0.44, h], [w * 0.3, h]], O.mixHex(T.jaqS, '#000000', 0.25));
    const fecha = prog(l, 66, 92, E.inOutCubic);
    const treme = fecha >= 1 ? Math.sin(f * 2.1) * 2.2 : 0;
    F.punho(ctx, w * 0.5 + treme, h * 0.66, 0.92, Math.PI, {fecha, manga: 250, compr: 700});
  };

  O.P = O.P || {};
  O.P.p3base = base;
  O.P.p3 = (ctx, f) => {
    base(ctx, f);
    if (f < 252) O.P.p2tiras(ctx, f);
  };
})(typeof window !== 'undefined' ? window : globalThis);
