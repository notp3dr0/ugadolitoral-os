// Plano 7 (0:18 a 0:21) · ele ergue os olhos. No fim da rua, o portão de concreto com a forma da
// estrutura do símbolo; no vão redondo, o sol. Ele caminha, a câmera passa por ele e entra no vão.
// A passagem pro ateliê é daqui: dentro do vão, o filete vermelho do sol cresce até tomar o quadro.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, clamp, lerp, rgba, gLin, fpoli} = O;
  const INI = 540;
  const ZG = 30; // onde o portão está
  const LARG = 9; // largura do portão, em unidades de rua

  O.P = O.P || {};
  O.P.p7 = (ctx, f) => {
    const l = f - INI;
    const K = O.cen;
    const F = O.fig;
    const S = O.simbolo;
    const R = O.RUA;
    // a câmera avança em progressão geométrica: o portão cresce na tela num ritmo constante
    const anda = prog(l, 34, 92, E.inOutSine);
    const camZ = ZG - Math.pow(ZG, 1 - anda) * Math.pow(0.8, anda);
    const hc = lerp(1.2, 2.25, prog(l, 34, 88, E.inOutCubic));
    const fim = prog(l, 81, 90, E.inQuad);
    // começa perto da nuca dele e abre
    const abre = prog(l, 0, 24, E.outCubic);
    const zoom = lerp(1.55, 1, abre);
    ctx.save();
    ctx.translate(lerp(170, 540, abre), lerp(1150, 1100, abre));
    ctx.scale(zoom, zoom);
    ctx.translate(-lerp(170, 540, abre), -lerp(1150, 1100, abre));

    const zg = ZG - camZ;
    const proj = O.ruaFundo(ctx, f, {
      hc,
      camZ,
      sol: false,
      semRua: 91,
      semCidade: 73,
      atrasDoSol: () => {
        // o sol: no fim ele cresce e a lua escorrega, o filete vermelho vira o fundo do ateliê
        K.sol(ctx, R.SOL.x, R.SOL.y, R.SOL.r, {halo: 1});
      },
      noChao: (pj) => {
        // sombra do portão na rua e o caminho de luz que sai do vão
        const a = pj(-LARG / 2, 0, zg);
        const b = pj(LARG / 2, 0, zg);
        const c = pj(LARG / 2 + 1.5, 0, Math.max(0.5, zg - 12));
        const d = pj(-LARG / 2 - 1.5, 0, Math.max(0.5, zg - 12));
        ctx.fillStyle = gLin(ctx, 0, a[1], 0, Math.max(a[1] + 10, c[1]), [[0, 'rgba(92,61,43,0.5)'], [1, 'rgba(92,61,43,0)']]);
        O.poli(ctx, [a, b, c, d]);
        ctx.fill();
        const e1 = pj(-0.75, 0, zg);
        const e2 = pj(0.75, 0, zg);
        const e3 = pj(1.5, 0, Math.max(0.5, zg - 16));
        const e4 = pj(-1.5, 0, Math.max(0.5, zg - 16));
        fpoli(ctx, [e1, e2, e3, e4], 'rgba(255,250,236,0.6)');
        portao(pj);
      },
    });
    // o portão (desenhado antes dos prédios: ele fecha o fim da rua)
    function portao(pj) {
      const [gx, gy, gk] = pj(0, 0, zg);
      const larg = LARG * gk;
      const nev = clamp(Math.log(Math.max(1, zg)) / Math.log(34));
      S.portao(ctx, gx, gy + 2, larg, {
        cor: O.mix('#4E443B', '#A39683', nev * 0.85),
        corFundo: O.mix('#2C2520', '#8D806E', nev * 0.85),
        corLuz: rgba('#FFF3DC', 0.22),
        prof: 7,
        dxProf: 0.9,
        dyProf: 0.35,
      });
    }
    K.vento(ctx, f, R.VY - 30, H - 60, {n: 14, vel: 22, alfa: 0.3, sal: 9});

    // ele: de costas, ergue a cabeça, anda; a câmera passa por cima
    {
      const zEle = 2.4 + Math.max(0, l - 18) * 0.13;
      const dz = zEle - camZ;
      if (dz > 0.5) {
        const X = lerp(-0.95, -0.35, prog(l, 18, 70, E.inOutSine));
        const [x, y, k] = proj(X, 0, dz);
        const alt = 1.75 * k;
        K.sombraLonga(ctx, x, y - 6, alt * 0.34, alt * 0.9, R.VX, R.VY - 60, 'rgba(60,36,24,0.4)');
        F.figCostas(ctx, x, y, alt, {
          fase: Math.max(0, l - 18) * 0.27,
          andar: prog(l, 18, 28, E.outCubic),
          cabeca: prog(l, 3, 17, E.inOutCubic),
          t: f,
          vento: 0.5,
          tons: F.tonsContraluz(0.3, '#2A1E16'),
        });
      }
    }
    K.ciscos(ctx, f, {n: 26, vx: 6, alfa: 0.5, tam: 2.4, cor: '#FFFBF0', sal: 6});
    // dentro do vão: o sol cresce por cima de tudo, a lua escorrega e o filete vermelho toma o quadro
    if (fim > 0) {
      const sr = R.SOL.r + Math.pow(fim, 1.5) * 2100;
      K.sol(ctx, R.SOL.x, lerp(R.SOL.y, 960, fim), sr, {desloc: S.DESLOC + fim * 2.5, halo: 1 - fim});
    }
    ctx.restore();
    return {vinheta: 0.34 * (1 - fim * 0.5)};
  };
})(typeof window !== 'undefined' ? window : globalThis);
