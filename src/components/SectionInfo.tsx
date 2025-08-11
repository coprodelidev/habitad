'use client';

import Link from 'next/link';

const SectionInfo: React.FC = () => {
  return (
    <section className="py-10 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_500px] gap-7 items-start max-w-7xl mx-auto px-5">
        <div className="min-w-0">
          <h2 className="m-0 mb-4.5 pl-3 text-lp-blue font-extrabold leading-tight text-[clamp(28px,4.2vw,44px)]">
            Descubre lo que tenemos para<br className="hidden md:block" />
            cumplir tus sueños
          </h2>
          <img
            className="w-full h-[430px] object-cover rounded-tr-2xl block"
            src="/images/slider1.jpg"
            alt="familia"
          />
        </div>

        <form className="bg-lp-blue text-white rounded-2xl p-5 shadow-lg relative" onSubmit={(e) => e.preventDefault()}>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold bg-lp-yellow text-[#1a2b3c]">1</span>
            <span className="flex-1 h-0.5 bg-white/35" />
            <span className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold bg-white/25">2</span>
          </div>

          <h3 className="m-0 mt-2 mb-3 text-2xl font-extrabold">Quiero recibir información</h3>

          <div className="grid grid-cols-2 gap-3">
            <input className="w-full h-11 bg-white border-none rounded-full px-4 text-base text-gray-900 outline-none shadow-inner" type="text" placeholder="Nombre*" />
            <input className="w-full h-11 bg-white border-none rounded-full px-4 text-base text-gray-900 outline-none shadow-inner" type="text" placeholder="Apellidos*" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <input className="w-full h-11 bg-white border-none rounded-full px-4 text-base text-gray-900 outline-none shadow-inner" type="text" placeholder="Nro. de documento*" />
            <div className="flex gap-2.5">
              <select className="w-full h-11 bg-white border-none rounded-full px-3 text-base text-gray-900 outline-none shadow-inner flex-[0_0_86px] text-center" aria-label="Código de país">
                <option value="+51">+51</option>
                <option value="+34">+34</option>
                <option value="+55">+55</option>
              </select>
              <input className="w-full h-11 bg-white border-none rounded-full px-4 text-base text-gray-900 outline-none shadow-inner flex-1" type="text" placeholder="Teléfono*" />
            </div>
          </div>

          <input className="w-full h-11 bg-white border-none rounded-full px-4 text-base text-gray-900 outline-none shadow-inner mt-3" type="email" placeholder="Correo electrónico*" />

          <div className="relative mt-3">
            <select className="w-full h-11 bg-white border-none rounded-full px-4 text-base text-gray-900 outline-none shadow-inner appearance-none pr-9" defaultValue="">
              <option value="" disabled>Ubicación</option>
              <option>Lima</option>
              <option>Ica</option>
              <option>Pisco</option>
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-base opacity-80 text-gray-900">▾</span>
          </div>

          <div className="relative mt-3">
            <select className="w-full h-11 bg-[#dbe6f0] text-[#4a5a73] shadow-none border-none rounded-full px-4 text-base outline-none appearance-none pr-9" disabled>
              <option>No hay proyectos disponibles</option>
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-base opacity-80 text-gray-900">▾</span>
          </div>

          <label className="flex items-start gap-2.5 text-sm leading-normal mt-3 cursor-pointer">
            <input type="checkbox" className="peer absolute opacity-0 pointer-events-none" />
            <span className="w-4.5 h-4.5 rounded-full border-2 border-white/90 mt-0.5 relative flex-shrink-0 flex items-center justify-center peer-checked:bg-lp-yellow peer-checked:border-lp-yellow">
              <span className="hidden peer-checked:block text-[#1a2b3c] font-black text-xs">✓</span>
            </span>
            He leído y acepto el <Link href="#" className="text-[#e6f0fa] underline">Tratamiento de mis datos personales</Link>.
          </label>

          <label className="flex items-start gap-2.5 text-sm leading-normal mt-3 cursor-pointer">
            <input type="checkbox" className="peer absolute opacity-0 pointer-events-none" />
            <span className="w-4.5 h-4.5 rounded-full border-2 border-white/90 mt-0.5 relative flex-shrink-0 flex items-center justify-center peer-checked:bg-lp-yellow peer-checked:border-lp-yellow">
              <span className="hidden peer-checked:block text-[#1a2b3c] font-black text-xs">✓</span>
            </span>
            He leído y acepto la <Link href="#" className="text-[#e6f0fa] underline">Política para envío de comunicaciones comerciales</Link>.
          </label>

          <button className="mt-3.5 w-full h-14 border-none rounded-full font-extrabold text-base text-gray-900 cursor-pointer bg-gradient-to-b from-[#ffd24a] via-[#ffc107] to-[#e3a800] shadow-lg" type="submit">Solicitar información</button>
        </form>
      </div>
    </section>
  );
};

export default SectionInfo;
