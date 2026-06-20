function limpiarTexto(texto) {
  if (!texto || typeof texto !== 'string') return null;
  return texto
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { limpiarTexto };
