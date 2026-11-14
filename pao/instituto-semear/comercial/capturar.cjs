// Captura as peças reais do site do Semear (isemear.org.br) e os estados de interface
// (submenu aberto, abas clicadas, carrossel andando). Saída: assets/ui/*.png + caixas.json
const { chromium } = require('playwright'); const fs = require('fs');
const box = {};
const SEC = 'xpath=ancestor::*[contains(@class,"elementor-section") or contains(@class,"e-con")][1]';
const COL = 'xpath=ancestor::div[contains(@class,"elementor-column") or contains(@class,"e-con")][1]';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const shot = async (name, loc, pad = 0) => {
    const bb = await loc.boundingBox();
    const clip = { x: Math.max(0, bb.x - pad), y: Math.max(0, bb.y - pad), width: bb.width + 2 * pad, height: bb.height + 2 * pad };
    await p.screenshot({ path: `assets/ui/${name}.png`, clip }); box[name] = clip;
  };
  const acordar = async () => { await p.mouse.move(300, 400); await p.mouse.wheel(0, 10); await p.waitForTimeout(3500); await p.mouse.wheel(0, -10); await p.waitForTimeout(500); };

  // ---------- home ----------
  await p.goto('https://www.isemear.org.br', { waitUntil: 'networkidle', timeout: 60000 }); await acordar();
  await p.screenshot({ path: 'assets/ui/home-viewport.png' });
  await shot('header', p.locator('header, .elementor-location-header').first());
  const fp = p.locator('a.elementor-item.has-submenu:visible', { hasText: 'FAÇA PARTE' }).first();
  box.fp = await fp.boundingBox();
  await p.mouse.move(box.fp.x + box.fp.width / 2, box.fp.y + box.fp.height / 2, { steps: 6 });
  await p.evaluate(() => {
    const a = [...document.querySelectorAll('a.elementor-item.has-submenu')].find(a => a.innerText.trim() === 'FAÇA PARTE' && a.getBoundingClientRect().width > 0);
    jQuery(a).closest('ul').smartmenus('itemActivate', jQuery(a));
  });
  await p.waitForTimeout(900);
  const R = { x: 0, y: 0, width: 1440, height: 320 };
  await p.screenshot({ path: 'assets/ui/header-menu-aberto.png', clip: R });
  const sj = p.locator('a.elementor-sub-item:visible', { hasText: 'SEJA UM JOVEM' }).first();
  box.sejaJovem = await sj.boundingBox();
  await p.mouse.move(box.sejaJovem.x + 60, box.sejaJovem.y + box.sejaJovem.height / 2, { steps: 6 }); await p.waitForTimeout(500);
  await p.screenshot({ path: 'assets/ui/header-menu-hover.png', clip: R });
  await p.mouse.move(700, 700); await p.mouse.click(5, 600); await p.waitForTimeout(600);

  const qs = p.locator('.elementor-heading-title').filter({ hasText: /^QUEM SOMOS\?$/ }).first();
  await shot('quemsomos-col', qs.locator(COL), 10);
  await shot('video-card', p.locator('iframe').first());
  const impT = p.locator('.elementor-heading-title').filter({ hasText: /^IMPACTO$/ }).first();
  await shot('impacto-faixa', impT.locator(SEC));
  await impT.scrollIntoViewIfNeeded(); await p.mouse.wheel(0, 400); await p.waitForTimeout(6000);
  const nums = p.locator('.elementor-widget-counter'); const n = await nums.count(); console.log('contadores', n);
  for (let i = 0; i < n; i++) await shot('contador-' + i, nums.nth(i).locator(COL), 10);
  if (n) await shot('impacto-linha', nums.first().locator(SEC));

  const dep = p.locator('.elementor-heading-title').filter({ hasText: /^DEPOIMENTOS$/ }).first().locator(SEC);
  await dep.scrollIntoViewIfNeeded(); await p.waitForTimeout(1000);
  await shot('depoimentos', dep);

  const parT = p.locator('.elementor-heading-title').filter({ hasText: /Nossos Parceiros/ }).first();
  await parT.scrollIntoViewIfNeeded(); await p.mouse.wheel(0, 250); await p.waitForTimeout(1500);
  const car = p.locator('.elementor-widget-image-carousel, .elementor-widget-media-carousel, .swiper').filter({ has: p.locator('img') });
  console.log('carrosseis', await car.count());
  const car0 = car.first();
  await p.evaluate(() => document.querySelectorAll('.swiper, .swiper-container').forEach(s => { const w = s.swiper; if (w && w.autoplay) w.autoplay.stop(); }));
  await p.waitForTimeout(800);
  await shot('parceiros-0', car0, 30);
  const nx = car0.locator('.elementor-swiper-button-next, .swiper-button-next').first();
  box.parceirosNext = await nx.boundingBox().catch(() => null);
  for (let k = 1; k <= 3; k++) { await nx.click({ force: true }).catch(e => console.log('seta', e.message)); await p.waitForTimeout(1000); await shot('parceiros-' + k, car0, 30); }

  const cta = p.locator('.elementor-heading-title').filter({ hasText: /VEM GERAR A MUDANÇA/ }).first().locator(SEC);
  await cta.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await shot('cta-site', cta);

  // ---------- seja um bolsista: abas ----------
  await p.goto('https://www.isemear.org.br/seja-um-bolsista/', { waitUntil: 'networkidle' }); await acordar();
  await p.screenshot({ path: 'assets/ui/bolsista-viewport.png' });
  const tabsB = p.locator('.elementor-widget-eael-adv-tabs').first(); await tabsB.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const tB = tabsB.locator('li.eael-tab-nav-item'); const ntB = await tB.count(); console.log('abas bolsista', ntB);
  for (let i = 0; i < ntB; i++) {
    await tB.nth(i).click(); await p.waitForTimeout(900);
    await shot('bolsista-aba-' + i, tabsB, 12);
    for (let j = 0; j < ntB; j++) box[`bolsista-aba-${i}-tab${j}`] = await tB.nth(j).boundingBox();
    fs.writeFileSync(`assets/ui/bolsista-aba-${i}.txt`, await tabsB.innerText());
  }

  // ---------- três pilares: abas ----------
  await p.goto('https://www.isemear.org.br/tres-pilares/', { waitUntil: 'networkidle' }); await acordar();
  await p.screenshot({ path: 'assets/ui/pilares-viewport.png' });
  const tabsP = p.locator('.elementor-widget-eael-adv-tabs').first(); await tabsP.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const tP = tabsP.locator('li.eael-tab-nav-item'); const ntP = await tP.count(); console.log('abas pilares', ntP);
  for (let i = 0; i < ntP; i++) {
    await tP.nth(i).click(); await p.waitForTimeout(900);
    await shot('pilares-aba-' + i, tabsP, 12);
    for (let j = 0; j < ntP; j++) box[`pilares-aba-${i}-tab${j}`] = await tP.nth(j).boundingBox();
    fs.writeFileSync(`assets/ui/pilares-aba-${i}.txt`, await tabsP.innerText());
  }

  fs.writeFileSync('assets/ui/caixas.json', JSON.stringify(box, null, 1));
  await b.close();
})();
