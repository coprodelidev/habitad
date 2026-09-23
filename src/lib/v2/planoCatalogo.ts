import fuente from './data/articulos-san-fernando.json';
import type { Etapa, Propiedad } from './types';

export type TipoPlano = 'casa' | 'terreno';
export type EstadoPlano = Propiedad['estado_fisico'] | 'sin_ficha' | 'revisar';
export interface UnidadPlano {
  codigo: string;
  etapa: string;
  etapaNombre: string;
  manzana: string;
  lote: string;
  modelo: string;
  tipo: TipoPlano;
  tipoOriginal: string;
  estado: EstadoPlano;
  propiedad: Propiedad | null;
}

export const FUENTE_PLANO = fuente.fuente;
export const ARTICULOS_SF = fuente.articulos as [string, number, string, string][];

function normalizarCodigo(value: string | null | undefined): string | null {
  const match = value?.trim().toUpperCase().match(/^SF-([0-9]+)_([0-9]+)$/);
  return match ? `SF-${Number(match[1])}_${Number(match[2])}` : null;
}

// El código SAP explícito tiene prioridad sobre Mz/Lt; CUH C001 no es un código SAP.
export function codigoUbicacionSF(p: Pick<Propiedad, 'ubicacion' | 'cuh' | 'manzana' | 'lote'>): string | null {
  const explicit = normalizarCodigo(p.ubicacion) ?? normalizarCodigo(p.cuh);
  if (explicit) return explicit;
  // No asociar otro proyecto a San Fernando solo porque comparte manzana/lote.
  if (/^[A-Z]+[-_][0-9]/i.test(p.ubicacion?.trim() ?? '')) return null;
  const mz = p.manzana?.trim();
  const lt = p.lote?.trim();
  if (!mz || !lt || !/^\d+$/.test(mz) || !/^\d+$/.test(lt)) return null;
  return `SF-${Number(mz)}_${Number(lt)}`;
}

export function construirPlano(propiedades: Propiedad[], etapas: Etapa[]) {
  const porCodigo = new Map<string, Propiedad[]>();
  for (const p of propiedades) {
    const codigo = codigoUbicacionSF(p);
    if (codigo) porCodigo.set(codigo, [...(porCodigo.get(codigo) ?? []), p]);
  }
  const vinculadas = new Set<string>();
  const etapasPorCodigo = new Map(etapas.map((e) => [e.codigo, e]));
  const unidades: UnidadPlano[] = ARTICULOS_SF.map(([codigo, etapa, modeloOriginal, tipoOriginal]) => {
    const [, manzana, lote] = codigo.match(/^SF-(\d+)_(\d+)$/)!;
    const coincidencias = porCodigo.get(codigo) ?? [];
    const original = coincidencias.length === 1 ? coincidencias[0] : null;
    if (original) vinculadas.add(original.id);
    // EMAPICA-ACACIA se clasifica como casa ACACIA por indicación del usuario.
    const tipo: TipoPlano = tipoOriginal === 'TERRENO' ? 'terreno' : 'casa';
    const modelo = modeloOriginal === 'EMAPICA-ACACIA' ? 'ACACIA' : modeloOriginal;
    const etapaDb = etapasPorCodigo.get(String(etapa));
    const propiedad: Propiedad | null = original ? {
      ...original, modelo, manzana, lote,
      tipo,
      etapa_id: etapaDb?.id ?? original.etapa_id,
      adicionales: { ...original.adicionales, tipo_articulo_sf: tipoOriginal },
    } : null;
    return { codigo, etapa: String(etapa), etapaNombre: `Etapa ${etapa}`, manzana, lote, modelo, tipo, tipoOriginal,
      estado: coincidencias.length > 1 ? 'revisar' : propiedad?.estado_fisico ?? 'sin_ficha', propiedad };
  });
  unidades.sort((a, b) => Number(a.etapa) - Number(b.etapa) || Number(a.manzana) - Number(b.manzana) || Number(a.lote) - Number(b.lote));
  return { unidades, sinVincular: propiedades.filter((p) => !vinculadas.has(p.id)) };
}

// Evita el límite de respuesta de Supabase. No se presenta un inventario parcial si falla una página.
export async function cargarTodasLasFilas<T>(
  consultar: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await consultar(from, from + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error('No se pudo obtener una página del inventario.');
    rows.push(...result.data);
    if (result.data.length < pageSize) return rows;
  }
}

export type EstadoOperativo = 'libre' | 'separado' | 'ocupado';
export type UnidadOperativa = Omit<UnidadPlano, 'estado' | 'propiedad'> & {
  estado: EstadoOperativo;
  propiedad: Propiedad;
};

// El inventario y la disponibilidad provienen del sistema; el Excel solo corrige datos descriptivos.
export function construirPlanoOperativo(propiedades: Propiedad[], etapas: Etapa[]): UnidadOperativa[] {
  const referencias = new Map(ARTICULOS_SF.map((fila) => [fila[0], fila]));
  const etapasPorCodigo = new Map(etapas.map((e) => [e.codigo, e]));
  const porEtapa = new Map(etapas.map((e) => [e.id, e]));
  return propiedades.flatMap((original): UnidadOperativa[] => {
    const estado = original.estado_fisico;
    if (estado !== 'libre' && estado !== 'separado' && estado !== 'ocupado') return [];
    const codigo = codigoUbicacionSF(original);
    const referencia = codigo ? referencias.get(codigo) : undefined;
    if (referencia) {
      const [codigo, numeroEtapa, modeloOriginal, tipoOriginal] = referencia;
      const [, manzana, lote] = codigo.match(/^SF-(\d+)_(\d+)$/)!;
      const tipo: TipoPlano = tipoOriginal === 'TERRENO' ? 'terreno' : 'casa';
      const modelo = modeloOriginal === 'EMAPICA-ACACIA' ? 'ACACIA' : modeloOriginal;
      const etapa = String(numeroEtapa);
      const propiedad = { ...original, manzana, lote, tipo, modelo,
        etapa_id: etapasPorCodigo.get(etapa)?.id ?? original.etapa_id };
      return [{ codigo, etapa, etapaNombre: 'Etapa ' + etapa, manzana, lote, modelo,
        tipo, tipoOriginal, estado, propiedad }];
    }
    // Una ficha sin coincidencia o con codigo repetido conserva su identidad y operacion.
    const etapa = porEtapa.get(original.etapa_id ?? '');
    return [{ codigo: codigoUbicacionSF(original) ?? original.cuh,
      etapa: etapa && Number(etapa.codigo) >= 1 && Number(etapa.codigo) <= 21 ? etapa.codigo : '', etapaNombre: etapa && Number(etapa.codigo) >= 1 && Number(etapa.codigo) <= 21 ? etapa.nombre : '',
      manzana: original.manzana ?? '', lote: original.lote ?? '',
      modelo: original.modelo ?? '', tipo: original.tipo, tipoOriginal: original.tipo,
      estado, propiedad: original }];
  }).sort((a, b) => a.etapa.localeCompare(b.etapa, undefined, { numeric: true })
    || a.manzana.localeCompare(b.manzana, undefined, { numeric: true })
    || a.lote.localeCompare(b.lote, undefined, { numeric: true })
    || a.propiedad.id.localeCompare(b.propiedad.id));
}
