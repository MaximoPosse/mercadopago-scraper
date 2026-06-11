# Scraper de promociones de Mercado Pago

Este script accede a la página de promociones de Mercado Pago y extrae
la información relevante de cada oferta visible en la página principal.

## Requisitos

- Node.js v16 o superior instalado
- Ejecutar: npm install

## Uso

1. Abrir una terminal en la carpeta mercadopago-scraper
2. Ejecutar: node index.js
3. El resultado estará en data/promociones.json

## Datos que extrae

- Comercio
- Beneficio (descuento, 2x1, cuotas, etc.)
- Cuotas sin interés
- Imagen (URL completa)
- Descripción de la promoción
- Vigencia / legales
- URL de la promoción

## Comentarios

El sitio asignado (promociones.mercadopago.com.ar) es un portal de promociones
de comercios asociados a Mercado Pago. No es un catálogo de productos con
precios unitarios ni códigos SKU/EAN, por eso por ahora solo se guardan
promociones y no productos individuales.

Pendiente para próximas versiones:
- Cargar todas las ofertas con el botón "Ver todas las ofertas"
- Generar productos.json con el formato de entrega solicitado
- Extraer tipo de promoción y método de pago
- Sucursales (si aplica al sitio)
