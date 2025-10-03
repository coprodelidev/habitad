'use client';

import React, { useEffect, useRef, useState } from 'react';
import Nav from '@/components/Nav';
import IcaSanFernandoDetail from '@/components/IcaSanFernandoDetail';

import CasasYLotesDetail from '@/components/CasasYLotesDetail';
import PiscoCondominioDetail from '@/components/PiscoCondominioDetail';
import IcaSanBernardoDetail from '@/components/IcaSanBernardoDetail';

/* ===================== UI Helper ===================== */
function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const base =
    'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors';
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? `${base} bg-[#0E08C9] text-white shadow`
          : `${base} bg-white text-[#0b1324] ring-1 ring-black/10 hover:bg-slate-50`
      }
    >
      {children}
    </button>
  );
}

/* ===================== Page ===================== */
type DetalleKey = 'icasf' | 'huarango' | 'entrega' | 'pisco' | 'bernardo';

export default function Page() {
  // primer activo: Ica San Fernando
  const [detalleKey, setDetalleKey] = useState<DetalleKey>('icasf');
  const detalleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (detalleRef.current) {
      detalleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [detalleKey]);

  return (
    <main className="pb-16">
      <Nav />

      {/* Chips superiores (sin 'Todos') */}
      <section className="px-4 pt-8 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-center text-3xl font-extrabold text-[#0b1324]">
            ¡Construimos comunidades!
          </h1>
          <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto pb-2">
            <Chip active={detalleKey === 'icasf'} onClick={() => setDetalleKey('icasf')}>
              Ica San Fernando Lotes y Viviendas
            </Chip>
            <Chip
              active={detalleKey === 'huarango'}
              onClick={() => setDetalleKey('huarango')}
            >
              Ica el Huarango Lotes 
            </Chip>
            <Chip
              active={detalleKey === 'entrega'}
              onClick={() => setDetalleKey('entrega')}
            >
              Casas y Lotes varios
            </Chip>
            <Chip active={detalleKey === 'pisco'} onClick={() => setDetalleKey('pisco')}>
              Pisco Condominio
            </Chip>
            <Chip
              active={detalleKey === 'bernardo'}
              onClick={() => setDetalleKey('bernardo')}
            >
              Ica San Bernardo
            </Chip>
          </div>
        </div>
      </section>

      {/* Detalle */}
      <section ref={detalleRef} className="px-4 pt-8 sm:px-6">
        {detalleKey === 'icasf' && <IcaSanFernandoDetail />}
     
        {detalleKey === 'entrega' && <CasasYLotesDetail />}
        {detalleKey === 'pisco' && <PiscoCondominioDetail />}
        {detalleKey === 'bernardo' && <IcaSanBernardoDetail />}
      </section>
    </main>
  );
}
