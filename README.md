# Scraper de promociones Mercado Pago

## Requisitos

- Node.js v18 o superior
- Puppeteer

## Instalación

```bash
cd mercadopago-scraper
npm install
```

`npm install` también instala automáticamente el navegador Chrome que necesita Puppeteer.

## Ejecución

```bash
npm start
```

## Pruebas

Las utilidades principales tienen pruebas automáticas para verificar la limpieza
de textos, clasificación de promociones, parseo de fechas, resumen, cambios y
exportación CSV.

```bash
npm test
```

## Salida

- `data/promociones.json` — Datos completos de cada promoción
- `data/productos.json` — Export en el esquema estándar del trabajo (nombre, imagen, código, condiciones, etc.)
- `data/productos.csv` — Mismo export en formato CSV (Excel / hojas de cálculo)
- `data/resumen.json` — Estadísticas por tipo de promoción y comercios más frecuentes
- `data/cambios.json` — Detalle de promociones nuevas y eliminadas vs. ejecución anterior
- `data/reporte.json` — Estadísticas de la ejecución
- `data/historico/` — Histórico por día (un JSON por fecha con el estado de las promociones)
- `logs/scraper.log` — Log detallado con timestamps

## Estructura del proyecto

- `index.js` — Orquestador principal: navega al listado, desduplica, procesa cada promoción y guarda el resultado.
- `scraperPromociones.js` — Módulo que ingresa a la página de detalle de cada promoción y extrae datos adicionales.
- `utils/limpiarTexto.js` — Utilidad para limpiar textos (elimina saltos de línea y espacios múltiples).
- `utils/exportarProductos.js` — Convierte promociones al formato estándar `productos.json`.
- `utils/exportarCsv.js` — Genera el export en CSV.
- `utils/generarResumen.js` — Calcula resumen estadístico y cambios entre ejecuciones.
- `utils/parsearVigencia.js` — Extrae fechas desde el texto de vigencia.
- `utils/historico.js` — Guarda y lee el histórico por día.
- `test/utils.test.js` — Pruebas automáticas de las utilidades del proyecto.
- `utils/logger.js` — Módulo de logging que escribe en `logs/scraper.log` con timestamp.
- `data/promociones.json` — Archivo de salida con todas las promociones.
- `data/productos.json` — Export adaptado al esquema del trabajo práctico.
- `data/reporte.json` — Reporte de ejecución con estadísticas (duración, errores, duplicados).

## Datos extraídos por promoción

| Campo | Descripción |
|---|---|
| `comercio` | Nombre del comercio |
| `beneficio` | Beneficio principal (ej. "15% OFF", "2x1") |
| `tipo_promocion` | Tipo: descuento, reintegro, cuotas sin interés, 2x1, 3x2, bonificación |
| `descripcion` | Descripción de la promoción |
| `vigencia` | Fecha de vigencia (texto original) |
| `vigencia_desde` | Fecha de inicio parseada (ej. `11-may-2026`) |
| `vigencia_hasta` | Fecha de fin parseada (ej. `17-may-2026`) |
| `metodo_pago` | Método de pago válido (desde la página de detalle) |
| `bancos` | Lista de bancos o tarjetas participantes |
| `marcas` | Categorías o marcas incluidas |
| `sucursales` | Sucursales o zonas donde aplica |
| `terminos_condiciones` | Términos y condiciones completos |
| `imagen` | URL de la imagen principal |
| `imagen_condiciones` | URL de imagen con términos (si existe) |
| `url_promocion` | Enlace a la página de detalle |

## Mejoras implementadas (v7)

1. **Export CSV**: genera `data/productos.csv` con el mismo esquema que `productos.json`, útil para Excel o Google Sheets.
2. **Resumen estadístico**: genera `data/resumen.json` con totales por tipo de promoción y top de comercios.
3. **Cambios detallados**: genera `data/cambios.json` con listas de promociones nuevas y eliminadas (comercio, beneficio, vigencia, URL).
4. **Parseo de vigencia**: extrae `vigencia_desde` y `vigencia_hasta` desde textos como "Válido del 11 al 17 de mayo".
5. **Filtro de términos**: descarta textos de T&C que parecen páginas embebidas (muchas menciones de precios) y limita textos muy largos.

## Mejoras implementadas (v9)

1. **Histórico por día**: cada ejecución guarda `data/historico/AAAA-MM-DD.json` con la fecha, el total de promociones, la cantidad por tipo y las promociones. Cuando ya hay más de un día guardado, al final se muestra una tabla comparando cómo cambió la cantidad por tipo día a día.
2. **Carga sin timeouts**: se eliminó el error `Waiting failed: 30000ms exceeded`. Ahora la página se consulta cada 2 segundos hasta que aparecen las tarjetas de promociones (máx. 60s) y la carga se reintenta hasta 3 veces, lo que tolera sitios lentos o con estructura cambiante.
3. **Filtro de términos reforzado**: se descartan textos que parecen menús de navegación de las tiendas (Celulares, Lanzamientos, Hogar, etc.) o productos con unidades (5 Kg, 700 Rpm, GB), quedando solo términos y condiciones reales.
4. **Pruebas ampliadas**: `npm test` corre 7 pruebas, incluida la de registro y lectura del histórico por día.

## Mejoras implementadas (v8)

1. **Pruebas automáticas**: `npm test` ejecuta cinco pruebas con el módulo nativo `node:test`.
2. **Validación de utilidades**: se prueban limpieza de textos, tipos de promoción, fechas, resumen, cambios y exportación CSV.
3. **Mayor tolerancia del scraper**: usa selectores alternativos para soportar cambios leves en la estructura de la página.
4. **Instalación más simple**: Puppeteer descarga Chrome automáticamente durante `npm install`.
5. **Aviso si cambia la página**: si la web dejó de traer promociones, el scraper lanza un error claro indicando que probablemente cambió la estructura del sitio.

## Mejoras implementadas (v6)

1. **Paginación completa**: hace clic repetido en "Ver más" hasta cargar todas las promociones disponibles (máx. 50 clicks de seguridad).
2. **Export estándar**: genera `data/productos.json` mapeando cada promoción al esquema del trabajo (nombre, imagen, código, descripción, condiciones, url_producto). Los campos `precio` y `precio_descuento` quedan en `null` porque Mercado Pago no expone precios de productos individuales.

## Mejoras implementadas (v3)

1. **Sistema de logs**: se crea `logs/scraper.log` con timestamps ISO para cada evento (inicio, cada promoción procesada, errores y fin).
2. **Reporte de ejecución**: al finalizar se genera `data/reporte.json` con fecha, duración en segundos, promociones encontradas, procesadas OK, con error y duplicadas.
3. **Métrica de duración**: se mide y muestra el tiempo total de ejecución.
4. **Estadísticas en consola**: al finalizar se muestra el resumen con cantidad de exitosas, errores y duplicados.

## Mejoras implementadas (v4)

1. **Reintentos automáticos**: si falla el detalle de una promoción, se reintenta hasta 3 veces con espera progresiva (2s, 4s) antes de descartarla como error definitivo.

## Mejoras implementadas (v5)

1. **Detección de cambios**: al finalizar, compara las promociones actuales con las de la ejecución anterior y muestra cuáles se agregaron y cuáles se eliminaron.

## Mejoras implementadas (v2)

1. **Scraping de detalle**: cada promoción abre su página individual y extrae términos, medios de pago, bancos, marcas, sucursales, tipo de promoción e imágenes con condiciones.
2. **Manejo de errores por promoción**: si una página de detalle falla, se guardan los datos básicos y continúa con la siguiente.
3. **Logs detallados**: muestra cantidad de promociones encontradas, cuál se está procesando, progreso y total al finalizar.
4. **Eliminación de duplicados**: desduplica por `url_promocion` usando un Map.
5. **Limpieza de textos**: elimina saltos de línea y espacios innecesarios en todos los campos extraídos.
6. **Carga de más promociones**: paginación completa con clics repetidos en "Ver más" hasta agotar el listado.
7. **Estructura modular**: código dividido en `index.js`, `scraperPromociones.js` y `utils/limpiarTexto.js`.

## Entrega

Para la entrega del trabajo, usar `README.txt`.
