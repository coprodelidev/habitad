'use client';

import Image from 'next/image';

const SectionInfo: React.FC = () => {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-7 px-5 lg:[grid-template-columns:minmax(0,1fr)_500px]">
        {/* Columna izquierda */}
        <div className="min-w-0">
          <h2 className="mb-[18px] pl-3 text-[clamp(28px,4.2vw,44px)] font-extrabold leading-[1.05] text-[#0E08C9]">
            Descubre lo que tenemos para
            <br className="hidden md:block" />
            cumplir tus sueños
          </h2>

          <Image
            src="/images/slider1.jpg"
            alt="familia"
            width={1200}
            height={430}
            className="block h-[430px] w-full rounded-tr-[22px] object-cover md:h-[340px] md:rounded-[12px] lg:h-[430px] lg:rounded-tr-[22px]"
            priority
          />
        </div>

        {/* Card derecha: imagen + texto abajo */}
        <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_24px_48px_rgba(16,24,40,.18)]">
          <Image
            src="/images/slider2.jpg"
            alt="Proyecto destacado"
            width={800}
            height={480}
            className="block w-full h-[260px] object-cover md:h-[240px] lg:h-[300px]"
          />
          <div className="p-5 text-center">
            <h3 className="mb-2.5 font-extrabold text-[#0E08C9]">
              Tu lote con servicios y áreas verdes
            </h3>
            <p className="text-sm text-[#333]">
              Espacios pensados para tu familia, con accesos, zonas comunes y financiamiento
              flexible. ¡Da el primer paso hacia tu nuevo hogar!
            </p>
          </div>
        </article>
      </div>
    </section>
  );
};

export default SectionInfo;
