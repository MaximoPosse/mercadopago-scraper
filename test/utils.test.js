const assert = require('node:assert/strict');
const test = require('node:test');

const { detectarTipoPromocion } = require('../scraperPromociones');
const { exportarCsv } = require('../utils/exportarCsv');
const { generarCambios, generarResumen } = require('../utils/generarResumen');
const { limpiarTexto } = require('../utils/limpiarTexto');
const { parsearVigencia } = require('../utils/parsearVigencia');

test('limpia saltos de linea y espacios repetidos', () => {
  assert.equal(limpiarTexto('  Oferta\n especial   hoy  '), 'Oferta especial hoy');
  assert.equal(limpiarTexto(''), null);
});

test('clasifica tipos de promociones conocidos', () => {
  assert.equal(detectarTipoPromocion('20% OFF', ''), 'descuento');
  assert.equal(detectarTipoPromocion('2x1', ''), '2x1');
  assert.equal(detectarTipoPromocion('Reintegro', ''), 'reintegro');
  assert.equal(detectarTipoPromocion(null, '¡Aprovechá hasta 18 cuotas sin interés!'), 'cuotas sin interés');
  assert.equal(detectarTipoPromocion('Devolución', ''), 'reintegro');
  assert.equal(detectarTipoPromocion(null, 'devolución del dinero'), 'reintegro');
});

test('extrae el rango de fechas de la vigencia', () => {
  const resultado = parsearVigencia('Válido del 3 al 17 de mayo');
  const anio = new Date().getFullYear();

  assert.deepEqual(resultado, {
    vigencia_desde: `03-may-${anio}`,
    vigencia_hasta: `17-may-${anio}`,
  });
});

test('maneja cruce de año en vigencias', () => {
  const resultado = parsearVigencia('Válido del 28 de diciembre al 3 de enero');
  const anio = new Date().getFullYear();

  assert.deepEqual(resultado, {
    vigencia_desde: `28-dic-${anio}`,
    vigencia_hasta: `03-ene-${anio + 1}`,
  });
});

test('genera resumen y detecta promociones nuevas y eliminadas', () => {
  const anteriores = [{ comercio: 'A', tipo_promocion: 'descuento', url_promocion: 'url-a' }];
  const actuales = [
    { comercio: 'A', tipo_promocion: 'descuento', url_promocion: 'url-a' },
    { comercio: 'B', tipo_promocion: '2x1', url_promocion: 'url-b' },
  ];

  assert.deepEqual(generarResumen(actuales), {
    total: 2,
    por_tipo: { descuento: 1, '2x1': 1 },
    comercios_top: [
      { comercio: 'A', cantidad: 1 },
      { comercio: 'B', cantidad: 1 },
    ],
  });
  assert.equal(generarCambios(anteriores, actuales).nuevas[0].url_promocion, 'url-b');
  assert.equal(generarCambios(actuales, anteriores).eliminadas[0].url_promocion, 'url-b');
});

test('escapa comas y comillas en el CSV', () => {
  const csv = exportarCsv([{
    nombre: 'Oferta, especial',
    precio: null,
    precio_descuento: null,
    imagen: null,
    código: 'url-1',
    descripción: 'Dijo "2x1"',
    condiciones: null,
    url_producto: 'url-1',
  }]);

  assert.match(csv, /"Oferta, especial"/);
  assert.match(csv, /"Dijo ""2x1"""/);
});