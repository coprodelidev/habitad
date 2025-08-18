// src/app/dashboard/components/stock/stock-list.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

type Cuh = {
  etapa: number; codigo_cuh: string; modelo: string; precio_cuh: number;
  partida: string; manzana: number; lote: number; ubicacion: string|null;
  area_lote: number|null; precio_promotor: number|null; lat?: number|null; lng?: number|null;
};

export default function StockList() {
  const [data, setData] = useState<Cuh[]>([]);
  const [q, setQ] = useState('');
  const [modelo, setModelo] = useState<string>('');

  useEffect(() => {
    const client = supabase as unknown as SupabaseClient;
    client
      .from('cuh')
      .select('*')
      .then(({ data, error }: { data: Cuh[] | null; error: any }) => { // 👈 tipado explícito
        if (!error && data) setData(data);
      });
  }, []);
  

  const modelos = useMemo(
    () => Array.from(new Set(data.map(d => d.modelo))).sort(),
    [data]
  );

  const rows = useMemo(() => {
    return data.filter(d => {
      const text = `${d.codigo_cuh} ${d.modelo} ${d.partida} ${d.ubicacion||''}`.toLowerCase();
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
          value={q} onChange={e=>setQ(e.target.value)}
        />
        <select className="h-10 rounded-md border px-2" value={modelo} onChange={e=>setModelo(e.target.value)}>
          <option value="">Todos los modelos</option>
          {modelos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="text-sm text-gray-500 self-center">{rows.length} resultados</div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <Th>etapa</Th><Th>codigo</Th><Th>modelo</Th><Th className="text-right">precio cuh</Th>
              <Th>partida</Th><Th>MZ</Th><Th>LT</Th><Th>ubicación</Th>
              <Th className="text-right">área</Th><Th className="text-right">promotor</Th><Th>geo</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r,i)=>(
              <tr key={r.codigo_cuh + i} className="hover:bg-gray-50">
                <Td>{r.etapa}</Td>
                <Td className="font-mono">{r.codigo_cuh}</Td>
                <Td>{r.modelo}</Td>
                <Td className="text-right">{money(r.precio_cuh)}</Td>
                <Td className="font-mono">{r.partida}</Td>
                <Td>{r.manzana}</Td>
                <Td>{r.lote}</Td>
                <Td>{r.ubicacion || ''}</Td>
                <Td className="text-right">{r.area_lote ?? ''}</Td>
                <Td className="text-right">{r.precio_promotor!=null?money(r.precio_promotor):''}</Td>
                <Td>{r.lat && r.lng ? '📍' : ''}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({children, className=''}:{children:React.ReactNode; className?:string}) {
  return <th className={`px-2 py-2 ${className}`}>{children}</th>;
}
function Td({children, className=''}:{children:React.ReactNode; className?:string}) {
  return <td className={`px-2 py-2 ${className}`}>{children}</td>;
}
function money(n:number){return n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
