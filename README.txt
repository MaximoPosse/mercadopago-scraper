# Scraper de promociones de Mercado Pago

Este scraper accede a https://promociones.mercadopago.com.ar/, extrae la lista de
promociones disponibles y luego ingresa al detalle de cada una para obtener
información adicional.

Repositorio: https://github.com/MaximoPosse/mercadopago-scraper

## Requisitos

- Node.js v16 o superior instalado
- Ejecutar: npm install

## Uso

1. Abrir una terminal en la carpeta del proyecto (por ejemplo, `mercadopago-scraper-master`)
2. Ejecutar: npm install
3. Ejecutar: npm start
4. Los resultados estarán en:
   - data/promociones.json (datos completos)
   - data/productos.json (formato estándar del trabajo)
   - data/reporte.json (estadísticas de ejecución)

## Datos que extrae (por promoción)

- comercio
- beneficio (descuento, 2x1, cuotas, etc.)
- tipo_promocion (descuento, reintegro, cuotas sin interés, 2x1, 3x2, bonificación)
- descripción
- vigencia
- metodo_pago (desde la página de detalle)
- bancos o tarjetas participantes (lista)
- marcas o categorías incluidas (lista)
- sucursales o zonas donde aplica (lista)
- terminos_condiciones (texto completo)
- imagen (URL)
- imagen_condiciones (URL, si los términos están en una imagen)
- url_promocion

## Export estándar (productos.json)

Además del JSON propio de promociones, el script genera data/productos.json
con el esquema pedido en la consigna del trabajo:

- nombre: comercio + beneficio
- precio / precio_descuento: null (Mercado Pago no muestra precios de productos)
- imagen: URL completa de la imagen
- código: url_promocion como identificador único
- descripción: descripción de la promoción
- condiciones: vigencia, tipo, método de pago, bancos, marcas, sucursales y T&C
- url_producto: enlace al detalle de la promoción

## Estructura del proyecto

- index.js - Orquestador principal
- scraperPromociones.js - Módulo de scraping de detalle
- utils/limpiarTexto.js - Limpieza de textos
- utils/exportarProductos.js - Export al formato estándar
- utils/logger.js - Sistema de logs a archivo
- data/promociones.json - Archivo de salida principal
- data/productos.json - Export adaptado al esquema del trabajo
- data/reporte.json - Reporte de ejecución

## Mejoras de esta versión

1. Scraping de detalle: cada promoción abre su URL individual y extrae
   términos y condiciones, método de pago, bancos, marcas, sucursales,
   tipo de promoción e imagen con condiciones (si existe).

2. Manejo de errores: si una página de detalle falla, se guardan los
   datos básicos y el scraper continúa con la siguiente promoción.

3. Logs detallados: muestra la cantidad de promociones encontradas,
   cuál se está procesando en cada momento y el total al finalizar.

4. Desduplicación: evita registros duplicados usando la URL como clave.

5. Limpieza de textos: todos los campos se limpian eliminando saltos
   de línea y espacios innecesarios.

6. Paginación completa: hace clic repetido en "Ver más" hasta cargar
   todas las promociones disponibles.

7. Código modular: separado en módulos para facilitar el mantenimiento
   y la reutilización.

8. Export estándar: genera productos.json con el esquema del trabajo práctico.

## Mejoras de la versión 3

1. Sistema de logs: se crea logs/scraper.log con timestamps ISO para
   cada evento (inicio, cada promoción procesada, errores y fin).

2. Reporte de ejecución: se genera data/reporte.json con fecha, duración
   en segundos, promociones encontradas, procesadas OK, con error y
   duplicadas.

3. Métrica de duración: se mide y muestra el tiempo total de ejecución.

4. Estadísticas en consola: al finalizar se muestra el resumen con
   cantidad de exitosas, errores y duplicados.

## Mejoras de la versión 4

1. Reintentos automáticos: si falla el detalle de una promoción, se
   reintenta hasta 3 veces con espera progresiva (2s, 4s) antes de
   descartarla como error definitivo.

## Mejoras de la versión 5

1. Detección de cambios: al finalizar, compara las promociones actuales
   con las de la ejecución anterior y muestra cuáles se agregaron y
   cuáles se eliminaron.

## Comentarios

- Mercado Pago no es un supermercado con productos y precios individuales;
  el sitio muestra promociones de distintos comercios. Por eso adapté el
  esquema del trabajo a promociones en lugar de productos con SKU/precio.
- Los campos precio y precio_descuento del export quedan en null porque
  no existen en el portal de promociones.
- Se usa url_promocion como código identificador único de cada ítem.
- Si los términos y condiciones están en una imagen, se guarda la URL
  en imagen_condiciones (no se hace OCR).
- El scraping de detalle puede tardar varios minutos según la cantidad
  de promociones activas en el sitio.
