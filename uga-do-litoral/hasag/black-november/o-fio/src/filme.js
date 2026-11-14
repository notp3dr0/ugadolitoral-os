// O FIO · a linha do tempo. renderFrame(ctx, frame) é pura: o mesmo quadro sai sempre igual.
// 1080 x 1920, 30 qps, 1080 quadros (36 s). Cada plano mora no seu arquivo (plano-NN.js);
// aqui ficam só a ordem, as passagens entre planos e o acabamento (grão e vinheta).
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {W, H} = O;

  // início de cada plano, em quadros
  O.PLANOS = [
    {n: 1, ini: 0, nome: 'cidade, sol, andarilho'},
    {n: 2, ini: 120, nome: 'três tiras'},
    {n: 3, ini: 240, nome: 'as três sombras'},
    {n: 4, ini: 360, nome: 'silêncio'},
    {n: 5, ini: 420, nome: 'clarão'},
    {n: 6, ini: 450, nome: 'a corrente cai'},
    {n: 7, ini: 540, nome: 'o portão'},
    {n: 8, ini: 630, nome: 'ateliê'},
    {n: 9, ini: 780, nome: '1K2Q e G1'},
    {n: 10, ini: 870, nome: 'totalidade'},
    {n: 11, ini: 960, nome: 'tela final'},
  ];

  const cena = (ctx, f) => {
    const P = O.P;
    if (f < 120) return P.p1(ctx, f);
    if (f < 240) return P.p2(ctx, f); // desenha o P1 por baixo enquanto as tiras entram
    if (f < 354) return P.p3(ctx, f); // desenha as tiras do P2 saindo por cima
    if (f < 364) {
      // a câmera gira da rua pro duelo de perfil: os dois planos correm juntos pro lado
      const p = O.E.inOutCubic((f - 354) / 10);
      ctx.save();
      ctx.translate(-p * W, 0);
      P.p3(ctx, f);
      ctx.restore();
      ctx.save();
      ctx.translate((1 - p) * W, 0);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      P.duelo(ctx, Math.max(f, 360));
      ctx.restore();
      return {};
    }
    if (f < 536) return P.duelo(ctx, f); // planos 4, 5 e 6 dividem o mesmo mundo
    if (f < 546) {
      // do elo no chão pro rosto que se ergue: a câmera sobe, os dois planos descem juntos
      const p = O.E.inOutCubic((f - 536) / 10);
      ctx.save();
      ctx.translate(0, p * H);
      P.duelo(ctx, f);
      ctx.restore();
      ctx.save();
      ctx.translate(0, -(1 - p) * H);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      P.p7(ctx, f);
      ctx.restore();
      return {};
    }
    if (f < 630) return P.p7(ctx, f);
    if (f < 780) return P.p8(ctx, f);
    if (f < 870) return P.p9(ctx, f);
    if (f < 960) return P.p10(ctx, f);
    return P.p11(ctx, f);
  };

  O.renderFrame = (ctx, frame) => {
    const f = Math.max(0, Math.min(O.TOTAL - 1, Math.round(frame)));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.setLineDash([]);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const acab = cena(ctx, f) || {};
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // a tela final é papel limpo: vinheta quase nenhuma e grão mais leve
    const fim = f >= 960;
    O.acabamento(ctx, f, {
      vinheta: acab.vinheta != null ? acab.vinheta : fim ? 0.1 : 0.34,
      grao: acab.grao != null ? acab.grao : fim ? 0.04 : 0.06,
    });
  };

  // fontes carregadas antes do primeiro quadro (o Jost é provisório, ver marca/design-guide.md)
  O.pronto = async () => {
    if (typeof document === 'undefined' || !document.fonts) return;
    await Promise.all([
      document.fonts.load("400 40px 'Jost'"),
      document.fonts.load("500 40px 'Jost'"),
      document.fonts.load("600 40px 'Jost'"),
      document.fonts.load("700 40px 'Jost'"),
      document.fonts.load("800 40px 'Jost'"),
      document.fonts.load("italic 600 40px 'Jost'"),
    ]);
    await document.fonts.ready;
  };
})(typeof window !== 'undefined' ? window : globalThis);
