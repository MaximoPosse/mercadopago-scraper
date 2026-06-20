const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { scrapeDetallePromocion, detectarTipoPromocion } = require('./scraperPromociones');

const DATA_DIR = path.join(__dirname, 'data');
const URL = 'https://promociones.mercadopago.com.ar/';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  let browser;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    console.log('Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    console.log('Accediendo al sitio:', URL);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.kiyo__cards--col', { timeout: 30000 });

    try {
      const botones = await page.$$('.kiyo__button--load-more');
      for (const btn of botones) {
        const visible = await btn.isIntersectingViewport();
        if (visible) {
          console.log('Cargando más promociones...');
          await btn.click();
          await sleep(3000);
          break;
        }
      }
    } catch {
      // No load-more button found
    }

    const promocionesBase = await page.evaluate(() => {
      const clean = t => (t || '').replace(/\s+/g, ' ').trim();
      const columnas = document.querySelectorAll('.kiyo__cards--col');
      return [...columnas].map(columna => {
        const data = columna.querySelector('.kiyo__data');
        const item = columna.querySelector('.kiyo__cards--item');
        return {
          comercio: clean(data?.querySelector('h3')?.innerText || item?.querySelector('h3')?.innerText),
          beneficio: clean(data?.querySelector('.kiyo__cards--badge:not(.kiyo__cards--badge2) span')?.innerText || item?.querySelector('.kiyo__cards--badge:not(.kiyo__cards--badge2) span')?.innerText),
          cuotas: clean(data?.querySelector('.kiyo__cards--badge2 span')?.innerText || item?.querySelector('.kiyo__cards--badge2 span')?.innerText),
          imagen: data?.querySelector('img')?.src || item?.querySelector('img')?.src || null,
          descripcion: clean(data?.querySelector('.kiyo__data--details-row1 p')?.innerText),
          vigencia: clean(data?.querySelector('.kiyo__data--details-row2 small')?.innerText),
          url_promocion: data?.querySelector('.kiyo__data--details-btn a')?.href || null,
        };
      });
    });

    console.log(`\nPromociones encontradas en la página principal: ${promocionesBase.length}`);

    const seen = new Map();
    promocionesBase.forEach(p => {
      if (p.url_promocion && !seen.has(p.url_promocion)) {
        seen.set(p.url_promocion, p);
      }
    });
    const promocionesUnicas = [...seen.values()];

    console.log(`Promociones únicas (sin duplicados): ${promocionesUnicas.length}\n`);

    const resultados = [];
    let errores = 0;

    for (let i = 0; i < promocionesUnicas.length; i++) {
      const promo = promocionesUnicas[i];
      const idx = i + 1;
      const total = promocionesUnicas.length;
      const nombre = promo.comercio || 'Sin nombre';

      console.log(`[${idx}/${total}] Procesando: ${nombre}`);

      try {
        const detalle = await scrapeDetallePromocion(page, promo.url_promocion);

        resultados.push({
          comercio: promo.comercio,
          beneficio: promo.beneficio,
          tipo_promocion: detalle.tipo_promocion || detectarTipoPromocion(promo.beneficio, promo.descripcion),
          descripcion: promo.descripcion,
          vigencia: promo.vigencia,
          metodo_pago: detalle.metodo_pago,
          bancos: detalle.bancos,
          marcas: detalle.marcas,
          sucursales: detalle.sucursales,
          terminos_condiciones: detalle.terminos_condiciones,
          imagen: promo.imagen,
          imagen_condiciones: detalle.imagen_condiciones,
          url_promocion: promo.url_promocion,
        });

        console.log(`  ✓ Procesada`);
      } catch (error) {
        errores++;
        console.error(`  ✗ Error: ${error.message}`);

        resultados.push({
          comercio: promo.comercio,
          beneficio: promo.beneficio,
          tipo_promocion: detectarTipoPromocion(promo.beneficio, promo.descripcion),
          descripcion: promo.descripcion,
          vigencia: promo.vigencia,
          metodo_pago: null,
          bancos: [],
          marcas: [],
          sucursales: [],
          terminos_condiciones: null,
          imagen: promo.imagen,
          imagen_condiciones: null,
          url_promocion: promo.url_promocion,
        });
      }
    }

    const outputPath = path.join(DATA_DIR, 'promociones.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultados, null, 2));

    console.log(`\nProceso finalizado.`);
    console.log(`Total procesadas: ${resultados.length}`);
    console.log(`Errores: ${errores}`);
    console.log(`Datos guardados en: ${outputPath}`);

  } catch (error) {
    console.error('\nError crítico en el scraper:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navegador cerrado.');
    }
  }
})();
