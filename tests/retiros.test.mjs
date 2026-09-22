import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// PostgreSQL real en WASM: no usa credenciales ni datos de producción.
const migration = (name) => readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8');

test('Retirados: transacciones, permisos, seguimiento y notificaciones', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, anon;
    CREATE TABLE public.roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE, label text, description text);
    CREATE TABLE public.profiles (id uuid PRIMARY KEY, role_id uuid REFERENCES public.roles(id), first_name text, last_name text, email text);
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    CREATE TABLE storage.objects (id uuid PRIMARY KEY, bucket_id text);
  `);
  for (const name of [
    '20260411_v2_init', '20260411_v2_rls', '20260411_v2_storage_and_fn',
    '20260411_v2_downgrade_and_notify', '20260411_v2_gerente_staff',
    '20260411_v2_rls_scoping', '20260412_v2_rls_break_recursion',
    '20260530_v2_cron_no_service_role', '20260531_v2_notif_cuotas_proximas',
  ]) await db.exec(await migration(name));
  await db.exec(`ALTER TYPE v2.estado_venta ADD VALUE 'cancelada_desplazada'`);
  await db.exec(await migration('20260918_v2_retirados'));

  const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
  const users = {};
  for (const [key, role] of Object.entries({ admin: 'administrador', promotor: 'promotor', otro: 'promotor', auditor: 'auditor', cliente: 'cliente', asistente: 'asistente' })) {
    await db.query(`INSERT INTO public.roles(code) VALUES ($1) ON CONFLICT DO NOTHING`, [role]);
    const { id } = await one(`INSERT INTO public.profiles(id,role_id,first_name,email)
      SELECT gen_random_uuid(),id,$2,$2 || '@example.test' FROM public.roles WHERE code=$1 RETURNING id`, [role, key]);
    await db.query('INSERT INTO auth.users VALUES ($1)', [id]);
    users[key] = id;
  }
  const as = async (key) => {
    await db.exec('RESET ROLE');
    await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [key ? users[key] : '']);
    if (key) await db.exec('SET ROLE authenticated');
  };
  let number = 0;
  const sale = async (estado = 'separacion', other = false) => {
    await as(null);
    const n = ++number;
    const c = await one(`INSERT INTO v2.clientes(nombres,apellidos,dni,telefono) VALUES ('Ana','Prueba',$1,'999000111') RETURNING id`, [String(n).padStart(8, '0')]);
    const p = await one(`INSERT INTO v2.propiedades(cuh,tipo,manzana,lote,precio_lista) VALUES ($1,'terreno','1',$2,40000) RETURNING id`, [`TEST-${n}`, String(n)]);
    const v = await one(`INSERT INTO v2.ventas(propiedad_id,cliente_id,promotor_id,estado,precio_acordado,moneda,fecha_vencimiento_separacion,fecha_limite_inicial,monto_inicial_objetivo)
      VALUES ($1,$2,$3,$4,40000,'USD',now()-interval '2 days',now()-interval '1 day',5000) RETURNING id`, [p.id, c.id, users[other ? 'otro' : 'promotor'], estado]);
    await as('admin');
    return { id: v.id, propiedad: p.id, cliente: c.id };
  };
  const withdraw = (s, motivo = 'cuotas_atrasadas', penalty = 3700, confirmed = true, observation = null) =>
    one('SELECT v2.registrar_retiro($1,$2,$3,$4,$5) AS id', [s.id, motivo, penalty, observation, confirmed]);
  const row = (id) => one('SELECT * FROM v2.retiros WHERE id=$1', [id]);
  const task = async (id, campo, checked = true, version) => {
    const current = await row(id);
    return db.query('SELECT v2.actualizar_tarea_retiro($1,$2,$3,$4)', [id, campo, checked, version ?? current.version]);
  };

  await t.test('motivo, advertencia y penalidad se exigen en el servidor', async () => {
    const s = await sale();
    await assert.rejects(withdraw(s, 'cuotas_atrasadas', 3700, false), /advertencia/);
    await assert.rejects(withdraw(s, 'inventado'), /motivo/);
    for (const value of [0, -1, 12.345, 'NaN', null]) await assert.rejects(withdraw(s, 'cuotas_atrasadas', value), /monto positivo/);
    await assert.rejects(withdraw(s, 'cambio_ubicacion', 3700), /monto positivo/);
    await assert.rejects(db.query(`UPDATE v2.ventas SET estado='cancelada' WHERE id=$1`, [s.id]), /registrar el retiro/);
    await assert.rejects(db.query(`UPDATE v2.propiedades SET estado_fisico='libre' WHERE id=$1`, [s.propiedad]), /venta vigente/);
    assert.equal((await one('SELECT estado FROM v2.ventas WHERE id=$1', [s.id])).estado, 'separacion');
  });

  let primary;
  let primarySale;
  await t.test('los cinco motivos liberan y conservan snapshots, moneda, fecha e historial', async () => {
    for (const [motivo, penalty] of [['cuotas_atrasadas',3700], ['no_cumple_requisitos',3600], ['requisitos_cambio_titular',0], ['cambio_ubicacion',0], ['inicial_separacion_incompleta',3700]]) {
      const s = await sale();
      await db.query(`INSERT INTO v2.pagos(venta_id,tipo,fecha_deposito,monto,moneda) VALUES ($1,'separacion',current_date,100,'USD')`, [s.id]);
      const r = await withdraw(s, motivo, penalty);
      const stored = await row(r.id);
      assert.equal(stored.aplica_penalidad, penalty > 0);
      assert.equal(Number(stored.penalidad_monto), penalty);
      assert.equal(stored.penalidad_moneda, 'PEN');
      assert.equal(stored.cliente_snapshot.nombres, 'Ana');
      assert.ok(stored.fecha_retiro);
      assert.equal((await one('SELECT estado FROM v2.ventas WHERE id=$1', [s.id])).estado, 'cancelada');
      assert.equal((await one('SELECT estado_fisico FROM v2.propiedades WHERE id=$1', [s.propiedad])).estado_fisico, 'libre');
      assert.equal((await one('SELECT count(*)::int AS n FROM v2.pagos WHERE venta_id=$1', [s.id])).n, 1);
      assert.equal((await withdraw(s, motivo, penalty)).id, r.id);
      if (!primary) { primary = r.id; primarySale = s; }
    }
  });

  await t.test('un fallo de notificación revierte retiro y liberación completos', async () => {
    const s = await sale();
    await as(null);
    await db.exec(`CREATE FUNCTION public.test_fail_notification() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo simulado'; END $$;
      CREATE TRIGGER test_fail BEFORE INSERT ON v2.notificaciones FOR EACH ROW EXECUTE FUNCTION public.test_fail_notification();`);
    await as('admin');
    await assert.rejects(withdraw(s), /fallo simulado/);
    assert.equal((await one('SELECT count(*)::int AS n FROM v2.retiros WHERE venta_id=$1', [s.id])).n, 0);
    assert.equal((await one('SELECT estado_fisico FROM v2.propiedades WHERE id=$1', [s.propiedad])).estado_fisico, 'separado');
    assert.equal((await one('SELECT estado FROM v2.ventas WHERE id=$1', [s.id])).estado, 'separacion');
    await as(null); await db.exec('DROP TRIGGER test_fail ON v2.notificaciones'); await as('admin');
  });

  await t.test('no se libera una ubicación con otra venta vigente', async () => {
    const s = await sale();
    await db.query(`INSERT INTO v2.ventas(propiedad_id,cliente_id,estado,precio_acordado,moneda,fecha_vencimiento_separacion)
      VALUES ($1,$2,'separacion',40000,'USD',now()+interval '1 day')`, [s.propiedad, s.cliente]);
    await assert.rejects(withdraw(s), /otra venta vigente/);
  });

  await t.test('checklist valida orden, conflictos y observaciones; reabre ante nuevos pendientes', async () => {
    await assert.rejects(task(primary, 'carta_recibida'), /Primero marque/);
    await assert.rejects(task(primary, 'devolucion_gestionada'), /Complete primero/);
    const version = (await row(primary)).version;
    await task(primary, 'carta_solicitada');
    await assert.rejects(task(primary, 'datos_verificados', true, version), /Otro usuario/);
    await task(primary, 'carta_recibida');
    await assert.rejects(task(primary, 'carta_solicitada', false), /desmarque/);
    for (const campo of ['datos_verificados','fecha_confirmada','penalidad_revisada']) await task(primary, campo);
    await db.query('SELECT v2.agregar_observacion_retiro($1,$2)', [primary, 'Falta validar cuenta de devolución']);
    await assert.rejects(task(primary, 'devolucion_gestionada'), /observaciones pendientes/);
    const observation = await one('SELECT id FROM v2.retiro_observaciones WHERE retiro_id=$1', [primary]);
    await db.query('SELECT v2.resolver_observacion_retiro($1)', [observation.id]);
    await task(primary, 'devolucion_gestionada');
    assert.ok((await row(primary)).completado_at);
    await assert.rejects(task(primary, 'fecha_confirmada', false), /reabra/);
    await db.query('SELECT v2.agregar_observacion_retiro($1,$2)', [primary, 'Corregir número de cuenta']);
    assert.equal((await row(primary)).completado_at, null);
    assert.equal((await row(primary)).devolucion_gestionada, false);
    const notices = (await db.query(`SELECT usuario_id,mensaje FROM v2.notificaciones WHERE venta_id=$1 AND tipo='retiro_observacion'`, [primarySale.id])).rows;
    assert.ok(notices.some((n) => n.usuario_id === users.promotor && n.mensaje.includes('Corregir número')));
    assert.ok(!notices.some((n) => n.usuario_id === users.otro));
  });

  await t.test('RLS y RPC: administrador libera; promotor propio gestiona; auditor solo lee', async () => {
    await as('otro');
    assert.equal(await row(primary), undefined);
    assert.equal((await one('SELECT count(*)::int AS n FROM v2.retiro_observaciones WHERE retiro_id=$1', [primary])).n, 0);
    await assert.rejects(db.query('SELECT v2.agregar_observacion_retiro($1,$2)', [primary,'Acceso ajeno']), /permiso/);
    await as('promotor');
    assert.ok(await row(primary));
    await assert.rejects(withdraw(primarySale), /administrador/);
    await db.query('SELECT v2.agregar_observacion_retiro($1,$2)', [primary,'Seguimiento del promotor']);
    await assert.rejects(db.query(`UPDATE v2.retiros SET penalidad_monto=0 WHERE id=$1`, [primary]), /permission denied/);
    await as('auditor');
    assert.ok(await row(primary));
    await assert.rejects(db.query('SELECT v2.agregar_observacion_retiro($1,$2)', [primary,'No autorizado']), /permiso/);
    await as('cliente'); assert.equal(await row(primary), undefined);
    await as(null); await db.exec('SET ROLE anon');
    await assert.rejects(db.query('SELECT * FROM v2.retiros'), /permission denied/);
    await assert.rejects(withdraw(primarySale), /permission denied/);
    await as('admin');
  });

  await t.test('una venta retirada no se reactiva ni cambia de cliente; se puede volver a vender la ubicación', async () => {
    await assert.rejects(db.query(`UPDATE v2.ventas SET estado='separacion' WHERE id=$1`, [primarySale.id]), /conserva/);
    const another = await sale();
    await assert.rejects(db.query(`UPDATE v2.ventas SET cliente_id=$1 WHERE id=$2`, [another.cliente,primarySale.id]), /conserva/);
    await db.query(`INSERT INTO v2.ventas(propiedad_id,cliente_id,estado,precio_acordado,moneda,fecha_vencimiento_separacion)
      VALUES ($1,$2,'separacion',40000,'USD',now()+interval '1 day')`, [primarySale.propiedad, another.cliente]);
    await withdraw(primarySale);
    assert.equal((await one('SELECT estado_fisico FROM v2.propiedades WHERE id=$1', [primarySale.propiedad])).estado_fisico, 'separado');
  });

  await t.test('cron alerta vencimientos sin liberar; deduplica recordatorios y conserva tareas', async () => {
    const sep = await sale();
    const ini = await sale('inicial');
    await db.query('SELECT v2.fn_cron_run()');
    const first = await one(`SELECT count(*)::int AS n FROM v2.notificaciones WHERE NOT leida AND tipo IN ('retiro_pendiente','retiro_revision_vencimiento')`);
    await db.query('SELECT v2.fn_cron_run()');
    assert.equal((await one(`SELECT count(*)::int AS n FROM v2.notificaciones WHERE NOT leida AND tipo IN ('retiro_pendiente','retiro_revision_vencimiento')`)).n, first.n);
    assert.equal((await one('SELECT estado FROM v2.ventas WHERE id=$1', [sep.id])).estado, 'separacion');
    assert.equal((await one('SELECT estado FROM v2.ventas WHERE id=$1', [ini.id])).estado, 'inicial');
    assert.ok((await one(`SELECT count(*)::int AS n FROM v2.notificaciones WHERE venta_id=$1 AND tipo='retiro_revision_vencimiento'`, [sep.id])).n > 0);
    await withdraw(sep, 'inicial_separacion_incompleta');
    assert.equal((await one(`SELECT count(*)::int AS n FROM v2.notificaciones WHERE venta_id=$1 AND tipo='retiro_revision_vencimiento' AND NOT leida`, [sep.id])).n, 0);
  });
});
