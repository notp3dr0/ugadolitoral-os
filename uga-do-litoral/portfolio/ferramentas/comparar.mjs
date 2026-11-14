// Compara pixel a pixel o site original com o lab, com "menos movimento" ligado (fundo liquido e
// videos parados, pra imagem ser deterministica). Prova que uma refatoracao nao mudou a cara do site.
// Uso: node comparar.mjs [original=../site] [lab=../site-lab] [saida=./saida/comparar]
// Sai com codigo 1 se alguma tela diferir em mais de 0,05% dos pixels.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { servir } from './servidor.mjs';

const [a = '../site', b = '../site-lab', saida = './saida/comparar'] = process.argv.slice(2);
const LIMITE = 0.0005;
fs.mkdirSync(saida, { recursive: true });
const sa = await servir(a);
const sb = await servir(b);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const telas = {
  celular: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } }
};
// [nome, rota, pagina inteira?]
const vistas = [['inicio', '/#inicio', true], ['grade', '/#fotos', true], ['info', '/#info', true], ['galeria', '/#inicio', false]];

async function fotografar(base, opcoes, [, rota, inteira]) {
  const ctx = await browser.newContext({ ...opcoes, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + '/?semente=fixa' + rota.replace(/^\//, ''), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  if (inteira) {
    // rola tudo pra carregar as imagens lazy, depois volta pro topo
    const altura = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < altura; y += opcoes.viewport.height) {
      await page.evaluate(v => scrollTo(0, v), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => scrollTo(0, 0));
  } else {
    await page.locator('.media.photo').first().click({ force: true });
    // a galeria mostra a versao grande: espera ela chegar e decodificar, senao o print pega a pequena
    await page.waitForFunction(() => { const i = document.querySelector('#gallery-image'); return /-(lg|md)\.webp$/.test(i.currentSrc || i.src) && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 });
    await page.evaluate(() => document.querySelector('#gallery-image').decode().catch(() => {}));
    await page.waitForTimeout(1200); // o Chrome repinta a imagem reduzida em qualidade alta logo depois
  }
  await page.waitForLoadState('networkidle');
  // so as imagens ja carregadas: decode() numa imagem lazy fora da tela nunca resolve
  await page.evaluate(() => Promise.race([
    Promise.all([...document.images].filter(i => i.complete && i.naturalWidth).map(i => i.decode().catch(() => {}))),
    new Promise(r => setTimeout(r, 3000))
  ]));
  await page.waitForTimeout(400);
  const png = await page.screenshot({ fullPage: inteira });
  await ctx.close();
  return png;
}

const juiz = await (await browser.newContext()).newPage();
async function diferenca(p1, p2) {
  const urls = [p1, p2].map(p => 'data:image/png;base64,' + p.toString('base64'));
  return juiz.evaluate(async ([u1, u2]) => {
    const carregar = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
    const [i1, i2] = await Promise.all([carregar(u1), carregar(u2)]);
    if (i1.width !== i2.width || i1.height !== i2.height) {
      return { tamanho: `${i1.width}x${i1.height} vs ${i2.width}x${i2.height}`, fracao: 1, mapa: null };
    }
    const c = document.createElement('canvas');
    c.width = i1.width; c.height = i1.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(i1, 0, 0);
    const d1 = x.getImageData(0, 0, c.width, c.height).data;
    x.drawImage(i2, 0, 0);
    const img2 = x.getImageData(0, 0, c.width, c.height);
    const d2 = img2.data;
    let n = 0;
    for (let k = 0; k < d1.length; k += 4) {
      const dif = Math.abs(d1[k] - d2[k]) + Math.abs(d1[k + 1] - d2[k + 1]) + Math.abs(d1[k + 2] - d2[k + 2]);
      if (dif > 24) { n++; d2[k] = 255; d2[k + 1] = 0; d2[k + 2] = 255; }
      else { d2[k] >>= 2; d2[k + 1] >>= 2; d2[k + 2] >>= 2; }
    }
    x.putImageData(img2, 0, 0);
    return { fracao: n / (d1.length / 4), mapa: n ? c.toDataURL('image/png') : null };
  }, urls);
}

let falhou = false;
for (const [tela, opcoes] of Object.entries(telas)) {
  for (const vista of vistas) {
    const [pa, pb] = await Promise.all([fotografar(sa.url, opcoes, vista), fotografar(sb.url, opcoes, vista)]);
    const r = await diferenca(pa, pb);
    const ok = r.fracao <= LIMITE;
    if (!ok) {
      falhou = true;
      fs.writeFileSync(`${saida}/${tela}-${vista[0]}-original.png`, pa);
      fs.writeFileSync(`${saida}/${tela}-${vista[0]}-lab.png`, pb);
      if (r.mapa) fs.writeFileSync(`${saida}/${tela}-${vista[0]}-diferenca.png`, Buffer.from(r.mapa.split(',')[1], 'base64'));
    }
    const extra = r.tamanho ? ' · tamanho ' + r.tamanho : '';
    console.log(`${ok ? 'IGUAL  ' : 'DIFERE '} ${tela} ${vista[0]}: ${(r.fracao * 100).toFixed(3)}% dos pixels${extra}`);
  }
}
await browser.close();
await sa.fechar();
await sb.fechar();
if (falhou) {
  console.log(`\nHa diferenca. Veja ${saida} (rosa = pixel que mudou).`);
  process.exit(1);
}
console.log('\nSem diferenca visivel entre original e lab.');
