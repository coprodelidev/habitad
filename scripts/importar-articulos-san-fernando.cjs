const fs = require('node:fs');
const crypto = require('node:crypto');
const X = require('../node_modules/xlsx');
const source = process.argv[2];
if (!source) throw new Error('Indique la ruta del Excel de artículos San Fernando.');
const workbook = X.readFile(source);
const sheet = workbook.Sheets['3804 ARTICULOS'];
if (!sheet) throw new Error('Falta la hoja 3804 ARTICULOS.');
const all = X.utils.sheet_to_json(sheet, { header: 1, defval: null });
if (JSON.stringify(all[0]) !== JSON.stringify(['COD UBICACIÓN','ETAPA','MODELO','TIPO'])) throw new Error('Encabezados inesperados.');
const rows = all.slice(1);
const codes = new Set();
for (const [code, stage, model, type] of rows) {
 if (!/^SF-[1-9][0-9]*_[1-9][0-9]*$/.test(code) || codes.has(code)) throw new Error('Código inválido o duplicado: ' + code);
 if (!Number.isInteger(stage) || stage < 1 || stage > 21) throw new Error('Etapa inválida: ' + code);
 if (!['ACACIA','SAUCE','TERRENO','EMAPICA-ACACIA'].includes(model) || !['CASA','TERRENO','EMAPICA-ACACIA'].includes(type)) throw new Error('Clasificación no reconocida: ' + code);
 if ((type === 'CASA' && !['ACACIA','SAUCE'].includes(model)) || (type !== 'CASA' && model !== type)) throw new Error('Tipo y modelo incompatibles: ' + code);
 codes.add(code);
}
if (rows.length !== 3804) throw new Error('Se esperaban 3804 artículos.');
const data = { fuente: 'DATOS DE ARTICULOS SAN FERNANDO.xlsx', hoja: '3804 ARTICULOS', rango: 'B3:E3806', sha256: crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'), columnas: all[0], articulos: rows };
const out = JSON.stringify(data, null, 2).replace(/\[\n\s+("SF-[\s\S]*?)\n\s+\]/g, (s) => s.replace(/\n\s*/g, ' '));
fs.writeFileSync('src/lib/v2/data/articulos-san-fernando.json', out + '\n');
console.log('Catálogo validado: ' + rows.length + ' ubicaciones únicas.');

const quote = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const values = data.articulos.map(([c,e,m,t]) => '(' + [quote(c),e,quote(m),quote(t)].join(',') + ')').join(',\n');
const seed = `INSERT INTO v2.catalogo_articulos_sf(codigo,etapa,modelo,tipo_original,fuente,fuente_sha256)\nSELECT codigo,etapa,modelo,tipo_original,${quote(data.fuente)},${quote(data.sha256)}\nFROM (VALUES\n${values}\n) AS datos(codigo,etapa,modelo,tipo_original)\nON CONFLICT (codigo) DO UPDATE SET etapa=EXCLUDED.etapa,modelo=EXCLUDED.modelo,tipo_original=EXCLUDED.tipo_original,fuente=EXCLUDED.fuente,fuente_sha256=EXCLUDED.fuente_sha256;`;
fs.writeFileSync('supabase/migrations/20260922_v2_catalogo_san_fernando.sql', fs.readFileSync('scripts/articulos-san-fernando.template.sql','utf8').replace('__CATALOGO__',seed));
console.log('Migración de catálogo generada.');
