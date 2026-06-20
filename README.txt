# Scraper de promociones de Mercado Pago

Este scraper accede a https://promociones.mercadopago.com.ar/, extrae la lista de
promociones disponibles y luego ingresa al detalle de cada una para obtener
información adicional.

## Requisitos

- Node.js v16 o superior instalado
- Ejecutar: npm install

## Uso

1. Abrir una terminal en la carpeta mercadopago-scraper
2. Ejecutar: node index.js
3. El resultado estará en data/promociones.json

## Datos que extrae (por promoción)

- comercio
- beneficio (descuento, 2x1, cuotas, etc.)
- tipo_promocion (descuento, reintegro, cuotas sin interés, 2x1, 3x2, bonificacin)
- descripcin
- vigencia
- metodo_pago (desde la pgina de detalle)
- bancos o tarjetas participantes (lista)
- marcas o categoras incluidas (lista)
- sucursales o zonas donde aplica (lista)
- terminos_condiciones (texto completo)
- imagen (URL)
- imagen_condiciones (URL, si los trminos estn en una imagen)
- url_promocion

## Estructura del proyecto

- index.js - Orquestador principal
- scraperPromociones.js - Mdulo de scraping de detalle
- utils/limpiarTexto.js - Limpieza de textos
- data/promociones.json - Archivo de salida

## Mejoras de esta versión

1. Scraping de detalle: cada promocin abre su URL individual y extrae
   trminos y condiciones, mtodo de pago, bancos, marcas, sucursales,
   tipo de promocin e imagen con condiciones (si existe).

2. Manejo de errores: si una pgina de detalle falla, se guardan los
   datos bsicos y el scraper continúa con la siguiente promocin.

3. Logs detallados: muestra la cantidad de promociones encontradas,
   cul se est procesando en cada momento y el total al finalizar.

4. Desduplicacin: evita registros duplicados usando la URL como clave.

5. Limpieza de textos: todos los campos se limpian eliminando saltos
   de lnea y espacios innecesarios.

6. Intento de carga completa: busca el botn "Ver todas las ofertas"
   y hace clic para obtener ms promociones.

7. Cdigo modular: separado en mdulos para facilitar el mantenimiento
   y la reutilizacin.
