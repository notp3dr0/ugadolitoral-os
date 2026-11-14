// Tira um "retrato" do acervo depois que o JavaScript rodou: uma linha por card, com atributos em
// ordem alfabetica. Serve pra provar que o HTML gerado + o JS novo chegam no mesmo DOM de antes.
// Uso: node dom.mjs [pasta=../site-lab] --sem-js > saida/dom-agora.txt
//      depois: diff referencia/dom-acervo.txt saida/dom-agora.txt   (sem saida = igual)
// A referencia e o HTML cru (--sem-js), desde a rodada 2.5: com JS o poster dos filmes entra
// conforme a rolagem, entao o DOM depois do JS varia.
// Com --sem-js mostra o HTML cru, antes de qualquer script (o que o visitante sem JS recebe).
import { chromium } from 'playwright-core';
import { servir } from './servidor.mjs';

const pasta = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '../site-lab';
const semJs = process.argv.includes('--sem-js');
const srv = await servir(pasta);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', javaScriptEnabled: !semJs });
const page = await ctx.newPage();
await page.goto(srv.url + '/', { waitUntil: 'load' });
if (!semJs) await page.waitForFunction(() => window.portfolioReady === true, null, { timeout: 8000 });
const linhas = await page.evaluate(() => {
  const atributos = el => [...el.attributes]
    .filter(a => !(a.name === 'class' && !a.value))
    .map(a => {
      let valor = a.value;
      if (a.name === 'style') valor = valor.split(';').map(p => p.trim().replace(/\s*:\s*/, ':')).filter(Boolean).sort().join(';');
      if (a.name === 'class') valor = valor.split(/\s+/).filter(c => c && c !== 'dragging').sort().join(' ');
      return `${a.name}="${valor}"`;
    }).sort().join(' ');
  const no = el => `<${el.tagName.toLowerCase()} ${atributos(el)}>` +
    [...el.childNodes].map(c => c.nodeType === 3 ? c.textContent : c.nodeType === 1 ? no(c) : '').join('') +
    `</${el.tagName.toLowerCase()}>`;
  const acervo = document.querySelector('#portfolio');
  return [
    `#portfolio ${atributos(acervo)}`,
    `contador: ${document.querySelector('.acervo-bar > span')?.textContent}`,
    ...[...acervo.children].map(no)
  ];
});
console.log(linhas.join('\n'));
await browser.close();
await srv.fechar();
