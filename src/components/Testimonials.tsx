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
  { img: '/images/slider-5.jpg', title: 'Ica el Huarango' },
  { img: '/images/slider-5.jpg', title: 'Casas y Lotes entrega inmediata' },
  { img: '/images/slider-5.jpg', title: 'Pisco Condominio' },
  { img: '/images/slider-5.jpg', title: 'Ica San Bernardo' },
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
              className="w-[300px] sm:w-[320px] lg:w-[360px] overflow-hidden rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              <Image
                src={t.img}
                alt={t.title}
                width={720}
                height={430}
                className="block w-full h-auto"
                priority={idx < 3}
              />
              <div className="p-5 text-center">
                <h3 className="font-extrabold leading-snug text-[#0E08C9]">{t.title}</h3>

                {t.description && (
                  <p className="mt-2 text-sm text-[#333] text-left">{t.description}</p>
                )}

                <div className="mt-3 border-t border-gray-100 pt-3 text-left">
                  <h4 className="text-sm font-semibold text-gray-900">Características</h4>
                  <ul className="mt-2 list-disc pl-5 text-sm text-[#333] space-y-1">
                    {features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>

                  {/* Botón a su sección en /proyectos */}
                  <div className="mt-4 text-center">
                    <Link
                      href={`/proyectos#${slug}`}
                      className="inline-flex items-center rounded-full bg-[#0E08C9] px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#0c07a8] md:text-base"
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
