// Teste do efeito toque (rodada 3.4) com toque emulado pelo Chrome: segurar e arrastar, toque rapido,
// deslizar e nome do artista no card em foco. Uso: node toque.mjs [pasta=../site-lab]. Sai 1 se falhar.
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';
const s = await servir(process.argv[2] || '../site-lab'); let falhas = 0; const b = await chromium.launch({channel:'chrome',headless:true});
const ctx = await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p = await ctx.newPage(); const erros=[]; p.on('pageerror',e=>erros.push(String(e)));
await p.goto(s.url+'/?semente=fixa#inicio'); await p.waitForFunction(()=>window.portfolioReady); await p.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(p);
const toque = (type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
const caixa = async sel => { const c = await p.locator(sel).boundingBox(); return [c.x+c.width/2, c.y+c.height/2]; };
const ok = (c,m)=>{ if(!c) falhas++; console.log(c?'OK   ':'FALHA', m); };
// 1. segurar, mover 80 px, soltar
let [x,y] = await caixa('[data-photo="1"]');
const rolagemAntes = await p.evaluate(()=>scrollY);
await toque('touchStart',x,y); await p.waitForTimeout(450);
const levantado = await p.evaluate(()=>document.querySelector('[data-photo="1"]').classList.contains('levantado'));
for (let k=1;k<=8;k++){ await toque('touchMove',x-k*10,y+k*4); await p.waitForTimeout(16); }
await toque('touchEnd'); await p.waitForTimeout(500);
let r = await p.evaluate(()=>({t:document.querySelector('[data-photo="1"]').style.translate, g:document.querySelector('#gallery-dialog').open, dica:!!document.querySelector('.dica-toque'), scroll:scrollY}));
ok(levantado,'segurar 450 ms levanta o card'); ok(Math.abs(r.scroll-rolagemAntes)<2,'a pagina nao rolou durante o arrasto'); ok(r.t && r.t!=='0px 0px','card ficou onde soltou ('+r.t+')'); ok(!r.g,'galeria nao abriu'); ok(!r.dica,'dica sumiu depois de levantar');
// 2. toque rapido abre a galeria
[x,y] = await caixa('[data-photo="0"]');
await p.touchscreen.tap(x,y); await p.waitForTimeout(900);
ok(await p.evaluate(()=>document.querySelector('#gallery-dialog').open),'toque rapido abre a galeria');
await p.evaluate(()=>document.querySelector('#gallery-dialog .close-dialog').click()); await p.waitForTimeout(900);
// 3. deslizar rola a pagina
const antes = await p.evaluate(()=>scrollY);
[x,y] = await caixa('[data-photo="0"]');
await toque('touchStart',x,y+100); for (let k=1;k<=10;k++){ await toque('touchMove',x,y+100-k*30); await p.waitForTimeout(16);} await toque('touchEnd'); await p.waitForTimeout(600);
const depois = await p.evaluate(()=>scrollY);
ok(depois>antes+100,`deslizar rola a pagina (${antes} -> ${depois})`);
ok(!(await p.evaluate(()=>document.querySelector('#gallery-dialog').open)),'deslizar nao abriu a galeria');
// 4. nome do artista no card em foco
ok(await p.evaluate(()=>{const c=document.querySelector('.media.em-foco .media-label');return !!c && getComputedStyle(c).display!=='none';}),'nome do artista visivel no card em foco');
ok(!erros.length,'sem erro no console '+(erros[0]||''));
await p.screenshot({path:'saida/toque.png'});
await b.close(); await s.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Toque funcionando.'); process.exit(falhas ? 1 : 0);
