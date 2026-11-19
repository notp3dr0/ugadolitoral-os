// Traço do navegador durante a rolagem (celular médio, CPU 4x): soma o tempo de cada tipo de tarefa da linha
// principal (pintura, estilo, layout, decodificar imagem, script...) pra achar o que trava. Uso:
// node traco-rolagem.mjs [pasta|url]   (CSS="..." injeta estilo pra experimento)
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
const alvo = process.argv[2] || '../site-lab';
let url = alvo, srv = null;
if (!/^https?:/.test(alvo)) { srv = await servir(alvo); url = srv.url + '/'; }
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
if (process.env.CSS) await page.addInitScript(css => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); }), process.env.CSS);
const cdp = await ctx.newCDPSession(page);
await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(4000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const eventos = [];
cdp.on('Tracing.dataCollected', e => eventos.push(...e.value));
const fim = new Promise(ok => cdp.once('Tracing.tracingComplete', ok));
await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc', 'gpu', 'v8'] }, transferMode: 'ReportEvents' });
for (let i = 0; i < 24; i++) { await page.mouse.wheel(0, 380); await page.waitForTimeout(160); }
await cdp.send('Tracing.end'); await fim;
// linha principal do renderer: a thread chamada CrRendererMain
const nomes = new Map(); for (const e of eventos) if (e.name === 'thread_name') nomes.set(`${e.pid}:${e.tid}`, e.args.name);
const soma = new Map(), somaGpu = new Map();
for (const e of eventos) {
  if (e.ph !== 'X' || !e.dur) continue;
  const th = nomes.get(`${e.pid}:${e.tid}`) || '';
  const alvoM = th === 'CrRendererMain' ? soma : /Compositor|Raster|GPU|Viz|CrGpuMain/i.test(th) ? somaGpu : null;
  if (!alvoM) continue;
  const k = th === 'CrRendererMain' ? e.name : `${th}: ${e.name}`;
  alvoM.set(k, (alvoM.get(k) || 0) + e.dur / 1000);
}
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${v.toFixed(0).padStart(7)} ms  ${k}`).join('\n');
console.log('--- linha principal\n' + top(soma, 18) + '\n--- composição e pintura (outras threads)\n' + top(somaGpu, 10));
await browser.close(); srv?.close?.(); process.exit(0);
