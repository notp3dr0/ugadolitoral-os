// Blocos 01–06 (quadros 001–024) + ambientes compartilhados.
window.CENAS = window.CENAS || {};
(function () {
  const { key, E, mola, piscada, piscadas, respira, ruido, rnd, ate, clamp, lerp } = M;
  const { W, H, radial, linear, rr, cam, vinheta, texto } = K;
  const pao = PAO.pao;
  const OC = 1; // óculos durante o trabalho (regra 6)

  // ── ambientes compartilhados ───────────────────────────────────────────
  const AMB = (window.AMB = {});

  AMB.noite = function (ctx, t, o = {}) {
    radial(ctx, W * 0.55, H * 0.45, W * 0.8, [[0, "#5A2238"], [0.5, "#3A1630"], [1, "#160A18"]]);
    // janela/parede com luz roxa
    ctx.fillStyle = "rgba(120,60,140,0.12)";
    ctx.fillRect(0, 0, W, H * 0.7);
  };
  AMB.mesa = function (ctx, y, cor1 = "#C9A48A", cor2 = "#7A5642") {
    ctx.fillStyle = linear(ctx, 0, y, 0, H, [[0, cor1], [0.15, cor2], [1, "#2A1A14"]]);
    ctx.fillRect(-W, y, W * 3, H);
    ctx.fillStyle = "rgba(255,220,190,0.25)";
    ctx.fillRect(-W, y, W * 3, 4);
  };
  AMB.monitorCostas = function (ctx, x, y, w, o = {}) {
    const h = w * 0.62;
    const { brilho = 0.6 } = o;
    // halo da tela atrás
    radial(ctx, x, y - h * 0.5, w * 0.9, [[0, `rgba(190,220,255,${0.35 * brilho})`], [1, "rgba(0,0,0,0)"]], x - w * 1.2, y - h * 1.6, w * 2.4, h * 2.4);
    // pé
    ctx.fillStyle = "#151614";
    rr(ctx, x - w * 0.07, y - h * 0.05, w * 0.14, h * 0.42, 10); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + h * 0.37, w * 0.24, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    // costas do monitor
    rr(ctx, x - w / 2, y - h, w, h, w * 0.05);
    ctx.fillStyle = linear(ctx, x - w / 2, 0, x + w / 2, 0, [[0, "#3A3B38"], [0.5, "#2A2B28"], [1, "#1C1D1B"]]);
    ctx.fill();
    rr(ctx, x - w * 0.42, y - h * 0.9, w * 0.84, h * 0.8, w * 0.04);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - h * 0.45, w * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = "#1A1B19"; ctx.fill();
  };
  AMB.monitorFrente = function (ctx, x, y, w, o = {}) {
    const h = w * 0.62;
    const { vira = 0.35, tela = "#DDEBFF" } = o;
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, -0.12 * vira, 0, 1, 0, 0);
    ctx.fillStyle = "#1E1F1D";
    rr(ctx, -w * 0.06, -h * 0.05, w * 0.12, h * 0.4, 8); ctx.fill();
    rr(ctx, -w * 0.2, h * 0.32, w * 0.4, h * 0.06, 8); ctx.fill();
    rr(ctx, -w / 2, -h, w, h, w * 0.04); ctx.fill();
    rr(ctx, -w / 2 + 10, -h + 10, w - 20, h - 20, w * 0.03);
    ctx.fillStyle = tela; ctx.fill();
    ctx.restore();
  };
  AMB.caneca = function (ctx, x, y, s, o = {}) {
    const { cor = "#B7261A", faixa = null, vapor = 0, t = 0, carinha = false } = o;
    if (vapor > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${0.18 * vapor})`;
      ctx.lineWidth = s * 0.06;
      ctx.lineCap = "round";
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        for (let k = 0; k <= 10; k++) {
          const yy = y - s * 0.7 - k * s * 0.09;
          const xx = x + (i - 0.5) * s * 0.25 + Math.sin(k * 0.8 + t * 3 + i * 2) * s * 0.08;
          k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.lineWidth = s * 0.1;
    ctx.strokeStyle = cor;
    ctx.beginPath();
    ctx.ellipse(x + s * 0.42, y - s * 0.32, s * 0.16, s * 0.2, 0, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    rr(ctx, x - s * 0.42, y - s * 0.7, s * 0.84, s * 0.7, s * 0.12);
    ctx.fillStyle = linear(ctx, x - s * 0.42, 0, x + s * 0.42, 0, [[0, K.mistura(cor, "#000000", 0.3)], [0.4, cor], [1, K.mistura(cor, "#000000", 0.4)]]);
    ctx.fill();
    if (faixa) {
      ctx.fillStyle = faixa;
      ctx.fillRect(x - s * 0.42, y - s * 0.3, s * 0.84, s * 0.3);
    }
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.7, s * 0.42, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#3A1E12";
    ctx.fill();
    if (carinha) {
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(x + sd * s * 0.1, y - s * 0.42, s * 0.08, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#F2E5D5"; ctx.fill();
        ctx.beginPath(); ctx.arc(x + sd * s * 0.1, y - s * 0.42, s * 0.035, 0, Math.PI * 2);
        ctx.fillStyle = "#222"; ctx.fill();
      }
    }
    ctx.restore();
  };
  AMB.teclado = function (ctx, x, y, w, t = 0, ativo = 0) {
    const h = w * 0.26;
    rr(ctx, x - w / 2, y - h / 2, w, h, 14);
    ctx.fillStyle = "#1B1C1A";
    ctx.fill();
    for (let l = 0; l < 4; l++) for (let c = 0; c < 14; c++) {
      const kx = x - w / 2 + 14 + c * ((w - 28) / 14), ky = y - h / 2 + 10 + l * ((h - 20) / 4);
      const bate = ativo && rnd(c + l * 14, Math.floor(t * 14)) > 0.88 ? 3 : 0;
      rr(ctx, kx, ky + bate, (w - 28) / 14 - 5, (h - 20) / 4 - 5, 4);
      ctx.fillStyle = "#2E2F2C";
      ctx.fill();
    }
  };
  AMB.bege = function (ctx, t, o = {}) {
    const { chao = 0.7 } = o;
    radial(ctx, W / 2, H * 0.45, W * 0.75, [[0, "#FFF4EA"], [0.6, "#F2DFCF"], [1, "#D9BFA8"]]);
    // arcos da parede
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 28;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.95, W * (0.42 + i * 0.12), H * (0.75 + i * 0.1), 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#F7E9DC";
    ctx.fillRect(-W, H * chao, W * 3, H);
    // anéis vermelhos no chão
    ctx.strokeStyle = "rgba(180,40,25,0.75)";
    ctx.lineWidth = 14;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(W / 2, H * (chao + 0.2), W * (0.18 + i * 0.13), H * (0.06 + i * 0.04), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
  AMB.branco = function (ctx, t, o = {}) {
    const { janela = true, chao = 0.68 } = o;
    radial(ctx, W * 0.5, H * 0.4, W * 0.8, [[0, "#FBFCFF"], [0.6, "#EEF1F6"], [1, "#D6DCE6"]]);
    if (janela) {
      ctx.save();
      rr(ctx, W * 0.55, H * 0.12, W * 0.42, H * 0.5, 40);
      ctx.clip();
      ctx.fillStyle = linear(ctx, 0, H * 0.12, 0, H * 0.62, [[0, "#9CD3FF"], [1, "#E6F4FF"]]);
      ctx.fillRect(W * 0.55, H * 0.12, W * 0.42, H * 0.5);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(W * (0.62 + i * 0.1), H * (0.25 + (i % 2) * 0.05), 70, 26, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "rgba(120,170,220,0.6)";
      for (let i = 0; i < 12; i++) ctx.fillRect(W * (0.56 + i * 0.035), H * (0.5 - rnd(i) * 0.12), 40, H * 0.2);
      ctx.restore();
      ctx.strokeStyle = "#E3E8EF";
      ctx.lineWidth = 16;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(W * (0.55 + i * 0.105), H * 0.12); ctx.lineTo(W * (0.55 + i * 0.105), H * 0.62); ctx.stroke(); }
    }
    // teto curvo
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 40;
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.05, W * 0.6, H * 0.15, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = linear(ctx, 0, H * chao, 0, H, [[0, "#F4F6F9"], [1, "#D7DDE6"]]);
    ctx.fillRect(-W, H * chao, W * 3, H);
    // frisos azuis
    ctx.strokeStyle = "rgba(80,190,255,0.8)";
    ctx.shadowColor = "rgba(80,190,255,0.8)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(W * 0.45, H * (chao + 0.12), W * 0.5, H * 0.08, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  };
  // painel/tile vidrado (azul, rosa, branco)
  AMB.tile = function (ctx, x, y, w, h, cor, fn, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    rr(ctx, x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.18);
    ctx.fillStyle = cor;
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    rr(ctx, x - w / 2 + 6, y - h / 2 + 6, w - 12, h * 0.4, Math.min(w, h) * 0.14);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    if (fn) fn(ctx, x, y, w, h);
    ctx.restore();
  };
  AMB.grafico = function (ctx, x, y, s, cor = "#FFFFFF", n = 4, cresce = 1) {
    for (let i = 0; i < n; i++) {
      const hh = s * (0.25 + i * 0.22) * cresce;
      rr(ctx, x - s * 0.5 + i * s * 0.27, y + s * 0.45 - hh, s * 0.18, hh, 4);
      ctx.fillStyle = cor;
      ctx.fill();
    }
  };
  AMB.seta = function (ctx, x, y, s, cor = "#FFF") {
    ctx.strokeStyle = cor; ctx.lineWidth = s * 0.1; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(x - s * 0.45, y + s * 0.3); ctx.lineTo(x - s * 0.1, y - s * 0.05); ctx.lineTo(x + s * 0.1, y + s * 0.12); ctx.lineTo(x + s * 0.45, y - s * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * 0.2, y - s * 0.32); ctx.lineTo(x + s * 0.47, y - s * 0.32); ctx.lineTo(x + s * 0.47, y - s * 0.05); ctx.stroke();
  };
  AMB.play = function (ctx, x, y, s, cor = "#E8342A") {
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.38); ctx.lineTo(x + s * 0.4, y); ctx.lineTo(x - s * 0.3, y + s * 0.38); ctx.closePath();
    ctx.fillStyle = cor; ctx.fill();
  };
  // tile escuro com glifo (011–013)
  AMB.tileEscuro = function (ctx, tipo, x, y, s, alpha = 1) {
    AMB.tile(ctx, x, y, s * 1.2, s, "#3B3532", (c) => {
      if (tipo === "grafico") AMB.grafico(c, x, y, s * 0.6, "#F2E5D5");
      else if (tipo === "play") { rr(c, x - s * 0.32, y - s * 0.22, s * 0.64, s * 0.44, 10); c.fillStyle = "#F2E5D5"; c.fill(); AMB.play(c, x + 3, y, s * 0.3, "#C2281B"); }
      else {
        c.save(); c.translate(x - s * 0.3, y - s * 0.3); c.scale(s * 0.6 / 48, s * 0.6 / 48);
        c.fillStyle = "#F2E5D5"; c.fill(K.GLIFO[tipo]);
        if (tipo === "comentario") { c.fillStyle = "#3B3532"; for (const p of [16.5, 24, 31.5]) { c.beginPath(); c.arc(p, 20.5, 2.6, 0, 7); c.fill(); } }
        c.restore();
      }
    }, alpha);
  };
  // logotipos simplificados das redes (015, 025)
  AMB.rede = function (ctx, nome, x, y, s) {
    const cores = { x: "#111", fb: "#1877F2", in: "#0A66C2", yt: "#FF0000", tt: "#111", ig: null };
    ctx.save();
    rr(ctx, x - s / 2, y - s / 2, s, s, s * 0.24);
    if (nome === "ig") {
      ctx.fillStyle = linear(ctx, x - s / 2, y + s / 2, x + s / 2, y - s / 2, [[0, "#FEDA75"], [0.35, "#FA7E1E"], [0.6, "#D62976"], [1, "#4F5BD5"]]);
    } else ctx.fillStyle = cores[nome];
    ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.fillStyle = "#fff"; ctx.lineWidth = s * 0.09; ctx.lineCap = "round";
    if (nome === "ig") { rr(ctx, x - s * 0.28, y - s * 0.28, s * 0.56, s * 0.56, s * 0.16); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, s * 0.13, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x + s * 0.17, y - s * 0.17, s * 0.035, 0, 7); ctx.fill(); }
    else if (nome === "yt") AMB.play(ctx, x + s * 0.03, y, s * 0.42, "#fff");
    else if (nome === "tt") { ctx.beginPath(); ctx.moveTo(x + s * 0.02, y - s * 0.3); ctx.lineTo(x + s * 0.02, y + s * 0.12); ctx.stroke(); ctx.beginPath(); ctx.arc(x - s * 0.1, y + s * 0.14, s * 0.12, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + s * 0.02, y - s * 0.3); ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.12, x + s * 0.25, y - s * 0.1); ctx.stroke(); }
    else texto(ctx, nome === "fb" ? "f" : nome === "in" ? "in" : "X", x, y + s * 0.02, s * 0.62, { peso: 900, cor: "#fff", alinha: "center", base: "middle" });
    ctx.restore();
  };
  // moldura "dark/bright" de transição (flash)
  AMB.flash = function (ctx, k, cor = "255,255,255") {
    if (k <= 0) return;
    ctx.fillStyle = `rgba(${cor},${k})`;
    ctx.fillRect(0, 0, W, H);
  };
  AMB.preto = function (ctx, k) { AMB.flash(ctx, k, "0,0,0"); };

  // digitação: n caracteres em função do tempo
  const digita = (lt, t0, cps, str) => clamp((lt - t0) * cps, 0, str.length);

  // ── BLOCO 01 · O criador começa (001–008) ───────────────────────────────
  // 001–002: plano de mesa; a câmera aproxima; ele procura a ideia.
  CENAS.q001 = function (ctx, lt, dur) {
    const z = key(lt, [[0, 1], [dur, 1.22, E.io]]);
    ctx.save();
    cam(ctx, { z, y: key(lt, [[0, 0], [dur, 40]]) });
    AMB.noite(ctx, lt);
    // estante e quadro com a carinha
    ctx.fillStyle = "#2A1420";
    ctx.fillRect(W * 0.82, H * 0.1, W * 0.2, H * 0.55);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = "#1A0C14"; ctx.fillRect(W * 0.82, H * (0.25 + i * 0.15), W * 0.2, 10); }
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ["#6A1E1A", "#2D2B40", "#8C3A22"][i % 3]; ctx.fillRect(W * (0.84 + i * 0.022), H * 0.31 + (i % 2) * 6, 28, H * 0.09); }
    rr(ctx, W * 0.67, H * 0.08, 140, 170, 10); ctx.fillStyle = "#E9D7C7"; ctx.fill();
    K.avatar(ctx, W * 0.67 + 25, H * 0.08 + 35, 90, lt);
    // luminária à esquerda (luz quente)
    radial(ctx, W * 0.1, H * 0.25, W * 0.35, [[0, "rgba(255,190,120,0.55)"], [1, "rgba(0,0,0,0)"]]);
    ctx.strokeStyle = "#141414"; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(W * 0.02, H * 0.72); ctx.lineTo(W * 0.06, H * 0.2); ctx.lineTo(W * 0.13, H * 0.08); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.04); ctx.lineTo(W * 0.2, H * 0.12); ctx.lineTo(W * 0.15, H * 0.2); ctx.closePath(); ctx.fillStyle = "#1A1A1A"; ctx.fill();
    AMB.mesa(ctx, H * 0.72, "#8A5A48", "#4A2A22");
    // PAÓ atrás do monitor, digitando
    const bate = Math.abs(Math.sin(lt * 18)) * 0.006;
    const leX = key(lt, [[0, -0.5], [0.5, -0.1, E.out], [0.9, 0.3, E.out], [1.3, -0.35, E.out], [1.7, 0.2, E.out], [2.1, 0.55, E.out]]);
    const ideia = key(lt, [[dur - 0.9, 0], [dur - 0.55, 1, E.out]]);
    const palp = piscadas(lt, [1.45]) * (1 - ideia);
    pao(ctx, W * 0.5, H * 0.74, 560, {
      achata: respira(lt) - bate,
      olharX: lerp(leX, 0.05, ideia),
      olharY: lerp(0.45, -0.35, ideia),
      pupila: lerp(1, 1.15, ideia),
      palpE: palp, palpD: palp,
      oculos: OC,
      aro: "rgba(255,170,110,0.9)", aroForca: 0.35,
    }, lt);
    AMB.monitorCostas(ctx, W * 0.5, H * 0.78, 560, { brilho: 0.7 });
    AMB.caneca(ctx, W * 0.24, H * 0.83, 150, { carinha: true, cor: "#1E1E1C", vapor: 1, t: lt });
    ctx.fillStyle = "#2B2B2B";
    ctx.fillRect(W * 0.78, H * 0.79, 220, 30); ctx.fillStyle = "#7B1E16"; ctx.fillRect(W * 0.79, H * 0.76, 200, 30);
    ctx.restore();
    vinheta(ctx, 0.55);
  };

  // 003–005: insertos do compositor (escreve, apaga, reformula)
  const T1 = "Olá, eu sou o PAÓ. Vamos criar um post novo hoje?";
  const T2 = "Olá, eu sou o PAÓ. É hora de postar algo criativo!";
  const T3 = "Olá, eu sou o PAÓ. Tenho uma ideia legal para compartilhar!";
  CENAS.q003 = function (ctx, lt, dur) {
    K.chat(ctx, lt, { texto: T1, n: digita(lt, 0.15, 34, T1), z: key(lt, [[0, 1], [dur, 1.04]]) });
  };
  CENAS.q004 = function (ctx, lt, dur) {
    // apaga de trás pra frente e fica o cursor piscando
    K.chat(ctx, lt, { texto: T1, n: T1.length - clamp(lt * 160, 0, T1.length), z: 1.04 });
  };
  CENAS.q005 = function (ctx, lt, dur) {
    K.chat(ctx, lt, { texto: T2, n: digita(lt, 0.1, 36, T2), z: key(lt, [[0, 1.04], [dur, 1.08]]) });
  };
  // 006: o PAÓ no notebook, com a mensagem reformulada ao lado
  CENAS.q006 = function (ctx, lt, dur) {
    radial(ctx, W * 0.7, H * 0.4, W * 0.8, [[0, "#E9F7FF"], [1, "#9ACFEF"]]);
    AMB.mesa(ctx, H * 0.78, "#FFFFFF", "#E7EEF3");
    // balão do compositor
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1], [dur, 1.05]]), ox: W * 0.6 });
    const bx = W * 0.36, by = H * 0.12, bw = W * 0.6, bh = H * 0.56;
    rr(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = linear(ctx, 0, by, 0, by + bh, [[0, "#BDE7FF"], [1, "#5DB7F2"]]);
    ctx.shadowColor = "rgba(30,120,200,0.4)"; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0;
    rr(ctx, bx + 60, by + 60, bw - 120, bh * 0.5, 50); ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.fill();
    K.avatar(ctx, bx + 90, by + 60 + bh * 0.25 - 55, 110, lt);
    const n = digita(lt, 0.2, 32, T3);
    const ls = K.linhas(ctx, T3, 46, bw - 360);
    let c = 0;
    ls.forEach((l, i) => { const p = T3.slice(0, n).slice(c, c + l.length); c += l.length + 1; if (p) texto(ctx, p, bx + 230, by + 145 + i * 56, 46, { cor: "#16294A" }); });
    const ap = key(lt, [[dur - 0.55, 0], [dur - 0.45, 1, E.out], [dur - 0.25, 0, E.out]]);
    const ex = bx + bw - 360, ey = by + bh - 150 + ap * 6;
    rr(ctx, ex, ey, 270, 90, 45); ctx.fillStyle = "#fff"; ctx.fill();
    texto(ctx, "ENVIAR", ex + 135, ey + 47, 42, { peso: 900, cor: "#1F7FD1", alinha: "center", base: "middle", esp: 2 });
    ctx.restore();
    // PAÓ 3/4 com notebook (asas digitando)
    const dig = Math.sin(lt * 22);
    const pisc = piscadas(lt, [0.6]);
    pao(ctx, W * 0.2, H * 1.05, 700, {
      vira: 0.45, olharX: 0.85, olharY: 0.1, oculos: OC,
      palpE: pisc, palpD: pisc,
      asaD: { x: 0.52 + dig * 0.02, y: -0.36 - Math.max(0, dig) * 0.03 },
      achata: respira(lt),
    }, lt);
    // notebook
    ctx.save();
    ctx.translate(W * 0.37, H * 0.86);
    ctx.fillStyle = "#2B2D33";
    ctx.beginPath(); ctx.moveTo(-160, 0); ctx.lineTo(220, 0); ctx.lineTo(250, 40); ctx.lineTo(-190, 40); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(-40, -230); ctx.lineTo(150, -200); ctx.lineTo(220, 0); ctx.closePath();
    ctx.fillStyle = "#3A3D44"; ctx.fill();
    ctx.restore();
    AMB.caneca(ctx, W * 0.05, H * 0.95, 140, { cor: "#1E1E1C", faixa: "#B7261A" });
  };

  // 007–008: o olhar do criador; plano de mesa em 3/4, digitando rápido
  CENAS.q007 = function (ctx, lt, dur) {
    const z = key(lt, [[0, 1.25], [dur, 1.0, E.io]]);
    const flash = key(lt, [[dur - 0.25, 0], [dur, 1, E.in]]);
    ctx.save();
    cam(ctx, { z, ox: W * 0.45, oy: H * 0.5 });
    radial(ctx, W * 0.65, H * 0.4, W * 0.7, [[0, "#6A2A40"], [1, "#1E0E1A"]]);
    AMB.mesa(ctx, H * 0.76, "#B78A70", "#5A3A2E");
    const dig = Math.sin(lt * 26);
    pao(ctx, W * 0.36, H * 0.95, 640, {
      vira: 0.4, olharX: 0.95, olharY: 0.15, pupila: 1.05, oculos: OC,
      asaD: { x: 0.5 + dig * 0.02, y: -0.3 - Math.max(0, dig) * 0.04 },
      aro: "rgba(200,225,255,0.9)", aroForca: 0.4,
      achata: 1 - Math.abs(dig) * 0.006,
    }, lt);
    AMB.teclado(ctx, W * 0.58, H * 0.86, 420, lt, 1);
    // monitor de 3/4 (tela pra ele)
    ctx.save();
    ctx.translate(W * 0.72, H * 0.78);
    ctx.fillStyle = "#1B1C1A";
    rr(ctx, -20, -60, 40, 120, 8); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 60, 120, 20, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-230, -420); ctx.lineTo(170, -470); ctx.lineTo(200, -60); ctx.lineTo(-230, -40); ctx.closePath();
    ctx.fillStyle = "#2B2C29"; ctx.fill();
    ctx.restore();
    radial(ctx, W * 0.62, H * 0.45, W * 0.3, [[0, `rgba(200,225,255,${0.35 + flash * 0.6})`], [1, "rgba(0,0,0,0)"]]);
    AMB.caneca(ctx, W * 0.12, H * 0.88, 140, { cor: "#B7261A", vapor: 0.8, t: lt });
    ctx.restore();
    vinheta(ctx, 0.5);
    AMB.flash(ctx, flash * 0.95, "235,240,255");
  };

  // ── BLOCO 02 · O universo das redes (009–015) ───────────────────────────
  // 009–010: a central na penumbra acende em etapas; painéis com atraso
  CENAS.q009 = function (ctx, lt, dur) {
    const l1 = key(lt, [[0.25, 0], [0.55, 1, E.out]]); // aro do chão
    const l2 = key(lt, [[0.75, 0], [1.05, 1, E.out]]); // tigela
    const l3 = key(lt, [[1.25, 0], [1.6, 1, E.out]]); // ambiente
    const z = key(lt, [[0, 1.0], [dur, 1.35, E.io]]);
    const fl = key(lt, [[0, 0.9], [0.3, 0, E.out]]);
    ctx.save();
    cam(ctx, { z, oy: H * 0.55 });
    radial(ctx, W / 2, H * 0.6, W * 0.8, [[0, K.mistura("#2A1414", "#8A5A4A", l3)], [0.6, K.mistura("#140A0A", "#4A2A22", l3)], [1, "#050303"]]);
    // aro do chão
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * l1;
    ctx.strokeStyle = "#FF9A70"; ctx.lineWidth = 6; ctx.shadowColor = "#FF7A4A"; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.8, W * 0.36, H * 0.07, 0, 0, 7); ctx.stroke();
    ctx.restore();
    // tigela / console
    const cy = H * 0.66;
    ctx.beginPath(); ctx.ellipse(W / 2, cy, 330, 70, 0, 0, Math.PI);
    ctx.quadraticCurveTo(W / 2 - 200, cy + 220, W / 2, cy + 230);
    ctx.quadraticCurveTo(W / 2 + 200, cy + 220, W / 2 + 330, cy);
    ctx.fillStyle = K.mistura("#3A2A24", "#F0DCCB", l2); ctx.fill();
    // PAÓ dentro, atrás do notebook
    pao(ctx, W / 2, cy + 40, 230, { oculos: OC, olharY: -0.3 + l3 * 0.2, pupila: 1 + l3 * 0.15, sombra: 0 }, lt);
    ctx.beginPath(); ctx.ellipse(W / 2, cy, 330, 70, 0, 0, 7);
    ctx.fillStyle = K.mistura("#4A3A34", "#FFF2E6", l2); ctx.fill();
    ctx.fillStyle = "#2A2B28"; rr(ctx, W / 2 - 80, cy - 70, 160, 70, 8); ctx.fill();
    // painéis com atraso entre si
    const pans = [
      [W * 0.36, H * 0.33, "grafico", "#B3261A", 1.5],
      [W * 0.6, H * 0.22, "coracao", "#C2281B", 1.7],
      [W * 0.47, H * 0.38, "comentario", "#3B3532", 1.9],
      [W * 0.63, H * 0.4, "seta", "#B3261A", 2.1],
    ];
    for (const [x, y, tp, cor, t0] of pans) {
      const k = clamp(mola(lt, t0, 0, 1, "brincalhona"), 0, 1.3);
      const kv = ate(lt, t0 - 0.05, t0 + 0.15);
      if (kv <= 0) {
        // penumbra: só uma luzinha vermelha
        ctx.beginPath(); ctx.arc(x, y + 60, 6, 0, 7); ctx.fillStyle = `rgba(255,80,60,${0.6 - l3 * 0.5})`; ctx.fill();
        continue;
      }
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      AMB.tile(ctx, 0, 0, 170, 140, cor, (c) => {
        if (tp === "grafico") AMB.grafico(c, 0, 0, 90, "#FFE9E2");
        else if (tp === "seta") AMB.seta(c, 0, 0, 90, "#FFE9E2");
        else { c.save(); c.translate(-36, -36); c.scale(1.5, 1.5); c.fillStyle = "#FFE9E2"; c.fill(K.GLIFO[tp]); c.restore(); }
      }, kv);
      ctx.restore();
    }
    // a bola de luz no alto
    const lb = key(lt, [[0.4, 0.2], [0.7, 1, E.out]]);
    ctx.beginPath(); ctx.arc(W / 2, H * 0.17, 55, 0, 7);
    ctx.fillStyle = `rgba(255,240,230,${lb})`; ctx.shadowColor = "#FF6A4A"; ctx.shadowBlur = 60 * lb; ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
    vinheta(ctx, 0.6);
    AMB.flash(ctx, fl, "235,240,255");
  };

  // 011–013: o universo das redes; tiles se organizam; câmera abre
  CENAS.q011 = function (ctx, lt, dur) {
    const z = key(lt, [[0, 1.3], [dur, 1.0, E.io]]);
    ctx.save();
    cam(ctx, { z, oy: H * 0.45 });
    AMB.bege(ctx, lt, { chao: 0.72 });
    const tiles = [
      ["coracao", W * 0.32, H * 0.22, 0.0],
      ["comentario", W * 0.45, H * 0.2, 0.12],
      ["compartilhar", W * 0.58, H * 0.2, 0.24],
      ["grafico", W * 0.3, H * 0.42, 0.36],
      ["play", W * 0.66, H * 0.42, 0.48],
    ];
    for (const [tp, x, y, d] of tiles) {
      const k = clamp(mola(lt, 0.1 + d, 0, 1, "brincalhona"), 0, 1.3);
      const fl = Math.sin(lt * 1.6 + d * 9) * 6;
      if (k <= 0.01) continue;
      ctx.save(); ctx.translate(x, y + fl); ctx.scale(k, k);
      AMB.tileEscuro(ctx, tp, 0, 0, 120, clamp(k));
      ctx.restore();
    }
    // tigela branca com o PAÓ
    const cy = H * 0.66;
    pao(ctx, W / 2, cy + 30, 250, {
      oculos: OC, olharX: key(lt, [[0, -0.6], [0.6, 0.6, E.io], [1.4, -0.2, E.io], [2.1, 0.3]]), olharY: -0.6,
      pupila: 1.1, bico: key(lt, [[1.2, 0], [1.5, 0.4, E.out]]), sombra: 0,
      palpE: piscadas(lt, [1.0]), palpD: piscadas(lt, [1.0]),
    }, lt);
    ctx.fillStyle = "#2A2B28"; rr(ctx, W / 2 - 90, cy - 55, 180, 70, 10); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W / 2, cy, 360, 60, 0, 0, Math.PI);
    ctx.quadraticCurveTo(W / 2 - 220, cy + 210, W / 2, cy + 220);
    ctx.quadraticCurveTo(W / 2 + 220, cy + 210, W / 2 + 360, cy);
    ctx.fillStyle = linear(ctx, 0, cy, 0, cy + 220, [[0, "#FFF6EE"], [1, "#E7D2BF"]]); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W / 2, cy, 360, 60, 0, 0, Math.PI * 2); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 10; ctx.stroke();
    AMB.caneca(ctx, W * 0.38, cy - 5, 60, { cor: "#B7261A" });
    ctx.restore();
    vinheta(ctx, 0.25, "120,70,40");
  };

  // 014: entusiasmo em close
  CENAS.q014 = function (ctx, lt, dur) {
    AMB.bege(ctx, lt);
    const ab = mola(lt, 0.15, 0, 1, "brincalhona");
    pao(ctx, W / 2, H * 2.05, 2300, {
      oculos: OC, pupila: lerp(1, 1.3, clamp(ab)), bico: clamp(ab) * 0.9,
      olharY: -0.2, achata: lerp(1, 1.03, clamp(ab)),
      palpE: piscada(lt, dur - 0.35), palpD: piscada(lt, dur - 0.35),
    }, lt);
  };

  // 015: notificações de várias redes passam em fluxo
  CENAS.q015 = function (ctx, lt, dur) {
    radial(ctx, W * 0.6, H * 0.4, W * 0.9, [[0, "#FFF3EC"], [1, "#E8CFC8"]]);
    const redes = [["x", [4, 2, 1]], ["fb", [6, 4, 1]], ["in", [8, 5, 2]], ["yt", [24, 16, 3]], ["tt", [12, 8, 2]], ["ig", [12, 5, 1]], ["x", [9, 3, 2]], ["ig", [15, 6, 3]]];
    const fluxo = lt * 0.9;
    for (let i = redes.length - 1; i >= 0; i--) {
      const p = i - fluxo + 1.4; // posição no fluxo (0 = embaixo, perto da câmera)
      if (p < -1.2 || p > 7) continue;
      const k = 1.35 / (1 + Math.max(0, p) * 0.22);
      const x = W * 0.6 + p * 130 * k + 60, y = H * 0.86 - p * 125 * k;
      const w = 1000 * k, h = 170 * k;
      ctx.save();
      ctx.translate(x, y);
      ctx.transform(1, -0.08, 0.35, 1, 0, 0);
      ctx.globalAlpha = clamp(1.6 - Math.abs(p - 2.2) * 0.28);
      rr(ctx, -w / 2, -h / 2, w, h, h * 0.25);
      ctx.fillStyle = "#FFFFFF"; ctx.shadowColor = "rgba(120,60,40,0.25)"; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
      AMB.rede(ctx, redes[i][0], -w / 2 + h * 0.62, 0, h * 0.7);
      K.metricas(ctx, -w / 2 + h * 1.3, 0, h * 0.36, redes[i][1], "#1C1C1C");
      ctx.restore();
    }
    // PAÓ de costas/perfil olhando o fluxo
    pao(ctx, W * 0.17, H * 1.04, 620, { vira: 0.85, olharX: 1, olharY: -0.5, oculos: OC, pupila: 1.15 }, lt);
  };

  // ── BLOCO 03 · Ritmo de criação (016–017) ───────────────────────────────
  CENAS.q016 = function (ctx, lt, dur) {
    const k = ate(lt, 0, dur);
    const z = lerp(1, 1.45, E.io(k));
    ctx.save();
    cam(ctx, { z, oy: H * 0.62 });
    radial(ctx, W / 2, H * 0.5, W * 0.8, [[0, "#FFF1F0"], [0.7, "#F6D9DA"], [1, "#E3B8BC"]]);
    // feixe de luz
    ctx.fillStyle = linear(ctx, W / 2 - 60, 0, W / 2 + 60, 0, [[0, "rgba(150,200,255,0)"], [0.5, "rgba(150,200,255,0.65)"], [1, "rgba(150,200,255,0)"]]);
    ctx.beginPath(); ctx.moveTo(W / 2 - 40, 0); ctx.lineTo(W / 2 + 40, 0); ctx.lineTo(W / 2 + 90, H * 0.6); ctx.lineTo(W / 2 - 90, H * 0.6); ctx.fill();
    // linhas curvas vermelhas
    ctx.strokeStyle = "rgba(220,60,60,0.45)"; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(W / 2, H * 0.9, W * (0.55 + i * 0.06), H * (0.55 + i * 0.05), 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke(); }
    // palco
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.74, 420, 70, 0, 0, 7); ctx.fillStyle = "#FBE9E6"; ctx.fill();
    ctx.strokeStyle = "rgba(230,90,90,0.5)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.74, 380, 58, 0, 0, 7); ctx.stroke();
    // piano de cauda (silhueta estilizada)
    ctx.save(); ctx.translate(W / 2, H * 0.68);
    ctx.fillStyle = "#1A1A1C";
    ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, 0); ctx.lineTo(210, -30); ctx.bezierCurveTo(200, -90, 140, -110, 60, -120); ctx.bezierCurveTo(0, -125, -20, -160, -60, -170); ctx.lineTo(-200, -60); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-60, -170); ctx.lineTo(60, -280); ctx.lineTo(80, -260); ctx.lineTo(-30, -150); ctx.fill();
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-195, -12, 390, 18);
    ctx.fillStyle = "#111"; for (let i = 0; i < 26; i++) if (i % 7 !== 2 && i % 7 !== 6) ctx.fillRect(-190 + i * 15, -12, 8, 10);
    ctx.fillRect(-180, 0, 14, 70); ctx.fillRect(166, 0, 14, 70);
    // partitura
    ctx.save(); ctx.translate(-10, -170); ctx.rotate(-0.08);
    rr(ctx, -70, -60, 140, 90, 6); ctx.fillStyle = "#FFF8EC"; ctx.fill();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-60, -40 + i * 12); ctx.lineTo(60, -40 + i * 12); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
    // notas flutuando com leveza
    for (let i = 0; i < 7; i++) {
      const a = lt * 0.5 + i * 0.9;
      const x = W / 2 + Math.cos(a) * (520 + i * 30), y = H * 0.45 + Math.sin(a) * 160 - i * 10;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(lt * 2 + i) * 0.2);
      ctx.fillStyle = "#151515";
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, -0.4, 0, 7); ctx.fill();
      ctx.fillRect(12, -64, 6, 64);
      if (i % 2) { ctx.beginPath(); ctx.moveTo(18, -64); ctx.quadraticCurveTo(40, -50, 30, -30); ctx.lineWidth = 6; ctx.strokeStyle = "#151515"; ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
  };

  // ── BLOCO 04 · Algo não responde (018–022) ──────────────────────────────
  const apagado = () => 0;
  CENAS.q018 = function (ctx, lt, dur) {
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1], [dur, 1.05]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    K.mesaRedonda(ctx, W / 2, H * 0.73, 620);
    const ol = key(lt, [[0, -0.7], [0.5, 0.7, E.io], [1.0, 0, E.io]]);
    pao(ctx, W / 2, H * 0.735, 250, { oculos: OC, olharX: ol, olharY: -0.6, aro: "rgba(255,150,70,0.8)", aroForca: 0.35, achata: respira(lt), palpE: piscadas(lt, [1.1]), palpD: piscadas(lt, [1.1]) }, lt);
    ctx.restore();
    vinheta(ctx, 0.35);
  };
  CENAS.q019 = function (ctx, lt, dur) {
    ctx.save();
    cam(ctx, { x: key(lt, [[0, 80], [dur, -80, E.lin]]), z: 1.1 });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.3, tam: 230, xs: [0.16, 0.36, 0.58, 0.8] });
    K.mesaRedonda(ctx, W / 2, H * 0.8, 900, { haste: false });
    ctx.restore();
    vinheta(ctx, 0.4);
  };
  CENAS.q020 = function (ctx, lt, dur) {
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1.0], [dur, 1.08]]), ox: W * 0.55 });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.17 });
    K.mesaRedonda(ctx, W * 0.55, H * 0.75, 880, { haste: false });
    K.balao(ctx, W * 0.5, H * 0.52, 300, 0);
    const inclina = key(lt, [[0.2, 0], [0.6, -0.08, E.out]]);
    pao(ctx, W * 0.7, H * 0.78, 300, { vira: -0.45, olharX: -0.9, olharY: -0.1, oculos: OC, giro: inclina, palpE: piscadas(lt, [0.9]), palpD: piscadas(lt, [0.9]), aro: "rgba(255,150,70,0.8)", aroForca: 0.3 }, lt);
    ctx.restore();
    vinheta(ctx, 0.35);
  };
  // 021: o olhar encontra o problema ANTES das asas irem às bochechas
  CENAS.q021 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado, { y: H * 0.25, tam: 160, xs: [0.06, 0.18, 0.84, 0.94] });
    const sus = key(lt, [[0.2, 0], [0.32, 1, E.out]]);
    const asas = key(lt, [[0.45, 0], [0.72, 1, E.back]]);
    const ponta = (s) => ({ x: lerp(s * 0.62, s * 0.36, asas), y: lerp(-0.2, -0.62, asas) });
    pao(ctx, W / 2, H * 1.22, 1020, {
      oculos: OC, pupila: lerp(1, 0.72, sus), palpE: 0, palpD: 0, bico: sus * 0.85,
      olharX: key(lt, [[0, 0.5], [0.2, 0, E.out]]), olharY: lerp(0.1, -0.15, sus),
      achata: 1 + sus * 0.03 + Math.sin(lt * 40) * 0.003 * sus,
      asaE: asas > 0.02 ? ponta(-1) : null, asaD: asas > 0.02 ? ponta(1) : null,
    }, lt);
    vinheta(ctx, 0.35);
  };
  // 022: consulta ao relatório
  CENAS.q022 = function (ctx, lt, dur) {
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1.08], [dur, 1.0]]) });
    K.salaLaranja(ctx, lt);
    K.iconesParede(ctx, lt, apagado);
    K.mesaRedonda(ctx, W / 2, H * 0.73, 680);
    const le = key(lt, [[0, -0.6], [0.4, 0.4, E.out], [0.8, -0.5, E.out], [1.2, 0.3, E.out]]);
    pao(ctx, W * 0.53, H * 0.745, 300, {
      oculos: OC, vira: -0.15, olharX: le * 0.7 - 0.3, olharY: 0.7,
      asaE: { x: -0.5, y: -0.36 }, asaD: { x: -0.05, y: -0.4 },
      aro: "rgba(255,150,70,0.8)", aroForca: 0.3,
    }, lt);
    // o papel do relatório
    ctx.save(); ctx.translate(W * 0.49, H * 0.6); ctx.rotate(-0.12);
    rr(ctx, -95, -60, 190, 130, 6); ctx.fillStyle = "#FFFDF8"; ctx.fill();
    K.fotoPorDoSol(ctx, -80, -48, 70, 50, 4);
    ctx.fillStyle = "#C9C2BA"; for (let i = 0; i < 5; i++) ctx.fillRect(0, -44 + i * 16, 70 - (i % 2) * 20, 6);
    AMB.grafico(ctx, -45, 35, 40, "#B3261A");
    ctx.restore();
    ctx.restore();
    vinheta(ctx, 0.35);
  };

  // ── BLOCO 05 · O post teve pouco alcance (023) ──────────────────────────
  CENAS.q023 = function (ctx, lt, dur) {
    K.salaLaranja(ctx, lt, { cordoes: false });
    radial(ctx, W * 0.15, H * 0.4, W * 0.4, [[0, "rgba(255,210,140,0.5)"], [1, "rgba(0,0,0,0)"]]);
    ctx.save();
    cam(ctx, { z: key(lt, [[0, 1.0], [dur, 1.04]]), x: key(lt, [[0, 10], [dur, -10]]) });
    ctx.translate(W * 0.55, H * 0.55);
    ctx.transform(1, -0.12, 0.25, 0.95, 0, 0);
    K.cardPost(ctx, 0, 0, 980, { v: [2, 0, 0] });
    ctx.restore();
    vinheta(ctx, 0.3);
  };

  // ── BLOCO 06 · Possibilidades guardadas (024) ───────────────────────────
  function bau(ctx, x, y, s, cor = "#D9A21E") {
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -s * 0.5, -s * 0.35, s, s * 0.55, s * 0.06); ctx.fillStyle = "#A8241A"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.33); ctx.quadraticCurveTo(0, -s * 0.75, s * 0.5, -s * 0.33); ctx.closePath(); ctx.fillStyle = "#C2301E"; ctx.fill();
    ctx.fillStyle = cor;
    for (const fx of [-0.5, -0.06, 0.38]) ctx.fillRect(fx * s, -s * 0.55, s * 0.12, s * 0.75);
    ctx.fillRect(-s * 0.5, -s * 0.36, s, s * 0.07);
    rr(ctx, -s * 0.09, -s * 0.28, s * 0.18, s * 0.2, 6); ctx.fillStyle = "#FFE07A"; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.03, 0, 7); ctx.fillStyle = "#6A3A08"; ctx.fill();
    ctx.restore();
  }
  CENAS.q024 = function (ctx, lt, dur) {
    ctx.save();
    cam(ctx, { x: key(lt, [[0, 120], [dur, -120, E.lin]]), z: 1.06 });
    ctx.fillStyle = linear(ctx, 0, 0, 0, H, [[0, "#8FD3FF"], [0.6, "#E6F6FF"], [1, "#FFFFFF"]]);
    ctx.fillRect(-W, 0, W * 3, H);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(W * (0.1 + i * 0.22), H * (0.2 + (i % 2) * 0.06), 160, 50, 0, 0, 7); ctx.fill(); }
    // arco branco
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 60;
    ctx.beginPath(); ctx.ellipse(W * 0.5, H * 1.1, W * 0.5, H * 0.95, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    // cristais azuis
    for (let i = 0; i < 40; i++) {
      const x = -W * 0.3 + i * 70, y = H * 0.78 + rnd(i) * H * 0.25, s = 60 + rnd(i, 2) * 90;
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.45, y); ctx.lineTo(x, y + s * 0.3); ctx.lineTo(x - s * 0.45, y); ctx.closePath();
      ctx.fillStyle = ["#1E78E0", "#3FA2FF", "#0F5BC4"][i % 3]; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.45, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fill();
    }
    bau(ctx, W * 0.28, H * 0.62, 90);
    bau(ctx, W * 0.48, H * 0.6, 180);
    bau(ctx, W * 0.8, H * 0.72, 460);
    ctx.restore();
  };
})();
