/**
 * Intenta extraer fechas desde textos como "Válido del 11 al 17 de mayo".
 * También soporta rangos entre meses: "del 28 de diciembre al 3 de enero".
 */
function parsearVigencia(texto) {
  const vigencia = (texto || '').trim();
  if (!vigencia) {
    return { vigencia_desde: null, vigencia_hasta: null };
  }

  const meses = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  };

  function mesANumero(nombre) {
    return meses[nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || null;
  }

  const matchDosMeses = vigencia.match(
    /(?:valido|válido|desde)?\s*(?:del?\s*)?(\d{1,2})\s*de\s*([a-záéíóúñ]+)\s*(?:al|a|-)\s*(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i
  );

  if (matchDosMeses) {
    const [, diaDesde, mesDesdeTexto, diaHasta, mesHastaTexto] = matchDosMeses;
    const mesDesde = mesANumero(mesDesdeTexto);
    const mesHasta = mesANumero(mesHastaTexto);
    if (!mesDesde || !mesHasta) {
      return { vigencia_desde: null, vigencia_hasta: null };
    }

    let anio = new Date().getFullYear();
    let anioHasta = anio;
    if (parseInt(mesHasta) < parseInt(mesDesde)) {
      anioHasta = anio + 1;
    }

    return {
      vigencia_desde: `${diaDesde.padStart(2, '0')}-${mesDesdeTexto.toLowerCase().slice(0, 3)}-${anio}`,
      vigencia_hasta: `${diaHasta.padStart(2, '0')}-${mesHastaTexto.toLowerCase().slice(0, 3)}-${anioHasta}`,
    };
  }

  const match = vigencia.match(
    /(?:valido|válido|desde)?\s*(?:del?\s*)?(\d{1,2})\s*(?:al|a|-)\s*(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i
  );

  if (!match) {
    return { vigencia_desde: null, vigencia_hasta: null };
  }

  const [, diaDesde, diaHasta, mesTexto] = match;
  const mes = mesTexto.toLowerCase().slice(0, 3);
  let anio = new Date().getFullYear();

  let anioHasta = anio;
  if (parseInt(diaHasta) < parseInt(diaDesde)) {
    anioHasta = anio + 1;
  }

  return {
    vigencia_desde: `${diaDesde.padStart(2, '0')}-${mes}-${anio}`,
    vigencia_hasta: `${diaHasta.padStart(2, '0')}-${mes}-${anioHasta}`,
  };
}

module.exports = { parsearVigencia };
