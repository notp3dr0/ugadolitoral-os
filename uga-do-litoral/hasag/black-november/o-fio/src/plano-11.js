// Plano 11 (0:32 a 0:36) · tela final, na hierarquia do banner da loja.
// Símbolo, G1 desenhada, BLACK / November, a oferta e o endereço. Sem preço, sem prazo.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, clamp, lerp, texto, medir, gRad, estrela, rnd} = O;
  const INI = 960;

  // posição do símbolo e do miolo na tela final (o plano 10 entrega o sol aqui)
  const SIMB = {cx: 540, cy: 300, larg: 330};
  O.FINAL_SIMBOLO = SIMB;

  O.P = O.P || {};
  O.P.p11 = (ctx, f) => {
    const l = f - INI;
    const S = O.simbolo;
    // papel
    ctx.fillStyle = gRad(ctx, W / 2, 760, 100, W / 2, 900, 1300, [
      [0, '#F7F6F3'],
      [0.6, C.papel],
      [1, '#E9E7E1'],
    ]);
    ctx.fillRect(0, 0, W, H);

    // símbolo: as peças chegam de fora pra dentro em volta do miolo, que já está lá
    const dir = {
      'topo': [0, -1], 'base': [0, 1], 'lateral-esquerda': [-1, 0], 'lateral-direita': [1, 0],
      'arco-esquerdo': [-0.7, -0.5], 'arco-direito': [0.7, -0.5],
    };
    const ordem = {'lateral-esquerda': 0, 'lateral-direita': 0, 'topo': 2, 'base': 3, 'arco-esquerdo': 5, 'arco-direito': 5};
    S.desenhar(ctx, SIMB.cx, SIMB.cy, SIMB.larg, {
      mov: (nome) => {
        const p = prog(l, 2 + ordem[nome] * 1.5, 22 + ordem[nome] * 1.5, E.outExpo);
        return {dx: dir[nome][0] * (1 - p) * 220, dy: dir[nome][1] * (1 - p) * 170, alfa: clamp(p * 1.6)};
      },
    });

    // G1, do jeito da foto. As contas acendem em fila, a corrente fecha por último.
    const flut = Math.sin(l * 0.05) * 3;
    const g1 = O.pecas.g1Produto(ctx, 540, 690 + flut, 212, {
      sombra: prog(l, 10, 34, E.outCubic),
      escala: (i) => prog(l, 5 + i * 1.25, 15 + i * 1.25, E.mola),
      elos: prog(l, 28, 40, E.outCubic),
      fecho: prog(l, 40, 46, E.outBack),
      reflexo: '#C9B8A6',
      brilho: (i) => {
        // um brilho que corre pelas rondelas, e o tilintar final na terceira
        const corre = O.janela(l, 30 + i * 0.9, 33 + i * 0.9, 34 + i * 0.9, 40 + i * 0.9, E.outCubic) * (O.pecas.G1_SEQ[i] === 'r' ? 0.9 : 0);
        const fim = i === 11 ? O.janela(l, 74, 77, 79, 92, E.outCubic) * 1.5 : 0;
        return Math.max(corre, fim);
      },
      rot: l * 0.02,
    });

    // BLACK: cada letra sobe de trás de uma máscara
    const X0 = 90;
    const larguraAlvo = 900;
    const base100 = medir(ctx, 'BLACK', {tam: 100, peso: 600, entre: 0});
    const tamBlack = (larguraAlvo / base100) * 100;
    const yBlack = 1118;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, yBlack - tamBlack * 0.78, W, tamBlack * 0.82);
    ctx.clip();
    let x = X0;
    'BLACK'.split('').forEach((ch, i) => {
      const p = prog(l, 8 + i * 2.2, 26 + i * 2.2, E.outExpo);
      const w = medir(ctx, ch, {tam: tamBlack, peso: 600});
      texto(ctx, ch, x, yBlack + (1 - p) * tamBlack * 0.85, {tam: tamBlack, peso: 600, cor: C.vermelho});
      x += w;
    });
    ctx.restore();

    // November
    {
      const p = prog(l, 18, 34, E.outExpo);
      texto(ctx, 'November', X0 + 6 - (1 - p) * 70, 1212, {tam: 86, peso: 600, italico: true, cor: '#0B0B0B', alfa: clamp(p * 1.4)});
    }
    // oferta
    {
      const p1 = prog(l, 24, 40, E.outExpo);
      const b100 = medir(ctx, 'GANHE UMA PULSEIRA G1', {tam: 100, peso: 800, entre: 1});
      const tam1 = Math.min(72, (900 / b100) * 100);
      texto(ctx, 'GANHE UMA PULSEIRA G1', X0, 1352 + (1 - p1) * 46, {tam: tam1, peso: 800, entre: 1, cor: '#0B0B0B', alfa: clamp(p1 * 1.4)});
      const p2 = prog(l, 29, 45, E.outExpo);
      const tam2 = 51;
      const y2 = 1426 + (1 - p2) * 46;
      const a2 = clamp(p2 * 1.4);
      let xx = X0;
      xx += texto(ctx, 'NA COMPRA DE ', xx, y2, {tam: tam2, peso: 400, entre: 0.5, cor: '#0B0B0B', alfa: a2});
      xx += texto(ctx, 'QUALQUER COLAR', xx, y2, {tam: tam2, peso: 700, entre: 0.5, cor: C.vermelho, alfa: a2});
      texto(ctx, '.', xx, y2, {tam: tam2, peso: 700, cor: '#0B0B0B', alfa: a2});
    }
    // endereço, numa caixa de linha fina (o botão do banner)
    {
      const p = prog(l, 36, 54, E.outCubic);
      const tam = 40;
      const wT = medir(ctx, 'hasagstore.com.br', {tam, peso: 500, entre: 2});
      const bx = X0;
      const by = 1494;
      const bw = wT + 96;
      const bh = 92;
      if (p > 0) {
        const per = 2 * (bw + bh);
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, bw, bh);
        ctx.setLineDash([per * p, per]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0B0B0B';
        ctx.stroke();
        ctx.restore();
        texto(ctx, 'hasagstore.com.br', bx + 48, by + bh / 2 + tam * 0.33, {tam, peso: 500, entre: 2, cor: '#0B0B0B', alfa: prog(l, 42, 56, E.outCubic)});
      }
    }
    return g1;
  };
})(typeof window !== 'undefined' ? window : globalThis);
