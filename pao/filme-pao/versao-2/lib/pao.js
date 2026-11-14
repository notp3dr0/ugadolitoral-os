// Rig do PAÓ em canvas 2D. Medidas tiradas de referencias/pao-identidade.png
// (largura do corpo = 1 unidade; origem = chão, no meio dos pés; y negativo pra cima).
// Peças separadas e controláveis: corpo, peito, asas, pés, olhos (anel, branco,
// pupila, brilho, pálpebras), bico, óculos, lágrimas. Nada é imagem.
(function () {
  const { clamp, lerp } = M;
  const COR = {
    corpo: "#242621",
    corpoLuz: "#3B3D37",
    corpoSombra: "#121310",
    vermelho: "#A62317",
    vermelhoLuz: "#C93A25",
    vermelhoSombra: "#6F150C",
    branco: "#FFFFFF",
    pupila: "#1A1B17",
    bicoCima: "#45473F",
    boca: "#3A0B07",
    lingua: "#E0605A",
    bege: "#F2E5D5",
    lagrima: "#7FD0FF",
  };

  const NEUTRA = {
    giro: 0, // inclinação do corpo (rad), pivô nos pés
    achata: 1, // squash/stretch (volume preservado)
    y: 0, // pulo / afundar (unidades)
    vira: 0, // -1..1 rosto vira (3/4, perfil, costas)
    rosto: 1, // opacidade do rosto (0 = de costas)
    olharX: 0, olharY: 0, // -1..1
    pupila: 1,
    palpE: 0, palpD: 0, // pálpebra de cima 0..1
    baixa: 0, // pálpebra de baixo 0..1
    feliz: 0, // olho ∩
    incl: 0, // inclinação da pálpebra (graus): + triste, − determinado
    aperta: 0, // olhos espremidos (>_<)
    bico: 0, // 0 fechado .. 1 aberto
    asaE: null, asaD: null, // alvo da ponta da asa {x,y} (unidades) ou null = repouso
    asaEang: 0, asaDang: 0, // em repouso: graus que a asa sobe
    passo: 0, anda: 0, // fase e amplitude da caminhada
    oculos: 0, // 0 sem, 1 com
    oculosY: 0, oculosX: 0, oculosRot: 0,
    reflexo: 0, // brilho quente nas lentes (047)
    lagrima: 0, // 0..1
    tLagrima: 0, // tempo pra animar o escorrer
    pelucia: 0, // fantasia (textura de pelúcia)
    aro: null, // cor do contorno de luz (rim light)
    aroForca: 0.5,
    sombra: 1,
  };

  // contorno do corpo (uma peça: cabeça e corpo, como na identidade)
  function corpoPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -1.165);
    ctx.bezierCurveTo(0.22, -1.165, 0.44, -1.145, 0.48, -0.93);
    ctx.bezierCurveTo(0.515, -0.7, 0.505, -0.45, 0.43, -0.26);
    ctx.bezierCurveTo(0.37, -0.12, 0.22, -0.085, 0, -0.085);
    ctx.bezierCurveTo(-0.22, -0.085, -0.37, -0.12, -0.43, -0.26);
    ctx.bezierCurveTo(-0.505, -0.45, -0.515, -0.7, -0.48, -0.93);
    ctx.bezierCurveTo(-0.44, -1.145, -0.22, -1.165, 0, -1.165);
    ctx.closePath();
  }

  function peitoPath(ctx, dx) {
    ctx.beginPath();
    ctx.moveTo(dx - 0.093, -0.607);
    ctx.bezierCurveTo(dx - 0.16, -0.56, dx - 0.26, -0.55, dx - 0.33, -0.5);
    ctx.bezierCurveTo(dx - 0.41, -0.44, dx - 0.425, -0.33, dx - 0.41, -0.24);
    ctx.bezierCurveTo(dx - 0.39, -0.12, dx - 0.22, -0.095, dx, -0.095);
    ctx.bezierCurveTo(dx + 0.22, -0.095, dx + 0.39, -0.12, dx + 0.41, -0.24);
    ctx.bezierCurveTo(dx + 0.425, -0.33, dx + 0.41, -0.44, dx + 0.33, -0.5);
    ctx.bezierCurveTo(dx + 0.26, -0.55, dx + 0.16, -0.56, dx + 0.093, -0.607);
    ctx.lineTo(dx, -0.525);
    ctx.closePath();
  }

  function grad(ctx, x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }

  // asa: oval gordo do ombro (pivô) até a ponta
  function asa(ctx, px, py, tx, ty, larg, pel) {
    const dx = tx - px, dy = ty - py;
    const L = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate((px + tx) / 2, (py + ty) / 2);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, L / 2 + larg * 0.25, larg / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad(ctx, -L * 0.1, -larg * 0.25, L * 0.8, [
      [0, pel ? "#3E403A" : COR.corpoLuz],
      [0.6, COR.corpo],
      [1, COR.corpoSombra],
    ]);
    ctx.fill();
    ctx.restore();
  }

  // óculos: armação preta redonda por cima dos anéis vermelhos (objeto separado)
  function oculos(ctx, x, y, esc = 1, rot = 0, vira = 0, reflexo = 0, hastes = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(esc, esc);
    const rx = 0.2, ry = 0.235, dx = 0.246;
    const lw = 0.03;
    ctx.lineWidth = lw;
    ctx.strokeStyle = "#0E0F0D";
    for (const s of [-1, 1]) {
      const k = 1 - 0.4 * clamp(vira * s);
      ctx.beginPath();
      ctx.ellipse(s * dx * (1 - 0.25 * Math.abs(vira)) + vira * 0.3, 0, rx * k, ry, 0, 0, Math.PI * 2);
      if (reflexo > 0) {
        ctx.fillStyle = `rgba(255,170,70,${0.32 * reflexo})`;
        ctx.fill();
      }
      ctx.stroke();
    }
    // ponte
    ctx.beginPath();
    const cx = vira * 0.3;
    ctx.moveTo(cx - 0.06, -0.06);
    ctx.quadraticCurveTo(cx, -0.1, cx + 0.06, -0.06);
    ctx.stroke();
    // hastes
    if (hastes) {
      for (const s of [-1, 1]) {
        const ex = s * dx * (1 - 0.25 * Math.abs(vira)) + vira * 0.3 + s * rx * (1 - 0.4 * clamp(vira * s));
        ctx.beginPath();
        ctx.moveTo(ex, -0.02);
        ctx.lineTo(ex + s * 0.07, 0.0);
        ctx.stroke();
      }
    }
    // brilho de lente
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 0.012;
    for (const s of [-1, 1]) {
      const ox = s * dx * (1 - 0.25 * Math.abs(vira)) + vira * 0.3;
      ctx.beginPath();
      ctx.arc(ox - 0.06, -0.08, 0.1, Math.PI * 1.05, Math.PI * 1.35);
      ctx.stroke();
    }
    ctx.restore();
  }

  function olho(ctx, cx, cy, kx, P, lado, t) {
    const rxA = 0.167 * kx, ryA = 0.21; // anel vermelho
    const rx = 0.133 * kx, ry = 0.174; // branco
    // anel
    ctx.beginPath();
    ctx.ellipse(cx, cy, rxA, ryA, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad(ctx, cx - rxA * 0.3, cy - ryA * 0.4, ryA * 1.3, [
      [0, COR.vermelhoLuz],
      [0.7, COR.vermelho],
      [1, COR.vermelhoSombra],
    ]);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = grad(ctx, cx - rx * 0.2, cy - ry * 0.3, ry * 1.2, [
      [0, "#FFFFFF"],
      [0.8, "#F7F4F0"],
      [1, "#DCD6CF"],
    ]);
    ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    // pupila (some no feliz e no espremido)
    const pk = P.pupila * Math.max(0, 1 - P.feliz) * (1 - P.aperta);
    if (pk > 0.01) {
      const px = cx + P.olharX * 0.07 * kx + 0.012 * (lado === "E" ? 1 : -1);
      const py = cy + P.olharY * 0.075;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(pk * kx, pk);
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.06, 0.094, 0, 0, Math.PI * 2);
      ctx.fillStyle = COR.pupila;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.012, -0.05, 0.019, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.02, 0.035, 0.008, 0, Math.PI * 2);
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.restore();
    }
    // pálpebras
    const sinal = lado === "E" ? -1 : 1;
    const feliz = P.feliz;
    const palp = Math.max(lado === "E" ? P.palpE : P.palpD, feliz * 0.56, P.aperta);
    const baixa = Math.max(P.baixa, feliz * 0.56, P.aperta * 0.5);
    const yC = cy - ry - 0.01 + palp * (2 * ry + 0.02);
    const curva = 0.025 - feliz * 0.21;
    ctx.fillStyle = grad(ctx, cx, cy - ry, ry * 2.2, [[0, COR.corpoLuz], [1, COR.corpo]]);
    ctx.save();
    ctx.translate(cx, yC);
    ctx.rotate((P.incl * sinal * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-rx - 0.05, -ry * 3);
    ctx.lineTo(rx + 0.05, -ry * 3);
    ctx.lineTo(rx + 0.05, 0);
    ctx.quadraticCurveTo(0, curva, -rx - 0.05, 0);
    ctx.closePath();
    ctx.fill();
    // borda escura da pálpebra (leitura do gesto)
    if (palp > 0.06 && palp < 0.97 && feliz < 0.3) {
      ctx.beginPath();
      ctx.moveTo(rx + 0.05, 0);
      ctx.quadraticCurveTo(0, curva, -rx - 0.05, 0);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 0.012;
      ctx.stroke();
    }
    ctx.restore();
    const yB = cy + ry + 0.01 - baixa * (2 * ry + 0.02);
    const arco = 0.02 + feliz * 0.06 + P.aperta * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx - rx - 0.05, cy + ry * 3);
    ctx.lineTo(cx - rx - 0.05, yB + arco * 0.6);
    ctx.quadraticCurveTo(cx, yB - arco, cx + rx + 0.05, yB + arco * 0.6);
    ctx.lineTo(cx + rx + 0.05, cy + ry * 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // espremido: risquinhos >_<
    if (P.aperta > 0.5) {
      ctx.save();
      ctx.strokeStyle = "rgba(10,10,10,0.85)";
      ctx.lineWidth = 0.028;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.7, cy - 0.03 * sinal * 0);
      ctx.quadraticCurveTo(cx, cy + 0.05, cx + rx * 0.7, cy);
      ctx.stroke();
      ctx.restore();
    }
  }

  function lagrimas(ctx, cx, cy, P, t) {
    if (P.lagrima <= 0.01) return;
    const k = P.lagrima;
    for (const s of [-1, 1]) {
      const ex = cx + s * 0.246 * (1 - 0.25 * Math.abs(P.vira)) + P.vira * 0.3 + s * 0.03;
      const y0 = cy + 0.13;
      const desce = (t * 0.25 + (s > 0 ? 0.3 : 0)) % 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.5);
      // poça na borda da pálpebra
      ctx.beginPath();
      ctx.ellipse(ex, y0, 0.11 * k, 0.03 * k, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(160,220,255,0.85)";
      ctx.fill();
      // filete escorrendo
      ctx.beginPath();
      ctx.moveTo(ex + s * 0.07, y0);
      ctx.quadraticCurveTo(ex + s * 0.1, y0 + 0.12 * k, ex + s * 0.08, y0 + 0.22 * k);
      ctx.lineWidth = 0.035 * k;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(127,208,255,0.9)";
      ctx.stroke();
      // gota caindo
      const gy = y0 + 0.22 * k + desce * 0.25;
      ctx.globalAlpha *= 1 - desce;
      ctx.beginPath();
      ctx.ellipse(ex + s * 0.08, gy, 0.022 * k, 0.03 * k, 0, 0, Math.PI * 2);
      ctx.fillStyle = COR.lagrima;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + s * 0.075, gy - 0.008, 0.007, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.restore();
    }
  }

  function bico(ctx, dx, P) {
    const a = P.bico;
    const larg = 0.093 * (1 - 0.2 * Math.abs(P.vira));
    // boca aberta (interior + língua)
    if (a > 0.02) {
      ctx.beginPath();
      ctx.ellipse(dx, -0.585 + a * 0.03, larg * 0.85, 0.02 + a * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = COR.boca;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(dx, -0.56 + a * 0.06, larg * 0.5, 0.012 + a * 0.03, 0, 0, Math.PI * 2);
      ctx.fillStyle = COR.lingua;
      ctx.fill();
    }
    // parte de baixo (triângulo escuro que entra no peito), desce quando abre
    const d = a * 0.075;
    ctx.beginPath();
    ctx.moveTo(dx - larg, -0.607 + d);
    ctx.quadraticCurveTo(dx, -0.6 + d, dx + larg, -0.607 + d);
    ctx.quadraticCurveTo(dx + larg * 0.4, -0.55 + d, dx, -0.525 + d);
    ctx.quadraticCurveTo(dx - larg * 0.4, -0.55 + d, dx - larg, -0.607 + d);
    ctx.fillStyle = "#2B2D28";
    ctx.fill();
    // parte de cima (cúpula cinza)
    ctx.beginPath();
    ctx.moveTo(dx - larg, -0.607);
    ctx.bezierCurveTo(dx - larg * 0.9, -0.66, dx - larg * 0.5, -0.692, dx, -0.692);
    ctx.bezierCurveTo(dx + larg * 0.5, -0.692, dx + larg * 0.9, -0.66, dx + larg, -0.607);
    ctx.quadraticCurveTo(dx, -0.598, dx - larg, -0.607);
    ctx.fillStyle = grad(ctx, dx - 0.03, -0.68, 0.12, [[0, "#5A5C54"], [1, COR.bicoCima]]);
    ctx.fill();
  }

  // ponto de repouso da asa (ponta), por lado; ang sobe a asa
  function repouso(lado, ang) {
    const s = lado === "E" ? -1 : 1;
    const a = ((-70 + ang) * Math.PI) / 180; // -70° = caída, aberta pra fora
    const L = 0.33;
    return { x: s * (0.43 + Math.cos(a) * L * 0.55), y: -0.42 - Math.sin(a) * L };
  }

  function pao(ctx, x, y, s, pose, t = 0) {
    const P = Object.assign({}, NEUTRA, pose);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // sombra no chão
    if (P.sombra) {
      const alt = Math.min(0.6, Math.max(0, -P.y));
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.42 * (1 - alt * 0.6), 0.05, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.28 * (1 - alt) * P.sombra})`;
      ctx.filter = `blur(${Math.max(1, s * 0.015)}px)`;
      ctx.fill();
      ctx.restore();
    }
    ctx.translate(0, P.y);
    ctx.rotate(P.giro);
    const sy = P.achata, sx = 1 + (1 - sy) * 0.7;
    ctx.scale(sx, sy);
    // caminhada: balanço do corpo
    const bob = P.anda ? Math.abs(Math.sin(P.passo)) * 0.035 * P.anda : 0;
    const pel = P.pelucia;

    // pés
    for (const sd of [-1, 1]) {
      const fase = P.anda ? Math.max(0, Math.sin(P.passo + (sd > 0 ? Math.PI : 0))) * 0.06 * P.anda : 0;
      ctx.beginPath();
      ctx.ellipse(sd * 0.186 + P.vira * 0.05, -0.052 - fase, 0.092, 0.052, 0, 0, Math.PI * 2);
      ctx.fillStyle = COR.corpoSombra;
      ctx.fill();
    }
    ctx.translate(0, -bob);

    // asas: alvo ou repouso
    const pivo = (sd) => ({ x: sd * 0.43 - P.vira * 0.04, y: -0.44 });
    const alvos = {
      E: P.asaE || repouso("E", P.asaEang),
      D: P.asaD || repouso("D", P.asaDang),
    };
    const naFrente = (lado) => {
      const a = alvos[lado];
      return (P.asaE && lado === "E" && (a.x > -0.42 || P.asaFrente)) || (P.asaD && lado === "D" && (a.x < 0.42 || P.asaFrente));
    };
    for (const lado of ["E", "D"]) {
      if (naFrente(lado)) continue;
      const sd = lado === "E" ? -1 : 1;
      const p = pivo(sd);
      asa(ctx, p.x, p.y, alvos[lado].x, alvos[lado].y, 0.17, pel);
    }

    // corpo
    corpoPath(ctx);
    ctx.fillStyle = grad(ctx, -0.18, -0.95, 1.05, [
      [0, pel ? "#45473F" : COR.corpoLuz],
      [0.55, COR.corpo],
      [1, COR.corpoSombra],
    ]);
    ctx.fill();
    ctx.save();
    corpoPath(ctx);
    ctx.clip();

    // peito
    const dPeito = P.vira * 0.26;
    peitoPath(ctx, dPeito);
    ctx.fillStyle = grad(ctx, dPeito - 0.12, -0.5, 0.6, [
      [0, COR.vermelhoLuz],
      [0.55, COR.vermelho],
      [1, COR.vermelhoSombra],
    ]);
    ctx.fill();

    // rosto
    if (P.rosto > 0.01) {
      ctx.save();
      ctx.globalAlpha = P.rosto;
      const cy = -0.793;
      for (const lado of ["E", "D"]) {
        const sd = lado === "E" ? -1 : 1;
        const kx = 1 - 0.45 * clamp(P.vira * sd);
        const ex = sd * 0.246 * (1 - 0.25 * Math.abs(P.vira)) + P.vira * 0.3;
        olho(ctx, ex, cy, kx, P, lado, t);
      }
      bico(ctx, P.vira * 0.33, P);
      ctx.restore();
    }

    // pelúcia: fiapos e textura
    if (pel > 0) {
      ctx.globalAlpha = 0.18 * pel;
      for (let i = 0; i < 260; i++) {
        const rx = (M.rnd(i, 3) - 0.5) * 1.05, ry = -0.1 - M.rnd(i, 7) * 1.06;
        ctx.fillStyle = M.rnd(i, 9) > 0.5 ? "#000" : "#888";
        ctx.fillRect(rx, ry, 0.006, 0.006);
      }
      ctx.globalAlpha = 1;
    }

    // luz de contorno (rim)
    if (P.aro) {
      ctx.globalCompositeOperation = "source-atop";
      const g = ctx.createRadialGradient(0, -0.62, 0.48, 0, -0.62, 0.6);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, P.aro);
      ctx.globalAlpha = P.aroForca;
      ctx.fillStyle = g;
      ctx.fillRect(-0.6, -1.25, 1.2, 1.25);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore(); // fim do clip do corpo

    // contorno de pelúcia (fuzz)
    if (pel > 0) {
      ctx.save();
      corpoPath(ctx);
      ctx.lineWidth = 0.012;
      ctx.setLineDash([0.008, 0.012]);
      ctx.strokeStyle = "rgba(70,72,64,0.6)";
      ctx.stroke();
      ctx.restore();
    }

    // óculos no rosto
    if (P.oculos > 0.01 && P.rosto > 0.3) {
      ctx.save();
      ctx.globalAlpha = P.oculos * P.rosto;
      oculos(ctx, P.oculosX, -0.8 + P.oculosY, 1, P.oculosRot, P.vira, P.reflexo);
      ctx.restore();
    }
    lagrimas(ctx, 0, -0.793, P, P.tLagrima);

    // asas na frente do rosto (bochechas, bico, queixo, óculos, botão)
    for (const lado of ["E", "D"]) {
      if (!naFrente(lado)) continue;
      const sd = lado === "E" ? -1 : 1;
      const p = pivo(sd);
      asa(ctx, p.x, p.y, alvos[lado].x, alvos[lado].y, 0.19, pel);
    }
    ctx.restore();
  }

  window.PAO = { pao, oculos, COR, NEUTRA, corpoPath };
})();
