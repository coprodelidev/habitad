import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const moduleUrl = new URL('../src/lib/v2/planoCatalogo.ts', import.meta.url);
const compiled = ts.transpileModule(await readFile(moduleUrl,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
const sandbox = { exports: {}, require: createRequire(moduleUrl) };
vm.runInNewContext(compiled.outputText, sandbox);
const { ARTICULOS_SF, codigoUbicacionSF, construirPlano, cargarTodasLasFilas } = sandbox.exports;
const propiedad = (patch = {}) => ({ id:'p1', cuh:'C001', ubicacion:'SF-1_3', manzana:'999', lote:'999', etapa_id:'old', tipo:'terreno', modelo:'ANTIGUO', precio_lista:12345, precio_venta:12000, moneda:'USD', estado_fisico:'ocupado', estado_comercial:'cuotas', adicionales:{esquina:true}, ...patch });

test('el catálogo conserva los 3804 registros, 21 etapas y los tipos/modelos exactos', () => {
  assert.equal(ARTICULOS_SF.length,3804);
  assert.equal(new Set(ARTICULOS_SF.map((r) => r[0])).size,3804);
  assert.equal(new Set(ARTICULOS_SF.map((r) => r[1])).size,21);
  for (const [tipo,total] of [['CASA',2862],['TERRENO',940],['EMAPICA-ACACIA',2]]) assert.equal(ARTICULOS_SF.filter((r) => r[3]===tipo).length,total);
  assert.equal(ARTICULOS_SF.filter((r) => r[2]==='SAUCE').length,296);
});
test('clasificación oficial y orden numérico preservan precio, estado e identidad', () => {
  const original=propiedad();
  const {unidades}=construirPlano([original],[{id:'etapa1',codigo:'1'}]);
  const first=unidades.find((r)=>r.codigo==='SF-1_3');
  assert.equal(first.propiedad.tipo,'casa'); assert.equal(first.modelo,'ACACIA');
  assert.equal(first.propiedad.etapa_id,'etapa1'); assert.equal(first.manzana,'1');
  for (const key of ['id','cuh','precio_lista','precio_venta','moneda','estado_fisico','estado_comercial']) assert.equal(first.propiedad[key],original[key]);
  assert.equal(original.tipo,'terreno'); assert.equal(first.propiedad.adicionales.esquina,true);
  assert.ok(unidades.findIndex((r)=>r.codigo==='SF-1_9')<unidades.findIndex((r)=>r.codigo==='SF-1_10'));
});
test('normaliza códigos; no cruza otros proyectos ni sustituye un código explícito', () => {
  assert.equal(codigoUbicacionSF(propiedad({ubicacion:' sf-001_003 '})),'SF-1_3');
  assert.equal(codigoUbicacionSF(propiedad({ubicacion:'ESQUINA',manzana:'01',lote:'03'})),'SF-1_3');
  assert.equal(codigoUbicacionSF(propiedad({ubicacion:'OTRO-1_3',manzana:'1',lote:'3'})),null);
  assert.equal(codigoUbicacionSF(propiedad({ubicacion:'SF-999_999',manzana:'1',lote:'3'})),'SF-999_999');
});
test('sin ficha y duplicados no inventan precio, disponibilidad ni una ficha para operar', () => {
  const result=construirPlano([propiedad(),propiedad({id:'p2'}),propiedad({id:'p3',ubicacion:'SF-999_999'})],[]);
  assert.equal(result.unidades.find((u)=>u.codigo==='SF-1_3').estado,'revisar');
  assert.equal(result.unidades.find((u)=>u.codigo==='SF-1_3').propiedad,null);
  assert.equal(result.unidades.find((u)=>u.codigo==='SF-1_4').estado,'sin_ficha');
  assert.equal(result.sinVincular.length,3);
  assert.equal(result.unidades.filter((u)=>u.tipo==='casa').length,2864);
  assert.equal(result.unidades.filter((u)=>u.tipo==='terreno').length,940);
  for (const code of ['SF-118_16','SF-118_17']) { const u=result.unidades.find((u)=>u.codigo===code); assert.equal(u.tipo,'casa'); assert.equal(u.modelo,'ACACIA'); }
});
test('carga más de 1000 fichas y rechaza resultados parciales ante errores', async () => {
  const original=Array.from({length:3804},(_,i)=>i);
  let requests=0;
  const all=await cargarTodasLasFilas(async (from,to)=>{requests++; return {data:original.slice(from,to+1),error:null};});
  assert.equal(all.length,3804); assert.equal(requests,8); assert.equal(all[3803],3803);
  await assert.rejects(cargarTodasLasFilas(async (from,to)=>from===0?{data:original.slice(from,to+1),error:null}:{data:null,error:{message:'fallo de red'}}), /fallo de red/);
});
test('migración: actualiza solo clasificación única, conserva importes y no crea fichas ficticias', async (t) => {
  const db=new PGlite(); t.after(()=>db.close());
  await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
    CREATE TABLE public.roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code text UNIQUE,label text,description text);
    CREATE TABLE public.profiles(id uuid PRIMARY KEY,role_id uuid,first_name text,last_name text,email text);`);
  await db.exec(await readFile(new URL('../supabase/migrations/20260411_v2_init.sql',import.meta.url),'utf8'));
  await db.exec(`CREATE FUNCTION v2.is_staff() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION v2.is_auditor() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    INSERT INTO v2.propiedades(cuh,ubicacion,manzana,lote,tipo,modelo,precio_lista,precio_venta,moneda,estado_fisico,estado_comercial)
    VALUES ('C001','SF-1_3','999','999','terreno','ANTIGUO',12345,12000,'USD','ocupado','cuotas'),
      ('DUP1','SF-1_4','1','4','terreno','ORIGINAL',999,999,'PEN','bloqueado','sin_venta'),
      ('DUP2','SF-1_4','1','4','terreno','ORIGINAL',999,999,'PEN','bloqueado','sin_venta'),
      ('OTRO','OTRO-1_5','1','5','terreno','ORIGINAL',999,999,'PEN','libre','sin_venta');`);
  const special=ARTICULOS_SF.find((r)=>r[3]==='EMAPICA-ACACIA');
  await db.query(`INSERT INTO v2.propiedades(cuh,ubicacion,tipo,modelo,precio_lista,moneda) VALUES ('ESPECIAL',$1,'terreno','ORIGINAL',100,'PEN')`,[special[0]]);
  const sql=await readFile(new URL('../supabase/migrations/20260922_v2_catalogo_san_fernando.sql',import.meta.url),'utf8');
  await db.exec(sql);
  const rows=(await db.query('SELECT p.*,e.codigo AS etapa FROM v2.propiedades p LEFT JOIN v2.etapas e ON e.id=p.etapa_id')).rows;
  assert.equal(rows.length,5);
  const updated=rows.find((p)=>p.cuh==='C001');
  assert.equal(updated.tipo,'casa'); assert.equal(updated.modelo,'ACACIA'); assert.equal(updated.etapa,'1');
  assert.equal(updated.manzana,'1'); assert.equal(updated.lote,'3');
  assert.equal(Number(updated.precio_lista),12345); assert.equal(Number(updated.precio_venta),12000);
  assert.equal(updated.moneda,'USD'); assert.equal(updated.estado_fisico,'ocupado'); assert.equal(updated.estado_comercial,'cuotas');
  for (const cuh of ['DUP1','DUP2','OTRO']) assert.equal(rows.find((p)=>p.cuh===cuh).modelo,'ORIGINAL');
  assert.equal(rows.find((p)=>p.cuh==='ESPECIAL').tipo,'casa');
  assert.equal(rows.find((p)=>p.cuh==='ESPECIAL').adicionales.tipo_articulo_sf,'EMAPICA-ACACIA');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM v2.catalogo_articulos_sf')).rows[0].n,3804);
  await db.exec(sql);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM v2.propiedades')).rows[0].n,5);
});

test('domicilio del cliente independiente del inmueble reservado', async () => {
  const url=new URL('../src/lib/v2/separacionForm.ts',import.meta.url);
  const output=ts.transpileModule(await readFile(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}});
  const context={exports:{}};
  vm.runInNewContext(output.outputText,context);
  for (const tipo of ['casa','terreno']) {
    const inmueble=propiedad({tipo,manzana:'118',lote:'16'});
    const form=context.exports.crearFormularioSeparacion(inmueble);
    assert.equal(form.direccion_mz,''); assert.equal(form.direccion_lt,'');
    const cliente=context.exports.datosClienteSeparacion({...form,direccion_mz:' A ',direccion_lt:' 7 ',nombres:' Ana ',apellido_paterno:' Perez '});
    assert.equal(cliente.direccion_mz,'A'); assert.equal(cliente.direccion_lt,'7');
    assert.equal(inmueble.manzana,'118'); assert.equal(inmueble.lote,'16');
    assert.equal(cliente.nombres,'Ana'); assert.equal(cliente.apellidos,'Perez');
  }
});

test('plano operativo conserva todas las propiedades libres, separadas y ocupadas sin crear cuadros del Excel', () => {
  const originales = [
    propiedad({id:'libre',estado_fisico:'libre',ubicacion:'SF-1_3'}),
    propiedad({id:'separada',estado_fisico:'separado',ubicacion:'SF-1_4'}),
    propiedad({id:'ocupada',estado_fisico:'ocupado',ubicacion:'SF-1_5'}),
    propiedad({id:'sin-coincidencia',estado_fisico:'ocupado',ubicacion:'SF-999_999'}),
    propiedad({id:'duplicada-a',estado_fisico:'libre',ubicacion:'SF-1_6'}),
    propiedad({id:'duplicada-b',estado_fisico:'separado',ubicacion:'SF-1_6'}),
    propiedad({id:'bloqueada',estado_fisico:'bloqueado',ubicacion:'SF-1_7'}),
  ];
  const antes=JSON.stringify(originales);
  const unidades=sandbox.exports.construirPlanoOperativo(originales,[{id:'etapa1',codigo:'1',nombre:'Etapa 1'}]);
  assert.equal(unidades.length,6);
  assert.equal(new Set(unidades.map(u=>u.propiedad.id)).size,6);
  for(const original of originales.filter(p=>p.estado_fisico!=='bloqueado')) {
    const unidad=unidades.find(u=>u.propiedad.id===original.id);
    assert.ok(unidad);
    assert.equal(unidad.estado,original.estado_fisico);
    for(const key of ['id','cuh','precio_lista','precio_venta','moneda','estado_fisico','estado_comercial']) assert.equal(unidad.propiedad[key],original[key]);
  }
  for(const estado of ['libre','separado','ocupado']) assert.equal(unidades.filter(u=>u.estado===estado).length,2);
  const corregida=unidades.find(u=>u.propiedad.id==='libre');
  assert.equal(corregida.manzana,'1'); assert.equal(corregida.lote,'3'); assert.equal(corregida.tipo,'casa');
  assert.equal(JSON.stringify(originales),antes);
  assert.equal(sandbox.exports.construirPlanoOperativo([],[]).length,0);
});

test('la etapa del Excel prevalece sobre etapa cero incluso en fichas con codigo repetido', () => {
  const filas=[propiedad({id:'a',ubicacion:'SF-1_3',etapa_id:'cero',estado_fisico:'libre'}),propiedad({id:'b',ubicacion:'SF-1_3',etapa_id:'cero',estado_fisico:'separado'})];
  const unidades=sandbox.exports.construirPlanoOperativo(filas,[{id:'cero',codigo:'0'},{id:'uno',codigo:'1'}]);
  assert.equal(unidades.length,2);
  for(const u of unidades) {
    assert.equal(u.etapa,'1');assert.equal(u.manzana,'1');assert.equal(u.lote,'3');assert.equal(u.propiedad.etapa_id,'uno');
    assert.equal(u.estado,filas.find(p=>p.id===u.propiedad.id).estado_fisico);
  }
  const sinReferencia=sandbox.exports.construirPlanoOperativo([propiedad({ubicacion:'SF-999_999',etapa_id:'cero'})],[{id:'cero',codigo:'0'}]);
  assert.equal(sinReferencia[0].etapa,'');
});

test('las 3804 ubicaciones toman etapa y coordenadas del Excel conservando estados y precios', () => {
 const estados=['libre','separado','ocupado'];
 const props=ARTICULOS_SF.map((r,i)=>propiedad({id:String(i),ubicacion:r[0],etapa_id:'cero',estado_fisico:estados[i%3]}));
 const etapas=[{id:'cero',codigo:'0',nombre:'Etapa 0'},...Array.from({length:21},(_,i)=>({id:'e'+(i+1),codigo:String(i+1),nombre:'Etapa '+(i+1)}))];
 const result=sandbox.exports.construirPlanoOperativo(props,etapas);
 assert.equal(result.length,3804);
 const byId=new Map(result.map(u=>[u.propiedad.id,u]));
 ARTICULOS_SF.forEach(([code,stage],i)=>{
  const u=byId.get(String(i));const parts=code.slice(3).split('_');
  assert.equal(u.etapa,String(stage));assert.equal(u.propiedad.etapa_id,'e'+stage);
  assert.equal(u.manzana,parts[0]);assert.equal(u.lote,parts[1]);
  assert.equal(u.estado,estados[i%3]);assert.equal(u.propiedad.precio_venta,12000);
 });
});
