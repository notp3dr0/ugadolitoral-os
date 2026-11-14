(function () {
  const P = [];
  const plano = (q, dur, desenha, o = {}) => P.push(Object.assign({ q, dur, desenha }, o));
  window.ROTEIRO(plano);
  let acc = 0;
  for (const p of P) { p.ini = acc; acc += p.dur; }
  window.TL = {
    planos: P,
    total: acc,
    achar(t) {
      for (const p of P) if (t < p.ini + p.dur) return { plano: p, lt: Math.max(0, t - p.ini) };
      const p = P[P.length - 1];
      return { plano: p, lt: p.dur - 1e-4 };
    },
    cues() {
      const out = [];
      for (const p of P) for (const [lt, nome, vol = 1, extra] of p.sons || []) out.push({ t: +(p.ini + lt).toFixed(3), nome, vol, plano: p.q, extra });
      return out.sort((a, b) => a.t - b.t);
    },
  };
})();
