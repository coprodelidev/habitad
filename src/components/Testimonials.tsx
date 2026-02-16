'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type TItem = {
  img: string;
  title: string;
  description?: string;
  features?: string[];
};

const defaultFeatures = [
  'Parques y amplias áreas verdes',
  'Pistas asfaltadas',
  'Colegio e iglesia en funcionamiento',
  'Próxima universidad',
  'Viviendas con construcción de calidad',
  'Financiamiento directo sin intereses',
];

const items: TItem[] = [
  {
    img: '/images/sanfernando.jpg',
    title: ' Ica San Fernando Lotes y Viviendas',
    description:
      'Urbanización con 3,000 viviendas de concreto armado (ampliables por el propietario), 650 lotes de 90 m² o 120 m², amplias áreas verdes y equipamiento en funcionamiento.',
    features: [
      '3,000 viviendas con estructura de concreto armado, de calidad y ampliables',
      '650 lotes de 90 m² o 120 m²',
      '10 parques y 1 parque zonal con amplias áreas verdes',
      'Pistas asfaltadas',
      '2 colegios en funcionamiento',
      'Iglesia en funcionamiento',
      'Centro recreativo con campos deportivos y piscina',
      'Próxima Universidad',
    ],
  },
];

const slugFromTitle = (t: string) =>
  t
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sin tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const Testimonials: React.FC = () => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-10">
      <div className="flex flex-wrap justify-center gap-6">
        {items.map((t, idx) => {
          const features = t.features ?? defaultFeatures;
          const slug = slugFromTitle(t.title);

          return (
            <article
              key={idx}
              className="w-full overflow-hidden rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagen */}
                <div className="relative h-[300px] lg:h-auto">
                  <Image
                    src={t.img}
                    alt={t.title}
                    fill
                    className="object-cover"
                    priority={idx < 3}
                  />
                </div>

                {/* Contenido */}
                <div className="p-6 lg:p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-extrabold leading-snug text-[#0E08C9]">{t.title}</h3>

                    {t.description && (
                      <p className="mt-3 text-base text-[#333] leading-relaxed">{t.description}</p>
                    )}

                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <h4 className="text-lg font-semibold text-gray-900">Características</h4>
                      <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#333]">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <span className="text-[#0E08C9] mt-1">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Botón a su sección en /proyectos */}
                  <div className="mt-6">
                    <Link
                      href={`/proyectos#${slug}`}
                      className="inline-flex items-center justify-center w-full lg:w-auto rounded-full bg-[#0E08C9] px-8 py-4 text-base font-extrabold text-white shadow-md hover:bg-[#0c07a8] transition-colors"
                      aria-label={`Ver proyecto: ${t.title.trim()}`}
                    >
                      VER PROYECTO
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Testimonials;
