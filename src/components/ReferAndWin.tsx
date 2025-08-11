'use client';

import Image from 'next/image';

const ReferAndWin: React.FC = () => {
  return (
    <section className="relative py-16">
      {/* Fondo */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/placeholder_image.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      <div className="mx-auto max-w-[1200px] px-5">
        <div className="max-w-[640px] rounded-[28px] bg-white px-[34px] py-8 shadow-[0_24px_48px_rgba(16,24,40,.18)] md:ml-12">
          <h2 className="mb-2 text-[32px] font-extrabold leading-[1.05] text-[#0074bc] md:text-[40px]">
            ¡Refiere y gana!
          </h2>
          <p className="mb-6 text-[18px] font-extrabold text-[#0b1324] md:text-[20px]">
            Lorem ipsum dolor sit amet
          </p>

          <ul className="mb-6 flex list-none flex-col gap-[22px] p-0">
            <li className="flex items-start text-[18px] leading-[1.4] text-[#164e8e] md:text-[20px]">
              <span className="mr-[14px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-[3px] border-[#0074bc] font-black text-[#0074bc]">
                ✓
              </span>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </li>
            <li className="flex items-start text-[18px] leading-[1.4] text-[#164e8e] md:text-[20px]">
              <span className="mr-[14px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-[3px] border-[#0074bc] font-black text-[#0074bc]">
                ✓
              </span>
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </li>
            <li className="flex items-start text-[18px] leading-[1.4] text-[#164e8e] md:text-[20px]">
              <span className="mr-[14px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-[3px] border-[#0074bc] font-black text-[#0074bc]">
                ✓
              </span>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
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
