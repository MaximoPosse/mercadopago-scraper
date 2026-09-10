const { limpiarTexto } = require('./utils/limpiarTexto');

function normalizarAcentos(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function sanitizarTerminos(texto) {
  const limpio = limpiarTexto(texto);
  if (!limpio) return null;

  if (limpio.length < 50) return null;

  const basura = [
    /cookie/i,
    /política de privacidad/i,
    /página no encontrada/i,
    /no pudimos encontrar/i,
    /ir al inicio/i,
    /ir al contenido principal/i,
    /aceptar/i,
    /suscribirme/i,
    /suscribite/i,
    /ingresá tu email/i,
    /mi cuenta/i,
    /mis pedidos/i,
    /comunicate con nosotros/i,
    /sitio oficial/i,
    /hot sale/i,
    /hashtag/i,
    /centro de ayuda/i,
    /seguí tu compra/i,
    /puntos de retiro/i,
    /^menu\s/i,
    /^search\s/i,
    /^person_outline\s/i,
  ];
  if (basura.some(re => re.test(limpio))) return null;

  const navInicio = [
    /^celulares?\s/i,
    /^lanzamientos?\s/i,
    /^hogar\s/i,
    /^televisi/i,
    /^lavarropas?\s/i,
    /^heladeras?\s/i,
    /^aire/i,
    /^notebook/i,
    /^bazar\s/i,
    /^perfume/i,
  ];
  if (navInicio.some(re => re.test(limpio))) return null;

  const cantidadPrecios = (limpio.match(/\$\s*[\d.,]+/g) || []).length;
  if (cantidadPrecios > 3) return null;

  if (/\d+\s*(kg|g|ml|l|gb|tb|pulgadas?|")/i.test(limpio)) return null;

  const palabras = limpio.split(/\s+/);
  const palabrasCortas = palabras.filter(p => p.length <= 3).length;
  if (palabras.length > 0 && (palabrasCortas / palabras.length) > 0.5) return null;

  if (limpio.length > 800) {
    return `${limpio.slice(0, 800)}...`;
  }

  return limpio;
}

function detectarTipoPromocion(beneficio, descripcion) {
  const texto = normalizarAcentos(limpiarTexto(`${beneficio || ''} ${descripcion || ''}`));
  if (/\b2x1\b/.test(texto)) return '2x1';
  if (/\b3x2\b/.test(texto)) return '3x2';
  if (/\d+%\s*(off|desc|dto)?/i.test(texto)) return 'descuento';
  if (/reintegro|devolucion|cash.back/i.test(texto)) return 'reintegro';
  if (/sin.interes/i.test(texto) && /cuota/i.test(texto)) return 'cuotas sin interés';
  if (/bonif/i.test(texto)) return 'bonificación';
  return null;
}

async function scrapeDetallePromocion(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

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

    const clean = t => (t || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
    const bodyText = clean(document.body.innerText || '');

    if (bodyText.includes('Hubo un error') || bodyText.includes('Página no encontrada') || bodyText.length < 100) {
      return result;
    }

    const bancosSet = new Set();
    const marcasSet = new Set();
    const sucursalesSet = new Set();

    function listAfter(el) {
      const items = el?.querySelectorAll('li') || [];
      return [...items].map(li => clean(li.innerText)).filter(Boolean);
    }

    const headings = document.querySelectorAll('h2, h3, h4, h5');
    headings.forEach(h => {
      const headingText = clean(h?.innerText || '');
      const text = headingText.toLowerCase();
      let content = '';
      let sib = h?.nextElementSibling;
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
      const textBlocks = document.querySelectorAll('p, div, section');
      let best = '';
      textBlocks.forEach(p => {
        const t = clean(p.innerText);
        if (t && t.length > 80 && t.length < 2000 && /termino|condicion|legales|requisito|bases/i.test(t)) {
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
  }).then((result) => ({
    ...result,
    terminos_condiciones: sanitizarTerminos(result.terminos_condiciones),
    metodo_pago: limpiarTexto(result.metodo_pago),
    bancos: result.bancos.map(limpiarTexto).filter(Boolean),
    marcas: result.marcas.map(limpiarTexto).filter(Boolean),
    sucursales: result.sucursales.map(limpiarTexto).filter(Boolean),
  }));
}

module.exports = { scrapeDetallePromocion, detectarTipoPromocion };
