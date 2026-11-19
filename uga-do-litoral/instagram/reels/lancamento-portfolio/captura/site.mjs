// S1_site: o showreel da página inicial do site (site-lab/index.html), vivo, no relógio virtual.
// Uso: node site.mjs [--ate N]   Saída: ../quadros/S1_site/cor/000000.jpg ... e pronto.json
// Quatro momentos (quadros locais): 0-26 abertura (PEDRO / AUGUSTO, funções embaralhando),
// 27-53 colagem rolando com inércia (fotos revelando, fundo líquido), 54-80 voo de uma foto pra galeria,
// 81-109 GRADE / folha de contato com o lápis vermelho. Um empurrão lento de câmera em cada momento (pós, Python).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FERR = path.resolve(AQUI, '../../../../portfolio/ferramentas');
const SITE = path.resolve(AQUI, '../../../../portfolio/site-lab');
const { chromium } = await import(pathToFileURL(path.join(FERR, 'node_modules/playwright-core/index.mjs')).href);
const { servir } = await import(pathToFileURL(path.join(FERR, 'servidor.mjs')).href);

const args = process.argv.slice(2);
const ateI = args.indexOf('--ate');
const QUADROS = 110;
const HZ = args.includes('--h'); // horizontal: layout de computador 1280x720 @1,5 = 1920x1080, saída em S1_site_h
const OW = HZ ? 1920 : 1080, OH = HZ ? 1080 : 1920;
const fim = ateI >= 0 ? Number(args[ateI + 1]) : QUADROS;
const SAIDA = path.resolve(AQUI, HZ ? '../quadros/S1_site_h' : '../quadros/S1_site');
const BRUTO = path.join(AQUI, HZ ? '_bruto_s1h' : '_bruto_s1');
fs.rmSync(BRUTO, { recursive: true, force: true }); fs.mkdirSync(BRUTO, { recursive: true });

const srv = await servir(SITE);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--hide-scrollbars'] });
const ctx = await browser.newContext({ viewport: HZ ? { width: 1280, height: 720 } : { width: 540, height: 960 }, deviceScaleFactor: HZ ? 1.5 : 2 });
await ctx.addInitScript({ content: fs.readFileSync(path.join(AQUI, 'relogio.js'), 'utf8') });
await ctx.addInitScript(() => {
  // vídeo nenhum toca sozinho: o arreio posiciona o currentTime a cada quadro
  HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  try { localStorage.setItem('uga-dica-toque', '1'); } catch {}
  // animações CSS e transições andam no relógio virtual
  const inicio = new WeakMap();
  window.__sincAnim = () => {
    const agora = window.__relogio.agora;
    for (const a of document.getAnimations()) {
      if (!inicio.has(a)) inicio.set(a, agora);
      a.pause(); a.currentTime = agora - inicio.get(a);
    }
  };
});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('  [erro na pagina]', String(e).split('\n')[0]));
await page.goto(`${srv.url}/index.html?semente=fixa`);

// um quadro de vídeo = dois passos de 16,7 ms (o fundo líquido mede o quadro e baixaria a resolução com 33 ms)
const passo = () => page.evaluate(() => { window.__relogio.avancar(1000 / 60); window.__relogio.avancar(1000 / 60); window.__sincAnim(); });
for (let k = 0; k < 400; k++) {
  await passo();
  if (await page.evaluate(() => !document.querySelector('#cortina') && window.portfolioReady)) break;
  await page.waitForTimeout(10);
}
await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; } .intro-skip { visibility: hidden !important; } #gallery-dialog :focus, #gallery-dialog :focus-visible { outline: none !important; box-shadow: none !important; }' });
// todas as fotos já pedidas (nada de carga preguiçosa virando card vazio na rolagem)
await page.evaluate(() => { document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; }); });
await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
// abertura do reel: o nome fica em duas linhas limpas (sem a rolagem que fecha uma linha na outra) e a linha
// de serviços desce pra baixo do nome, maior e legível. Tudo em memória, só nesta página.
await page.addStyleTag({ content: `
  .intro-roles { top: calc(50% + min(27vw, 29svh) * .83 + 26px) !important; font-size: ${HZ ? 26 : 22}px !important; letter-spacing: .02em; }
  .intro-roles-visual { opacity: 1 !important; transform: none !important; }
  .intro-name { transform: scale(.9); }` });
await page.evaluate(() => {
  const SIMB = '%#&+/*=';
  const alvos = [...document.querySelectorAll('#portfolio-intro .intro-text'), document.querySelector('#portfolio-intro .intro-roles-visual')];
  const originais = alvos.map(e => e.textContent);
  // o mesmo embaralhamento de js/intro.js (símbolos girando, resolvendo da esquerda pra direita), também no nome
  window.__embaralhar = n => alvos.forEach((el, k) => {
    const txt = originais[k];
    const ini = k === 2 ? 1 : 0, dur = k === 2 ? 12 : 11 + k; // o nome resolve em ~11-12 quadros; os serviços logo atrás
    const reveal = Math.min(1, Math.max(0, (n - ini) / dur));
    const resolved = Math.floor(reveal * txt.length);
    el.textContent = [...txt].map((c, i) => (i < resolved || /[\s·]/.test(c) || reveal === 1) ? c : SIMB[(i * 3 + n * 2 + k) % SIMB.length]).join('');
  });
});

const geo = await page.evaluate(() => {
  const s = document.querySelector('#portfolio-intro'), st = s.querySelector('.intro-stage');
  return { top: s.getBoundingClientRect().top + scrollY, travel: s.offsetHeight - st.offsetHeight, fimIntro: s.offsetTop + s.offsetHeight };
});
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = u => 1 - (1 - u) ** 3;
const easeInOut = u => (u < .5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);

/** rolagem pedida pra cada quadro local */
function rolagem(n) {
  if (n < 27) return geo.top; // a abertura fica parada: quem anda é o embaralhamento, o fundo e o empurrão de câmera
  if (n < 81) { // a colagem: um peteleco, inércia que morre perto do q. 60
    const u = clamp((n - 27) / 33, 0, 1), k = 2.6;
    return geo.fimIntro - 30 + 950 * (1 - Math.exp(-k * u)) / (1 - Math.exp(-k));
  }
  return null; // na grade quem manda é o próprio site (setView), e a gente desce devagar a partir dali
}
let yGrade = 0;

/** pré-rolagem: o relógio anda sem gravar, pra o trecho já começar com as fotos reveladas */
async function preRolar(passos) {
  for (let k = 0; k < passos; k++) {
    await passo();
    await page.evaluate(() => Promise.all([...document.images].filter(i => !i.complete).map(i => i.decode().catch(() => {}))));
    await page.waitForTimeout(16);
  }
}
const vaziosEm = () => page.evaluate(() => [...document.querySelectorAll('#portfolio .media')].filter(c => {
  const r = c.getBoundingClientRect(); if (r.bottom < 40 || r.top > innerHeight - 40 || c.closest('[hidden]')) return false;
  const v = c.querySelector('img,video'); if (!v) return false;
  const st = getComputedStyle(v);
  return c.classList.contains('latente') || Number(st.opacity) < .5 || (v.tagName === 'IMG' && !v.complete);
}).length);
let piorVazios = 0, quadrosRuins = [];

for (let n = 0; n < fim; n++) {
  // ---- eventos do roteiro ----
  if (n === 27) { // corte pra colagem: pula a abertura e deixa a colagem assentar 1,5 s antes do quadro
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), rolagem(27));
    await preRolar(HZ ? 90 : 45);
  }
  if (n === 56) {
    // a foto mais perto do centro (não filme) voa pra galeria
    const alvo = await page.evaluate(() => {
      let best = null, bd = 1e9;
      const todos = [...document.querySelectorAll('#portfolio .media[data-photo]')];
      for (const c of todos) {
        // só artista com mais de uma foto: a galeria tem pra onde passar
        if (!c.dataset.gallery || todos.filter(o => o.dataset.gallery === c.dataset.gallery).length < 2) continue;
        const r = c.getBoundingClientRect();
        const cy = r.top + r.height / 2; if (cy < 160 || cy > innerHeight - 160) continue;
        const d = Math.abs(r.top + r.height / 2 - innerHeight * .48);
        // o clique tem que cair nesse card mesmo (no computador os cards se sobrepõem e um filme pode estar por cima)
        const topo = document.elementFromPoint(r.left + r.width / 2, cy)?.closest('.media');
        if (topo !== c) continue;
        if (d < bd) { bd = d; best = [r.left + r.width / 2, r.top + r.height / 2]; }
      }
      return best;
    });
    if (alvo) { await page.mouse.click(alvo[0], alvo[1]); await page.mouse.move(-10, -10); }
  }
  if (n === 74) await page.keyboard.press('ArrowRight');
  if (n === 81) {
    await page.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); location.hash = '#fotos'; });
    await page.waitForTimeout(50);
    await preRolar(45);
    yGrade = await page.evaluate(() => scrollY);
  }
  // ---- rolagem ----
  let y = rolagem(n);
  if (n >= 81) y = yGrade + 520 * easeInOut(clamp((n - 81) / 29, 0, 1)) ** 1;
  if (n < 56 || n >= 81) await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
  // ---- a revelação começa um pouco antes do card entrar (no site ela espera o card aparecer 15%):
  // assim o card chega já se revelando e nunca há mais de um retângulo vazio na tela ----
  if (n >= 27) await page.evaluate(() => document.querySelectorAll('#portfolio .media.latente').forEach(c => {
    const r = c.getBoundingClientRect();
    if (r.top < innerHeight + 650 && r.bottom > -100) { c.classList.add('revelando'); c.classList.remove('latente'); setTimeout(() => c.classList.remove('revelando'), 1300); }
  }));
  // ---- relógio ----
  await passo();
  if (n < 27) await page.evaluate(n => window.__embaralhar(n), n);
  // ---- filmes nos cards ----
  await page.evaluate(async t => {
    const vs = [...document.querySelectorAll('video')].filter(v => v.getAttribute('src') && v.readyState >= 1 && isFinite(v.duration));
    await Promise.all(vs.map((v, k) => new Promise(ok => {
      const alvo = (t + 1.3 * k) % Math.max(.5, v.duration - .1);
      if (Math.abs(v.currentTime - alvo) < 1e-3) return ok();
      const to = window.__esperaReal(800).then(ok);
      v.addEventListener('seeked', ok, { once: true }); v.currentTime = alvo;
    })));
  }, n / 30);
  await page.evaluate(() => Promise.all([...document.images].filter(i => i.getBoundingClientRect().bottom > 0 && i.getBoundingClientRect().top < innerHeight && !i.complete).map(i => i.decode().catch(() => {}))));
  if (n >= 27) { const v = await vaziosEm(); piorVazios = Math.max(piorVazios, v); if (v > 1) quadrosRuins.push(n); }
  await page.screenshot({ path: path.join(BRUTO, String(n).padStart(6, '0') + '.png'), animations: 'allow', caret: 'initial' });
  if (n % 10 === 0) process.stdout.write(`  S1_site ${n}/${fim}\r`);
}
await browser.close(); await srv.fechar();
console.log(`  cards vazios em tela: pior ${piorVazios}; quadros com mais de um: ${quadrosRuins.join(',') || 'nenhum'}`);

// pós: um empurrão lento de câmera por momento (escala 1,00 → 1,045 em torno do centro), JPG 95
fs.rmSync(path.join(SAIDA, 'cor'), { recursive: true, force: true });
fs.mkdirSync(path.join(SAIDA, 'cor'), { recursive: true });
execFileSync('python', ['-c', `
import os, sys
from PIL import Image
src, dst, fim = sys.argv[1], sys.argv[2], int(sys.argv[3])
cortes = [0, 27, 54, 81, 110]
for n in range(fim):
    m = max(i for i in range(4) if cortes[i] <= n)
    u = (n - cortes[m]) / (cortes[m + 1] - cortes[m])
    s = 1 + (.02 if m == 0 else .045) * u
    im = Image.open(os.path.join(src, f'{n:06d}.png')).convert('RGB')
    W, H = im.size; w, h = W / s, H / s
    im = im.resize((int(sys.argv[4]), int(sys.argv[5])), Image.LANCZOS, box=((W - w) / 2, (H - h) / 2, (W + w) / 2, (H + h) / 2))
    im.save(os.path.join(dst, f'{n:06d}.jpg'), quality=95)
`, BRUTO, path.join(SAIDA, 'cor'), String(fim), String(OW), String(OH)]);
fs.rmSync(BRUTO, { recursive: true, force: true });
if (fim === QUADROS) fs.writeFileSync(path.join(SAIDA, 'pronto.json'), JSON.stringify({
  quadros: QUADROS, passes: ['cor'], fps: 30, largura: OW, altura: OH,
  fonte: 'portfolio/site-lab/index.html?semente=fixa, ' + (HZ ? 'layout de computador 1280x720 @1,5x' : 'layout de celular 540x960 @2x') + ', relogio virtual (timers, rAF, animacoes CSS e videos posicionados por quadro)',
  momentos: {
    '0-26': 'abertura: PEDRO / AUGUSTO e FOTOGRAFIA · VIDEO · EDICAO embaralhando (algoritmo de js/intro.js aplicado tambem ao nome, em memoria) nos q0-12; nome assenta inteiro em duas linhas ~q12, servicos ~q13, abaixo do nome e maiores (22 px css); depois parado, fundo liquido vivo',
    '27-53': 'colagem com o fundo liquido (pre-rolagem de 1,5 s: entra ja revelada), peteleco de rolagem com inercia; revelam so as fotos que entram',
    '54-80': 'q56: toque numa foto e o voo dela pra galeria (flight.js); q74: proxima foto da galeria',
    '81-109': 'GRADE (folha de contato, pre-rolagem de 1,5 s) com o lapis vermelho contornando a foto em foco, descendo devagar'
  },
  obs: 'empurrao lento de camera em pos (escala 1,00 a 1,045 por momento, centro). Sem cursor.'
}, null, 2));
console.log(`S1_site: ${fim} quadros, cor`);
