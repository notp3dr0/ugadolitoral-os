// O FIO · render. Abre o index.html num Chrome sem janela, pede cada quadro ao renderFrame,
// grava PNG em render/quadros/ e junta com o ffmpeg em MP4 (H.264 yuv420p, CRF 16, áudio AAC).
//
//   node render/render.mjs                    filme inteiro -> ../entregas/hasag-black-november-o-fio.mp4
//   node render/render.mjs --manter           idem, sem apagar os quadros no fim
//   node render/render.mjs --quadros 0,435,822   quadros soltos em render/revisao/ (tamanho cheio)
//   node render/render.mjs --folha 0,60,119 --nome p1   folha de contato em render/revisao/p1.png
//   node render/render.mjs --prancha          prancha de 24 quadros -> ../entregas/o-fio-prancha.png
import {chromium} from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const ENTREGAS = path.resolve(RAIZ, '..', 'entregas');
const QUADROS = path.join(AQUI, 'quadros');
const REVISAO = path.join(AQUI, 'revisao');
const TOTAL = 1080;
const FPS = 30;

const args = process.argv.slice(2);
const arg = (nome) => {
  const i = args.indexOf('--' + nome);
  return i < 0 ? null : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
};
const lista = (v) => String(v).split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));

// servidor de arquivos mínimo (fonte e scripts carregam sem atrito de file://)
const TIPOS = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.png': 'image/png'};
const servidor = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const arq = path.join(RAIZ, u === '/' ? 'index.html' : u);
  if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
  fs.createReadStream(arq).pipe(res);
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const URL_BASE = `http://127.0.0.1:${servidor.address().port}/index.html?render=1`;

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const navegador = await chromium.launch({
  headless: true,
  ...(fs.existsSync(CHROME) ? {executablePath: CHROME} : {}),
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'],
});

const abrir = async () => {
  const pag = await navegador.newPage({viewport: {width: 540, height: 960}});
  const erros = [];
  pag.on('pageerror', (e) => erros.push(String(e)));
  pag.on('console', (m) => {
    if (m.type() === 'error' && !/404/.test(m.text())) erros.push(m.text());
  });
  await pag.goto(URL_BASE);
  await pag.waitForFunction(() => window.OFIO_PRONTO === true, null, {timeout: 30000});
  pag.erros = erros;
  return pag;
};
const quadroPNG = async (pag, f) => {
  const b64 = await pag.evaluate((n) => {
    try {
      window.OFIO.renderFrame(window.OFIO_CTX, n);
    } catch (e) {
      return 'ERRO:' + (e && e.stack ? e.stack : e);
    }
    return document.getElementById('tela').toDataURL('image/png').slice(22);
  }, f);
  if (b64.startsWith('ERRO:')) throw new Error(`quadro ${f}: ${b64.slice(5)}`);
  return Buffer.from(b64, 'base64');
};
// folha de contato montada no próprio navegador
const folha = async (pag, quadros, colunas, celW) => {
  const b64 = await pag.evaluate(
    ({quadros, colunas, celW}) => {
      const O = window.OFIO;
      const celH = Math.round((celW * 16) / 9);
      const rot = 30;
      const linhas = Math.ceil(quadros.length / colunas);
      const c = document.createElement('canvas');
      c.width = colunas * celW + (colunas + 1) * 8;
      c.height = linhas * (celH + rot) + (linhas + 1) * 8;
      const x = c.getContext('2d');
      x.fillStyle = '#0c0b0b';
      x.fillRect(0, 0, c.width, c.height);
      const erros = [];
      quadros.forEach((f, i) => {
        const cx = 8 + (i % colunas) * (celW + 8);
        const cy = 8 + Math.floor(i / colunas) * (celH + rot + 8);
        try {
          O.renderFrame(window.OFIO_CTX, f);
          x.drawImage(document.getElementById('tela'), cx, cy, celW, celH);
        } catch (e) {
          erros.push(f + ': ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
          x.fillStyle = '#400';
          x.fillRect(cx, cy, celW, celH);
        }
        let p = O.PLANOS[0];
        for (const q of O.PLANOS) if (f >= q.ini) p = q;
        x.fillStyle = '#f2f1ed';
        x.font = "500 18px 'Jost', sans-serif";
        x.textBaseline = 'middle';
        x.fillText(`q${String(f).padStart(4, '0')} · ${(f / O.FPS).toFixed(1)} s · P${p.n}`, cx + 2, cy + celH + rot / 2 + 1);
      });
      return JSON.stringify({erros, png: c.toDataURL('image/png').slice(22)});
    },
    {quadros, colunas, celW}
  );
  const r = JSON.parse(b64);
  for (const e of r.erros) console.error('ERRO no quadro', e);
  return Buffer.from(r.png, 'base64');
};

const fechar = async () => {
  await navegador.close();
  servidor.close();
};

try {
  if (arg('quadros')) {
    fs.mkdirSync(REVISAO, {recursive: true});
    const pag = await abrir();
    for (const f of lista(arg('quadros'))) {
      const arq = path.join(REVISAO, `q${String(f).padStart(4, '0')}.png`);
      fs.writeFileSync(arq, await quadroPNG(pag, f));
      console.log(arq);
    }
    if (pag.erros.length) console.error(pag.erros.join('\n'));
  } else if (arg('teste')) {
    // folha de modelos (src/zz-testes.js): node render/render.mjs --teste personagem
    fs.mkdirSync(REVISAO, {recursive: true});
    const pag = await abrir();
    const nome = String(arg('teste'));
    const b64 = await pag.evaluate((n) => {
      const c = document.getElementById('tela');
      const x = window.OFIO_CTX;
      x.setTransform(1, 0, 0, 1, 0, 0);
      try { window.OFIO.testes[n](x, c); } catch (e) { return 'ERRO:' + e.stack; }
      return c.toDataURL('image/png').slice(22);
    }, nome);
    if (b64.startsWith('ERRO:')) throw new Error(b64);
    const arq = path.join(REVISAO, 'teste-' + nome + '.png');
    fs.writeFileSync(arq, Buffer.from(b64, 'base64'));
    console.log(arq);
  } else if (arg('folha')) {
    fs.mkdirSync(REVISAO, {recursive: true});
    const pag = await abrir();
    const qs = lista(arg('folha'));
    const col = parseInt(arg('colunas') || '0', 10) || Math.min(qs.length, 4);
    const arq = path.join(REVISAO, `${arg('nome') || 'folha'}.png`);
    fs.writeFileSync(arq, await folha(pag, qs, col, parseInt(arg('largura') || '360', 10)));
    console.log(arq);
    if (pag.erros.length) console.error(pag.erros.join('\n'));
  } else if (arg('prancha')) {
    fs.mkdirSync(ENTREGAS, {recursive: true});
    const pag = await abrir();
    const qs = Array.from({length: 24}, (_, i) => 22 + i * 45); // um quadro a cada segundo e meio
    const arq = path.join(ENTREGAS, 'o-fio-prancha.png');
    fs.writeFileSync(arq, await folha(pag, qs, 6, 300));
    console.log(arq);
  } else {
    // filme inteiro
    const t0 = Date.now();
    fs.rmSync(QUADROS, {recursive: true, force: true});
    fs.mkdirSync(QUADROS, {recursive: true});
    fs.mkdirSync(ENTREGAS, {recursive: true});
    const ini = parseInt(arg('de') || '0', 10);
    const fim = parseInt(arg('ate') || String(TOTAL), 10);
    const nTrab = parseInt(arg('trabalhadores') || '4', 10);
    let prox = ini;
    let feitos = 0;
    await Promise.all(
      Array.from({length: nTrab}, async () => {
        const pag = await abrir();
        for (;;) {
          const f = prox++;
          if (f >= fim) break;
          fs.writeFileSync(path.join(QUADROS, `q${String(f - ini).padStart(4, '0')}.png`), await quadroPNG(pag, f));
          feitos++;
          if (feitos % 90 === 0) console.log(`  ${feitos}/${fim - ini} quadros · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
        }
        if (pag.erros.length) console.error(pag.erros.join('\n'));
        await pag.close();
      })
    );
    console.log(`quadros prontos em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    const saida = arg('saida') ? path.resolve(String(arg('saida'))) : path.join(ENTREGAS, 'hasag-black-november-o-fio.mp4');
    const trilha = path.join(RAIZ, 'audio', 'trilha.wav');
    const temTrilha = fs.existsSync(trilha) && ini === 0 && fim === TOTAL;
    if (!temTrilha) console.warn('sem trilha (rode node audio/gerar-trilha.mjs) ou render parcial: MP4 sai mudo');
    const ff = [
      '-y', '-hide_banner', '-loglevel', 'error', '-nostats',
      '-framerate', String(FPS), '-i', path.join(QUADROS, 'q%04d.png'),
      ...(temTrilha ? ['-i', trilha] : []),
      '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-r', String(FPS),
      ...(temTrilha ? ['-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest'] : []),
      '-movflags', '+faststart', saida,
    ];
    const r = spawnSync('ffmpeg', ff, {stdio: 'inherit'});
    if (r.status !== 0) throw new Error('ffmpeg falhou');
    console.log('MP4:', saida);
    if (!arg('manter')) {
      fs.rmSync(QUADROS, {recursive: true, force: true});
      console.log('quadros temporários apagados');
    }
  }
} finally {
  await fechar();
}
