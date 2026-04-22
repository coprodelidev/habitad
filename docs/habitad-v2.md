# Habitad 2.0 — Sistema de gestión de ventas, separaciones y pagos

> Documento vivo. Última actualización: 2026-04-22.
> Este documento es la fuente única de verdad para el alcance, reglas de negocio y arquitectura de Habitad 2.0. Cualquier cambio de alcance debe reflejarse aquí antes de implementarse.

---

## 14. Hallazgos 2026-04-22: integración real con SAP Business One

Feedback recibido de Yessenia Obregón con 3 Excels y 4 plantillas Word que **reconfiguran el alcance de Habitad**.

### 14.1 Cómo se conecta Habitad con SAP

COPRODELI opera SAP Business One como ERP contable. **Habitad no reemplaza SAP**, es el sistema OPERATIVO que se conecta mediante **exportaciones en el formato exacto que SAP importa**. Flujo:

1. Promotor vende en Habitad (plano → separación → inicial → contrato → cuotas)
2. Admin exporta periódicamente desde Habitad:
   - **Maestro de clientes** nuevos → SAP los da de alta como Business Partners
   - **Órdenes de venta** confirmadas → SAP las registra contablemente
3. SAP lleva contabilidad. Habitad lleva operación.

### 14.2 Formato exacto del Maestro de Clientes SAP (33 columnas)

Headers en dos bandas:

**Datos del cliente** (columnas 1-22):
- `CardCode`: `C` + 8 dígitos DNI (ej. `C12345678`)
- `CardName`: apellidos + nombres concatenados
- `CardType`: fijo `C`
- `GroupCode`: fijo `100`
- `PayTermsGrpCode`: fijo `-1`
- `FederalTaxID`: DNI (8 dígitos)
- `Currency`: fijo `#`
- `DebitorAccount` (varía por tipo + moneda):
  - `12121165` CASAS SOL
  - `12121164` TERRENO SOL
  - `12122162` CASA USD
  - `12122161` TERRENO USD
- `DownPaymentClearAct`: fijo `12213102`
- `DownPaymentInterimAccount`: fijo `12213101`
- `SubjectToWithholdingTax`: fijo `N`
- `SalesPersonCode`: código promotor (del catálogo COD_PROMOTOR)
- `Cellular`, `E_Mail`
- `Valid`: fijo `Y`
- `U_SYP_BPTP`: fijo `TPN`
- `U_SYP_BPTD`: fijo `1`
- `U_SYP_BPAP`: apellido paterno (primer apellido separado)
- `U_SYP_BPAM`: apellido materno (segundo apellido)
- `U_SYP_BPNO`: primer nombre
- `U_SYP_BPN2`: segundo nombre
- `Notes`: `URB-SF-C` si casa / `URB-SF-T` si terreno

**Dirección del cliente** (columnas 23-33):
- `ParentKey`: CardCode
- `LineNum`: fijo `0`
- `AddressType`: fijo `bo_BillTo`
- `AddressName`: fijo `FISCAL`
- `Street`: concatenación `Mz X Lt Y - Nº N - URB/AAHH/PJ Nombre` (todo en un solo string)
- `ZipCode`: código ubigeo INEI (ej. `110101`)
- `Block`: distrito (texto)
- `City`: provincia
- `County`: departamento
- `U_SYP_URBANIZA`: nombre de la urbanización donde vive el cliente
- `Country`: fijo `PE`

### 14.3 Formato de Órdenes de Venta SAP (90+ columnas)

Cabecera con DocNum, CardCode, fechas (TaxDate, DocDate, DocDueDate), moneda/tipo de cambio, total, SalesPersonCode, PaymentGroupCode.

Campos `U_SYP_*` personalizados de COPRODELI:
- Datos de expediente: `U_SYP_VAEXPEDIENTE`, `U_SYP_FINGEXP` (fecha ingreso), `U_SYP_FBENEF` (fecha beneficiario), `U_SYP_FCADUC` (fecha caducidad)
- Valores del precontrato: `U_SYP_VAPROMOTOR`, `U_SYP_VACOPROVIDIG`, `U_SYP_VACOPRODELI`, `U_SYP_VAGASTOSADM`, `U_SYP_SEPARA`, `U_SYP_CUINICIAL`, `U_SYP_PRECONT`, `U_SYP_VACUOTA`
- Fechas operativas: `U_SYP_FESEPARAINI`, `U_SYP_FEINICIAL`, `U_SYP_FERECAINI`, `U_SYP_FERECAFIN`
- Cuotas: `U_SYP_NROCUOTAS`, `U_SYP_HBCUONUM`, `U_SYP_CUOFALTA`, `U_SYP_VACUNICIAL`, `U_SYP_HBCUOVEN`, `U_SYP_HBCUOIMP`, `U_SYP_HBCUOMOR`
- MiVivienda: `U_SYP_VALORBONO`, `U_SYP_AHORRO`, `U_SYP_CREDHIPO`, `U_SYP_DONACION`, `U_SYP_GASTOSDMIN`, `U_SYP_INFMV`
- Crédito hipotecario: `U_SYP_LICF`, `U_SYP_CARTAF`, `U_SYP_VALORCF`, `U_SYP_FEINICF`, `U_SYP_FEFINCF`, `FERENCF`, `U_SYP_HBVALFMV`
- Comisiones: `U_SYP_COM1`…`U_SYP_COM5`
- Centros SAP: `U_SYP_PROGRAMA`, `U_SYP_CCCENCO`, `U_SYP_CCFINAN`, `U_SYP_CCPARTIDA`, `U_SYP_CCSUBPARTIDA`, `U_SYP_COGRUPO`

Líneas de la orden (después del separador vacío): `ParentKey`, `LineNum`, `ItemCode`, `ItemDescription`, `WarehouseCode`, `Quantity`, `Price`, `LineTotal`, `TaxCode`, `VatGroup`, `AccountCode`, `CostingCode1-5`, `ProjectCode`.

### 14.4 Catálogos SAP fijos

**COD UBIGEO** (1,853 filas): código INEI de 6 dígitos + distrito + provincia + departamento. Perú completo. **Se siembra en `v2.ubigeos`**.

**COD_PROMOTOR** (13 filas): SalesPersonCode + nombre del empleado. Los 12 promotores reales de COPRODELI:

| Code | Nombre |
|---|---|
| -1 | -Ningún empleado del departamento de ventas- (valor por defecto) |
| 92 | GISELA ROJAS MARCATINCO |
| 94 | HUGO RODRIGUEZ QUESQUEN |
| 95 | CRISS PANITZ VASQUEZ |
| 97 | RONY YATACO |
| 98 | JUDITH SANTIAGO |
| 99 | JOSE BRICEÑO |
| 100 | ZUNILDA PUMA |
| 101 | ERICK DAVILA |
| 102 | NATHALY ZAMBRANO |
| 103 | KAREN CUETO |
| 104 | JORGE HUERTAS |
| 113 | ARIANA GONZALES |

**CODIGOS** (5,328 filas con múltiples catálogos mezclados):
- Grupo BIF (`0013` URB SAN FERN CASAS S, `0031` SAN FERNANDO TERR, ...)
- Almacén (`SFERN` URB SAN FERNANDO)
- Programa (`6` HABITAT)
- Centro de costo (`604` URB SAN FERNANDO)
- Partida (`21` 1 ETAPA, `22` 2 ETAPA, ...)
- Subpartida (`60424701` INGRESO VIVIENDA-4ET, `60424703` INGRESO TERRENO-4ET)
- Artículo SAP (`PT03520001` MODELO ACACIA MZ 1 LT 3) — mapea 1:1 a cada propiedad
- Ubicación (`SF-1_3`, `SF-1_4`) — también 1:1 a propiedad

### 14.5 Las 4 plantillas de Precontrato (Word)

4 modalidades reales que emiten según tipo de venta:

| # | Plantilla | Caso | Cuenta BANBIF | Interés | Penalidad retiro |
|---|---|---|---|---|---|
| 1 | Terreno Contado | Ya pagó completo, solo abonos detallados | SIN DATA | — | S/ 3,500 |
| 2 | Terreno Cuotas SIN interés | Inicial + cuotas sin intereses | CON DATA TERRENO | 0% | S/ 3,500 |
| 3 | Terreno Cuotas CON interés | Inicial + cuotas 8% anual | CON DATA TERRENO | 8% anual | S/ 3,500 |
| 4 | Casa (con/sin Bono MiVivienda) | Vivienda con cláusulas MiVivienda | CON DATA CASAS | — | S/ 3,000–5,000 (según caso) |

Todas comparten: representante legal (Yessenia Obregón DNI 25765681, Partida 70000278), domicilio fiscal (Av. Guardia Chalaca 1371, Callao), proyecto (Las Palmeras de San Fernando, Partida 11103106, Ica), WhatsApp cobranza `989 172 061`, email `cobranza@coprodeli.org`. Todos son parametrizables.

### 14.6 Decisiones de Yessenia (2026-04-22)

1. **Ubigeo**: se siembran **los 1,853 distritos** del Excel (Perú completo INEI).
2. **Promotores**: se pueden **crear desde admin** (ya hecho: botón "Crear promotor" en `/v2/admin/usuarios`). Los 13 actuales del Excel se siembran como baseline.
3. **Cuotas iniciales**: **mínimo 3 abonos**, pueden ser más. Los precontratos muestran 3 líneas pero es expandible.
4. **Precontrato**: se **imprime PDF** y se firma **físico**. No hay firma digital.
5. **Export SAP actual** (`/v2/reportes/sap`): headers correctos mapeados al Excel, pero **los campos de dirección estructurada del cliente salen vacíos** porque `v2.clientes` no los tiene todavía. Bloqueante para uso real.

### 14.7 Mz/Lt — aclaración pedida

Dos Mz/Lt distintos:

- **Mz/Lt de la propiedad del proyecto** (el CUH del lote San Fernando): **100% estandarizado**, viene del inventario, se selecciona automáticamente al elegir el CUH en el plano. No se edita a mano.
- **Mz/Lt de la dirección del cliente** (donde vive hoy): **no puede ser dropdown** (cada cliente vive en un lugar distinto de Perú), pero **tampoco textarea libre**. Solución: formulario con campos separados que al guardar se concatenan en el string `Street` de SAP:
  - `tipo_via` dropdown: URB / AA.HH. / P.J. / Av. / Jr. / Ca. / Pasaje / Sector / Caserío
  - `zona_nombre` texto (nombre del AAHH/URB/PJ/calle)
  - `manzana`, `lote` texto opcional
  - `numero_puerta`, `interior` texto opcional
  - `referencia` texto opcional
  - `ubigeo_cod` autocomplete del catálogo INEI

---

## 15. Plan de desarrollo pendiente (Fases A-D)

Para cerrar el alcance SAP completo, en orden de prioridad:

### Fase A — Maestro de Clientes estructurado + Ubigeo INEI (estimado: 4-5 h)

**Objetivo**: que el export SAP `/v2/reportes/sap` deje de salir con campos vacíos.

Tareas:
1. Migración SQL: añadir a `v2.clientes`:
   - `tipo_via text`, `zona_nombre text`, `numero_puerta text`, `interior text`, `referencia text`
   - `direccion_mz text`, `direccion_lt text` (distintos del Mz/Lt de la propiedad)
   - `ubigeo_cod text` (FK lógica a `v2.ubigeos`)
   - `urbanizacion text`
2. Migración SQL: crear `v2.ubigeos (codigo PK, distrito, provincia, departamento)` + seed con los 1,853 distritos del Excel
3. UI: rehacer `NuevaSeparacionModal` y form de edición cliente con los nuevos campos + autocomplete ubigeo (buscador por distrito)
4. Actualizar `sapExport.ts` para leer los campos nuevos de `cliente` y concatenar `Street` correctamente
5. Constructor de reportes: exponer los campos nuevos como columnas disponibles

### Fase B — Seed de promotores + normalización catálogos SAP (estimado: 2 h)

Tareas:
1. Script/migración para crear los 13 usuarios de COPRODELI con sus `sap_sales_person_code` (una vez Yessenia confirme la lista completa — hoy solo vi Gisela)
2. Tabla `v2.sap_catalogos` (clave, valor, descripcion, tipo) para: GrupoBIF, Almacen, Programa, CentroCosto, Partida, Subpartida — editables desde `/v2/admin/parametros`
3. Tabla `v2.sap_item_mapping (propiedad_id → item_code SAP, warehouse_code, ubicacion_sap)` para el mapeo de cada unidad al catálogo artículo SAP

### Fase C — Las 4 plantillas de Precontrato (estimado: 6-8 h)

**Objetivo**: reemplazar el contrato único actual por 4 plantillas según modalidad.

Tareas:
1. Migración SQL: añadir a `v2.ventas`:
   - `modalidad_pago` enum: `contado` | `cuotas_sin_interes` | `cuotas_con_interes` | `bono_mivivienda`
   - `tasa_interes_anual numeric(4,2)` default 0
   - `penalidad_retiro numeric(10,2)`
   - `cuenta_recaudadora text` enum: `SIN_DATA` | `CON_DATA_TERRENO` | `CON_DATA_CASAS`
2. Parámetros nuevos en `v2.parametros`:
   - `empresa_representante_nombre`, `empresa_representante_dni`, `empresa_representante_partida`
   - `domicilio_fiscal_empresa`, `ruc_empresa`
   - `proyecto_nombre`, `proyecto_partida_registral`, `proyecto_ubicacion`
   - `cuenta_banbif_sin_data`, `cuenta_banbif_con_data_terreno`, `cuenta_banbif_con_data_casas`
   - `mora_diaria_terreno`, `mora_diaria_casa`
   - `whatsapp_cobranza`, `email_cobranza`
3. Rehacer `/v2/print/contrato/[id]` como renderer único que lee `modalidad_pago` y `tipo` y elige entre 4 componentes:
   - `<PrecontratoTerrenoContado />`
   - `<PrecontratoTerrenoCuotasSinInteres />`
   - `<PrecontratoTerrenoCuotasConInteres />`
   - `<PrecontratoCasa />`
4. UI en `ContratoTab` para elegir modalidad + campos dependientes (tasa si con interés, bono si MiVivienda)
5. Tabla de inicial con **al menos 3 filas** (editables, expandibles a más)

### Fase D — Expediente MiVivienda (solo si se pide) (estimado: 4-6 h)

Aplica a ventas de CASA con `modalidad_pago = bono_mivivienda`. Campos:

1. Migración SQL: añadir a `v2.ventas`:
   - `expediente_mivivienda_codigo text`
   - `fecha_ingreso_expediente date`
   - `fecha_beneficiario date`
   - `fecha_caducidad date`
   - `bono_monto numeric(12,2)`
   - `ahorro_cliente numeric(12,2)`
   - `credito_hipotecario_banco text`, `credito_hipotecario_monto numeric`, `credito_hipotecario_fecha_inicio date`, `credito_hipotecario_fecha_fin date`
2. UI: tab adicional "MiVivienda" en `/v2/ventas/[id]` para registrar/trackear el expediente
3. Parámetros: montos fijos de penalidad por estado (no elegible, retiro post-bono, etc.)

---

## 16. Estado de implementación SAP hoy

- ✅ Export SAP básico (`/v2/reportes/sap`) con 3 pestañas (Maestro, Órdenes, Separación) — commit `02afeb3`
- ✅ `profiles.sap_sales_person_code` (integer, opcional)
- ✅ Botón "Crear promotor" en `/v2/admin/usuarios` con campo SAP code obligatorio
- ✅ Headers SAP mapeados 1:1 en `src/lib/v2/sapExport.ts` (33 maestro, 90+ orden, 36 separación)
- ✅ Builder de COD_PROMOTOR y COD_UBIGEO dinámicos (pero ubigeo se arma desde clientes, no desde catálogo)
- ❌ `v2.clientes` sin campos estructurados de dirección (bloquea export real)
- ❌ `v2.ubigeos` no existe como tabla
- ❌ `v2.ventas` sin campos de modalidad de pago / bono / tasa
- ❌ Plantillas de precontrato — hay 1 genérica, faltan 3 variantes

## Estado actual (2026-04-11)

- **En producción**: https://habitatcoprodeli.com (rama `main`, commit `0196e2f`)
- **Preview v2**: https://habitad-git-v2-pies-projects-14d4cbfe.vercel.app
- **Proyecto Supabase**: `kgcnlzpplosovhunylql` (Habitad, región us-east-2, PG 17)
- **Rama**: `main` (ya contiene todo el código v2; `v2` branch sigue viva por si conviene continuar trabajo aislado)
- **Default `profiles.use_v2`**: `true` (todos los nuevos registros van a v2 automáticamente)
- **Cron Vercel**: diario `0 12 * * *` → `/api/v2/cron` (Hobby no permite hourly)
- **CRON_SECRET**: ya configurado en Vercel envs (los 3 entornos)
- **PostgREST**: schema `v2` expuesto vía Management API (`db_schema=public,graphql_public,v2`)

### Credenciales demo (password común `Habitad2026!`)

Los 4 roles oficiales del spec más 4 legacy v1 que también funcionan:

| Rol del spec | Email | Landing al login |
|---|---|---|
| **Administrador** | `administrador@administrador.com` | `/v2` |
| **Promotor** | `promotor@promotor.com` | `/v2/plano` |
| **Cliente** | `cliente@cliente.com` | `/v2/portal` (con venta demo en C003 para ver flujo completo) |
| **Auditor** | `auditor@auditor.com` | `/v2` (solo lectura + export) |

| Rol legacy | Email | Permisos |
|---|---|---|
| Gerente | `gerencial@gerencial.com` | Staff supervisión (ve todo, **no** Administración — decisión de negocio) |
| Supervisor | `supervisor@supervisor.com` | Staff supervisión (ve todo, sin Administración) |
| Coordinador | `coordinador@coordinador.com` | Staff supervisión (ve todo, sin Administración) |
| Asistente | `asistente@asistente.com` | Staff supervisión (ve todo, sin Administración) |

### Datos demo en la DB

- **26 propiedades** (importadas del Excel v1) asignadas a la etapa "Etapa 1"
- **Venta C001 — Luis Rodriguez**: separación vigente (24h), sin pago registrado
- **Venta C003 — Cliente Demo**: en estado `cuotas`, con cronograma completo (24 cuotas), 6 pagos registrados (1 sep + 3 inicial + 1 cuota pagada + 1 parcial), total pagado $19,768.33 / saldo $57,871.67. Vinculada al auth user `cliente@cliente.com` vía `auth_user_id`

---

## 1. Objetivo

Construir un sistema nuevo (no parches sobre v1) para gestionar el ciclo completo de venta de lotes y casas:

**Plano → Separación 24h → Inicial (3 meses) → Contrato + Cronograma → Cuotas → Reportes**

Con control granular por roles, trazabilidad total (auditoría), multi-moneda (PEN/USD) y saldos reales.

---

## 2. Estrategia técnica

### Coexistencia con v1

- **Mismo repo** (`coprodelidev/habitad`) para mantener la integración con Vercel y no duplicar deploys.
- **Rama `v2`** desde `main`. `main` sigue sirviendo la landing page y el dashboard v1 en producción sin que v2 los afecte.
- **`src/` no se toca**: la landing pública (`/`, `/camposanto`, `/construimos`, `/proyectos`, etc.) y el dashboard v1 en `/dashboard` siguen funcionando como hoy.
- **Todo el código nuevo vive en [src/app/v2/](../src/app/v2/)** con su propio `layout.tsx`, `page.tsx` y submódulos.
- **Redirect por flag**: al loguearse, si `profiles.use_v2 = true` el usuario va a `/v2`; si no, a `/dashboard` (v1). Esto permite cutover gradual. Cuando v2 esté validado, se flipea el flag por defecto y se deprecia v1.

### Supabase

- **Mismo proyecto Supabase** (`kgcnlzpplosovhunylql`) — no creamos uno nuevo porque (a) el free tier ya está copado y (b) se evita duplicar Auth.
- **Schema dedicado `v2`**: todas las tablas nuevas viven bajo `v2.*` (`v2.propiedades`, `v2.ventas`, `v2.pagos`, etc.). El schema `public` de v1 queda intacto.
- Aislamiento real: las RLS, funciones y vistas se definen sobre `v2`. Rollback = `DROP SCHEMA v2 CASCADE`.
- Migración de datos v1→v2 se hará con `INSERT ... SELECT` interno cuando llegue el momento del cutover, sin exportar nada.
- **Enums** (10): `tipo_propiedad`, `estado_fisico`, `estado_comercial`, `moneda`, `estado_venta`, `tipo_pago`, `estado_pago`, `estado_cuota`, `tipo_documento`, `operacion_audit`.

### Stack

- Next.js 15 (App Router + Turbopack), TypeScript, Tailwind, Radix UI — ya en el repo.
- Supabase JS, Supabase Auth (ya usado en v1), **Supabase Storage** para vouchers/documentos firmados.
- `react-hook-form` + `zod` para formularios (ya en el repo).
- Generación de PDFs: por definir (candidatos: `@react-pdf/renderer`, `pdf-lib`, o plantillas HTML + `puppeteer`). Ver "Decisiones pendientes".

---

## 3. Roles y permisos

| Rol | CRUD propiedades | Registrar venta/separación | Registrar pagos | Editar/borrar pagos | Ver todos los reportes | Configurar sistema |
|---|---|---|---|---|---|---|
| **Administrador** | Sí | Sí | Sí | Sí | Sí | Sí |
| **Promotor** | Solo lectura | Sí | Sí | No (solo admin) | Solo los suyos | No |
| **Cliente** (portal) | No | No | No | No | Solo estado propio | No |
| **Auditor / Contabilidad** | Solo lectura | No | No | No | Sí (exportar) | No |

Decisiones clave:
- El promotor **no puede eliminar pagos**. Si hay error, lo corrige admin y queda en la bitácora de auditoría.
- El cliente tiene portal con acceso limitado: ver su estado y descargar documentos emitidos. Subir documentos firmados es opcional por configuración.
- El auditor es solo-lectura + exportación. No edita nada. Diseñado para contabilidad externa.

---

## 4. Módulos

### Módulo A — Propiedades (Inventario)
Fuente única de verdad del inventario. Una propiedad = una unidad vendible (lote o casa).

**Datos por propiedad**: Etapa, CUH, tipo (casa/terreno), modelo, partida registral, Manzana, Lote, ubicación, área (m²), precio de lista, precio de venta (si difiere), adicionales, moneda base.

**Estados**:
- **Físico**: `libre`, `separado`, `ocupado`, `bloqueado`
- **Comercial**: `sin_venta`, `separacion`, `inicial`, `cuotas`, `cancelacion`, `entregada`

Los estados se derivan automáticamente del flujo — nunca se editan manualmente salvo por admin en casos excepcionales (con log de auditoría).

### Módulo B — Plano (General y por etapas)
UI visual para operar la venta. Cada unidad es un polígono/círculo sobre una imagen o SVG del plano.

**Colores**:
- 🟢 Verde: libre
- 🟡 Amarillo: separado (con vencimiento visible)
- 🔴 Rojo: ocupado (cualquier estado comercial activo: inicial/cuotas)
- 🔵 Celeste: bloqueado (solo admin puede pintar esto)

**Interacción**:
- Plano general (todas las etapas) y plano por etapa.
- Click en unidad libre → modal con formulario rápido (nombres, apellidos, DNI, teléfono, correo) → crea separación con vencimiento automático 24h → unidad pasa a amarillo.
- Click en unidad amarilla → muestra detalles de la separación y tiempo restante.
- Click en unidad roja → ficha del cliente y estado de pagos.
- Bloqueo manual (celeste) solo disponible para admin.

### Módulo C — Venta / Separación
Registra la separación y emite la hoja de separación (PDF).

**Datos**:
- Unidad (CUH/Mz/Lt/Etapa)
- Cliente
- Promotor asignado
- Fecha de registro
- **Fecha de vencimiento = fecha_registro + 24h** (automática)

**PDF**: Hoja de Separación descargable.

**Checklist documental**:
- DNI del cliente
- Voucher de separación
- Hoja firmada (digital provisional; físico máximo 3 días)

**Regla de vencimiento**: si a las 24h no se registró el pago de separación, un **job automático** (Supabase cron / edge function) libera la unidad y la pinta verde. Se notifica al promotor (notificación in-app; email queda para fase 2).

Al confirmar el pago de separación, la unidad queda consolidada y se habilita el Módulo D (Inicial).

### Módulo D — Inicial (3 meses)
Control de abonos de la inicial durante una ventana de 3 meses desde la separación.

**Campos por abono**:
- Fecha de depósito
- Nº de operación
- Banco
- Monto
- Moneda (PEN/USD)
- **Voucher (imagen o PDF) → obligatorio, se sube a Supabase Storage**

**Cálculo automático**: total abonado inicial, saldo inicial pendiente, % completado.

**Cuando la inicial está completa**: se habilita el Módulo E (Contrato).

**Regla de plazo incompleto**: si pasan los 3 meses y la inicial NO está completa, **la venta se cancela automáticamente** y la unidad se libera (vuelve a verde). El promotor y el admin reciben notificación. Los abonos parciales quedan registrados como "venta cancelada" con historial — la decisión de devolver o no devolver el dinero es una conversación humana, el sistema solo refleja el estado.

### Módulo E — Contrato + Cronograma
Emisión automática del contrato y del cronograma de cuotas.

**Formulario de generación**: toma datos acumulados (cliente, unidad, precio, inicial pagada) y pide los campos faltantes (plazo total de cuotas, tasa si aplica, fecha primera cuota).

**PDFs generados**:
- Contrato
- Cronograma de cuotas mensuales

**Estado de la propiedad**: pasa a `cuotas`.

### Módulo F — Gestión de Pagos (Cuotas)
Registra pagos de cuotas mensuales y mantiene el saldo real.

**Regla crítica (corrige bug de v1)**: cuando un pago entra por un monto **mayor** al de la cuota del mes, el exceso **NO** se aplica automáticamente a las cuotas finales (como hace v1). El exceso queda como **saldo a favor del cliente** y se consume automáticamente contra la siguiente cuota cuando llegue su vencimiento.

**Datos de cada pago**: fecha depósito, nº operación, banco, monto, moneda, voucher opcional (en cuotas el voucher no es obligatorio — ver Gestión de Pagos vs. Inicial).

**Visualización siempre presente**: CUH, Mz, Lt, Etapa, Cliente (nombre + DNI).

**Importación desde reporte bancario**:
- Subida de archivo (Excel, CSV o PDF).
- El sistema intenta matchear cada línea con un cliente/pago esperado.
- Lo matcheado se registra; lo no matcheado queda en una cola "pendiente de asignación" para revisión manual.
- Ver "Decisiones pendientes" para los detalles del algoritmo de matching.

### Módulo G — Reportes
Todos los reportes con rango de fechas + exportación a Excel y PDF.

- **Reporte general**: fecha depósito, nº operación, DNI, descripción, monto, precio, bono, estado, total recaudación, saldo, promotor.
- **Ventas por mes**: basado en el 1er abono de separación.
- **Pagos por cliente**: separación / inicial / cuotas con saldo vigente.
- **Reporte por situación y tipo**: casa vs. terreno, estado comercial.
- **Reporte por promotor**: cartera, metas, comisiones (si aplica).

### Módulo H — Administración (Backoffice)
Solo para rol Admin.

- **Usuarios y roles**: alta, baja, reasignación.
- **Parámetros configurables**: plazo de separación (default 24h), plazo de inicial (default 3 meses), bancos permitidos, monedas, plantillas PDF (header, footer, logo, cláusulas).
- **Auditoría**: tabla append-only con historial de cambios. Cada write a `v2.*` registra `quién`, `qué tabla`, `qué fila`, `qué cambió`, `cuándo`. Se implementa con triggers de Postgres.
- **Importaciones**: Drive, saldos iniciales, reporte bancario histórico.
- **Tipo de cambio SBS**: el sistema consulta el tipo de cambio diario de la SBS (Superintendencia de Banca, Seguros y AFP del Perú) para conversiones PEN↔USD. Ver "Decisiones pendientes".

---

## 5. Reglas de negocio consolidadas

Respuestas finales a las preguntas abiertas durante el diseño:

1. **Vencimiento de separación (24h)**: job automático libera la unidad (vuelve a verde) y notifica al promotor. No se archiva como "separación fallida" permanente, simplemente se libera. **Implementado** en `v2.liberar_separaciones_vencidas()` llamado diariamente vía cron Vercel.
2. **Inicial incompleta (3 meses)**: la venta se cancela automáticamente, la unidad se libera. Los abonos parciales quedan registrados con el estado `venta_cancelada`. **Implementado** en `v2.cancelar_iniciales_vencidas()`.
3. **Sobrepago en cuotas**: el exceso es **saldo a favor del cliente** y se aplica automáticamente a la siguiente cuota vencida. Jamás se mueve a cuotas finales automáticamente. **Implementado** en `v2.aplicar_pago_cuota(uuid)`.
4. **Importación reporte bancario**: se aceptan Excel, CSV y PDF. **Algoritmo de matching pendiente de definir** hasta que el cliente entregue un archivo real de muestra (ver notas abiertas).
5. **Multi-moneda**: el tipo de cambio usado para conversiones es el de la **SBS del día del pago**. Se cachea diariamente. **Implementado parcialmente**: UI para ingreso manual en `/v2/admin/tipo-cambio`. La integración automática con API SBS queda para fase 2.
6. **Portal cliente**: **sí existirá**. Diseñamos las tablas y permisos (RLS) para soportarlo desde el día 1. **Implementado**: `/v2/portal`, con vinculación cliente↔auth_user_id. Subida de documentos firmados queda como opcional (spec lo marca "si se habilita").
7. **Voucher obligatorio en separación e inicial**: todo voucher se sube como imagen/PDF a **Supabase Storage** con un ID vinculado al registro del pago. Admin y auditor pueden verificar sin pedir el archivo al promotor. En cuotas el voucher es opcional. **Implementado**: `voucherRequired` en `PagoForm.tsx` + bucket `v2-vouchers` con RLS de staff.
8. **Downgrade protegido**: ningún estado comercial puede retroceder automáticamente. Los retrocesos solo son posibles con acción de admin y quedan en auditoría. **Implementado** en `v2.sync_propiedad_estado()` con ranking de estados (sin_venta<separacion<inicial<cuotas<entregada). Cancelación es la única excepción legítima.
9. **Anular pago revierte aplicación**: al anular un pago, la función `v2.anular_pago(uuid)` revierte los efectos en cuotas (orden inverso) y borra los saldos a favor huérfanos generados por el pago.
10. **Scoping por promotor**: el promotor solo ve pagos, cuotas, saldos y documentos de ventas donde él es `promotor_id`. Los roles de supervisión (gerente, coordinador, supervisor, asistente) ven todo. Admin también.
11. **Gerente = staff operativo, NO admin**: decisión de negocio confirmada. Solo `administrador` accede a Administración, CRUD propiedades, editar/borrar pagos y gestionar usuarios.
12. **Cliente restringido al portal**: un guard en el layout redirige cualquier ruta `/v2/*` (excepto `/v2/portal` y `/v2/print/*`) a `/v2/portal` cuando el rol es `cliente`. Esto evita que el cliente navegue manualmente.
13. **Vercel cron en plan Hobby**: solo permite ejecución diaria. El cron se ejecuta una vez al día a las 12:00 UTC, no cada hora. Con SLA de 24h para separaciones y 3 meses para iniciales, cubre el caso de uso.

---

## 6. Flujo resumido

```
[PLANO: unidad verde]
        │
        │ promotor click + form
        ▼
[SEPARACIÓN 24h: unidad amarilla]
        │
        ├─ pago separación en 24h ──────► [INICIAL habilitada]
        │
        └─ sin pago en 24h ──────────────► [unidad vuelve a verde, separación liberada]

[INICIAL: 3 meses de abonos]
        │
        ├─ inicial completa ─────────────► [CONTRATO + CRONOGRAMA generados]
        │
        └─ 3 meses sin completar ────────► [venta cancelada, unidad libre]

[CONTRATO firmado]
        │
        ▼
[CUOTAS mensuales]
        │
        ├─ pago exacto ──────────────────► cuota saldada
        ├─ pago menor ───────────────────► saldo parcial, cuota pendiente
        └─ pago mayor ───────────────────► exceso a saldo a favor del cliente
        │
        ▼
[REPORTES: recaudación, cartera, mora, promotor]
```

---

## 7. Decisiones pendientes (notas abiertas)

Estas decisiones no bloquean el arranque pero deben cerrarse antes de las fases correspondientes.

### NOTA — Matching de reporte bancario (Módulo F)
**Estado**: pendiente hasta que el cliente entregue un archivo real de muestra.

Cuando tengamos el archivo real del banco, definir:
- Qué columnas trae (fecha, nº operación, glosa, monto, moneda).
- Qué campo usar como **llave de matching** (candidatos: nº operación registrado en el voucher, DNI en la glosa, nombre en la glosa).
- Tolerancia de fechas (¿matchea un pago del día D con una cuota del día D±2?).
- Qué hacer con duplicados y con pagos no identificados (cola manual).

Mientras tanto, el módulo acepta el archivo y muestra un preview sin registrar nada.

### NOTA — Generación de PDFs
**Estado**: ✅ resuelto vía HTML imprimible en lugar de librería PDF.

Las rutas `/v2/print/separacion/[id]`, `/v2/print/contrato/[id]` y `/v2/print/cronograma/[id]` renderizan HTML optimizado para impresión con media-query `@print` (el botón "Imprimir" se oculta). El usuario puede elegir "Guardar como PDF" en el diálogo de impresión del navegador.

Ventajas: cero dependencias nuevas, 100% maintainable con componentes React/Tailwind, se adapta a cualquier plantilla. Si en el futuro se requiere generación server-side (ej. adjuntar PDF a un email automático), migrar a `@react-pdf/renderer` o Puppeteer.

### NOTA — Tipo de cambio SBS
**Estado**: confirmar fuente y cache.

La SBS publica el tipo de cambio oficial diario. Opciones:
- Endpoint público (si existe uno estable).
- Scraping del sitio de la SBS (frágil).
- Servicio de terceros (ej. APIs de tipo de cambio).

Se cachea diariamente en `v2.tipo_cambio_sbs` (fecha, compra, venta) y se consulta desde ahí. Si el día no tiene dato (feriado), se usa el último disponible.

### NOTA — `CRON_SECRET` en Vercel
**Estado**: ✅ configurado el 2026-04-11 en los entornos `production`, `preview` y `development` del proyecto `habitad` (prj_HpxXh3zxCpor8DDvmMLaY0k8SeAy).

- Valor generado aleatoriamente (32 bytes hex). Guardado también en `.env.local` local para pruebas, y como `env.CRON_SECRET` en Vercel (tipo `encrypted`).
- Vercel Cron inyecta automáticamente `Authorization: Bearer <CRON_SECRET>` al llamar `/api/v2/cron` (diario a las 12:00 UTC según `vercel.json`).
- El endpoint además acepta `x-cron-secret` como fallback para ejecuciones manuales desde admin.
- Si se necesita rotar: generar nuevo, actualizar en Vercel envs + `.env.local`, sin cambios de código.
- Plan Vercel Hobby solo permite crons diarios; por eso no es hourly.

### NOTA — Build strict
**Estado**: ✅ `next.config.ts` tiene `typescript.ignoreBuildErrors = false` y `eslint.ignoreDuringBuilds = false` desde 2026-04-11. Cualquier error de tipos o lint rompe el build y bloquea el deploy — eso queremos.

### NOTA — Notificaciones
**Estado**: MVP = notificaciones in-app. Email/WhatsApp para fase 2.

Eventos que notifican:
- Separación por vencer (1h antes del vencimiento).
- Separación vencida y liberada.
- Inicial completa → contrato disponible.
- Cuota próxima a vencer (3 días antes).
- Pago recibido correctamente.

---

## 8. Plan de trabajo y cronograma

Según contrato:
- **Desarrollo**: 3 semanas.
- **Pruebas y feedback**: 1 semana.
- **Compromiso del cliente**: feedback entregado dentro de 1 semana después del desarrollo.
- **Pago**: 50% adelanto, 50% al finalizar.
- **Precio COPRODELI**: 1300 € sin impuestos.
- **No incluye**: dominio, hosting, base de datos (ya existen).
- **Entregable**: sistema instalado, puesto en marcha y con usuarios configurados.

### Fases técnicas sugeridas

**Fase 0 — Setup (día 1-2)**
- Rama `v2` creada.
- Esqueleto `/v2` con layout vacío.
- Schema `v2` en Supabase con tablas base (usuarios, roles, propiedades).
- Flag `profiles.use_v2` + redirect en login.
- RLS policies iniciales.

**Fase 1 — Inventario y plano (semana 1)**
- Módulo A: CRUD de propiedades, importación desde Excel.
- Módulo B: plano visual con colores por estado.
- Bloqueo manual (admin).

**Fase 2 — Separación e inicial (semana 2)**
- Módulo C: form de separación + generación de hoja PDF + checklist documental.
- Módulo D: registro de abonos de inicial + upload de vouchers a Storage.
- Job de vencimiento de separación (24h).
- Job de cancelación automática de inicial (3 meses).

**Fase 3 — Contrato, cuotas y reportes (semana 3)**
- Módulo E: generación de contrato y cronograma.
- Módulo F: registro de pagos de cuotas, saldo a favor, preview de importación bancaria.
- Módulo G: reportes con filtros y exportación.
- Módulo H: administración y auditoría.

**Fase 4 — Pruebas y portal cliente (semana 4)**
- Pruebas con usuarios reales.
- Portal cliente (vista de estado + descarga de documentos).
- Correcciones basadas en feedback.

---

## 9. Glosario

- **CUH**: Código Único Habitacional (identificador de la unidad).
- **Mz / Lt**: Manzana / Lote.
- **Etapa**: subproyecto dentro del proyecto habitacional (ej. "Etapa 1", "Etapa Premium").
- **Separación**: reserva temporal de una unidad con un cliente (24h).
- **Inicial**: conjunto de abonos previos al contrato (ventana de 3 meses).
- **Cuota**: pago mensual tras la firma del contrato.
- **SBS**: Superintendencia de Banca, Seguros y AFP (Perú), publica el tipo de cambio oficial.
- **Voucher**: comprobante de depósito bancario (imagen o PDF).

---

## 10. Contacto y responsables

- **Cliente**: COPRODELI.
- **Proyecto Supabase**: `kgcnlzpplosovhunylql` (schema `v2`, bucket-scoped RLS, PostgREST expone `public, graphql_public, v2`).
- **Repo**: `coprodelidev/habitad`. Producción en rama `main`, branch `v2` queda viva como espacio de trabajo aislado.
- **Deploy**: Vercel. Producción en `habitatcoprodeli.com` (trackea `main`). Preview por rama automático.

---

## 11. Migraciones Supabase aplicadas

Todas se ejecutaron en vivo vía Management API (ver [reference_supabase_management.md](../../.claude/projects/c--Users-PROPIETARIO-Desktop-projects-helpy2025/memory/reference_supabase_management.md) si se necesita rehacerlas o rollback).

Orden cronológico:

| Archivo | Contenido |
|---|---|
| `20260411_v2_init.sql` | Schema v2, 15 tablas, 10 enums, vista `vw_saldos_venta`, triggers `updated_at` y `log_audit` |
| `20260411_v2_rls.sql` | RLS policies iniciales por rol en todas las tablas v2 |
| `20260411_v2_seed.sql` | Parámetros base del sistema (horas sep, meses inicial, bancos, moneda, plantillas) |
| `20260411_v2_storage_and_fn.sql` | Buckets `v2-vouchers`, `v2-documentos`, `v2-planos`, `v2-reportes-banco` + RLS storage + funciones `sync_propiedad_estado`, `aplicar_pago_cuota`, `liberar_separaciones_vencidas`, `cancelar_iniciales_vencidas` |
| `20260411_v2_fixes.sql` | Policies admin sobre `public.profiles` (admin ve/edita todos), revoke EXECUTE PUBLIC en funciones RPC |
| `20260411_v2_rls_scoping.sql` | Scoping estricto del promotor: solo ve pagos, cuotas, saldos, documentos y checklist de ventas donde él es `promotor_id` |
| `20260411_v2_downgrade_and_notify.sql` | Downgrade protection en `sync_propiedad_estado` + notificaciones a admins cuando expiran separaciones/iniciales |
| `20260411_v2_anular_pago.sql` | Función `v2.anular_pago(uuid)` que revierte aplicación del pago en cuotas + borra saldos a favor asociados |
| `20260411_v2_gerente_staff.sql` | Demotea `gerente` de admin a staff operativo. `v2.is_admin()` solo `'administrador'`. Notifications solo a admin real |
| `20260411_v2_audit_user_fix.sql` | `v2.log_audit()` lee `request.jwt.claim.sub` primero (PostgREST context), fallback a `auth.uid()` |

Fuera de migraciones:
- `PATCH /v1/projects/.../postgrest` para agregar `v2` al `db_schema` expuesto
- `ALTER TABLE public.profiles ALTER COLUMN use_v2 SET DEFAULT true; UPDATE public.profiles SET use_v2 = true` (para que nuevos registros vayan automáticamente a v2)
- Bulk `UPDATE v2.propiedades SET etapa_id = ...` asignando las 26 propiedades a Etapa 1
- Seed de C003 (venta Cliente Demo completa con 6 pagos + 24 cuotas + inicial completa + cronograma corregido al centavo)

---

## 12. Historial de decisiones / cambios

### 2026-04-11
- **Schema `v2` creado y desplegado en producción** (`habitatcoprodeli.com` sirve v2 desde commit `cced78e` → `0196e2f`)
- **v1 no se borra**: `/dashboard` sigue accesible y la landing pública (`/`, `/camposanto`, `/proyectos`, etc.) sin tocar
- **Gerente redefinido**: ya no es admin. Solo `administrador` accede a Administración
- **Auto-rol cliente en signup**: verificado funcionando vía `RegisterForm.tsx` → `user_metadata.role = 'cliente'` → `syncProfile.ts` convierte a `role_id` al primer login
- **Modal del plano ocupado (rojo)** muestra "ficha del cliente + estado de pagos" completo (spec módulo B cumplido)
- **Anular pago** ahora revierte cuotas y borra saldos a favor huérfanos (antes solo marcaba como anulado)
- **Redondeo en cronograma**: la última cuota absorbe la diferencia para que el total sume exactamente `precio_acordado - separacion - inicial`
- **Parámetros admin** dejó de pedir JSON crudo. Ahora son formularios amigables (NumberField, SelectField, TagsField)
- **Plano colores**: `emerald-600`, `amber-400`, `red-600`, `sky-600` con texto bold para contraste real
- **Look & feel**: sidebar v2 idéntica a v1 (`bg-[rgb(14,8,201)]` + toggle plegar/desplegar)
- **/v2/print/\*** bypassa el layout v2 (sin sidebar, sin guards de rol) para que el cliente pueda descargar sus documentos
- **Cliente guard**: cualquier ruta `/v2/*` que no sea `/v2/portal` ni `/v2/print` rebota a `/v2/portal` cuando el rol es cliente
- **Build strict**: `typescript.ignoreBuildErrors = false`, `eslint.ignoreDuringBuilds = false`

---

## 13. Cómo continuar (handoff)

Si otra IA o persona toma el trabajo desde aquí:

1. **Leer este documento** en orden de arriba a abajo. Las secciones 5 y 11 son las más densas; ahí está el "por qué" de cada decisión.
2. **Para cambios de negocio** (plazos, bancos, plantillas): usar `/v2/admin/parametros` — ya no hay JSON crudo, todo es formulario.
3. **Para cambios de código**: trabajar en `main` directamente (v2 ya está en producción) o crear rama desde `main`. No volver a trabajar en la rama `v2` — puede causar divergencias.
4. **Para nuevas migraciones SQL**: crear archivo en `supabase/migrations/YYYYMMDD_descripcion.sql` y aplicar vía el snippet de `reference_supabase_management.md` en memoria. No intentar usar `pg` ni `psql` (fallan auth con el pooler de Supabase).
5. **Para cron**: el endpoint `/api/v2/cron` se autentica con `CRON_SECRET` (ya en Vercel envs). Vercel lo llama diariamente. Para forzar ejecución manual: `curl -H "x-cron-secret: <valor>" https://habitatcoprodeli.com/api/v2/cron`.
6. **Pendientes de fase 2**:
   - Matching automático del reporte bancario (esperando archivo real del banco)
   - Integración API SBS automática para tipo de cambio (hoy manual)
   - Notificaciones por email / WhatsApp (hoy solo in-app)
   - Portal cliente: subida de documentos firmados (spec lo marca "si se habilita")
