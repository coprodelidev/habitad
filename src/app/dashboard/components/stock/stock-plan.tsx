'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCountdown } from '@/hooks/useCountDown';

type Cuh = {
  id: string;
  etapa: number;
  codigo_cuh: string;
  modelo: string;
  precio_cuh: number;
  partida: string;
  manzana: number;
  lote: number;
  tipo: 0 | 1; // 1 Casa, 0 Terreno
  ubicacion: string | null;
  area_lote: number | null;
  precio_promotor: number | null;
  lat?: number | null;
  lng?: number | null;
};

type Cliente = {
  id: string;
  country_code: string;
  phone_number: string;
  email: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  full_phone: string | null;
  created_at: string;
  tipo: 'cliente' | 'interesado' | string;
};

type Reserva = {
  id: string;
  cuh_id: string;
  cliente_id: string;
  promotor_id: string;
  estado: 'reservado' | 'separado' | string;
  required_amount?: number | null;
  expires_at?: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  second_name: string | null;
  last_name: string | null;
  second_last_name: string | null;
};

type EtapaGroup = { etapa: number; manzanas: ManzanaGroup[] };
type ManzanaGroup = { manzana: number; rows: Cuh[] };

const RESERVED_STATES = ['reservado', 'separado'] as const;

function CountdownLabel({ expires_at }: { expires_at: string }) {
  const { label } = useCountdown(expires_at);
  return <span className="rounded bg-white/90 px-2 py-0.5 text-[14px] font-medium text-amber-800 shadow">expira en {label}</span>;
}

export default function StockPlan() {
  const client = supabase as unknown as SupabaseClient;

  const [data, setData] = useState<Cuh[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [promotores, setPromotores] = useState<Record<string, Profile>>({});
  const [promotorId, setPromotorId] = useState<string | null>(null);

  const [selected, setSelected] = useState<Cuh | null>(null);
  const [search, setSearch] = useState('');
  const [ubicacionFilter, setUbicacionFilter] = useState<'todas' | 'esquina' | 'interior'>('todas');
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        try {
          const res: any = await (client.auth as any).getUser?.();
          if (res?.data?.user?.id) setPromotorId(res.data.user.id as string);
        } catch {
          const res: any = await (client.auth as any).getSession?.();
          const id = res?.data?.session?.user?.id ?? null;
          if (id) setPromotorId(id as string);
        }

        const { data: cuhData } = await client.from('cuh').select('*');
        if (cuhData) setData((cuhData as Cuh[]));

        const { data: cliData } = await client
          .from('clientes')
          .select('id,country_code,phone_number,email,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,full_phone,created_at,tipo');
        if (cliData) setClients(cliData as Cliente[]);

        const { data: resvData } = await client
          .from('reservas')
          .select('id,cuh_id,cliente_id,promotor_id,estado,required_amount,expires_at,created_at')
          .in('estado', ['reservado', 'separado'])
          .order('created_at', { ascending: false });
        if (resvData) setReservas(resvData as Reserva[]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [client]);

  useEffect(() => {
    if (!promotorId || promotores[promotorId]) return;
    (async () => {
      const { data: prof } = await client
        .from('profiles')
        .select('id,first_name,second_name,last_name,second_last_name')
        .eq('id', promotorId)
        .maybeSingle();
      if (prof) setPromotores((prev) => ({ ...prev, [prof.id]: prof as Profile }));
    })();
  }, [client, promotorId, promotores]);

  useEffect(() => {
    (async () => {
      const ids = Array.from(new Set(reservas.map((r) => r.promotor_id)));
      const faltantes = ids.filter((id) => !promotores[id]);
      if (faltantes.length === 0) return;
      const { data: profs } = await client
        .from('profiles')
        .select('id,first_name,second_name,last_name,second_last_name')
        .in('id', faltantes);
      if (profs) {
        setPromotores((prev) => {
          const next = { ...prev };
          for (const p of profs as Profile[]) next[p.id] = p;
          return next;
        });
      }
    })();
  }, [client, reservas, promotores]);

  const reservaByCuh = useMemo(() => {
    const m = new Map<string, Reserva>();
    for (const r of reservas) {
      if (RESERVED_STATES.includes(r.estado as any) && !m.has(r.cuh_id)) m.set(r.cuh_id, r);
    }
    return m;
  }, [reservas]);

  const filteredLots = useMemo(() => {
    const q = normalize(search);
    return data.filter((r) => {
      const corner = isCorner(r);
      if (ubicacionFilter === 'esquina' && !corner) return false;
      if (ubicacionFilter === 'interior' && corner) return false;
      if (!q) return true;
      const text = normalize([r.codigo_cuh, r.modelo, r.partida, r.ubicacion || ''].join(' '));
      return text.includes(q);
    });
  }, [data, ubicacionFilter, search]);

  const gruposFiltrados = useMemo<EtapaGroup[]>(() => {
    const byEtapa = new Map<number, Cuh[]>();
    for (const r of filteredLots) {
      const arr = byEtapa.get(r.etapa) ?? [];
      arr.push(r);
      byEtapa.set(r.etapa, arr);
    }
    const result: EtapaGroup[] = [];
    for (const [etapa, rows] of Array.from(byEtapa.entries()).sort((a, b) => a[0] - b[0])) {
      const byMZ = new Map<number, Cuh[]>();
      for (const r of rows) {
        const arr = byMZ.get(r.manzana) ?? [];
        arr.push(r);
        byMZ.set(r.manzana, arr);
      }
      const manzanas: ManzanaGroup[] = Array.from(byMZ.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([manzana, mzRows]) => ({
          manzana,
          rows: [...mzRows].sort((a, b) => a.lote - b.lote),
        }));
      result.push({ etapa, manzanas });
    }
    return result;
  }, [filteredLots]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4500);
    return () => clearTimeout(t);
  }, [flash]);

  return (
    <div className="space-y-5 ">
      {flash && (
        <div className="fixed right-4 top-4 z-[60] max-w-md rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow">
          {flash}
        </div>
      )}

      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plano</h1>
        <div className="text-sm text-gray-600">{filteredLots.length} resultados</div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3 ">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm md:w-96"
          placeholder="Buscar (código, modelo, partida, ubicación)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Ubicación</label>
          <select
            value={ubicacionFilter}
            onChange={(e) => setUbicacionFilter(e.target.value as any)}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="todas">Todas</option>
            <option value="esquina">Esquina</option>
            <option value="interior">Interior</option>
          </select>
        </div>
        <button
          onClick={() => {
            setSearch('');
            setUbicacionFilter('todas');
          }}
          className="ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Limpiar
        </button>
      </div>

      <div className="space-y-4  ">
        {gruposFiltrados.map((g) => (
          <section key={g.etapa} className="rounded-lg border bg-white shadow-sm">
            <div className="flex w-full items-center justify-between rounded-t-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                  {g.etapa}
                </span>
                <h2 className="text-sm font-semibold">Etapa {g.etapa}</h2>
              </div>
              <span className="text-xs text-gray-500">{g.manzanas.length} manzanas</span>
            </div>

            <div className="flex flex-col gap-4 p-4 ">
              {g.manzanas.map((mz) => (
                <ManzanaBlock
                  key={`${g.etapa}-${mz.manzana}`}
                  grupo={mz}
                  reservaByCuh={reservaByCuh}
                  promotores={promotores}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <FichaModal
          imgSrc="/images/slider2.jpg"
          cuh={selected}
          clients={clients}
          isSeparada={!!reservaByCuh.get(selected.id)}
          reservaActual={reservaByCuh.get(selected.id) ?? null}
          promotorReserva={
            reservaByCuh.get(selected.id)
              ? promotores[reservaByCuh.get(selected.id)!.promotor_id] ?? null
              : null
          }
          promotorId={promotorId}
          onReservada={(r, lot, cli) => {
            setReservas((prev) => [r, ...prev]);
            const pName = formatProfileName(promotores[r.promotor_id] || null);
            const cName = formatClienteName(cli);
            setFlash(`El promotor ${pName} ha separado la propiedad ${lot.codigo_cuh} para el cliente ${cName}.`);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ManzanaBlock({
  grupo,
  reservaByCuh,
  promotores,
  onSelect,
}: {
  grupo: ManzanaGroup;
  reservaByCuh: Map<string, Reserva>;
  promotores: Record<string, Profile>;
  onSelect: (r: Cuh) => void;
}) {
  const { manzana, rows } = grupo;
  const colsPerRow = 2;
  const tile = 280;

  return (
    <div className="rounded-lg border p-3 ">
      <div className="mb-2 flex items-center justify-between ">
        <div className="text-sm font-semibold">Manzana {manzana}</div>
        <div className="text-xs text-gray-500 ">{rows.length} lotes</div>
      </div>
  
      <div className="flex flex-col gap-2 ">
        {rows.reduce((acc: Cuh[][], r, index) => {
          const rowIndex = Math.floor(index / colsPerRow);
          if (!acc[rowIndex]) acc[rowIndex] = [];
          acc[rowIndex].push(r);
          return acc;
        }, []).map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 ">
            {row.map((r) => {
              const res = reservaByCuh.get(r.id);
              const isReservada = res?.estado === 'reservado';
              const isSeparada = res?.estado === 'separado';
              const promotorName = res ? formatProfileName(promotores[res.promotor_id]) : null;
  
              return (
                <button
                  key={`${r.etapa}-${r.manzana}-${r.lote}-${r.codigo_cuh}`}
                  onClick={() => onSelect(r)}
                  className={[
                    'group relative flex flex-col overflow-hidden rounded-xl border p-2 text-left shadow-sm transition',
                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                    'bg-gray-100',
                  ].join(' ')}
                  title={`ET ${r.etapa} · MZ ${r.manzana} · LT ${r.lote} · ${r.modelo}`}
                  style={{ minWidth: `${tile}px`, minHeight: `${tile}px`, margin: '20px' }}
                >
                  <div className="flex items-start justify-between gap-2 ">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs">{r.codigo_cuh}</div>
                      <div className="truncate text-[11px] text-gray-600">{r.modelo}</div>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-700 text-xs font-bold">
                      {r.lote}
                    </div>
                  </div>
  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium">
                      {r.tipo === 1 ? 'Casa' : 'Terreno'}
                    </span>
                    <div className="text-sm font-semibold tabular-nums">
                      {money(r.precio_cuh)}
                    </div>
                  </div>
  
                  {res && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-end justify-between p-1">
                      {isSeparada ? (
                        <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                          RESERVADA
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-1 mt-14">
                          <span className="rounded bg-amber-600 px-2 py-0.5 text-[16px] font-semibold text-white shadow">
                            RESERVADA
                          </span>
                          <CountdownLabel expires_at={res.expires_at!} />
                        </div>
                      )}
                      {promotorName && (
                        <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-800 shadow">
                          por {promotorName}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function FichaModal({
  imgSrc,
  cuh,
  clients,
  isSeparada,
  reservaActual,
  promotorReserva,
  promotorId,
  onReservada,
  onClose,
}: {
  imgSrc: string;
  cuh: Cuh;
  clients: Cliente[];
  isSeparada: boolean;
  reservaActual: Reserva | null;
  promotorReserva: Profile | null;
  promotorId: string | null;
  onReservada: (r: Reserva, lot: Cuh, cli: Cliente) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'details' | 'select'>('details');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = digitsOnly(search);
    return clients.filter((c) => {
      const matchApellido = q.length > 0 && c.primer_apellido.toLowerCase().includes(q);
      const phoneVariants = [
        c.full_phone ?? '',
        `${c.country_code ?? ''}${c.phone_number ?? ''}`,
        `${c.country_code ?? ''} ${c.phone_number ?? ''}`,
        c.phone_number ?? '',
      ];
      const matchPhone = qDigits.length >= 3 && phoneVariants.some((p) => digitsOnly(p).includes(qDigits));
      return matchApellido || matchPhone;
    });
  }, [clients, search]);

  async function handleReservar() {
    if (!selectedClient) return;
    if (!promotorId) {
      alert('No se detectó sesión. Inicia sesión nuevamente.');
      return;
    }
    setBusy(true);

    try {
      const { data: existentes, error: errCheck } = await supabase
        .from('reservas')
        .select('id,estado')
        .eq('cuh_id', cuh.id)
        .in('estado', ['reservado', 'separado']);

      if (errCheck) throw errCheck;
      if (existentes && existentes.length > 0) {
        alert('Esta propiedad ya fue separada.');
        return;
      }

      const required_amount = cuh.tipo === 1 ? 1000 : 500;
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        promotor_id: promotorId,
        cliente_id: selectedClient.id,
        cuh_id: cuh.id,
        estado: 'reservado' as const,
        required_amount,
        expires_at,
      };

      const { data: inserted, error } = await (supabase.from('reservas') as any)
        .insert(payload)
        .select('id,cuh_id,cliente_id,promotor_id,estado,required_amount,expires_at,created_at')
        .single();

      if (error) throw error;

      onReservada(inserted as Reserva, cuh, selectedClient);
      onClose();
    } catch (e: any) {
      console.error(e);
      alert('No se pudo reservar. Reintenta.');
    } finally {
      setBusy(false);
    }
  }

  const nombrePromotor = promotorReserva ? formatProfileName(promotorReserva) : 'Promotor desconocido';
  const montoReserva = cuh.tipo === 1 ? 1000 : 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-[360px,1fr]">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
            <Image src={imgSrc} alt="Propiedad" fill className="object-cover" priority />
          </div>

          <div className="flex max-h-[80vh] min-h-[460px] flex-col overflow-y-auto p-4 ">
            {mode === 'details' ? (
              <>
                <div className="mb-1 text-xs text-gray-500">Etapa {cuh.etapa}</div>
                <h3 className="text-lg font-semibold">
                  {cuh.codigo_cuh} · {cuh.modelo}
                </h3>
                <div className="mt-1 text-sm text-gray-700">
                  MZ {cuh.manzana} · LT {cuh.lote} · <span className="font-medium">{labelUbicacion(cuh)}</span>
                </div>
                <div className="mt-3 text-xl font-bold">{money(cuh.precio_cuh)}</div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Info label="Partida" value={cuh.partida} mono />
                  <Info label="Área (m²)" value={cuh.area_lote ?? ''} />
                  <Info label="Tipo" value={cuh.tipo === 1 ? 'Casa' : 'Terreno'} />
                  <Info label="Monto de reserva" value={`$ ${montoReserva.toLocaleString()}`} />
                </div>

                {isSeparada && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    Ya RESERVADA por <span className="font-semibold">{nombrePromotor}</span>.
                  </div>
                )}

                <div className="mt-auto flex items-center justify-end gap-2 pt-5">
                  <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
                    Cerrar
                  </button>
                  <button
                    onClick={() => setMode('select')}
                    disabled={isSeparada}
                    className={[
                      'rounded-md px-4 py-2 text-sm font-semibold text-white',
                      isSeparada ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700',
                    ].join(' ')}
                  >
                    RESERVAR
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">Buscar / Seleccionar Cliente</h3>
                <p className="text-xs text-gray-500">
                  Busca por <b>teléfono</b> o <b>primer apellido</b>.
                </p>

                <input
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Teléfono o primer apellido…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border">
                  {filtered.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Sin resultados.</div>
                  ) : (
                    filtered.map((c) => {
                      const isSelected = selectedClient?.id === c.id;
                      const phonePretty = c.full_phone ?? `${c.country_code ?? ''} ${c.phone_number ?? ''}`.trim();
                      return (
                        <div
                          key={c.id}
                          className={[
                            'flex items-center justify-between border-b p-2 text-sm last:border-b-0',
                            isSelected ? 'bg-blue-50' : '',
                          ].join(' ')}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {c.primer_nombre} {c.primer_apellido}
                            </div>
                            <div className="truncate text-xs text-gray-600">
                              {phonePretty} · {c.email}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedClient(c)}
                            className={[
                              'rounded px-3 py-1 text-sm font-semibold',
                              isSelected ? 'bg-green-700 text-white' : 'bg-green-600 text-white hover:bg-green-700',
                            ].join(' ')}
                          >
                            {isSelected ? 'Seleccionado' : 'Seleccionar'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedClient && (
                  <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-sm">
                    <h4 className="font-semibold">Información del cliente seleccionado</h4>
                    <div className="mt-2 space-y-1">
                      <p><strong>Nombre completo:</strong> {selectedClient.primer_nombre} {selectedClient.segundo_nombre} {selectedClient.primer_apellido} {selectedClient.segundo_apellido}</p>
                      <p><strong>Teléfono:</strong> {selectedClient.full_phone ?? `${selectedClient.country_code} ${selectedClient.phone_number}`}</p>
                      <p><strong>Email:</strong> {selectedClient.email}</p>
                      <p><strong>Tipo:</strong> {selectedClient.tipo}</p>
                      <p><strong>Creado:</strong> {new Date(selectedClient.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <button onClick={() => setMode('details')} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
                    Volver
                  </button>
                  <button
                    onClick={handleReservar}
                    disabled={!selectedClient || busy || isSeparada}
                    className={[
                      'rounded-md px-4 py-2 text-sm font-semibold text-white',
                      !selectedClient || busy || isSeparada ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700',
                    ].join(' ')}
                  >
                    {busy ? 'Reservando…' : 'Reservar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={['mt-0.5 text-sm', mono ? 'font-mono' : ''].join(' ')}>{value}</div>
    </div>
  );
}
function isCorner(r: Cuh): boolean {
  return (r.ubicacion ?? '').toUpperCase().includes('ESQUINA');
}
function labelUbicacion(r: Cuh): string {
  const u = (r.ubicacion || '').trim();
  if (u) return u;
  return isCorner(r) ? 'Esquina' : 'Interior';
}
function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function digitsOnly(s: string) {
  return (s || '').replace(/\D+/g, '');
}
function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
function formatProfileName(p?: Profile | null) {
  if (!p) return '';
  const parts = [p.first_name, p.second_name, p.last_name, p.second_last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : '';
}
function formatClienteName(c?: Cliente | null) {
  if (!c) return '';
  const parts = [c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean);
  return parts.length ? parts.join(' ') : '';
}