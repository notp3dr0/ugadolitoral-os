// Plano 2 (0:04 a 0:08) · três tiras empilhadas que deslizam pra dentro, uma por tempo forte:
// tênis na poeira (embaixo), dreads balançando de perfil (em cima), óculos refletindo o sol (meio).
// A corrente cinza fina brilha uma vez. Os passos caem a cada 24 quadros (0,8 s), no bumbo.
(function (g) {
  'use strict';
  const O = g.OFIO;
  const {C, W, H, E, prog, janela, clamp, lerp, rgba, gLin, gRad, rnd, estrela, circ, fpoli} = O;
  const INI = 120;
  const ALT_T = 626;
  const TIRAS = [
    {y: 1294, t0: 0, dir: 1, nome: 'tenis'},
    {y: 0, t0: 24, dir: -1, nome: 'perfil'},
    {y: 647, t0: 48, dir: 1, nome: 'oculos'},
  ];
  const faseDe = (l) => (l / 24) * Math.PI;

  const tenis = (ctx, l, f) => {
    const K = O.cen;
    const v = 24; // o chão corre pra trás
    ctx.fillStyle = gLin(ctx, 0, 0, 0, 330, [[0, '#E9DDC3'], [1, '#DFCFAE']]);
    ctx.fillRect(0, 0, W, 332);
    const cid = K.fazerCidade(51, -200, 5200, {lMin: 90, lMax: 260, aMin: 50, aMax: 230, pJan: 0, curva: 1.5});
    K.desenharCidade(ctx, cid, 332, '#CFC0A2', {dx: -((l * v * 0.12) % 2600), corVar: '#C6B698', extra: 1.6, fundo: 4});
    ctx.fillStyle = gLin(ctx, 0, 330, 0, ALT_T, [[0, '#DCCBA8'], [0.5, C.areia2], [1, '#B99C70']]);
    ctx.fillRect(0, 330, W, ALT_T - 330);
    // marcas no chão correndo
    for (let i = 0; i < 26; i++) {
      const u = rnd(i, 601);
      const y = lerp(350, ALT_T + 10, u * u);
      const prof = lerp(0.35, 1.25, u * u);
      let x = (rnd(i, 602) * 2400 - l * v * prof) % 2400;
      if (x < 0) x += 2400;
      x -= 600;
      ctx.beginPath();
      ctx.ellipse(x, y, lerp(20, 90, rnd(i, 603)) * prof, lerp(2, 7, rnd(i, 604)) * prof, 0, 0, Math.PI * 2);
      ctx.fillStyle = rnd(i, 605) < 0.5 ? rgba(C.queimado, 0.22) : rgba('#FFF6E2', 0.4);
      ctx.fill();
    }
    const alt = 2500;
    const cx = 470;
    const chaoY = 548;
    const fase = faseDe(l);
    // sombra dos pés
    for (let i = 0; i < 2; i++) {
      const ph = (((fase + i * Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const apoio = ph < Math.PI;
      const px = apoio ? Math.cos(ph) * 0.115 : -Math.cos(ph - Math.PI) * 0.115;
      const sobe = apoio ? 0 : Math.sin(ph - Math.PI);
      ctx.beginPath();
      ctx.ellipse(cx + px * alt + 70, chaoY + 16, 250 - sobe * 70, 22 - sobe * 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba(C.terra, 0.38 - sobe * 0.2);
      ctx.fill();
    }
    O.fig.figLado(ctx, cx, chaoY, alt, {fase, andar: 1, t: f, vento: 0.6});
    // poeira que levanta a cada passo
    for (let k = 0; k < 6; k++) {
      const dt = l - k * 24;
      if (dt < 0 || dt > 20) continue;
      const u = dt / 20;
      for (let j = 0; j < 9; j++) {
        const a = Math.PI * (1.05 + rnd(j, 610 + k) * 0.9);
        const d = (40 + rnd(j, 611 + k) * 190) * E.outCubic(u);
        const bx = cx + 0.115 * alt + 180 - dt * v * 0.8 + Math.cos(a) * d * 1.5;
        const by = chaoY + 26 + Math.sin(a) * d * 0.55;
        circ(ctx, bx, by, (16 + rnd(j, 612 + k) * 36) * (0.4 + u) * (1 - u * 0.4), rgba('#F3E7CD', 0.75 * (1 - u)));
      }
    }
    K.vento(ctx, f, 300, ALT_T, {n: 9, vel: 40, alfa: 0.4, sal: 3});
  };

  // a cabeça de perfil, grande: desenho próprio deste plano (rosto em planos chapados, dreads pesando pra trás)
  const cabecaPerfil = (ctx, l, f) => {
    const F = O.fig;
    const T = F.TONS;
    const sobe = Math.abs(Math.cos(faseDe(l))) * 13;
    ctx.save();
    ctx.translate(-30, sobe - 4);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const dOpt = {t: f * 0.3, vento: -0.45, balanco: 0.26, cor: T.dread, ponta: T.ponta, corte: 0.76, grav: 0.2};
    // dreads de trás, pesando sobre a nuca
    for (let i = 0; i < 5; i++) F.dread(ctx, 356 - i * 16, 190 + i * 30, Math.PI * 0.74, 400 + rnd(i, 640) * 130, 58, Object.assign({fase: i * 1.1}, dOpt));
    // pescoço
    fpoli(ctx, [[350, 370], [528, 440], [512, 660], [322, 660]], T.peleS);
    fpoli(ctx, [[350, 370], [432, 404], [420, 660], [322, 660]], O.mixHex(T.peleS, '#000000', 0.22));
    // camiseta e gola da jaqueta
    fpoli(ctx, [[440, 566], [540, 548], [640, 660], [400, 660]], T.cam);
    fpoli(ctx, [[232, 560], [372, 508], [470, 580], [520, 660], [180, 660]], T.jaq);
    fpoli(ctx, [[372, 508], [470, 580], [520, 660], [468, 660], [404, 586], [330, 540]], T.jaqL);
    // rosto
    fpoli(ctx, [[500, 92], [548, 150], [566, 212], [556, 236], [620, 302], [580, 322], [594, 346], [575, 360], [588, 381], [568, 398], [578, 436], [540, 468], [448, 432], [390, 350], [378, 220], [430, 116]], T.pele);
    fpoli(ctx, [[448, 432], [540, 468], [578, 436], [568, 398], [524, 410], [452, 362], [390, 350]], T.peleS);
    fpoli(ctx, [[474, 262], [546, 270], [528, 334], [464, 322]], T.peleL);
    fpoli(ctx, [[556, 236], [620, 302], [580, 322], [566, 296]], T.peleL);
    fpoli(ctx, [[594, 346], [575, 360], [588, 381], [560, 373], [554, 352]], O.mixHex(T.peleS, '#000000', 0.35));
    fpoli(ctx, [[552, 414], [578, 436], [558, 464], [534, 450]], T.dread);
    // orelha
    ctx.beginPath();
    ctx.ellipse(414, 300, 22, 34, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = T.peleS;
    ctx.fill();
    // cabelo: calota e as mechas que saem do alto e caem pra trás
    O.fcurva(ctx, [[384, 332], [338, 224], [386, 108], [478, 66], [546, 108], [500, 132], [452, 170], [440, 250], [420, 304]], T.dread, 0.4);
    for (let i = 0; i < 6; i++) F.dread(ctx, 396 + i * 24, 100 + Math.abs(i - 2) * 12, Math.PI * (0.94 - i * 0.035), 360 + rnd(i, 642) * 150, 60, Object.assign({fase: 3 + i * 0.9}, dOpt));
    // óculos: haste até a orelha e a lente oval, espelhada
    fpoli(ctx, [[416, 224], [540, 214], [540, 233], [416, 240]], T.oculos);
    ctx.save();
    ctx.translate(568, 234);
    ctx.rotate(0.07);
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 33, 0, 0, Math.PI * 2);
    ctx.fillStyle = T.oculos;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2, 1, 45, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = gLin(ctx, 0, -22, 0, 22, [[0, '#F6F4EE'], [0.6, '#DDD0B4'], [1, '#A7977A']]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    O.simbolo.eclipse(ctx, 18 - (l % 120) * 0.2, -3, 11, {});
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    fpoli(ctx, [[-45, -22], [-18, -22], [-34, 22], [-45, 22]], 'rgba(255,255,255,0.4)');
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(0, 0, 53, 27, 0, Math.PI * 1.1, Math.PI * 1.6);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,190,170,0.8)';
    ctx.stroke();
    ctx.restore();
    // a corrente cinza fina, de elos, da nuca ao peito
    {
      const pts = [];
      for (let i = 0; i <= 30; i++) {
        const u = i / 30;
        const a = 1 - u;
        pts.push([a * a * 352 + 2 * a * u * 420 + u * u * 560, a * a * 462 + 2 * a * u * 600 + u * u * 618]);
      }
      const tr = O.trilho(pts);
      O.pecas.corrente(ctx, tr, 0, tr.total, 15, {cor: '#8F9296', corLuz: '#D5D8DB', grosso: 3});
    }
    ctx.restore();
  };

  const perfil = (ctx, l, f) => {
    const K = O.cen;
    ctx.fillStyle = gLin(ctx, 0, 0, 0, ALT_T, [[0, C.ceuAlto], [1, '#E4D5B6']]);
    ctx.fillRect(0, 0, W, ALT_T);
    // o sol passa devagar por trás da cabeça
    K.sol(ctx, 860 - l * 0.9, 330, 420, {halo: 0.8});
    const c1 = K.fazerCidade(53, -200, 5200, {lMin: 120, lMax: 320, aMin: 60, aMax: 300, pJan: 0, curva: 1.6});
    K.desenharCidade(ctx, c1, ALT_T + 4, '#D2C4A8', {dx: -((l * 3.2) % 2400), corVar: '#C9BA9C', extra: 2.2, fundo: 10});
    const c2 = K.fazerCidade(57, -300, 7200, {lMin: 260, lMax: 620, aMin: 40, aMax: 380, pJan: 0, curva: 2.4, vao: 400});
    K.desenharCidade(ctx, c2, ALT_T + 4, '#A99A80', {dx: -((l * 8.5) % 3600), corVar: '#9D8D73', extra: 3.4, corCaixa: C.vermelho, fundo: 10});
    cabecaPerfil(ctx, l, f);
    // a corrente cinza brilha uma vez
    const b = janela(l, 86, 90, 93, 104, E.outCubic);
    if (b > 0) {
      estrela(ctx, 452, 566, 150 * b, 0.25 + l * 0.02, '#FFFFFF', 0.05);
      estrela(ctx, 452, 566, 70 * b, 0.25 + Math.PI / 4, 'rgba(255,255,255,0.85)', 0.06);
    }
    K.vento(ctx, f, 60, ALT_T, {n: 7, vel: 36, alfa: 0.35, sal: 12});
  };

  const oculos = (ctx, l, f) => {
    const F = O.fig;
    const T = F.TONS;
    const sobe = Math.abs(Math.cos(faseDe(l))) * 14;
    const zoom = 1 + l * 0.0008;
    ctx.save();
    ctx.translate(540, 313);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -313 + sobe);
    // rosto: planos chapados de pele
    ctx.fillStyle = T.pele;
    ctx.fillRect(-100, -100, W + 200, ALT_T + 200);
    fpoli(ctx, [[560, -100], [1180, -100], [1180, 760], [640, 760], [700, 470], [585, 440], [640, 250]], T.peleS);
    fpoli(ctx, [[-100, -100], [1180, -100], [1180, 120], [700, 196], [540, 176], [380, 196], [-100, 120]], O.mixHex(T.peleS, '#000000', 0.18)); // sombra da testa
    fpoli(ctx, [[470, 380], [540, 350], [590, 392], [640, 560], [540, 610], [450, 560]], T.peleL); // dorso do nariz
    fpoli(ctx, [[540, 350], [590, 392], [640, 560], [540, 610]], O.mixHex(T.pele, T.peleS, 0.5));
    // dreads caindo dos lados
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? -1 : 1;
      const j = i % 4;
      F.dread(ctx, 540 + s * (430 + j * 62), -120, Math.PI / 2 - s * 0.04 * j, 560 + rnd(i, 620) * 260, 74, {
        t: f * 0.3, fase: i * 1.2, balanco: 0.1, vento: 0.15, cor: T.dread, ponta: T.ponta, corte: 0.74, grav: 0.2,
      });
    }
    // óculos, com o sol e a cidade passando nas lentes
    F.oculos(ctx, 540, 313, 2.72, {
      T,
      reflexo: (c, s, rx, ry) => {
        c.fillStyle = gLin(c, 0, -ry, 0, ry, [[0, '#F4EFE2'], [0.6, '#E4D4B2'], [1, '#B79F78']]);
        c.fillRect(-rx, -ry, rx * 2, ry * 2);
        const sx = 46 - l * 0.62 + s * 6;
        O.simbolo.eclipse(c, sx, -3, 19, {});
        c.fillStyle = rgba('#FFFFFF', 0.5);
        c.beginPath();
        c.arc(sx, -3, 26, 0, Math.PI * 2);
        c.fill();
        O.simbolo.eclipse(c, sx, -3, 19, {});
        // skyline espelhado
        c.fillStyle = '#8A7A62';
        for (let k = 0; k < 14; k++) {
          const bw = 7 + rnd(k, 630) * 12;
          let bx = ((k * 17 - l * 1.25 + s * 30) % 200);
          if (bx < 0) bx += 200;
          bx -= 100;
          const bh = 6 + rnd(k, 631) * 20;
          c.fillRect(bx, 13 - bh, bw, bh + 30);
        }
        c.fillStyle = '#C9B48C';
        c.fillRect(-rx, 14, rx * 2, ry);
        // faixa de brilho da lente
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.beginPath();
        c.moveTo(-rx, -ry);
        c.lineTo(-rx * 0.2, -ry);
        c.lineTo(-rx * 0.75, ry);
        c.lineTo(-rx, ry);
        c.fill();
      },
    });
    ctx.restore();
  };

  const DESENHO = {tenis, perfil, oculos};
  const tiras = (ctx, f) => {
    const l = f - INI;
    for (let i = 0; i < 3; i++) {
      const t = TIRAS[i];
      const pin = prog(l, t.t0, t.t0 + 13, E.outExpo);
      if (pin <= 0) continue;
      const pout = prog(l, 113 + i * 3, 126 + i * 3, E.inCubic);
      if (pout >= 1) continue;
      const dx = t.dir * (-(1 - pin) * W + pout * W);
      ctx.save();
      ctx.translate(dx, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(-20, t.y - 21, W + 40, ALT_T + 42);
      ctx.beginPath();
      ctx.rect(0, t.y, W, ALT_T);
      ctx.clip();
      ctx.translate(0, t.y);
      DESENHO[t.nome](ctx, l, f);
      ctx.restore();
    }
  };

  O.P = O.P || {};
  O.P.p2tiras = tiras;
  O.P.p2 = (ctx, f) => {
    if (f < 184) O.P.p1(ctx, f);
    else if (f >= 230) O.P.p3base(ctx, f);
    else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
    }
    tiras(ctx, f);
  };
})(typeof window !== 'undefined' ? window : globalThis);
