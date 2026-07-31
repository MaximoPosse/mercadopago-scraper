/**
 * Convierte promociones al esquema estándar del trabajo (productos.json).
 * Mercado Pago no expone precios ni SKU; esos campos quedan en null
 * y se usa url_promocion como identificador.
 */
function exportarProductos(promociones) {
  return promociones.map((p) => {
    const condicionesPartes = [
      p.vigencia ? `Vigencia: ${p.vigencia}` : null,
      p.tipo_promocion ? `Tipo: ${p.tipo_promocion}` : null,
      p.metodo_pago ? `Método de pago: ${p.metodo_pago}` : null,
      p.bancos?.length ? `Bancos/tarjetas: ${p.bancos.join(', ')}` : null,
      p.marcas?.length ? `Marcas/categorías: ${p.marcas.join(', ')}` : null,
      p.sucursales?.length ? `Sucursales: ${p.sucursales.join(', ')}` : null,
      p.terminos_condiciones,
    ].filter(Boolean);

    return {
      nombre: [p.comercio, p.beneficio].filter(Boolean).join(' - '),
      precio: null,
      precio_descuento: null,
      imagen: p.imagen,
      código: p.url_promocion,
      descripción: p.descripcion,
      condiciones: condicionesPartes.join(' | ') || null,
      url_producto: p.url_promocion,
    };
  });
}

module.exports = { exportarProductos };
