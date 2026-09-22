# Módulo Retirados

## Puesta en marcha

Aplicar `supabase/migrations/20260918_v2_retirados.sql` en la base Supabase existente antes de desplegar el frontend. La migración es transaccional y requiere las migraciones previas del proyecto. No requiere variables de entorno nuevas. Mantener el cron diario existente de `/api/v2/cron` para los recordatorios.

La migración no se ha aplicado a producción desde el entorno de desarrollo. No transforma cancelaciones históricas: no se conocen sus motivos ni sus penalidades confirmadas.

## Operación

- En Plano → Detalle de unidad → Liberar unidad, o en la venta → Retirar y liberar ubicación, el administrador selecciona uno de los cinco motivos y confirma la advertencia.
- Cuotas atrasadas, incumplimiento de requisitos e inicial/separación incompleta tienen penalidad. Se sugiere S/ 3,700, editable y positivo, siempre en PEN. Cambio de ubicación e incumplimiento de requisitos del cambio de titular no tienen penalidad.
- El importe confirmado se guarda en el expediente; no cambia el importe contractual de la venta ni ejecuta cobros, devoluciones o conversiones de moneda.
- La RPC registra el expediente, preserva datos del cliente y ubicación, cancela la venta, libera la ubicación y notifica al equipo en una sola transacción. Los reintentos no crean duplicados.
- Retirados permite buscar por nombre, apellido, DNI o CUH, filtrar por motivo/estado y revisar los expedientes paginados.
- El checklist conserva cada check. Primero se solicita y recibe la carta, se verifican datos y fecha y se revisa la penalidad; después se completa la gestión de devolución. La carta se gestiona fuera del sistema: estos checks no son un adjunto ni un pago automático.
- Las observaciones quedan con autor, fecha y estado. Las nuevas observaciones notifican al promotor asignado y al personal de supervisión/administración. Las observaciones pendientes impiden cerrar el trámite; una nueva observación reabre uno completado.
- El auditor solo consulta. El promotor solo consulta y gestiona expedientes de sus ventas. Solo el administrador puede liberar. Las RPC y RLS aplican estas reglas en el servidor y los cambios quedan en auditoría.
- Los vencimientos de separación e inicial generan alertas para revisión, **no liberaciones automáticas**. Esto permite seleccionar motivo, revisar penalidad y aceptar la advertencia antes de liberar. Las firmas SQL antiguas se mantienen por compatibilidad con el cron.
- Los recordatorios se muestran dentro de Notificaciones; no se envía correo ni WhatsApp. El contador y la bandeja muestran notificaciones del usuario conectado y se actualizan cada 30 segundos.

## Verificación

`npm run typecheck`

`npm run test:retiros`

Las pruebas ejecutan las migraciones de negocio en PostgreSQL aislado (PGlite), con fixtures mínimos para auth/profiles/storage. Cubren los cinco motivos, penalidades, confirmación, rollback transaccional, reintentos, RLS, bloqueo de cancelación directa, seguimiento, conflictos de edición, observaciones y cron. No requieren credenciales ni escriben en Supabase.
