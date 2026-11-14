// Peças de cenário e interface, todas desenhadas em código e separadas do personagem.
(function () {
  const { clamp, lerp, key, E, rnd } = M;
  const W = 1920, H = 1080;
  const FONTE = "Nunito, 'Segoe UI', sans-serif";

  // ── utilidades ───────────────────────────────────────────────────────────
  function radial(ctx, cx, cy, r, stops, x = 0, y = 0, w = W, h = H) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  function linear(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function cam(ctx, c = {}) {
    const { x = 0, y = 0, z = 1, r = 0, ox = W / 2, oy = H / 2 } = c;
    ctx.translate(ox, oy);
    ctx.rotate(r);
    ctx.scale(z, z);
    ctx.translate(-ox + x, -oy + y);
  }
  function vinheta(ctx, f = 0.5, cor = "0,0,0") {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, `rgba(${cor},0)`);
    g.addColorStop(1, `rgba(${cor},${f})`);
    ctx.fillStyle = g;
    ctx.fillRect(-W, -H, W * 3, H * 3);
  }
  function desfocado(ctx, px, fn) {
    ctx.save();
    ctx.filter = `blur(${px}px)`;
    fn();
    ctx.restore();
  }
  function texto(ctx, str, x, y, tam, o = {}) {
    const { peso = 800, cor = "#1B2A4A", alinha = "left", base = "alphabetic", sombra = null, contorno = null, esp = 0, alpha = 1 } = o;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${peso} ${tam}px ${FONTE}`;
    ctx.textAlign = alinha;
    ctx.textBaseline = base;
    if (esp) ctx.letterSpacing = `${esp}px`;
    if (sombra) { ctx.shadowColor = sombra.cor; ctx.shadowBlur = sombra.blur; ctx.shadowOffsetY = sombra.y || 0; }
    if (contorno) { ctx.lineWidth = contorno.l; ctx.strokeStyle = contorno.cor; ctx.lineJoin = "round"; ctx.strokeText(str, x, y); }
    ctx.fillStyle = cor;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  // quebra o texto em linhas que caibam em `larg`
  function linhas(ctx, str, tam, larg, peso = 800) {
    ctx.save();
    ctx.font = `${peso} ${tam}px ${FONTE}`;
    const out = [];
    for (const par of str.split("\n")) {
      let l = "";
      for (const p of par.split(" ")) {
        const tst = l ? l + " " + p : p;
        if (ctx.measureText(tst).width > larg && l) { out.push(l); l = p; } else l = tst;
      }
      out.push(l);
    }
    ctx.restore();
    return out;
  }

  // ── ícones de engajamento (coração, comentário, compartilhar, sino) ─────
  const GLIFO = {
    coracao: new Path2D("M24 41 C12 32 4 25 4 16 C4 9.5 9 5 15 5 C19 5 22 7 24 10 C26 7 29 5 33 5 C39 5 44 9.5 44 16 C44 25 36 32 24 41 Z"),
    comentario: new Path2D("M10 7 H38 A6 6 0 0 1 44 13 V28 A6 6 0 0 1 38 34 H22 L13 42 V34 H10 A6 6 0 0 1 4 28 V13 A6 6 0 0 1 10 7 Z"),
    compartilhar: new Path2D("M28 7 L44 21 L28 35 V26 C18 26 10 29 4 40 C6 26 14 17 28 16 Z"),
    sino: new Path2D("M24 5 C25.8 5 27 6.3 27 8 C33.5 9.5 37.5 14.5 37.5 21 V29.5 L41.5 35 H6.5 L10.5 29.5 V21 C10.5 14.5 14.5 9.5 21 8 C21 6.3 22.2 5 24 5 Z M19.5 38.5 H28.5 C28.5 41 26.5 43 24 43 C21.5 43 19.5 41 19.5 38.5 Z"),
  };
  const PONTOS = [16.5, 24, 31.5]; // os "..." do balão

  // ícone em "tubo" 3D: apagado = cinza fosco; aceso = neon laranja-branco
  function icone(ctx, tipo, x, y, tam, aceso = 0, o = {}) {
    const k = tam / 48;
    ctx.save();
    ctx.translate(x - tam / 2, y - tam / 2);
    ctx.scale(k, k);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const lw = o.lw || 4.2;
    // sombra/volume embaixo
    ctx.save();
    ctx.translate(0.8, 1.6);
    ctx.lineWidth = lw + 1.5;
    ctx.strokeStyle = `rgba(40,12,4,${0.45 * (1 - aceso)})`;
    ctx.stroke(GLIFO[tipo]);
    ctx.restore();
    if (aceso > 0.01) {
      ctx.save();
      ctx.shadowColor = `rgba(255,150,40,${aceso})`;
      ctx.shadowBlur = 26 * aceso / k * 0.4 + 6;
      ctx.lineWidth = lw + 2.5;
      ctx.strokeStyle = `rgba(255,140,30,${0.85 * aceso})`;
      ctx.stroke(GLIFO[tipo]);
      ctx.restore();
    }
    // tubo
    const apag = o.apagado || "#77736E";
    const cor = aceso > 0 ? mistura(apag, "#FFD58A", aceso) : apag;
    ctx.lineWidth = lw;
    ctx.strokeStyle = cor;
    ctx.stroke(GLIFO[tipo]);
    // brilho do tubo
    ctx.lineWidth = lw * 0.32;
    ctx.strokeStyle = aceso > 0 ? `rgba(255,250,235,${0.4 + 0.6 * aceso})` : "rgba(200,196,190,0.55)";
    ctx.save();
    ctx.translate(-0.5, -0.7);
    ctx.stroke(GLIFO[tipo]);
    ctx.restore();
    if (tipo === "comentario") {
      for (const px of PONTOS) {
        ctx.beginPath();
        ctx.arc(px, 20.5, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = cor;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function mistura(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, k));
    const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k));
    const bl = Math.round(lerp(pa & 255, pb & 255, k));
    return `rgb(${r},${g},${bl})`;
  }

  function coracao(ctx, x, y, tam, cor = "#E8342A", rot = 0, alpha = 1, brilho = true) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    const k = tam / 48;
    ctx.scale(k, k);
    ctx.translate(-24, -24);
    ctx.fillStyle = cor;
    ctx.fill(GLIFO.coracao);
    if (brilho) {
      ctx.beginPath();
      ctx.ellipse(15, 14, 5, 3.2, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();
    }
    ctx.restore();
  }

  // ── sala laranja de engajamento ─────────────────────────────────────────
  // brilho 0 = apagada (tentativas), 1 = rede viva (virada)
  function salaLaranja(ctx, t, o = {}) {
    const { brilho = 0, chao = 0.74, cordoes = true, cx = W / 2 } = o;
    radial(ctx, cx, H * 0.62, H * 1.15, [
      [0, mistura("#E2741F", "#FF9A3C", brilho)],
      [0.45, mistura("#B8470F", "#D9581A", brilho)],
      [1, mistura("#4A1405", "#7A1F08", brilho)],
    ]);
    // cordões de luzinhas (pontos em perspectiva no alto)
    if (cordoes) {
      for (let fila = 0; fila < 7; fila++) {
        const yy = H * (0.03 + fila * 0.055);
        const n = 26 + fila * 4;
        for (let i = 0; i < n; i++) {
          const xx = (i / (n - 1)) * W * 1.1 - W * 0.05;
          const curva = Math.pow((xx - cx) / W, 2) * H * 0.18;
          const pis = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7 + fila);
          const a = (0.12 + 0.1 * pis) * (1 - fila / 9) + brilho * 0.45;
          ctx.beginPath();
          ctx.arc(xx, yy + curva, 1.6 + brilho * 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,${200 + 40 * brilho},${150 + 60 * brilho},${a})`;
          ctx.fill();
        }
      }
    }
    // chão
    const yc = H * chao;
    const g = linear(ctx, 0, yc - 40, 0, H, [
      [0, "rgba(0,0,0,0)"],
      [0.08, mistura("#C2581E", "#F08A3A", brilho)],
      [0.5, mistura("#9E3A10", "#C9531A", brilho)],
      [1, mistura("#5C1A06", "#7E2509", brilho)],
    ]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, yc + H * 0.55, W * 1.1, H * 0.6, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(W * 2, H);
    ctx.lineTo(-W, H);
    ctx.closePath();
    ctx.fill();
    // brilho da borda do chão
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    radial(ctx, cx, yc, W * 0.5, [[0, `rgba(255,150,60,${0.25 + brilho * 0.25})`], [1, "rgba(0,0,0,0)"]]);
    ctx.restore();
  }

  // os quatro ícones grandes da parede (como em 018/019)
  function iconesParede(ctx, t, aceso = () => 0, o = {}) {
    const { y = H * 0.19, tam = 170, xs = [0.215, 0.39, 0.565, 0.745], escala = 1, dx = 0 } = o;
    const tipos = ["coracao", "comentario", "compartilhar", "sino"];
    tipos.forEach((tp, i) => {
      const flut = Math.sin(t * 1.1 + i * 1.3) * 5;
      icone(ctx, tp, W * xs[i] + dx, y + flut, tam * escala, aceso(i), { lw: 4.6 });
    });
  }

  // rede de ícones menores espalhados (082+): todos acendem em onda
  function redeViva(ctx, t, aceso, o = {}) {
    const { y0 = H * 0.18, cx = W / 2 } = o;
    // linhas de luz ligando os nós
    if (aceso > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,190,90,${0.35 * aceso})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        const yy = y0 + 120 + i * 18;
        ctx.ellipse(cx, yy + 220, W * (0.35 + i * 0.03), 150 + i * 12, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ── mesas, pedestais ────────────────────────────────────────────────────
  function mesaRedonda(ctx, x, y, w, o = {}) {
    const { brilho = 0, haste = true, cor = "#F0DCC4" } = o;
    const h = w * 0.12;
    if (haste) {
      ctx.fillStyle = linear(ctx, x - w * 0.1, 0, x + w * 0.1, 0, [[0, "#BFA083"], [0.4, "#F3E2CE"], [1, "#A98A6E"]]);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.07, y + h * 0.4);
      ctx.quadraticCurveTo(x - w * 0.04, y + h * 2.2, x - w * 0.16, y + h * 4.5);
      ctx.lineTo(x + w * 0.16, y + h * 4.5);
      ctx.quadraticCurveTo(x + w * 0.04, y + h * 2.2, x + w * 0.07, y + h * 0.4);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.35, w / 2, h * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#B58E6C";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = linear(ctx, 0, y - h, 0, y + h, [[0, mistura(cor, "#FFFFFF", 0.5 + brilho * 0.3)], [1, mistura(cor, "#D9B48F", 0.4)]]);
    ctx.fill();
  }

  // o balão de comentário: o MESMO objeto cinza que acende em 082
  function balao(ctx, x, y, tam, aceso = 0, o = {}) {
    const { base = true, pontos = 0, halo = true } = o;
    if (base) {
      // haste curta + disco
      ctx.fillStyle = "#5C5955";
      ctx.fillRect(x - tam * 0.06, y + tam * 0.32, tam * 0.12, tam * 0.22);
      ctx.beginPath();
      ctx.ellipse(x, y + tam * 0.56, tam * 0.36, tam * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = aceso > 0 ? mistura("#4E4B47", "#C8261A", aceso) : "#4E4B47";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y + tam * 0.53, tam * 0.34, tam * 0.055, 0, 0, Math.PI * 2);
      ctx.fillStyle = aceso > 0 ? mistura("#8A8580", "#FF6A4A", aceso) : "#8A8580";
      ctx.fill();
    }
    if (halo && aceso > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      radial(ctx, x, y, tam * 1.4, [[0, `rgba(255,90,60,${0.7 * aceso})`], [0.35, `rgba(230,40,30,${0.4 * aceso})`], [1, "rgba(0,0,0,0)"]], x - tam * 2, y - tam * 2, tam * 4, tam * 4);
      ctx.restore();
    }
    // bolha
    const bw = tam, bh = tam * 0.68;
    ctx.save();
    ctx.translate(x, y);
    const corpo = new Path2D();
    corpo.roundRect(-bw / 2, -bh / 2 - tam * 0.05, bw, bh, bh * 0.48);
    const cauda = new Path2D();
    cauda.moveTo(-bw * 0.3, bh * 0.2);
    cauda.quadraticCurveTo(-bw * 0.3, bh * 0.48, -bw * 0.36, bh * 0.6);
    cauda.quadraticCurveTo(-bw * 0.16, bh * 0.52, -bw * 0.06, bh * 0.26);
    ctx.fillStyle = linear(ctx, 0, -bh / 2, 0, bh / 2, [
      [0, mistura("#A9A5A0", "#FFFFFF", aceso)],
      [0.6, mistura("#86827D", "#FFF6F0", aceso)],
      [1, mistura("#5E5A56", "#FFD9CF", aceso)],
    ]);
    if (aceso > 0.01) { ctx.shadowColor = `rgba(255,80,50,${aceso})`; ctx.shadowBlur = 50 * aceso; }
    ctx.fill(corpo);
    ctx.fill(cauda);
    ctx.shadowBlur = 0;
    // brilho de volume
    ctx.beginPath();
    ctx.ellipse(-bw * 0.18, -bh * 0.28, bw * 0.22, bh * 0.1, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.3 * aceso})`;
    ctx.fill();
    if (pontos > 0.01) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i - 1) * bw * 0.17, -tam * 0.05, tam * 0.055, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214,40,30,${pontos})`;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ── chat (003–006, 027–028) ─────────────────────────────────────────────
  function avatar(ctx, x, y, tam, t = 0) {
    ctx.save();
    rr(ctx, x, y, tam, tam, tam * 0.24);
    ctx.fillStyle = "#F6EEE6";
    ctx.fill();
    ctx.clip();
    PAO.pao(ctx, x + tam / 2, y + tam * 1.18, tam * 1.15, { sombra: 0 }, t);
    ctx.restore();
  }
  function chat(ctx, t, o) {
    const { texto: str = "", n = str.length, cursor = true, aperta = 0, z = 1, tam = 64, larg = 1100 } = o;
    // moldura azul brilhante
    radial(ctx, W / 2, H / 2, W * 0.75, [[0, "#E8F7FF"], [0.6, "#BFE7FF"], [1, "#7CC4F0"]]);
    ctx.save();
    cam(ctx, { z });
    const cx = W / 2, cy = H / 2;
    const fw = 1500, fh = 700;
    rr(ctx, cx - fw / 2, cy - fh / 2, fw, fh, fh / 2);
    ctx.fillStyle = linear(ctx, 0, cy - fh / 2, 0, cy + fh / 2, [[0, "#9FDCFF"], [0.5, "#5DBDF7"], [1, "#2E9BE6"]]);
    ctx.shadowColor = "rgba(30,120,200,0.45)";
    ctx.shadowBlur = 60;
    ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, cx - fw / 2 + 26, cy - fh / 2 + 26, fw - 52, fh - 52, fh / 2 - 26);
    ctx.fillStyle = linear(ctx, 0, cy - fh / 2, 0, cy + fh / 2, [[0, "rgba(255,255,255,0.75)"], [0.5, "rgba(220,242,255,0.55)"], [1, "rgba(180,225,255,0.6)"]]);
    ctx.fill();
    // campo de texto
    const iw = 1180, ih = 300, ix = cx - iw / 2, iy = cy - 230;
    rr(ctx, ix, iy, iw, ih, 70);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.shadowColor = "rgba(40,110,180,0.25)";
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;
    avatar(ctx, ix + 46, iy + ih / 2 - 85, 170, t);
    ctx.fillStyle = "rgba(30,60,100,0.12)";
    ctx.fillRect(ix + 240, iy + 50, 3, ih - 100);
    const vis = str.slice(0, Math.max(0, Math.floor(n)));
    const ls = linhas(ctx, str, tam, larg - 260);
    let cont = 0, ultimo = { x: ix + 270, y: iy + ih / 2 + tam * 0.35 };
    const alturaTotal = ls.length * tam * 1.18;
    const y0 = iy + ih / 2 - alturaTotal / 2 + tam * 0.85;
    ctx.font = `800 ${tam}px ${FONTE}`;
    ls.forEach((l, i) => {
      const parte = vis.slice(cont, cont + l.length);
      cont += l.length + 1;
      const yy = y0 + i * tam * 1.18;
      if (parte.length) {
        texto(ctx, parte, ix + 270, yy, tam, { cor: "#16294A" });
        ultimo = { x: ix + 270 + ctx.measureText(parte).width + 6, y: yy };
      } else if (cont - l.length - 1 <= vis.length) ultimo = { x: ix + 270, y: yy };
    });
    if (!vis.length) ultimo = { x: ix + 270, y: iy + ih / 2 + tam * 0.35 };
    if (cursor && Math.floor(t * 2.2) % 2 === 0) {
      ctx.fillStyle = "#2E7BD6";
      ctx.fillRect(ultimo.x, ultimo.y - tam * 0.82, 6, tam * 0.98);
    }
    // ENVIAR
    const bw = 330, bh = 104, bx = cx + 560 - bw, by = cy + 150 + aperta * 8;
    rr(ctx, bx, by + 10 - aperta * 8, bw, bh, bh / 2);
    ctx.fillStyle = "rgba(20,90,170,0.35)";
    ctx.fill();
    rr(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = mistura("#FFFFFF", "#DDF0FF", aperta);
    ctx.fill();
    texto(ctx, "ENVIAR", bx + bw / 2, by + bh / 2 + 2, 50, { peso: 900, cor: "#1F7FD1", alinha: "center", base: "middle", esp: 2 });
    ctx.restore();
  }

  // ── card de post (023, 033–034, 042) ────────────────────────────────────
  function fotoPorDoSol(ctx, x, y, w, h, r = 18) {
    ctx.save();
    rr(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = linear(ctx, 0, y, 0, y + h, [[0, "#7A4FC2"], [0.45, "#E8707A"], [0.75, "#FFB066"], [1, "#FFCF7A"]]);
    ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    ctx.arc(x + w * 0.66, y + h * 0.58, h * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD45A";
    ctx.shadowColor = "#FFE7A0";
    ctx.shadowBlur = h * 0.2;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#8A4C9C";
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.72);
    ctx.bezierCurveTo(x + w * 0.2, y + h * 0.5, x + w * 0.35, y + h * 0.62, x + w * 0.5, y + h * 0.7);
    ctx.bezierCurveTo(x + w * 0.7, y + h * 0.58, x + w * 0.85, y + h * 0.66, x + w, y + h * 0.6);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.fill();
    ctx.fillStyle = "#5C2F72";
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.85);
    ctx.bezierCurveTo(x + w * 0.3, y + h * 0.72, x + w * 0.6, y + h * 0.9, x + w, y + h * 0.8);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.fill();
    ctx.restore();
  }
  function metricas(ctx, x, y, tam, v, cor = "#2A2A2A") {
    const itens = [["coracao", v[0]], ["comentario", v[1]], ["compartilhar", v[2]]];
    let xx = x;
    for (const [tp, n] of itens) {
      if (tp === "coracao") coracao(ctx, xx + tam / 2, y, tam, "#E3302A", 0, 1, false);
      else {
        ctx.save();
        ctx.translate(xx, y - tam / 2);
        ctx.scale(tam / 48, tam / 48);
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = cor;
        ctx.lineJoin = "round";
        ctx.stroke(GLIFO[tp]);
        ctx.restore();
      }
      texto(ctx, String(n), xx + tam * 1.15, y + tam * 0.36, tam * 0.95, { peso: 900, cor });
      ctx.font = `900 ${tam * 0.95}px ${FONTE}`;
      xx += tam * 1.15 + ctx.measureText(String(n)).width + tam * 0.9;
    }
  }
  function cardPost(ctx, x, y, w, o = {}) {
    const { v = [2, 0, 0], rot = 0, cauda = false } = o;
    const h = w * 0.98;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = "rgba(60,15,0,0.4)";
    ctx.shadowBlur = w * 0.08;
    ctx.shadowOffsetY = w * 0.03;
    rr(ctx, -w / 2, -h / 2, w, h, w * 0.08);
    ctx.fillStyle = "#FBF3EA";
    ctx.fill();
    if (cauda) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.07, h / 2 - 2);
      ctx.lineTo(0, h / 2 + w * 0.08);
      ctx.lineTo(w * 0.07, h / 2 - 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    // cabeçalho
    avatar(ctx, -w / 2 + w * 0.06, -h / 2 + w * 0.05, w * 0.12);
    ctx.fillStyle = "#CFC6BC";
    rr(ctx, -w / 2 + w * 0.22, -h / 2 + w * 0.07, w * 0.5, w * 0.03, w * 0.015); ctx.fill();
    rr(ctx, -w / 2 + w * 0.22, -h / 2 + w * 0.125, w * 0.32, w * 0.025, w * 0.012); ctx.fill();
    fotoPorDoSol(ctx, -w / 2 + w * 0.06, -h / 2 + w * 0.22, w * 0.88, w * 0.5, w * 0.04);
    metricas(ctx, -w / 2 + w * 0.08, h / 2 - w * 0.11, w * 0.085, v);
    ctx.restore();
  }

  // ── botão redondo especial: TODO vermelho (borda e lateral) ─────────────
  function botaoVermelho(ctx, x, y, r, o = {}) {
    const { aperto = 0, brilho = 0, inclina = 0.42, cara = true } = o;
    const ry = r * inclina, alt = r * 0.32, d = aperto * alt * 0.55;
    if (brilho > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      radial(ctx, x, y, r * 2.2, [[0, `rgba(255,60,40,${0.55 * brilho})`], [0.5, `rgba(200,20,10,${0.25 * brilho})`], [1, "rgba(0,0,0,0)"]], x - r * 3, y - r * 3, r * 6, r * 6);
      ctx.restore();
    }
    // base (anel vermelho escuro)
    ctx.beginPath();
    ctx.ellipse(x, y + alt * 0.9, r * 1.14, ry * 1.14, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#6A1209";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + alt * 0.7, r * 1.12, ry * 1.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = linear(ctx, x - r, 0, x + r, 0, [[0, "#8E1A0E"], [0.5, "#C8301E"], [1, "#7A150B"]]);
    ctx.fill();
    // lateral da tampa
    ctx.beginPath();
    ctx.ellipse(x, y + alt * 0.55, r, ry, 0, 0, Math.PI);
    ctx.lineTo(x - r, y + d);
    ctx.ellipse(x, y + d, r, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = linear(ctx, x - r, 0, x + r, 0, [[0, "#7E160C"], [0.35, "#B92A1A"], [1, "#6E130A"]]);
    ctx.fill();
    // tampa
    ctx.beginPath();
    ctx.ellipse(x, y + d, r, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = (() => {
      const g = ctx.createRadialGradient(x - r * 0.3, y + d - ry * 0.4, 0, x, y + d, r);
      g.addColorStop(0, mistura("#E0452E", "#FF7A5A", brilho));
      g.addColorStop(0.6, mistura("#B8291A", "#E0402A", brilho));
      g.addColorStop(1, "#8A1A0F");
      return g;
    })();
    if (brilho > 0.01) { ctx.shadowColor = `rgba(255,60,40,${brilho})`; ctx.shadowBlur = r * 0.4 * brilho; }
    ctx.fill();
    ctx.shadowBlur = 0;
    // silhueta do PAÓ em relevo (vermelho mais escuro), como na prancha
    if (cara) {
      ctx.save();
      ctx.translate(x, y + d + r * 0.05 * inclina);
      ctx.scale(r * 0.62, r * 0.62 * inclina);
      ctx.translate(0, 0.55);
      ctx.fillStyle = "rgba(120,16,8,0.55)";
      PAO.corpoPath(ctx);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,120,90,0.35)";
      ctx.lineWidth = 0.025;
      ctx.stroke();
      for (const s2 of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(s2 * 0.246, -0.79, 0.16, 0.2, 0, 0, 7);
        ctx.fillStyle = "rgba(225,70,45,0.9)"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(s2 * 0.246, -0.79, 0.1, 0.13, 0, 0, 7);
        ctx.fillStyle = "rgba(120,16,8,0.9)"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(s2 * 0.5, -0.45, 0.1, 0.2, s2 * -0.5, 0, 7);
        ctx.fillStyle = "rgba(120,16,8,0.55)"; ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(-0.09, -0.62); ctx.lineTo(0.09, -0.62); ctx.lineTo(0, -0.53); ctx.closePath();
      ctx.fillStyle = "rgba(90,10,5,0.9)"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -0.3, 0.33, 0.2, 0, 0, 7);
      ctx.fillStyle = "rgba(225,70,45,0.45)"; ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.ellipse(x - r * 0.25, y + d - ry * 0.45, r * 0.4, ry * 0.22, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fill();
  }

  // ── tecla POSTAR (verde, retangular) sobre placa azul de circuito ───────
  function placaCircuito(ctx, x, y, w, h, t = 0) {
    rr(ctx, x, y, w, h, 40);
    ctx.fillStyle = linear(ctx, x, y, x + w, y + h, [[0, "#38D2FF"], [1, "#0FA4E8"]]);
    ctx.fill();
    ctx.save();
    rr(ctx, x, y, w, h, 40);
    ctx.clip();
    ctx.strokeStyle = "rgba(220,250,255,0.55)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      const yy = y + 40 + i * (h / 9);
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w * (0.15 + rnd(i) * 0.2), yy);
      ctx.lineTo(x + w * (0.22 + rnd(i) * 0.2), yy + 30);
      ctx.lineTo(x + w * 0.35, yy + 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + w * 0.35, yy + 30, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w, yy + 10);
      ctx.lineTo(x + w * (0.8 - rnd(i, 2) * 0.15), yy + 10);
      ctx.lineTo(x + w * (0.72 - rnd(i, 2) * 0.1), yy - 20);
      ctx.stroke();
    }
    ctx.restore();
  }
  function teclaPostar(ctx, x, y, w, o = {}) {
    const { aperto = 0, brilho = 0, rotulo = "POSTAR" } = o;
    const h = w * 0.36, alt = h * 0.26, d = aperto * alt * 0.7;
    rr(ctx, x - w / 2, y - h / 2 + alt, w, h, h * 0.25);
    ctx.fillStyle = "#118A2A";
    ctx.fill();
    if (brilho > 0) { ctx.shadowColor = `rgba(120,255,120,${brilho})`; ctx.shadowBlur = 60 * brilho; }
    rr(ctx, x - w / 2, y - h / 2 + d, w, h, h * 0.25);
    ctx.fillStyle = linear(ctx, 0, y - h / 2, 0, y + h / 2, [[0, "#6BF070"], [0.5, "#2FD14A"], [1, "#1AA836"]]);
    ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, x - w / 2 + 14, y - h / 2 + 10 + d, w - 28, h * 0.32, h * 0.16);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fill();
    texto(ctx, rotulo, x, y + d + 4, h * 0.5, { peso: 900, cor: "#FFFFFF", alinha: "center", base: "middle", sombra: { cor: "rgba(0,80,20,0.5)", blur: 6, y: 3 }, esp: 2 });
  }

  // ── celular (074–077) ────────────────────────────────────────────────────
  function celular(ctx, x, y, w, rot, tela) {
    const h = w * 2.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = w * 0.15;
    ctx.shadowOffsetY = w * 0.06;
    rr(ctx, -w / 2, -h / 2, w, h, w * 0.14);
    ctx.fillStyle = "#1C1D1B";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    rr(ctx, -w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08, w * 0.11);
    ctx.save();
    ctx.clip();
    tela(ctx, -w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08);
    ctx.restore();
    rr(ctx, -w * 0.12, -h / 2 + w * 0.07, w * 0.24, w * 0.06, w * 0.03);
    ctx.fillStyle = "#0A0A0A";
    ctx.fill();
    ctx.restore();
  }

  function fmtMil(n) {
    if (n < 1000) return String(Math.round(n));
    const k = n / 1000;
    return (k >= 10 ? k.toFixed(1) : k.toFixed(1)).replace(".", ",") + " mil";
  }

  // partículas de pó/luz flutuando
  function poeira(ctx, t, n, cor, area = [0, 0, W, H], vel = 20, tam = 2) {
    for (let i = 0; i < n; i++) {
      const x = area[0] + ((rnd(i, 1) * area[2] + t * vel * (0.3 + rnd(i, 2))) % area[2]);
      const y = area[1] + ((rnd(i, 3) * area[3] - t * vel * 0.6 * rnd(i, 4) + area[3] * 10) % area[3]);
      const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + i));
      ctx.beginPath();
      ctx.arc(x, y, tam * (0.5 + rnd(i, 5)), 0, Math.PI * 2);
      ctx.fillStyle = cor.replace("A", a.toFixed(2));
      ctx.fill();
    }
  }

  window.K = {
    W, H, FONTE, radial, linear, rr, cam, vinheta, desfocado, texto, linhas, GLIFO, icone, mistura, coracao,
    salaLaranja, iconesParede, redeViva, mesaRedonda, balao, avatar, chat, fotoPorDoSol, metricas, cardPost,
    botaoVermelho, placaCircuito, teclaPostar, celular, fmtMil, poeira,
  };
})();
