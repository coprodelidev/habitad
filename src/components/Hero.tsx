'use client';

import { useEffect, useState } from 'react';

const Hero: React.FC = () => {
  const imgs = [
    '/images/hero_slider_1.jpg',
    '/images/hero_slider_2.jpg',
    '/images/hero_slider_3.jpg',
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
      className="hero"
      style={{ '--hero-bg': `url('${imgs[idx]}')` } as React.CSSProperties}
    >
      <div className="content">
        <span className="badge">Ica San Bernardo</span>
        <h1 className="headline">
          Donde empieza tu historia,<br />empieza tu hogar
        </h1>
        <div className="sub">con servicios básicos y áreas verdes</div>
        <div className="foot">
          <span>📍</span> A solo minutos de Lima
        </div>
        <button className="ver-proyecto-button">VER PROYECTO</button>
      </div>

      <div className="hero-dots" aria-label="Selector de diapositivas">
        {imgs.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === idx ? 'active' : ''}`}
            aria-label={`Slide ${index + 1}`}
            onClick={() => setIdx(index)}
          />
        ))}
      </div>
    </header>
  );
};

export default Hero;
