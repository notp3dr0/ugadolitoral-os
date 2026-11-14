// Medidas rápidas de experiência no celular: peso da carga inicial, LCP, rolagem até a 1ª foto, letras pequenas.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
const srv = await servir('../site-lab');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8 * 4, uploadThroughput: 750e3 / 8 }); // ~4G lento
let bytes = 0; const porTipo = {};
cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
cdp.on('Network.responseReceived', e => { const t = e.type; porTipo[t] = (porTipo[t] || 0) + 1; });
await page.addInitScript(() => { window.__lcp = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
const t0 = Date.now();
await page.goto(`${srv.url}/`, { waitUntil: 'load' });
const load = Date.now() - t0;
await page.waitForTimeout(4000);
const r = await page.evaluate(() => {
  const intro = document.querySelector('#portfolio-intro');
  const foto = document.querySelector('#portfolio .media');
  const pequenas = {};
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const fs = parseFloat(cs.fontSize); if (fs < 12) { const k = fs + 'px'; (pequenas[k] ||= []).push((el.className || el.tagName).toString().slice(0, 30)); }
  }
  for (const k in pequenas) pequenas[k] = [...new Set(pequenas[k])].slice(0, 8);
  return { lcp: Math.round(window.__lcp), introAltura: intro?.offsetHeight, telas: +(foto.getBoundingClientRect().top + scrollY) / innerHeight, pequenas };
});
console.log(JSON.stringify({ loadMs: load, mbAte4s: +(bytes / 1e6).toFixed(1), porTipo, ...r }, null, 1));
await browser.close(); srv.close?.(); process.exit(0);
