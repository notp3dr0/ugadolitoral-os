// Servidor estatico minimo, sem dependencias.
// Em codigo: const s = await servir(pasta); s.url; await s.fechar();
// No terminal: node servidor.mjs ../site-lab 4174
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TIPOS = {
  html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8', json: 'application/json', webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png',
  svg: 'image/svg+xml', mp4: 'video/mp4', ttf: 'font/ttf', woff2: 'font/woff2',
  txt: 'text/plain; charset=utf-8', md: 'text/plain; charset=utf-8',
  m3u8: 'application/vnd.apple.mpegurl', ts: 'video/mp2t', mov: 'video/quicktime'
};

export function servir(pasta, porta = 0) {
  const raiz = path.resolve(pasta);
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const arquivo = path.join(raiz, rel);
    if (!arquivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
    fs.stat(arquivo, (erro, info) => {
      if (erro || !info.isFile()) { res.writeHead(404).end('404'); return; }
      const tipo = TIPOS[path.extname(arquivo).slice(1).toLowerCase()] || 'application/octet-stream';
      const faixa = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      if (faixa) {
        const inicio = Number(faixa[1]);
        const fim = faixa[2] ? Number(faixa[2]) : info.size - 1;
        res.writeHead(206, {
          'Content-Type': tipo, 'Content-Range': `bytes ${inicio}-${fim}/${info.size}`,
          'Content-Length': fim - inicio + 1, 'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': info.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
        fs.createReadStream(arquivo).pipe(res);
      }
    });
  });
  return new Promise(resolve => server.listen(porta, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    fechar: () => new Promise(done => { server.closeAllConnections?.(); server.close(done); })
  })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const alvo = process.argv[2] || '../site-lab';
  const s = await servir(alvo, Number(process.argv[3] || 4174));
  console.log('servindo', path.resolve(alvo), 'em', s.url, '(Ctrl+C para parar)');
}
