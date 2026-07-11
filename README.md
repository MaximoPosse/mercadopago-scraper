# Scraper de promociones Mercado Pago

## Requisitos

- Node.js v16 o superior
- Puppeteer

## Instalación

```bash
cd mercadopago-scraper
npm install
```

## Ejecución

```bash
node index.js
```

## Salida

`data/promociones.json`

## Estructura del proyecto

- `index.js` — Orquestador principal: navega al listado, desduplica, procesa cada promoción y guarda el resultado.
- `scraperPromociones.js` — Módulo que ingresa a la página de detalle de cada promoción y extrae datos adicionales.
- `utils/limpiarTexto.js` — Utilidad para limpiar textos (elimina saltos de línea y espacios múltiples).
- `utils/logger.js` — Módulo de logging que escribe en `logs/scraper.log` con timestamp.
- `data/promociones.json` — Archivo de salida con todas las promociones.
- `data/reporte.json` — Reporte de ejecución con estadísticas (duración, errores, duplicados).

## Datos extraídos por promoción

| Campo | Descripción |
|---|---|
| `comercio` | Nombre del comercio |
| `beneficio` | Beneficio principal (ej. "15% OFF", "2x1") |
| `tipo_promocion` | Tipo: descuento, reintegro, cuotas sin interés, 2x1, 3x2, bonificación |
| `descripcion` | Descripción de la promoción |
| `vigencia` | Fecha de vigencia |
| `metodo_pago` | Método de pago válido (desde la página de detalle) |
| `bancos` | Lista de bancos o tarjetas participantes |
| `marcas` | Categorías o marcas incluidas |
| `sucursales` | Sucursales o zonas donde aplica |
| `terminos_condiciones` | Términos y condiciones completos |
| `imagen` | URL de la imagen principal |
| `imagen_condiciones` | URL de imagen con términos (si existe) |
| `url_promocion` | Enlace a la página de detalle |

## Mejoras implementadas (v3)

1. **Sistema de logs**: se crea `logs/scraper.log` con timestamps ISO para cada evento (inicio, cada promoción procesada, errores y fin).
2. **Reporte de ejecución**: al finalizar se genera `data/reporte.json` con fecha, duración en segundos, promociones encontradas, procesadas OK, con error y duplicadas.
3. **Métrica de duración**: se mide y muestra el tiempo total de ejecución.
4. **Estadísticas en consola**: al finalizar se muestra el resumen con cantidad de exitosas, errores y duplicados.

## Mejoras implementadas (v4)

1. **Reintentos automáticos**: si falla el detalle de una promoción, se reintenta hasta 3 veces con espera progresiva (2s, 4s) antes de descartarla como error definitivo.

## Mejoras implementadas (v2)

1. **Scraping de detalle**: cada promoción abre su página individual y extrae términos, medios de pago, bancos, marcas, sucursales, tipo de promoción e imágenes con condiciones.
2. **Manejo de errores por promoción**: si una página de detalle falla, se guardan los datos básicos y continúa con la siguiente.
3. **Logs detallados**: muestra cantidad de promociones encontradas, cuál se está procesando, progreso y total al finalizar.
4. **Eliminación de duplicados**: desduplica por `url_promocion` usando un Map.
5. **Limpieza de textos**: elimina saltos de línea y espacios innecesarios en todos los campos extraídos.
6. **Carga de más promociones**: intenta hacer clic en "Ver todas las ofertas" si existe.
7. **Estructura modular**: código dividido en `index.js`, `scraperPromociones.js` y `utils/limpiarTexto.js`.

## Entrega

Para la entrega del trabajo, usar `README.txt`.
