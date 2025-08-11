'use client';

import { useEffect, useState } from 'react';

const Hero: React.FC = () => {
  const imgs = ['/images/slider1.jpg', '/images/slider2.jpg', '/images/slider3.jpg'];

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (currentIdx: number) => (currentIdx + 1) % imgs.length;
      setIdx(next);
      console.log('cambio automático de slide');
    }, 5000);
    return () => clearInterval(timer);
  }, [imgs.length]);

  useEffect(() => {
    console.log('slide actual', idx);
  }, [idx]);

  return (
    <header
      className="relative grid min-h-[72vh] place-items-end bg-cover bg-center"
      style={{ backgroundImage: `url(${imgs[idx]})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/15" />
      <div className="relative text-white px-6 py-14 sm:py-16 max-w-[1200px] w-full ml-auto mr-6 text-right">
        <span className="inline-block bg-[#ffc107] text-[#112] font-extrabold py-3 px-5 rounded-xl text-2xl">Ica San Bernardo</span>
        <h1 className="mt-5 mb-2 font-extrabold leading-tight text-[clamp(30px,6.4vw,64px)]">
          Donde empieza tu historia,<br />empieza tu hogar
        </h1>
        <div className="text-[clamp(18px,2.2vw,26px)] opacity-95 mt-2">con servicios básicos y áreas verdes</div>
        <div className="mt-5 flex items-center gap-2 font-semibold bg-white/10 py-2 px-4 rounded-full w-max ml-auto">
          <span>📍</span> A solo minutos de Lima
        </div>
        <button
          className="mt-5 bg-white text-[#0b1324] font-extrabold py-3 px-6 rounded-full shadow-lg"
          onClick={() => console.log('ver proyecto')}
        >
          VER PROYECTO
        </button>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-4 z-10" aria-label="Selector de diapositivas">
        {imgs.map((_, index) => (
          <button
            key={index}
            className={`rounded-full shadow-md transition-all ${index === idx ? 'w-5 h-5 bg-white' : 'w-3.5 h-3.5 bg-white/55'}`}
            aria-label={`Slide ${index + 1}`}
            onClick={() => {
              console.log('slide seleccionado', index);
              setIdx(index);
            }}
          />
        ))}
      </div>
    </header>
  );
};

export default Hero;
