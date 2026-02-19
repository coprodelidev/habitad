import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0E08C9] text-white">
      <div className="mx-auto max-w-[1200px] px-5 py-14">
        {/* Grid principal */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Col 1: brand + social */}
          <div>
            <Link href="https://www.coprodeli.org" aria-label="Ir al inicio" className="inline-block">
              <div className="rounded-3xl bg-white p-4 md:p-5 shadow-lg ring-1 ring-slate-120/80">
                <Image
                  src="/images/logo.jpg"
                  alt="Habitat"
                  width={120}
                  height={80}
                  className="block h-auto w-[120px] md:w-[80px]"
                />
              </div>
            </Link>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://www.facebook.com/people/COPRODELI/61561853229676/?mibextid=ZbWKwL"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8]"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/coprodeliperu/"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8]"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.youtube.com/user/COPRODELIPeru"
                aria-label="YouTube"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8]"
              >
                <Youtube size={20} />
              </a>
              <a
                href="https://x.com/CoprodeliPeru?t=kDkGNfstLHkSEN24NWGkpg&s=08"
                aria-label="X"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8]"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://www.linkedin.com/in/coprodeli/"
                aria-label="LinkedIn"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0a6aa8]"
              >
                <Linkedin size={20} />
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
