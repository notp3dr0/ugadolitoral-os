const sharp = require('sharp'), potrace = require('potrace'), fs = require('fs');
const [X, Y, W, H, S] = [134, 446, 946, 676, 3];
const pal = { azul:[0x23,0x7B,0x9F], azul2:[0x19,0x62,0x82], amarelo:[0xFF,0xBB,0x00], oliva:[0x85,0x93,0x3C], oliva2:[0x5E,0x68,0x2C], marrom:[0x97,0x5F,0x30], papel:[0xED,0xED,0xED] };
(async () => {
  const { data, info } = await sharp('ref4.jpg').extract({ left:X, top:Y, width:W, height:H }).resize(W*S, H*S, { kernel:'lanczos3' }).blur(1).raw().toBuffer({ resolveWithObject:true });
  const nomes = Object.keys(pal), lab = new Uint8Array(info.width*info.height);
  for (let i=0;i<lab.length;i++){ const o=i*info.channels; let best=0,bd=1e9; nomes.forEach((n,k)=>{ const c=pal[n]; const d=(data[o]-c[0])**2+(data[o+1]-c[1])**2+(data[o+2]-c[2])**2; if(d<bd){bd=d;best=k;} }); lab[i]=best; }
  const out = {};
  for (let k=0;k<nomes.length;k++){ if(nomes[k]==='papel') continue;
    const m = Buffer.alloc(lab.length); for(let i=0;i<lab.length;i++) m[i] = lab[i]===k?0:255;
    const png = await sharp(m,{raw:{width:info.width,height:info.height,channels:1}}).png().toBuffer();
    const svg = await new Promise((ok,err)=>potrace.trace(png,{turdSize:120,optTolerance:0.4},(e,s)=>e?err(e):ok(s)));
    out[nomes[k]] = (svg.match(/ d="([^"]+)"/)||[])[1]||''; console.log(nomes[k], (out[nomes[k]].match(/M/g)||[]).length);
  }
  fs.writeFileSync('estampa-data.json', JSON.stringify({ viewBox:[W*S,H*S], cores:Object.fromEntries(Object.entries(pal).map(([n,c])=>[n,'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')])), paths:out }));
  const cor = JSON.parse(fs.readFileSync('estampa-data.json')).cores;
  fs.writeFileSync('estampa.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W*S} ${H*S}">`+Object.entries(out).map(([n,d])=>`<path fill="${cor[n]}" fill-rule="evenodd" d="${d}"/>`).join('')+'</svg>');
})();
