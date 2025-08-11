import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0074bc] text-white">
      <div className="mx-auto max-w-[1200px] px-5 py-14">
        {/* Grid principal */}
        <div className="grid gap-10 lg:[grid-template-columns:1.3fr_1fr_1fr_1fr]">
          {/* Col 1: brand + copy + social */}
          <div>
            <Link href="#" className="inline-flex items-center gap-3 font-extrabold text-[22px] text-white">
              <span className="h-7 w-10 rounded-[6px] bg-gradient-to-br from-[#ffd54f] to-[#ffb300]" />
              Habitat
            </Link>

            <p className="mt-4 opacity-95 text-[18px] leading-relaxed md:text-[18px]">
              Lorem ipsum dolor sit amet,<br />
              consectetur adipiscing elit
            </p>

            <div className="mt-5 flex gap-3">
              <Link
                href="#"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] font-extrabold"
              >
                L1
              </Link>
              <Link
                href="#"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] font-extrabold"
              >
                L2
              </Link>
              <Link
                href="#"
                aria-label="YouTube"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] font-extrabold"
              >
                L3
              </Link>
              <Link
                href="#"
                aria-label="TikTok"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] font-extrabold"
              >
                L4
              </Link>
            </div>
          </div>

          {/* Col 2: contacto */}
          <div>
            <h4 className="mb-4 text-[22px] font-semibold">Contacto</h4>
            <ul className="flex list-none flex-col gap-3">
              <li className="text-[18px] leading-7">+1 234 567 890</li>
              <li className="text-[18px] leading-7">
                Lorem Ipsum 123,<br />Dolor Sit Amet
              </li>
            </ul>
          </div>

          {/* Col 3: legales */}
          <div>
            <h4 className="mb-4 text-[22px] font-semibold">Legales</h4>
            <ul className="flex list-none flex-col gap-3">
              {[
                'Lorem Ipsum',
                'Dolor Sit',
                'Amet Consectetur',
                'Adipiscing Elit',
                'Sed Do',
                'Eiusmod Tempor',
                'Incididunt Ut',
              ].map((t) => (
                <li key={t}>
                  <Link
                    href="#"
                    className="text-[18px] leading-7 text-[#e6f0fa] hover:underline"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: habitat */}
          <div>
            <h4 className="mb-4 text-[22px] font-semibold">Habitat</h4>
            <ul className="flex list-none flex-col gap-3">
              {['Departamentos', 'Hoteles', 'Facturación Electrónica'].map((t) => (
                <li key={t}>
                  <Link
                    href="#"
                    className="text-[18px] leading-7 text-[#e6f0fa] hover:underline"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-9 border-t border-white/35 pt-4">
          <div className="flex flex-wrap justify-center gap-3 text-center opacity-95">
            <span className="text-[18px]">Copyright © 2024 Habitat</span>
            <span>|</span>
            <span className="text-[18px]">All rights reserved</span>
            <span>|</span>
            <Link href="#" className="text-[18px] underline">
              Terms of Service
            </Link>
            <span>|</span>
            <Link href="#" className="text-[18px] underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
