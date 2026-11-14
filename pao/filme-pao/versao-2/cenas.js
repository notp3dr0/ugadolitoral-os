// PAÓ · "um balão" (v2). Três lugares: MESA, SALA dos sinais, TELA do celular.
// O balão de comentário cinza atravessa o filme: adesivo no notebook, ícone do app,
// reflexo na lente, pedestal da sala. Ele só acende quando o PAÓ para de perseguir o número.
// Toda cena recebe L = { W, H, v } e compõe para o formato (16:9 ou 9:16 de verdade).
window.CENAS = {};
(function () {
  const { key, E, mola, piscada, piscadas, respira, rnd, ate, clamp, lerp, tremor, ruido } = M;
  const { radial, linear, rr, texto, vinheta } = K;
  const pao = PAO.pao;

  function cam(ctx, L, c = {}) {
    // (ox, oy) = ponto do cenário que vai para o centro do quadro
    let { z = 1, x = 0, y = 0, ox = L.W / 2, oy = L.H / 2, r = 0 } = c;
    // nunca mostrar fora do cenário: o alvo fica dentro do que o zoom permite
    if (z >= 1) {
      const mx = L.W / (2 * z) + Math.abs(x) / z + 2, my = L.H / (2 * z) + Math.abs(y) / z + 2;
      ox = clamp(ox, mx, L.W - mx); oy = clamp(oy, my, L.H - my);
    }
    ctx.translate(L.W / 2 + x, L.H / 2 + y);
    ctx.rotate(r);
    ctx.scale(z, z);
    ctx.translate(-ox, -oy);
  }

  // ── MESA (noite, quarto do criador) ────────────────────────────────────
  function mesaL(L) {
    const { W, H, v } = L;
    if (!v) return {
      chao: H * 0.74, pao: { x: W * 0.5, y: H * 0.78, s: H * 0.5 },
      note: { x: W * 0.5, y: H * 0.81, w: H * 0.62 }, cel: { x: W * 0.73, y: H * 0.86, w: H * 0.16 },
      caneca: { x: W * 0.25, y: H * 0.86, s: H * 0.13 }, oculos: { x: W * 0.36, y: H * 0.86, s: H * 0.2 },
      lamp: { x: W * 0.1, y: H * 0.06 }, janela: { x: W * 0.7, y: H * 0.08, w: W * 0.22, h: H * 0.42 },
      mural: { x: W * 0.12, y: H * 0.2, w: W * 0.2, h: H * 0.3 },
    };
    return {
      chao: H * 0.6, pao: { x: W * 0.5, y: H * 0.63, s: W * 0.64 },
      note: { x: W * 0.5, y: H * 0.66, w: W * 0.8 }, cel: { x: W * 0.72, y: H * 0.8, w: W * 0.26 },
      caneca: { x: W * 0.2, y: H * 0.78, s: W * 0.17 }, oculos: { x: W * 0.36, y: H * 0.86, s: W * 0.3 },
      lamp: { x: W * 0.12, y: H * 0.08 }, janela: { x: W * 0.55, y: H * 0.07, w: W * 0.38, h: H * 0.22 },
      mural: { x: W * 0.07, y: H * 0.16, w: W * 0.4, h: H * 0.2 },
    };
  }

  function fundoQuarto(ctx, L, t, quente = 0) {
    const { W, H } = L;
    const m = mesaL(L);
    radial(ctx, W * 0.5, H * 0.45, Math.max(W, H) * 0.9, [
      [0, K.mistura("#4E2036", "#8A2A1E", quente)], [0.6, K.mistura("#2E1228", "#4A1510", quente)], [1, "#12070F"],
    ]);
    // janela com lua e estrelas
    const j = m.janela;
    rr(ctx, j.x, j.y, j.w, j.h, 16); ctx.fillStyle = "#1A1A3A"; ctx.fill();
    ctx.save(); rr(ctx, j.x, j.y, j.w, j.h, 16); ctx.clip();
    ctx.fillStyle = linear(ctx, 0, j.y, 0, j.y + j.h, [[0, "#1B2350"], [1, "#3B2A60"]]); ctx.fillRect(j.x, j.y, j.w, j.h);
    for (let i = 0; i < 30; i++) {
      const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.3 + i * 2.1));
      ctx.beginPath(); ctx.arc(j.x + rnd(i) * j.w, j.y + rnd(i, 2) * j.h * 0.8, 1.5 + rnd(i, 3) * 1.5, 0, 7);
      ctx.fillStyle = `rgba(255,255,230,${a * 0.8})`; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(j.x + j.w * 0.72, j.y + j.h * 0.28, Math.min(j.w, j.h) * 0.12, 0, 7);
    ctx.fillStyle = "#FFF3D0"; ctx.shadowColor = "#FFF3D0"; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
    ctx.strokeStyle = "#2A1520"; ctx.lineWidth = 12; ctx.strokeRect(j.x, j.y, j.w, j.h);
    ctx.beginPath(); ctx.moveTo(j.x + j.w / 2, j.y); ctx.lineTo(j.x + j.w / 2, j.y + j.h); ctx.stroke();
    // mural com polaroides (o trabalho dele)
    const mu = m.mural;
    rr(ctx, mu.x, mu.y, mu.w, mu.h, 10); ctx.fillStyle = "#6B4A34"; ctx.fill();
    const fotos = [["#7A4FC2", "#FFB066"], ["#3FA2FF", "#E6F6FF"], ["#B3261A", "#F2E5D5"], ["#2D6A3A", "#9FE0A0"]];
    fotos.forEach(([a, b], i) => {
      const px = mu.x + mu.w * (0.08 + (i % 2) * 0.47), py = mu.y + mu.h * (0.08 + Math.floor(i / 2) * 0.46);
      ctx.save(); ctx.translate(px + mu.w * 0.2, py + mu.h * 0.2); ctx.rotate((rnd(i) - 0.5) * 0.25);
      ctx.fillStyle = "#FBF7F0"; ctx.fillRect(-mu.w * 0.2, -mu.h * 0.19, mu.w * 0.4, mu.h * 0.38);
      ctx.fillStyle = linear(ctx, 0, -mu.h * 0.17, 0, mu.h * 0.1, [[0, a], [1, b]]); ctx.fillRect(-mu.w * 0.17, -mu.h * 0.16, mu.w * 0.34, mu.h * 0.26);
      ctx.beginPath(); ctx.arc(0, -mu.h * 0.2, 5, 0, 7); ctx.fillStyle = "#C2301E"; ctx.fill();
      ctx.restore();
    });
    // luminária (luz quente)
    const lp = m.lamp;
    radial(ctx, lp.x + 80, lp.y + 140, Math.max(W, H) * 0.42, [[0, "rgba(255,190,120,0.45)"], [1, "rgba(0,0,0,0)"]]);
    ctx.strokeStyle = "#151515"; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(lp.x - 20, m.chao); ctx.lineTo(lp.x, lp.y + 200); ctx.lineTo(lp.x + 70, lp.y + 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lp.x + 40, lp.y + 20); ctx.lineTo(lp.x + 150, lp.y + 90); ctx.lineTo(lp.x + 95, lp.y + 160); ctx.closePath(); ctx.fillStyle = "#1A1A1A"; ctx.fill();
    // mesa
    ctx.fillStyle = linear(ctx, 0, m.chao, 0, H, [[0, K.mistura("#9A6A52", "#C0644A", quente)], [0.12, K.mistura("#6A4232", "#7A3A28", quente)], [1, "#24140F"]]);
    ctx.fillRect(-W, m.chao, W * 3, H);
    ctx.fillStyle = "rgba(255,220,190,0.25)"; ctx.fillRect(-W, m.chao, W * 3, 4);
  }

  function notebook(ctx, n, glow = 0, t = 0, fecha = 0) {
    const w = n.w, h = w * 0.62 * (1 - fecha * 0.7);
    // tampa vista de trás
    ctx.save();
    rr(ctx, n.x - w / 2, n.y - h, w, h, w * 0.04);
    ctx.fillStyle = linear(ctx, n.x - w / 2, 0, n.x + w / 2, 0, [[0, "#45474C"], [0.5, "#36383D"], [1, "#26272B"]]);
    ctx.fill();
    rr(ctx, n.x - w / 2, n.y + 2, w * 1.0, w * 0.05, w * 0.02); ctx.fillStyle = "#1D1E21"; ctx.fill();
    // o adesivo: o balão de comentário (o mesmo objeto do filme)
    const as = w * 0.26 * (1 - fecha * 0.5);
    ctx.translate(n.x, n.y - h * 0.52);
    if (glow > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      radial(ctx, 0, 0, as * 2.4, [[0, `rgba(255,90,60,${0.7 * glow})`], [0.4, `rgba(220,40,25,${0.35 * glow})`], [1, "rgba(0,0,0,0)"]], -as * 3, -as * 3, as * 6, as * 6);
      ctx.restore();
    }
    rr(ctx, -as * 0.62, -as * 0.48, as * 1.24, as * 0.96, as * 0.2); ctx.fillStyle = `rgba(255,255,255,${0.9 - glow * 0.4})`; ctx.fill();
    K.balao(ctx, 0, as * 0.02, as, glow, { base: false, pontos: glow, halo: false });
    ctx.restore();
  }

  function telaCel(ctx, x, y, w, h, st, t) {
    // tela do app (mini, usada no celular da mesa e na TELA)
    ctx.fillStyle = "#FBF7F2"; ctx.fillRect(x, y, w, h);
    const u = w / 100;
    K.avatar(ctx, x + u * 6, y + u * 8, u * 12, t);
    texto(ctx, "pao.cria", x + u * 21, y + u * 16, u * 5.2, { peso: 900, cor: "#1C1C1C" });
    const post = st.post || 0;
    const fx = x + u * 6, fy = y + u * 24, fw = w - u * 12, fh = fw * 0.9;
    if (post === 0) K.fotoPorDoSol(ctx, fx, fy, fw, fh, u * 3);
    else if (post === 1) {
      ctx.save(); rr(ctx, fx, fy, fw, fh, u * 3); ctx.clip();
      ctx.fillStyle = linear(ctx, 0, fy, 0, fy + fh, [[0, "#FFE7B0"], [1, "#FFB866"]]); ctx.fillRect(fx, fy, fw, fh);
      ctx.beginPath(); ctx.arc(fx + fw / 2, fy + fh * 0.42, fw * 0.2, 0, 7); ctx.fillStyle = "#FFF6D8"; ctx.shadowColor = "#FFE08A"; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0;
      K.coracao(ctx, fx + fw / 2, fy + fh * 0.42, fw * 0.2, "#E3302A");
      ctx.fillStyle = "#7A5A3A"; ctx.fillRect(fx + fw * 0.44, fy + fh * 0.62, fw * 0.12, fh * 0.12);
      ctx.restore();
    } else {
      ctx.save(); rr(ctx, fx, fy, fw, fh, u * 3); ctx.clip();
      ctx.fillStyle = "#FBE4E6"; ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = "#151515"; rr(ctx, fx + fw * 0.15, fy + fh * 0.55, fw * 0.7, fh * 0.22, 8); ctx.fill();
      ctx.fillStyle = "#fff"; for (let i = 0; i < 10; i++) ctx.fillRect(fx + fw * (0.17 + i * 0.066), fy + fh * 0.57, fw * 0.05, fh * 0.12);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = "#151515"; ctx.beginPath(); ctx.ellipse(fx + fw * (0.25 + i * 0.25), fy + fh * (0.3 - i * 0.04), fw * 0.045, fw * 0.035, -0.4, 0, 7); ctx.fill(); ctx.fillRect(fx + fw * (0.29 + i * 0.25), fy + fh * (0.12 - i * 0.04), fw * 0.012, fh * 0.18); }
      ctx.restore();
    }
    // métricas: o ícone de comentário é o balão (cinza → aceso)
    const my = fy + fh + u * 11, ic = u * 9;
    K.coracao(ctx, x + u * 11, my, ic, "#E3302A", 0, 1, false);
    texto(ctx, K.fmtMil(st.likes ?? 0), x + u * 17.5, my + ic * 0.36, ic * 0.95, { peso: 900, cor: "#1C1C1C" });
    const cx = x + u * 48;
    if ((st.comAceso || 0) > 0.01) {
      ctx.save(); ctx.shadowColor = `rgba(255,70,40,${st.comAceso})`; ctx.shadowBlur = 25 * st.comAceso;
      ctx.translate(cx - ic / 2, my - ic / 2); ctx.scale(ic / 48, ic / 48); ctx.fillStyle = K.mistura("#9A9590", "#E8342A", st.comAceso); ctx.fill(K.GLIFO.comentario); ctx.restore();
    } else {
      ctx.save(); ctx.translate(cx - ic / 2, my - ic / 2); ctx.scale(ic / 48, ic / 48); ctx.lineWidth = 4.5; ctx.strokeStyle = "#9A9590"; ctx.stroke(K.GLIFO.comentario); ctx.restore();
    }
    texto(ctx, String(Math.round(st.coms ?? 0)), cx + ic * 0.7, my + ic * 0.36, ic * 0.95, { peso: 900, cor: "#1C1C1C" });
    ctx.save(); ctx.translate(x + u * 76 - ic / 2, my - ic / 2); ctx.scale(ic / 48, ic / 48); ctx.lineWidth = 4.5; ctx.strokeStyle = "#1C1C1C"; ctx.stroke(K.GLIFO.compartilhar); ctx.restore();
    // botão POSTAR / publicado
    if (st.postar != null) {
      const by = y + h - u * 20;
      if (st.publicado > 0) {
        ctx.save(); ctx.globalAlpha = st.publicado;
        rr(ctx, x + u * 18, by - u * 2, w - u * 36, u * 13, u * 6.5); ctx.fillStyle = "#1C1C1C"; ctx.fill();
        texto(ctx, "Publicado ✓", x + w / 2, by + u * 6.5, u * 5.5, { peso: 900, cor: "#FFFFFF", alinha: "center", base: "middle" });
        ctx.restore();
      }
      if (st.publicado < 1) {
        ctx.save(); ctx.globalAlpha = 1 - (st.publicado || 0);
        K.teclaPostar(ctx, x + w / 2, by + u * 4, w * 0.62, { aperto: st.postar });
        ctx.restore();
      }
    }
    // comentário chegando
    if ((st.toast || 0) > 0.01) {
      const k = st.toast, ty = y + lerp(-u * 30, u * 6, E.out(clamp(k)));
      ctx.save();
      rr(ctx, x + u * 4, ty, w - u * 8, u * 26, u * 6); ctx.fillStyle = "#FFFFFF"; ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "#E8342A"; ctx.lineWidth = u * 0.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + u * 14, ty + u * 13, u * 6, 0, 7); ctx.fillStyle = linear(ctx, x, ty, x + u * 20, ty + u * 20, [[0, "#FFB066"], [1, "#E0457A"]]); ctx.fill();
      texto(ctx, "a", x + u * 14, ty + u * 14.5, u * 6.5, { peso: 900, cor: "#fff", alinha: "center", base: "middle" });
      texto(ctx, "@ana.lu comentou", x + u * 24, ty + u * 10.5, u * 4.4, { peso: 800, cor: "#7A7570" });
      texto(ctx, "isso fez meu dia", x + u * 24, ty + u * 19.5, u * 6.2, { peso: 900, cor: "#1C1C1C" });
      K.coracao(ctx, x + w - u * 12, ty + u * 13, u * 7, "#E3302A");
      ctx.restore();
    }
  }

  function celularMesa(ctx, c, st, t) {
    // celular deitado na mesa, em perspectiva; vira de bruços em st.bruços (0..1)
    const vira = st.brucos || 0;
    const tr = st.vibra ? tremor(t, st.vibra, 0.25, c.w * 0.03) : { x: 0, y: 0 };
    ctx.save();
    ctx.translate(c.x + tr.x, c.y + tr.y);
    ctx.transform(1, 0, -0.25, 0.55, 0, 0);
    ctx.rotate(-0.12);
    const sy = Math.cos(vira * Math.PI);
    ctx.scale(1, Math.max(0.03, Math.abs(sy)));
    const w = c.w, h = w * 2;
    if ((st.vaza || 0) > 0.01 && sy < 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = `rgba(255,120,80,${st.vaza})`; ctx.shadowBlur = w * 0.6;
      rr(ctx, -w / 2, -h / 2, w, h, w * 0.14); ctx.fillStyle = `rgba(255,140,90,${0.5 * st.vaza})`; ctx.fill();
      ctx.restore();
    }
    rr(ctx, -w / 2, -h / 2, w, h, w * 0.14); ctx.fillStyle = "#151614"; ctx.fill();
    if (sy >= 0) {
      ctx.save(); rr(ctx, -w / 2 + w * 0.05, -h / 2 + w * 0.05, w * 0.9, h - w * 0.1, w * 0.1); ctx.clip();
      telaCel(ctx, -w / 2 + w * 0.05, -h / 2 + w * 0.05, w * 0.9, h - w * 0.1, st, t);
      ctx.restore();
    } else {
      rr(ctx, -w / 2 + w * 0.08, -h / 2 + w * 0.1, w * 0.36, w * 0.36, w * 0.08); ctx.fillStyle = "#26272A"; ctx.fill();
      ctx.beginPath(); ctx.arc(-w / 2 + w * 0.26, -h / 2 + w * 0.28, w * 0.09, 0, 7); ctx.fillStyle = "#0B0B0B"; ctx.fill();
    }
    ctx.restore();
  }

  function oculosMesa(ctx, o, reflexo = 0) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s, o.s * 0.55);
    PAO.oculos(ctx, 0, 0, 1, -0.15, 0, 0, true);
    if (reflexo > 0) {
      // o adesivo cinza refletido na lente
      ctx.globalAlpha = reflexo;
      ctx.save(); ctx.translate(0.246, -0.02); ctx.scale(0.3, 0.3);
      rr(ctx, -0.32, -0.22, 0.64, 0.44, 0.2); ctx.fillStyle = "rgba(170,165,160,0.7)"; ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // monta o plano de mesa a partir de um estado
  function mesa(ctx, L, t, st) {
    const m = mesaL(L);
    ctx.save();
    cam(ctx, L, st.cam || {});
    fundoQuarto(ctx, L, t, st.quente || 0);
    AMB2.caneca(ctx, m.caneca.x, m.caneca.y, m.caneca.s, t);
    const P = Object.assign({ oculos: 1, aro: st.quente ? `rgba(255,90,60,${0.9 * st.quente})` : "rgba(255,170,110,0.9)", aroForca: 0.35 + (st.quente || 0) * 0.3 }, st.pose);
    ctx.save();
    ctx.beginPath(); ctx.rect(-L.W * 2, -L.H * 2, L.W * 5, m.note.y + L.H * 2); ctx.clip();
    pao(ctx, m.pao.x, m.pao.y, m.pao.s, P, t);
    ctx.restore();
    notebook(ctx, m.note, st.adesivo || 0, t);
    if (st.oculosMesa) oculosMesa(ctx, m.oculos, st.reflexo || 0);
    celularMesa(ctx, m.cel, st.cel || {}, t);
    // luz quente da virada tingindo o quarto
    if (st.quente > 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      radial(ctx, m.note.x, m.note.y - m.note.w * 0.3, Math.max(L.W, L.H) * 0.7, [[0, `rgba(255,80,40,${0.22 * st.quente})`], [1, "rgba(0,0,0,0)"]], -L.W, -L.H, L.W * 3, L.H * 3);
      ctx.restore();
    }
    ctx.restore();
    vinheta(ctx, 0.5);
  }

  const AMB2 = {
    caneca(ctx, x, y, s, t) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = s * 0.06; ctx.lineCap = "round";
      for (let i = 0; i < 2; i++) { ctx.beginPath(); for (let k = 0; k <= 10; k++) { const yy = y - s * 0.75 - k * s * 0.09, xx = x + (i - 0.5) * s * 0.25 + Math.sin(k * 0.8 + t * 3 + i * 2) * s * 0.08; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
      ctx.lineWidth = s * 0.1; ctx.strokeStyle = "#1E1E1C";
      ctx.beginPath(); ctx.ellipse(x + s * 0.42, y - s * 0.32, s * 0.16, s * 0.2, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      rr(ctx, x - s * 0.42, y - s * 0.7, s * 0.84, s * 0.7, s * 0.12); ctx.fillStyle = "#1E1E1C"; ctx.fill();
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sd * s * 0.12, y - s * 0.42, s * 0.09, s * 0.11, 0, 0, 7); ctx.fillStyle = "#A62317"; ctx.fill(); ctx.beginPath(); ctx.ellipse(x + sd * s * 0.12, y - s * 0.42, s * 0.055, s * 0.07, 0, 0, 7); ctx.fillStyle = "#F2E5D5"; ctx.fill(); }
      ctx.restore();
    },
  };

  // ── SALA dos sinais ─────────────────────────────────────────────────────
  function salaL(L) {
    const { W, H, v } = L;
    if (!v) return { icY: H * 0.19, icTam: H * 0.16, xs: [0.215, 0.39, 0.565, 0.745], mesa: { x: W * 0.4, y: H * 0.76, w: H * 0.6 }, pao: { x: W * 0.4, y: H * 0.765, s: H * 0.24 }, bal: { x: W * 0.68, y: H * 0.55, s: H * 0.27 }, txtY: H * 0.43 };
    return { icY: H * 0.13, icTam: W * 0.17, xs: [0.17, 0.39, 0.61, 0.83], mesa: { x: W * 0.5, y: H * 0.82, w: W * 0.8 }, pao: { x: W * 0.5, y: H * 0.825, s: W * 0.34 }, bal: { x: W * 0.5, y: H * 0.41, s: W * 0.38 }, txtY: H * 0.23 };
  }
  function sala(ctx, L, t, st) {
    const s = salaL(L);
    ctx.save();
    cam(ctx, L, st.cam || {});
    K.salaLaranja(ctx, t, { brilho: st.brilho || 0, chao: L.v ? 0.72 : 0.74 });
    if (st.rede) {
      // pontos e arcos de luz se espalhando
      for (let i = 0; i < 110; i++) {
        const a = rnd(i) * Math.PI * 2, r = (0.15 + rnd(i, 2) * 0.9) * Math.max(L.W, L.H);
        const vis = clamp((st.rede * Math.max(L.W, L.H) * 1.2 - r) / 120);
        if (vis <= 0) continue;
        ctx.beginPath(); ctx.arc(s.bal.x + Math.cos(a) * r, s.bal.y + Math.sin(a) * r * 0.55, 3, 0, 7);
        ctx.fillStyle = `rgba(255,220,150,${vis * 0.8})`; ctx.fill();
      }
    }
    K.iconesParede(ctx, t, st.icones || (() => 0), { y: s.icY, tam: s.icTam, xs: s.xs });
    if (st.comPao !== false) K.mesaRedonda(ctx, s.mesa.x, s.mesa.y, s.mesa.w, { brilho: st.brilho || 0, haste: !L.v });
    if (st.balao !== false) {
      ctx.beginPath(); ctx.ellipse(s.bal.x, s.bal.y + s.bal.s * 0.62, s.bal.s * 0.55, s.bal.s * 0.1, 0, 0, 7);
      ctx.fillStyle = K.mistura("#8A3A16", "#FFD9CC", st.balaoAceso || 0); ctx.fill();
      ctx.save(); ctx.translate(s.bal.x, s.bal.y); ctx.scale(st.balaoEsc || 1, st.balaoEsc || 1);
      K.balao(ctx, 0, 0, s.bal.s, st.balaoAceso || 0, { pontos: st.balaoAceso || 0 });
      ctx.restore();
    }
    if (st.comPao !== false) pao(ctx, s.pao.x, s.pao.y, s.pao.s, Object.assign({ aro: "rgba(255,150,70,0.85)", aroForca: 0.35 }, st.pose), t);
    ctx.restore();
    vinheta(ctx, 0.35 - (st.brilho || 0) * 0.15);
  }

  // ── TELA do celular (insert) ────────────────────────────────────────────
  function tela(ctx, L, t, st) {
    const { W, H, v } = L;
    // fundo: mesa desfocada e quente
    radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.8, [[0, K.mistura("#5A2A30", "#9A3A24", st.quente || 0)], [1, "#1A0A10"]]);
    for (let i = 0; i < 14; i++) {
      ctx.beginPath(); ctx.arc(rnd(i) * W, rnd(i, 2) * H, 40 + rnd(i, 3) * 90, 0, 7);
      ctx.fillStyle = `rgba(255,${170 + rnd(i, 4) * 60},120,${0.05 + rnd(i, 5) * 0.06})`; ctx.fill();
    }
    const w = v ? W * 0.84 : H * 0.48, h = w * 2.05;
    ctx.save();
    cam(ctx, L, st.cam || {});
    ctx.translate(W / 2, H / 2 + (v ? 0 : H * 0.0));
    ctx.rotate(st.rot ?? (v ? 0 : -0.04));
    K.celular(ctx, 0, 0, w, 0, (c, x, y, ww, hh) => telaCel(c, x, y, ww, hh, st, t));
    ctx.restore();
    // asa que toca na tela
    if (st.toque != null) {
      const k = st.toque; // 0 fora .. 1 tocando
      const tx = W / 2 + w * 0.05, ty = H / 2 + h * 0.36;
      ctx.save(); ctx.translate(lerp(tx + w * 0.9, tx, k), lerp(ty + h * 0.6, ty, k)); ctx.rotate(-0.6);
      ctx.beginPath(); ctx.ellipse(w * 0.25, w * 0.55, w * 0.2, w * 0.55, -0.2, 0, 7);
      ctx.fillStyle = linear(ctx, 0, 0, w * 0.4, w, [[0, "#3B3D37"], [1, "#151613"]]); ctx.fill();
      ctx.restore();
    }
  }

  // ── textos e assinatura ─────────────────────────────────────────────────
  function frase(ctx, L, str, lt, y) {
    const k = key(lt, [[0.25, 0], [1.0, 1, E.out]]);
    const tam = L.v ? L.W * 0.105 : L.H * 0.085;
    const ls = L.v ? K.linhas(ctx, str, tam, L.W * 0.86) : [str];
    ls.forEach((l, i) => texto(ctx, l, L.W / 2, y + i * tam * 1.15 + (1 - k) * 24, tam, { peso: 800, cor: "#FFF6EA", alinha: "center", alpha: k, sombra: { cor: "rgba(110,25,0,0.6)", blur: 18, y: 4 } }));
  }

  const B = 0.6; // um tempo de música (100 BPM): os cortes caem no tempo
  window.BATIDA = B;

  // ─────────────────────────────────────────────────────────────────────────
  // PLANOS
  // ─────────────────────────────────────────────────────────────────────────
  // 1 · o adesivo: começa no balão cinza e recua até revelar o PAÓ criando à noite
  CENAS.adesivo = (ctx, lt, dur, L) => {
    const m = mesaL(L);
    const k = key(lt, [[0.3, 0], [3.4, 1, E.io]]);
    const z = lerp(L.v ? 3.4 : 3.6, 1, k);
    const alvo = { x: m.note.x, y: m.note.y - m.note.w * 0.62 * 0.52 };
    const dig = Math.sin(lt * 16) * 0.006;
    const leX = key(lt, [[1.5, -0.4], [2.2, 0.2, E.out], [2.9, -0.3, E.out], [3.6, 0.3, E.out]]);
    mesa(ctx, L, lt, {
      cam: { z, ox: alvo.x, oy: alvo.y, x: 0 },
      pose: { olharX: leX, olharY: 0.45, achata: respira(lt) - Math.abs(dig), palpE: piscadas(lt, [3.7]), palpD: piscadas(lt, [3.7]) },
      cel: { post: 0, likes: 0, coms: 0 },
    });
  };
  // 2 · criando: a ideia chega
  CENAS.criando = (ctx, lt, dur, L) => {
    const ideia = clamp(mola(lt, 2.4, 0, 1, "brincalhona"), 0, 1.25);
    const kk = clamp(ideia);
    const vel = lt > 2.6 ? 22 : 14;
    const leX = lt < 2.3 ? key(lt, [[0, -0.4], [0.6, 0.3, E.out], [1.2, -0.3, E.out], [1.8, 0.35, E.out]]) : 0.1;
    mesa(ctx, L, lt, {
      cam: { z: key(lt, [[0, 1.12], [dur, 1.22]]), oy: L.H * 0.4 },
      pose: {
        olharX: leX, olharY: lerp(0.45, -0.3, kk), pupila: lerp(1, 1.22, kk), bico: kk * 0.45,
        palpE: piscadas(lt, [1.0]), palpD: piscadas(lt, [1.0]),
        achata: (lt > 2.4 ? lerp(1, 1.05, ideia) : 1) * respira(lt) - Math.abs(Math.sin(lt * vel)) * 0.006,
        y: lt > 2.4 ? -0.05 * Math.max(0, Math.sin((lt - 2.4) * 9)) * Math.exp(-(lt - 2.4) * 3) : 0,
      },
      cel: { post: 0, likes: 0, coms: 0 },
    });
  };
  // 3 · postar (insert da tela)
  CENAS.postar = (ctx, lt, dur, L) => {
    const toque = key(lt, [[0.6, 0], [1.6, 1, E.in], [1.9, 1], [2.4, 0, E.out]]);
    const ap = key(lt, [[1.55, 0], [1.62, 1, E.expo], [1.9, 0, E.out]]);
    tela(ctx, L, lt, { post: 0, likes: 0, coms: 0, postar: ap, publicado: key(lt, [[1.95, 0], [2.2, 1]]), toque, cam: { z: key(lt, [[0, 1.0], [dur, 1.05]]) } });
  };
  // 4 · a sala apagada: espia, espera, dá de ombros
  CENAS.salaApagada = (ctx, lt, dur, L) => {
    const ol = key(lt, [[0.2, -0.7], [0.9, 0.7, E.io], [1.5, L.v ? 0 : 0.85, E.io]]);
    const inclina = key(lt, [[1.4, 0], [2.0, 1, E.out], [3.1, 1], [3.4, 0, E.io]]);
    const ombro = key(lt, [[3.2, 0], [3.4, 1, E.out], [3.8, 0, E.io]]);
    sala(ctx, L, lt, {
      cam: { z: key(lt, [[0, 1.0], [dur, 1.06]]) },
      pose: {
        oculos: 1, olharX: ol, olharY: L.v ? -0.85 : -0.4, giro: inclina * (L.v ? 0 : 0.12),
        achata: (1 - ombro * 0.07) * respira(lt), asaEang: ombro * 70, asaDang: ombro * 70,
        palpE: key(lt, [[3.0, 0], [3.3, 0.35]]), palpD: key(lt, [[3.0, 0], [3.3, 0.35]]), incl: ombro * 6,
        pupila: lerp(1, 0.9, inclina),
      },
    });
  };
  // 5–7 · tentativas: cada uma mais curta; a câmera desce até o celular
  function tentativa(post, likes, ritmo, tPost, tOlha, olha = true) {
    return (ctx, lt, dur, L) => {
      const m = mesaL(L);
      const desce = key(lt, [[tOlha, 0], [tOlha + 0.7, 1, E.io]]);
      const z = lerp(1.0, L.v ? 2.0 : 2.2, desce);
      const toque = key(lt, [[tPost - 0.25, 0], [tPost, 1, E.in], [tPost + 0.25, 0, E.out]]);
      const can = olha ? 0.15 : 0.5;
      mesa(ctx, L, lt, {
        cam: { z, ox: lerp(L.W / 2, m.cel.x, desce), oy: lerp(L.H / 2, m.cel.y - m.cel.w * 0.3, desce) },
        pose: {
          olharX: lt < tPost ? Math.sin(lt * 4) * 0.4 : lerp(0, olha ? 0.9 : 0.3, desce), olharY: lt < tPost ? 0.45 : lerp(0.45, 0.95, desce),
          palpE: Math.max(can + (post * 0.1), piscadas(lt, [tOlha + 0.9], 0)), palpD: Math.max(can + post * 0.1, piscadas(lt, [tOlha + 0.9], 0)),
          incl: post * 4, achata: respira(lt) - Math.abs(Math.sin(lt * ritmo)) * 0.006 * (lt < tPost ? 1 : 0),
          asaD: toque > 0.02 ? { x: 0.45, y: lerp(-0.4, -0.62, toque) } : null,
        },
        cel: { post, likes: key(lt, [[tPost + 0.6, 0], [tPost + 1.4, likes, E.out]]), coms: 0 },
      });
    };
  }
  CENAS.tentativa1 = tentativa(0, 2, 16, 2.4, 2.7);
  CENAS.tentativa2 = tentativa(1, 3, 22, 1.5, 1.8);
  CENAS.tentativa3 = tentativa(2, 3, 26, 0.6, 1.0, false);
  // 8 · o balão segue cinza (sala, quase silêncio)
  CENAS.balaoCinza = (ctx, lt, dur, L) => {
    const s = salaL(L);
    sala(ctx, L, lt, { comPao: false, cam: { z: key(lt, [[0, 1.6], [dur, 1.75, E.lin]]), ox: s.bal.x, oy: s.bal.y } });
  };
  // 9 · cansaço: tira os óculos, deita a cabeça; a câmera vai até a lente
  CENAS.cansaco = (ctx, lt, dur, L) => {
    const m = mesaL(L);
    const alcanca = key(lt, [[1.2, 0], [1.8, 1, E.io]]);
    const fecha = key(lt, [[1.7, 0], [1.95, 1, E.in2]]);
    const tira = key(lt, [[2.1, 0], [3.3, 1, E.io]]);
    const deita = key(lt, [[3.7, 0], [5.0, 1, E.io]]);
    const push = key(lt, [[5.2, 0], [dur, 1, E.io]]);
    const S = m.pao.s;
    const rosto = { x: m.pao.x, y: m.pao.y - 0.8 * S };
    const ox = lerp(rosto.x, m.oculos.x, E.io(tira)), oy = lerp(rosto.y, m.oculos.y, tira) - Math.sin(Math.PI * tira) * S * 0.2;
    const naMao = tira > 0 && tira < 1;
    let asaE = null;
    if (alcanca > 0 && tira < 1) asaE = naMao ? { x: (ox - m.pao.x) / S - 0.1, y: (oy - m.pao.y) / S } : { x: lerp(-0.6, -0.4, alcanca), y: lerp(-0.35, -0.8, alcanca) };
    const pal = tira >= 1 ? lerp(0.6, 1, deita) : Math.max(key(lt, [[0, 0.35], [1.2, 0.5]]), fecha);
    const zz = lerp(1, L.v ? 3.2 : 3.4, push);
    mesa(ctx, L, lt, {
      cam: { z: zz, ox: lerp(L.W / 2, m.oculos.x, push), oy: lerp(L.H / 2, m.oculos.y, push) },
      pose: { oculos: tira > 0 ? 0 : 1, palpE: pal, palpD: pal, incl: 9, olharY: 0.4, y: deita * 0.3, giro: deita * -0.12, achata: respira(lt, 0.012, 2.6), asaE, asaFrente: naMao },
      oculosMesa: tira >= 1, reflexo: key(lt, [[6.0, 0], [7.5, 1]]),
      cel: { post: 2, likes: 3, coms: 0 },
    });
    if (naMao) {
      // óculos na asa, viajando até a mesa
      const esc = lerp(S * 1.0, m.oculos.s, tira);
      ctx.save(); ctx.translate(ox, oy); ctx.scale(esc, esc * lerp(1, 0.55, tira));
      PAO.oculos(ctx, 0, 0, 1, lerp(0, -0.15, tira), 0, 0, true); ctx.restore();
    }
  };
  // 10 · cria porque gosta: vira o celular de bruços e cria sem olhar o número
  CENAS.porGostar = (ctx, lt, dur, L) => {
    const m = mesaL(L);
    const volta = key(lt, [[0, 1], [1.2, 0, E.io]]);
    const ergue = key(lt, [[0.9, 0], [1.9, 1, E.io]]);
    const pega = key(lt, [[2.3, 0], [2.8, 1, E.io], [3.3, 1], [3.7, 0, E.io]]);
    const brucos = key(lt, [[2.8, 0], [3.25, 1, E.io]]);
    const feliz = key(lt, [[3.7, 0], [4.1, 1, E.out]]);
    const S = m.pao.s;
    const celU = { x: (m.cel.x - m.pao.x) / S, y: (m.cel.y - m.pao.y) / S };
    mesa(ctx, L, lt, {
      cam: { z: lerp(1, L.v ? 3.2 : 3.4, volta), ox: lerp(L.W / 2, m.oculos.x, volta), oy: lerp(L.H / 2, m.oculos.y, volta) },
      pose: {
        oculos: 0, y: lerp(0.3, 0, ergue), giro: lerp(-0.12, 0, ergue),
        palpE: lerp(1, 0.2, ergue), palpD: lerp(1, 0.2, ergue), olharX: lerp(0, 0.8, pega), olharY: lerp(0.2, 0.7, pega),
        feliz, bico: feliz * 0.3, achata: respira(lt) - (lt > 4 ? Math.abs(Math.sin(lt * 10)) * 0.006 : 0),
        giro: lt > 4 ? Math.sin(lt * 5.2) * 0.04 : lerp(-0.12, 0, ergue),
        asaD: pega > 0.02 ? { x: lerp(0.5, celU.x, pega), y: lerp(-0.4, celU.y + 0.05, pega) } : null, asaFrente: pega > 0.4,
      },
      oculosMesa: true, reflexo: 1 - ergue,
      cel: { post: 2, likes: 3, coms: 0, brucos },
    });
  };
  // 11 · o adesivo acende (ele não percebe: olhos fechados, criando)
  CENAS.adesivoAcende = (ctx, lt, dur, L) => {
    const m = mesaL(L);
    const g = key(lt, [[0.6, 0], [0.8, 1, E.out]]);
    const esc = lt > 0.6 ? 1 + Math.exp(-(lt - 0.6) * 6) * Math.sin((lt - 0.6) * 16) * 0.05 : 1;
    const alvo = { x: m.note.x, y: m.note.y - m.note.w * 0.62 * 0.4 };
    mesa(ctx, L, lt, {
      cam: { z: (L.v ? 1.9 : 2.0) * esc, ox: alvo.x, oy: alvo.y },
      pose: { oculos: 0, feliz: 1, bico: 0.3, giro: Math.sin(lt * 5.2) * 0.04, achata: respira(lt) - Math.abs(Math.sin(lt * 10)) * 0.006 },
      adesivo: g, oculosMesa: true, cel: { brucos: 1 }, quente: g * 0.35,
    });
  };
  // 12 · o celular de bruços vibra e vaza luz
  CENAS.celVibra = (ctx, lt, dur, L) => {
    const m = mesaL(L);
    const vib = lt > 1.25 ? 1.25 : lt > 0.75 ? 0.75 : 0.2;
    mesa(ctx, L, lt, {
      cam: { z: L.v ? 2.5 : 2.6, ox: m.cel.x, oy: m.cel.y - m.cel.w * 0.2 },
      pose: { oculos: 0, feliz: 1 }, adesivo: 1, oculosMesa: true, quente: 0.45,
      cel: { brucos: 1, vibra: vib, vaza: key(lt, [[0.2, 0.3], [0.5, 1]]) },
    });
  };
  // 13 · a sala acende: primeiro o balão, depois a rede
  CENAS.salaAcende = (ctx, lt, dur, L) => {
    const s = salaL(L);
    const ac = key(lt, [[0.3, 0], [0.5, 1, E.out]]);
    const esc = lt > 0.3 ? 1 + Math.exp(-(lt - 0.3) * 6) * Math.sin((lt - 0.3) * 18) * 0.07 : 1;
    const rede = key(lt, [[0.8, 0], [2.6, 1, E.out]]);
    const tr = tremor(lt, 0.31, 0.25, 6);
    sala(ctx, L, lt, {
      comPao: false, balaoAceso: ac, balaoEsc: esc, brilho: ac * 0.3 + rede * 0.6, rede,
      icones: (i) => key(lt, [[0.9 + Math.abs(i - 1.5) * 0.18, 0], [1.15 + Math.abs(i - 1.5) * 0.18, 1, E.out]]),
      cam: (() => { const k = key(lt, [[0.9, 0], [dur, 1, E.io]]); return { z: lerp(1.5, 1.0, k), ox: lerp(s.bal.x, L.W / 2, k), oy: lerp(s.bal.y, L.H / 2, k), x: tr.x, y: tr.y }; })(),
    });
  };
  // 14 · ele percebe a luz e desvira o celular
  CENAS.percebe = (ctx, lt, dur, L) => {
    const m = mesaL(L);
    const abre = key(lt, [[0.25, 1], [0.6, 0, E.out]]);
    const pega = key(lt, [[1.0, 0], [1.4, 1, E.io], [1.9, 1], [2.3, 0, E.io]]);
    const desvira = key(lt, [[1.4, 1], [1.85, 0, E.io]]);
    const S = m.pao.s;
    const celU = { x: (m.cel.x - m.pao.x) / S, y: (m.cel.y - m.pao.y) / S };
    mesa(ctx, L, lt, {
      cam: { z: key(lt, [[0, 1.08], [dur, 1.12]]) },
      pose: {
        oculos: 0, feliz: lerp(1, 0, clamp(1 - abre)), palpE: abre * 0.5, palpD: abre * 0.5,
        olharX: lerp(-0.2, 0.9, key(lt, [[0.6, 0], [1.0, 1, E.out]])), olharY: lerp(-0.2, 0.8, key(lt, [[0.6, 0], [1.0, 1]])), pupila: key(lt, [[0.4, 1], [0.7, 1.2, E.back]]),
        asaD: pega > 0.02 ? { x: lerp(0.5, celU.x, pega), y: lerp(-0.4, celU.y + 0.05, pega) } : null, asaFrente: pega > 0.4,
      },
      adesivo: 1, oculosMesa: true, quente: 0.55,
      cel: { brucos: desvira, vaza: 1, post: 2, likes: 3, coms: 1, comAceso: 1 },
    });
  };
  // 15 · o comentário: uma pessoa, não um número
  CENAS.comentario = (ctx, lt, dur, L) => {
    tela(ctx, L, lt, {
      post: 2, quente: 0.6,
      toast: key(lt, [[0.2, 0], [0.7, 1]]), comAceso: key(lt, [[0.1, 0.4], [0.4, 1]]),
      coms: key(lt, [[0.9, 1], [dur, 12, E.out]]), likes: key(lt, [[0.9, 3], [dur, 48, E.out]]),
      cam: { z: key(lt, [[0, 1.0], [dur, 1.06]]) },
    });
  };
  // 16 · alívio (sorriso e lágrima)
  CENAS.alivio = (ctx, lt, dur, L) => {
    const m = mesaL(L);
    const sorri = key(lt, [[0.5, 0], [1.1, 1, E.out]]);
    mesa(ctx, L, lt, {
      cam: { z: L.v ? 2.1 : 2.2, ox: m.pao.x, oy: m.pao.y - m.pao.s * 0.82 },
      pose: {
        oculos: 0, y: key(lt, [[0, -0.05], [0.9, -0.2, E.out]]), olharY: 0.3, olharX: 0.4, pupila: key(lt, [[0, 1.15], [1.0, 1.3]]),
        palpE: key(lt, [[1.6, 0], [2.3, 0.3]]), palpD: key(lt, [[1.6, 0], [2.3, 0.3]]),
        lagrima: key(lt, [[0.2, 0], [0.9, 1]]), tLagrima: lt, bico: sorri * 0.55,
        feliz: key(lt, [[1.9, 0], [2.5, 0.7, E.io]]), achata: lerp(1, 0.98, sorri) * respira(lt, 0.012, 1.6),
      },
      adesivo: 1, oculosMesa: true, quente: 0.6, cel: { vaza: 1, post: 2, likes: 48, coms: 12, comAceso: 1 },
    });
  };
  // 17–18 · as frases, na sala viva
  CENAS.frase1 = (ctx, lt, dur, L) => {
    const s = salaL(L);
    sala(ctx, L, lt, { brilho: 0.9, rede: 1, balaoAceso: 1, icones: () => 1, cam: { z: key(lt, [[0, 1.06], [dur, 1.0]]) }, pose: { olharY: -0.2, olharX: 0.4, asaEang: 15, asaDang: 15, palpE: piscadas(lt, [2.8]), palpD: piscadas(lt, [2.8]) } });
    frase(ctx, L, "para quem ama o que faz.", lt, s.txtY);
  };
  CENAS.frase2 = (ctx, lt, dur, L) => {
    const s = salaL(L);
    sala(ctx, L, lt, { brilho: 1, rede: 1, balaoAceso: 1, icones: () => 1, cam: { z: key(lt, [[0, 1.04], [dur, 1.0]]) }, pose: { olharY: -0.3, feliz: key(lt, [[1.6, 0], [2.0, 0.7]]), bico: 0.3, asaEang: 35, asaDang: 35 } });
    frase(ctx, L, "independente do engajamento", lt, s.txtY);
  };
  // 19 · assinatura
  CENAS.assinatura = (ctx, lt, dur, L) => {
    const { W, H, v } = L;
    K.salaLaranja(ctx, lt, { brilho: 1 });
    const s = salaL(L);
    K.iconesParede(ctx, lt, () => 1, { y: s.icY, tam: s.icTam, xs: s.xs });
    const entra = clamp(mola(lt, 0.1, 0, 1, "brincalhona"), 0, 1.2);
    const tam = v ? W * 0.5 : H * 0.36;
    pao(ctx, W / 2, H * (v ? 0.6 : 0.68), tam * entra, { asaEang: 25, asaDang: 25, palpE: piscadas(lt, [1.9, 3.0]), palpD: piscadas(lt, [1.9, 3.0]), aro: "rgba(255,170,80,0.9)", aroForca: 0.4 }, lt);
    const pal = clamp(mola(lt, 0.5, 0, 1, "pesada"), 0, 1.2);
    ctx.save(); ctx.translate(W / 2, H * (v ? 0.7 : 0.84)); ctx.scale(pal, pal);
    const ft = v ? W * 0.24 : H * 0.18;
    texto(ctx, "PAÓ", 0, 0, ft, { peso: 1000, cor: "#FFFFFF", alinha: "center", base: "middle", contorno: { l: ft * 0.1, cor: "#A62317" }, sombra: { cor: "rgba(110,20,5,0.6)", blur: 24, y: 8 }, esp: 4 });
    texto(ctx, "PAÓ", 0, 0, ft, { peso: 1000, cor: "#FFFFFF", alinha: "center", base: "middle", esp: 4 });
    ctx.restore();
    K.redeViva(ctx, lt, 1, { cx: W / 2 });
    ctx.fillStyle = `rgba(0,0,0,${key(lt, [[dur - 0.5, 0], [dur, 1, E.in2]])})`; ctx.fillRect(0, 0, W, H);
  };
})();
