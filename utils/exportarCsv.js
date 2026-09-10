function escaparCsv(valor) {
  if (valor == null) return '';
  const texto = String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function exportarCsv(productos) {
  const columnas = [
    'nombre',
    'precio',
    'precio_descuento',
    'imagen',
    'código',
    'descripción',
    'condiciones',
    'url_producto',
  ];

  const filas = productos.map((p) =>
    columnas.map((col) => escaparCsv(p[col])).join(',')
  );

  return [columnas.join(','), ...filas].join('\n');
}

module.exports = { exportarCsv };
