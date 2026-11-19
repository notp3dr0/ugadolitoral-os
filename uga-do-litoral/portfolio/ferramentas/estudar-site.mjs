// Estuda um site (de fora ou o nosso): entrada quadro a quadro, a página inteira rolando, peso por tipo,
// tempos (FCP, LCP, load), quadros na rolagem, scripts e fontes usadas, e o esqueleto da página (seções e títulos).
// Uso: node estudar-site.mjs <url|pasta> <nome>     ex.: node estudar-site.mjs https://cellopaes.com/ celo
//      node estudar-site.mjs ../site-lab nosso
// Saída: saida/estudo/<nome>/ (prints e relatorio.json). Só lê: não clica em nada que mande dado pra fora.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { servir } from './servidor.mjs';

const [alvo, nome = 'site'] = process.argv.slice(2);
let url = alvo, srv = null;
if (!/^https?:/.test(alvo)) { srv = await servir(alvo); url = srv.url + '/'; }
const OUT = `saida/estudo/${nome}`; fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const TELAS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
};
const relatorio = { url: url.replace(/\?.*$/, ''), quando: new Date().toISOString(), telas: {} };
for (const [tela, opts] of Object.entries(TELAS)) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const reqs = new Map();
  page.on('response', async r => {
    try {
      const req = r.request(), h = await r.allHeaders();
      const tam = Number(h['content-length']) || (await r.body().catch(() => Buffer.alloc(0))).length;
      reqs.set(req.url(), { tipo: req.resourceType(), tam, url: req.url().slice(0, 140), status: r.status(), t: Date.now() });
    } catch {}
  });
  await page.addInitScript(() => {
    window.__lcp = 0; window.__fcp = 0; window.__longas = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__longas.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch {}
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // a entrada, quadro a quadro (os primeiros 6 s)
  for (const ms of [200, 600, 1000, 1500, 2200, 3000, 4500, 6000]) {
    const falta = t0 + ms - Date.now(); if (falta > 0) await page.waitForTimeout(falta);
    await page.screenshot({ path: `${OUT}/${tela}-entrada-${String(ms).padStart(4, '0')}.png` });
  }
  await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  // rolando: um print por tela e os quadros por segundo
  const vh = opts.viewport.height; let k = 0;
  await page.evaluate(() => { window.__q = []; let ult = performance.now(); const f = t => { window.__q.push(t - ult); ult = t; window.__raf = requestAnimationFrame(f); }; window.__raf = requestAnimationFrame(f); });
  for (let y = 0; y < Math.min(altura, vh * 14); y += vh * .85) {
    await page.mouse.wheel(0, vh * .85); await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${tela}-rolagem-${String(++k).padStart(2, '0')}.png` });
  }
  const quadros = await page.evaluate(() => { cancelAnimationFrame(window.__raf); const q = window.__q.slice(5).sort((a, b) => a - b); return { mediano: q[Math.floor(q.length / 2)], p95: q[Math.floor(q.length * .95)], pior: q[q.length - 1], n: q.length }; });
  const info = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const titulos = [...document.querySelectorAll('h1,h2,h3,[class*=title],[class*=hero]')].slice(0, 40).map(e => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)}: ${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}`);
    const secoes = [...document.querySelectorAll('section,header,footer,main>div,nav')].slice(0, 40).map(e => `${e.tagName.toLowerCase()}#${e.id}.${String(e.className).slice(0, 50)} (${Math.round(e.getBoundingClientRect().height)}px)`);
    const links = [...document.querySelectorAll('a')].slice(0, 60).map(a => `${a.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)} -> ${a.getAttribute('href')}`);
    const fontes = [...new Set([...document.querySelectorAll('*')].slice(0, 3000).map(e => getComputedStyle(e).fontFamily))].slice(0, 12);
    const libs = Object.keys(window).filter(k => /gsap|ScrollTrigger|Lenis|lenis|THREE|barba|Swiper|locomotive|framer|__NEXT|__nuxt|webflow|Webflow|React|Vue/i.test(k)).slice(0, 20);
    const gerador = document.querySelector('meta[name=generator]')?.content || '';
    return { domPronto: Math.round(nav.domContentLoadedEventEnd), carga: Math.round(nav.loadEventEnd), fcp: Math.round(window.__fcp), lcp: Math.round(window.__lcp), longas: window.__longas, titulos, secoes, links, fontes, libs, gerador, imgs: document.images.length, videos: document.querySelectorAll('video').length, nos: document.querySelectorAll('*').length, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null };
  });
  const porTipo = {};
  for (const r of reqs.values()) { const p = porTipo[r.tipo] ||= { n: 0, kb: 0 }; p.n++; p.kb += r.tam / 1024; }
  for (const p of Object.values(porTipo)) p.kb = Math.round(p.kb);
  const maiores = [...reqs.values()].sort((a, b) => b.tam - a.tam).slice(0, 15).map(r => `${Math.round(r.tam / 1024)} KB ${r.tipo} ${r.url}`);
  const scripts = [...reqs.values()].filter(r => r.tipo === 'script').map(r => `${Math.round(r.tam / 1024)} KB ${r.url}`);
  relatorio.telas[tela] = { altura, quadros, porTipo, total_kb: Object.values(porTipo).reduce((s, p) => s + p.kb, 0), pedidos: reqs.size, maiores, scripts, ...info };
  console.log(`${tela}: ${relatorio.telas[tela].pedidos} pedidos, ${relatorio.telas[tela].total_kb} KB, FCP ${info.fcp} LCP ${info.lcp} ms, quadro mediano ${quadros.mediano?.toFixed(1)} p95 ${quadros.p95?.toFixed(1)}, altura ${altura}px, ${info.nos} nós`);
  await ctx.close();
}
fs.writeFileSync(`${OUT}/relatorio.json`, JSON.stringify(relatorio, null, 1));
await browser.close(); srv?.close?.();
process.exit(0);
