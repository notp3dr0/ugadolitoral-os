// Plano 8 (0:21 a 0:26) · o ateliê. Fundo vermelho do símbolo, mãos em silhueta, e o 1K2Q
// sendo enfiado: um par de contas a cada colcheia (6 quadros a 150 BPM), strass acende, cruzes encaixam.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, janela, clamp, lerp, rgba, gRad, gLin, rnd, estrela, texto, trilho} = O;
  const INI = 630;
  const PRIMEIRA = 6; // quadro (local) em que o primeiro par encaixa
  const PASSO = 6; // uma colcheia
  const VIAGEM = 13; // quanto dura a descida de cada conta
  const CRUZES = {0: 108, 2: 114, 1: 120}; // esquerda, direita, e a do meio por último (25,0 s)

  // geometria do colar no ateliê (o plano 9 parte daqui)
  const GEO8 = {cx: 540, topo: 452, a: 330, b: 746, r: 25};
  O.GEO8 = GEO8;

  // monta o colar numa geometria: trilho, contas e cruzes
  O.colarEm = (geo, o = {}) => {
    const tr = trilho(O.pecas.arcoU(geo.cx, geo.topo, geo.a, geo.b, {balanco: o.balanco || 0}));
    return {tr, col: O.pecas.k2qContas(tr, geo.r)};
  };
  // o fio
  O.fioDoColar = (ctx, tr, o = {}) => {
    const ate = o.ate == null ? 1 : o.ate; // 0..1, o fio aparece das pontas pro meio
    if (ate <= 0) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = o.grosso || 2.5;
    ctx.strokeStyle = o.cor || 'rgba(255,240,226,0.85)';
    const n = tr.pts.length;
    const meio = Math.floor(n / 2);
    const q = Math.floor(meio * ate);
    ctx.beginPath();
    for (let i = 0; i <= q; i++) i ? ctx.lineTo(tr.pts[i][0], tr.pts[i][1]) : ctx.moveTo(tr.pts[i][0], tr.pts[i][1]);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= q; i++) i ? ctx.lineTo(tr.pts[n - 1 - i][0], tr.pts[n - 1 - i][1]) : ctx.moveTo(tr.pts[n - 1][0], tr.pts[n - 1][1]);
    ctx.stroke();
    ctx.restore();
  };

  // fundo do ateliê: vermelho com profundidade (peças penduradas ao fundo, em tom mais escuro)
  const fundo = (ctx, f, o = {}) => {
    const l = f - INI;
    const entra = o.entra == null ? prog(l, 0, 14, E.outCubic) : o.entra;
    ctx.fillStyle = C.vermelho;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = entra;
    ctx.fillStyle = gRad(ctx, 540, 760, 80, 540, 900, 1250, [
      [0, '#C9170D'],
      [0.45, C.vermelho],
      [0.8, '#8E0904'],
      [1, '#6A0603'],
    ]);
    ctx.fillRect(0, 0, W, H);
    // peças penduradas ao fundo, fora de foco: fios, contas e cruzes num tom só
    const deriva = l * 0.35;
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 168 + Math.sin(i * 2.3) * 30 - deriva * (0.3 + rnd(i, 801) * 0.4);
      const comp = 380 + rnd(i, 802) * 900;
      const bal = Math.sin(f * 0.02 + i * 1.7) * 10;
      ctx.strokeStyle = rgba('#7A0703', 0.55);
      ctx.fillStyle = rgba('#7A0703', 0.55);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.quadraticCurveTo(x + bal * 0.4, comp * 0.5, x + bal, comp);
      ctx.stroke();
      const n = 5 + Math.floor(rnd(i, 803) * 7);
      for (let k = 0; k < n; k++) {
        const u = 1 - k / (n + 2) * 0.5;
        ctx.beginPath();
        ctx.arc(x + bal * u * u, comp * u - k * 6, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      if (i % 2 === 0) {
        ctx.save();
        ctx.translate(x + bal, comp + 6);
        ctx.rotate(bal * 0.01);
        O.pecas.cruzCaminho(ctx, 170, i % 4 === 0 ? 'centro' : 'lado');
        ctx.fill();
        ctx.restore();
      }
    }
    // feixes de luz vindos do alto
    for (let i = 0; i < 3; i++) {
      const x = 180 + i * 330 + Math.sin(f * 0.012 + i) * 30;
      ctx.beginPath();
      ctx.moveTo(x - 50, -20);
      ctx.lineTo(x + 70, -20);
      ctx.lineTo(x + 380, H);
      ctx.lineTo(x + 60, H);
      ctx.closePath();
      ctx.fillStyle = gLin(ctx, 0, 0, 0, H, [[0, 'rgba(255,170,140,0.13)'], [1, 'rgba(255,170,140,0)']]);
      ctx.fill();
    }
    ctx.restore();
    O.cen.ciscos(ctx, f, {n: 26, vx: 1.2, vy: 1.6, alfa: 0.35 * entra, tam: 2.6, cor: '#FFD9C8', sal: 8});
  };
  O.P = O.P || {};
  O.P.p8fundo = fundo;

  O.P.p8 = (ctx, f) => {
    if (f >= 766) return O.P.p9(ctx, f); // a passagem pro plano 9 é dele
    const l = f - INI;
    const F = O.fig;
    fundo(ctx, f);
    ctx.save();
    const zoom = 1 + l * 0.00035;
    ctx.translate(540, 760);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -760);

    // o fio cede um pouco a cada conta que chega, e balança
    let cede = 0;
    for (let k = 0; k < 17; k++) {
      const dt = l - (PRIMEIRA + k * PASSO);
      if (dt >= 0) cede += 9 * Math.exp(-dt / 4.5) * Math.cos(dt * 1.0);
    }
    for (const k in CRUZES) {
      const dt = l - CRUZES[k];
      if (dt >= 0) cede += (k === '1' ? 30 : 16) * Math.exp(-dt / 6) * Math.cos(dt * 0.75);
    }
    const entra = prog(l, -2, 12, E.outExpo);
    const geo = Object.assign({}, GEO8, {b: GEO8.b + cede - (1 - entra) * 120});
    const {tr, col} = O.colarEm(geo, {balanco: Math.sin(l * 0.07) * 5});
    O.fioDoColar(ctx, tr, {ate: prog(l, -2, 10, E.outCubic)});

    // texto pequeno dentro do arco
    {
      const p = Math.min(prog(l, 14, 32, E.outExpo), 1 - prog(l, 124, 134, E.inCubic));
      if (p > 0) {
        const y = 836 + (1 - prog(l, 14, 32, E.outExpo)) * 30;
        texto(ctx, 'FEITO À MÃO', 540 + 8, y, {tam: 46, peso: 500, entre: 16, alinhar: 'center', cor: C.papel, alfa: p});
        ctx.fillStyle = rgba(C.papel, p * 0.7);
        ctx.fillRect(540 - 36 * p, y + 34, 72 * p, 2.5);
        estrela(ctx, 540, y - 92, 20 * p, l * 0.03, rgba(C.papel, p));
      }
    }

    // cruzes e contas
    const chegada = (c) => PRIMEIRA + c.ordem * PASSO;
    const desloc = (c) => {
      const A = chegada(c);
      if (l >= A) return null;
      const u = clamp((l - (A - VIAGEM)) / VIAGEM);
      const de = c.lado < 0 ? -geo.r * 1.2 : tr.total + geo.r * 1.2;
      return tr.em(lerp(de, c.s, E.inQuad(u)));
    };
    O.pecas.k2qDesenhar(ctx, col, geo.r, {
      reflexo: '#C9170D',
      t: f,
      rot: l * 0.03,
      escala: (c) => {
        const A = chegada(c);
        if (l < A - VIAGEM) return 0;
        if (l < A) return prog(l, A - VIAGEM, A - VIAGEM + 3, E.outCubic);
        const dt = l - A;
        return 1 + 0.2 * Math.exp(-dt / 2) * Math.cos(dt * 1.5); // o tranco do encaixe
      },
      dx: (c) => {
        const p = desloc(c);
        return p ? p.x - c.x : 0;
      },
      dy: (c) => {
        const p = desloc(c);
        return p ? p.y - c.y : 0;
      },
      brilhoBola: (c) => {
        const dt = l - chegada(c);
        if (dt < 0) return 0;
        // acende forte no encaixe e depois fica piscando de leve
        return Math.max(1.5 * Math.exp(-dt / 4), 0.28 * Math.max(0, Math.sin(l * 0.3 + c.i * 2.1)) * prog(dt, 6, 14));
      },
      cruz: (k) => {
        const A = CRUZES[k];
        const dt = l - A;
        if (l < A - 9) return {escala: 0};
        if (dt < 0) {
          const p = prog(l, A - 9, A, E.inQuad);
          return {escala: 1, dy: -(1 - p) * 30 + (1 - p) * 760, ang: (1 - p) * (k === 0 ? -0.5 : k === 2 ? 0.5 : 0.25), faixa: 0.2};
        }
        return {
          escala: 1 + 0.12 * Math.exp(-dt / 2.5),
          ang: (k === 1 ? 0.2 : 0.3) * Math.exp(-dt / 8) * Math.sin(dt * 0.55 + (k === 2 ? Math.PI : 0)) + Math.sin(l * 0.07 + k) * 0.02,
          brilho: 1.5 * Math.exp(-dt / 3),
          faixa: clamp(dt / 14),
        };
      },
    });
    // estalo de luz em cada pérola que encaixa
    for (const c of col.contas) {
      if (c.tipo !== 'p') continue;
      const dt = l - chegada(c);
      if (dt >= 0 && dt < 5) estrela(ctx, c.x - geo.r * 0.3, c.y - geo.r * 0.3, geo.r * 1.6 * (1 - dt / 5), l * 0.1, '#FFFFFF', 0.07);
    }

    // as mãos: seguram as pontas do fio e soltam uma conta por colcheia
    const pe = tr.em(0);
    const pd = tr.em(tr.total);
    const emCurso = l > PRIMEIRA - VIAGEM - 2 && l < PRIMEIRA + 16 * PASSO - VIAGEM + 4;
    const fase = (((l - (PRIMEIRA - VIAGEM)) % PASSO) + PASSO) % PASSO;
    const abre = emCurso ? Math.max(0, 1 - fase / 3.2) * 0.7 : 0;
    const quica = emCurso ? Math.max(0, 1 - fase / 4) * 9 : 0;
    const chega = (1 - prog(l, -4, 12, E.outExpo)) * 520;
    const flut = Math.sin(l * 0.05) * 4;
    F.maoPinca(ctx, pe.x + 4 - chega, pe.y - 8 - chega * 0.8 + quica + flut, 0.6, 0.1, {abre, corLuz: 'rgba(255,120,90,0.5)'});
    F.maoPinca(ctx, pd.x - 4 + chega, pd.y - 8 - chega * 0.8 + quica - flut, 0.6, 0.1, {abre, espelha: -1, corLuz: 'rgba(255,120,90,0.35)'});
    ctx.restore();
    return {vinheta: 0.42};
  };
})(typeof window !== 'undefined' ? window : globalThis);
