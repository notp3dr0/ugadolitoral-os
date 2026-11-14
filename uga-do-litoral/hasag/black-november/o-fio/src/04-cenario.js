// O FIO · cenário: céu, sol-eclipse, cidade chapada em camadas de tom, rua em perspectiva, poeira e a sacola.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, clamp, lerp, mix, mixHex, rgba, circ, fpoli, poli, curva, gLin, gRad, rnd, ruido, mulberry} = O;
  const TAU = Math.PI * 2;

  // ---------- céu de dia ----------
  const ceuDia = (ctx, yHoriz, o = {}) => {
    ctx.fillStyle = gLin(ctx, 0, 0, 0, yHoriz, [
      [0, o.alto || C.ceuAlto],
      [0.55, o.meio || '#ECE3D0'],
      [1, o.baixo || C.ceuBaixo],
    ]);
    ctx.fillRect(0, 0, W, yHoriz + 2);
  };

  // ---------- sol: o eclipse do símbolo, enorme, com halo ----------
  // desloc: 0,4135 = como no símbolo; 0 = totalidade.
  const sol = (ctx, x, y, r, o = {}) => {
    const halo = o.halo == null ? 1 : o.halo;
    if (halo > 0) {
      ctx.fillStyle = gRad(ctx, x, y, r * 0.9, x, y, r * 2.3, [
        [0, `rgba(255,252,244,${0.5 * halo})`],
        [0.35, `rgba(255,250,238,${0.26 * halo})`],
        [1, 'rgba(255,250,238,0)'],
      ]);
      ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
    }
    O.simbolo.eclipse(ctx, x, y, r, {desloc: o.desloc, corFilete: o.corFilete, corDisco: o.corDisco, ang: o.ang});
  };

  // ---------- cidade: uma fileira de blocos gerada por semente ----------
  const cidades = {};
  const fazerCidade = (sem, x0, x1, cfg) => {
    const chave = [sem, x0, x1, JSON.stringify(cfg)].join('|');
    if (cidades[chave]) return cidades[chave];
    const r = mulberry(sem);
    const lista = [];
    let x = x0;
    while (x < x1) {
      const w = lerp(cfg.lMin, cfg.lMax, r());
      const h = lerp(cfg.aMin, cfg.aMax, Math.pow(r(), cfg.curva || 1.4));
      const p = {x, w, h, tom: r(), partes: [], extras: []};
      // segundo andar recuado
      if (r() < 0.45) p.partes.push({dx: w * lerp(0.05, 0.35, r()), w: w * lerp(0.35, 0.6, r()), h: h * lerp(0.12, 0.3, r())});
      // caixa d'água, antena, escada
      const q = r();
      if (q < 0.42) p.extras.push({tipo: 'caixa', u: lerp(0.15, 0.8, r()), k: lerp(0.8, 1.25, r()), vermelha: r() < 0.16});
      else if (q < 0.62) p.extras.push({tipo: 'antena', u: lerp(0.2, 0.8, r()), k: lerp(0.7, 1.4, r())});
      else if (q < 0.74) p.extras.push({tipo: 'escada', u: lerp(0.1, 0.6, r()), k: 1});
      // janelas esparsas
      p.janelas = [];
      const cols = Math.max(1, Math.floor(w / (cfg.jan || 30)));
      const lins = Math.max(1, Math.floor(h / ((cfg.jan || 30) * 1.5)));
      for (let i = 0; i < cols; i++) for (let j = 0; j < lins; j++) if (r() < (cfg.pJan == null ? 0.25 : cfg.pJan)) p.janelas.push([i / cols, j / lins, r()]);
      p.cols = cols;
      p.lins = lins;
      lista.push(p);
      x += w + (r() < 0.2 ? lerp(4, cfg.vao || 30, r()) : 0);
    }
    cidades[chave] = lista;
    return lista;
  };
  // desenha a fileira com a base em baseY. cor = tom da camada; corJanela opcional
  const desenharCidade = (ctx, lista, baseY, cor, o = {}) => {
    const esc = o.escala || 1;
    const dx = o.dx || 0;
    const corVar = o.corVar || cor;
    const fundo = o.fundo == null ? 400 : o.fundo;
    for (const p of lista) {
      const x = p.x * esc + dx;
      const w = p.w * esc;
      if (x > W + 50 || x + w < -50) continue;
      const h = p.h * esc;
      const c = mix(cor, corVar, p.tom);
      ctx.fillStyle = c;
      ctx.fillRect(x, baseY - h, w + 0.6, h + fundo);
      let topo = baseY - h;
      for (const s of p.partes) {
        ctx.fillRect(x + s.dx * esc, topo - s.h * esc, s.w * esc, s.h * esc + 1);
      }
      for (const e of p.extras) {
        const ex = x + w * e.u;
        const k = e.k * esc * (o.extra || 1);
        if (e.tipo === 'caixa') {
          ctx.fillStyle = e.vermelha && o.corCaixa ? o.corCaixa : c;
          ctx.fillRect(ex - 13 * k, topo - 34 * k, 26 * k, 20 * k);
          ctx.fillRect(ex - 15 * k, topo - 37 * k, 30 * k, 4 * k);
          ctx.fillStyle = c;
          ctx.fillRect(ex - 11 * k, topo - 15 * k, 2.5 * k, 16 * k);
          ctx.fillRect(ex + 8.5 * k, topo - 15 * k, 2.5 * k, 16 * k);
        } else if (e.tipo === 'antena') {
          ctx.fillRect(ex - 1 * k, topo - 60 * k, 2 * k, 60 * k);
          ctx.fillRect(ex - 10 * k, topo - 52 * k, 20 * k, 1.6 * k);
          ctx.fillRect(ex - 7 * k, topo - 44 * k, 14 * k, 1.6 * k);
        } else {
          ctx.fillRect(ex, topo - 26 * k, 30 * k, 27 * k);
        }
      }
      if (o.corJanela) {
        ctx.fillStyle = o.corJanela;
        const jw = (w / p.cols) * 0.36;
        const jh = (h / p.lins) * 0.36;
        for (const [u, v] of p.janelas) ctx.fillRect(x + (u + 0.3) * w, baseY - h + (v + 0.25) * h, jw, jh);
      }
    }
  };

  // postes e fios
  const fios = (ctx, postes, yBase, o = {}) => {
    const cor = o.cor || C.conc5;
    const alt = o.alt || 420;
    const lw = o.lw || 3;
    ctx.fillStyle = cor;
    ctx.strokeStyle = cor;
    for (const px of postes) {
      ctx.fillRect(px - lw * 1.6, yBase - alt, lw * 3.2, alt + 40);
      ctx.fillRect(px - alt * 0.11, yBase - alt + alt * 0.045, alt * 0.22, lw * 1.8);
      ctx.fillRect(px - alt * 0.08, yBase - alt + alt * 0.12, alt * 0.16, lw * 1.6);
    }
    ctx.lineWidth = lw * 0.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < postes.length - 1; i++) {
      const a = postes[i];
      const b = postes[i + 1];
      for (let k = 0; k < 3; k++) {
        const off = (k - 1) * alt * 0.1;
        const ya = yBase - alt + alt * 0.045 + (k === 1 ? alt * 0.075 : 0);
        ctx.beginPath();
        ctx.moveTo(a + off, ya);
        ctx.quadraticCurveTo((a + b) / 2 + off, ya + (o.barriga || 90) * (1 + k * 0.12), b + off, ya);
        ctx.stroke();
      }
    }
  };

  // ---------- chão de poeira ----------
  const chao = (ctx, y0, o = {}) => {
    ctx.fillStyle = gLin(ctx, 0, y0, 0, H, [
      [0, o.c0 || '#E8DCC2'],
      [0.25, o.c1 || C.areia1],
      [0.7, o.c2 || C.areia2],
      [1, o.c3 || C.ocre],
    ]);
    ctx.fillRect(0, y0, W, H - y0);
  };
  // pedrinhas e marcas, com paralaxe. camX desloca; quanto mais embaixo, mais rápido e maior
  const pedras = (ctx, y0, camX, o = {}) => {
    const n = o.n || 46;
    for (let i = 0; i < n; i++) {
      const v = Math.pow(rnd(i, 201 + (o.sal || 0)), 1.6);
      const y = lerp(y0 + 12, H + 20, v);
      const prof = lerp(0.25, 1.5, v);
      const larg = 2600;
      let x = (rnd(i, 202 + (o.sal || 0)) * larg - camX * prof) % larg;
      if (x < 0) x += larg;
      x -= 300;
      const s = lerp(3, 16, v) * (0.6 + rnd(i, 203) * 0.9);
      ctx.beginPath();
      ctx.ellipse(x, y, s * 1.8, s * 0.5, 0, 0, TAU);
      ctx.fillStyle = rnd(i, 204) < 0.5 ? rgba(o.cor || C.queimado, 0.28) : rgba('#FFF7E6', 0.35);
      ctx.fill();
    }
  };
  // vento: riscos de poeira que correm pra direita
  const vento = (ctx, f, y0, y1, o = {}) => {
    const n = o.n || 22;
    const vel = o.vel || 26;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const v = rnd(i, 301 + (o.sal || 0));
      const y = lerp(y0, y1, v) + Math.sin(f * 0.05 + i) * 8;
      const prof = lerp(0.5, 1.6, v);
      const larg = W + 900;
      let x = (rnd(i, 302 + (o.sal || 0)) * larg + f * vel * prof * (0.7 + rnd(i, 303) * 0.6)) % larg;
      x -= 450;
      const comp = lerp(60, 260, rnd(i, 304)) * prof;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + comp * 0.5, y - 6 * prof, x + comp, y + 2);
      ctx.lineWidth = lerp(1.5, 5, v);
      ctx.strokeStyle = rgba(o.cor || '#FFF9EC', (o.alfa || 0.3) * (0.4 + rnd(i, 305) * 0.6));
      ctx.stroke();
    }
    ctx.restore();
  };
  // partículas de poeira suspensas (pontos)
  const ciscos = (ctx, f, o = {}) => {
    const n = o.n || 40;
    for (let i = 0; i < n; i++) {
      const prof = 0.4 + rnd(i, 401 + (o.sal || 0)) * 1.4;
      const larg = W + 200;
      let x = (rnd(i, 402 + (o.sal || 0)) * larg + f * (o.vx == null ? 7 : o.vx) * prof) % larg;
      if (x < 0) x += larg;
      x -= 100;
      let y = (rnd(i, 403 + (o.sal || 0)) * (H + 200) + f * (o.vy || 0) * prof + Math.sin(f * 0.03 + i * 2.1) * 30) % (H + 200);
      if (y < 0) y += H + 200;
      y -= 100;
      circ(ctx, x, y, prof * (o.tam || 2.4), rgba(o.cor || '#FFFFFF', (o.alfa || 0.5) * (0.3 + rnd(i, 404) * 0.7)));
    }
  };

  // ---------- a sacola plástica ----------
  // amassada, translúcida, rolando. tam = raio médio.
  const sacola = (ctx, x, y, tam, giro, t, o = {}) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    const n = 9;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const r = tam * (0.72 + 0.34 * ruido(t * 0.16 + i * 3.7, 500 + i) + (i % 3 === 0 ? 0.16 : 0));
      pts.push([Math.cos(a) * r * 1.12, Math.sin(a) * r * 0.86]);
    }
    // alças
    ctx.lineWidth = tam * 0.09;
    ctx.lineCap = 'round';
    ctx.strokeStyle = o.corAlca || 'rgba(255,255,255,0.8)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(pts[0][0] + tam * 0.2, s * tam * 0.3, tam * 0.36, tam * 0.16, s * 0.5 + Math.sin(t * 0.2) * 0.3, 0, TAU);
      ctx.stroke();
    }
    curva(ctx, pts, true, 0.22);
    ctx.fillStyle = o.cor || 'rgba(252,251,248,0.9)';
    ctx.fill();
    // facetas do amassado
    fpoli(ctx, [pts[1], pts[2], pts[3], [tam * 0.05, tam * 0.1]], o.corSombra || 'rgba(160,146,128,0.3)');
    fpoli(ctx, [pts[5], pts[6], pts[7], [-tam * 0.1, -tam * 0.05]], o.corSombra2 || 'rgba(160,146,128,0.18)');
    fpoli(ctx, [pts[8], pts[0], [tam * 0.2, 0], [tam * 0.1, -tam * 0.3]], 'rgba(255,255,255,0.7)');
    ctx.restore();
  };

  // ---------- rua em perspectiva de um ponto ----------
  // câmera baixa. (vx, vy) = ponto de fuga; F = distância focal em px.
  // devolve projetar(X, Y, Z) -> [x, y, escala]
  const fazerRua = (vx, vy, F, hc) => {
    const proj = (X, Y, Z) => [vx + (F * X) / Z, vy + (F * (hc - Y)) / Z, F / Z];
    return proj;
  };
  // predios laterais: cada um ocupa um trecho de profundidade, com altura própria
  const ruaPredios = (sem, n) => {
    const r = mulberry(sem);
    const lado = (s) => {
      const lista = [];
      let z = 2.2;
      for (let i = 0; i < n; i++) {
        const dz = lerp(1.2, 3.4, r()) * (1 + i * 0.22);
        lista.push({s, z0: z, z1: z + dz, h: lerp(3.2, 8.5, r()), recuo: r() < 0.35 ? lerp(0.3, 1.2, r()) : 0, caixa: r() < 0.5, tom: r()});
        z += dz + (r() < 0.25 ? lerp(0.3, 1, r()) : 0);
      }
      return lista;
    };
    return [...lado(-1), ...lado(1)];
  };
  // desenha os prédios dos dois lados, do fundo pra frente. Xw = meia largura da rua.
  const desenharRua = (ctx, proj, predios, Xw, o = {}) => {
    const ord = predios.slice().sort((a, b) => b.z0 - a.z0);
    const zMax = o.zMax || 40;
    for (const p of ord) {
      const X = p.s * (Xw + p.recuo);
      const nev = clamp(Math.log(p.z0) / Math.log(zMax)); // 0 perto, 1 longe
      const corLado = mix(o.perto || C.conc4, o.longe || C.conc1, nev);
      const corFrente = mix(o.pertoF || C.conc5, o.longe || C.conc1, nev * 0.92);
      const a0 = proj(X, 0, p.z0);
      const a1 = proj(X, 0, p.z1);
      const b0 = proj(X, p.h, p.z0);
      const b1 = proj(X, p.h, p.z1);
      // face que dá pra rua
      fpoli(ctx, [[a0[0], a0[1] + 2], [a1[0], a1[1] + 2], [b1[0], b1[1]], [b0[0], b0[1]]], corLado);
      // face que dá pra câmera (vai até a borda da tela)
      const borda = p.s < 0 ? Math.min(-40, a0[0] - 2000) : Math.max(W + 40, a0[0] + 2000);
      fpoli(ctx, [[a0[0], a0[1] + 2], [borda, a0[1] + 2], [borda, b0[1]], [b0[0], b0[1]]], corFrente);
      if (p.caixa) {
        const k = a0[2] * 0.9;
        const cx = a0[0] + p.s * k * 1.4;
        ctx.fillStyle = corFrente;
        ctx.fillRect(cx - k * 0.5, b0[1] - k * 1.25, k, k * 0.75);
        ctx.fillRect(cx - k * 0.42, b0[1] - k * 0.55, k * 0.1, k * 0.6);
        ctx.fillRect(cx + k * 0.32, b0[1] - k * 0.55, k * 0.1, k * 0.6);
      }
      // janelas na face da rua: riscos escuros em perspectiva
      if (o.janelas !== false && nev < 0.8) {
        const linhas = Math.max(1, Math.round(p.h / 1.6));
        const colsN = Math.max(1, Math.round((p.z1 - p.z0) / 0.9));
        ctx.fillStyle = rgba(o.corJanela || '#2A2420', 0.22 * (1 - nev));
        for (let i = 0; i < colsN; i++) {
          for (let j = 1; j < linhas; j++) {
            if (rnd(i * 13 + j, Math.round(p.z0 * 10)) > 0.5) continue;
            const z = lerp(p.z0, p.z1, (i + 0.3) / colsN);
            const zz = lerp(p.z0, p.z1, (i + 0.65) / colsN);
            const y = (j / linhas) * p.h;
            const q0 = proj(X, y, z);
            const q1 = proj(X, y, zz);
            const q2 = proj(X, y + 0.55, zz);
            const q3 = proj(X, y + 0.55, z);
            poli(ctx, [q0, q1, q2, q3]);
            ctx.fill();
          }
        }
      }
    }
  };

  // sombra comprida de uma figura no chão, apontando pra longe do sol.
  // (x, y) = pé; (sx, sy) = pé do sol no horizonte; larg = largura da figura; compr = fator.
  const sombraLonga = (ctx, x, y, larg, compr, sx, sy, cor) => {
    const dx = x - sx;
    const dy = y - sy;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const L = compr;
    const abre = 1 + L / Math.max(120, d);
    const px = -uy;
    const py = ux;
    ctx.beginPath();
    ctx.moveTo(x - px * larg * 0.5, y - py * larg * 0.5);
    ctx.lineTo(x + px * larg * 0.5, y + py * larg * 0.5);
    ctx.lineTo(x + ux * L + px * larg * 0.5 * abre * 0.7, y + uy * L + py * larg * 0.5 * abre * 0.7);
    ctx.lineTo(x + ux * L * 1.04, y + uy * L * 1.04);
    ctx.lineTo(x + ux * L - px * larg * 0.5 * abre * 0.7, y + uy * L - py * larg * 0.5 * abre * 0.7);
    ctx.closePath();
    // a sombra perde força ao se afastar do pé
    const gr = ctx.createLinearGradient(x, y, x + ux * L, y + uy * L);
    gr.addColorStop(0, cor);
    gr.addColorStop(1, 'rgba(60,36,24,0.04)');
    ctx.fillStyle = gr;
    ctx.fill();
  };

  // barras pretas entre painéis: desenha um painel recortado. fn(ctx) desenha dentro, com a origem no canto do painel.
  const painel = (ctx, x, y, w, h, fn) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    fn(ctx, w, h);
    ctx.restore();
  };

  O.cen = {ceuDia, sol, fazerCidade, desenharCidade, fios, chao, pedras, vento, ciscos, sacola, fazerRua, ruaPredios, desenharRua, sombraLonga, painel};
})(typeof window !== 'undefined' ? window : globalThis);
