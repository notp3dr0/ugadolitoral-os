const sharp = require('sharp'), potrace = require('potrace'), fs = require('fs');
const [X, Y, W, H, S] = [350, 295, 390, 540, 4];
const cls = {
  amarelo: (r,g,b) => r > 200 && g > 140 && b < 110 && r - b > 120,
  oliva:   (r,g,b) => g > r - 5 && g - b > 35 && r < 175 && g > 90,
  marrom:  (r,g,b) => r > 110 && r < 200 && r - g > 30 && g - b > 15 && b < 100,
};
(async () => {
  const { data, info } = await sharp('ref.jpg').extract({ left: X, top: Y, width: W, height: H })
    .resize(W*S, H*S, { kernel: 'lanczos3' }).blur(1.2).raw().toBuffer({ resolveWithObject: true });
  const out = {};
  for (const [nome, f] of Object.entries(cls)) {
    const m = Buffer.alloc(info.width * info.height);
    for (let i = 0; i < m.length; i++) { const o = i * info.channels; m[i] = f(data[o], data[o+1], data[o+2]) ? 0 : 255; }
    const png = await sharp(m, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();
    fs.writeFileSync(`mask-${nome}.png`, png);
    out[nome] = await new Promise((ok, err) => potrace.trace(png, { turdSize: 400, optTolerance: 0.4, alphaMax: 1.0, threshold: 128 }, (e, svg) => e ? err(e) : ok(svg)));
    const d = (out[nome].match(/ d="([^"]+)"/) || [])[1] || '';
    console.log(nome, 'subpaths:', (d.match(/M/g) || []).length, 'len', d.length);
    fs.writeFileSync(`path-${nome}.txt`, d);
  }
  const vb = `0 0 ${W*S} ${H*S}`;
  const cor = { amarelo:'#FFBB00', oliva:'#85933C', marrom:'#975F30' };
  fs.writeFileSync('simbolo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">` +
    Object.keys(cor).map(k => `<path fill="${cor[k]}" fill-rule="evenodd" d="${fs.readFileSync('path-'+k+'.txt','utf8')}"/>`).join('') + '</svg>');
})();
