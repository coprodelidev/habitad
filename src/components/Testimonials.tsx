import React from 'react';
import Image from 'next/image';

type TItem = {
  img: string;
  title: string;
  text: string;
  name: string;
  meta: string;
};

const items: TItem[] = [
  {
    img: '/images/slider1.jpg',
    title: '“Lorem ipsum dolor sit amet”',
    text:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    name: 'Lorem Ipsum',
    meta: 'Habitat - Lorem Ipsum',
  },
  {
    img: '/images/slider2.jpg',
    title: '“Consectetur adipiscing elit”',
    text:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    name: 'Dolor Sitamet',
    meta: 'MiVivienda - Chilca',
  },
  {
    img: '/images/slider3.jpg',
    title: '“Nuestro sueño hecho realidad en Chincha”',
    text:
      'Cumplimos el sueño de la casa propia con Coprodeli Habitad. En Chincha hallamos un lugar hermoso, accesible y con bono Techo Propio.',
    name: 'Eduardo Diaz',
    meta: 'Techo Propio - Chincha',
  },
  {
    img: '/images/slider2.jpg',
    title: '“Trámite simple y acompañamiento real”',
    text:
      'Nos guiaron en todo el proceso y resolvieron nuestras dudas. Hoy tenemos nuestro lote asegurado.',
    name: 'María López',
    meta: 'Programa Familiar - Pisco',
  },
  {
    img: '/images/slider3.jpg',
    title: '“Ubicación y servicios que buscábamos”',
    text:
      'La urbanización tiene áreas verdes y acceso rápido. Perfecto para empezar nuestra historia.',
    name: 'Carlos Pérez',
    meta: 'Casas y Lotes - Ica',
  },
  {
    img: '/images/slider1.jpg',
    title: '“Financiamiento accesible, decisión fácil”',
    text:
      'El bono y las facilidades hicieron posible dar este paso. Recomendado para familias jóvenes.',
    name: 'Ana Rodríguez',
    meta: 'Condominio - San Fernando',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-5 px-5 py-10">
      {items.map((t, idx) => (
        <article
          key={idx}
          className="flex-1 min-w-[280px] max-w-[350px] overflow-hidden rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        >
          <Image
            src={t.img}
            alt={t.name}
            width={600}
            height={360}
            className="block w-full h-auto"
            priority={idx < 2}
          />
          <div className="p-5 text-center">
            <h3 className="mb-2.5 font-extrabold text-[#0E08C9]">{t.title}</h3>
            <p className="mb-3 text-sm text-[#333]">{t.text}</p>
            <div className="text-sm font-bold text-[#0E08C9]">{t.name}</div>
            <div className="text-[13px] text-[#555]">{t.meta}</div>
          </div>
        </article>
      ))}
    </section>
  );
};

export default Testimonials;
