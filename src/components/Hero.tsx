'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const Hero: React.FC = () => {
  const imgs = [
    'https://picsum.photos/1600/900?random=1',
    'https://picsum.photos/1600/900?random=2',
    'https://picsum.photos/1600/900?random=3',
    'https://picsum.photos/1600/900?random=4',
    'https://picsum.photos/1600/900?random=5',
    'https://picsum.photos/1600/900?random=6',
    'https://picsum.photos/1600/900?random=7',
    'https://picsum.photos/1600/900?random=8'
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((currentIdx) => (currentIdx + 1) % imgs.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [imgs.length]);

  const handleDotClick = (index: number) => {
    setIdx(index);
  };

  return (
    <header className="hero" style={{ '--hero-bg': `url('${imgs[idx]}')` } as React.CSSProperties}>
      <div className="content">
        <span className="badge">Lotes en Chilca</span>
        <h1 className="headline">Donde empieza tu historia,<br />empieza tu hogar</h1>
        <div className="sub">con servicios básicos y áreas verdes</div>
        <div className="foot">
          <span>📍</span> A solo minutos de Lima
        </div>
      </div>
      <div className="hero-dots" aria-label="Selector de diapositivas">
        {imgs.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === idx ? 'active' : ''}`}
            data-idx={index}
            aria-label={`Slide ${index + 1}`}
            onClick={() => handleDotClick(index)}
          ></button>
        ))}
      </div>
    </header>
  );
};

export default Hero;