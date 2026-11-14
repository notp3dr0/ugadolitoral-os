// Renderiza o comercial sem motor de vídeo: serve a pasta, abre index.html no Chromium,
// chama window.seek(t) quadro a quadro, fotografa e manda pro ffmpeg.
// Uso:
//   node render.cjs h|v                 -> entregas/video-<f>-mudo.mp4 (20 s, 30 fps)
//   node render.cjs h|v folha 0.3 1.1   -> conferencia/<f>-<t>.jpg (quadros soltos)
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const AQUI = __dirname, FPS = 30, DUR = 20;
const [f = 'h', modo, ...tempos] = process.argv.slice(2);
const W = f === 'h' ? 1920 : 1080, H = f === 'h' ? 1080 : 1920;
const MIME = { '.html': 'text/html', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf', '.jpg': 'image/jpeg' };

const srv = http.createServer((q, r) => {
  const p = path.join(AQUI, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(AQUI) || !fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
});

(async () => {
  await new Promise(r => srv.listen(0, r)); const porta = srv.address().port;
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  await pg.goto(`http://localhost:${porta}/index.html?f=${f}`);
  await pg.evaluate(() => window.pronto);
  const foto = async t => { await pg.evaluate(t => window.seek(t), t); return pg.screenshot({ type: 'jpeg', quality: 94 }); };

  if (modo === 'folha') {
    fs.mkdirSync(path.join(AQUI, 'conferencia'), { recursive: true });
    for (const t of tempos) fs.writeFileSync(path.join(AQUI, 'conferencia', `${f}-${t}.jpg`), await foto(+t));
  } else {
    fs.mkdirSync(path.join(AQUI, 'entregas'), { recursive: true });
    const saida = path.join(AQUI, 'entregas', `video-${f}-mudo.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', FPS, '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', FPS, saida], { stdio: ['pipe', 'inherit', 'inherit'] });
    const N = FPS * DUR, t0 = Date.now();
    for (let i = 0; i < N; i++) {
      const buf = await foto(i / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 60 === 0) process.stdout.write(`${f}: ${i}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('ok', saida);
  }
  await b.close(); srv.close();
})();
