async function detectarSeccionSucursales(page) {
  try {
    return await page.evaluate(() => {
      const terminos = /sucursal|puntos de atencion|donde estamos|nuestras tiendas|localizador/i;
      const enlaces = [...document.querySelectorAll('a')]
        .filter((a) => terminos.test(a.innerText || '') && /^https?:\/\//.test(a.href || ''))
        .map((a) => a.href);
      const haySeccion = /sucursal/i.test(document.body.innerText);
      return { haySeccion, enlaces: [...new Set(enlaces)].slice(0, 5) };
    });
  } catch {
    return { haySeccion: false, enlaces: [] };
  }
}

function armarSucursales(sucursales, sitio, seccion) {
  return {
    sitio,
    sucursales,
    seccion_sucursales: seccion.haySeccion ? 'Detectada' : 'No publicada por el sitio',
    enlaces_sucursales: seccion.enlaces,
    nota: 'Mercado Pago es un medio de pago digital (no una cadena de supermercados) y no publica sucursales fisicas con horarios, direcciones, telefonos o coordenadas en el sitio asignado.',
  };
}

module.exports = { detectarSeccionSucursales, armarSucursales };