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
    // encadenar hacia arriba desde el H2 para hallar el contenedor de la seccion
    const h2 = [...document.querySelectorAll('h2')]
      .find(e => /Aprovechá los descuentos pagando con Mercado Pago/i.test(e.innerText));
    if (!h2) return { error: 'no h2' };
    let cont = h2;
    for (let i = 0; i < 8 && cont; i++) {
      if (cont.className.includes('e-con')) break;
      cont = cont.parentElement;
    }
    const datos = { cls: cont ? cont.className : null };

    // enlaces dentro de la seccion
    const links = cont ? [...cont.querySelectorAll('a')]
      .map(a => ({ href: a.href, txt: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80) })) : [];
    datos.links = links.filter((l, i) => links.findIndex(x => x.href === l.href) === i).slice(0, 25);

    // ofertas/tiles con % dentro de la seccion
    const textos = cont
      ? [...cont.querySelectorAll('*')]
          .filter(e => e.children.length === 0)
          .map(e => e.innerText.replace(/\s+/g, ' ').trim())
          .filter(t => t && t.length < 80)
      : [];
    datos.tiles = [...new Set(textos)].slice(0, 40);

    // imagen principal de la seccion
    const img = cont ? cont.querySelector('img') : null;
    datos.img = img ? img.src : null;
    return datos;
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();