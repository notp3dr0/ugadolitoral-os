// Planos 4, 5 e 6 (0:12 a 0:18) · o duelo, num mundo só.
//   4 · silêncio: 24 quadros em que só o pano da jaqueta mexe; depois as sombras avançam.
//   5 · clarão: dois quadros em negativo (corte seco), um traço vermelho diagonal; ele aparece do outro lado.
//   6 · as sombras desmancham em fumaça; a corrente cinza dele arrebenta e cai até a poeira; close no elo partido.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, janela, clamp, lerp, rgba, gLin, gRad, rnd, ruido, estrela, circ, fpoli, trilho} = O;
  const GY = 1400; // linha do horizonte no plano aberto
  const GOLPE = 420;
  const HERO = {x0: 250, x1: 905, y: 1500, alt: 345};
  const SOMB = [
    {x: 720, y: 1492, alt: 440, sem: 1, anda: 335},
    {x: 838, y: 1508, alt: 505, sem: 2, anda: 350},
    {x: 955, y: 1494, alt: 425, sem: 3, anda: 365},
  ];
  const TA = [40, 1560]; // o traço do golpe, de A até B
  const TB = [1060, 1040];
  const yTraco = (x) => TA[1] + ((TB[1] - TA[1]) * (x - TA[0])) / (TB[0] - TA[0]);

  const traco = (ctx, larg, alfa) => {
    if (larg <= 0.2 || alfa <= 0) return;
    const dx = TB[0] - TA[0];
    const dy = TB[1] - TA[1];
    const d = Math.hypot(dx, dy);
    const nx = -dy / d;
    const ny = dx / d;
    const mx = lerp(TA[0], TB[0], 0.55);
    const my = lerp(TA[1], TB[1], 0.55);
    ctx.save();
    ctx.globalAlpha *= alfa;
    ctx.beginPath();
    ctx.moveTo(TA[0] - dx * 0.1, TA[1] - dy * 0.1);
    ctx.lineTo(mx + nx * larg, my + ny * larg);
    ctx.lineTo(TB[0] + dx * 0.1, TB[1] + dy * 0.1);
    ctx.lineTo(mx - nx * larg, my - ny * larg);
    ctx.closePath();
    ctx.fillStyle = C.vermelho;
    ctx.fill();
    ctx.restore();
  };

  // ---------- plano aberto ----------
  const larga = (ctx, f) => {
    const K = O.cen;
    const F = O.fig;
    // tempo do ambiente: congela no silêncio (360 a 384)
    const amb = f < 360 ? f : f < 384 ? 360 : 360 + (f - 384);
    const depois = f >= GOLPE;
    // câmera: empurra devagar no silêncio, acelera no avanço, e abre de novo depois do golpe
    let zoom;
    if (!depois) zoom = 1.06 + prog(f, 360, 384) * 0.05 + prog(f, 384, GOLPE, E.inCubic) * 0.13;
    else zoom = 1.04 + prog(f, GOLPE, 480, E.outCubic) * 0.08;
    const ccx = depois ? lerp(640, 800, prog(f, GOLPE, 480, E.inOutSine)) : 620;
    ctx.save();
    ctx.translate(ccx, 1380);
    ctx.scale(zoom, zoom);
    ctx.translate(-ccx, -1380);

    K.ceuDia(ctx, GY);
    K.sol(ctx, 600, 905, 335, {halo: 1});
    const c1 = K.fazerCidade(83, -300, 1600, {lMin: 30, lMax: 90, aMin: 30, aMax: 170, pJan: 0, curva: 1.7});
    K.desenharCidade(ctx, c1, GY, '#DCD2BD', {corVar: '#D3C7AF', extra: 0.6, fundo: 6});
    const c2 = K.fazerCidade(87, -400, 1700, {lMin: 70, lMax: 190, aMin: 60, aMax: 330, pJan: 0.1, jan: 26, curva: 2.6, vao: 220});
    K.desenharCidade(ctx, c2, GY + 4, '#C3B59B', {corVar: '#B8A98D', corJanela: rgba('#8F7F66', 0.45), corCaixa: '#B4442F', extra: 0.9, fundo: 6});
    ctx.fillStyle = gLin(ctx, 0, GY - 200, 0, GY, [[0, 'rgba(236,224,198,0)'], [1, 'rgba(236,224,198,0.8)']]);
    ctx.fillRect(-200, GY - 200, W + 400, 204);
    K.chao(ctx, GY + 4);
    ctx.fillStyle = gRad(ctx, 600, GY, 20, 600, GY + 60, 640, [[0, 'rgba(255,250,236,0.8)'], [1, 'rgba(255,250,236,0)']]);
    ctx.fillRect(-200, GY, W + 400, 560);
    K.pedras(ctx, GY + 10, 0, {n: 44, sal: 9});

    // clarão: depois do golpe, o fundo vira papel chapado e volta aos poucos
    const chapa = depois ? 1 - prog(f, 428, 448, E.inOutCubic) : 0;
    if (chapa > 0) {
      ctx.fillStyle = rgba(C.papel, chapa);
      ctx.fillRect(-300, -300, W + 600, H + 600);
    }

    // sombras
    const avanca = E.inCubic(prog(f, 384, GOLPE));
    const incl = 0.5 * prog(f, 384, 408, E.outCubic);
    SOMB.forEach((s, i) => {
      const x = s.x - avanca * s.anda;
      const y = s.y;
      const ta = 451 + i * 3; // quando começa a desmanchar
      const some = prog(f, ta + 6, ta + 26);
      const escorre = E.outCubic(prog(f, ta, ta + 9)) * 30;
      if (some < 0.9) K.sombraLonga(ctx, x, y, s.alt * 0.2, s.alt * 0.5 * (1 - some), 600, GY - 400, rgba('#3C2418', 0.26 * (1 - chapa) * (1 - some)));
      const op = {dir: -1, t: f < 384 ? 360 : f, semente: s.sem, vento: 0.5, inclina: incl, largura: 0.86 + avanca * 0.25, olho: depois ? 1 - prog(f, GOLPE, 440) : 1, some};
      if (f < ta) {
        F.sombraFig(ctx, x, y, s.alt, op);
      } else {
        // cortadas pelo traço: a metade de cima escorrega ao longo do corte
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-600, yTraco(-600));
        ctx.lineTo(1800, yTraco(1800));
        ctx.lineTo(1800, 3000);
        ctx.lineTo(-600, 3000);
        ctx.clip();
        F.sombraFig(ctx, x, y, s.alt, op);
        ctx.restore();
        ctx.save();
        ctx.translate(-escorre * 0.89, escorre * 0.455);
        ctx.beginPath();
        ctx.moveTo(-600, yTraco(-600));
        ctx.lineTo(1800, yTraco(1800));
        ctx.lineTo(1800, -2000);
        ctx.lineTo(-600, -2000);
        ctx.clip();
        F.sombraFig(ctx, x, y, s.alt, Object.assign({}, op, {semente: s.sem + 10}));
        ctx.restore();
      }
      // poeira do avanço
      if (f >= 388 && f < GOLPE) {
        for (let j = 0; j < 6; j++) {
          const u = ((f - 388) / 32 + rnd(j, 700 + i)) % 1;
          circ(ctx, x + 60 + u * 160 + j * 14, y - 6 - u * 46 * rnd(j, 701 + i), (10 + rnd(j, 702 + i) * 22) * (0.3 + u), rgba('#F3E7CD', 0.6 * (1 - u) * avanca));
        }
      }
    });

    // ele
    {
      const x = depois ? HERO.x1 : HERO.x0;
      const agacha = depois ? 1 - prog(f, 456, 478, E.inOutCubic) : 0.62 * prog(f, 392, 418, E.inOutCubic);
      const levanta = depois ? prog(f, 456, 478, E.inOutCubic) : 0;
      const pes = depois
        ? [{x: lerp(-0.21, -0.055, levanta), y: 0, giro: lerp(0.32, 0, levanta)}, {x: lerp(0.17, 0.055, levanta), y: 0, giro: 0}]
        : [{x: -0.06 - agacha * 0.08, y: 0, giro: agacha * 0.2}, {x: 0.06 + agacha * 0.05, y: 0, giro: 0}];
      const op = {
        andar: 0, t: f, vento: depois ? 0.9 - levanta * 0.4 : 0.55, agacha, pes, corrente: true,
        braco: depois ? lerp(-0.9, 0, levanta) : -agacha * 0.5,
        bracoTras: depois ? lerp(0.9, 0, levanta) : agacha * 0.7,
        cabeca: depois ? lerp(-0.25, 0, levanta) : 0,
      };
      K.sombraLonga(ctx, x, HERO.y, HERO.alt * 0.24, HERO.alt * 0.55, 600, GY - 400, rgba('#3C2418', 0.26 * (1 - chapa)));
      // rastro do salto, logo depois do golpe
      const rastro = depois ? 1 - prog(f, GOLPE, 430, E.outCubic) : 0;
      if (rastro > 0) {
        const yy = HERO.y - HERO.alt * 0.62;
        ctx.beginPath();
        ctx.moveTo(HERO.x0, yy);
        ctx.lineTo(x - 40, yy - 46 * rastro);
        ctx.lineTo(x - 40, yy + 60 * rastro);
        ctx.closePath();
        ctx.fillStyle = rgba('#0C0B0B', 0.9 * rastro);
        ctx.fill();
      }
      F.figLado(ctx, x, HERO.y, HERO.alt, op);
      if (chapa > 0.02) {
        const a = O.telaAux('silh');
        a.x.setTransform(ctx.getTransform());
        F.figLado(a.x, x, HERO.y, HERO.alt, Object.assign({}, op, {silhueta: '#0C0B0B'}));
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = chapa;
        ctx.drawImage(a.c, 0, 0);
        ctx.restore();
      }
    }
    K.vento(ctx, amb, GY - 40, H - 80, {n: 18, vel: 26, alfa: 0.36 * (1 - chapa)});
    K.ciscos(ctx, amb, {n: 26, vx: 8, alfa: 0.5 * (1 - chapa), tam: 2.4, cor: '#FFFBF0', sal: 14});
    // o traço vermelho: inteiro no golpe, afina e some
    if (depois) traco(ctx, 30 * (1 - prog(f, 422, 446, E.outExpo)) + 1.5 * (1 - prog(f, 440, 452)), 1 - prog(f, 444, 454));
    ctx.restore();

    // os dois quadros em negativo
    if (f === GOLPE || f === GOLPE + 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.translate(ccx, 1380);
      ctx.scale(zoom, zoom);
      ctx.translate(-ccx, -1380);
      traco(ctx, f === GOLPE ? 46 : 36, 1);
      ctx.restore();
    }
  };

  // ---------- plano fechado: o peito dele, a corrente arrebenta e a câmera desce junto ----------
  const BX = 540;
  const BY = 420;
  const CHAO = BY + 2646;
  const QUEBRA = 492;
  const QUEDA = 494;
  const VEL = 112;
  const NP = 64;
  const uInicial = O.pecas.arcoU(BX, BY - 12, 150, 300, {n: NP});
  const pilha = (u) => [BX + 70 + (u - 0.5) * 330 + Math.sin(u * 21) * 26, CHAO + 74 - Math.abs(Math.cos(u * 13)) * 14 + Math.sin(u * 5) * 12];
  const caiu = (tau) => (tau <= 0 ? 0 : VEL * (tau - 3 * (1 - Math.exp(-tau / 3))));
  const COMPR = 700;
  const pontosCorrente = (f) => {
    const pts = [];
    for (let i = 0; i <= NP; i++) {
      const u = i / NP;
      const A = uInicial[i];
      const tau = f - QUEDA - (Math.abs(u - 0.5) * COMPR) / VEL;
      const gq = caiu(tau);
      const P = pilha(u);
      const limite = P[1] - A[1];
      const xq = BX + (u - 0.5) * 40 + Math.sin(u * 9 + f * 0.45) * 12 * clamp(gq / 400);
      if (gq >= limite) {
        const e = E.outCubic(clamp((gq - limite) / VEL / 5));
        pts.push([lerp(xq, P[0], e), P[1]]);
      } else {
        const bal = f < QUEDA ? Math.sin(f * 0.1) * 3 * Math.sin(u * Math.PI) : 0;
        pts.push([lerp(A[0], xq, clamp(gq / 260)) + bal, A[1] + gq]);
      }
    }
    return pts;
  };
  const fechado = (ctx, f) => {
    const K = O.cen;
    const F = O.fig;
    const pts = pontosCorrente(f);
    const fundoY = pts[NP / 2][1];
    const camMax = CHAO + 110 - 1100;
    const camY = clamp(fundoY - 800, 0, camMax);
    // close final no elo partido
    const fim = prog(f, 523, 541, E.inOutCubic);
    const elo = pts[NP];
    const zoom = 1 + fim * 1.5;
    ctx.save();
    ctx.translate(540, 1000);
    ctx.scale(zoom, zoom);
    ctx.translate(-lerp(540, elo[0] - 20, fim), -lerp(1000, elo[1] - camY - 20, fim));
    ctx.translate(0, -camY);

    // fundo: céu no alto, o chão de poeira descendo até os pés
    ctx.fillStyle = gLin(ctx, 0, -300, 0, 300, [[0, C.ceuAlto], [1, C.ceuBaixo]]);
    ctx.fillRect(-400, -400, W + 800, 702);
    K.sol(ctx, 300, 20, 420, {halo: 0.7});
    const c1 = K.fazerCidade(89, -400, 1700, {lMin: 60, lMax: 200, aMin: 40, aMax: 260, pJan: 0, curva: 2});
    K.desenharCidade(ctx, c1, 300, '#CDBFA4', {corVar: '#C2B397', extra: 1.4, fundo: 6});
    ctx.fillStyle = gLin(ctx, 0, 300, 0, CHAO + 500, [[0, '#E8DCC2'], [0.3, C.areia1], [0.75, C.areia2], [1, '#B4925F']]);
    ctx.fillRect(-400, 300, W + 800, CHAO + 600);
    // pedrinhas perto dos pés
    for (let i = 0; i < 50; i++) {
      const x = -200 + rnd(i, 740) * 1500;
      const y = CHAO - 320 + rnd(i, 741) * 700;
      const s = 4 + rnd(i, 742) * 16;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 1.9, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = rnd(i, 743) < 0.5 ? rgba(C.queimado, 0.3) : rgba('#FFF7E6', 0.4);
      ctx.fill();
    }
    // a sombra dele vindo pra câmera
    ctx.fillStyle = gLin(ctx, 0, CHAO - 30, 0, CHAO + 620, [[0, 'rgba(74,46,30,0.4)'], [1, 'rgba(74,46,30,0.08)']]);
    O.poli(ctx, [[BX - 330, CHAO - 26], [BX - 40, CHAO - 26], [BX - 10, CHAO + 40], [BX + 20, CHAO - 26], [BX + 330, CHAO - 26], [BX + 640, CHAO + 700], [BX - 540, CHAO + 700]]);
    ctx.fill();
    // corpo
    ctx.save();
    ctx.translate(BX, BY);
    F.busto(ctx, {corpoInteiro: true, t: f, vento: 0.4});
    F.queixo(ctx, f);
    ctx.restore();
    // poeira quando a corrente bate no chão
    for (let j = 0; j < 10; j++) {
      const u = prog(f, 517 + (j % 4), 536 + (j % 4));
      if (u <= 0 || u >= 1) continue;
      const a = Math.PI * (1 + rnd(j, 750));
      circ(ctx, BX + 70 + Math.cos(a) * (60 + 200 * E.outCubic(u)), CHAO + 70 + Math.sin(a) * 60 * E.outCubic(u), (18 + rnd(j, 751) * 30) * (0.5 + u), rgba('#F3E7CD', 0.7 * (1 - u)));
    }
    // a corrente
    const tr = trilho(pts);
    O.pecas.corrente(ctx, tr, 0, tr.total, 21, {cor: '#8F9296', corLuz: '#D2D5D8', grosso: 4});
    // elo partido na ponta: um C aberto
    {
      const p = tr.em(tr.total + 9);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang + (f >= QUEBRA ? 0.5 : 0));
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 9.5, 0, f >= QUEBRA ? 0.75 : 0, Math.PI * 2 - (f >= QUEBRA ? 0.75 : 0));
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#A4A7AB';
      ctx.stroke();
      ctx.restore();
      // o estalo do fecho
      const e = janela(f, QUEBRA, QUEBRA + 1, QUEBRA + 2, QUEBRA + 9, E.outCubic);
      if (e > 0) estrela(ctx, p.x, p.y, 110 * e, 0.4, '#FFFFFF', 0.06);
      // um resto de brilho baço no fim
      const b = janela(f, 528, 532, 534, 541, E.outCubic);
      if (b > 0) estrela(ctx, p.x + 4, p.y - 4, 26 * b, 0.2, 'rgba(255,255,255,0.75)', 0.08);
    }
    ctx.restore();
    K.vento(ctx, f, 200, H - 100, {n: 10, vel: 22, alfa: 0.26, sal: 17});
  };

  O.P = O.P || {};
  O.P.duelo = (ctx, f) => {
    if (f < 480) {
      larga(ctx, f);
      return {};
    }
    fechado(ctx, f);
    if (f < 491) {
      // passagem: a câmera mergulha no peito dele
      const p = prog(f, 480, 491, E.inOutCubic);
      const a = O.telaAux('larga');
      larga(a.x, f);
      const z = 1 + p * p * 9;
      const px = HERO.x1 + 10;
      const py = HERO.y - HERO.alt * 0.74;
      ctx.save();
      ctx.globalAlpha = 1 - E.inQuad(p);
      ctx.translate(lerp(px, 540, p), lerp(py, 600, p));
      ctx.scale(z, z);
      ctx.translate(-px, -py);
      ctx.drawImage(a.c, 0, 0);
      ctx.restore();
    }
    return {};
  };
})(typeof window !== 'undefined' ? window : globalThis);
