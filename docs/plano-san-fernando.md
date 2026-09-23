# Catálogo del plano de San Fernando

Fuente: `DATOS DE ARTICULOS SAN FERNANDO.xlsx`, hoja `3804 ARTICULOS`, rango `B3:E3806`.

Contiene 3,804 códigos únicos en 21 etapas. El plano clasifica 2,864 casas (2,568 ACACIA y 296 SAUCE) y 940 terrenos. Los dos registros originales EMAPICA-ACACIA se clasifican como casas ACACIA; se conserva su tipo original como procedencia.

El plano utiliza el catálogo versionado en `src/lib/v2/data/articulos-san-fernando.json` para etapa, modelo y tipo, y consulta los precios, estados y ventas reales por páginas de 500 registros. Se agrupa por etapa y manzana, ordenando los lotes numéricamente. Los cuadros conservan Mz - Lt arriba y precio debajo.

La correspondencia se resuelve primero por código SAP `SF-manzana_lote` en ubicación o CUH y, si no existe, por manzana/lote. Un código explícito tiene prioridad sobre las coordenadas antiguas. Otro prefijo de proyecto no se vincula por coincidencia de manzana/lote. Las fichas duplicadas no se mezclan. Las fichas sin correspondencia única siguen disponibles para consulta en una sección de revisión.

El Excel no tiene precios ni estados: las ubicaciones sin ficha se muestran como **Sin ficha**, sin precio ni disponibilidad inventados y sin permitir separaciones.

## Actualización de base de datos

Aplicar `supabase/migrations/20260922_v2_catalogo_san_fernando.sql` en Supabase. Incluye el catálogo, crea las etapas que falten y actualiza etapa, modelo, tipo, manzana y lote de las fichas con correspondencia única. No crea propiedades sin precio y no modifica IDs, CUH, precios, moneda, estados, ventas ni pagos. En EMAPICA-ACACIA aplica casa y modelo ACACIA y guarda el tipo original en `adicionales.tipo_articulo_sf`.

Los cambios pasan por la auditoría existente. La migración informa cuántas fichas actualiza, cuántos códigos tienen duplicados y cuántos no tienen ficha. No se ha ejecutado en producción desde este entorno.

## Reproducir y verificar

Desde la raíz del proyecto:

```sh
node scripts/importar-articulos-san-fernando.cjs "ruta/DATOS DE ARTICULOS SAN FERNANDO.xlsx"
npm run test:plano
npm run typecheck
```

El generador valida encabezados, códigos únicos, etapas y tipos/modelos, conserva los 3,804 registros y su hash SHA-256, y produce el catálogo JSON y la migración SQL desde la misma fuente. No modifica el Excel original.
