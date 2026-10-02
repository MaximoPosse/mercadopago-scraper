const { generarResumen } = require('./generarResumen');

function escaparJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function generarReporteHtml(promociones) {
  const resumen = generarResumen(promociones);
  const datos = {
    generado: new Date().toISOString(),
    total_comercios: new Set(promociones.map((p) => p.comercio)).size,
    resumen,
    promociones: promociones.map((p) => ({
      comercio: p.comercio,
      beneficio: p.beneficio,
      tipo: p.tipo_promocion,
      vigencia: p.vigencia,
      descripcion: p.descripcion,
      terminos: p.terminos_condiciones,
      imagen: p.imagen,
      url: p.url_promocion,
    })),
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Promociones Mercado Pago</title>
<style>
  :root{
    --azul:#009EE3; --oscuro:#2D3277; --amarillo:#FFE600;
    --verde:#00A650; --naranja:#FFB600; --rojo:#F23D50;
    --lila:#8A2BE2; --gris:#8A9BA8;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f7fb;color:#1b2430;line-height:1.5}
  .encabezado{background:linear-gradient(135deg,var(--oscuro),#16407a);color:#fff;padding:28px 20px;text-align:center}
  .encabezado h1{font-size:26px}
  .encabezado .fecha{margin-top:6px;font-size:14px;opacity:.85}
  .contenedor{max-width:1200px;margin:0 auto;padding:20px}
  .stats{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:24px}
  .stat{background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:14px 20px;min-width:120px;text-align:center}
  .stat .num{font-size:28px;font-weight:700;color:var(--oscuro)}
  .stat .lab{font-size:13px;color:var(--gris)}
  .graficos{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
  @media(max-width:800px){.graficos{grid-template-columns:1fr}}
  .panel{background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:16px}
  .panel h2{font-size:16px;color:var(--oscuro);margin-bottom:12px}
  .fila{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .fila .nom{width:130px;font-size:13px;text-align:right;color:#333}
  .fila .barra{flex:1;height:20px;background:#e9eef4;border-radius:5px;overflow:hidden}
  .fila .relleno{height:100%;border-radius:5px;transition:width .6s}
  .fila .val{width:36px;font-size:13px;font-weight:600}
  h2.seccion{color:var(--oscuro);margin:14px 0 16px}
  .tarjetas{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
  .tarjeta{background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.07);overflow:hidden;display:flex;flex-direction:column}
  .tarjeta .img{height:150px;background:linear-gradient(135deg,#eaf4fb,#dceeff);display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;color:#9cc6de}
  .tarjeta .img img{width:100%;height:100%;object-fit:cover}
  .tarjeta .cuerpo{padding:14px;flex:1;display:flex;flex-direction:column;gap:8px}
  .tarjeta .comercio{font-weight:700;font-size:16px;color:var(--oscuro)}
  .badges{display:flex;flex-wrap:wrap;gap:6px}
  .badge{font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;color:#fff}
  .badge-beneficio{background:var(--amarillo);color:#3a3a00}
  .descripcion{font-size:13px;color:#4a5568;flex:1}
  .vigencia{font-size:12px;color:var(--gris)}
  details.terminos{margin-top:6px}
  details.terminos summary{cursor:pointer;font-size:12px;color:var(--azul);font-weight:600}
  details.terminos p{font-size:12px;color:#4a5568;margin-top:6px;padding:8px;background:#f7fafc;border-radius:6px}
  .link{display:block;margin-top:10px;text-align:center;background:var(--azul);color:#fff;text-decoration:none;font-size:13px;padding:8px 12px;border-radius:6px;font-weight:600}
  .link:hover{background:#0086c4}
  .pie{text-align:center;color:var(--gris);font-size:12px;padding:16px}
</style>
</head>
<body>
  <header class="encabezado">
    <h1>Promociones Mercado Pago</h1>
    <div class="fecha">Generado el <span id="fecha"></span> · scraping de promociones.mercadopago.com.ar</div>
  </header>
  <div class="contenedor">
    <section class="stats" id="stats"></section>
    <section class="graficos">
      <div class="panel"><h2>Promociones por tipo</h2><div id="graficoTipo"></div></div>
      <div class="panel"><h2>Comercios con más promos</h2><div id="graficoComercio"></div></div>
    </section>
    <h2 class="seccion">Promociones <span id="totalPromos"></span></h2>
    <section class="tarjetas" id="tarjetas"></section>
  </div>
  <footer class="pie">Proyecto escolar · Scraper de promociones de Mercado Pago</footer>
  <script>
  const DATA = ${escaparJson(datos)};

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function colorTipo(t) {
    const map = {
      'descuento': 'var(--verde)',
      'cuotas sin interés': 'var(--azul)',
      '2x1': 'var(--naranja)',
      '3x2': 'var(--lila)',
      'reintegro': 'var(--rojo)',
      'bonificación': 'var(--lila)'
    };
    return map[t] || 'var(--gris)';
  }

  document.getElementById('fecha').textContent =
    new Date(DATA.generado).toLocaleString('es-AR');

  const statsHtml = [
    { num: DATA.resumen.total, lab: 'Promociones totales' },
    ...Object.entries(DATA.resumen.por_tipo).map(([t, c]) => ({ num: c, lab: t })),
    { num: DATA.total_comercios, lab: 'Comercios' }
  ].map(s => '<div class="stat"><div class="num">' + s.num + '</div><div class="lab">' + esc(s.lab) + '</div></div>').join('');
  document.getElementById('stats').innerHTML = statsHtml;

  function pintarBarras(contenedor, items, colorFn) {
    const max = items.reduce((m, i) => Math.max(m, i.v), 0) || 1;
    contenedor.innerHTML = items.map(i =>
      '<div class="fila">' +
        '<div class="nom">' + esc(i.n) + '</div>' +
        '<div class="barra"><div class="relleno" style="width:' + (i.v / max * 100).toFixed(0) + '%;background:' + colorFn(i) + '"></div></div>' +
        '<div class="val">' + i.v + '</div>' +
      '</div>').join('');
  }

  pintarBarras(
    document.getElementById('graficoTipo'),
    Object.entries(DATA.resumen.por_tipo).map(([t, c]) => ({ n: t, v: c })),
    (i) => colorTipo(i.n)
  );

  pintarBarras(
    document.getElementById('graficoComercio'),
    DATA.resumen.comercios_top.map(c => ({ n: c.comercio, v: c.cantidad })),
    () => 'var(--azul)'
  );

  document.getElementById('totalPromos').textContent =
    '· ' + DATA.promociones.length + ' activas';

  document.getElementById('tarjetas').innerHTML = DATA.promociones.map(p => {
    const img = p.imagen
      ? '<img src="' + esc(p.imagen) + '" alt="' + esc(p.comercio) + '" onerror="this.remove()">'
      : '';
    const terminos = p.terminos
      ? '<details class="terminos"><summary>Ver términos y condiciones</summary><p>' + esc(p.terminos).replace(/\\n/g, '<br>') + '</p></details>'
      : '';
    return (
      '<article class="tarjeta">' +
        '<div class="img">' + img + '</div>' +
        '<div class="cuerpo">' +
          '<div class="comercio">' + esc(p.comercio) + '</div>' +
          '<div class="badges">' +
            '<span class="badge badge-beneficio">' + esc(p.beneficio) + '</span>' +
            '<span class="badge" style="background:' + colorTipo(p.tipo) + '">' + esc(p.tipo) + '</span>' +
          '</div>' +
          '<div class="descripcion">' + esc(p.descripcion) + '</div>' +
          '<div class="vigencia">' + esc(p.vigencia) + '</div>' +
          terminos +
          (p.url ? '<a class="link" href="' + esc(p.url) + '" target="_blank" rel="noopener">Ver promoción</a>' : '') +
        '</div>' +
      '</article>'
    );
  }).join('');
  </script>
</body>
</html>
`;
}

module.exports = { generarReporteHtml };