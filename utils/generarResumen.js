function generarResumen(promociones) {
  const porTipo = {};
  const porComercio = {};

  promociones.forEach((p) => {
    const tipo = p.tipo_promocion || 'sin clasificar';
    const comercio = p.comercio || 'Sin nombre';

    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    porComercio[comercio] = (porComercio[comercio] || 0) + 1;
  });

  const comerciosTop = Object.entries(porComercio)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([comercio, cantidad]) => ({ comercio, cantidad }));

  return {
    total: promociones.length,
    por_tipo: porTipo,
    comercios_top: comerciosTop,
  };
}

function generarCambios(anteriores, actuales) {
  const urlsAnteriores = new Set(anteriores.map((p) => p.url_promocion));
  const urlsActuales = new Set(actuales.map((p) => p.url_promocion));

  const resumir = (p) => ({
    comercio: p.comercio,
    beneficio: p.beneficio,
    tipo_promocion: p.tipo_promocion,
    vigencia: p.vigencia,
    url_promocion: p.url_promocion,
  });

  return {
    nuevas: actuales.filter((p) => !urlsAnteriores.has(p.url_promocion)).map(resumir),
    eliminadas: anteriores.filter((p) => !urlsActuales.has(p.url_promocion)).map(resumir),
  };
}

module.exports = { generarResumen, generarCambios };
