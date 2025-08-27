'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { MapPin, Home, Ruler, BedDouble, Bath, Euro, Filter, RotateCcw, Search } from 'lucide-react';
import Nav from '@/components/Nav';
type PropertyType = 'casa' | 'terreno';

type Property = {
  id: string;
  title: string;
  type: PropertyType;
  region: string;
  city: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  cover: string;
  featured?: boolean;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

// Datos mock
const PROPERTIES: Property[] = [
  { id: 'mad-h1', title: 'PASTRANA', type: 'casa', region: 'Comunidad de Madrid', city: 'Madrid', price: 495000, area: 82, bedrooms: 2, bathrooms: 2, cover: '/images/slider-5.jpg', featured: true },
  { id: 'cat-t1', title: 'Valdeluz', type: 'terreno', region: 'Cataluña', city: 'Barcelona', price: 210000, area: 420, cover: '/images/slider-5.jpg' },
];

const REGIONES = Array.from(new Set(PROPERTIES.map((p) => p.region))).sort();
const TIPOS: { label: string; value: PropertyType | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Casas', value: 'casa' },
  { label: 'Terrenos', value: 'terreno' },
];

export default function GalleryClient() {
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState<PropertyType | 'todos'>('todos');
  const [region, setRegion] = useState<string>('todas');
  const [min, setMin] = useState<string>('');
  const [max, setMax] = useState<string>('');

  const reset = () => {
    setQ('');
    setTipo('todos');
    setRegion('todas');
    setMin('');
    setMax('');
  };

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    const minN = Number(min) || 0;
    const maxN = Number(max) || Number.MAX_SAFE_INTEGER;

    return [...PROPERTIES]
      .filter((p) => (tipo === 'todos' ? true : p.type === tipo))
      .filter((p) => (region === 'todas' ? true : p.region === region))
      .filter((p) => p.price >= minN && p.price <= maxN)
      .filter((p) =>
        qn ? `${p.title} ${p.city} ${p.region} ${p.type}`.toLowerCase().includes(qn) : true,
      )
      .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || a.price - b.price);
  }, [q, tipo, region, min, max]);

  return (
    <>
      {/* FILTROS */}
      <Nav />

      {/* GRID */}
      <section className="mx-auto max-w-[1200px] px-5 py-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-700 shadow">
            No encontramos resultados con esos filtros. Ajusta los criterios o{' '}
            <Link href="/contacto" className="font-semibold text-[#0E08C9] hover:underline">
              cuéntanos qué buscas
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-[2px]"
              >
                <div className="relative h-48 w-full md:h-56">
                  <Image src={p.cover} alt={p.title} fill className="object-cover" sizes="(min-width:1024px) 33vw,(min-width:640px) 50vw, 100vw" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-[#0E08C9] ring-1 ring-white">
                      {p.type === 'casa' ? 'CASA' : 'TERRENO'}
                    </span>
                    {p.featured && (
                      <span className="rounded-full bg-[#0E08C9] px-3 py-1 text-[11px] font-bold text-white">
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[12px] font-extrabold text-[#0b1324] shadow">
                    {formatCurrency(p.price)}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b1324]/70 to-transparent px-4 py-3 text-white">
                    <div className="flex items-center gap-1 text-[12px]">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.city} · {p.region}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 font-extrabold text-[#0b1324]">{p.title}</h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Ruler className="h-4 w-4 text-[#0E08C9]" />
                      {p.area.toLocaleString('es-ES')} m²
                    </span>

                    {p.type === 'casa' && (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-4 w-4 text-[#0E08C9]" />
                          {p.bedrooms} hab.
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Bath className="h-4 w-4 text-[#0E08C9]" />
                          {p.bathrooms} baños
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      href="#"
                      className="inline-flex items-center gap-2 rounded-full bg-[#0E08C9] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0d07b5]"
                    >
                      {p.type === 'casa' ? <Home className="h-4 w-4" /> : <Ruler className="h-4 w-4" />}
                      Ver detalle
                    </Link>
                    <Link href="/contacto" className="text-sm font-semibold text-[#0E08C9] hover:underline">
                      Contactar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* NOTA LEGAL */}
      <section className="mx-auto max-w-[1200px] px-5 pb-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-600 shadow">
          Los precios indicados son orientativos y pueden variar sin previo aviso. Superficies aproximadas.
          Las imágenes pueden incluir elementos no incluidos en el precio. Para disponibilidad actualizada, contáctanos.
        </div>
      </section>
    </>
  );
}
