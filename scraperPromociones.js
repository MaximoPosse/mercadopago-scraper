function detectarTipoPromocion(beneficio, descripcion) {
  const texto = `${beneficio || ''} ${descripcion || ''}`.toLowerCase();
  if (/reintegro|devolucion|cash.back/i.test(texto)) return 'reintegro';
  if (/sin.interes/i.test(texto) && /cuota/i.test(texto)) return 'cuotas sin interés';
  if (/\b2x1\b/.test(texto)) return '2x1';
  if (/\b3x2\b/.test(texto)) return '3x2';
  if (/\d+%\s*(off|desc|dto)?/i.test(texto)) return 'descuento';
  if (/bonif/i.test(texto)) return 'bonificación';
  return null;
}

async function scrapeDetallePromocion(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  return await page.evaluate(() => {
    const result = {
      terminos_condiciones: null,
      metodo_pago: null,
      bancos: [],
      marcas: [],
      sucursales: [],
      tipo_promocion: null,
      vigencia_desde: null,
      vigencia_hasta: null,
      imagen_condiciones: null
    };

    const clean = t => (t || '').replace(/\s+/g, ' ').trim();
    const bancosSet = new Set();
    const marcasSet = new Set();
    const sucursalesSet = new Set();

    function listAfter(el) {
      const items = el?.querySelectorAll('li') || [];
      return [...items].map(li => clean(li.innerText)).filter(Boolean);
    }

    const headings = document.querySelectorAll('h2, h3, h4, h5');
    headings.forEach(h => {
      const text = clean(h.innerText).toLowerCase();
      let content = '';
      let sib = h.nextElementSibling;
      while (sib && !/^H[1-6]$/.test(sib.tagName)) {
        content += (sib.innerText || sib.textContent || '') + '\n';
        sib = sib.nextElementSibling;
      }
      content = clean(content);
      if (!content) return;

      if (/termino|condicion|legales|requisito|bases/i.test(text)) {
        if (!result.terminos_condiciones) result.terminos_condiciones = content;
      } else if (/medio.*pago|metodo.*pago|forma.*pago/i.test(text)) {
        if (!result.metodo_pago) result.metodo_pago = content;
      } else if (/banco|tarjeta|visa|mastercard|amex|cabal|naranja|maestro/i.test(text)) {
        const list = listAfter(h.nextElementSibling);
        list.forEach(v => bancosSet.add(v));
        if (list.length === 0 && content) bancosSet.add(content);
      } else if (/marca|categoria|rubro/i.test(text)) {
        const list = listAfter(h.nextElementSibling);
        list.forEach(v => marcasSet.add(v));
        if (list.length === 0 && content) marcasSet.add(content);
      } else if (/sucursal|zona|local|provincia|ubicacion|direccion|tienda/i.test(text)) {
        const list = listAfter(h.nextElementSibling);
        list.forEach(v => sucursalesSet.add(v));
        if (list.length === 0 && content) sucursalesSet.add(content);
      }
    });

    if (!result.terminos_condiciones) {
      const paras = document.querySelectorAll('p, div, section');
      let best = '';
      paras.forEach(p => {
        const t = clean(p.innerText);
        if (t && t.length > 80 && /termino|condicion|legales|requisito/i.test(t)) {
          if (t.length > best.length) best = t;
        }
      });
      if (best) result.terminos_condiciones = best;
    }

    document.querySelectorAll('img').forEach(img => {
      const alt = (img.alt || '').toLowerCase();
      const parent = (img.parentElement?.innerText || '').toLowerCase();
      if (/termino|condicion|legales|requisito|bases/.test(alt) ||
          (/termino|condicion/.test(parent) && img.src)) {
        if (!result.imagen_condiciones) result.imagen_condiciones = img.src;
      }
    });

    result.bancos = [...bancosSet];
    result.marcas = [...marcasSet];
    result.sucursales = [...sucursalesSet];

    return result;
  });
}

module.exports = { scrapeDetallePromocion, detectarTipoPromocion };
