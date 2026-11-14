// Plano 9 (0:26 a 0:29) · plano peito: o 1K2Q assenta no pescoço dele; uma tira entra por baixo
// com o punho, e a mão em silhueta fecha a G1: clique seco em 27,4 s (tempo 1 do compasso).
// A passagem do ateliê é dele: o vermelho do fundo vira a camiseta, a jaqueta fecha pelos lados.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, janela, clamp, lerp, rgba, gRad, gLin, estrela, texto, trilho, fpoli} = O;
  const INI = 780;
  const CLIQUE = 822;
  const BUSTO = {x: 540, y: 404, k: 1.35};
  const GEO9 = {cx: 540, topo: 392, a: 235, b: 440, r: 15.6};
  const TIRA_Y = 1096;
  O.GEO9 = GEO9;
  O.BUSTO9 = BUSTO;

  // a G1 em volta do pulso: elipse inclinada; a corrente e o fecho passam por trás do braço
  const pulseira = (cx, cy, rx, ry, giro) => {
    const pts = [];
    const N = 260;
    const c = Math.cos(giro);
    const s = Math.sin(giro);
    for (let i = 0; i <= N * 2; i++) {
      const th = -Math.PI / 2 + (i / N) * Math.PI * 2;
      const x = Math.cos(th) * rx;
      const y = Math.sin(th) * ry;
      pts.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    const tr = trilho(pts);
    const P = tr.total / 2;
    const Ls = P * 0.64;
    const r = Ls / O.pecas.G1_COMPR;
    const s0 = P / 2 - Ls / 2;
    const contas = O.pecas.g1Contas(tr, s0, r);
    contas.forEach((k, i) => {
      const sc = s0 + (Ls * (i + 0.5)) / contas.length;
      k.atras = sc < P * 0.25 || sc > P * 0.75;
    });
    return {tr, P, Ls, r, s0, contas};
  };
  O.pulseiraG1 = pulseira;

  const tira = (ctx, f) => {
    const l = f - INI;
    const P = O.pecas;
    const dt = f - CLIQUE;
    const fechada = dt >= 0;
    // fundo: um vermelho mais fundo que o da camiseta
    ctx.fillStyle = gRad(ctx, 700, 1420, 60, 700, 1420, 900, [[0, '#8E0A05'], [0.6, '#6B0603'], [1, '#470402']]);
    ctx.fillRect(0, TIRA_Y, W, H - TIRA_Y);
    // luz rasante
    fpoli(ctx, [[0, TIRA_Y], [520, TIRA_Y], [160, H], [0, H]], 'rgba(255,130,100,0.07)');

    const tranco = fechada ? 20 * Math.exp(-dt / 3.2) * Math.cos(dt * 1.25) : 20;
    const bx = 705;
    const by = 1408 + tranco;
    const pul = pulseira(bx, by, 282, 120, -0.07);
    const corMetal = C.prata2;
    // por trás do braço: corrente extensora, fecho e as contas do arco de trás
    const tamFecho = pul.r * 2.5;
    const fimCorrente = pul.P + pul.s0 - tamFecho * 1.12;
    P.corrente(ctx, pul.tr, pul.s0 + pul.Ls + pul.r * 0.5, fimCorrente, pul.r * 1.25, {cor: corMetal, grosso: pul.r * 0.18});
    const pf = pul.tr.em(fimCorrente);
    const alvo = pul.tr.em(pul.P + pul.s0 - pul.r * 0.3);
    P.argola(ctx, alvo.x, alvo.y, pul.r * 0.42, {cor: corMetal});
    const abreFecho = fechada ? 0 : 0.75 - 0.25 * prog(f, 812, CLIQUE, E.inQuad);
    P.fechoLagosta(ctx, pf.x, pf.y, tamFecho, pf.ang - abreFecho, {});
    const desenhar = (atras) =>
      P.g1Desenhar(ctx, pul.contas.filter((c) => c.atras === atras), pul.r, {
        reflexo: '#B01208',
        tom: atras ? 0.25 : 0,
        brilho: (i) => (fechada && P.G1_SEQ[i] === 'r' ? janela(dt, i * 0.5, 2 + i * 0.5, 4 + i * 0.5, 12 + i * 0.5, E.outCubic) : 0),
        rot: l * 0.04,
      });
    desenhar(true);
    // o punho dele
    O.fig.punho(ctx, 700, 1338 + tranco * 0.25, 1.0, -0.05, {fecha: 1, manga: 300, compr: 760});
    // sombra da pulseira na pele
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.ellipse(bx, by + 30, 250, 96, -0.07, 0.25, Math.PI - 0.25);
    ctx.lineWidth = 30;
    ctx.strokeStyle = '#3A1C10';
    ctx.stroke();
    ctx.restore();
    // recorta a sombra fora do braço: redesenha o fundo dos lados
    desenhar(false);

    // a mão que fecha: pinça no fecho, sai depois do clique
    {
      const sai = prog(f, CLIQUE + 3, CLIQUE + 18, E.inCubic);
      const chega = 1 - prog(f, 804, 818, E.outExpo);
      const hx = pf.x + tamFecho * 0.85 + (sai + chega) * 560;
      const hy = pf.y - 4 - (sai + chega) * 380;
      if (sai < 1) O.fig.maoPinca(ctx, hx, hy, 0.5, -0.5, {espelha: -1, abre: fechada ? clamp(dt / 4) : 0.1, corLuz: 'rgba(255,120,90,0.4)'});
    }
    // clique: clarão seco de dois quadros e estrela no fecho
    if (fechada) {
      if (dt < 2) {
        ctx.fillStyle = `rgba(255,244,236,${dt === 0 ? 0.55 : 0.2})`;
        ctx.fillRect(0, TIRA_Y, W, H - TIRA_Y);
      }
      const e = Math.exp(-dt / 3.2);
      if (e > 0.03) {
        estrela(ctx, pf.x + tamFecho * 0.7, pf.y, 250 * e, 0.3 + dt * 0.03, '#FFFFFF', 0.045);
        estrela(ctx, pf.x + tamFecho * 0.7, pf.y, 120 * e, 0.3 + Math.PI / 4, 'rgba(255,255,255,0.8)', 0.05);
      }
    }
    // etiqueta
    {
      const p = prog(f, CLIQUE + 2, CLIQUE + 14, E.outExpo);
      if (p > 0) {
        const x = 64 - (1 - p) * 120;
        ctx.save();
        ctx.globalAlpha = clamp(p * 1.5);
        ctx.fillStyle = C.papel;
        ctx.fillRect(x, 1174, 5, 54);
        ctx.restore();
        texto(ctx, '+ PULSEIRA G1', x + 22, 1220, {tam: 54, peso: 800, entre: 2, cor: C.papel, alfa: clamp(p * 1.5)});
      }
    }
  };

  O.P = O.P || {};
  O.P.p9 = (ctx, f) => {
    const l = f - INI;
    const F = O.fig;
    const p = prog(f, 766, 792, E.inOutCubic); // do ateliê pro peito
    O.P.p8fundo(ctx, f, {entra: 1});
    if (p > 0) {
      ctx.fillStyle = `rgba(40,3,1,${0.55 * p})`;
      ctx.fillRect(0, 0, W, H);
    }

    // respiração e o começo do giro do corpo
    const resp = Math.sin(l * 0.09) * 3;
    const vira = prog(f, 800, 846, E.inOutSine) * 26;
    const bx = BUSTO.x + vira * p;
    const by = BUSTO.y + resp * p;
    const bustoOpts = {t: f, vento: 0.35, alfaCamiseta: p, dyPescoco: -(1 - p) * 820, dxAbas: (1 - p) * 760};
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(BUSTO.k, BUSTO.k);
    F.busto(ctx, Object.assign({parte: 'baixo'}, bustoOpts));
    ctx.restore();

    // o colar: vem do tamanho do ateliê e assenta no peito
    const g8 = O.GEO8;
    const assenta = f >= 792 ? 10 * Math.exp(-(f - 792) / 5) * Math.cos((f - 792) * 0.7) : 0;
    const z8 = lerp(1 + (f - 630) * 0.00035, 1, p); // o zoom lento do ateliê, que se desfaz
    const geo = {
      cx: lerp(540 + (g8.cx - 540) * z8, GEO9.cx + vira, p),
      topo: lerp(760 + (g8.topo - 760) * z8, GEO9.topo + resp, p),
      a: lerp(g8.a * z8, GEO9.a, p),
      b: lerp(g8.b * z8, GEO9.b, p) + assenta,
      r: lerp(g8.r * z8, GEO9.r, p),
    };
    const bal = Math.sin(l * 0.11) * 4 - prog(f, 800, 824, E.outCubic) * 14 * Math.exp(-Math.max(0, f - 824) / 12) * Math.cos(Math.max(0, f - 824) * 0.3);
    const {tr, col} = O.colarEm(geo, {balanco: lerp(Math.sin((f - 630) * 0.07) * 5 * z8, bal, p)});
    O.fioDoColar(ctx, tr, {grosso: lerp(2.5, 1.6, p)});
    O.pecas.k2qDesenhar(ctx, col, geo.r, {
      reflexo: '#C9170D',
      t: f,
      rot: (f - 630) * 0.03,
      brilhoBola: (c) => 0.28 * Math.max(0, Math.sin((f - 630) * 0.3 + c.i * 2.1)),
      cruz: (k) => ({
        escala: 1,
        ang: (k === 1 ? 0.12 : k === 0 ? 0.2 : -0.2) * Math.exp(-Math.max(0, f - 766) / 16) * Math.sin((f - 766) * 0.42) + lerp(Math.sin((f - 630) * 0.07 + k) * 0.02, Math.sin(l * 0.1 + k * 1.3) * 0.03 - bal * 0.012, p),
        faixa: clamp(((f - 770 + k * 5) % 46) / 16),
      }),
    });

    // jaqueta por cima: as abas fecham pelos lados
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(BUSTO.k, BUSTO.k);
    F.busto(ctx, Object.assign({parte: 'cima'}, bustoOpts));
    // queixo e dreads entrando por cima do quadro
    ctx.translate(0, -(1 - p) * 820);
    fpoli(ctx, [[-128, -330], [128, -330], [128, -262], [56, -186], [-56, -186], [-128, -262]], F.TONS.pele);
    fpoli(ctx, [[10, -330], [128, -330], [128, -262], [56, -186], [10, -186], [36, -262]], F.TONS.peleS);
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? -1 : 1;
      const j = i % 4;
      F.dread(ctx, s * (146 + j * 30), -330, Math.PI / 2 - s * (0.1 + j * 0.09), 300 + j * 60 + (i * 37) % 70, 40, {t: f * 0.26, fase: i, balanco: 0.12, vento: 0.2, cor: F.TONS.dread, ponta: F.TONS.ponta, corte: 0.7});
    }
    ctx.restore();

    // as mãos que seguravam o fio vão pra nuca e somem
    {
      const some = prog(f, 782, 800, E.inCubic);
      if (some < 1) {
        const pe = tr.em(0);
        const pd = tr.em(tr.total);
        const k = lerp(0.6 * z8, 0.46, p);
        const flut = Math.sin((f - 630) * 0.05) * 4 * (1 - p);
        F.maoPinca(ctx, pe.x + 4 * z8 + some * 120, pe.y - 8 * z8 + flut - some * 620, k, 0.1, {corLuz: 'rgba(255,120,90,0.5)'});
        F.maoPinca(ctx, pd.x - 4 * z8 - some * 120, pd.y - 8 * z8 - flut - some * 620, k, 0.1, {espelha: -1, corLuz: 'rgba(255,120,90,0.35)'});
      }
    }

    // a tira de baixo entra pela direita
    const pt = prog(f, 800, 813, E.outExpo);
    if (pt > 0) {
      ctx.save();
      ctx.translate((1 - pt) * W, 0);
      ctx.beginPath();
      ctx.rect(0, TIRA_Y - 14, W, H - TIRA_Y + 14);
      ctx.clip();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, TIRA_Y - 14, W, 14);
      tira(ctx, f);
      ctx.restore();
    }
    return {vinheta: 0.4};
  };
})(typeof window !== 'undefined' ? window : globalThis);
