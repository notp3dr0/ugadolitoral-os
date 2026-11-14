// Movimento puro em função do tempo (método do artigo: seek(t) determinístico).
// Nada aqui guarda estado: o mesmo t sempre dá o mesmo quadro.
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix = lerp;

  const E = {
    lin: (k) => k,
    in: (k) => k * k * k,
    out: (k) => 1 - Math.pow(1 - k, 3),
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    in2: (k) => k * k,
    out2: (k) => 1 - (1 - k) * (1 - k),
    sine: (k) => 0.5 - Math.cos(Math.PI * k) / 2,
    expo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    back: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
  };

  // Chaves no tempo: [[t, v], [t, v, easing do trecho que chega], ...]
  function key(t, ks) {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) {
      const [t1, v1, e] = ks[i];
      const [t0, v0] = ks[i - 1];
      if (t <= t1) {
        if (t1 === t0) return v1;
        return lerp(v0, v1, (e || E.io)(clamp((t - t0) / (t1 - t0))));
      }
    }
    return ks[ks.length - 1][1];
  }

  // Mola em forma fechada: sai de `de` pra `para` no instante t0.
  // Níveis do artigo: snappy (UI), padrao (cards/câmera), pesada (logo), brincalhona (mascote).
  const MOLA = {
    snappy: { w: 26, z: 0.82 },
    padrao: { w: 16, z: 0.75 },
    pesada: { w: 10, z: 0.9 },
    brincalhona: { w: 14, z: 0.42 },
  };
  function mola(t, t0, de, para, tipo = "padrao") {
    if (t <= t0) return de;
    const { w, z } = typeof tipo === "string" ? MOLA[tipo] : tipo;
    const s = t - t0;
    const wd = w * Math.sqrt(1 - z * z);
    const a = Math.exp(-z * w * s) * (Math.cos(wd * s) + ((z * w) / wd) * Math.sin(wd * s));
    return para + (de - para) * a;
  }
  // Várias mudanças de alvo em sequência: uma mola por mudança, somadas (sem reiniciar).
  function molas(t, v0, mudancas, tipo = "padrao") {
    let v = v0, ant = v0;
    for (const [t0, alvo, tp] of mudancas) {
      v += mola(t, t0, ant, alvo, tp || tipo) - ant;
      ant = alvo;
    }
    return v;
  }

  // Piscada medida no original (24 fps: fecha 2, fechada 1, abre 2) → em segundos.
  function piscada(t, t0, antes = 0, depois = antes) {
    return key(t, [
      [t0, antes],
      [t0 + 0.09, 1, E.in2],
      [t0 + 0.13, 1],
      [t0 + 0.23, depois, E.out2],
    ]);
  }
  // Várias piscadas: lista de instantes
  function piscadas(t, lista, base = 0) {
    let v = base;
    for (const t0 of lista) v = Math.max(v, piscada(t, t0, base, base));
    return v;
  }

  const respira = (t, amp = 0.012, periodo = 1.9) => 1 + Math.sin((t / periodo) * Math.PI * 2) * amp;

  // Ruído suave determinístico (deriva de câmera, tremores)
  function ruido(t, semente = 1) {
    const s = semente * 12.9898;
    return (
      Math.sin(t * 1.3 + s) * 0.5 +
      Math.sin(t * 2.7 + s * 1.7) * 0.3 +
      Math.sin(t * 5.1 + s * 2.3) * 0.2
    );
  }
  function tremor(t, t0, dur = 0.25, amp = 8) {
    const d = t - t0;
    if (d < 0 || d > dur) return { x: 0, y: 0 };
    const k = (1 - d / dur) * amp;
    return { x: Math.sin(d * 90) * k, y: Math.cos(d * 130) * k };
  }
  // Pseudoaleatório fixo por índice
  const rnd = (i, s = 0) => {
    const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const ate = (t, a, b) => clamp((t - a) / (b - a));

  window.M = { clamp, lerp, mix, E, key, mola, molas, piscada, piscadas, respira, ruido, tremor, rnd, ate };
})();
