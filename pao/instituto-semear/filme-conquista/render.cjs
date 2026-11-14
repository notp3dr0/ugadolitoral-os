// Renderiza o filme: serve a pasta, abre a página no Chromium, chama window.seek(t) quadro a quadro,
// fotografa e manda pro ffmpeg. 24 fps, 30 s = 720 quadros.
// Uso:
//   node render.cjs                         -> entregas/video-mudo.mp4
//   node render.cjs folha 0.5 3 9.2         -> conferencia/q-<t>.png (quadros soltos)
//   node render.cjs ficha pesquisadora      -> fichas/pesquisadora.png
//   node render.cjs filme --de 10 --ate 14  -> trecho (conferencia/trecho.mp4)
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const AQUI = __dirname, FPS = 24, DUR = 30, W = 1920, H = 1080;
const [modo = 'filme', ...args] = process.argv.slice(2);
const EST = process.env.ESTILO || 'cel'; // cel | flat | morph
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? +args[i + 1] : d; };

const srv = http.createServer((q, r) => {
  const p = path.join(AQUI, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(AQUI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(p).pipe(r);
});

(async () => {
  await new Promise(r => srv.listen(0, r)); const porta = srv.address().port;
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  pg.on('pageerror', e => console.log('[page error]', e.message));
  const url = modo === 'ficha' ? `ficha.html?p=${args[0]}` : `index.html?estilo=${EST}`;
  await pg.goto(`http://localhost:${porta}/${url}`);
  await pg.waitForFunction(() => window.pronto === true, null, { timeout: 120000 });
  const foto = async (t, type = 'png') => { await pg.evaluate(t => window.seek(t), t); return pg.screenshot(type === 'png' ? { type } : { type, quality: 95 }); };

  if (modo === 'ficha') {
    fs.mkdirSync(path.join(AQUI, 'fichas'), { recursive: true });
    fs.writeFileSync(path.join(AQUI, 'fichas', `${args[0]}.png`), await foto(0));
  } else if (modo === 'folha') {
    fs.mkdirSync(path.join(AQUI, 'conferencia'), { recursive: true });
    for (const t of args) fs.writeFileSync(path.join(AQUI, 'conferencia', `q-${EST}-${t}.png`), await foto(+t));
  } else {
    const de = opt('de', 0), ate = opt('ate', DUR), trecho = de > 0 || ate < DUR;
    const saida = trecho ? path.join(AQUI, 'conferencia', `trecho-${EST}.mp4`) : path.join(AQUI, 'entregas', `video-mudo-${EST}.mp4`);
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', FPS, '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', trecho ? '20' : '14', '-pix_fmt', 'yuv420p', '-r', FPS, saida], { stdio: ['pipe', 'inherit', 'inherit'] });
    const f0 = Math.round(de * FPS), f1 = Math.round(ate * FPS), t0 = Date.now();
    for (let i = f0; i < f1; i++) {
      const buf = await foto(i / FPS, 'jpeg');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 48 === 0) process.stdout.write(`${i}/${f1} (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('ok', saida);
  }
  await b.close(); srv.close();
})();
