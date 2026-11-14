// Plano 10 (0:29 a 0:32) · totalidade. Ele sai pelo portão com o eclipse fechado atrás da cabeça:
// céu vermelho quase preto, coroa de raios, as pérolas acendem com o crescente do símbolo,
// colar balançando no vento e a G1 brilhando no punho erguido.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, janela, clamp, lerp, rgba, gRad, gLin, rnd, estrela, fpoli} = O;
  const INI = 870;
  const SOL = {x: 540, y: 330, r: 215};
  const BUSTO = {x: 540, y: 1130, k: 0.98};

  const coroa = (ctx, x, y, r, f, forca) => {
    // brilho largo
    ctx.fillStyle = gRad(ctx, x, y, r * 0.9, x, y, r * 4.2, [
      [0, `rgba(255,214,190,${0.75 * forca})`],
      [0.18, `rgba(226,74,48,${0.5 * forca})`],
      [0.5, `rgba(150,20,10,${0.26 * forca})`],
      [1, 'rgba(120,10,5,0)'],
    ]);
    ctx.fillRect(x - r * 4.3, y - r * 4.3, r * 8.6, r * 8.6);
    // raios: triângulos finos, compridos e curtos alternados, girando devagar
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(f * 0.0035);
    const n = 44;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(i, 901) * 0.08;
      const comp = r * (1.25 + Math.pow(rnd(i, 902), 2.2) * 2.6 + (i % 11 === 0 ? 1.4 : 0)) * (0.92 + 0.08 * Math.sin(f * 0.11 + i * 1.7)) * (0.5 + 0.5 * forca);
      const larg = r * (0.03 + rnd(i, 903) * 0.06);
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(r * 0.95, -larg);
      ctx.lineTo(comp, 0);
      ctx.lineTo(r * 0.95, larg);
      ctx.closePath();
      ctx.fillStyle = gLin(ctx, r, 0, comp, 0, [[0, `rgba(255,238,222,${0.9 * forca})`], [0.35, `rgba(255,190,160,${0.45 * forca})`], [1, 'rgba(255,160,130,0)']]);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // anel interno
    ctx.beginPath();
    ctx.arc(x, y, r * 1.04, 0, Math.PI * 2);
    ctx.lineWidth = r * 0.07;
    ctx.strokeStyle = `rgba(255,246,236,${0.95 * forca})`;
    ctx.stroke();
  };

  O.P = O.P || {};
  O.P.p10 = (ctx, f) => {
    const l = f - INI;
    const F = O.fig;
    const S = O.simbolo;
    const entra = prog(l, 0, 18, E.outExpo);
    const zoom = lerp(1.16, 1, entra) + l * 0.0005;
    ctx.save();
    ctx.translate(540, 700);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -700);

    // céu
    ctx.fillStyle = gRad(ctx, SOL.x, SOL.y, 100, SOL.x, SOL.y + 300, 1900, [[0, '#5A0A05'], [0.35, '#340603'], [0.7, '#1C0302'], [1, '#0E0101']]);
    ctx.fillRect(-200, -200, W + 400, H + 400);
    // a lua fecha sobre o sol no primeiro compasso; a coroa abre junto
    const fecha = prog(l, 0, 12, E.outCubic);
    const volta = prog(l, 68, 84, E.inCubic); // o sol voltando, pra passagem final
    coroa(ctx, SOL.x, SOL.y, SOL.r, f, clamp(0.25 + 0.75 * fecha + volta * 0.6));
    // disco: sol branco quase todo coberto, o filete some
    ctx.beginPath();
    ctx.arc(SOL.x, SOL.y, SOL.r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF6EC';
    ctx.fill();
    const desl = (1 - fecha) * 0.2 * SOL.r + volta * SOL.r * 0.22;
    ctx.beginPath();
    ctx.arc(SOL.x + desl, SOL.y, SOL.r * S.RAZAO_LUA * 0.985, 0, Math.PI * 2);
    ctx.fillStyle = '#0B0101';
    ctx.fill();
    // conta de luz na borda quando o sol volta
    if (volta > 0) estrela(ctx, SOL.x - SOL.r * 0.99, SOL.y - SOL.r * 0.08, 380 * volta, 0.2, '#FFFFFF', 0.05);

    // portão: a estrutura do símbolo, enorme, o vão em volta do eclipse
    const kG = (SOL.r * 1.2) / S.SOL.r;
    const yBase = SOL.y + (303 - S.SOL.y) * kG;
    // chão escuro, com o caminho de luz que sai do vão
    ctx.fillStyle = gLin(ctx, 0, yBase - 30, 0, H, [[0, '#2A0604'], [0.4, '#160302'], [1, '#090101']]);
    ctx.fillRect(-200, yBase - 30, W + 400, H - yBase + 240);
    fpoli(ctx, [[SOL.x - 130, yBase - 30], [SOL.x + 130, yBase - 30], [SOL.x + 760, H + 200], [SOL.x - 760, H + 200]], 'rgba(170,30,16,0.2)');
    S.portao(ctx, 540, yBase, S.VB.w * kG, {cor: '#190403', corFundo: '#5C0E08', prof: 4.2, dxProf: -0.5, dyProf: -0.75});
    // brasas e poeira no vento
    O.cen.ciscos(ctx, f, {n: 46, vx: 13, vy: -1.5, alfa: 0.75, tam: 2.6, cor: '#FFB9A0', sal: 31});
    O.cen.vento(ctx, f, 900, H, {n: 14, vel: 34, alfa: 0.22, cor: '#FF9C80', sal: 5});

    // ele
    const passo = Math.sin(l * 0.21);
    const bx = BUSTO.x + passo * 7;
    const by = BUSTO.y + Math.abs(Math.cos(l * 0.21)) * 9 + (1 - entra) * 90;
    const tons = F.tonsContraluz(0.74, '#170403');
    tons.oculos = '#7A0F08';
    tons.ponta = '#5A0A06';
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(BUSTO.k, BUSTO.k);
    F.busto(ctx, {parte: 'baixo', tons, t: f, vento: 0.55});
    ctx.restore();
    // o 1K2Q balançando
    const k9 = BUSTO.k / O.BUSTO9.k;
    const bal = Math.sin(l * 0.21 - 0.9) * 16 + Math.sin(l * 0.09) * 6;
    const geo = {cx: bx, topo: by - 12 * k9, a: O.GEO9.a * k9, b: O.GEO9.b * k9 + Math.abs(Math.cos(l * 0.21)) * 5, r: O.GEO9.r * k9};
    const {tr, col} = O.colarEm(geo, {balanco: bal});
    O.fioDoColar(ctx, tr, {grosso: 1.4, cor: 'rgba(255,220,200,0.4)'});
    const acende = (c) => prog(l, 10 + c.ordem * 1.3, 22 + c.ordem * 1.3, E.outCubic);
    O.pecas.k2qDesenhar(ctx, col, geo.r, {
      modo: 'eclipse',
      t: f,
      rot: l * 0.04,
      luzDe: () => -Math.PI / 2 - 0.1,
      acesa: acende,
      acesaCruz: prog(l, 22, 38, E.outCubic),
      brilhoBola: (c) => Math.max(janela(l, 10 + c.ordem * 1.3, 13 + c.ordem * 1.3, 14 + c.ordem * 1.3, 24 + c.ordem * 1.3, E.outCubic) * 1.2, 0.35 * Math.max(0, Math.sin(f * 0.33 + c.i * 2.1))),
      cruz: (k) => ({
        escala: 1,
        ang: Math.sin(l * 0.21 - 1.5 - k * 0.25) * (k === 1 ? 0.2 : 0.28),
        brilho: janela(l, 30 + k * 3, 33 + k * 3, 35 + k * 3, 46 + k * 3, E.outCubic) * 0.9,
        faixa: clamp(((l + k * 9) % 40) / 18),
      }),
    });
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(BUSTO.k, BUSTO.k);
    F.busto(ctx, {
      parte: 'cima',
      tons,
      t: f,
      vento: 0.55,
      cabeca: true,
      escalaCabeca: 0.94,
      luzBorda: 'rgba(255,160,130,0.55)',
      corLente: '#120202',
      grossoDread: 40,
      reflexo: (c, s, rx, ry) => {
        c.fillStyle = '#FFE9DA';
        c.beginPath();
        c.arc(-4 * s, -6, 20, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#120202';
        c.beginPath();
        c.arc(-4 * s + 5, -2, 20, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,120,90,0.25)';
        c.fillRect(-rx, -ry, rx * 2, 14);
      },
    });
    ctx.restore();
    // punho erguido (o direito dele, à esquerda do quadro), com a G1
    {
      const sobe = prog(l, 8, 30, E.outBack);
      const px = 158 + passo * 5;
      const py = 850 + (1 - sobe) * 900 + Math.abs(Math.cos(l * 0.21)) * 6;
      const kp = 0.8;
      F.punho(ctx, px, py, kp, 0.2, {fecha: 1, tons, manga: 250, compr: 900});
      const pul = O.pulseiraG1(px - 8, py + 44, 96, 34, 0.2);
      const frente = pul.contas.filter((c) => !c.atras);
      O.pecas.g1Desenhar(ctx, frente, pul.r, {
        modo: 'eclipse',
        luzDe: () => -Math.PI / 2 + 0.3,
        acesa: (i) => prog(l, 26 + i * 0.5, 36 + i * 0.5),
        brilho: (i) => (O.pecas.G1_SEQ[i] === 'r' ? janela(l, 40 + i, 43 + i, 45 + i, 56 + i, E.outCubic) * 1.6 : 0),
        rot: l * 0.05,
      });
      const g = janela(l, 44, 48, 52, 70, E.outCubic);
      if (g > 0) estrela(ctx, px + 36, py + 60, 230 * g, 0.25 + l * 0.01, '#FFFFFF', 0.05);
    }
    ctx.restore();

    // passagem do plano 9: as duas tiras se abrem, uma pra cima e outra pra baixo
    if (f < 879) {
      const p = prog(f, 870, 879, E.outExpo);
      const {c, x} = O.telaAux('p9');
      O.P.p9(x, 869);
      ctx.drawImage(c, 0, 0, W, 1082, 0, -p * 1100, W, 1082);
      ctx.drawImage(c, 0, 1082, W, H - 1082, 0, 1082 + p * 860, W, H - 1082);
    }
    // passagem pra tela final: a luz volta e abre um disco de papel a partir do sol
    if (l >= 76) {
      const p = prog(l, 76, 90, E.inCubic);
      const R = SOL.r * 0.9 + p * 2100;
      ctx.save();
      ctx.beginPath();
      ctx.arc(SOL.x, SOL.y + p * 200, R, 0, Math.PI * 2);
      ctx.clip();
      O.P.p11(ctx, 960);
      ctx.restore();
      return {vinheta: 0.5 * (1 - p), grao: 0.06};
    }
    return {vinheta: 0.5, grao: 0.07};
  };
})(typeof window !== 'undefined' ? window : globalThis);
