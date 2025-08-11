'use client';

import React, { useEffect, useState } from 'react';

export default function Hero() {
  const imgs = [
    '/images/hero_slider_1.jpg',
    '/images/hero_slider_2.jpg',
    '/images/hero_slider_3.jpg',
  ];
  const [idx, setIdx] = useState(0);

  // Removed the useEffect hook as per the request to simplify and focus on styling.
  // The automatic slider functionality is removed with this change.

  return (
    <header className="relative min-h-[72vh] flex items-end justify-end text-white" style={{ '--hero-bg': `url('${imgs[idx]}')` } as React.CSSProperties & { [key: `--${string}`]: string }}>
      {/* Background handled by CSS variable */}
      {/* Overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 to-black/15" />

      <div className="content container mx-auto px-6 py-14 md:px-8 md:py-22 lg:py-36">
        <span className="badge inline-block rounded-lg bg-yellow-400 px-6 py-3 text-xl font-bold text-gray-900">
          Ica San Bernardo
        </span>

        <h1 className="mt-4 md:mt-[18px] mb-2 text-[clamp(30px,6.4vw,64px)] font-extrabold leading-tight md:leading-[1.05]">
          Donde empieza tu historia,<br />empieza tu hogar
        </h1>

        <div className="text-[clamp(18px,2.2vw,26px)] opacity-95 mt-2">
          con servicios básicos y áreas verdes
        </div>

        <div className="mt-[22px] ml-auto inline-flex w-max items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 font-semibold">
          <span>📍</span> A solo minutos de Lima
        </div>

        <button
          type="button"
          className="mt-[18px] rounded-full bg-white px-[22px] py-[14px] font-extrabold text-[#0b1324] shadow-[0_6px_18px_rgba(0,0,0,0.18)] focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          VER PROYECTO
        </button>
      </div>

      <div className="absolute bottom-[22px] left-1/2 z-10 -translate-x-1/2">
        <div className="flex gap-4" aria-label="Selector de diapositivas">
          {imgs.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`rounded-full shadow transition-all ${
 i === idx ? 'h-[18px] w-[18px] bg-white' : 'h-[14px] w-[14px] bg-white/60 hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
