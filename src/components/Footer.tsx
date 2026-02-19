import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0E08C9] text-white">
      <div className="mx-auto max-w-[1200px] px-5 py-14">
        {/* Grid principal */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Col 1: brand + social */}
          <div>
            <Link href="#" className="inline-flex items-center gap-3 font-extrabold text-[22px] text-white">
              <span className="h-7 w-10 rounded-[6px] bg-gradient-to-br from-[#ffd54f] to-[#ffb300]" />
              Habitat
            </Link>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://www.facebook.com/people/COPRODELI/61561853229676/?mibextid=ZbWKwL"
                aria-label="Facebook"
                className="flex h-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] px-4 font-extrabold"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/coprodeliperu/"
                aria-label="Instagram"
                className="flex h-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] px-4 font-extrabold"
              >
                Instagram
              </a>
              <a
                href="https://www.youtube.com/user/COPRODELIPeru"
                aria-label="YouTube"
                className="flex h-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] px-4 font-extrabold"
              >
                YouTube
              </a>
              <a
                href="https://x.com/CoprodeliPeru?t=kDkGNfstLHkSEN24NWGkpg&s=08"
                aria-label="X"
                className="flex h-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] px-4 font-extrabold"
              >
                X
              </a>
              <a
                href="https://www.linkedin.com/in/coprodeli/"
                aria-label="LinkedIn"
                className="flex h-11 items-center justify-center rounded-[10px] bg-[#0a6aa8] px-4 font-extrabold"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Col 2: contacto */}
          <div>
            <h4 className="mb-4 text-[22px] font-semibold">Contacto</h4>
            <ul className="flex list-none flex-col gap-3">
              <li className="text-[18px] leading-7">Telefono: 989138741 - 989 138 732</li>
              <li className="text-[18px] leading-7">Direccion Km 8 de la Carretera Carhuaz</li>
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
