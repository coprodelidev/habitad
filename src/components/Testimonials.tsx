import React from 'react';
import Image from 'next/image';

type TItem = { img: string; title: string };

const items: TItem[] = [
  { img: '/images/slider-5.jpg', title: 'Ica San Fernando' },
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
        {items.map((t, idx) => (
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
              <h3 className="font-extrabold leading-snug text-[#0E08C9]">
                {t.title}
              </h3>

              {/* Bloque de características común para todos */}
              <div className="mt-3 border-t border-gray-100 pt-3 text-left">
                <h4 className="text-sm font-semibold text-gray-900">
                  Características
                </h4>
                <ul className="mt-2 list-disc pl-5 text-sm text-[#333] space-y-1">
                  <li>Parques y amplias áreas verdes</li>
                  <li>Pistas asfaltadas</li>
                  <li>Colegio e iglesia en funcionamiento</li>
                  <li>Próxima universidad</li>
                  <li>Viviendas con construcción de calidad</li>
                  <li>Financiamiento directo sin intereses</li>
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
