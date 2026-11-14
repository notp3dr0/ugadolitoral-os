// O FIO · as peças. Contagem e ordem seguem a foto da loja (referencias/loja/g1.jpg e 1k2q.jpg):
//   G1   = 15 pérolas e 4 rondelas de strass, 3-R-3-R-3-R-3-R-3, corrente extensora e fecho lagosta.
//   1K2Q = corridas de 4 pérolas separadas por bolas de strass; três cruzes, a do meio maior e mais baixa.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, clamp, lerp, mix, rgba, circ, estrela, gLin, gRad, trilho, rnd} = O;
  const TAU = Math.PI * 2;

  // ---------- pérola ----------
  // modo 'dia': nácar (degradê radial, reflexo do ambiente, brilho). modo 'eclipse': escura com crescente de luz
  // na proporção do símbolo (lua 13% maior, deslocada 41% do raio pra longe da luz).
  const perola = (ctx, x, y, r, o = {}) => {
    if (r <= 0.3) return;
    const luz = o.luz == null ? -2.2 : o.luz;
    const lx = Math.cos(luz);
    const ly = Math.sin(luz);
    if (o.modo === 'eclipse') {
      const acesa = o.acesa == null ? 1 : o.acesa;
      if (acesa > 0.02 && r > 3 && o.halo !== false) {
        ctx.fillStyle = gRad(ctx, x + lx * r * 0.5, y + ly * r * 0.5, r * 0.3, x + lx * r * 0.5, y + ly * r * 0.5, r * 2.1, [
          [0, `rgba(255,214,190,${0.3 * acesa})`],
          [1, 'rgba(255,200,170,0)'],
        ]);
        ctx.beginPath();
        ctx.arc(x + lx * r * 0.5, y + ly * r * 0.5, r * 2.1, 0, TAU);
        ctx.fill();
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = mix('#3A0A07', '#FFF6EA', acesa);
      ctx.fill();
      ctx.clip();
      const mx = x - lx * r * 0.4135;
      const my = y - ly * r * 0.4135;
      ctx.beginPath();
      ctx.arc(mx, my, r * 1.1276, 0, TAU);
      ctx.fillStyle = gRad(ctx, mx + lx * r * 0.5, my + ly * r * 0.5, r * 0.1, mx, my, r * 1.2, [
        [0, mix('#2A0706', '#5A1711', acesa)],
        [0.6, '#260605'],
        [1, '#120202'],
      ]);
      ctx.fill();
      ctx.restore();
      return;
    }
    const tom = o.tom || 0; // 0 = luz cheia, 1 = sombra
    if (r < 4.5) {
      circ(ctx, x, y, r, mix('#F3F0EA', '#9C948B', tom));
      if (r > 2) circ(ctx, x + lx * r * 0.35, y + ly * r * 0.35, r * 0.35, '#FFFFFF');
      return;
    }
    const hx = x + lx * r * 0.36;
    const hy = y + ly * r * 0.36;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = gRad(ctx, hx, hy, r * 0.04, x, y, r * 1.02, [
      [0, '#FFFFFF'],
      [0.3, mix('#FBF9F5', '#D9D3CA', tom)],
      [0.64, mix('#E9E4DC', '#B4ACA2', tom)],
      [0.87, mix('#CBC4BA', '#8D857C', tom)],
      [1, mix('#A8A097', '#6E675F', tom)],
    ]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    // reflexo do ambiente na borda oposta à luz
    const rf = o.reflexo;
    if (rf) {
      const bx = x - lx * r * 0.95;
      const by = y - ly * r * 0.95;
      ctx.fillStyle = gRad(ctx, bx, by, 0, bx, by, r * 0.95, [
        [0, rgba(rf, 0.55)],
        [1, rgba(rf, 0)],
      ]);
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // nácar: um sopro rosado embaixo e outro azulado de lado
    ctx.fillStyle = gRad(ctx, x + ly * r * 0.55, y - lx * r * 0.55, 0, x + ly * r * 0.55, y - lx * r * 0.55, r * 0.8, [
      [0, 'rgba(255,196,214,0.26)'],
      [1, 'rgba(255,196,214,0)'],
    ]);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = gRad(ctx, x - ly * r * 0.6, y + lx * r * 0.6, 0, x - ly * r * 0.6, y + lx * r * 0.6, r * 0.75, [
      [0, 'rgba(186,214,255,0.24)'],
      [1, 'rgba(186,214,255,0)'],
    ]);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    // brilho: uma elipse dura e um ponto mole
    ctx.save();
    ctx.translate(x + lx * r * 0.52, y + ly * r * 0.52);
    ctx.rotate(luz + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.24, r * 0.13, 0, 0, TAU);
    ctx.fillStyle = `rgba(255,255,255,${0.95 * (1 - tom * 0.5)})`;
    ctx.fill();
    ctx.restore();
    circ(ctx, x - lx * r * 0.55, y - ly * r * 0.55, r * 0.09, 'rgba(255,255,255,0.5)');
  };

  // ---------- rondela de strass (G1): disco de metal visto de perfil, com três pedras ----------
  const rondela = (ctx, x, y, r, ang, o = {}) => {
    const esp = r * 0.56; // espessura ao longo do fio
    const alt = r * 1.86; // de fora a fora
    const ecl = o.modo === 'eclipse';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.roundRect(-esp / 2, -alt / 2, esp, alt, esp * 0.32);
    ctx.fillStyle = ecl
      ? gLin(ctx, 0, -alt / 2, 0, alt / 2, [[0, '#FFF2E2'], [0.18, '#5A1410'], [1, '#1A0303']])
      : gLin(ctx, 0, -alt / 2, 0, alt / 2, [[0, C.prata3], [0.2, C.prata1], [0.45, C.prata2], [0.75, C.prata3], [1, C.prata4]]);
    ctx.fill();
    if (r > 6) {
      for (const d of [-0.56, 0, 0.56]) {
        ctx.beginPath();
        ctx.roundRect(-esp * 0.3, d * r - r * 0.17, esp * 0.6, r * 0.34, r * 0.06);
        ctx.fillStyle = ecl ? '#0E0202' : '#6C7178';
        ctx.fill();
        circ(ctx, -esp * 0.04, d * r - r * 0.03, r * 0.1, ecl ? '#FFE9D6' : '#FFFFFF');
      }
    }
    ctx.restore();
    if (o.brilho > 0.02) estrela(ctx, x, y, r * 2.2 * o.brilho, o.rot || 0, '#FFFFFF', 0.07);
  };

  // ---------- bola de strass (1K2Q): esfera de metal cravejada ----------
  const bolaStrass = (ctx, x, y, r, o = {}) => {
    if (r <= 0.3) return;
    const ecl = o.modo === 'eclipse';
    const acesa = o.acesa == null ? 1 : o.acesa;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = ecl
      ? gRad(ctx, x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r, [[0, mix('#2A0706', '#7A2A20', acesa)], [1, '#140202']])
      : gRad(ctx, x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r, [[0, C.prata1], [0.5, C.prata2], [0.85, C.prata3], [1, C.prata4]]);
    ctx.fill();
    if (r > 5) {
      ctx.save();
      ctx.clip();
      const t = o.t || 0;
      const sal = o.sal || 0;
      // pedras: uma no meio, seis em volta, doze na borda
      const anel = [[0, 1, 0], [0.5, 6, 0.3], [0.86, 11, 0]];
      let n = 0;
      for (const [d, q, fase] of anel) {
        for (let i = 0; i < q; i++) {
          const a = (i / q) * TAU + fase + (o.gira || 0);
          const px = x + Math.cos(a) * d * r;
          const py = y + Math.sin(a) * d * r;
          const pisca = 0.5 + 0.5 * Math.sin(t * 0.55 + rnd(n, 40 + sal) * 20);
          const claro = rnd(n, 7 + sal) * 0.6 + pisca * 0.4;
          const pr = r * (d > 0.8 ? 0.17 : 0.2);
          circ(ctx, px, py, pr, ecl ? mix('#1A0302', '#FFEFDF', claro * acesa) : mix('#5E6269', '#FFFFFF', claro));
          if (!ecl) circ(ctx, px + pr * 0.25, py + pr * 0.3, pr * 0.45, rgba('#3C3F44', 0.35));
          n++;
        }
      }
      ctx.restore();
    }
    if (o.brilho > 0.02) estrela(ctx, x - r * 0.25, y - r * 0.3, r * 2.6 * o.brilho, o.rot || 0, '#FFFFFF', 0.07);
  };

  // ---------- cruz gótica ----------
  // Origem no ponto em que pendura, y pra baixo, altura total h.
  // 'centro': cruz de braços que abrem em leque, pontas côncavas (a maior do 1K2Q).
  // 'lado': cruz fina com botões nas pontas.
  const cruzCaminho = (ctx, h, tipo) => {
    ctx.beginPath();
    if (tipo === 'centro') {
      const cy = 0.4 * h;
      const w0 = 0.05 * h;
      const w1 = 0.15 * h;
      const yT = 0.06 * h;
      const yB = h;
      const xR = 0.31 * h;
      const wB = 0.165 * h;
      const dent = 0.04 * h;
      ctx.moveTo(-w1, yT);
      ctx.quadraticCurveTo(0, yT + dent, w1, yT);
      ctx.quadraticCurveTo(w0 * 1.1, yT + (cy - yT) * 0.45, w0, cy - w0);
      ctx.quadraticCurveTo(w0 + (xR - w0) * 0.55, cy - w0 * 1.1, xR, cy - w1);
      ctx.quadraticCurveTo(xR - dent, cy, xR, cy + w1);
      ctx.quadraticCurveTo(w0 + (xR - w0) * 0.55, cy + w0 * 1.1, w0, cy + w0);
      ctx.quadraticCurveTo(w0 * 1.1, cy + (yB - cy) * 0.6, wB, yB);
      ctx.quadraticCurveTo(0, yB - dent * 1.2, -wB, yB);
      ctx.quadraticCurveTo(-w0 * 1.1, cy + (yB - cy) * 0.6, -w0, cy + w0);
      ctx.quadraticCurveTo(-w0 - (xR - w0) * 0.55, cy + w0 * 1.1, -xR, cy + w1);
      ctx.quadraticCurveTo(-xR + dent, cy, -xR, cy - w1);
      ctx.quadraticCurveTo(-w0 - (xR - w0) * 0.55, cy - w0 * 1.1, -w0, cy - w0);
      ctx.quadraticCurveTo(-w0 * 1.1, yT + (cy - yT) * 0.45, -w1, yT);
      ctx.closePath();
    } else {
      const cy = 0.36 * h;
      const w = 0.036 * h;
      const yT = 0.1 * h;
      const yB = 0.93 * h;
      const xR = 0.27 * h;
      ctx.rect(-w, yT, w * 2, yB - yT);
      ctx.rect(-xR, cy - w, xR * 2, w * 2);
      const botao = (bx, by, dx, dy) => {
        // losango na ponta e dois botões de lado
        const s = 0.07 * h;
        ctx.moveTo(bx + dx * s * 1.25, by + dy * s * 1.25);
        ctx.lineTo(bx - dy * s * 0.8, by + dx * s * 0.8);
        ctx.lineTo(bx - dx * s * 0.9, by - dy * s * 0.9);
        ctx.lineTo(bx + dy * s * 0.8, by - dx * s * 0.8);
        ctx.closePath();
        for (const sg of [-1, 1]) {
          const ox = bx - dx * s * 0.75 - dy * sg * s * 0.95;
          const oy = by - dy * s * 0.75 + dx * sg * s * 0.95;
          ctx.moveTo(ox + s * 0.42, oy);
          ctx.arc(ox, oy, s * 0.42, 0, TAU);
        }
      };
      botao(0, yT, 0, -1);
      botao(0, yB, 0, 1);
      botao(-xR, cy, -1, 0);
      botao(xR, cy, 1, 0);
      ctx.moveTo(0.075 * h, cy);
      ctx.arc(0, cy, 0.075 * h, 0, TAU);
    }
  };
  const cruz = (ctx, x, y, h, ang, o = {}) => {
    const tipo = o.tipo || 'lado';
    const ecl = o.modo === 'eclipse';
    const acesa = o.acesa == null ? 1 : o.acesa;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang || 0);
    // argola
    ctx.beginPath();
    ctx.arc(0, 0.035 * h, 0.04 * h, 0, TAU);
    ctx.lineWidth = Math.max(1, 0.018 * h);
    ctx.strokeStyle = ecl ? mix('#2A0706', '#FFEAD8', acesa * 0.8) : C.prata2;
    ctx.stroke();
    if (ecl && acesa > 0.02) {
      // filete de luz: a mesma cruz, clara, um pouco deslocada pra cima e pra esquerda
      ctx.save();
      ctx.translate(-0.014 * h, -0.02 * h);
      cruzCaminho(ctx, h, tipo);
      ctx.fillStyle = mix('#3A0A07', '#FFF2E4', acesa);
      ctx.fill();
      ctx.restore();
    }
    cruzCaminho(ctx, h, tipo);
    ctx.fillStyle = ecl
      ? gLin(ctx, 0, 0, 0, h, [[0, '#3A0C09'], [1, '#150303']])
      : gLin(ctx, -0.3 * h, 0, 0.3 * h, h, [[0, C.prata1], [0.3, C.prata2], [0.55, C.prata3], [0.78, C.prata2], [1, C.prata4]]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    // faixa de luz que atravessa o metal
    const fx = o.faixa == null ? 0.3 : o.faixa;
    if (!ecl || acesa > 0.3) {
      ctx.rotate(-0.5);
      const px = lerp(-0.9 * h, 0.9 * h, fx);
      ctx.fillStyle = gLin(ctx, px - 0.09 * h, 0, px + 0.09 * h, 0, [
        [0, 'rgba(255,255,255,0)'],
        [0.5, `rgba(255,255,255,${ecl ? 0.35 : 0.85})`],
        [1, 'rgba(255,255,255,0)'],
      ]);
      ctx.fillRect(-h, -h, h * 2, h * 3);
    }
    ctx.restore();
    // pedras ao longo dos braços
    if (h > 40) {
      const cy = (tipo === 'centro' ? 0.4 : 0.36) * h;
      const pedras =
        tipo === 'centro'
          ? [[0, 0.17], [0, 0.285], [0, cy / h], [0, 0.53], [0, 0.655], [0, 0.78], [0, 0.9], [-0.11, cy / h], [-0.22, cy / h], [0.11, cy / h], [0.22, cy / h], [-0.085, 0.92], [0.085, 0.92], [-0.08, 0.13], [0.08, 0.13]]
          : [[0, 0.2], [0, cy / h], [0, 0.52], [0, 0.66], [0, 0.8], [-0.13, cy / h], [0.13, cy / h]];
      pedras.forEach(([px, py], i) => {
        const rr = h * (tipo === 'centro' ? 0.03 : 0.024) * (px === 0 && Math.abs(py - cy / h) < 0.01 ? 1.5 : 1);
        circ(ctx, px * h, py * h, rr, ecl ? mix('#120202', '#FFE9D6', acesa * (0.4 + 0.6 * rnd(i, 5))) : '#4B4E54');
        if (!ecl) circ(ctx, px * h - rr * 0.2, py * h - rr * 0.25, rr * 0.6, '#FFFFFF');
      });
    }
    if (o.brilho > 0.02) estrela(ctx, 0, (tipo === 'centro' ? 0.4 : 0.36) * h, h * 0.55 * o.brilho, o.rot || 0, '#FFFFFF', 0.06);
    ctx.restore();
  };

  // ---------- corrente: elos alternando de frente e de perfil ao longo de um trilho ----------
  // quantos = quantos elos já existem (pode ser fracionário, o último cresce)
  const corrente = (ctx, tr, s0, s1, passo, o = {}) => {
    const cor = o.cor || C.prata2;
    const luzc = o.corLuz || C.prata1;
    const n = Math.max(1, Math.round((s1 - s0) / passo));
    const p = (s1 - s0) / n;
    const quantos = o.quantos == null ? n : o.quantos;
    const grosso = o.grosso || Math.max(1.2, passo * 0.16);
    for (let i = 0; i < n; i++) {
      const esc = clamp(quantos - i);
      if (esc <= 0) break;
      const pt = tr.em(s0 + p * (i + 0.5));
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.ang);
      ctx.scale(esc, esc);
      const frente = i % 2 === 0;
      ctx.beginPath();
      ctx.ellipse(0, 0, p * 0.66, frente ? p * 0.34 : p * 0.1, 0, 0, TAU);
      ctx.lineWidth = grosso;
      ctx.strokeStyle = cor;
      ctx.stroke();
      if (frente && passo > 10) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p * 0.66, p * 0.34, 0, Math.PI * 1.05, Math.PI * 1.75);
        ctx.lineWidth = grosso * 0.45;
        ctx.strokeStyle = luzc;
        ctx.stroke();
      }
      ctx.restore();
    }
  };
  const argola = (ctx, x, y, r, o = {}) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.lineWidth = o.grosso || Math.max(1.2, r * 0.36);
    ctx.strokeStyle = o.cor || C.prata2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.7);
    ctx.lineWidth = (o.grosso || Math.max(1.2, r * 0.36)) * 0.45;
    ctx.strokeStyle = o.corLuz || C.prata1;
    ctx.stroke();
  };

  // ---------- fecho lagosta ----------
  // Origem na argolinha de trás; o gancho aponta pra +x. tam = comprimento do corpo.
  const fechoLagosta = (ctx, x, y, tam, ang, o = {}) => {
    const k = tam / 68;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(k, k);
    ctx.translate(40, 0);
    const corpo = new Path2D(
      'M-34 0 Q-31 -17 -8 -19 L20 -13 Q36 -7 34 4 Q30 17 10 19 L-10 19 Q-30 17 -34 0Z M-9 -7 Q-18 0 -9 8 L11 8 Q21 1 12 -6Z'
    );
    ctx.fillStyle = o.cor || gLin(ctx, 0, -19, 0, 19, [[0, C.prata1], [0.35, C.prata2], [0.7, C.prata3], [1, C.prata4]]);
    ctx.fill(corpo, 'evenodd');
    // gatilho
    ctx.beginPath();
    ctx.roundRect(-22, 15, 14, 9, 4);
    ctx.fillStyle = o.cor || C.prata3;
    ctx.fill();
    // faixa de luz
    ctx.beginPath();
    ctx.moveTo(-26, -9);
    ctx.quadraticCurveTo(-8, -15, 18, -10);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = o.corLuz || 'rgba(255,255,255,0.9)';
    ctx.stroke();
    // argolinha de trás
    ctx.beginPath();
    ctx.arc(-40, 0, 7, 0, TAU);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = o.corArgola || C.prata2;
    ctx.stroke();
    ctx.restore();
  };

  // ---------- G1: as 19 contas ao longo de um trilho ----------
  const G1_SEQ = 'ppprppprppprppprppp'.split('');
  const G1_COMPR = 15 * 2 + 4 * 0.56; // em raios de pérola
  // devolve as contas com posição; r = raio da pérola; s0 = onde começa no trilho
  const g1Contas = (tr, s0, r) => {
    let s = s0;
    return G1_SEQ.map((tipo, i) => {
      const w = tipo === 'p' ? 2 * r : 0.56 * r;
      const pt = tr.em(s + w / 2);
      s += w;
      return {tipo, i, x: pt.x, y: pt.y, ang: pt.ang};
    });
  };
  // desenha as contas. o.escala(i), o.brilho(i) opcionais; o.modo, o.luz, o.reflexo
  const g1Desenhar = (ctx, contas, r, o = {}) => {
    for (const c of contas) {
      const e = o.escala ? o.escala(c.i) : 1;
      if (e <= 0.001) continue;
      if (c.tipo === 'r') {
        rondela(ctx, c.x, c.y, r * e, c.ang, {modo: o.modo, brilho: o.brilho ? o.brilho(c.i) : 0, rot: o.rot || 0});
      } else {
        perola(ctx, c.x, c.y, r * e, {
          modo: o.modo,
          luz: o.luzDe ? o.luzDe(c) : o.luz,
          reflexo: o.reflexo,
          acesa: o.acesa ? o.acesa(c.i) : 1,
          tom: o.tom,
        });
        const b = o.brilho ? o.brilho(c.i) : 0;
        if (b > 0.02) estrela(ctx, c.x - r * 0.3, c.y - r * 0.3, r * 1.6 * b, o.rot || 0, '#FFFFFF');
      }
    }
  };

  // G1 como na foto do produto: U de pérolas, corrente por cima, fecho lagosta à direita.
  // (cx, cy) = centro do conjunto; a = meia largura do U (centro das pérolas).
  const g1Produto = (ctx, cx, cy, a, o = {}) => {
    const b = a * 1.5;
    const topo = cy - b * 0.56;
    const N = 160;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const th = -Math.PI / 2 + (Math.PI * i) / N;
      pts.push([cx + a * Math.sin(th) + (o.vies || 0) * Math.cos(th) * a, topo + b * Math.cos(th)]);
    }
    const tr = trilho(pts);
    const r = tr.total / G1_COMPR / 1.0;
    const contas = g1Contas(tr, 0, r);
    const pe = [cx - a, topo - r * 1.9]; // argola da esquerda
    const pd = [cx + a, topo - r * 1.9]; // argola da direita
    // sombra de contato no papel
    if (o.sombra) {
      ctx.save();
      ctx.globalAlpha *= o.sombra;
      for (const c of contas) {
        const e = o.escala ? o.escala(c.i) : 1;
        if (e <= 0.01) continue;
        ctx.fillStyle = gRad(ctx, c.x + r * 0.35, c.y + r * 0.5, r * 0.2, c.x + r * 0.35, c.y + r * 0.5, r * 1.5, [
          [0, 'rgba(60,40,30,0.32)'],
          [1, 'rgba(60,40,30,0)'],
        ]);
        ctx.fillRect(c.x - r * 1.5, c.y - r * 1.5, r * 4, r * 4);
      }
      ctx.restore();
    }
    // corrente extensora: da argola esquerda até o fecho, com uma barriga leve
    const elosT = o.elos == null ? 1 : o.elos; // 0..1
    const fecho = o.fecho == null ? 1 : o.fecho; // 0 aberto, 1 fechado
    const tamFecho = r * 2.5;
    const cpts = [];
    const fimX = pd[0] - tamFecho * 1.02;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      cpts.push([lerp(pe[0] + r * 0.5, fimX, t), pe[1] + Math.sin(t * Math.PI) * r * 0.9 - t * r * 0.2]);
    }
    const ctr = trilho(cpts);
    const nElos = 9;
    const corMetal = o.modo === 'eclipse' ? '#E9D3C4' : C.prata2;
    if (elosT > 0) {
      argola(ctx, pe[0], pe[1], r * 0.5, {cor: corMetal});
      // pino que liga a argola à primeira pérola
      ctx.beginPath();
      ctx.moveTo(pe[0], pe[1] + r * 0.5);
      ctx.lineTo(contas[0].x, contas[0].y - r * 0.9);
      ctx.moveTo(pd[0], pd[1] + r * 0.5);
      ctx.lineTo(contas[18].x, contas[18].y - r * 0.9);
      ctx.lineWidth = Math.max(1.2, r * 0.14);
      ctx.strokeStyle = corMetal;
      ctx.stroke();
      corrente(ctx, ctr, 0, ctr.total, ctr.total / nElos, {quantos: elosT * nElos, cor: corMetal, grosso: Math.max(1.4, r * 0.17)});
    }
    if (elosT >= 1) {
      const fim = ctr.em(ctr.total);
      argola(ctx, pd[0], pd[1], r * 0.5, {cor: corMetal});
      fechoLagosta(ctx, fim.x - r * 0.1, fim.y, tamFecho, -0.12 - (1 - fecho) * 0.9, {});
    }
    g1Desenhar(ctx, contas, r, o);
    if (o.clarao > 0.02) estrela(ctx, pd[0] - tamFecho * 0.4, pd[1], r * 5 * o.clarao, 0.2, '#FFFFFF', 0.06);
    return {contas, r, tr};
  };

  // ---------- 1K2Q ----------
  // corridas de 4 pérolas separadas por bolas; cruzes no meio das três corridas de baixo
  const K_SEQ = 'ppppbppppbppppbppppbppppbppppbpppp'.split('');
  const K_BOLA = 1.16; // raio da bola em raios de pérola
  const K_COMPR = 28 * 2 + 6 * 2 * K_BOLA;
  // contas centradas no meio do trilho. ordem = distância do centro (0 = par do meio), pra revelar de dentro pra fora
  const k2qContas = (tr, r) => {
    let s = tr.total / 2 - (K_COMPR * r) / 2;
    const n = K_SEQ.length;
    const contas = K_SEQ.map((tipo, i) => {
      const w = tipo === 'p' ? 2 * r : 2 * K_BOLA * r;
      const pt = tr.em(s + w / 2);
      s += w;
      const ordem = i < n / 2 ? n / 2 - 1 - i : i - n / 2;
      return {tipo, i, x: pt.x, y: pt.y, ang: pt.ang, ordem, lado: i < n / 2 ? -1 : 1, s: s - w / 2};
    });
    // cruzes: entre a 2ª e a 3ª pérola das corridas 3, 4 e 5 (índices 11|12, 16|17, 21|22)
    const meio = (i, j) => ({x: (contas[i].x + contas[j].x) / 2, y: (contas[i].y + contas[j].y) / 2, ang: (contas[i].ang + contas[j].ang) / 2});
    const cruzes = [
      {...meio(11, 12), tipo: 'lado', k: 0},
      {...meio(16, 17), tipo: 'centro', k: 1},
      {...meio(21, 22), tipo: 'lado', k: 2},
    ];
    return {contas, cruzes};
  };
  // desenha o colar. o.escala(conta), o.brilhoBola(conta), o.cruz(k) -> {escala, ang, brilho, dy}, o.modo, o.luzDe(conta)
  const k2qDesenhar = (ctx, col, r, o = {}) => {
    const {contas, cruzes} = col;
    const hLado = r * 2 * (o.hLado || 4.4);
    const hCentro = r * 2 * (o.hCentro || 5.9);
    for (const cz of cruzes) {
      const m = o.cruz ? o.cruz(cz.k) : {escala: 1, ang: 0};
      if (!m || m.escala <= 0.001) continue;
      const h = (cz.tipo === 'centro' ? hCentro : hLado) * m.escala;
      cruz(ctx, cz.x, cz.y + r * 0.75 + (m.dy || 0), h, m.ang || 0, {
        tipo: cz.tipo,
        modo: o.modo,
        acesa: o.acesaCruz == null ? 1 : o.acesaCruz,
        brilho: m.brilho || 0,
        faixa: m.faixa,
        rot: o.rot,
      });
    }
    for (const c of contas) {
      const e = o.escala ? o.escala(c) : 1;
      if (e <= 0.001) continue;
      const px = c.x + (o.dx ? o.dx(c) : 0);
      const py = c.y + (o.dy ? o.dy(c) : 0);
      if (c.tipo === 'b') {
        bolaStrass(ctx, px, py, r * K_BOLA * e, {
          modo: o.modo,
          t: o.t,
          sal: c.i,
          acesa: o.acesa ? o.acesa(c) : 1,
          brilho: o.brilhoBola ? o.brilhoBola(c) : 0,
          rot: o.rot,
        });
      } else {
        perola(ctx, px, py, r * e, {
          modo: o.modo,
          luz: o.luzDe ? o.luzDe(c) : o.luz,
          reflexo: o.reflexo,
          acesa: o.acesa ? o.acesa(c) : 1,
          tom: o.tom,
        });
      }
    }
  };

  // arco em U (meia elipse pendurada) como lista de pontos, com balanço lateral opcional
  const arcoU = (cx, topo, a, b, o = {}) => {
    const N = o.n || 200;
    const tMax = o.tMax == null ? Math.PI / 2 : o.tMax;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const th = -tMax + (2 * tMax * i) / N;
      const prof = Math.cos(th); // 1 embaixo, 0 nas pontas
      const bal = (o.balanco || 0) * Math.pow(Math.max(0, prof), 1.4);
      pts.push([cx + a * Math.sin(th) + bal, topo + b * Math.cos(th)]);
    }
    return pts;
  };

  O.pecas = {
    perola, rondela, bolaStrass, cruz, cruzCaminho, corrente, argola, fechoLagosta,
    G1_SEQ, G1_COMPR, g1Contas, g1Desenhar, g1Produto,
    K_SEQ, K_BOLA, K_COMPR, k2qContas, k2qDesenhar, arcoU,
  };
})(typeof window !== 'undefined' ? window : globalThis);
