'use client';

import Link from 'next/link';

const SectionInfo: React.FC = () => {
  return (
    <section className="py-10 bg-white">
      <div className="max-w-[1200px] mx-auto px-5 grid gap-7 md:grid-cols-[minmax(0,1fr)_500px] items-start">
        <div className="space-y-4">
          <h2 className="pl-3 text-[#0074bc] font-extrabold leading-tight text-[clamp(28px,4.2vw,44px)]">
            Descubre lo que tenemos para
            <br className="hidden md:block" />
            cumplir tus sueños
          </h2>
          <img
            className="w-full h-[460px] object-cover rounded-2xl"
            src="/images/slider1.jpg"
            alt="familia"
          />
        </div>

        <form
          className="bg-[#0074bc] text-white p-6 rounded-2xl flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            console.log('submit formulario');
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#0074bc] font-bold">
              1
            </span>
            <span className="flex-1 h-1 bg-white" />
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/30 text-white font-bold">
              2
            </span>
          </div>

          <h3 className="font-extrabold text-xl">Quiero recibir información</h3>

          <div className="flex gap-3">
            <input className="w-full p-3 rounded-lg text-[#0b1324]" type="text" placeholder="Nombre*" />
            <input className="w-full p-3 rounded-lg text-[#0b1324]" type="text" placeholder="Apellidos*" />
          </div>

          <div className="flex gap-3">
            <input className="w-full p-3 rounded-lg text-[#0b1324]" type="text" placeholder="Nro. de documento*" />
            <div className="flex gap-2 w-full">
              <select className="p-3 rounded-lg text-[#0b1324] w-24" aria-label="Código de país">
                <option value="+51">+51</option>
                <option value="+34">+34</option>
                <option value="+55">+55</option>
              </select>
              <input className="flex-1 p-3 rounded-lg text-[#0b1324]" type="text" placeholder="Teléfono*" />
            </div>
          </div>

          <input className="w-full p-3 rounded-lg text-[#0b1324]" type="email" placeholder="Correo electrónico*" />

          <div className="relative">
            <select className="w-full p-3 rounded-lg text-[#0b1324] appearance-none pr-9" defaultValue="">
              <option value="" disabled>
                Ubicación
              </option>
              <option>Lima</option>
              <option>Ica</option>
              <option>Pisco</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0b1324]">▾</span>
          </div>

          <div className="relative opacity-70">
            <select className="w-full p-3 rounded-lg bg-[#dbe6f0] text-[#4a5a73] appearance-none pr-9" disabled>
              <option>No hay proyectos disponibles</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0b1324]">▾</span>
          </div>

          <label className="flex items-start gap-2 text-sm mt-3">
            <input type="checkbox" className="mt-1" />
            He leído y acepto el{' '}
            <Link href="#" className="underline text-[#e6f0fa]">
              Tratamiento de mis datos personales
            </Link>
            .
          </label>

          <label className="flex items-start gap-2 text-sm mt-3">
            <input type="checkbox" className="mt-1" />
            He leído y acepto la{' '}
            <Link href="#" className="underline text-[#e6f0fa]">
              Política para envío de comunicaciones comerciales
            </Link>
            .
          </label>

          <button className="mt-4 w-full h-14 rounded-full font-extrabold text-[16px] text-[#0b1324] bg-gradient-to-b from-[#ffd24a] via-[#ffc107] to-[#e3a800] shadow-[0_10px_20px_rgba(0,0,0,0.15)]" type="submit">
            Solicitar información
          </button>
        </form>
      </div>
    </section>
  );
};

export default SectionInfo;
