// Blocos 14–21 (quadros 063–090).
window.CENAS = window.CENAS || {};
(function () {
  const { key, E, mola, piscada, piscadas, respira, rnd, ate, clamp, lerp, tremor } = M;
  const { W, H, radial, linear, rr, cam, vinheta, texto } = K;
  const pao = PAO.pao;
  const apagado = () => 0;

  // ── BLOCO 14 · Cansaço (063–066): um plano médio fixo ───────────────────
  // Ordem: asa alcança óculos → olhos fecham → óculos saem → olhar cansado → corpo desce.
  CENAS.q063 = function (ctx, lt, dur) {
    const X = W * 0.5, Y = H * 1.06, S = 720, MESA = H * 0.79;
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1.04], [dur, 1.0]]) });
    AMB.branco(ctx, lt, { janela: true, chao: 0.79 });
    AMB.monitorFrente(ctx, W * 0.8, H * 0.74, 380, { vira: 0.6, tela: "#EAF2FB" });
    // tempos
    const alcanca = key(lt, [[0.9, 0], [1.4, 1, E.io]]);
    const fecha = key(lt, [[1.35, 0], [1.6, 1, E.in2]]);
    const tira = key(lt, [[1.7, 0], [2.6, 1, E.io]]);
    const reabre = key(lt, [[2.7, 1], [3.0, 0.55, E.out]]);
    const desce = key(lt, [[3.3, 0], [4.4, 1, E.io]]);
    // posição dos óculos: no rosto → arco → mesa
    const rosto = { x: X, y: Y + (-0.8 + desce * 0.44) * S };
    const mesa = { x: W * 0.31, y: MESA + 8 };
    const ox = lerp(rosto.x, mesa.x, E.io(tira));
    const oy = lerp(rosto.y, mesa.y, tira) - Math.sin(Math.PI * tira) * 120;
    const naMao = tira > 0 && tira < 1;
    // a asa esquerda (lado da mesa): repouso → haste dos óculos → acompanha até a mesa → volta
    let asaE = null;
    if (alcanca > 0 && tira < 1) {
      const alvoRosto = { x: lerp(-0.6, -0.4, alcanca), y: lerp(-0.35, -0.8, alcanca) };
      asaE = naMao ? { x: Math.max(-1.2, (ox - X) / S - 0.12), y: (oy - Y) / S - desce * 0.44 } : alvoRosto;
    }
    const pal = tira >= 1 ? reabre : Math.max(key(lt, [[0, 0.35], [0.9, 0.5]]), fecha);
    pao(ctx, X, Y, S, {
      oculos: tira > 0 ? 0 : 1,
      palpE: pal, palpD: pal, incl: 8, olharY: 0.35, olharX: -0.1,
      y: desce * 0.44, achata: respira(lt, 0.01, 2.4) * (1 - desce * 0.03),
      asaE, asaFrente: naMao, sombra: 0,
    }, lt);
    if (tira > 0) {
      const esc = lerp(1, 0.5, tira);
      ctx.save(); ctx.translate(ox, oy); ctx.scale(S * esc, S * esc * lerp(1, 0.55, tira));
      PAO.oculos(ctx, 0, 0, 1, lerp(0, -0.2, tira), 0, 0, true);
      ctx.restore();
      if (tira >= 1) {
        ctx.beginPath(); ctx.ellipse(mesa.x, mesa.y + 70, 190, 18, 0, 0, 7); ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fill();
      }
    }
    // mesa por cima do corpo (ele afunda atrás dela)
    ctx.fillStyle = linear(ctx, 0, MESA, 0, H, [[0, "#FFFFFF"], [0.1, "#EEF0F3"], [1, "#D2D7DE"]]);
    ctx.fillRect(-W, MESA + 40, W * 3, H);
    ctx.fillStyle = "#F7F8FA"; ctx.fillRect(-W, MESA, W * 3, 44);
    AMB.teclado(ctx, W * 0.67, MESA + 20, 300);
    AMB.caneca(ctx, W * 0.13, MESA + 36, 160, { cor: "#F4F4F4", faixa: "#B3261A", vapor: 0.5, t: lt });
    if (tira >= 1) {
      ctx.save(); ctx.translate(mesa.x, mesa.y + 40); ctx.scale(S * 0.5, S * 0.28);
      PAO.oculos(ctx, 0, 0, 1, -0.2, 0, 0, true);
      ctx.restore();
    }
    ctx.restore();
  };

  // ── BLOCO 15 · A última ideia: aparecer (067–072) ───────────────────────
  CENAS.q067 = function (ctx, lt, dur) {
    const c = { x: W * 0.6, y: H * 0.5 };
    const desl = key(lt, [[0.1, 0], [0.75, 1, E.io]]); // apertada pesada e lenta
    const aperto = key(lt, [[0.35, 0], [0.75, 1, E.io]]);
    const brilho = 0.6 + aperto * 0.5;
    radial(ctx, W * 0.6, H * 0.5, W * 0.7, [[0, "#FFFFFF"], [1, "#CBD6E2"]]);
    K.botaoVermelho(ctx, c.x, c.y, 300, { aperto, brilho, inclina: 0.75 });
    pao(ctx, W * 0.04, H * 1.3, 1250, { vira: 0.75, olharX: 1, olharY: 0.2, palpE: 0.35, palpD: 0.35, incl: -10, sombra: 0 }, lt);
    ctx.save();
    ctx.translate(lerp(W * 0.3, c.x - 20, desl), lerp(H * 0.95, c.y + aperto * 20, desl));
    ctx.rotate(lerp(-0.6, -0.35, desl));
    ctx.beginPath(); ctx.ellipse(-200, 0, 260, 90, 0, 0, 7);
    ctx.fillStyle = linear(ctx, -400, -80, 0, 80, [[0, "#3B3D37"], [1, "#1B1C19"]]); ctx.fill();
    ctx.restore();
    vinheta(ctx, 0.25);
  };
  // 068–069: a fantasia (objeto separado) se abre
  function fantasiaCasca(ctx, x, y, s, abre, t) {
    // metade de baixo
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.62, 0, 0, Math.PI);
    ctx.fillStyle = linear(ctx, -s, 0, s, 0, [[0, "#2E302B"], [0.5, "#3B3D37"], [1, "#1A1B18"]]); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.16, 0, 0, 7); ctx.fillStyle = "#8E1A0E"; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.92, s * 0.12, 0, 0, 7); ctx.fillStyle = "#C2301E"; ctx.fill();
    // metade de cima abre na dobradiça de trás
    ctx.save(); ctx.translate(s * 0.9, -s * 0.02); ctx.rotate(-abre * 1.25); ctx.translate(-s * 0.9, 0);
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.72, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = linear(ctx, -s, -s, s, 0, [[0, "#45473F"], [0.6, "#2A2B27"], [1, "#151612"]]); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * (0.16 * (1 - abre) + 0.05), 0, 0, 7); ctx.fillStyle = "#A62317"; ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  CENAS.q068 = function (ctx, lt, dur) {
    const abre = key(lt, [[0.1, 0], [dur - 0.2, 1, E.io]]);
    radial(ctx, W * 0.5, H * 0.5, W * 0.7, [[0, "#EEF3F8"], [1, "#C4CFDB"]]);
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1.6], [dur, 1.15]]), r: key(lt, [[0, -0.12], [dur, 0.05]]), ox: W * 0.55, oy: H * 0.5 });
    fantasiaCasca(ctx, W * 0.58, H * 0.62, 520, abre, lt);
    // pezinho vermelho da fantasia
    ctx.save(); ctx.translate(W * 0.33, H * 0.72); ctx.rotate(0.3 + Math.sin(lt * 3) * 0.05);
    ctx.beginPath(); ctx.ellipse(0, 40, 50, 95, 0, 0, 7); ctx.fillStyle = linear(ctx, -50, 0, 50, 0, [[0, "#C93A25"], [1, "#7A150B"]]); ctx.fill();
    ctx.restore();
    ctx.restore();
    vinheta(ctx, 0.3);
  };
  // 070–072: o mascote (fantasia vestida): retrato → corpo inteiro
  CENAS.q070 = function (ctx, lt, dur) {
    radial(ctx, W / 2, H * 0.45, W * 0.7, [[0, "#FBF3EA"], [1, "#E1CCB8"]]);
    ctx.fillStyle = "#EFE2D4"; ctx.fillRect(0, H * 0.78, W, H);
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1.9], [0.8, 1.9], [1.5, 1.0, E.io]]), oy: H * 0.45 });
    const p = piscadas(lt, [0.5, 1.8]);
    const pula = key(lt, [[1.6, 0], [1.75, -0.08, E.out], [1.92, 0, E.in]]);
    pao(ctx, W / 2, H * 0.82, 520, { pelucia: 1, palpE: p, palpD: p, y: pula, achata: pula < 0 ? 1.04 : 1, asaEang: key(lt, [[1.6, 0], [1.8, 30]]), asaDang: key(lt, [[1.6, 0], [1.8, 30]]), olharY: -0.1 }, lt);
    ctx.restore();
  };

  // ── BLOCO 16 · O conteúdo encontra pessoas (073–077) ────────────────────
  function coracoes(ctx, t, n, x0, y0, larg, alt, ritmo = 1) {
    for (let i = 0; i < n; i++) {
      const per = 1.6 + rnd(i) * 1.2;
      const fase = ((t * ritmo + rnd(i, 2) * per) % per) / per;
      const x = x0 + (rnd(i, 3) - 0.5) * larg + Math.sin(fase * 6 + i) * 30;
      const y = y0 - fase * alt;
      const s = (30 + rnd(i, 4) * 40) * (fase < 0.15 ? fase / 0.15 : 1);
      K.coracao(ctx, x, y, s, "#E8342A", Math.sin(i) * 0.3, 1 - Math.pow(fase, 3));
    }
  }
  CENAS.q073 = function (ctx, lt, dur) {
    radial(ctx, W * 0.4, H * 0.4, W * 0.8, [[0, "#FBF1E8"], [1, "#E2CABA"]]);
    pao(ctx, W * 0.36, H * 1.6, 1500, { pelucia: 1, vira: 0.2, olharX: 0.6, olharY: -0.3, pupila: 1.1, bico: 0.15 }, lt);
    coracoes(ctx, lt, 8 + Math.floor(lt * 4), W * 0.78, H * 0.75, 220, H * 0.7);
    // interface do vídeo vertical
    texto(ctx, "‹", 50, 90, 90, { peso: 700, cor: "#FFFFFF", sombra: { cor: "rgba(0,0,0,0.3)", blur: 8 } });
    texto(ctx, "•••", W - 120, 70, 50, { peso: 900, cor: "#FFFFFF" });
    const col = [["coracao", String(12 + Math.floor(lt * 20))], ["comentario", "5"], ["compartilhar", "1"], ["sino", ""]];
    col.forEach(([g, n], i) => {
      const y = H * 0.32 + i * 140;
      ctx.save(); ctx.translate(W - 115, y - 30); ctx.scale(1.25, 1.25);
      ctx.fillStyle = "#FFFFFF"; ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 8; ctx.fill(K.GLIFO[g]); ctx.restore();
      if (n) texto(ctx, n, W - 85, y + 62, 30, { peso: 800, cor: "#FFFFFF", alinha: "center", sombra: { cor: "rgba(0,0,0,0.4)", blur: 6 } });
    });
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(120, H - 60, W - 300, 8);
    ctx.fillStyle = "#E8342A"; ctx.fillRect(120, H - 60, (W - 300) * (0.3 + lt / dur * 0.25), 8);
    ctx.beginPath(); ctx.arc(120 + (W - 300) * (0.3 + lt / dur * 0.25), H - 56, 16, 0, 7); ctx.fillStyle = "#fff"; ctx.fill();
    texto(ctx, "❚❚", 40, H - 40, 40, { peso: 900, cor: "#fff" });
  };
  CENAS.q074 = function (ctx, lt, dur) {
    radial(ctx, W / 2, H * 0.45, W * 0.8, [[0, "#FBF1E8"], [1, "#DCC2AE"]]);
    ctx.fillStyle = "#EAD9C8"; ctx.fillRect(0, H * 0.82, W, H);
    const vira = key(lt, [[0, 1], [0.8, 0.55, E.io]]);
    pao(ctx, W * 0.3, H * 1.15, 900, { pelucia: 1, vira, olharX: 1, rosto: 1 }, lt);
    coracoes(ctx, lt, 10, W * 0.55, H * 0.7, 160, H * 0.6, 1.2);
    // celular no suporte mostrando o próprio vídeo
    ctx.save(); ctx.translate(W * 0.78, H * 0.5); ctx.rotate(0.08);
    K.celular(ctx, 0, 0, 340, 0, (c, x, y, w, h) => {
      c.fillStyle = "#F6E6D8"; c.fillRect(x, y, w, h);
      PAO.pao(c, x + w * 0.45, y + h * 0.95, w * 1.2, { pelucia: 1 }, lt);
      K.coracao(c, x + w * 0.85, y + h * 0.35, 40, "#E8342A");
      texto(c, String(12 + Math.floor(lt * 30)), x + w * 0.85, y + h * 0.42, 22, { peso: 900, cor: "#fff", alinha: "center" });
    });
    ctx.restore();
    ctx.fillStyle = "#3A3B38"; ctx.fillRect(W * 0.72, H * 0.86, 220, 30);
  };
  // 075–077: o celular na mesa; likes sobem progressivamente até 12,8 mil
  CENAS.q075 = function (ctx, lt, dur) {
    const k = ate(lt, 0.2, dur - 0.5);
    const n = 12 * Math.pow(12800 / 12, E.io(k));
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1.0], [dur, 1.18, E.io]]), ox: W * 0.55 });
    radial(ctx, W * 0.6, H * 0.35, W * 0.9, [[0, "#F8E9DA"], [1, "#C9A98E"]]);
    ctx.fillStyle = linear(ctx, 0, H * 0.4, 0, H, [[0, "#E7D2BD"], [1, "#BE9C80"]]); ctx.fillRect(0, H * 0.4, W, H);
    AMB.caneca(ctx, W * 0.86, H * 0.4, 200, { cor: "#F4F4F4", faixa: "#B3261A", vapor: 0.7, t: lt });
    ctx.save(); ctx.translate(W * 0.88, H * 0.72); ctx.rotate(0.3); rr(ctx, -200, -60, 400, 120, 14); ctx.fillStyle = "#2B2B2B"; ctx.fill(); rr(ctx, -190, -100, 380, 50, 10); ctx.fillStyle = "#9E241A"; ctx.fill(); ctx.restore();
    ctx.fillStyle = "#3C9A3C"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(W * 0.08 + i * 30, H * 0.1 + Math.abs(i - 3) * 20, 30, 60, (i - 3) * 0.35, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#F4ECE2"; rr(ctx, W * 0.04, H * 0.15, 200, 140, 20); ctx.fill();
    ctx.save(); ctx.translate(W * 0.56, H * 0.56); ctx.transform(1, 0, -0.35, 0.82, 0, 0); ctx.rotate(-0.22);
    K.celular(ctx, 0, 0, 420, 0, (c, x, y, w, h) => {
      c.fillStyle = "#F6E6D8"; c.fillRect(x, y, w, h);
      PAO.pao(c, x + w * 0.5, y + h * 0.62, w * 0.9, { pelucia: 1, olharX: 0.2 }, lt);
      rr(c, x + 20, y + h * 0.66, w - 40, h * 0.3, 30); c.fillStyle = "#FFFFFF"; c.fill();
      K.coracao(c, x + 80, y + h * 0.75, 60, "#E8342A");
      texto(c, K.fmtMil(n), x + 125, y + h * 0.775, 54, { peso: 900, cor: "#1C1C1C" });
      ["coracao", "comentario", "compartilhar", "sino"].forEach((g, i) => { c.save(); c.translate(x + 50 + i * 85, y + h * 0.86); c.scale(0.9, 0.9); c.strokeStyle = "#333"; c.lineWidth = 4; c.stroke(K.GLIFO[g]); c.restore(); });
      c.fillStyle = "#E8342A"; c.fillRect(x + 30, y + h * 0.64, (w - 60) * (0.3 + k * 0.5), 8);
    });
    ctx.restore();
    // corações saindo do celular com atraso e trajetória variados (crescem com o número)
    coracoes(ctx, lt, Math.floor(4 + k * 26), W * 0.6, H * 0.45, 520, H * 0.5, 0.9 + k);
    ctx.restore();
    // ombro e olho do PAÓ (ainda exausto) no primeiro plano
    pao(ctx, W * 0.02, H * 1.45, 1200, { vira: 0.85, olharX: 1, olharY: 0.3, palpE: 0.5, palpD: 0.5, sombra: 0 }, lt);
  };

  // ── BLOCO 17 · Ele ainda não percebeu (078–081) ─────────────────────────
  function cascaAberta(ctx, x, y, s) {
    // tampa aberta atrás (escura por fora, vermelha por dentro)
    ctx.save(); ctx.translate(x + s * 0.45, y - s * 0.45); ctx.rotate(0.5);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.7, 0, 0, 7); ctx.fillStyle = "#1E1F1C"; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.08, 0, s * 0.42, s * 0.6, 0, 0, 7); ctx.fillStyle = "#8E1A0E"; ctx.fill();
    ctx.restore();
  }
  function cuba(ctx, x, y, s, frente = true) {
    if (!frente) {
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.22, 0, 0, 7); ctx.fillStyle = "#8E1A0E"; ctx.fill();
      return;
    }
    ctx.beginPath(); ctx.moveTo(x - s, y);
    ctx.bezierCurveTo(x - s * 0.9, y + s * 0.65, x + s * 0.9, y + s * 0.65, x + s, y);
    ctx.ellipse(x, y, s, s * 0.22, 0, 0, Math.PI);
    ctx.fillStyle = linear(ctx, x - s, 0, x + s, 0, [[0, "#D9C3AE"], [0.4, "#F4E6D8"], [1, "#BFA58E"]]); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.22, 0, 0, Math.PI); ctx.strokeStyle = "#F7EDE2"; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = "#B3261A"; rr(ctx, x - s * 0.28, y + s * 0.5, s * 0.56, s * 0.12, 10); ctx.fill();
  }
  CENAS.q078 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.16 });
    K.mesaRedonda(ctx, W / 2, H * 0.86, 1400, { haste: false });
    const X = W * 0.5, Y = H * 0.78, S = 520;
    cascaAberta(ctx, X, Y, S);
    cuba(ctx, X, Y, S * 0.78, false);
    // ele emerge da fantasia: primeiro debruçado, olhos fechados; depois ergue a cabeça
    const ergue = key(lt, [[1.0, 0], [1.7, 1, E.io]]);
    const fol = respira(lt, 0.03, 1.1); // fôlego pesado
    pao(ctx, X - S * 0.05, Y + S * lerp(0.12, 0.02, ergue), S * 0.92, {
      giro: lerp(-0.35, 0, ergue), achata: fol * lerp(0.86, 1, ergue),
      palpE: lerp(1, 0.6, ergue), palpD: lerp(1, 0.6, ergue), incl: 10, olharY: 0.4,
      asaE: { x: -0.55, y: lerp(-0.25, -0.38, ergue) }, asaD: { x: 0.55, y: lerp(-0.2, -0.38, ergue) }, sombra: 0,
    }, lt);
    cuba(ctx, X, Y, S * 0.78, true);
    vinheta(ctx, 0.45);
  };
  // 080: o olhar reage a uma luz fora do quadro (a sala continua apagada)
  CENAS.q080 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: 1.25, ox: W * 0.5, oy: H * 0.6 });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.16 });
    const X = W * 0.5, Y = H * 0.78, S = 520;
    cascaAberta(ctx, X, Y, S);
    cuba(ctx, X, Y, S * 0.78, false);
    const nota = key(lt, [[0.3, 0], [0.55, 1, E.out]]);
    pao(ctx, X - S * 0.05, Y + S * 0.02, S * 0.92, {
      palpE: lerp(0.6, 0.25, nota), palpD: lerp(0.6, 0.25, nota), incl: lerp(10, 2, nota),
      olharX: lerp(0, 0.95, nota), olharY: lerp(0.4, -0.1, nota), vira: nota * 0.15,
      asaE: { x: -0.55, y: -0.38 }, asaD: { x: 0.55, y: -0.38 }, sombra: 0,
    }, lt);
    cuba(ctx, X, Y, S * 0.78, true);
    ctx.restore();
    // luz vermelha suave entrando pela direita, fora do quadro
    radial(ctx, W * 1.1, H * 0.55, W * 0.45, [[0, `rgba(255,90,60,${0.35 * key(lt, [[0.15, 0], [0.5, 1]])})`], [1, "rgba(0,0,0,0)"]]);
    vinheta(ctx, 0.45);
  };
  // 081: enxugar a lágrima com gesto delicado
  CENAS.q081 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.15, tam: 150, xs: [0.1, 0.27, 0.73, 0.9] });
    const enx = key(lt, [[0.35, 0], [0.8, 1, E.io], [1.1, 1], [1.4, 0, E.io]]);
    pao(ctx, W / 2, H * 1.3, 860, {
      palpE: 0.92, palpD: 0.92, incl: 14, lagrima: 1, tLagrima: lt, achata: respira(lt, 0.02, 1.3),
      asaE: { x: lerp(-0.55, -0.27, enx), y: lerp(-0.3, -0.66 - Math.sin(lt * 9) * 0.01 * enx, enx) }, sombra: 0,
    }, lt);
    vinheta(ctx, 0.45);
  };

  // ── BLOCO 18 · A virada (082–083) ───────────────────────────────────────
  // o MESMO balão cinza, no mesmo pedestal, acende: centro branco, halo vermelho
  CENAS.q082 = function (ctx, lt, dur) {
    const acende = key(lt, [[0.35, 0], [0.55, 1, E.out]]);
    const esc = mola(lt, 0.35, 1, 1, { w: 18, z: 0.4 }) + (lt > 0.35 ? Math.exp(-(lt - 0.35) * 6) * Math.sin((lt - 0.35) * 18) * 0.06 : 0);
    const perto = (i) => key(lt, [[1.05 + Math.abs(i - 1.5) * 0.12, 0], [1.3 + Math.abs(i - 1.5) * 0.12, 1, E.out]]);
    const tr = tremor(lt, 0.36, 0.25, 5);
    ctx.save(); cam(ctx, { x: tr.x, y: tr.y });
    K.salaLaranja(ctx, lt, { brilho: acende * 0.25 });
    K.iconesParede(ctx, lt, perto);
    const bx = W * 0.6, by = H * 0.52;
    ctx.beginPath(); ctx.ellipse(bx, H * 0.8, 330, 70, 0, 0, 7);
    ctx.fillStyle = K.mistura("#B8A58E", "#FFE3D6", acende); ctx.fill();
    ctx.strokeStyle = `rgba(255,60,40,${acende})`; ctx.lineWidth = 14; ctx.shadowColor = "#FF3B2A"; ctx.shadowBlur = 40 * acende; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.save(); ctx.translate(bx, by); ctx.scale(esc, esc);
    K.balao(ctx, 0, 0, 420, acende, { pontos: acende });
    ctx.restore();
    // PAÓ percebe: pálpebras abrem, pupilas dilatam
    pao(ctx, W * 0.25, H * 0.98, 520, {
      vira: 0.5, olharX: 1, olharY: -0.2,
      palpE: key(lt, [[0.35, 0.35], [0.5, 0, E.out]]), palpD: key(lt, [[0.35, 0.35], [0.5, 0, E.out]]),
      pupila: key(lt, [[0.35, 1], [0.55, 1.3, E.back]]), achata: key(lt, [[0.35, 1], [0.45, 1.04, E.out], [0.7, 1]]),
      aro: `rgba(255,80,50,${0.9 * acende})`, aroForca: 0.6 * acende,
    }, lt);
    ctx.restore();
    vinheta(ctx, 0.35 - acende * 0.15);
  };
  CENAS.q083 = function (ctx, lt, dur) {
    const onda = (i, x, y) => 0;
    const k = ate(lt, 0.15, 1.0);
    K.salaLaranja(ctx, lt, { brilho: 0.25 + k * 0.6 });
    K.iconesParede(ctx, lt, (i) => clamp(k * 1.6 - Math.abs(i - 1.5) * 0.25));
    // pontinhos da rede se espalhando a partir do balão
    for (let i = 0; i < 90; i++) {
      const a = rnd(i) * Math.PI * 2, r = 200 + rnd(i, 2) * 900;
      const vis = clamp(k * 1100 - r) / 1;
      if (vis <= 0) continue;
      ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * r, H * 0.5 + Math.sin(a) * r * 0.45, 3, 0, 7);
      ctx.fillStyle = `rgba(255,220,150,${clamp(vis / 60) * 0.8})`; ctx.fill();
    }
    K.mesaRedonda(ctx, W / 2, H * 0.78, 760, { brilho: 1 });
    K.balao(ctx, W / 2, H * 0.52, 480, 1, { base: false, pontos: 0 });
    vinheta(ctx, 0.2);
  };

  // ── BLOCO 19 · Alívio (084) ─────────────────────────────────────────────
  function salaViva(ctx, t, o = {}) {
    K.salaLaranja(ctx, t, { brilho: 0.9 });
    K.redeViva(ctx, t, 1);
    K.iconesParede(ctx, t, () => 1, o);
  }
  CENAS.q084 = function (ctx, lt, dur) {
    salaViva(ctx, lt);
    const abre = key(lt, [[0.25, 0.55], [0.6, 0, E.out]]);
    const sorri = key(lt, [[0.7, 0], [1.1, 1, E.out]]);
    pao(ctx, W / 2, H * 1.35, 950, {
      olharX: key(lt, [[0, 0.8], [0.35, 0, E.out]]), olharY: -0.15,
      palpE: abre, palpD: abre, pupila: key(lt, [[0.3, 1], [0.6, 1.25, E.out]]),
      bico: sorri * 0.55, lagrima: 1, tLagrima: lt,
      achata: lerp(1, 0.98, sorri) * respira(lt, 0.012, 1.6),
      feliz: key(lt, [[1.9, 0], [2.3, 0.6, E.io]]),
      aro: "rgba(255,170,80,0.9)", aroForca: 0.5, sombra: 0,
    }, lt);
    vinheta(ctx, 0.2);
  };

  // ── BLOCO 20 · O que fica (085–087) ─────────────────────────────────────
  function arcoIcones(ctx, t, cx, cy, rx, ry, n, tam, fase = 0) {
    const tipos = ["coracao", "comentario", "compartilhar", "sino"];
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.05 + (i / (n - 1)) * 0.9);
      K.icone(ctx, tipos[(i + fase) % 4], cx + Math.cos(a) * rx, cy + Math.sin(a) * ry + Math.sin(t * 1.4 + i) * 6, tam, 1);
    }
  }
  function frase(ctx, str, lt, y, tam) {
    const k = key(lt, [[0.3, 0], [0.9, 1, E.out]]);
    texto(ctx, str, W / 2, y + (1 - k) * 24, tam, { peso: 800, cor: "#FFF6EA", alinha: "center", alpha: k, sombra: { cor: "rgba(120,30,0,0.55)", blur: 18, y: 4 } });
  }
  CENAS.q085 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1.06], [dur, 1.0]]) });
    K.salaLaranja(ctx, lt, { brilho: 0.9 });
    K.redeViva(ctx, lt, 1);
    arcoIcones(ctx, lt, W / 2, H * 0.62, 720, 330, 9, 90);
    arcoIcones(ctx, lt, W / 2, H * 0.62, 470, 190, 7, 70, 2);
    K.mesaRedonda(ctx, W / 2, H * 0.84, 600, { brilho: 1, haste: false });
    pao(ctx, W / 2, H * 0.85, 300, { asaEang: 20, asaDang: 20, olharY: -0.1, palpE: piscadas(lt, [1.6]), palpD: piscadas(lt, [1.6]), aro: "rgba(255,170,80,0.9)", aroForca: 0.45 }, lt);
    ctx.restore();
    frase(ctx, "para quem ama o que faz.", lt, H * 0.2, 92);
  };
  CENAS.q086 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1.0], [dur, 0.95]]) });
    K.salaLaranja(ctx, lt, { brilho: 1 });
    K.redeViva(ctx, lt, 1);
    K.iconesParede(ctx, lt, () => 1, { y: H * 0.48, tam: 110, xs: [0.38, 0.46, 0.54, 0.62] });
    K.poeira(ctx, lt, 60, "rgba(255,220,150,A)", [0, H * 0.3, W, H * 0.7], 15, 2.5);
    K.mesaRedonda(ctx, W / 2, H * 0.86, 520, { brilho: 1, haste: false });
    pao(ctx, W / 2, H * 0.87, 230, { asaEang: 35, asaDang: 35, olharY: -0.2, feliz: key(lt, [[1.2, 0], [1.5, 0.7]]), bico: 0.3 }, lt);
    ctx.restore();
    frase(ctx, "independente do engajamento", lt, H * 0.24, 86);
  };
  CENAS.q087 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt, { brilho: 1 });
    K.redeViva(ctx, lt, 1);
    K.iconesParede(ctx, lt, () => 1, { y: H * 0.2, tam: 160 });
    for (let i = 0; i < 6; i++) K.coracao(ctx, W * (0.25 + i * 0.1), H * 0.55 - Math.sin(lt * 1.5 + i) * 20, 36, "#FFB070", 0, 0.6, false);
    K.mesaRedonda(ctx, W / 2, H * 0.8, 700, { brilho: 1, haste: false });
    pao(ctx, W / 2, H * 0.81, 380, { asaEang: 15, asaDang: 15, olharY: -0.1, palpE: piscadas(lt, [0.8]), palpD: piscadas(lt, [0.8]), aro: "rgba(255,170,80,0.9)", aroForca: 0.45 }, lt);
  };

  // ── BLOCO 21 · Assinatura (088–090): uma assinatura só, entrada + sustentação
  CENAS.q088 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1.0], [dur, 1.06, E.io]]) });
    K.salaLaranja(ctx, lt, { brilho: 1 });
    K.redeViva(ctx, lt, 1);
    K.iconesParede(ctx, lt, () => 1, { y: H * 0.16, tam: 130 });
    K.mesaRedonda(ctx, W / 2, H * 0.88, 640, { brilho: 1, haste: false });
    const entra = clamp(mola(lt, 0.1, 0, 1, "brincalhona"), 0, 1.3);
    pao(ctx, W / 2, H * 0.74, 380 * clamp(entra, 0, 1.1), { asaEang: 25, asaDang: 25, palpE: piscadas(lt, [1.9]), palpD: piscadas(lt, [1.9]), aro: "rgba(255,170,80,0.9)", aroForca: 0.4 }, lt);
    const pal = clamp(mola(lt, 0.45, 0, 1, "pesada"), 0, 1.2);
    ctx.save(); ctx.translate(W / 2, H * 0.86); ctx.scale(pal, pal);
    texto(ctx, "PAÓ", 0, 0, 190, { peso: 1000, cor: "#FFFFFF", alinha: "center", base: "middle", contorno: { l: 18, cor: "#A62317" }, sombra: { cor: "rgba(110,20,5,0.6)", blur: 24, y: 8 }, esp: 4 });
    texto(ctx, "PAÓ", 0, 0, 190, { peso: 1000, cor: "#FFFFFF", alinha: "center", base: "middle", esp: 4 });
    ctx.restore();
    ctx.restore();
    AMB.preto(ctx, key(lt, [[dur - 0.45, 0], [dur, 1, E.in2]]));
  };

  CENAS.ROTEIRO_C = function (plano) {
    const C = CENAS;
    // 14 · Cansaço
    plano("063-066", 5.0, C.q063, { foco: 0.48, sons: [[0, "amb-console", 0.4], [0.3, "pao-suspiro", 0.6], [1.9, "oculos", 0.7], [2.55, "oculos-mesa", 0.8], [3.4, "afunda", 0.5]] });
    // 15 · A última ideia: aparecer
    plano("067", 1.2, C.q067, { foco: 0.55, sons: [[0.35, "clique-pesado", 1.0]] });
    plano("068-069", 1.8, C.q068, { foco: 0.5, sons: [[0.1, "mecanismo", 0.8]] });
    plano("070-072", 2.4, C.q070, { sons: [[0, "musica-leve", 0.0], [1.6, "pulinho", 0.6], [0.5, "pao-oh", 0.4]] });
    // 16 · O conteúdo encontra pessoas
    plano("073", 1.5, C.q073, { vert: "ajusta", foco: 0.55, sons: [[0.2, "notif", 0.4], [0.6, "notif", 0.4], [1.0, "notif", 0.45]] });
    plano("074", 1.3, C.q074, { foco: 0.55, sons: [[0.1, "notif", 0.45], [0.5, "notif", 0.45], [0.9, "notif", 0.5]] });
    plano("075-077", 3.2, C.q075, { foco: 0.55, sons: [[0.3, "likes", 0.7]] });
    // 17 · Ele ainda não percebeu
    plano("078-079", 2.4, C.q078, { sons: [[0, "amb-sala", 0.45], [0.2, "pao-ofego", 0.7]] });
    plano("080", 1.1, C.q080, { sons: [[0.3, "pao-hm", 0.4]] });
    plano("081", 1.6, C.q081, { sons: [[0.3, "pao-choro", 0.6]] });
    // 18 · A virada
    plano("082", 1.7, C.q082, { foco: 0.55, sons: [[0.35, "comentario-acende", 1.0], [0.4, "pao-surpresa", 0.8]] });
    plano("083", 1.4, C.q083, { sons: [[0.15, "rede-acende", 0.9]] });
    // 19 · Alívio
    plano("084", 2.8, C.q084, { sons: [[0.9, "pao-riso", 0.7]] });
    // 20 · O que fica
    plano("085", 2.7, C.q085, { vert: "ajusta", sons: [] });
    plano("086", 2.7, C.q086, { vert: "ajusta", sons: [] });
    plano("087", 1.4, C.q087, { sons: [] });
    // 21 · Assinatura
    plano("088-090", 4.0, C.q088, { sons: [[0.45, "assinatura", 1.0]] });
  };
})();
