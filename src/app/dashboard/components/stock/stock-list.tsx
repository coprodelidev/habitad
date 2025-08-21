'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

type Reserva = {
  id: string;
  cuh_id: string;
  cliente_id: string;
  promotor_id: string;
  estado: 'reservado' | 'separado' | string;
  required_amount: number | null;
  expires_at: string | null;
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

type SortKey =
  | 'etapa'
  | 'codigo_cuh'
  | 'modelo'
  | 'tipo'
  | 'precio_cuh'
  | 'partida'
  | 'manzana'
  | 'lote'
  | 'ubicacion'
  | 'area_lote'
  | 'precio_promotor';

export default function StockList() {
  const [data, setData] = useState<Cuh[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [promotores, setPromotores] = useState<Record<string, Profile>>({});
  const [q, setQ] = useState('');

  // sort state
  const [sortKey, setSortKey] = useState<SortKey>('codigo_cuh');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const client = supabase as unknown as SupabaseClient;
    (async () => {
      // CUH (incluye 'tipo')
      const { data: cuhData } = await client.from('cuh').select('*');
      if (cuhData) setData(cuhData as Cuh[]);

      // Clientes
      const { data: cliData } = await client
        .from('clientes')
        .select('id,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,full_phone');
      if (cliData) setClients(cliData as Cliente[]);

      // Reservas activas (vista/materializada)
      const { data: resvData } = await client
        .from('reservas_activas')
        .select('id,cuh_id,cliente_id,promotor_id,estado,required_amount,expires_at,created_at');
      if (resvData) setReservas(resvData as Reserva[]);

      // Promotores involucrados
      const ids = Array.from(new Set((resvData || []).map((r: Reserva) => r.promotor_id)));
      if (ids.length > 0) {
        const { data: profData } = await client
          .from('profiles')
          .select('id,first_name,second_name,last_name,second_last_name')
          .in('id', ids);
        if (profData) {
          setPromotores(
            (profData as Profile[]).reduce(
              (acc, p) => ({ ...acc, [p.id]: p }),
              {} as Record<string, Profile>
            )
          );
        }
      }
    })();
  }, []);

  const reservaByCuh = useMemo(() => {
    const m = new Map<string, Reserva>();
    for (const r of reservas) {
      if (RESERVED_STATES.includes(r.estado as any) && !m.has(r.cuh_id)) m.set(r.cuh_id, r);
    }
    return m;
  }, [reservas]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((d) => {
      const text = `${d.codigo_cuh} ${d.modelo} ${d.partida} ${d.ubicacion || ''}`.toLowerCase();
      return text.includes(term);
    });
  }, [data, q]);

  const rows = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      // num vs string
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * dir;
      }
      const ax = String(aVal ?? '').toLowerCase();
      const bx = String(bVal ?? '').toLowerCase();
      if (ax < bx) return -1 * dir;
      if (ax > bx) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  }

  const arrow = (k: SortKey) =>
    sortKey !== k ? '↕' : sortDir === 'asc' ? '▲' : '▼';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Buscar (código, modelo, partida, ubicación)…"
          className="h-10 w-full md:w-96 rounded-md border px-3"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="text-sm text-gray-500 self-center">{rows.length} resultados</div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <ThButton onClick={() => toggleSort('etapa')}>etapa {arrow('etapa')}</ThButton>
              <ThButton onClick={() => toggleSort('codigo_cuh')}>codigo {arrow('codigo_cuh')}</ThButton>
              <ThButton onClick={() => toggleSort('modelo')}>modelo {arrow('modelo')}</ThButton>
              <ThButton onClick={() => toggleSort('tipo')}>tipo {arrow('tipo')}</ThButton>
              <ThButton onClick={() => toggleSort('precio_cuh')} right>precio cuh {arrow('precio_cuh')}</ThButton>
              <ThButton onClick={() => toggleSort('partida')}>partida {arrow('partida')}</ThButton>
              <ThButton onClick={() => toggleSort('manzana')}>MZ {arrow('manzana')}</ThButton>
              <ThButton onClick={() => toggleSort('lote')}>LT {arrow('lote')}</ThButton>
              <ThButton onClick={() => toggleSort('ubicacion')}>ubicación {arrow('ubicacion')}</ThButton>
              <ThButton onClick={() => toggleSort('area_lote')} right>área {arrow('area_lote')}</ThButton>
              <Th>promotor</Th>
            
              <Th>estado</Th>
              <Th>promotor</Th>
              <Th>cliente</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => {
              const res = reservaByCuh.get(r.id) || null;
              const cliente = res ? clients.find((c) => c.id === res.cliente_id) || null : null;
              const promotor = res ? promotores[res.promotor_id] || null : null;
              return (
                <Row
                  key={r.codigo_cuh + i}
                  cuh={r}
                  reserva={res}
                  cliente={cliente}
                  promotor={promotor}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  cuh,
  reserva,
  cliente,
  promotor,
}: {
  cuh: Cuh;
  reserva: Reserva | null;
  cliente: Cliente | null;
  promotor: Profile | null;
}) {
  const promotorName = formatProfileName(promotor);
  const clienteName = formatClienteName(cliente);

  let estadoCell: React.ReactNode = '';
  let rowColor = '';
  if (reserva) {
    if (reserva.estado === 'reservado') {
      const { label } = useCountdown(reserva.expires_at);
      estadoCell = (
        <div className="flex flex-col items-start">
          <span className="rounded bg-amber-600 px-2 py-0.5 text-[14px] font-semibold text-white">
            RESERVADA
          </span>
          <span className="text-[14px] text-amber-800">
            {label}
          </span>
        </div>

      );
      rowColor = 'bg-amber-50';
    } else {
      estadoCell = (
        <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">RESERVADA</span>
      );
      rowColor = 'bg-rose-50';
    }
  }

  return (
    <tr className={rowColor || 'hover:bg-gray-50'}>
      <Td>{cuh.etapa}</Td>
      <Td className="font-mono">{cuh.codigo_cuh}</Td>
      <Td>{cuh.modelo}</Td>
      <Td>{cuh.tipo === 1 ? 'Casa' : 'Terreno'}</Td>
      <Td className="text-right">{money(cuh.precio_cuh)}</Td>
      <Td className="font-mono">{cuh.partida}</Td>
      <Td>{cuh.manzana}</Td>
      <Td>{cuh.lote}</Td>
      <Td>{cuh.ubicacion || ''}</Td>
      <Td className="text-right">{cuh.area_lote ?? ''}</Td>
      <Td className="text-right">{cuh.precio_promotor != null ? money(cuh.precio_promotor) : ''}</Td>
      <Td>{cuh.lat && cuh.lng ? '📍' : ''}</Td>
      <Td>{estadoCell}</Td>
      <Td>{promotorName}</Td>
      <Td>{clienteName}</Td>
    </tr>
  );
}

/* ===== mini UI ===== */
function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-2 py-2 ${right ? 'text-right' : ''}`}>{children}</th>;
}
function ThButton({
  children,
  onClick,
  right = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  right?: boolean;
}) {
  return (
    <th className={`px-2 py-2 ${right ? 'text-right' : ''}`}>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-gray-200"
        title="Ordenar"
      >
        {children}
      </button>
    </th>
  );
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
  return parts.length ? (parts as string[]).join(' ') : '';
}
function formatClienteName(c?: Cliente | null) {
  if (!c) return '';
  const parts = [c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean);
  return parts.length ? (parts as string[]).join(' ') : '';
}
