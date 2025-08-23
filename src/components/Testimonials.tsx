'use client';

import React from 'react';
import Image from 'next/image';

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
    title: 'Ica San Fernando',
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

export const Testimonials: React.FC = () => {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-10">
      {/* 3 tarjetas arriba y 2 abajo centradas */}
      <div className="flex flex-wrap justify-center gap-6">
        {items.map((t, idx) => {
          const features = t.features ?? defaultFeatures;
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

                {/* Descripción específica para Ica San Fernando */}
                {t.description && (
                  <p className="mt-2 text-sm text-[#333] text-left">{t.description}</p>
                )}

                {/* Bloque de características (personalizadas si existen) */}
                <div className="mt-3 border-t border-gray-100 pt-3 text-left">
                  <h4 className="text-sm font-semibold text-gray-900">Características</h4>
                  <ul className="mt-2 list-disc pl-5 text-sm text-[#333] space-y-1">
                    {features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
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
