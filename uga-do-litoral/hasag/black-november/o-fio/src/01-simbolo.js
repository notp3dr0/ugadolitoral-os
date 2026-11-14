// O FIO · símbolo HSG. A estrutura entra como está no vetor (01-simbolo-paths.js).
// O eclipse do miolo é reconstruído com dois círculos, nas medidas do guia da marca:
// sol de raio 68,2 em (261,2 ; 155,5); lua de raio 76,9 deslocada 28,2 pra direita (viewBox 522 x 311).
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C} = O;

  const VB = {w: 522, h: 311};
  const SOL = {x: 261.2, y: 155.5, r: 68.2};
  const LUA = {r: 76.9, dx: 28.2};
  const RAZAO_LUA = LUA.r / SOL.r; // 1,1276
  const DESLOC = LUA.dx / SOL.r; // 0,4135

  let cache = null;
  const paths = () => {
    if (!cache) {
      cache = {};
      for (const k in O.SIMBOLO_PATHS) cache[k] = new Path2D(O.SIMBOLO_PATHS[k]);
    }
    return cache;
  };
  const PECAS = ['topo', 'arco-esquerdo', 'arco-direito', 'lateral-esquerda', 'lateral-direita', 'base'];

  // Eclipse genérico, em qualquer escala: disco (interseção sol/lua) e filete (sol menos lua).
  // desloc: quanto a lua está deslocada, em raios do sol (0,4135 = símbolo; 0 = totalidade).
  // ang: direção do deslocamento da lua (0 = pra direita, como no símbolo).
  const eclipse = (ctx, x, y, r, o = {}) => {
    const d = (o.desloc == null ? DESLOC : o.desloc) * r;
    const a = o.ang || 0;
    const R = RAZAO_LUA * r;
    // disco inteiro primeiro; o filete é o que sobra do sol fora da lua (sem franja vermelha na borda do disco)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = o.corDisco || C.branco;
    ctx.fill();
    ctx.clip();
    ctx.beginPath();
    ctx.rect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, R, 0, Math.PI * 2);
    ctx.fillStyle = o.corFilete || C.vermelho;
    ctx.fill('evenodd');
    ctx.restore();
  };

  // Estrutura (as seis peças) em unidades do viewBox, no transform corrente.
  // mov(nome) opcional devolve {dx, dy, alfa, escala} por peça, pra animar a entrada.
  const estrutura = (ctx, cor, mov) => {
    const P = paths();
    for (const nome of PECAS) {
      const m = mov ? mov(nome) : null;
      ctx.save();
      if (m) {
        if (m.alfa != null) ctx.globalAlpha *= m.alfa;
        ctx.translate(m.dx || 0, m.dy || 0);
      }
      ctx.fillStyle = cor;
      ctx.fill(P[nome], 'evenodd');
      ctx.restore();
    }
  };

  // Símbolo completo, centrado em (cx, cy), com a largura dada.
  const desenhar = (ctx, cx, cy, largura, o = {}) => {
    const k = largura / VB.w;
    ctx.save();
    ctx.translate(cx - (VB.w / 2) * k, cy - (VB.h / 2) * k);
    ctx.scale(k, k);
    estrutura(ctx, o.cor || C.vermelho, o.mov);
    if (o.miolo !== false) {
      ctx.globalAlpha *= o.alfaMiolo == null ? 1 : o.alfaMiolo;
      eclipse(ctx, SOL.x, SOL.y, SOL.r * (o.escalaMiolo == null ? 1 : o.escalaMiolo), {
        desloc: o.desloc,
        corFilete: o.corFilete || o.cor || C.vermelho,
        corDisco: o.corDisco || C.branco,
      });
    }
    ctx.restore();
  };

  // Portão de concreto: a mesma estrutura, enorme, com espessura (cópias deslocadas num tom mais escuro).
  // (cx, yBase) é o meio da base no chão. Devolve o centro e o raio do vão redondo na tela.
  const portao = (ctx, cx, yBase, largura, o = {}) => {
    const k = largura / VB.w;
    const x0 = cx - (VB.w / 2) * k;
    const y0 = yBase - 303 * k;
    const prof = o.prof == null ? 10 : o.prof;
    ctx.save();
    ctx.translate(x0, y0);
    ctx.scale(k, k);
    if (o.corFundo && prof > 0) {
      const passos = Math.min(22, Math.max(2, Math.ceil(prof * k * 0.6)));
      for (let i = passos; i >= 1; i--) {
        ctx.save();
        ctx.translate(((o.dxProf || 0.6) * prof * i) / passos, ((o.dyProf == null ? 0.5 : o.dyProf) * prof * i) / passos);
        estrutura(ctx, o.corFundo);
        ctx.restore();
      }
    }
    estrutura(ctx, o.cor || C.conc4);
    if (o.corLuz) {
      // filete de luz por cima: a peça recortada em si mesma, com um degradê vindo do alto
      const P = paths();
      for (const nome of PECAS) {
        ctx.save();
        ctx.clip(P[nome], 'evenodd');
        const gr = ctx.createLinearGradient(0, 0, 0, VB.h);
        gr.addColorStop(0, o.corLuz);
        gr.addColorStop(0.55, 'rgba(0,0,0,0)');
        gr.addColorStop(1, o.corPe || 'rgba(0,0,0,0.18)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, VB.w, VB.h);
        ctx.restore();
      }
    }
    ctx.restore();
    return {x: x0 + SOL.x * k, y: y0 + SOL.y * k, r: SOL.r * k, k, x0, y0};
  };
  // onde cai o vão, sem desenhar
  const vaoDoPortao = (cx, yBase, largura) => {
    const k = largura / VB.w;
    const x0 = cx - (VB.w / 2) * k;
    const y0 = yBase - 303 * k;
    return {x: x0 + SOL.x * k, y: y0 + SOL.y * k, r: SOL.r * k, k, x0, y0};
  };

  O.simbolo = {VB, SOL, LUA, RAZAO_LUA, DESLOC, PECAS, paths, eclipse, estrutura, desenhar, portao, vaoDoPortao};
})(typeof window !== 'undefined' ? window : globalThis);
