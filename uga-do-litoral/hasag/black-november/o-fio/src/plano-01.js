// Plano 1 (0:00 a 0:04) · plano geral. Horizonte baixo, sol enorme (o eclipse do símbolo),
// cidade chapada em camadas, o andarilho minúsculo entrando pela esquerda, a sacola no vento.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, lerp, rgba, gLin, gRad, ruido} = O;
  const HORIZ = 1480;

  O.P = O.P || {};
  O.P.p1 = (ctx, f) => {
    const K = O.cen;
    const cam = f * 0.85; // a câmera desliza devagar pra direita
    const zoom = 1 + f * 0.00035;
    ctx.save();
    ctx.translate(600, 800);
    ctx.scale(zoom, zoom);
    ctx.translate(-600, -800);

    K.ceuDia(ctx, HORIZ);
    // sol: disco branco com o filete vermelho, como no símbolo
    const sx = 610 - cam * 0.05;
    const sy = 770;
    K.sol(ctx, sx, sy, 335, {halo: 1});

    // cidade ao longe, três camadas
    const c1 = K.fazerCidade(11, -200, 2200, {lMin: 30, lMax: 90, aMin: 40, aMax: 210, pJan: 0, curva: 1.6});
    K.desenharCidade(ctx, c1, HORIZ, '#DCD2BD', {dx: -cam * 0.12, corVar: '#D3C7AF', extra: 0.6});
    const c2 = K.fazerCidade(23, -300, 2600, {lMin: 60, lMax: 170, aMin: 90, aMax: 470, pJan: 0.12, jan: 26, curva: 1.9});
    K.desenharCidade(ctx, c2, HORIZ, '#C3B59B', {dx: -cam * 0.24, corVar: '#B8A98D', corJanela: rgba('#8F7F66', 0.5), corCaixa: '#B4442F', extra: 0.9});
    // névoa de poeira no pé dos prédios
    ctx.fillStyle = gLin(ctx, 0, HORIZ - 260, 0, HORIZ, [[0, 'rgba(236,224,198,0)'], [1, 'rgba(236,224,198,0.75)']]);
    ctx.fillRect(-100, HORIZ - 260, W + 200, 262);
    // postes e fios
    K.fios(ctx, [-260 - cam * 0.36, 300 - cam * 0.36, 860 - cam * 0.36, 1420 - cam * 0.36], HORIZ + 6, {cor: '#7D705E', alt: 520, lw: 2.6, barriga: 70});
    const c3 = K.fazerCidade(37, -400, 3000, {lMin: 110, lMax: 300, aMin: 150, aMax: 640, pJan: 0.2, jan: 34, curva: 2.6, vao: 160});
    K.desenharCidade(ctx, c3, HORIZ + 8, '#96866E', {dx: -cam * 0.42 - 60, corVar: '#87775F', corJanela: rgba('#5E5040', 0.55), corCaixa: C.vermelho, extra: 1.4});

    // chão
    K.chao(ctx, HORIZ + 6);
    // faixa de luz do sol no chão, vindo do horizonte
    ctx.fillStyle = gRad(ctx, sx, HORIZ, 20, sx, HORIZ + 60, 620, [[0, 'rgba(255,250,236,0.75)'], [1, 'rgba(255,250,236,0)']]);
    ctx.fillRect(-100, HORIZ, W + 200, 520);
    K.pedras(ctx, HORIZ + 10, cam * 1.1, {n: 54});

    // o andarilho: minúsculo, sombra comprida vindo pra câmera
    const alt = 128;
    const fx = -70 + f * 3.3; // anda mais que a câmera
    const fy = 1578;
    const fase = (fx + cam) * (Math.PI / (2 * 0.125 * alt));
    ctx.save();
    ctx.translate(fx, fy);
    ctx.transform(1, 0, 0.95, -2.6, 0, 0);
    O.fig.figLado(ctx, 0, 0, alt, {fase, andar: 1, t: f, silhueta: 'rgba(92,61,43,0.34)', vento: 0.5});
    ctx.restore();
    O.fig.figLado(ctx, fx, fy, alt, {fase, andar: 1, t: f, corrente: true, vento: 0.6});

    // a sacola: rola e quica com o vento, mais perto da câmera
    {
      const p = prog(f, 6, 150);
      const bx = lerp(-120, 1260, E.inOutSine(p) * 0.4 + p * 0.6);
      const quique = Math.abs(Math.sin(p * Math.PI * 4.2 + 0.4));
      const chaoY = 1742 + p * 26;
      const by = chaoY - 26 - quique * (120 - p * 40) - ruido(f * 0.09, 7) * 14;
      ctx.beginPath();
      ctx.ellipse(bx + 30, chaoY + 34, 70 - quique * 22, 12 - quique * 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(92,61,43,${0.3 - quique * 0.14})`;
      ctx.fill();
      K.sacola(ctx, bx, by, 62, p * 9 + Math.sin(f * 0.13) * 0.5, f, {});
    }

    K.vento(ctx, f, HORIZ - 30, H - 60, {n: 20, vel: 30, alfa: 0.42});
    K.ciscos(ctx, f, {n: 34, vx: 9, alfa: 0.55, tam: 2.2, cor: '#FFFBF0'});
    ctx.restore();

    // fios bem perto, cruzando o alto do quadro (primeiro plano escuro)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3B332C';
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      ctx.moveTo(-80 - cam * 0.9, 150 + k * 46);
      ctx.quadraticCurveTo(520 - cam * 0.9, 330 + k * 66 + Math.sin(f * 0.04 + k) * 8, 1400 - cam * 0.9, 60 + k * 30);
      ctx.lineWidth = 5 - k * 1.5;
      ctx.stroke();
    }
    ctx.restore();
    // abre do branco (o olho acostumando com o sol)
    const ab = 1 - prog(f, 0, 14, E.outCubic);
    if (ab > 0) {
      ctx.fillStyle = `rgba(255,252,244,${ab})`;
      ctx.fillRect(0, 0, W, H);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
