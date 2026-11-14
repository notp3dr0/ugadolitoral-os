// O FIO · o andarilho e as três sombras. Forma chapada, sem contorno, dois ou três tons por peça.
// O andarilho vem dos reposts: dreads com ponta vermelha, óculos ovais vermelhos, jaqueta larga
// verde-oliva aberta, camiseta vermelha. Nada aqui é personagem de série nenhuma.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, clamp, lerp, mix, rgba, circ, fpoli, poli, curva, gLin, gRad, rnd, ruido, estrela} = O;
  const TAU = Math.PI * 2;

  const TONS = {
    pele: C.pele, peleL: C.peleLuz, peleS: C.peleSombra,
    jaq: C.jaqueta, jaqL: C.jaquetaLuz, jaqS: C.jaquetaSombra,
    cam: C.camiseta, camS: C.camisetaSombra,
    calca: C.calca, calcaL: '#2A2725',
    tenis: C.tenis, sola: '#D5D0C4', detalhe: C.vermelho,
    dread: C.dread, ponta: C.vermelho,
    oculos: '#C4160C', lente: '#E9E6E0',
    corrente: C.cinzaCorrente,
  };
  const tonsDe = (o) => {
    if (o.silhueta) {
      const t = {};
      for (const k in TONS) t[k] = o.silhueta;
      return t;
    }
    return o.tons ? Object.assign({}, TONS, o.tons) : TONS;
  };
  // tons de contraluz: tudo puxa pro escuro, com um resto de cor
  const tonsContraluz = (q = 0.7, para = '#1A1210') => {
    const t = {};
    for (const k in TONS) t[k] = O.mixHex(TONS[k], para, q);
    return t;
  };

  // perna por dois ossos: quadril -> joelho -> tornozelo, joelho dobrando pra frente
  const joelhoDe = (hx, hy, ax, ay, l1, l2, sinal = 1) => {
    let dx = ax - hx;
    let dy = ay - hy;
    let d = Math.hypot(dx, dy);
    const max = l1 + l2 - 0.0005;
    if (d > max) {
      dx *= max / d;
      dy *= max / d;
      d = max;
    }
    const base = Math.atan2(dy, dx);
    const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    return {kx: hx + Math.cos(base - a * sinal) * l1, ky: hy + Math.sin(base - a * sinal) * l1, ax: hx + dx, ay: hy + dy};
  };

  // membro: polígono ao longo de uma polilinha, com largura por ponto (canto vivo ou curva suave)
  const membro = (ctx, pts, ws, cor, suave) => {
    const L = [];
    const R = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1;
      dx /= d;
      dy /= d;
      const w = ws[i] / 2;
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
      R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    if (suave) {
      // ponta arredondada: um ponto a mais além do fim
      const a = pts[n - 2];
      const b = pts[n - 1];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const tip = [b[0] + ((b[0] - a[0]) / d) * ws[n - 1] * 0.5, b[1] + ((b[1] - a[1]) / d) * ws[n - 1] * 0.5];
      curva(ctx, [...L, tip, ...R.reverse()], true, 0.5);
    } else {
      poli(ctx, [...L, ...R.reverse()]);
    }
    ctx.fillStyle = cor;
    ctx.fill();
  };

  // mecha de dread: polilinha que pende e balança; desenha grossa, afinando, com a ponta vermelha
  const dread = (ctx, x0, y0, ang, compr, grosso, o) => {
    const n = 6;
    let x = x0;
    let y = y0;
    let a = ang;
    const pts = [[x, y]];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      // a gravidade puxa a direção pra baixo; o balanço cresce pra ponta e atrasa ao longo da mecha
      const alvo = Math.PI / 2 + (o.vento || 0) * 0.5;
      a = lerp(a, alvo, o.grav == null ? 0.34 : o.grav);
      const bal = Math.sin((o.t || 0) - t * 1.7 + (o.fase || 0)) * (o.balanco || 0) * t;
      x += Math.cos(a + bal) * (compr / n);
      y += Math.sin(a + bal) * (compr / n);
      pts.push([x, y]);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const t = i / n;
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      ctx.lineWidth = grosso * lerp(1, 0.6, t);
      ctx.strokeStyle = t >= (o.corte == null ? 0.66 : o.corte) ? o.ponta : o.cor;
      ctx.stroke();
    }
    return pts[n];
  };

  // ---------- andarilho de lado (olhando pra +x; dir = -1 espelha) ----------
  // origem: meio dos pés no chão. alt = altura em px.
  // o: fase (rad do passo), andar 0..1, agacha 0..1, inclina (rad), vento (-1..1), t (tempo pro pano),
  //    corrente (bool), joias (bool), silhueta (cor), tons, pes [{x,y,giro}], braco (rad), cabeca (rad)
  const figLado = (ctx, x, yChao, alt, o = {}) => {
    const T = tonsDe(o);
    const dir = o.dir || 1;
    const fase = o.fase || 0;
    const andar = o.andar == null ? 0 : o.andar;
    const agacha = o.agacha || 0;
    const t = o.t || 0;
    const vento = o.vento == null ? 0.3 : o.vento;
    ctx.save();
    ctx.translate(x, yChao);
    ctx.scale(alt * dir, alt);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const passo = 0.115 * andar;
    const hx = (o.quadrilX || 0) + agacha * 0.02;
    const hy = -0.475 + agacha * 0.12 + Math.abs(Math.cos(fase)) * 0.01 * andar;
    const pes = [0, 1].map((i) => {
      if (o.pes) return o.pes[i];
      const ph = (((fase + i * Math.PI) % TAU) + TAU) % TAU;
      if (ph < Math.PI) return {x: passo * Math.cos(ph), y: 0, giro: 0};
      const u = (ph - Math.PI) / Math.PI;
      return {x: -passo * Math.cos(Math.PI * u), y: -0.04 * andar * Math.sin(Math.PI * u), giro: 0.5 * andar * Math.sin(Math.PI * u) * (1 - u * 1.4)};
    });
    const perna = (i, cor, corDobra) => {
      const p = pes[i];
      const j = joelhoDe(hx, hy, p.x - 0.012, p.y - 0.045, 0.225, 0.225);
      // calça larga, de canto vivo
      membro(ctx, [[hx - 0.005, hy - 0.03], [j.kx, j.ky], [j.ax, j.ay + 0.012]], [0.118, 0.1, 0.092], cor);
      if (corDobra) membro(ctx, [[hx + 0.02, hy], [j.kx + 0.022, j.ky], [j.ax + 0.024, j.ay + 0.012]], [0.03, 0.028, 0.03], corDobra);
      // tênis
      ctx.save();
      ctx.translate(j.ax, j.ay);
      ctx.rotate(p.giro || 0);
      fpoli(ctx, [[-0.05, 0.016], [-0.044, -0.02], [0.02, -0.026], [0.078, 0.004], [0.106, 0.026], [0.106, 0.046], [-0.05, 0.046]], T.tenis);
      fpoli(ctx, [[-0.052, 0.032], [0.108, 0.032], [0.108, 0.046], [-0.052, 0.046]], T.sola);
      fpoli(ctx, [[-0.012, -0.006], [0.04, 0.002], [0.03, 0.02], [-0.02, 0.016]], T.detalhe);
      ctx.restore();
    };
    perna(0, T.calca);

    // tronco: gira em volta do quadril
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(0.04 + (o.inclina || 0) + agacha * 0.42);
    const bal = Math.sin(fase) * 0.42 * andar;
    const braco = (frente, cor, corS) => {
      const sx = -0.012;
      const sy = -0.325;
      const a0 = Math.PI / 2 + 0.06 + (frente ? -bal : bal) + (frente ? o.braco || 0 : o.bracoTras || 0);
      const ex = sx + Math.cos(a0) * 0.155;
      const ey = sy + Math.sin(a0) * 0.155;
      const a1 = a0 - 0.22 - (frente ? o.cotovelo || 0 : 0);
      const mx = ex + Math.cos(a1) * 0.14;
      const my = ey + Math.sin(a1) * 0.14;
      membro(ctx, [[sx, sy - 0.02], [ex, ey], [mx, my]], [0.092, 0.08, 0.07], cor);
      if (corS) membro(ctx, [[sx - 0.02, sy - 0.02], [ex - 0.02, ey], [mx - 0.018, my]], [0.04, 0.036, 0.03], corS);
      const hx2 = mx + Math.cos(a1) * 0.026;
      const hy2 = my + Math.sin(a1) * 0.026;
      ctx.beginPath();
      ctx.ellipse(hx2, hy2, 0.03, 0.022, a1, 0, TAU);
      ctx.fillStyle = frente ? T.pele : T.peleS;
      ctx.fill();
      return [hx2, hy2];
    };
    braco(false, T.jaqS);
    // camiseta (aparece na frente, a jaqueta está aberta)
    fpoli(ctx, [[-0.03, -0.365], [0.05, -0.36], [0.076, -0.22], [0.07, 0.02], [-0.03, 0.03]], T.cam);
    fpoli(ctx, [[0.02, -0.36], [0.05, -0.36], [0.03, -0.2], [0.035, 0.02], [0.0, 0.02]], T.camS);
    // jaqueta: bloco largo, barra de trás batendo no vento
    const fl = ruido(t * 0.21, 3) * 0.5 + Math.sin(t * 0.33) * 0.5;
    const bv = vento * (0.028 + 0.022 * fl);
    fpoli(ctx, [[-0.082, -0.325], [-0.035, -0.376], [0.026, -0.37], [0.046, -0.25], [0.04, 0.06 + bv * 0.3], [-0.03, 0.082 + bv * 0.2], [-0.112 - bv, 0.092 - bv * 0.5], [-0.1 - bv * 0.4, -0.1]], T.jaq);
    fpoli(ctx, [[-0.082, -0.325], [-0.05, -0.36], [-0.058, -0.1], [-0.05, 0.086 + bv * 0.2], [-0.112 - bv, 0.092 - bv * 0.5], [-0.1 - bv * 0.4, -0.1]], T.jaqS);
    // gola
    fpoli(ctx, [[-0.035, -0.376], [0.026, -0.37], [0.04, -0.3], [0.0, -0.335]], T.jaqL);
    const mao = braco(true, T.jaqL, T.jaq);
    // pescoço e cabeça
    ctx.save();
    ctx.translate(0.004, -0.372);
    ctx.rotate((o.cabeca || 0) - 0.04);
    fpoli(ctx, [[-0.022, -0.035], [0.024, -0.03], [0.028, 0.012], [-0.028, 0.012]], T.peleS);
    const cy = -0.082;
    const cx0 = 0.006;
    const dOpt = {t: t * 0.3, vento: -vento * 0.5 - andar * 0.2, balanco: 0.16 + andar * 0.16, cor: T.dread, ponta: T.ponta, corte: 0.7};
    // dreads: a massa cai pra trás, sobre a nuca e o ombro
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.78 + i * 0.105);
      dread(ctx, cx0 + Math.cos(a) * 0.04, cy + Math.sin(a) * 0.04, Math.PI * (0.86 - i * 0.03), 0.105 + rnd(i, 61) * 0.055, 0.026, Object.assign({fase: i * 1.3}, dOpt));
    }
    // crânio e rosto de perfil
    circ(ctx, cx0, cy, 0.05, T.pele);
    fpoli(ctx, [[cx0 + 0.02, cy - 0.044], [cx0 + 0.05, cy - 0.022], [cx0 + 0.054, cy - 0.004], [cx0 + 0.07, cy + 0.016], [cx0 + 0.054, cy + 0.022], [cx0 + 0.056, cy + 0.036], [cx0 + 0.04, cy + 0.06], [cx0 - 0.005, cy + 0.056], [cx0 - 0.03, cy + 0.02]], T.pele);
    fpoli(ctx, [[cx0 - 0.005, cy + 0.056], [cx0 + 0.04, cy + 0.06], [cx0 + 0.046, cy + 0.048], [cx0 + 0.01, cy + 0.034], [cx0 - 0.03, cy + 0.02]], T.peleS);
    // cabelo: calota no alto e atrás
    ctx.beginPath();
    ctx.arc(cx0 - 0.004, cy - 0.004, 0.054, Math.PI * 0.7, Math.PI * 1.78);
    ctx.closePath();
    ctx.fillStyle = T.dread;
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * (1.12 + i * 0.16);
      dread(ctx, cx0 + Math.cos(a) * 0.046, cy + Math.sin(a) * 0.046, Math.PI * (0.98 - i * 0.05), 0.12 + rnd(i, 67) * 0.05, 0.025, Object.assign({fase: 4 + i * 1.1}, dOpt));
    }
    // óculos: oval vermelho com a lente clara, haste até a orelha
    fpoli(ctx, [[cx0 + 0.02, cy - 0.016], [cx0 - 0.03, cy - 0.01], [cx0 - 0.03, cy - 0.002], [cx0 + 0.02, cy - 0.006]], T.oculos);
    ctx.beginPath();
    ctx.ellipse(cx0 + 0.042, cy - 0.008, 0.027, 0.0145, 0.1, 0, TAU);
    ctx.fillStyle = T.oculos;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx0 + 0.045, cy - 0.008, 0.018, 0.009, 0.1, 0, TAU);
    ctx.fillStyle = T.lente;
    ctx.fill();
    ctx.restore();
    // corrente fina (antes) ou as peças (depois)
    if (o.corrente) {
      ctx.beginPath();
      ctx.moveTo(-0.005, -0.37);
      ctx.quadraticCurveTo(0.045, -0.34, 0.066, -0.285);
      ctx.lineWidth = 0.0065;
      ctx.strokeStyle = T.corrente;
      if (o.correnteElos) ctx.setLineDash([0.0001, 0.0105]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (o.joias) {
      for (let i = 0; i < 7; i++) {
        const u = i / 6;
        const px = lerp(0.0, 0.07, u) + Math.sin(u * Math.PI) * 0.01;
        const py = lerp(-0.368, -0.285, u * u * 0.4 + u * 0.6);
        circ(ctx, px, py, 0.009, o.corJoia || '#FFFFFF');
      }
      fpoli(ctx, [[0.07, -0.275], [0.078, -0.275], [0.078, -0.255], [0.09, -0.255], [0.09, -0.246], [0.078, -0.246], [0.078, -0.21], [0.07, -0.21], [0.07, -0.246], [0.058, -0.246], [0.058, -0.255], [0.07, -0.255]], o.corJoia || '#ECECEE');
    }
    ctx.restore();
    perna(1, T.calcaL, o.silhueta ? null : T.calca);
    ctx.restore();
    return {mao};
  };

  // ---------- andarilho de costas ----------
  // o: fase, andar, vento, t, cabeca (rad, ergue o olhar), punho 0..1 (mão fechando), silhueta, tons, corte (px: não desenha abaixo)
  const figCostas = (ctx, x, yChao, alt, o = {}) => {
    const T = tonsDe(o);
    const fase = o.fase || 0;
    const andar = o.andar == null ? 0 : o.andar;
    const t = o.t || 0;
    const vento = o.vento == null ? 0.3 : o.vento;
    ctx.save();
    ctx.translate(x, yChao);
    ctx.scale(alt, alt);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const gingaX = Math.sin(fase) * 0.012 * andar;
    const sobe = Math.abs(Math.cos(fase)) * 0.01 * andar;
    // pernas e calcanhares
    for (const s of [-1, 1]) {
      const lev = Math.max(0, Math.sin(fase) * s) * andar;
      const ax = s * 0.072;
      const ay = -0.04 - lev * 0.05;
      ctx.beginPath();
      ctx.moveTo(s * 0.058 + gingaX, -0.47);
      ctx.lineTo(s * 0.07 + gingaX * 0.5, -0.25 - lev * 0.02);
      ctx.lineTo(ax, ay);
      ctx.lineWidth = 0.104;
      ctx.strokeStyle = s < 0 ? T.calcaL : T.calca;
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(ax - 0.045, ay - 0.012, 0.09, 0.052 + lev * 0.012, 0.016);
      ctx.fillStyle = T.tenis;
      ctx.fill();
      fpoli(ctx, [[ax - 0.046, ay + 0.028 + lev * 0.012], [ax + 0.046, ay + 0.028 + lev * 0.012], [ax + 0.046, ay + 0.042 + lev * 0.012], [ax - 0.046, ay + 0.042 + lev * 0.012]], T.sola);
      fpoli(ctx, [[ax - 0.012, ay - 0.012], [ax + 0.012, ay - 0.012], [ax + 0.012, ay + 0.014], [ax - 0.012, ay + 0.014]], T.detalhe);
    }
    ctx.translate(gingaX, -sobe);
    const fl = ruido(t * 0.2, 5);
    const bv = vento * (0.022 + 0.02 * fl);
    // braços (atrás do corpo da jaqueta nas bordas)
    const mangas = [];
    for (const s of [-1, 1]) {
      const bal = Math.sin(fase) * s * 0.03 * andar;
      const mx = s * 0.198 + bv * 0.3;
      const my = -0.47 + bal;
      ctx.beginPath();
      ctx.moveTo(s * 0.142, -0.775);
      ctx.quadraticCurveTo(s * 0.2, -0.64, mx, my);
      ctx.lineWidth = 0.078;
      ctx.strokeStyle = s < 0 ? T.jaq : T.jaqS;
      ctx.stroke();
      mangas.push([mx, my, s]);
    }
    // corpo da jaqueta
    curva(
      ctx,
      [
        [-0.05, -0.842], [0.05, -0.842], [0.15, -0.8], [0.172, -0.62], [0.176 + bv, -0.42 + bv * 0.3],
        [0.06 + bv * 0.8, -0.395 + Math.sin(t * 0.3) * 0.006], [-0.07 + bv * 0.6, -0.4], [-0.18 + bv * 0.4, -0.415], [-0.172, -0.62], [-0.15, -0.8],
      ],
      true,
      0.3
    );
    ctx.fillStyle = T.jaq;
    ctx.fill();
    // metade em sombra e costura do meio
    curva(ctx, [[0.0, -0.845], [0.05, -0.842], [0.15, -0.8], [0.172, -0.62], [0.176 + bv, -0.42 + bv * 0.3], [0.06 + bv * 0.8, -0.395], [0.012 + bv * 0.5, -0.4], [0.004, -0.62]], true, 0.3);
    ctx.fillStyle = T.jaqS;
    ctx.fill();
    // faixa de luz nos ombros
    ctx.beginPath();
    ctx.moveTo(-0.148, -0.795);
    ctx.quadraticCurveTo(-0.08, -0.84, -0.045, -0.842);
    ctx.lineTo(0.045, -0.842);
    ctx.quadraticCurveTo(0.08, -0.84, 0.148, -0.795);
    ctx.lineWidth = 0.012;
    ctx.strokeStyle = T.jaqL;
    ctx.stroke();
    // mãos
    for (const [mx, my, s] of mangas) {
      const p = o.punho || 0;
      ctx.beginPath();
      ctx.ellipse(mx, my + 0.035 - p * 0.006, 0.026 + p * 0.004, lerp(0.04, 0.03, p), 0, 0, TAU);
      ctx.fillStyle = s < 0 ? T.pele : T.peleS;
      ctx.fill();
    }
    // cabeça: de costas é quase só dread
    ctx.save();
    ctx.translate(0, -0.845);
    ctx.rotate(0);
    const cab = o.cabeca || 0;
    ctx.translate(0, -cab * 0.02);
    fpoli(ctx, [[-0.03, 0.01], [0.03, 0.01], [0.034, -0.03], [-0.034, -0.03]], T.peleS);
    circ(ctx, 0, -0.074, 0.058, T.dread);
    // orelhas
    circ(ctx, -0.058, -0.062, 0.012, T.pele);
    circ(ctx, 0.058, -0.062, 0.012, T.peleS);
    const dOpt = {t: t * 0.28, vento: vento * 0.5, balanco: 0.14 + andar * 0.12, cor: T.dread, ponta: T.ponta, corte: 0.72, grav: 0.2};
    for (let i = 0; i < 11; i++) {
      const u = i / 10;
      const a = Math.PI * lerp(1.0, 0.0, u);
      const x0 = Math.cos(a) * 0.052;
      const y0 = -0.085 - Math.sin(a) * 0.035;
      const compr = 0.19 + rnd(i, 71) * 0.06 - Math.abs(u - 0.5) * 0.06 - cab * 0.02;
      dread(ctx, x0, y0, Math.PI / 2 - (u - 0.5) * 0.9, compr, 0.027, Object.assign({fase: i * 0.9}, dOpt));
    }
    ctx.restore();
    ctx.restore();
  };

  // ---------- busto de frente (px de referência; origem na base do pescoço, y pra baixo) ----------
  // meia largura de ombro ~ 430. o: tons, t, vento, cabeca (bool), corpoInteiro (bool: desce até os pés, ~2700),
  //    gola: 0..1 entrada, luzBorda (cor do filete de contraluz)
  const busto = (ctx, o = {}) => {
    const T = tonsDe(o);
    const t = o.t || 0;
    const vento = o.vento == null ? 0.25 : o.vento;
    const fl = ruido(t * 0.16, 9);
    const bv = vento * (26 + 20 * fl);
    const fundoY = o.corpoInteiro ? 1180 : 1700;
    const parte = o.parte || 'tudo';
    const dxAbas = o.dxAbas || 0;
    if (parte !== 'cima') {
    // pernas e tênis (só no corpo inteiro)
    if (o.corpoInteiro) {
      for (const s of [-1, 1]) {
        fpoli(ctx, [[s * 30, 1050], [s * 330, 1050], [s * 318, 2500], [s * 70, 2500]], s < 0 ? T.calcaL : T.calca);
        fpoli(ctx, [[s * 190, 1150], [s * 215, 1150], [s * 205, 2500], [s * 185, 2500]], s < 0 ? T.calca : '#0F0E0D');
        // tênis de frente
        ctx.beginPath();
        ctx.roundRect(s < 0 ? -350 : 50, 2470, 300, 170, [70, 70, 30, 30]);
        ctx.fillStyle = T.tenis;
        ctx.fill();
        fpoli(ctx, [[s * 50, 2600], [s * 350, 2600], [s * 350, 2642], [s * 50, 2642]], T.sola);
        fpoli(ctx, [[s * 150, 2470], [s * 250, 2470], [s * 235, 2560], [s * 165, 2560]], T.detalhe);
      }
    }
    // camiseta
    ctx.save();
    if (o.alfaCamiseta != null) ctx.globalAlpha *= o.alfaCamiseta;
    fpoli(ctx, [[-240, -40], [240, -40], [360, 120], [360, fundoY], [-360, fundoY], [-360, 120]], T.cam);
    // sombra do queixo e das abas da jaqueta na camiseta
    fpoli(ctx, [[-240, -40], [-150, -40], [-205, 420], [-250, fundoY], [-360, fundoY], [-360, 120]], T.camS);
    fpoli(ctx, [[240, -40], [150, -40], [215, 300], [262, fundoY], [360, fundoY], [360, 120]], T.camS);
    ctx.restore();
    ctx.save();
    ctx.translate(0, o.dyPescoco || 0);
    // pescoço
    fpoli(ctx, [[-108, -230], [108, -230], [128, -10], [60, 42], [-60, 42], [-128, -10]], T.pele);
    fpoli(ctx, [[-108, -230], [108, -230], [118, -120], [0, -72], [-118, -120]], T.peleS);
    // gola da camiseta
    ctx.beginPath();
    ctx.moveTo(-150, -34);
    ctx.quadraticCurveTo(0, 96, 150, -34);
    ctx.lineWidth = 26;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = T.camS;
    ctx.stroke();
    ctx.restore();
    }
    if (parte === 'baixo') return;
    // jaqueta: duas abas largas, abertas
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * dxAbas, 0);
      const b = s < 0 ? bv : -bv * 0.4;
      const aba = [
        [s * 128, -78], [s * 250, -52], [s * 448, 58], [s * 560, 300], [s * 600, fundoY], [s * (238 + (s < 0 ? -b : b) * 0.6), fundoY],
        [s * (226 - s * b * 0.5), 620], [s * 204, 250],
      ];
      fpoli(ctx, aba, s < 0 ? T.jaq : T.jaqS);
      // dobra em sombra junto à abertura
      fpoli(ctx, [[s * 204, 250], [s * (226 - s * b * 0.5), 620], [s * (238 + (s < 0 ? -b : b) * 0.6), fundoY], [s * 300, fundoY], [s * 286, 640], [s * 262, 300]], s < 0 ? T.jaqS : mix(T.jaqS, '#000000', 0.25));
      // gola
      fpoli(ctx, [[s * 128, -78], [s * 250, -52], [s * 318, 150], [s * 204, 250], [s * 168, 60]], s < 0 ? T.jaqL : T.jaq);
      // bolso
      fpoli(ctx, [[s * 330, 470], [s * 500, 452], [s * 506, 520], [s * 418, 560], [s * 334, 536]], s < 0 ? T.jaqL : T.jaq);
      // ombro: faixa de luz
      if (o.luzBorda) {
        ctx.beginPath();
        ctx.moveTo(s * 128, -78);
        ctx.lineTo(s * 250, -52);
        ctx.lineTo(s * 448, 58);
        ctx.lineTo(s * 560, 300);
        ctx.lineWidth = 9;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = o.luzBorda;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (o.corpoInteiro) {
      // barra da jaqueta por cima da calça
      for (const s of [-1, 1]) fpoli(ctx, [[s * 236, 1150], [s * 600, 1150], [s * 590, 1235], [s * 250, 1215]], s < 0 ? T.jaqS : mix(T.jaqS, '#000000', 0.3));
    }
    if (o.cabeca) cabecaFrente(ctx, Object.assign({}, o, {T}));
  };

  // cabeça de frente: origem na base do pescoço (a mesma do busto)
  const cabecaFrente = (ctx, o = {}) => {
    const T = o.T || tonsDe(o);
    const t = o.t || 0;
    const vento = o.vento == null ? 0.25 : o.vento;
    const k = o.escalaCabeca || 1;
    ctx.save();
    ctx.translate(0, -150);
    ctx.scale(k, k);
    ctx.translate(0, 150);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const dOpt = {t: t * 0.26, vento: vento * 0.9, balanco: 0.2, cor: T.dread, ponta: T.ponta};
    // dreads de trás
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      if (Math.abs(u - 0.5) < 0.3) continue;
      dread(ctx, lerp(-170, 170, u), -520 + Math.abs(u - 0.5) * 120, Math.PI / 2 - (u - 0.5) * 0.9, 470 + rnd(i, 81) * 150, o.grossoDread || 46, Object.assign({fase: i * 1.1}, dOpt));
    }
    // rosto
    poli(ctx, [[-150, -560], [150, -560], [162, -400], [128, -262], [56, -186], [-56, -186], [-128, -262], [-162, -400]]);
    ctx.fillStyle = T.pele;
    ctx.fill();
    fpoli(ctx, [[20, -560], [150, -560], [162, -400], [128, -262], [56, -186], [10, -186], [44, -300], [8, -330], [30, -400]], T.peleS);
    // boca e cavanhaque
    fpoli(ctx, [[-48, -262], [0, -272], [48, -262], [0, -250]], mix(T.peleS, '#000000', 0.45));
    fpoli(ctx, [[-30, -222], [30, -222], [18, -186], [-18, -186]], T.dread);
    // cabelo no alto
    curva(ctx, [[-168, -470], [-150, -620], [0, -690], [150, -620], [168, -470], [100, -545], [0, -560], [-100, -545]], true, 0.4);
    ctx.fillStyle = T.dread;
    ctx.fill();
    if (o.luzBorda) {
      // contraluz no alto do cabelo
      ctx.beginPath();
      ctx.moveTo(-156, -606);
      ctx.quadraticCurveTo(0, -724, 156, -606);
      ctx.lineWidth = 8;
      ctx.strokeStyle = o.luzBorda;
      ctx.stroke();
    }
    // dreads da frente, caindo dos lados
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? -1 : 1;
      const j = i % 4;
      dread(ctx, s * (118 + j * 22), -610 + j * 30, Math.PI / 2 - s * (0.5 + j * 0.22), 420 + rnd(i, 83) * 170, o.grossoDread || 46, Object.assign({fase: 3 + i * 0.8, corte: 0.72}, dOpt));
    }
    // óculos ovais vermelhos
    oculos(ctx, 0, -432, 1, {T, reflexo: o.reflexo, corLente: o.corLente});
    ctx.restore();
  };

  // óculos de frente: dois ovais, armação vermelha, lente espelhada. escala 1 = lente de 74 x 43
  // reflexo(ctx, lado, rx, ry): desenha dentro da lente já recortada
  const oculos = (ctx, x, y, k, o = {}) => {
    const T = o.T || TONS;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    // ponte e hastes
    fpoli(ctx, [[-22, -10], [22, -10], [22, 6], [-22, 6]], T.oculos);
    fpoli(ctx, [[-176, -14], [-150, -18], [-150, 2], [-176, 6]], T.oculos);
    fpoli(ctx, [[176, -14], [150, -18], [150, 2], [176, 6]], T.oculos);
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 88, 0);
      ctx.rotate(s * -0.09);
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 48, 0, 0, TAU);
      ctx.fillStyle = T.oculos;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 1, 63, 34, 0, 0, TAU);
      ctx.fillStyle = o.corLente || gLin(ctx, 0, -34, 0, 34, [[0, '#F6F4EE'], [0.55, '#D9D2C2'], [1, '#9F9484']]);
      ctx.fill();
      if (o.reflexo) {
        ctx.save();
        ctx.clip();
        o.reflexo(ctx, s, 63, 34);
        ctx.restore();
      }
      // brilho da armação
      ctx.beginPath();
      ctx.ellipse(0, 0, 72, 41, 0, Math.PI * 1.1, Math.PI * 1.6);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,190,170,0.75)';
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  // ---------- sombra rival: silhueta alta de capuz, sem rosto, com o brilho de um olho ----------
  // origem no chão. o: dir (pra onde olha), inclina (rad), t, vento, olho 0..1, semente, cor, some 0..1 (desmancha)
  const sombraFig = (ctx, x, yChao, alt, o = {}) => {
    const dir = o.dir || -1;
    const t = o.t || 0;
    const sem = o.semente || 0;
    const some = o.some || 0;
    const cor = o.cor || C.preto;
    const vento = o.vento == null ? 0.4 : o.vento;
    ctx.save();
    ctx.translate(x, yChao);
    ctx.scale(alt, alt);
    // desmanchando: o corpo achata pro chão e afina
    const achata = 1 - some * some * 0.94;
    ctx.scale(1 + some * 0.5, achata);
    ctx.transform(1, 0, Math.tan(-(o.inclina || 0)) * dir, 1, 0, 0);
    const larg = o.largura || 1;
    const pts = [];
    const bico = 0.045 * dir;
    pts.push([bico, -1.0]);
    pts.push([0.075 * larg + bico * 0.3, -0.905]);
    pts.push([0.11 * larg, -0.8]);
    pts.push([0.135 * larg, -0.45]);
    // barra esfarrapada
    const nb = 9;
    const base = [];
    for (let i = 0; i <= nb; i++) {
      const u = i / nb;
      const bx = lerp(0.185 * larg, -0.185 * larg, u) - dir * 0.03 * Math.sin(u * 3.1) + vento * 0.02 * Math.sin(t * 0.25 + u * 5 + sem);
      const by = i % 2 === 0 ? -0.0 : -0.035 - rnd(i, 90 + sem) * 0.05 - 0.012 * Math.sin(t * 0.3 + i + sem);
      base.push([bx, by]);
    }
    pts.push(...base);
    pts.push([-0.135 * larg, -0.45]);
    pts.push([-0.11 * larg, -0.8]);
    pts.push([-0.075 * larg + bico * 0.3, -0.905]);
    poli(ctx, pts);
    ctx.fillStyle = cor;
    ctx.globalAlpha *= 1 - clamp((some - 0.55) / 0.45);
    ctx.fill();
    // olho: um risco de luz no capuz
    const ol = (o.olho == null ? 1 : o.olho) * (1 - clamp(some * 2.5));
    if (ol > 0.02 && !o.semOlho) {
      const ex = 0.03 * dir;
      const ey = -0.885;
      ctx.fillStyle = gRad(ctx, ex, ey, 0, ex, ey, 0.06, [[0, rgba(C.vermelhoLuz, 0.75 * ol)], [1, rgba(C.vermelhoLuz, 0)]]);
      ctx.fillRect(ex - 0.07, ey - 0.07, 0.14, 0.14);
      ctx.beginPath();
      ctx.ellipse(ex, ey, 0.02, 0.0055 * ol, -0.15 * dir, 0, TAU);
      ctx.fillStyle = '#FFF4EA';
      ctx.fill();
    }
    ctx.restore();
    // fumaça: bolhas que sobem e somem
    if (some > 0.01) {
      ctx.save();
      const n = 16;
      for (let i = 0; i < n; i++) {
        const nasce = rnd(i, 120 + sem) * 0.45;
        const v = clamp((some - nasce) / 0.55);
        if (v <= 0) continue;
        const bx = x + (rnd(i, 121 + sem) - 0.5) * alt * 0.34 + v * alt * (0.12 + rnd(i, 122 + sem) * 0.3) * vento;
        const by = yChao - rnd(i, 123 + sem) * alt * 0.95 * (1 - v * 0.2) - v * alt * 0.2 * rnd(i, 124 + sem);
        const r = alt * (0.05 + rnd(i, 125 + sem) * 0.07) * Math.sin(Math.min(1, v * 1.15) * Math.PI) * 1.1;
        circ(ctx, bx, by, r, cor);
      }
      ctx.restore();
    }
  };

  // ---------- mão em silhueta, fazendo pinça (o joalheiro) ----------
  // origem na ponta da pinça. A mão sobe pra (-1,-1)*escala; espelha = -1 inverte em x.
  // o: cor, abre 0..1 (pinça abrindo), corLuz
  const maoPinca = (ctx, x, y, k, ang, o = {}) => {
    const cor = o.cor || C.preto;
    const abre = o.abre || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.espelha || 1) * k, k);
    ctx.rotate(ang || 0);
    // antebraço e punho da manga
    membro(ctx, [[-900, -720], [-560, -440], [-345, -265]], [250, 210, 165], cor);
    // dorso da mão
    curva(ctx, [[-400, -330], [-300, -372], [-205, -330], [-150, -235], [-165, -120], [-240, -66], [-335, -92], [-410, -200]], true, 0.45);
    ctx.fillStyle = cor;
    ctx.fill();
    // três dedos dobrados pra dentro da palma: só os nós aparecem no contorno
    for (const [bx, by, br] of [[-318, -352, 50], [-248, -338, 54], [-186, -296, 56]]) {
      ctx.beginPath();
      ctx.ellipse(bx, by, br * 1.15, br * 0.82, -0.62, 0, TAU);
      ctx.fill();
    }
    membro(ctx, [[-170, -300], [-128, -262], [-150, -214]], [60, 54, 44], cor, true);
    // indicador e polegar fechando a pinça
    membro(ctx, [[-205, -222], [-122, -182 - abre * 14], [-56, -104 - abre * 30], [-6, -22 - abre * 50]], [78, 68, 56, 44], cor, true);
    membro(ctx, [[-282, -100], [-176, -42 + abre * 10], [-88, 0 + abre * 26], [-8, 12 + abre * 46]], [100, 82, 64, 46], cor, true);
    if (o.corLuz) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = o.corLuz;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-820, -760);
      ctx.lineTo(-420, -415);
      ctx.quadraticCurveTo(-330, -372, -290, -372);
      ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- punho dele (pele), com antebraço. origem no meio do pulso; o braço desce pra +y ----------
  // fecha 0..1 (dedos fechando). escala 1 = pulso de 190 de largura.
  const punho = (ctx, x, y, k, ang, o = {}) => {
    const T = tonsDe(o);
    const fecha = o.fecha == null ? 1 : o.fecha;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang || 0);
    ctx.scale(k, k);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // manga e antebraço
    const compr = o.compr || 900;
    fpoli(ctx, [[-98, -10], [98, -10], [128, compr], [-128, compr]], T.pele);
    fpoli(ctx, [[20, -10], [98, -10], [128, compr], [56, compr]], T.peleS);
    if (o.manga) {
      fpoli(ctx, [[-150, o.manga], [150, o.manga - 30], [190, compr], [-190, compr]], T.jaq);
      fpoli(ctx, [[40, o.manga - 10], [150, o.manga - 30], [190, compr], [80, compr]], T.jaqS);
      fpoli(ctx, [[-156, o.manga - 6], [156, o.manga - 36], [160, o.manga + 34], [-160, o.manga + 64]], T.jaqL);
    }
    // mão fechada vista de frente: quatro dedos dobrados em cima, polegar atravessado
    const ab = 1 - fecha; // quanto os dedos ainda estão abertos
    for (let i = 0; i < 4; i++) {
      const x0 = -118 + i * 60;
      const alto = -268 - ab * (150 + (i === 1 || i === 2 ? 30 : 0)) + (i === 0 ? 8 : i === 3 ? 14 : 0);
      fpoli(ctx, [[x0, -120], [x0 + 2, alto + 14], [x0 + 12, alto], [x0 + 48, alto], [x0 + 58, alto + 14], [x0 + 60, -120]], i >= 2 ? T.peleS : T.pele);
      // vão entre os dedos
      if (i > 0) fpoli(ctx, [[x0 - 3, -130], [x0 - 1.5, alto + 20], [x0 + 1.5, alto + 20], [x0 + 3, -130]], O.mixHex(T.peleS, '#000000', 0.35));
      // nó do dedo, um tom acima
      fpoli(ctx, [[x0 + 8, alto + 8], [x0 + 52, alto + 8], [x0 + 54, alto + 52], [x0 + 6, alto + 52]], i >= 2 ? T.pele : T.peleL);
    }
    // palma
    fpoli(ctx, [[-118, -128], [122, -128], [118, -40], [98, 0], [-98, 0], [-122, -50]], T.pele);
    fpoli(ctx, [[30, -128], [122, -128], [118, -40], [98, 0], [24, 0]], T.peleS);
    // polegar: atravessa os dedos quando fecha
    {
      const px = lerp(-190, 44, fecha);
      const py = lerp(-250, -150, fecha);
      fpoli(ctx, [[-126, -60], [-132, -150 + ab * 20], [px - 30, py - 34], [px, py - 30], [px + 16, py], [px - 6, py + 30], [-70, -92 + ab * 10], [-96, -30]], T.peleL);
      fpoli(ctx, [[px - 30, py - 34], [px, py - 30], [px + 16, py], [px - 6, py + 30], [px - 44, py + 22]], O.mixHex(T.peleL, '#FFFFFF', 0.12));
    }
    ctx.restore();
  };

  // queixo e dreads no alto do quadro, pros planos de peito (mesma origem do busto)
  const queixo = (ctx, f, o = {}) => {
    const T = tonsDe(o);
    fpoli(ctx, [[-128, -420], [128, -420], [128, -262], [56, -186], [-56, -186], [-128, -262]], T.pele);
    fpoli(ctx, [[10, -420], [128, -420], [128, -262], [56, -186], [10, -186], [36, -262]], T.peleS);
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? -1 : 1;
      const j = i % 4;
      dread(ctx, s * (146 + j * 30), -420, Math.PI / 2 - s * (0.1 + j * 0.09), 390 + j * 60 + ((i * 37) % 70), 40, {t: f * 0.26, fase: i, balanco: 0.12, vento: 0.2, cor: T.dread, ponta: T.ponta, corte: 0.74});
    }
  };

  O.fig = {TONS, tonsContraluz, membro, queixo, figLado, figCostas, busto, cabecaFrente, oculos, sombraFig, maoPinca, punho, dread};
})(typeof window !== 'undefined' ? window : globalThis);
