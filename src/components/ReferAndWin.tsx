'use client';

import Image from 'next/image';

const ReferAndWin: React.FC = () => {
  return (
    <section className="relative py-16">
      {/* Fondo */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/slider-3.jpeg"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      <div className="mx-auto max-w-[1200px] px-5">
        <div className="max-w-[640px] rounded-[28px] bg-white px-[34px] py-8 shadow-[0_24px_48px_rgba(16,24,40,.18)] md:ml-12">
          <h2 className="mb-10 mb-2 pb-10 text-[32px] font-extrabold leading-[1.05] text-[#0E08C9] md:text-[40px]">
            Construimos comunidades
          </h2>


          <ul className="mb-6 flex list-none flex-col gap-[22px] p-0">
            <li className="flex items-start text-[18px] leading-[1.4] text-[#164e8e] md:text-[20px]">
              <span className="mr-[14px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-[3px] border-[#0E08C9] font-black text-[#0E08C9]">
                ✓
              </span>
              Viviendas con construcción de calidad
            </li>
            <li className="flex items-start text-[18px] leading-[1.4] text-[#164e8e] md:text-[20px]">
              <span className="mr-[14px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-[3px] border-[#0E08C9] font-black text-[#0E08C9]">
                ✓
              </span>
              Colegio e iglesia en funcionamiento ,               Próxima universidad
            </li>
            <li className="flex items-start text-[18px] leading-[1.4] text-[#164e8e] md:text-[20px]">
              <span className="mr-[14px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-[3px] border-[#0E08C9] font-black text-[#0E08C9]">
                ✓
              </span>
              Parques y amplias áreas verdes
            </li>
            <li className="flex items-start text-[18px] leading-[1.4] text-[#164e8e] md:text-[20px]">
              <span className="mr-[14px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-[3px] border-[#0E08C9] font-black text-[#0E08C9]">
                ✓
              </span>
              Pistas asfaltadas
            </li>


          </ul>

          <button
            type="button"
            className="inline-flex items-center gap-3 rounded-full bg-[#ffc107] px-[22px] py-4 font-extrabold text-[#0b1324] shadow-[0_10px_20px_rgba(0,0,0,.15)]"
          >
            Más información <span className="text-[18px]">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReferAndWin;
