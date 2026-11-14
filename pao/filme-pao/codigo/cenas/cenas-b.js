// Blocos 07–13 (quadros 025–062).
window.CENAS = window.CENAS || {};
(function () {
  const { key, E, mola, piscada, piscadas, respira, rnd, ate, clamp, lerp, tremor } = M;
  const { W, H, radial, linear, rr, cam, vinheta, texto } = K;
  const pao = PAO.pao;
  const OC = 1;
  const apagado = () => 0;

  // painel de notificações do console (025)
  function painelNotif(ctx, x, y, s) {
    AMB.tile(ctx, x, y, s * 2.2, s * 1.7, "#F4F7FB", (c) => {
      ["ig", "tt"].forEach((n, i) => {
        AMB.rede(c, n, x - s * 0.85, y - s * 0.25 + i * s * 0.6, s * 0.34);
        K.metricas(c, x - s * 0.55, y - s * 0.25 + i * s * 0.6, s * 0.17, i ? [12, 5, 7] : [12, 5, 1], "#1C1C1C");
      });
      ["#2E7BD6", "#3B5BDB", "#E3302A", "#1C1C1C"].forEach((cor, i) => { rr(c, x - s * 0.5 + i * s * 0.32, y - s * 0.72, s * 0.24, s * 0.24, 8); c.fillStyle = cor; c.fill(); });
    });
  }

  // ── BLOCO 07 · Continuar criando (025–028) ──────────────────────────────
  CENAS.q025 = function (ctx, lt, dur) {
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1], [dur, 1.06]]), ox: W * 0.6 });
    AMB.branco(ctx, lt, { janela: false, chao: 0.75 });
    // monitor e console
    AMB.monitorFrente(ctx, W * 0.5, H * 0.52, 300, { vira: -0.6, tela: "#5C6470" });
    painelNotif(ctx, W * 0.72, H * 0.33, 180);
    ctx.save(); ctx.translate(W * 0.75, H * 0.8); ctx.transform(1, 0, -0.6, 0.5, 0, 0);
    rr(ctx, -500, -120, 1000, 260, 60); ctx.fillStyle = "#F7F9FC"; ctx.fill();
    rr(ctx, -120, -60, 200, 80, 18); ctx.fillStyle = "#E0372A"; ctx.fill();
    for (let i = 0; i < 3; i++) { rr(ctx, 160 + i * 60, -90 + i * 50, 380, 34, 17); ctx.fillStyle = i ? "#3CCB5A" : "#7CE08F"; ctx.fill(); }
    ctx.restore();
    // PAÓ de costas, a asa vai em direção ao console
    const al = key(lt, [[0.4, 0], [1.2, 1, E.io]]);
    pao(ctx, W * 0.3, H * 1.12, 820, {
      vira: 0.92, rosto: 1, oculos: OC, olharX: 1,
      asaD: { x: lerp(0.5, 0.62, al), y: lerp(-0.35, -0.55, al) },
    }, lt);
    ctx.restore();
  };
  // 026: preparar a asa ANTES de apertar; botão afunda e volta
  CENAS.q026 = function (ctx, lt, dur) {
    const c = { x: W * 0.62, y: H * 0.52 };
    const prep = key(lt, [[0.1, 0], [0.45, 1, E.io]]); // recua
    const golpe = key(lt, [[0.45, 0], [0.62, 1, E.in]]);
    const aperto = key(lt, [[0.6, 0], [0.64, 1, E.expo], [0.95, 1], [1.2, 0, E.out]]);
    const brilho = key(lt, [[0.62, 0.35], [0.66, 1, E.expo], [dur, 0.6, E.out]]);
    const tr = tremor(lt, 0.63, 0.22, 7);
    ctx.save();
    cam(ctx, { x: tr.x, y: tr.y, z: key(lt, [[0, 1], [dur, 1.05]]) });
    radial(ctx, W * 0.6, H * 0.5, W * 0.7, [[0, "#FFFFFF"], [1, "#D8DDE5"]]);
    rr(ctx, W * 0.32, H * 0.15, W * 0.62, H * 0.8, 90); ctx.fillStyle = "#EEF1F5"; ctx.fill();
    K.botaoVermelho(ctx, c.x, c.y, 300, { aperto, brilho, inclina: 0.7 });
    // ombro/rosto do PAÓ à esquerda (óculos) + asa
    pao(ctx, W * 0.08, H * 1.25, 1250, { vira: 0.75, oculos: OC, olharX: 1, olharY: 0.2, sombra: 0 }, lt);
    const ax = lerp(lerp(W * 0.3, W * 0.24, prep), c.x - 40, golpe), ay = lerp(lerp(H * 0.85, H * 0.95, prep), c.y + 10 + aperto * 18, golpe);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(lerp(-0.9, -0.55, golpe));
    ctx.beginPath(); ctx.ellipse(-170, 0, 230, 82, 0, 0, 7);
    ctx.fillStyle = linear(ctx, -300, -80, 0, 80, [[0, "#3B3D37"], [1, "#1B1C19"]]); ctx.fill();
    ctx.restore();
    ctx.restore();
  };
  const T4 = "Olá, eu sou o PAÓ. Meu post não teve muito engajamento…";
  const T5 = "Mas tudo bem! Vou continuar criando!";
  CENAS.q027 = function (ctx, lt, dur) { K.chat(ctx, lt, { texto: T4, n: clamp((lt - 0.15) * 30, 0, T4.length), z: key(lt, [[0, 1.02], [dur, 1.06]]) }); };
  CENAS.q028 = function (ctx, lt, dur) {
    const ap = key(lt, [[dur - 0.5, 0], [dur - 0.42, 1, E.out], [dur - 0.2, 0, E.out]]);
    K.chat(ctx, lt, { texto: T5, n: clamp((lt - 0.1) * 30, 0, T5.length), aperta: ap, z: 1.06 });
  };

  // ── BLOCO 08 · Verificar o resultado (029–034) ──────────────────────────
  // 029: pequeno aparecimento (antecipação ao espiar)
  CENAS.q029 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    const sobe = mola(lt, 0.2, 0, 1, "brincalhona");
    pao(ctx, W / 2, H * lerp(1.75, 1.38, sobe), 860, { oculos: OC, olharX: key(lt, [[0.4, 0], [0.7, -0.6, E.out]]), olharY: -0.5, pupila: 1.05, sombra: 0 }, lt);
    vinheta(ctx, 0.35);
  };
  // 030: pensar numa saída (bico e pupilas conduzem a reflexão)
  CENAS.q030 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1], [dur, 1.05]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.15 });
    K.mesaRedonda(ctx, W / 2, H * 0.9, 900, { haste: false });
    const ol = key(lt, [[0, 0.3], [0.4, 0.7, E.io], [0.9, 0.5, E.io]]);
    pao(ctx, W / 2, H * 1.02, 660, {
      oculos: OC, olharX: ol, olharY: -0.8, vira: 0.1, incl: -4,
      asaE: { x: -0.05, y: key(lt, [[0, -0.5], [0.35, -0.6, E.out]]) },
      palpE: piscadas(lt, [0.75], 0.12), palpD: piscadas(lt, [0.75], 0.12),
      bico: key(lt, [[0.5, 0], [0.7, 0.15], [0.9, 0]]),
    }, lt);
    ctx.restore(); vinheta(ctx, 0.35);
  };
  // 031–032: inspeciona o balão ainda cinza
  CENAS.q031 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1.12], [dur, 1.0, E.io]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    const bx = W * 0.4;
    K.balao(ctx, bx, H * 0.6, 380, 0);
    const recua = key(lt, [[0.8, 0], [1.2, 1, E.io]]);
    pao(ctx, lerp(W * 0.56, W * 0.66, recua), H * 0.98, 440, {
      vira: -0.5, olharX: -1, olharY: 0, oculos: OC,
      giro: lerp(-0.18, 0, recua), achata: respira(lt),
      asaE: recua > 0.5 ? { x: -0.12, y: -0.55 } : null,
      palpE: piscadas(lt, [0.5]), palpD: piscadas(lt, [0.5]),
    }, lt);
    ctx.restore(); vinheta(ctx, 0.35);
  };
  // 033–034: popup do post (2/0/0) e conferir os mesmos resultados
  CENAS.q033 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1], [dur, 1.08]]), x: key(lt, [[0, 0], [dur, -40]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { xs: [0.12, 0.2, 0.78, 0.9], tam: 140, y: H * 0.15 });
    K.balao(ctx, W * 0.48, H * 0.75, 240, 0);
    const pop = clamp(mola(lt, 0.15, 0, 1, "brincalhona"), 0, 1.2);
    ctx.save(); ctx.translate(W * 0.48, H * 0.38); ctx.scale(pop, pop);
    K.cardPost(ctx, 0, 0, 440, { v: [2, 0, 0], cauda: true });
    ctx.restore();
    const ol = key(lt, [[0.3, -0.4], [0.6, -0.9, E.out], [1.3, -0.6, E.io], [1.6, -0.95, E.io]]);
    pao(ctx, W * 0.74, H * 0.96, 400, { vira: -0.35, olharX: ol, olharY: -0.5, oculos: OC, asaE: { x: -0.1, y: -0.57 }, palpE: piscadas(lt, [1.1], 0.15), palpD: piscadas(lt, [1.1], 0.15), incl: 6 }, lt);
    ctx.restore(); vinheta(ctx, 0.35);
  };

  // ── BLOCO 09 · Pesquisar e ajustar (035–038) ────────────────────────────
  function caminhoLilas(ctx, t, camX) {
    radial(ctx, W / 2, H * 0.3, W, [[0, "#F2EAFF"], [0.6, "#D9C9F7"], [1, "#B9A5E8"]]);
    // plataformas cilíndricas
    for (let i = 0; i < 26; i++) {
      const x = ((rnd(i) * W * 2.2 - camX * (0.4 + rnd(i, 3) * 0.5)) % (W * 1.6)) - W * 0.2, y = H * (0.18 + rnd(i, 2) * 0.8), s = 60 + rnd(i, 4) * 110;
      ctx.fillStyle = "#E6DAFA"; rr(ctx, x - s, y, s * 2, s * 0.6, 20); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.3, 0, 0, 7); ctx.fillStyle = "#F8F3FF"; ctx.fill();
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(x, y - s * 0.35, s * 0.28, 0, 7); ctx.fillStyle = linear(ctx, 0, y - s * 0.6, 0, y, [[0, "#D8A8FF"], [1, "#9B4FE0"]]); ctx.fill(); }
      if (i % 5 === 1) { rr(ctx, x - s * 0.4, y - s * 0.45, s * 0.8, s * 0.5, 14); ctx.fillStyle = "#D93A2B"; ctx.fill(); }
    }
    // passarela curva
    ctx.save();
    ctx.translate(-camX * 0.9, 0);
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 120; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-W * 0.3, H * 0.95);
    ctx.bezierCurveTo(W * 0.3, H * 0.85, W * 0.5, H * 0.55, W * 0.9, H * 0.6);
    ctx.bezierCurveTo(W * 1.3, H * 0.65, W * 1.5, H * 0.4, W * 2.2, H * 0.35);
    ctx.stroke();
    ctx.strokeStyle = "rgba(190,160,240,0.6)"; ctx.lineWidth = 10; ctx.stroke();
    ctx.restore();
  }
  CENAS.q035 = function (ctx, lt, dur) {
    const camX = lt * 260;
    caminhoLilas(ctx, lt, camX);
    // passos com apoio dos pés (não desliza como adesivo)
    const passo = lt * 11;
    const px = W * 0.42 + lt * 40, py = H * 0.62 + Math.sin(lt * 0.7) * 10;
    pao(ctx, px, py, 150, { vira: 0.5, olharX: 0.8, oculos: OC, passo, anda: 1, giro: Math.sin(passo) * 0.04 }, lt);
    vinheta(ctx, 0.2, "60,30,90");
  };
  CENAS.q037 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1], [dur, 1.05]]) });
    AMB.branco(ctx, lt, { janela: false, chao: 0.78 });
    // dashboard grande
    AMB.tile(ctx, W * 0.55, H * 0.36, 1000, 520, "#F9FBFF", (c) => {
      rr(c, W * 0.55 - 470, H * 0.36 - 230, 260, 240, 30); c.fillStyle = "#2B2C29"; c.fill();
      K.avatar(c, W * 0.55 - 450, H * 0.36 - 210, 220, lt);
      const passo = Math.floor(ate(lt, 0.2, dur) * 3);
      for (let i = 0; i < 3; i++) {
        K.coracao(c, W * 0.55 - 160, H * 0.36 - 160 + i * 75, 44, "#E3302A");
        rr(c, W * 0.55 - 110, H * 0.36 - 172 + i * 75, 260 - (i === passo ? 0 : 60), 22, 11); c.fillStyle = i <= passo ? "#9AA3AF" : "#D5DAE0"; c.fill();
      }
      AMB.grafico(c, W * 0.55 - 120, H * 0.36 + 140, 110, "#3D8BFF", 5);
      c.strokeStyle = "#3D8BFF"; c.lineWidth = 6; c.beginPath();
      for (let i = 0; i < 8; i++) { const xx = W * 0.55 + 20 + i * 40, yy = H * 0.36 + 150 - Math.sin(i * 0.9) * 30 - i * 6; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
      // lápis de edição
      c.save(); c.translate(W * 0.55 + 300, H * 0.36 - 190); c.rotate(0.7 + Math.sin(lt * 6) * 0.1); c.fillStyle = "#3CCB5A"; c.fillRect(-8, -40, 16, 70); c.restore();
    });
    // mesa + teclado
    ctx.fillStyle = "#F2E6DA"; ctx.beginPath(); ctx.ellipse(W * 0.55, H * 0.9, 820, 160, 0, 0, 7); ctx.fill();
    AMB.teclado(ctx, W * 0.55, H * 0.84, 360, lt, 1);
    pao(ctx, W * 0.22, H * 1.15, 760, { vira: 0.95, oculos: OC, asaD: { x: 0.58, y: -0.45 + Math.sin(lt * 20) * 0.02 } }, lt);
    ctx.restore();
  };
  CENAS.q038 = function (ctx, lt, dur) {
    AMB.branco(ctx, lt, { janela: false, chao: 0.8 });
    const ok = (i) => ate(lt, 0.3 + i * 0.25, 0.5 + i * 0.25);
    for (const [x, d] of [[W * 0.27, 0], [W * 0.73, 2]]) {
      AMB.tile(ctx, x, H * 0.36, 560, 330, "#F7FFF8", (c) => {
        rr(c, x - 250, H * 0.36 - 120, 160, 200, 24); c.fillStyle = "#2B2C29"; c.fill();
        K.avatar(c, x - 240, H * 0.36 - 95, 140, lt);
        for (let i = 0; i < 3; i++) {
          K.coracao(c, x - 50, H * 0.36 - 80 + i * 70, 36, "#E3302A");
          rr(c, x - 20, H * 0.36 - 90 + i * 70, 150, 16, 8); c.fillStyle = "#BFC6CC"; c.fill();
          const k = ok(i + d * 0);
          c.beginPath(); c.arc(x + 200, H * 0.36 - 82 + i * 70, 20, 0, 7); c.strokeStyle = k > 0 ? "#2DB84B" : "#C9D0D6"; c.lineWidth = 5; c.stroke();
          if (k > 0) { c.beginPath(); c.moveTo(x + 190, H * 0.36 - 82 + i * 70); c.lineTo(x + 198, H * 0.36 - 74 + i * 70); c.lineTo(x + 212, H * 0.36 - 92 + i * 70); c.stroke(); }
        }
      });
      ctx.strokeStyle = "#2DB84B"; ctx.lineWidth = 8; ctx.strokeRect(x - 280, H * 0.36 - 165, 560, 330);
    }
    ctx.beginPath(); ctx.arc(W / 2, H * 0.36, 40, 0, 7); ctx.strokeStyle = "#2DB84B"; ctx.lineWidth = 10; ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H * 0.36, 14, 0, 7); ctx.fillStyle = "#2DB84B"; ctx.fill();
    ctx.fillStyle = "#EDE3D9"; ctx.fillRect(0, H * 0.86, W, H);
    pao(ctx, W / 2, H * 1.12, 560, { oculos: OC, olharY: -0.85, olharX: key(lt, [[0.2, -0.6], [0.7, 0.6, E.io]]), sombra: 0 }, lt);
  };

  // ── BLOCO 10 · Publicar outra tentativa (039–043) ───────────────────────
  CENAS.q039 = function (ctx, lt, dur) {
    radial(ctx, W / 2, H / 2, W * 0.7, [[0, "#EAF5FF"], [1, "#BFDDF5"]]);
    ctx.strokeStyle = "rgba(150,190,230,0.6)"; ctx.lineWidth = 3;
    for (let i = -6; i < 12; i++) { ctx.beginPath(); ctx.moveTo(i * 220, 0); ctx.lineTo(i * 220 + 600, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 220 + 600, 0); ctx.lineTo(i * 220, H); ctx.stroke(); }
    const ap = key(lt, [[0.32, 0], [0.4, 1, E.expo], [0.7, 1], [0.85, 0.3, E.out]]);
    // botão azul em pílula
    rr(ctx, W * 0.27, H * 0.62 + 24, W * 0.46, 170, 85); ctx.fillStyle = "#0F5BC4"; ctx.fill();
    rr(ctx, W * 0.27, H * 0.62 + ap * 18, W * 0.46, 170, 85); ctx.fillStyle = linear(ctx, 0, H * 0.62, 0, H * 0.62 + 170, [[0, "#5AB0FF"], [1, "#1E78E0"]]); ctx.fill();
    // asa desce e aperta (contato coincide com o botão)
    const desce = key(lt, [[0, -500], [0.15, -560, E.out], [0.38, 0, E.in]]);
    ctx.save(); ctx.translate(W * 0.55, H * 0.6 + desce + ap * 18); ctx.rotate(0.35);
    ctx.beginPath(); ctx.ellipse(0, -260, 120, 300, 0, 0, 7);
    ctx.fillStyle = linear(ctx, -120, 0, 120, 0, [[0, "#3B3D37"], [1, "#151613"]]); ctx.fill();
    ctx.restore();
  };
  CENAS.q040 = function (ctx, lt, dur) {
    radial(ctx, W / 2, H * 0.4, W * 0.8, [[0, "#FBF3EA"], [1, "#E2CDBA"]]);
    pao(ctx, W * 0.52, H * 1.55, 1500, {
      oculos: OC, olharX: 0.7, olharY: -0.7, asaE: { x: -0.18, y: -0.5 }, incl: -3,
      palpE: 0.1, palpD: 0.1, bico: key(lt, [[0.4, 0], [0.55, 0.12], [0.7, 0]]),
    }, lt);
  };
  // 041: a piscada transforma o olhar atento em avaliação
  CENAS.q041 = function (ctx, lt, dur) {
    AMB.branco(ctx, lt, { janela: false });
    AMB.tile(ctx, W * 0.08, H * 0.42, 180, 200, "#BFE3FF", (c) => AMB.grafico(c, W * 0.08, H * 0.42, 90, "#3D8BFF"));
    AMB.tile(ctx, W * 0.92, H * 0.42, 180, 200, "#BFE3FF", (c) => AMB.play(c, W * 0.92, H * 0.42, 80, "#3D8BFF"));
    const fecha = key(lt, [[0.1, 0], [0.28, 1, E.in2], [0.55, 1], [0.75, 0.35, E.out]]);
    pao(ctx, W / 2, H * 1.75, 1500, { oculos: OC, palpE: fecha, palpD: fecha, feliz: key(lt, [[0.2, 0], [0.35, 0.35], [0.6, 0]]), olharX: 0.2, sombra: 0 }, lt);
  };
  // 042: sequência de conteúdos no tablet (vista superior)
  CENAS.q042 = function (ctx, lt, dur) {
    radial(ctx, W / 2, H / 2, W * 0.7, [[0, "#F5EADF"], [1, "#D9C2AE"]]);
    ctx.save(); ctx.translate(W / 2, H * 0.46); ctx.transform(1, 0, 0.05, 0.92, 0, 0);
    rr(ctx, -450, -420, 900, 860, 50); ctx.fillStyle = "#2B2C29"; ctx.fill();
    rr(ctx, -420, -390, 840, 800, 34); ctx.fillStyle = "#FBF8F4"; ctx.fill();
    const rola = key(lt, [[0, 0], [dur, -40]]);
    const thumbs = [(c, x, y) => K.fotoPorDoSol(c, x, y, 220, 120, 14), (c, x, y) => { c.fillStyle = "#7FC6FF"; rr(c, x, y, 220, 120, 14); c.fill(); c.fillStyle = "#D9A21E"; c.fillRect(x + 120, y + 50, 70, 50); c.fillStyle = "#B3261A"; c.fillRect(x + 125, y + 40, 60, 20); }, (c, x, y) => { c.fillStyle = "#FBE4E6"; rr(c, x, y, 220, 120, 14); c.fill(); c.fillStyle = "#111"; c.fillRect(x + 60, y + 60, 100, 30); c.fillRect(x + 140, y + 30, 8, 40); }];
    for (let i = 0; i < 3; i++) {
      const y = -300 + i * 190 + rola;
      K.coracao(ctx, -340, y + 60, 56, "#E3302A");
      thumbs[i](ctx, -270, y);
      rr(ctx, -20, y + 30, 360, 26, 13); ctx.fillStyle = "#C9C2BA"; ctx.fill();
      rr(ctx, -20, y + 76, 240, 22, 11); ctx.fill();
    }
    K.teclaPostar(ctx, 0, 330, 380, { aperto: 0 });
    ctx.restore();
    pao(ctx, W / 2, H * 1.55, 900, { oculos: OC, olharY: -0.9, olharX: key(lt, [[0, -0.3], [dur, 0.3]]), sombra: 0 }, lt);
  };
  CENAS.q043 = function (ctx, lt, dur) {
    const ap = key(lt, [[0.35, 0], [0.42, 1, E.expo], [0.75, 1], [0.95, 0, E.out]]);
    const tr = tremor(lt, 0.42, 0.2, 6);
    ctx.save(); cam(ctx, { x: tr.x, y: tr.y });
    radial(ctx, W / 2, H / 2, W * 0.7, [[0, "#F5EEE6"], [1, "#D9C9B9"]]);
    ctx.save(); ctx.translate(W * 0.58, H * 0.5); ctx.transform(1, -0.12, 0.2, 0.85, 0, 0);
    K.placaCircuito(ctx, -520, -330, 1040, 640, lt);
    K.teclaPostar(ctx, 0, -20, 520, { aperto: ap, brilho: ap * 0.6 });
    ctx.restore();
    pao(ctx, W * 0.02, H * 1.3, 1200, { vira: 0.8, oculos: OC, olharX: 1, olharY: 0.3, sombra: 0 }, lt);
    const desce = key(lt, [[0, 1], [0.1, 1.08, E.out], [0.38, 0, E.in]]);
    ctx.save(); ctx.translate(W * 0.62 + desce * 260, H * 0.62 + ap * 16 + desce * 380); ctx.rotate(-0.75);
    ctx.beginPath(); ctx.ellipse(-50, 230, 110, 290, 0, 0, 7);
    ctx.fillStyle = linear(ctx, -150, 0, 100, 0, [[0, "#3B3D37"], [1, "#151613"]]); ctx.fill();
    ctx.restore();
    ctx.restore();
  };

  // ── BLOCO 11 · A espera e a frustração (044–049) ────────────────────────
  CENAS.q044 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    const k = key(lt, [[0, 0.6], [0.3, 1, E.out]]);
    pao(ctx, W / 2, H * 1.08, 620, { oculos: OC, olharY: -0.7, pupila: 1.12, asaE: { x: -0.3, y: lerp(-0.45, -0.58, k) }, asaD: { x: 0.3, y: lerp(-0.45, -0.58, k) }, bico: 0.1, achata: respira(lt, 0.015, 1.2) }, lt);
    vinheta(ctx, 0.35);
  };
  CENAS.q045 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1], [dur, 1.06]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    K.icone(ctx, "coracao", W * 0.2, H * 0.6, 110, 0);
    K.icone(ctx, "coracao", W * 0.8, H * 0.6, 110, 0);
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.86, 300, 50, 0, 0, 7); ctx.fillStyle = "#B3261A"; ctx.fill();
    K.balao(ctx, W / 2, H * 0.58, 360, 0);
    ctx.restore(); vinheta(ctx, 0.35);
  };
  CENAS.q046 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    pao(ctx, W / 2, H * 1.3, 820, { oculos: OC, olharY: -0.85, olharX: 0.35, asaE: { x: -0.32, y: -0.5 }, asaD: { x: 0.32, y: -0.5 }, palpE: key(lt, [[0, 0], [dur, 0.18]]), palpD: key(lt, [[0, 0], [dur, 0.18]]), sombra: 0 }, lt);
    vinheta(ctx, 0.35);
  };
  // 047: cansaço refletido nos óculos; pálpebras descem gradualmente
  CENAS.q047 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.12, tam: 140, xs: [0.12, 0.27, 0.73, 0.88] });
    const pal = key(lt, [[0, 0.25], [dur, 0.55, E.io]]);
    pao(ctx, W / 2, H * 1.55, 1350, { oculos: OC, reflexo: 1, palpE: pal, palpD: pal, olharY: 0.2, incl: 6, sombra: 0 }, lt);
    vinheta(ctx, 0.35);
  };
  CENAS.q048 = function (ctx, lt, dur) {
    radial(ctx, W / 2, H / 2, W * 0.7, [[0, "#F7F4EF"], [1, "#D8D2CA"]]);
    rr(ctx, W * 0.08, H * 0.14, W * 0.84, H * 0.72, 80); ctx.fillStyle = "#F1EDE7"; ctx.fill();
    for (const y of [H * 0.38, H * 0.6]) { ctx.beginPath(); ctx.arc(W * 0.22, y, 75, 0, 7); ctx.fillStyle = "#1E78E0"; ctx.fill(); }
    ctx.save(); rr(ctx, W * 0.7, H * 0.3, 300, 300, 30); ctx.clip();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = (i + j) % 2 ? "#FFFFFF" : "#1E78E0"; ctx.fillRect(W * 0.7 + i * 75, H * 0.3 + j * 75, 75, 75); }
    ctx.restore();
    K.botaoVermelho(ctx, W / 2, H * 0.48, 230, { brilho: 0.7 + Math.sin(lt * 6) * 0.15, inclina: 0.75 });
  };
  // 049: cobre o rosto (asas chegam depois da percepção)
  CENAS.q049 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    const aperta = key(lt, [[0.15, 0], [0.3, 1, E.out]]);
    const asas = key(lt, [[0.3, 0], [0.6, 1, E.back]]);
    const p = (s) => ({ x: lerp(s * 0.6, s * 0.2, asas), y: lerp(-0.25, -0.8, asas) });
    pao(ctx, W / 2, H * 1.3, 820, { oculos: OC, aperta, asaE: asas > 0.02 ? p(-1) : null, asaD: asas > 0.02 ? p(1) : null, achata: 1 - asas * 0.04 + Math.sin(lt * 30) * 0.003 * asas, sombra: 0 }, lt);
    vinheta(ctx, 0.4);
  };

  // ── BLOCO 12 · Mais uma solução (050–056) ───────────────────────────────
  CENAS.q050 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { x: key(lt, [[0, 0], [dur, -120]]) });
    AMB.branco(ctx, lt);
    AMB.tile(ctx, W * 0.2, H * 0.3, 360, 140, "#F7F9FC", (c) => {
      rr(c, W * 0.2 - 160, H * 0.3 - 50, 100, 100, 20); c.fillStyle = "#B3261A"; c.fill(); AMB.grafico(c, W * 0.2 - 110, H * 0.3, 50, "#fff");
      ["coracao", "comentario", "compartilhar", "sino"].forEach((g, i) => K.icone(c, g, W * 0.2 + i * 50, H * 0.3, 40, 0, { apagado: "#4A4A4A", lw: 4 }));
    });
    AMB.tile(ctx, W * 0.17, H * 0.5, 300, 120, "#B3261A", (c) => AMB.seta(c, W * 0.17, H * 0.5, 80, "#fff"));
    const passo = lt * 10;
    pao(ctx, W * 0.62 + lt * 90, H * 0.86, 430, { vira: -0.35, olharX: -0.6, olharY: -0.3, oculos: OC, passo, anda: 1, asaD: { x: 0.55, y: -0.5 } }, lt);
    AMB.caneca(ctx, W * 0.62 + lt * 90 + 250, H * 0.86 - 210, 80, { cor: "#F4F4F4", faixa: "#B3261A" });
    ctx.restore();
  };
  CENAS.q051 = function (ctx, lt, dur) {
    radial(ctx, W / 2, H * 0.5, W * 0.7, [[0, "#FFFFFF"], [1, "#D9E6F2"]]);
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.86, 520, 90, 0, 0, 7); ctx.fillStyle = "#E6EEF6"; ctx.fill();
    ctx.strokeStyle = "#5AC8FF"; ctx.lineWidth = 6; ctx.stroke();
    // braços mecânicos em arcos controlados
    for (const s of [-1, 1]) {
      const a = Math.sin(lt * 3 + (s > 0 ? 1 : 0)) * 0.15;
      ctx.save(); ctx.translate(W / 2 + s * 700, H * 0.05); ctx.rotate(s * (0.9 + a));
      ctx.fillStyle = "#7E9DB8"; rr(ctx, -30, 0, 60, 380, 30); ctx.fill();
      ctx.translate(0, 380); ctx.rotate(-s * (1.2 + a));
      ctx.beginPath(); ctx.arc(0, 0, 45, 0, 7); ctx.fillStyle = "#5A7A96"; ctx.fill();
      ctx.fillStyle = "#9DB6CC"; rr(ctx, -24, 0, 48, 300, 24); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 300, 30, 0, 7); ctx.fillStyle = "#3BA3E0"; ctx.fill();
      ctx.restore();
    }
    // lâmpada com coração
    radial(ctx, W / 2, H * 0.5, 320, [[0, "rgba(255,230,120,0.8)"], [1, "rgba(255,230,120,0)"]], W / 2 - 320, H * 0.5 - 320, 640, 640);
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.48, 150, 190, 0, 0, 7); ctx.fillStyle = "rgba(255,240,180,0.85)"; ctx.fill();
    K.coracao(ctx, W / 2, H * 0.47, 170 * (1 + Math.sin(lt * 8) * 0.03), "#E3302A");
    ctx.fillStyle = "#D9A21E"; rr(ctx, W / 2 - 110, H * 0.64, 220, 90, 20); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = "#FFC21A"; ctx.lineWidth = 12; ctx.lineCap = "round"; const a = -Math.PI / 2 + (i - 1) * 0.5; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * 240, H * 0.48 + Math.sin(a) * 240); ctx.lineTo(W / 2 + Math.cos(a) * 300, H * 0.48 + Math.sin(a) * 300); ctx.stroke(); }
  };
  CENAS.q052 = function (ctx, lt, dur) {
    AMB.branco(ctx, lt, { janela: false, chao: 0.8 });
    AMB.tile(ctx, W * 0.6, H * 0.4, 1000, 560, "#57B9FF", (c) => {
      AMB.play(c, W * 0.6, H * 0.33, 140, "#E3302A");
      const k = ate(lt, 0, dur);
      c.strokeStyle = "#fff"; c.lineWidth = 10; c.beginPath(); c.moveTo(W * 0.6 - 300, H * 0.52); c.lineTo(W * 0.6 + 300, H * 0.52); c.stroke();
      c.beginPath(); c.arc(W * 0.6 - 300 + 600 * k * 0.6, H * 0.52, 22, 0, 7); c.fillStyle = "#fff"; c.fill();
    });
    K.botaoVermelho(ctx, W * 0.55, H * 0.88, 80, { cara: false });
    pao(ctx, W * 0.18, H * 1.15, 760, { vira: 0.9, oculos: OC }, lt);
  };
  CENAS.q053 = function (ctx, lt, dur) {
    AMB.branco(ctx, lt, { janela: false });
    AMB.tile(ctx, W * 0.15, H * 0.25, 300, 200, "#2E7BD6", (c) => { K.coracao(c, W * 0.15 - 50, H * 0.25, 90, "#fff"); c.save(); c.translate(W * 0.15 + 10, H * 0.25 - 40); c.scale(1.7, 1.7); c.strokeStyle = "#fff"; c.lineWidth = 4; c.stroke(K.GLIFO.comentario); c.restore(); });
    AMB.tile(ctx, W * 0.85, H * 0.25, 300, 200, "#E0457A", (c) => AMB.grafico(c, W * 0.85, H * 0.25, 120, "#fff"));
    pao(ctx, W / 2, H * 1.25, 1100, { oculos: OC, olharX: key(lt, [[0, -0.5], [0.4, 0.5, E.io]]), olharY: -0.3, pupila: 1.05, sombra: 0 }, lt);
  };
  CENAS.q054 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1], [dur, 1.06]]) });
    AMB.branco(ctx, lt, { janela: false, chao: 0.72 });
    const sobe = (i) => ate(lt, 0.15 + i * 0.25, 0.5 + i * 0.25);
    AMB.tile(ctx, W * 0.22, H * 0.36, 460, 360, "#2E7BD6", (c) => {
      K.coracao(c, W * 0.22 - 90, H * 0.36, 150, "#fff");
      c.save(); c.translate(W * 0.22 + 10, H * 0.36 - 60); c.scale(2.6, 2.6); c.strokeStyle = "#fff"; c.lineWidth = 3.5; c.stroke(K.GLIFO.comentario); c.restore();
      texto(c, String(Math.round(lerp(2, 3, sobe(0)))), W * 0.22 + 150, H * 0.36 + 130, 60, { peso: 900, cor: "#fff" });
    });
    AMB.tile(ctx, W * 0.5, H * 0.36, 380, 400, "#F2F4F7", (c) => K.avatar(c, W * 0.5 - 150, H * 0.36 - 160, 300, lt));
    AMB.tile(ctx, W * 0.78, H * 0.36, 460, 360, "#E0457A", (c) => { AMB.play(c, W * 0.78 - 120, H * 0.36 + 40, 120, "#fff"); AMB.grafico(c, W * 0.78 + 60, H * 0.36 + 10, 170, "#fff", 4, 0.6 + 0.4 * sobe(1)); AMB.seta(c, W * 0.78 + 70, H * 0.36 - 110, 110, "#fff"); });
    ctx.fillStyle = "#EFE6DC"; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.92, 900, 140, 0, 0, 7); ctx.fill();
    // plantinha
    ctx.fillStyle = "#3C9A3C"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(W / 2 + (i - 2) * 18, H * 0.75 - Math.abs(i - 2) * -6, 22, 30, (i - 2) * 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#FFFFFF"; rr(ctx, W / 2 - 40, H * 0.77, 80, 60, 12); ctx.fill();
    // 055: o PAÓ de costas confere os painéis
    const entra = key(lt, [[0.6, 0], [1.0, 1, E.out]]);
    pao(ctx, lerp(W * -0.1, W * 0.2, entra), H * 1.18, 700, { vira: 0.9, oculos: OC, olharY: -0.6 }, lt);
    ctx.restore();
  };
  CENAS.q056 = function (ctx, lt, dur) {
    const ap = key(lt, [[0.3, 0], [0.37, 1, E.expo], [0.6, 1], [0.78, 0, E.out]]);
    radial(ctx, W / 2, H / 2, W * 0.7, [[0, "#F5EEE6"], [1, "#D9C9B9"]]);
    ctx.save(); ctx.translate(W * 0.6, H * 0.5); ctx.transform(1, 0, 0.12, 0.85, 0, 0);
    K.placaCircuito(ctx, -560, -320, 1120, 640, lt);
    K.teclaPostar(ctx, -60, -20, 560, { aperto: ap, brilho: ap * 0.6 });
    ctx.restore();
    pao(ctx, W * 0.0, H * 1.3, 1200, { vira: 0.8, oculos: OC, olharX: 1, sombra: 0 }, lt);
    const desce = key(lt, [[0, 1], [0.33, 0, E.in]]);
    ctx.save(); ctx.translate(W * 0.6 + desce * 200, H * 0.6 + ap * 14 + desce * 400); ctx.rotate(-0.6);
    ctx.beginPath(); ctx.ellipse(-40, 240, 110, 290, 0, 0, 7); ctx.fillStyle = linear(ctx, -150, 0, 100, 0, [[0, "#3B3D37"], [1, "#151613"]]); ctx.fill();
    ctx.restore();
  };

  // ── BLOCO 13 · O resultado ainda não vem (057–062) ──────────────────────
  CENAS.q057 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1.05], [dur, 1.0]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    K.icone(ctx, "coracao", W * 0.22, H * 0.62, 120, 0);
    K.icone(ctx, "coracao", W * 0.78, H * 0.62, 120, 0);
    K.balao(ctx, W / 2, H * 0.6, 400, 0);
    ctx.restore(); vinheta(ctx, 0.4);
  };
  CENAS.q058 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { z: key(lt, [[0, 1.08], [dur, 1.0]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.24, tam: 190 });
    K.mesaRedonda(ctx, W / 2, H * 0.78, 520);
    pao(ctx, W / 2, H * 0.785, 200, { oculos: OC, olharY: 0.3, palpE: 0.3, palpD: 0.3, incl: 6, achata: respira(lt, 0.02, 2.4) * 0.98 }, lt);
    ctx.restore(); vinheta(ctx, 0.45);
  };
  // 059–061: espera sustentada; botão desfocado no primeiro plano
  CENAS.q059 = function (ctx, lt, dur) {
    ctx.save(); cam(ctx, { x: key(lt, [[0, 30], [dur, -60, E.lin]]), z: key(lt, [[0, 1.0], [dur, 1.08, E.lin]]) });
    AMB.branco(ctx, lt, { chao: 0.6 });
    AMB.tile(ctx, W * 0.33, H * 0.42, 140, 90, "#BFE3FF", (c) => AMB.grafico(c, W * 0.33, H * 0.42, 50, "#3D8BFF"));
    AMB.tile(ctx, W * 0.42, H * 0.38, 160, 110, "#BFE3FF", (c) => AMB.grafico(c, W * 0.42, H * 0.38, 70, "#3D8BFF", 5));
    AMB.tile(ctx, W * 0.52, H * 0.42, 140, 90, "#BFE3FF", (c) => AMB.seta(c, W * 0.52, H * 0.42, 50, "#3D8BFF"));
    rr(ctx, W * 0.24, H * 0.56, W * 0.38, 40, 20); ctx.fillStyle = "#E6ECF3"; ctx.fill();
    ctx.strokeStyle = "#5AC8FF"; ctx.lineWidth = 5; ctx.stroke();
    const can = key(lt, [[0, 0.2], [dur, 0.5]]);
    pao(ctx, W * 0.42, H * 0.6, 110, { oculos: OC, palpE: can, palpD: can, olharY: 0.3, sombra: 0, achata: respira(lt, 0.02, 2.2) }, lt);
    ctx.restore();
    // botão vermelho grande desfocado, primeiro plano
    K.desfocado(ctx, 14, () => {
      ctx.save(); ctx.translate(W * 0.8, H * 0.72); ctx.rotate(-0.95);
      K.botaoVermelho(ctx, 0, 0, 560, { inclina: 0.3, cara: false });
      ctx.restore();
    });
  };
  CENAS.q062 = function (ctx, lt, dur) {
    AMB.branco(ctx, lt, { janela: false, chao: 0.7 });
    AMB.tile(ctx, W * 0.28, H * 0.12, 230, 150, "#2E7BD6", (c) => K.coracao(c, W * 0.28, H * 0.12, 80, "#fff"));
    AMB.tile(ctx, W * 0.44, H * 0.12, 200, 150, "#F2F4F7", (c) => K.avatar(c, W * 0.44 - 60, H * 0.12 - 60, 120, lt));
    AMB.tile(ctx, W * 0.58, H * 0.12, 200, 150, "#E0457A", (c) => AMB.grafico(c, W * 0.58, H * 0.12, 80, "#fff"));
    AMB.tile(ctx, W * 0.74, H * 0.12, 230, 150, "#2E7BD6", (c) => K.coracao(c, W * 0.74, H * 0.12, 80, "#fff"));
    K.teclaPostar(ctx, W * 0.76, H * 0.32, 230);
    const espia = key(lt, [[0.1, 0], [0.5, 1, E.out]]);
    pao(ctx, W * 0.47, H * lerp(1.15, 0.98, espia), 640, { oculos: OC, olharX: key(lt, [[0.5, 0], [0.8, 0.4]]), olharY: 0.1, asaE: { x: -0.4, y: -0.42 }, asaD: { x: 0.4, y: -0.42 }, sombra: 0 }, lt);
    K.botaoVermelho(ctx, W * 0.47, H * 0.82, 460, { inclina: 0.35, cara: false });
  };

  CENAS.ROTEIRO_B = function (plano) {
    const C = CENAS;
    // 07 · Continuar criando
    plano("025", 1.5, C.q025, { foco: 0.4, sons: [[0, "amb-console", 0.5], [0.3, "ui-bip", 0.4]] });
    plano("026", 1.5, C.q026, { foco: 0.6, sons: [[0.15, "asas", 0.4], [0.62, "clique-macio", 0.9], [0.62, "pao-hm", 0.5]] });
    plano("027", 2.6, C.q027, { vert: "ajusta", sons: [[0.15, "digita", 0.6], [1.8, "pao-suspiro", 0.6]] });
    plano("028", 2.1, C.q028, { vert: "ajusta", sons: [[0.1, "digita", 0.6], [1.62, "enviar", 0.7]] });
    // 08 · Verificar o resultado
    plano("029", 1.0, C.q029, { sons: [[0, "amb-sala", 0.5], [0.2, "espiar", 0.5]] });
    plano("030", 1.3, C.q030, { sons: [[0.5, "pao-hm", 0.6]] });
    plano("031-032", 1.7, C.q031, { foco: 0.5, sons: [[0.1, "passinho", 0.4], [0.9, "passinho", 0.4]] });
    plano("033-034", 1.9, C.q033, { foco: 0.55, sons: [[0.15, "ui-card", 0.5]] });
    // 09 · Pesquisar e ajustar
    plano("035-036", 2.1, C.q035, { foco: 0.45, sons: [[0, "transicao", 0.5], [0, "passos", 0.5]] });
    plano("037", 1.3, C.q037, { vert: "ajusta", foco: 0.4, sons: [[0.1, "teclas", 0.5], [0.4, "ui-bip", 0.4], [0.8, "ui-bip", 0.4]] });
    plano("038", 1.3, C.q038, { vert: "ajusta", sons: [[0.3, "check", 0.5], [0.55, "check", 0.5], [0.8, "check", 0.5]] });
    // 10 · Publicar outra tentativa
    plano("039", 0.9, C.q039, { sons: [[0.38, "clique-macio", 0.8]] });
    plano("040", 1.0, C.q040, { foco: 0.45, sons: [[0.4, "pao-hm", 0.5]] });
    plano("041", 1.0, C.q041, { sons: [] });
    plano("042", 1.2, C.q042, { vert: "ajusta", sons: [[0, "ui-rola", 0.4]] });
    plano("043", 1.0, C.q043, { foco: 0.55, sons: [[0.42, "postar", 1.0]] });
    // 11 · A espera e a frustração
    plano("044", 1.2, C.q044, { sons: [[0, "espera", 0.6]] });
    plano("045", 0.9, C.q045, { sons: [] });
    plano("046", 0.9, C.q046, { sons: [] });
    plano("047", 1.3, C.q047, { sons: [[0.3, "pao-suspiro", 0.6]] });
    plano("048", 0.6, C.q048, { sons: [[0, "zumbido", 0.3]] });
    plano("049", 1.2, C.q049, { sons: [[0.15, "pao-hnn", 0.8], [0.35, "asas", 0.4]] });
    // 12 · Mais uma solução
    plano("050", 1.2, C.q050, { foco: 0.6, sons: [[0, "amb-console", 0.5], [0, "passos", 0.5]] });
    plano("051", 1.0, C.q051, { sons: [[0, "mecanica", 0.6]] });
    plano("052", 0.8, C.q052, { foco: 0.55, sons: [[0.1, "ui-bip", 0.4]] });
    plano("053", 0.8, C.q053, { sons: [] });
    plano("054-055", 1.6, C.q054, { vert: "ajusta", sons: [[0.15, "ui-bip", 0.4], [0.4, "ui-bip", 0.4]] });
    plano("056", 0.8, C.q056, { foco: 0.55, sons: [[0.37, "postar", 1.0]] });
    // 13 · O resultado ainda não vem
    plano("057", 1.0, C.q057, { sons: [[0, "amb-sala", 0.5]] });
    plano("058", 1.0, C.q058, { sons: [] });
    plano("059-061", 2.6, C.q059, { foco: 0.42, sons: [[0, "amb-console", 0.4], [1.4, "pao-suspiro", 0.5]] });
    plano("062", 1.0, C.q062, { sons: [] });
  };
})();
