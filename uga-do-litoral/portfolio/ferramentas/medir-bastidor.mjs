// Mede o bastidor andando o corredor inteiro: peso, quadros, travadas longas, chamadas de desenho,
// texturas vivas. Roda no desktop e num celular simulado (390x844, dpr 3, processador 4x mais lento).
// Uso: node medir-bastidor.mjs [pasta=../site-lab]. Não falha nunca: só imprime, pra comparar antes e depois.
// Linha de base (2026-11-12, antes da rodada 8) está em plano/rodada-8.md.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';

const s = await servir(process.argv[2] || '../site-lab');
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

async function roda(nome, ctxOpts, freio) {
  const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); if (freio) await cdp.send('Emulation.setCPUThrottlingRate', { rate: freio });
  const pedidos = []; p.on('response', r => { pedidos.push(Number(r.headers()['content-length'] || 0)); });
  const t0 = Date.now();
  await p.goto(s.url + '/bastidor.html?semente=3&encontros=agua,seguranca,eletricista' + (process.env.EXTRA || ''));
  await p.waitForSelector('.entrar-mudo', { state: 'visible', timeout: 30000 });
  const ateBotao = Date.now() - t0, pesoBotao = pedidos.reduce((a, n) => a + n, 0);
  await p.click('.entrar-mudo');
  await p.waitForFunction(() => window.__bastidor.world.controls.state.enabled, null, { timeout: 15000 });
  const r = await p.evaluate(async () => {
    const w = window.__bastidor.world, st = w.controls.state, total = w.plan.rail.total;
    const dts = []; let calls = 0, tex = 0, last = performance.now();
    const longos = []; new PerformanceObserver(l => l.getEntries().forEach(e => longos.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] });
    await new Promise(res => {
      function f(now) {
        dts.push(now - last); last = now;
        st.s = Math.min(total - 4, st.s + 0.12);
        calls = Math.max(calls, w.renderer.info.render.calls); tex = Math.max(tex, w.renderer.info.memory.textures);
        if (st.s < total - 4.1 && dts.length < 3000) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
    dts.sort((a, c) => a - c); const q = x => dts[Math.floor(dts.length * x)];
    return { mediana: +q(.5).toFixed(1), p99: +q(.99).toFixed(1), pior: Math.round(dts[dts.length - 1]), chamadas: calls, texturas: tex, travadas: longos.length, piorTravada: Math.max(0, ...longos) };
  });
  const total = pedidos.reduce((a, n) => a + n, 0);
  console.log(`${nome}: botao em ${ateBotao} ms com ${(pesoBotao / 1048576).toFixed(2)} MB · corredor inteiro ${(total / 1048576).toFixed(1)} MB`);
  console.log(`  quadro mediano ${r.mediana} ms · p99 ${r.p99} · pior ${r.pior} · travadas longas ${r.travadas} (pior ${r.piorTravada} ms) · chamadas ${r.chamadas} · texturas ${r.texturas}`);
  await ctx.close();
}
await roda('desktop', { viewport: { width: 1440, height: 900 } }, 0);
await roda('celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, 4);
await b.close(); await s.fechar();
