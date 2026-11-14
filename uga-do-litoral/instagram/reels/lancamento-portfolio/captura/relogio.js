// Relógio virtual: injetado antes de qualquer script da página (addInitScript).
// performance.now, Date.now, requestAnimationFrame e os timers passam a andar só quando o arreio manda
// (window.__relogio.avancar(ms)). Math.random vira um gerador com semente fixa: duas rodadas dão o mesmo.
(() => {
  let agora = 0;
  const stReal = window.setTimeout.bind(window);
  window.__esperaReal = ms => new Promise(r => stReal(r, ms)); // o setTimeout de verdade, guardado antes da troca
  const DATA0 = Date.UTC(2026, 10, 14, 12, 0, 0);
  const rafs = new Map(); let rafId = 1;
  const timers = new Map(); let timerId = 1;
  // mulberry32
  let a = 0x5eed1234 >>> 0;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  performance.now = () => agora;
  Date.now = () => DATA0 + agora;
  window.requestAnimationFrame = cb => { const id = rafId++; rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = id => { rafs.delete(id); };
  window.setTimeout = (fn, ms = 0, ...args) => { const id = timerId++; timers.set(id, { em: agora + Math.max(0, Number(ms) || 0), fn, args, rep: 0 }); return id; };
  window.clearTimeout = id => { timers.delete(id); };
  window.setInterval = (fn, ms = 0, ...args) => { const id = timerId++; const rep = Math.max(1, Number(ms) || 1); timers.set(id, { em: agora + rep, fn, args, rep }); return id; };
  window.clearInterval = id => { timers.delete(id); };

  function dispararTimers(ate) {
    for (let guarda = 0; guarda < 10000; guarda++) {
      let proximo = null, pid = 0;
      for (const [id, t] of timers) if (t.em <= ate && (!proximo || t.em < proximo.em || (t.em === proximo.em && id < pid))) { proximo = t; pid = id; }
      if (!proximo) return;
      const devido = proximo.em;
      if (proximo.rep) proximo.em += proximo.rep; else timers.delete(pid);
      agora = Math.max(agora, devido);
      try { typeof proximo.fn === 'function' ? proximo.fn(...proximo.args) : 0; } catch (e) { console.error('timer', e); }
    }
  }
  window.__relogio = {
    get agora() { return agora; },
    /** anda o relógio e roda timers e um quadro de rAF (com o tempo novo) */
    avancar(ms) {
      const alvo = agora + ms;
      dispararTimers(alvo);
      agora = alvo;
      const lista = [...rafs.entries()]; rafs.clear();
      for (const [, cb] of lista) { try { cb(agora); } catch (e) { console.error('raf', e); } }
    },
    /** põe o relógio num instante (só pra frente) */
    ir(ms) { if (ms > agora) this.avancar(ms - agora); }
  };
})();
