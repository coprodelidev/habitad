# Plano de San Fernando

El plano operativo parte de las propiedades existentes del sistema. Conserva sus IDs, precios, moneda, ventas y disponibilidad: libres en verde, separadas en amarillo y ocupadas en rojo. Los tres contadores permiten filtrar por estos estados.

El Excel DATOS DE ARTICULOS SAN FERNANDO.xlsx sirve como referencia para corregir manzana, lote, etapa, modelo y tipo cuando existe una correspondencia unica. No define disponibilidad ni contiene precios. No genera cuadros adicionales ni estados nuevos. Las propiedades sin correspondencia o con codigo repetido conservan sus datos y siguen operativas por su ID.

Se conservan los cuadros compactos, Mz - Lt, precio debajo, agrupacion por etapa y manzana, y clasificacion Casas/Terrenos. Los bloqueos existentes no se convierten en libres ni se modifican: quedan fuera de este plano de tres estados. El domicilio del cliente permanece separado del inmueble reservado.

El catalogo de referencia contiene 3804 codigos en 21 etapas: 2864 casas y 940 terrenos. Los dos registros EMAPICA-ACACIA se clasifican como casas ACACIA conservando el valor original como procedencia.

Las migraciones 20260918_v2_retirados.sql y 20260922_v2_catalogo_san_fernando.sql se aplicaron en produccion el 23/09/2026. Se verificaron 3684 fichas actualizadas, precios y estados intactos, y 1569 ventas sin cambios. Esta correccion visual no requiere otra migracion.

Verificacion: npm run test:plano y npm run typecheck.
