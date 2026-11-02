const fs = require('fs');
function subpaths(d){ return d.split(/(?=M)/).map(s=>s.trim()).filter(Boolean); }
function bbox(d){ const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let i=0;i+1<n.length;i+=2){ x0=Math.min(x0,n[i]); x1=Math.max(x1,n[i]); y0=Math.min(y0,n[i+1]); y1=Math.max(y1,n[i+1]); }
  return {x0,y0,x1,y1,cx:(x0+x1)/2,cy:(y0+y1)/2,w:x1-x0,h:y1-y0}; }
const bodies = subpaths(fs.readFileSync('path-oliva.txt','utf8')).map(d=>({d,b:bbox(d)}));
const heads = subpaths(fs.readFileSync('path-amarelo.txt','utf8')).map(d=>({d,b:bbox(d)}));
console.log('bodies', bodies.map(o=>Math.round(o.b.w)+'x'+Math.round(o.b.h)).join(' '));
console.log('heads', heads.map(o=>Math.round(o.b.w)+'x'+Math.round(o.b.h)).join(' '));
// emparelhar: cada cabeça com o corpo mais próximo (greedy por distância)
const pares=[], usados=new Set();
const cand=[]; heads.forEach((h,i)=>bodies.forEach((b,j)=>cand.push([Math.hypot(h.b.cx-b.b.cx,h.b.cy-b.b.cy),i,j])));
cand.sort((a,b)=>a[0]-b[0]); const hu=new Set();
for(const [dist,i,j] of cand){ if(hu.has(i)||usados.has(j)) continue; hu.add(i); usados.add(j); pares.push({head:heads[i],body:bodies[j],dist}); }
const pessoas = pares.map(p=>{ const x0=Math.min(p.head.b.x0,p.body.b.x0), x1=Math.max(p.head.b.x1,p.body.b.x1), y0=Math.min(p.head.b.y0,p.body.b.y0), y1=Math.max(p.head.b.y1,p.body.b.y1);
  return { cx:(x0+x1)/2, cy:(y0+y1)/2, body:p.body.d, head:p.head.d, dist:Math.round(p.dist) }; }).sort((a,b)=>a.cy-b.cy||a.cx-b.cx);
console.log('dist max', Math.max(...pessoas.map(p=>p.dist)));
const maos = fs.readFileSync('path-marrom.txt','utf8');
fs.writeFileSync('logo-data.json', JSON.stringify({ viewBox:[1560,2160], pessoas, maos, maosBox:bbox(maos) }));
console.log('ok', pessoas.length, JSON.stringify(bbox(maos)));
