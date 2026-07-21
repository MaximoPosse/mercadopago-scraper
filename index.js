const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { scrapeDetallePromocion, detectarTipoPromocion } = require('./scraperPromociones');
const { log, error: logError } = require('./utils/logger');

const DATA_DIR = path.join(__dirname, 'data');
const URL = 'https://promociones.mercadopago.com.ar/';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  let browser;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const inicio = Date.now();
    log('Inicio del proceso de scraping');
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

    const duplicados = promocionesBase.length - promocionesUnicas.length;
    log(`Promociones encontradas: ${promocionesBase.length}, únicas: ${promocionesUnicas.length}, duplicadas descartadas: ${duplicados}`);
    console.log(`Promociones únicas (sin duplicados): ${promocionesUnicas.length}\n`);

    const resultados = [];
    let errores = 0;
    const MAX_INTENTOS = 3;

    for (let i = 0; i < promocionesUnicas.length; i++) {
      const promo = promocionesUnicas[i];
      const idx = i + 1;
      const total = promocionesUnicas.length;
      const nombre = promo.comercio || 'Sin nombre';

      console.log(`[${idx}/${total}] Procesando: ${nombre}`);
      log(`Procesando [${idx}/${total}]: ${nombre}`);

      let detalle;
      let exito = false;

      for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
          detalle = await scrapeDetallePromocion(page, promo.url_promocion);
          exito = true;
          break;
        } catch (error) {
          if (intento < MAX_INTENTOS) {
            log(`  ⚠ Intento ${intento}/${MAX_INTENTOS} falló, reintentando...`);
            await sleep(intento * 2000);
          } else {
            errores++;
            logError(`  ✗ Error en ${nombre} tras ${MAX_INTENTOS} intentos: ${error.message}`);
          }
        }
      }

      if (exito) {
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

        log(`  ✓ Procesada: ${nombre}`);
      } else {
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

    const anteriores = (() => {
      try {
        return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      } catch {
        return [];
      }
    })();

    fs.writeFileSync(outputPath, JSON.stringify(resultados, null, 2));

    const urlsAnteriores = new Set(anteriores.map(p => p.url_promocion));
    const urlsNuevas = new Set(resultados.map(p => p.url_promocion));
    const agregadas = resultados.filter(p => !urlsAnteriores.has(p.url_promocion));
    const eliminadas = anteriores.filter(p => !urlsNuevas.has(p.url_promocion));

    if (anteriores.length > 0) {
      console.log(`\n--- Cambios detectados ---`);
      console.log(`  Nuevas promociones: ${agregadas.length}`);
      agregadas.forEach(p => console.log(`    + ${p.comercio}: ${p.beneficio}`));
      console.log(`  Promociones eliminadas: ${eliminadas.length}`);
      eliminadas.forEach(p => console.log(`    - ${p.comercio}: ${p.beneficio}`));
      console.log(`-------------------------\n`);
    }

    const procesadasOk = resultados.length - errores;
    const segundos = ((Date.now() - inicio) / 1000).toFixed(2);
    const stats = {
      fecha_ejecucion: new Date().toISOString(),
      duracion_segundos: parseFloat(segundos),
      promociones_encontradas: promocionesBase.length,
      promociones_procesadas_ok: procesadasOk,
      promociones_con_error: errores,
      promociones_duplicadas: duplicados,
      total_guardadas: resultados.length,
      promociones_agregadas: anteriores.length > 0 ? agregadas.length : null,
      promociones_eliminadas: anteriores.length > 0 ? eliminadas.length : null,
    };

    const reportePath = path.join(DATA_DIR, 'reporte.json');
    fs.writeFileSync(reportePath, JSON.stringify(stats, null, 2));

    console.log(`\nProceso finalizado.`);
    console.log(`Total procesadas: ${resultados.length}`);
    console.log(`Errores: ${errores}`);
    console.log(`Datos guardados en: ${outputPath}`);
    console.log(`Reporte guardado en: ${reportePath}`);
    console.log(`Duración total: ${segundos}s`);

    log(`Proceso finalizado. ${procesadasOk} ok, ${errores} errores, ${duplicados} duplicadas. Duración: ${segundos}s`);

  } catch (error) {
    console.error('\nError crítico en el scraper:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navegador cerrado.');
      log('Navegador cerrado');
    }
  }
})();
