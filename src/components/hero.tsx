"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

const images = [
  { src: "https://placehold.co/1600x900.png", hint: "house exterior" },
  { src: "https://placehold.co/1600x900.png", hint: "living room" },
  { src: "https://placehold.co/1600x900.png", hint: "modern kitchen" }
];

interface HeroProps {
  title: string;
  description: string;
}

export function Hero({ title, description }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextImage = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, []);

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(nextImage, 5000);
  }, [nextImage]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resetAutoplay]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    resetAutoplay();
  };
  
  const pauseAutoplay = () => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
  }

  return (
    <section
      className="relative w-full h-screen bg-cover bg-center transition-all duration-500 ease-in-out"
      style={{ backgroundImage: `url('${images[currentIndex].src}')` }}
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resetAutoplay}
      data-ai-hint={images[currentIndex].hint}
    >
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center p-4">
        <div className="bg-black/40 p-6 sm:p-8 rounded-xl shadow-2xl max-w-4xl backdrop-blur-sm">
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-md">{title}</h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto drop-shadow-sm">{description}</p>
        </div>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => handleDotClick(i)}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${
              currentIndex === i ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
