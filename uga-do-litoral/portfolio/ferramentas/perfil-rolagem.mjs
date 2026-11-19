// Onde o processador gasta enquanto a home rola (celular médio: CPU 4x mais lenta). Perfil do JavaScript por
// arquivo e função, e o tempo de estilo/layout/pintura da página. Uso: node perfil-rolagem.mjs [pasta|url] [chave=valor...]
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
const alvo = process.argv[2] || '../site-lab', extra = process.argv[3] || '';
let url = alvo, srv = null;
if (!/^https?:/.test(alvo)) { srv = await servir(alvo); url = srv.url + '/'; }
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
// experimento: CSS="..." injeta estilo; JS="..." roda antes da página (pra desligar um efeito e medir sem ele)
if (process.env.CSS) await page.addInitScript(css => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); }), process.env.CSS);
if (process.env.JS) await page.addInitScript(process.env.JS);
await page.goto(url + (extra ? (url.includes('?') ? '&' : '?') + extra : ''), { waitUntil: 'load' });
await page.waitForTimeout(4000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Performance.enable');
const antes = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
await page.evaluate(() => { window.__q = []; let u = performance.now(); const f = t => { window.__q.push(t - u); u = t; window.__r = requestAnimationFrame(f); }; window.__r = requestAnimationFrame(f); });
for (let i = 0; i < 24; i++) { await page.mouse.wheel(0, 380); await page.waitForTimeout(160); }
const { profile } = await cdp.send('Profiler.stop');
const depois = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const q = await page.evaluate(() => { cancelAnimationFrame(window.__r); const q = window.__q.slice(3).sort((a, b) => a - b); return { med: q[q.length >> 1], p95: q[Math.floor(q.length * .95)], pior: q[q.length - 1], n: q.length }; });
// tempo próprio por função (amostras)
const porNo = new Map(profile.nodes.map(n => [n.id, n])); const conta = new Map();
const dts = profile.timeDeltas; profile.samples.forEach((id, i) => conta.set(id, (conta.get(id) || 0) + (dts[i] || 0)));
const porFunc = new Map(), porArq = new Map();
for (const [id, us] of conta) {
  const n = porNo.get(id).callFrame, arq = (n.url || '(' + n.functionName + ')').split('/').pop() || '(?)';
  const chave = `${n.functionName || '(anon)'} @ ${arq}:${n.lineNumber + 1}`;
  porFunc.set(chave, (porFunc.get(chave) || 0) + us); porArq.set(arq, (porArq.get(arq) || 0) + us);
}
const top = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${(v / 1000).toFixed(0).padStart(6)} ms  ${k}`).join('\n');
const d = k => ((depois[k] - antes[k]) * 1000).toFixed(0);
console.log(`${process.env.ROTULO || ''} quadros: mediano ${q.med.toFixed(1)} p95 ${q.p95.toFixed(1)} pior ${q.pior.toFixed(1)} (${q.n})`);
console.log(`navegador: script ${d('ScriptDuration')} ms · layout ${d('LayoutDuration')} ms · estilo ${d('RecalcStyleDuration')} ms · tarefas ${d('TaskDuration')} ms`);
console.log('--- por arquivo\n' + top(porArq) + '\n--- por função\n' + top(porFunc));
await browser.close(); srv?.close?.(); process.exit(0);
