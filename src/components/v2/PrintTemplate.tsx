'use client';

import { useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';

export interface PlantillaConfig {
  version?: number;
  cabecera?: string;
  pie?: string;
  logo_url?: string;
  clausulas?: string[];
}

export function usePlantilla(clave: 'plantilla_contrato' | 'plantilla_separacion'): PlantillaConfig {
  const [p, setP] = useState<PlantillaConfig>({ cabecera: 'COPRODELI' });
  useEffect(() => {
    let active = true;
    supabaseV2
      .from('parametros')
      .select('valor')
      .eq('clave', clave)
      .maybeSingle()
      .then((res: any) => {
        if (active && res?.data?.valor) setP(res.data.valor as PlantillaConfig);
      });
    return () => { active = false; };
  }, [clave]);
  return p;
}

export function PrintHeader({ plantilla }: { plantilla: PlantillaConfig }) {
  return (
    <header className="mb-6 flex items-center gap-4 border-b-2 border-slate-700 pb-3">
      {plantilla.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={plantilla.logo_url} alt="logo" className="h-14 w-auto" />
      )}
      <h1 className="text-xl font-bold tracking-wide text-slate-900">
        {plantilla.cabecera ?? 'COPRODELI'}
      </h1>
    </header>
  );
}

export function PrintFooter({ plantilla }: { plantilla: PlantillaConfig }) {
  if (!plantilla.pie) return null;
  return (
    <footer className="mt-10 border-t border-slate-300 pt-3 text-xs text-slate-600 whitespace-pre-line">
      {plantilla.pie}
    </footer>
  );
}

export function PrintClausulas({ plantilla }: { plantilla: PlantillaConfig }) {
  if (!plantilla.clausulas || plantilla.clausulas.length === 0) return null;
  return (
    <section className="mt-6 space-y-2 text-[13px] text-justify text-slate-800">
      <h3 className="text-sm font-semibold text-slate-900">Cláusulas adicionales</h3>
      <ol className="ml-5 list-decimal space-y-2">
        {plantilla.clausulas.map((c, i) => (
          <li key={i} className="leading-relaxed">{c}</li>
        ))}
      </ol>
    </section>
  );
}
