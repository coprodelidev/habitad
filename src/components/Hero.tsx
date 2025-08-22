'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroAuthBar from './auth/HeroAuthBar';

export default function Hero() {
  const slides = [
    '/images/slider-0.jpg',
    '/images/slider-1.jpeg',
    '/images/slider-2.jpeg',
    '/images/slider-3.jpeg',
    '/images/slider-4.jpeg',
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
          alt="Slide de proyecto"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Overlay oscuro */}
      <div className="absolute inset-0 -z-10 bg-black/45 md:bg-black/50" />

      {/* LOGO arriba a la izquierda */}
      <div className="absolute left-6 top-6 z-20">
        <Link href="https://www.coprodeli.org" aria-label="Ir al inicio" className="block">
          <div className="rounded-3xl bg-white p-4 md:p-5 shadow-lg ring-1 ring-slate-120/80">
            <Image
              src="/images/logo.jpg"
              alt="Habitat"
              width={120}
              height={80}
              priority
              className="block w-[160px] md:w-[120px] h-auto"
            />
          </div>
        </Link>
      </div>

      {/* Auth bar: arriba a la derecha */}
      <div className="absolute right-6 top-6 z-20">
        <nav aria-label="Acceso" className="inline-flex items-center gap-1 p-1.5">
          <HeroAuthBar />
        </nav>
      </div>

      {/* Contenido alineado a la derecha */}
      <div className="w-full max-w-[1200px] px-6 pb-10 pt-8 text-right md:pb-24 md:pt-14">
        <h1 className="mb-3 text-2xl font-extrabold leading-[1.05] sm:text-2xl md:text-2xl lg:text-4xl">
          CONSTRUIMOS COMUNIDADES ,<br /> A minutos del centro de Ica
        </h1>

        <p className="mb-4 text-lg md:text-2xl">
          con <span className="font-bold">servicios básicos y áreas verdes</span>
        </p>

        <div className="mt-4 flex items-center justify-end gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold md:text-base">
            <span>📍</span> A solo minutos de Ica
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
              className={`rounded-full transition-all ${i === idx ? 'h-4 w-4 bg-white' : 'h-3 w-3 bg-white/60 hover:scale-110'
                }`}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
