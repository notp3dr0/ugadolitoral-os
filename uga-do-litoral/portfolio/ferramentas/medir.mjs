// Mede peso, LCP e quadros por segundo de uma pasta do site, em celular e desktop, e salva prints.
// Uso: node medir.mjs [pasta=../site-lab] [saida=./saida/medir] [pagina]
// A pagina vai SEM a barra inicial: "bastidor.html?s=30". Vazio = home.
// Sobe o proprio servidor e fecha no fim. Usa o Chrome instalado na maquina.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { servir } from './servidor.mjs';

const pasta = process.argv[2] || '../site-lab';
const saida = process.argv[3] || './saida/medir';
// O Git Bash troca um argumento que comeca com "/" por um caminho do Windows. Aceite a rota sem a barra
// inicial ("#fotos", "bastidor.html?s=30") e conserte se ela chegou trocada.
const rotaLimpa = r => { r = String(r).replace(/^[A-Za-z]:[\/].*?Git[\/]/, ''); return r.startsWith('/') ? r : '/' + r; };
const pagina = rotaLimpa(process.argv[4] || '');
fs.mkdirSync(saida, { recursive: true });
const srv = await servir(pasta);
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
});
const telas = {
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
};
const kb = n => Math.round(n / 1024);

for (const [nome, opcoes] of Object.entries(telas)) {
  const ctx = await browser.newContext(opcoes);
  const page = await ctx.newPage();
  const reqs = [];
  const erros = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push(String(e)));
  page.on('response', async r => {
    try { reqs.push([r.url().replace(srv.url + '/', ''), (await r.body()).length]); } catch {}
  });
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__longo = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__longo += e.duration; })
      .observe({ type: 'longtask', buffered: true });
  });
  await page.goto(srv.url + pagina, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const total = () => reqs.reduce((s, x) => s + x[1], 0);
  const porTipo = {};
  reqs.forEach(([u, b]) => { const t = u.split('?')[0].split('.').pop(); porTipo[t] = (porTipo[t] || 0) + b; });
  console.log(`\n== ${nome} · ${pagina}`);
  console.log(`carga inicial: ${reqs.length} req, ${kb(total())} KB`,
    JSON.stringify(Object.fromEntries(Object.entries(porTipo).map(([k, v]) => [k, kb(v)]))));
  console.log('maiores:', reqs.slice().sort((x, y) => y[1] - x[1]).slice(0, 5).map(([u, b]) => `${u} ${kb(b)}KB`).join(' | '));
  console.log('LCP', Math.round(await page.evaluate(() => window.__lcp)), 'ms · tarefas longas',
    Math.round(await page.evaluate(() => window.__longo)), 'ms');

  const qps = async rotulo => {
    const r = await page.evaluate(() => new Promise(res => {
      let n = 0, pior = 0, ult = performance.now();
      const t0 = ult;
      (function f(t) {
        n++; pior = Math.max(pior, t - ult); ult = t;
        if (t - t0 < 2000) requestAnimationFrame(f);
        else res([Math.round(n / ((t - t0) / 1000)), Math.round(pior)]);
      })(t0);
    }));
    console.log(`qps ${rotulo}: ${r[0]} (pior quadro ${r[1]} ms)`);
  };
  await qps('parado no topo');
  await page.screenshot({ path: `${saida}/${nome}-0-topo.png` });

  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  const fimIntro = await page.evaluate(() => {
    const i = document.querySelector('#portfolio-intro');
    return i ? i.offsetTop + i.offsetHeight : 0;
  });
  console.log('altura da pagina', altura, 'px');
  if (altura > opcoes.viewport.height * 1.5) {
    const alvo = Math.max(fimIntro * 1.6, opcoes.viewport.height * 3);
    const rolando = await page.evaluate(destino => new Promise(res => {
      let n = 0, pior = 0, ult = performance.now();
      const t0 = ult;
      (function f(t) {
        n++; pior = Math.max(pior, t - ult); ult = t;
        const p = (t - t0) / 3000;
        scrollTo(0, destino * Math.min(1, p));
        if (p < 1) requestAnimationFrame(f); else res([Math.round(n / 3), Math.round(pior)]);
      })(t0);
    }), alvo);
    console.log(`qps rolando: ${rolando[0]} (pior quadro ${rolando[1]} ms)`);
    await page.evaluate(y => scrollTo(0, y), fimIntro);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${saida}/${nome}-1-acervo.png` });
    for (let y = fimIntro; y < altura; y += opcoes.viewport.height) {
      await page.evaluate(v => scrollTo(0, v), y);
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);
    console.log(`depois de rolar tudo: ${reqs.length} req, ${(total() / 1048576).toFixed(1)} MB`);
    await page.screenshot({ path: `${saida}/${nome}-2-fim.png` });
  }
  if (await page.locator('.media.photo').count()) {
    await page.goto(srv.url + '/#inicio');
    await page.waitForTimeout(800);
    const antes = reqs.length;
    const pesoAntes = total();
    await page.locator('.media.photo').first().click({ force: true });
    await page.waitForTimeout(1500);
    console.log(`abrir a 1a galeria baixou ${kb(total() - pesoAntes)} KB em ${reqs.length - antes} req`);
    await page.screenshot({ path: `${saida}/${nome}-3-galeria.png` });
  }
  console.log('erros no console:', erros.length ? erros.slice(0, 5) : 'nenhum');
  await ctx.close();
}
await browser.close();
await srv.fechar();
console.log('\nprints em', saida);
