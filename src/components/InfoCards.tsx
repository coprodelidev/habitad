'use client';

import Image from 'next/image';

export default function InfoCards() {
  return (
    <section className="flex flex-wrap justify-center gap-5 px-5 py-10">
      {/* Card con imagen de fondo */}
      <div className="relative flex min-w-[280px] max-w-[350px] flex-1 items-center justify-center overflow-hidden rounded-2xl p-5 text-center text-white shadow">
        <Image
          src="/images/placeholder_image.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex flex-col items-center">
          <h3 className="m-0 text-[22px] font-extrabold">Lorem ipsum dolor sit amet</h3>
          <div className="my-5 rounded-xl border-2 border-white px-5 py-2 text-2xl font-extrabold">
            Lorem
          </div>
          <p className="m-0 text-sm md:text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>
      </div>

      {/* Card azul */}
      <div className="flex min-w-[280px] max-w-[350px] flex-1 flex-col items-center justify-center rounded-2xl bg-[#0074bc] p-6 text-center text-white shadow">
        <h3 className="m-0 text-[22px] font-extrabold">Lorem ipsum dolor sit amet</h3>
        <p className="mt-5 text-lg font-bold">
          Lorem ipsum <span className="text-[#ffc107]">Habitat</span>
        </p>
        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 font-extrabold text-[#0074bc] shadow"
        >
          ▶ Suscríbete
        </button>
      </div>
    </section>
  );
}
