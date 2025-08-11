'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Hero() {
  const slides = [
    '/images/slider1.jpg',
    '/images/slider2.jpg',
    '/images/slider3.jpg',
  ];

  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative flex min-h-[70vh] items-end justify-end text-white md:min-h-[82vh]">
      {/* Fondo */}
      <div className="absolute inset-0 -z-20">
        <Image
          src={slides[i]}
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 -z-10 bg-black/45 md:bg-black/50" />

      {/* Contenido alineado a la derecha */}
      <div className="w-full max-w-[1200px] px-6 pb-10 pt-8 text-right md:pb-24 md:pt-14">
        {/* Badge superior derecha */}
        <div className="mb-6 flex justify-end">
          <span className="inline-flex items-center rounded-full bg-[#ffc107] px-5 py-2 text-sm font-extrabold text-[#1a2b3c] md:text-base">
            Terrenos en ICA
          </span>
        </div>

        {/* Headline principal */}
        <h1 className="mb-3 text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
          Donde empieza tu historia,<br />empieza tu hogar
        </h1>

        {/* Subtítulo */}
        <p className="mb-4 text-lg md:text-2xl">
          con <span className="font-bold">servicios básicos y áreas verdes</span>
        </p>

        {/* Chip de ubicación + CTA */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold md:text-base">
            <span>📍</span> A solo minutos de Lima
          </span>
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-900 shadow-md md:text-base"
          >
            VER PROYECTO
          </button>
        </div>
      </div>

      {/* Dots inferiores centrados */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3" aria-label="Selector de diapositivas">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Ir al slide ${idx + 1}`}
              className={`rounded-full transition-all ${
                i === idx ? 'h-4 w-4 bg-white' : 'h-3 w-3 bg-white/60 hover:scale-110'
              }`}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
