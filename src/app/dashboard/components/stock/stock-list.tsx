'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

type Cuh = {
  id: string;
  etapa: number;
  codigo_cuh: string;
  modelo: string;
  precio_cuh: number;
  partida: string;
  manzana: number;
  lote: number;
  ubicacion: string | null;
  area_lote: number | null;
  precio_promotor: number | null;
  lat?: number | null;
  lng?: number | null;
};

type Reserva = {
  id: string;
  cuh_id: string;
  cliente_id: string;
  promotor_id: string;
  estado: 'reservado' | 'separado' | string;
  created_at: string;
};

type Cliente = {
  id: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  full_phone: string | null;
};

type Profile = {
  id: string;
  first_name: string | null;
  second_name: string | null;
  last_name: string | null;
  second_last_name: string | null;
};

const RESERVED_STATES = ['reservado', 'separado'] as const;

export default function StockList() {
  const [data, setData] = useState<Cuh[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [promotores, setPromotores] = useState<Record<string, Profile>>({});
  const [q, setQ] = useState('');
  const [modelo, setModelo] = useState<string>('');

  useEffect(() => {
    const client = supabase as unknown as SupabaseClient;
    (async () => {
      // CUH
      const { data: cuhData } = await client.from('cuh').select('*');
      if (cuhData) setData(cuhData as Cuh[]);

      // Clientes
      const { data: cliData } = await client
        .from('clientes')
        .select('id,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,full_phone');
      if (cliData) setClients(cliData as Cliente[]);

      // Reservas
      const { data: resvData } = await client
        .from('reservas')
        .select('id,cuh_id,cliente_id,promotor_id,estado,created_at')
        .in('estado', ['reservado', 'separado']);
      if (resvData) setReservas(resvData as Reserva[]);

      // Promotores
      const ids = Array.from(new Set(resvData?.map((r: Reserva) => r.promotor_id) || []));
      if (ids.length > 0) {
        const { data: profData } = await client
          .from('profiles')
          .select('id,first_name,second_name,last_name,second_last_name')
          .in('id', ids);
        if (profData) {
          setPromotores(
            profData.reduce((acc: Record<string, Profile>, p: Profile) => ({ ...acc, [p.id]: p }), {} as Record<string, Profile>)
          );
        }
      }
    })();
  }, []);

  const modelos = useMemo(
    () => Array.from(new Set(data.map((d) => d.modelo))).sort(),
    [data]
  );

  const reservaByCuh = useMemo(() => {
    const m = new Map<string, Reserva>();
    for (const r of reservas) {
      if (RESERVED_STATES.includes(r.estado as any) && !m.has(r.cuh_id)) m.set(r.cuh_id, r);
    }
    return m;
  }, [reservas]);

  const rows = useMemo(() => {
    return data.filter((d) => {
      const text = `${d.codigo_cuh} ${d.modelo} ${d.partida} ${d.ubicacion || ''}`.toLowerCase();
      const okQ = !q || text.includes(q.toLowerCase());
      const okM = !modelo || d.modelo === modelo;
      return okQ && okM;
    });
  }, [data, q, modelo]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Buscar (código, modelo, partida, ubicación)…"
          className="h-10 w-full md:w-96 rounded-md border px-3"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-10 rounded-md border px-2"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
        >
          <option value="">Todos los modelos</option>
          {modelos.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-500 self-center">{rows.length} resultados</div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <Th>etapa</Th>
              <Th>codigo</Th>
              <Th>modelo</Th>
              <Th className="text-right">precio cuh</Th>
              <Th>partida</Th>
              <Th>MZ</Th>
              <Th>LT</Th>
              <Th>ubicación</Th>
              <Th className="text-right">área</Th>
              <Th className="text-right">promotor</Th>
              <Th>geo</Th>
              <Th>estado</Th>
              <Th>promotor</Th>
              <Th>cliente</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => {
              const res = reservaByCuh.get(r.id) || null;
              const promotorName = res ? formatProfileName(promotores[res.promotor_id]) : '';
              const clienteName = res
                ? formatClienteName(clients.find((c) => c.id === res.cliente_id) || null)
                : '';
              const sep = !!res;

              return (
                <tr key={r.codigo_cuh + i} className={sep ? 'bg-rose-50' : 'hover:bg-gray-50'}>
                  <Td>{r.etapa}</Td>
                  <Td className="font-mono">{r.codigo_cuh}</Td>
                  <Td>{r.modelo}</Td>
                  <Td className="text-right">{money(r.precio_cuh)}</Td>
                  <Td className="font-mono">{r.partida}</Td>
                  <Td>{r.manzana}</Td>
                  <Td>{r.lote}</Td>
                  <Td>{r.ubicacion || ''}</Td>
                  <Td className="text-right">{r.area_lote ?? ''}</Td>
                  <Td className="text-right">
                    {r.precio_promotor != null ? money(r.precio_promotor) : ''}
                  </Td>
                  <Td>{r.lat && r.lng ? '📍' : ''}</Td>
                  <Td>
                    {sep ? (
                      <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        RESERVADA
                      </span>
                    ) : (
                      ''
                    )}
                  </Td>
                  <Td>{promotorName}</Td>
                  <Td>{clienteName}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-2 py-2 ${className}`}>{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-2 ${className}`}>{children}</td>;
}

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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