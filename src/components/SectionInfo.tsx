'use client';

import Link from 'next/link';

const SectionInfo: React.FC = () => {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-7 px-5 lg:[grid-template-columns:minmax(0,1fr)_500px]">
        {/* Columna izquierda */}
        <div className="min-w-0">
          <h2 className="mb-[18px] pl-3 text-[clamp(28px,4.2vw,44px)] font-extrabold leading-[1.05] text-[#0074bc]">
            Descubre lo que tenemos para
            <br className="hidden md:block" />
            cumplir tus sueños
          </h2>

          <img
            src="/images/slider1.jpg"
            alt="familia"
            className="block h-[430px] w-full rounded-tr-[22px] object-cover md:h-[340px] md:rounded-[12px] lg:h-[430px] lg:rounded-tr-[22px]"
          />
        </div>

        {/* Tarjeta lead (form) */}
        <form
          className="relative rounded-[22px] bg-[#0074bc] p-[22px] pb-[18px] text-white shadow-[0_24px_48px_rgba(16,24,40,.18)]"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Steps */}
          <div className="mb-1 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffc107] font-extrabold text-[#1a2b3c]">
              1
            </span>
            <span className="h-[2px] flex-1 bg-white/35" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 font-extrabold">
              2
            </span>
          </div>

          <h3 className="mb-3 mt-2 text-[22px] font-extrabold">Quiero recibir información</h3>

          {/* Nombre / Apellidos */}
          <div className="mb-3 flex gap-3">
            <input
              type="text"
              placeholder="Nombre*"
              className="h-[46px] flex-1 rounded-full bg-white px-4 py-2 text-[15px] text-[#0b1324] outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] placeholder:text-[#7b8aab]"
            />
            <input
              type="text"
              placeholder="Apellidos*"
              className="h-[46px] flex-1 rounded-full bg-white px-4 py-2 text-[15px] text-[#0b1324] outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] placeholder:text-[#7b8aab]"
            />
          </div>

          {/* Doc / Teléfono */}
          <div className="mb-3 flex gap-3">
            <input
              type="text"
              placeholder="Nro. de documento*"
              className="h-[46px] flex-1 rounded-full bg-white px-4 py-2 text-[15px] text-[#0b1324] outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] placeholder:text-[#7b8aab]"
            />
            <div className="flex flex-1 gap-2">
              <select
                aria-label="Código de país"
                className="h-[46px] w-[86px] appearance-none rounded-full bg-white px-3 text-center text-[15px] text-[#0b1324] outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"
              >
                <option value="+51">+51</option>
                <option value="+34">+34</option>
                <option value="+55">+55</option>
              </select>
              <input
                type="text"
                placeholder="Teléfono*"
                className="h-[46px] w-full flex-1 rounded-full bg-white px-4 py-2 text-[15px] text-[#0b1324] outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] placeholder:text-[#7b8aab]"
              />
            </div>
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Correo electrónico*"
            className="mb-3 h-[46px] w-full rounded-full bg-white px-4 py-2 text-[15px] text-[#0b1324] outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] placeholder:text-[#7b8aab]"
          />

          {/* Select ubicación con flecha */}
          <div className="relative">
            <select
              defaultValue=""
              className="h-[46px] w-full appearance-none rounded-full bg-white px-4 pr-10 text-[15px] text-[#0b1324] outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"
            >
              <option value="" disabled>
                Ubicación
              </option>
              <option>Lima</option>
              <option>Ica</option>
              <option>Pisco</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[#0b1324]/80">
              ▾
            </span>
          </div>

          {/* Select disabled visual */}
          <div className="relative mt-3">
            <select
              disabled
              className="h-[46px] w-full appearance-none rounded-full bg-[#dbe6f0] px-4 pr-10 text-[15px] text-[#4a5a73] outline-none"
            >
              <option>No hay proyectos disponibles</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[#0b1324]/60">
              ▾
            </span>
          </div>

          {/* Checks */}
          <label className="mt-3 flex items-start gap-2 text-[14px] leading-[1.4]">
            <input type="checkbox" className="peer sr-only" />
            <span className="mt-[2px] inline-block h-[18px] w-[18px] flex-none rounded-full border-2 border-white/90 peer-checked:border-[#ffc107] peer-checked:bg-[#ffc107] peer-checked:after:flex peer-checked:after:items-center peer-checked:after:justify-center peer-checked:after:text-[12px] peer-checked:after:font-black peer-checked:after:text-[#1a2b3c] after:hidden peer-checked:after:content-['✓']" />
            He leído y acepto el{' '}
            <Link href="#" className="ml-1 underline text-[#e6f0fa]">
              Tratamiento de mis datos personales
            </Link>
            .
          </label>

          <label className="mt-3 flex items-start gap-2 text-[14px] leading-[1.4]">
            <input type="checkbox" className="peer sr-only" />
            <span className="mt-[2px] inline-block h-[18px] w-[18px] flex-none rounded-full border-2 border-white/90 peer-checked:border-[#ffc107] peer-checked:bg-[#ffc107] peer-checked:after:flex peer-checked:after:items-center peer-checked:after:justify-center peer-checked:after:text-[12px] peer-checked:after:font-black peer-checked:after:text-[#1a2b3c] after:hidden peer-checked:after:content-['✓']" />
            He leído y acepto la{' '}
            <Link href="#" className="ml-1 underline text-[#e6f0fa]">
              Política para envío de comunicaciones comerciales
            </Link>
            .
          </label>

          {/* Botón */}
          <button
            type="submit"
            className="mt-[14px] h-[56px] w-full rounded-full bg-gradient-to-b from-[#ffd24a] via-[#ffc107] to-[#e3a800] text-[16px] font-extrabold text-[#0b1324] shadow-[0_10px_20px_rgba(0,0,0,.15)]"
          >
            Solicitar información
          </button>
        </form>
      </div>
    </section>
  );
};

export default SectionInfo;
