const fs = require('fs');
const path = require('path');

function registrarHistorico(promociones, dir) {
  fs.mkdirSync(dir, { recursive: true });

  const fecha = new Date().toISOString().slice(0, 10);
  const porTipo = {};
  promociones.forEach((p) => {
    const tipo = p.tipo_promocion || 'sin clasificar';
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  });

  const resumen = {
    fecha,
    total: promociones.length,
    por_tipo: porTipo,
    promociones: promociones.map((p) => ({
      comercio: p.comercio,
      beneficio: p.beneficio,
      tipo_promocion: p.tipo_promocion,
      vigencia: p.vigencia,
      url_promocion: p.url_promocion,
    })),
  };

  const archivo = path.join(dir, `${fecha}.json`);
  fs.writeFileSync(archivo, JSON.stringify(resumen, null, 2));
  return archivo;
}

function leerHistorico(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter((d) => d && d.fecha);
}

module.exports = { registrarHistorico, leerHistorico };