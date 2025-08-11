'use client';

import { useEffect, useState } from 'react';

const Hero: React.FC = () => {
  const imgs = [
    '/images/slider1.jpg',
    '/images/slider2.jpg',
    '/images/slider3.jpg',
  ];

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((currentIdx) => (currentIdx + 1) % imgs.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [imgs.length]);

  return (
    <header
      className="relative min-h-[72vh] grid place-items-end bg-cover bg-center"
      style={{ backgroundImage: `url('${imgs[idx]}')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/15 z-0" />
      <div className="relative z-10 text-white p-6 pb-22 max-w-7xl ml-auto mr-6 text-right">
        <span className="inline-block bg-lp-yellow text-gray-900 font-extrabold px-6 py-3.5 rounded-2xl text-2xl">Ica San Bernardo</span>
        <h1 className="my-4 mt-4.5 mb-2 font-extrabold leading-tight text-[clamp(30px,6.4vw,64px)]">
          Donde empieza tu historia,<br />empieza tu hogar
        </h1>
        <div className="text-[clamp(18px,2.2vw,26px)] opacity-95 mt-2.5">con servicios básicos y áreas verdes</div>
        <div className="mt-5 flex items-center gap-2.5 font-semibold bg-white/10 px-3.5 py-2.5 rounded-full w-max ml-auto">
          <span>📍</span> A solo minutos de Lima
        </div>
        <button className="mt-4.5 bg-white text-gray-900 font-extrabold px-6 py-3.5 border-none rounded-full cursor-pointer shadow-lg">VER PROYECTO</button>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-5 flex gap-4 z-10" aria-label="Selector de diapositivas">
        {imgs.map((_, index) => (
          <button
            key={index}
            className={`w-3.5 h-3.5 rounded-full bg-white/55 border-none cursor-pointer shadow-md transition-all duration-200 ease-in-out hover:scale-105 ${index === idx ? 'bg-white w-4 h-4' : ''}`}
            aria-label={`Slide ${index + 1}`}
            onClick={() => setIdx(index)}
          />
        ))}
      </div>
    </header>
  );
};

export default Hero;
