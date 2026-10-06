const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://promociones.mercadopago.com.ar/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 30; i++) {
    const n = await page.evaluate(() => document.querySelectorAll('.kiyo__cards--col').length).catch(() => 0);
    if (n > 0) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  const info = await page.evaluate(() => {
    const candidatos = [];
    document.querySelectorAll('a, h2, h3, div, section').forEach(e => {
      const txt = (e.innerText || '').replace(/\s+/g, ' ').trim();
      if (/mercado\s*pago/i.test(txt) && txt.length > 10 && txt.length < 200) {
        candidatos.push({
          tag: e.tagName,
          cls: e.className,
          href: e.getAttribute && e.getAttribute('href'),
          txt: txt.slice(0, 150),
        });
      }
    });
    // dedupe por txt+cls
    const vistos = new Set();
    return candidatos.filter(c => {
      const k = c.tag + '|' + c.cls + '|' + c.href + '|' + c.txt;
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    }).slice(0, 15);
  });
  info.forEach(i => console.log(JSON.stringify(i, null, 0)));

  await browser.close();
})();