// Velocidade real no celular: 4G simulado (9 Mbps, 170 ms de ida e volta) e processador 4x mais lento,
// como num celular médio. Mede quando aparece algo, quando aparece o maior conteúdo, quando dá pra rolar sem
// travar, quanto baixou nos primeiros 3 e 10 s, e as travadas do processador. Repete 3 vezes e tira a mediana.
// Uso: node medir-4g.mjs <url> [nome] [vezes=3]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [url, nome = 'site', vezes = '3'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const res = [];
for (let k = 0; k < Number(vezes); k++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0; const t0 = Date.now(); const marcas = {};
  cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; const t = Date.now() - t0; if (t < 3000) marcas.b3 = bytes; if (t < 10000) marcas.b10 = bytes; });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, fcp: 0, longas: [], cls: 0 };
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.longas.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(10000);
  if (k === 0) await page.screenshot({ path: `saida/estudo/4g-${nome}-10s.png` });
  // rolagem de 4 telas: travadas durante a rolagem
  await page.evaluate(() => { window.__q = []; let u = performance.now(); const f = t => { window.__q.push(t - u); u = t; window.__r = requestAnimationFrame(f); }; window.__r = requestAnimationFrame(f); });
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 420); await page.waitForTimeout(250); }
  const m = await page.evaluate(() => { cancelAnimationFrame(window.__r); const q = window.__q.slice(3).sort((a, b) => a - b); return { ...window.__m, rolagem_p95: Math.round(q[Math.floor(q.length * .95)] || 0), rolagem_pior: Math.round(q[q.length - 1] || 0) }; });
  res.push({ fcp: Math.round(m.fcp), lcp: Math.round(m.lcp), cls: +m.cls.toFixed(3), travadas: m.longas.length, travada_total: m.longas.reduce((s, x) => s + x, 0), rolagem_p95: m.rolagem_p95, rolagem_pior: m.rolagem_pior, kb_3s: Math.round((marcas.b3 || 0) / 1024), kb_10s: Math.round((marcas.b10 || bytes) / 1024) });
  await ctx.close();
}
const med = key => { const v = res.map(r => r[key]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
const resumo = Object.fromEntries(Object.keys(res[0]).map(k => [k, med(k)]));
console.log(nome, JSON.stringify(resumo));
fs.mkdirSync('saida/estudo', { recursive: true });
fs.writeFileSync(`saida/estudo/4g-${nome}.json`, JSON.stringify({ url: url.replace(/\?.*$/, ''), resumo, rodadas: res }, null, 1));
await browser.close(); process.exit(0);
