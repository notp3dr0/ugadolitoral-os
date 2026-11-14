// O FIO · folhas de modelo, só pra conferir desenho durante o trabalho (não entram no filme).
//   node render/render.mjs --teste personagem
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H} = O;
  O.testes = {
    personagem(ctx) {
      ctx.fillStyle = '#DCCBA8';
      ctx.fillRect(0, 0, W, H);
      const F = O.fig;
      for (let i = 0; i < 4; i++) F.figLado(ctx, 150 + i * 260, 560, 460, {fase: i * 0.8, andar: 1, t: i * 9, corrente: true});
      F.figLado(ctx, 160, 1120, 460, {andar: 0, t: 3, corrente: true});
      F.figLado(ctx, 420, 1120, 460, {agacha: 1, t: 3, joias: true, pes: [{x: -0.2, y: 0, giro: 0.3}, {x: 0.16, y: 0, giro: 0}], braco: -0.9});
      F.figCostas(ctx, 700, 1120, 460, {t: 5});
      F.figCostas(ctx, 950, 1120, 460, {t: 5, fase: 1.2, andar: 1});
      F.sombraFig(ctx, 150, 1800, 560, {t: 0, semente: 1, dir: -1});
      F.sombraFig(ctx, 380, 1800, 620, {t: 0, semente: 2, dir: -1, inclina: 0.3});
      F.sombraFig(ctx, 620, 1800, 540, {t: 0, semente: 3, dir: 1, some: 0.5});
      ctx.save();
      ctx.translate(880, 1380);
      ctx.scale(0.32, 0.32);
      F.busto(ctx, {t: 0, cabeca: true});
      ctx.restore();
    },
    maos(ctx) {
      ctx.fillStyle = C.vermelho;
      ctx.fillRect(0, 0, W, H);
      const F = O.fig;
      F.maoPinca(ctx, 400, 600, 0.8, 0, {});
      F.maoPinca(ctx, 700, 600, 0.8, 0, {espelha: -1, abre: 1});
      F.punho(ctx, 300, 1300, 0.8, 0, {fecha: 1, manga: 500});
      F.punho(ctx, 780, 1300, 0.8, 0.2, {fecha: 0.2});
    },
    pecas(ctx) {
      ctx.fillStyle = C.vermelho;
      ctx.fillRect(0, 0, W, H / 2);
      ctx.fillStyle = C.sangue;
      ctx.fillRect(0, H / 2, W, H / 2);
      const P = O.pecas;
      for (const [yy, modo] of [[0, 'dia'], [960, 'eclipse']]) {
        const tr = O.trilho(P.arcoU(540, yy + 80, 330, 520));
        const r = 26;
        const col = P.k2qContas(tr, r);
        ctx.beginPath();
        tr.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        P.k2qDesenhar(ctx, col, r, {modo, reflexo: C.vermelho, t: 3, luzDe: modo === 'eclipse' ? () => -Math.PI / 2 : null, cruz: () => ({escala: 1, ang: 0})});
        P.g1Produto(ctx, 540, yy + 300, 120, {modo, reflexo: C.vermelho});
      }
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
