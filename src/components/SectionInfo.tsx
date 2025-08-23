'use client';

import Image from 'next/image';
import { useRef, useState, type FC } from 'react';

const SectionInfo: FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showUnmute, setShowUnmute] = useState(true);

  const unmute = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const send = (func: string, args: any[] = []) =>
      win.postMessage(JSON.stringify({ event: 'command', func, args }), '*');

    // Habilita sonido y asegura reproducción
    send('unMute');
    send('setVolume', [100]);
    send('playVideo');
    setShowUnmute(false);
  };

  return (
    <section className="bg-white py-10">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-7 px-5 lg:[grid-template-columns:minmax(0,1fr)_500px]">
        {/* Columna izquierda */}
        <div className="min-w-0">
          <h2 className="mb-[18px] pl-3 text-[clamp(28px,4.2vw,44px)] font-extrabold leading-[1.05] text-[#0E08C9]">
            Descubre lo que tenemos para tu familia
          </h2>

          <Image
            src="/images/descubre-familia.jpg"
            alt="familia"
            width={1200}
            height={430}
            className="block h-[430px] w-full rounded-tr-[22px] object-cover md:h-[340px] md:rounded-[12px] lg:h-[430px] lg:rounded-tr-[22px]"
            priority
          />
        </div>

        {/* Card derecha: video + texto */}
        <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_24px_48px_rgba(16,24,40,.18)]">
          {/* Video */}
          <div className="relative block w-full h-[260px] md:h-[240px] lg:h-[300px]">
            <iframe
              ref={iframeRef}
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/0MuWOPA369E?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&modestbranding=1&loop=1&playlist=0MuWOPA369E&start=338&enablejsapi=1"
              title="Proyecto destacado"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="eager"
            />
            {showUnmute && (
              <button
                type="button"
                onClick={unmute}
                className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-2 text-xs text-white backdrop-blur hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/60"
                aria-label="Activar sonido"
              >
                Activar sonido 🔊
              </button>
            )}
          </div>

          {/* Contenido */}
          <div className="p-5 md:p-6 lg:p-7">
            <h3 className="mb-2.5 text-center font-extrabold text-[#0E08C9]">
              Tu lote con servicios y áreas verdes
            </h3>

            <p className="text-sm text-[#333] text-center">
              Espacios pensados para tu familia, con accesos, zonas comunes y financiamiento
              flexible. ¡Da el primer paso hacia tu nuevo hogar!
            </p>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm text-[#333]">
                <span className="font-semibold">Ubicación:</span> km 8 de la carretera a Carhuaz.
              </p>

              <h4 className="mt-3 text-sm font-semibold text-gray-900">Características</h4>
              <ul className="mt-2 list-disc pl-5 text-sm text-[#333] space-y-1">
                <li>Parques y amplias áreas verdes</li>
                <li>Pistas asfaltadas</li>
                <li>Colegio e iglesia en funcionamiento</li>
                <li>Próxima universidad</li>
                <li>Viviendas con construcción de calidad</li>
                <li>Financiamiento directo sin intereses</li>
              </ul>

              <p className="mt-4 text-sm text-[#333]">
                Las Palmeras de San Fernando no es solo una urbanización; es una próxima ciudad
                diseñada para tu comodidad y la de tu familia.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default SectionInfo;
