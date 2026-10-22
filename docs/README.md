# Diseño de vistas · Front-end

Vistas previas (layouts) del **Sistema Integral de Gestión para Comercializadora MEDIDENTAL JERI S.A. de C.V.**, elaboradas a partir de los requerimientos del Apartado III.

**Archivo de diseño en Figma:** https://www.figma.com/design/Ers1oxsks6TMnhkUB5U0cF

> Son propuestas de diseño con datos de ejemplo. Todavía no están conectadas al back-end.

## Pantallas

Las imágenes de esta carpeta llevan el mismo número que cada pantalla.

| # | Pantalla | Requerimientos |
|---|----------|----------------|
| 01 | Iniciar sesión | RF-01 |
| 02 | Dashboard | RF-21, RF-17 |
| 03 | Clientes | RF-04 |
| 04 | Proveedores | RF-05 |
| 05 | Productos | RF-06, RF-07 |
| 06 | Inventario | RF-08, RF-09, RF-10 |
| 07 | Registrar compra | RF-11, RF-13 |
| 08 | Registrar venta | RF-14, RF-15 |
| 09 | Cotizaciones | RF-16 |
| 10 | Reportes | RF-18 |
| 11 | Usuarios y roles | RF-02, RF-03 |

### Ventanas emergentes

Para no saturar las pantallas, los formularios de captura se abren en ventanas emergentes:

| # | Pantalla | Ventana |
|---|----------|---------|
| 05b | Productos | Nuevo producto |
| 06b | Inventario | Registrar entrada / salida |
| 07b | Registrar compra | Agregar producto a la compra |
| 08b | Registrar venta | Agregar producto |
| 11b | Usuarios | Nuevo usuario |

## Estilo

| Elemento | Valor |
|----------|-------|
| Color principal (celeste) | `#0B76B8` |
| Menú lateral | `#0C3D5E` |
| Fondo | `#F2F7FB` |
| Texto | `#13263A` / secundario `#4A6072` |
| Tipografía | Figtree (textos) · IBM Plex Mono (folios, SKU y montos) |
| Esquinas | 10 px en botones y campos · 14 px en tarjetas y tablas |
| Alto de botones y campos | 44 px |

Los colores están definidos como variables en Figma (colección **Medidental · Colores**). Los componentes reutilizables (menú, botones, etiquetas de estado, campos y filas de tabla) están en la sección **Componentes** del archivo.
