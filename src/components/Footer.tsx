import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-lp-blue text-white pt-14 pb-6">
      <div className="max-w-7xl mx-auto px-5 text-lg leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10 items-start">
          <div>
            <Link className="text-white inline-flex items-center gap-3 font-extrabold text-2xl" href="#">
              <span className="w-10 h-7 rounded-md bg-gradient-to-br from-[#ffd54f] to-[#ffb300]"></span>
              <span>Habitat</span>
            </Link>
            <p className="mt-4 opacity-95">
              Lorem ipsum dolor sit amet,<br />
              consectetur adipiscing elit
            </p>
            <div className="flex gap-3.5 mt-4">
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="Facebook">L1</Link>
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="Instagram">L2</Link>
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="YouTube">L3</Link>
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="TikTok">L4</Link>
            </div>
          </div>
          <div>
            <h4 className="m-0 mb-4 text-2xl">Contacto</h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              <li>+1 234 567 890</li>
              <li>
                Lorem Ipsum 123,<br />
                Dolor Sit Amet
              </li>
            </ul>
          </div>
          <div>
            <h4 className="m-0 mb-4 text-2xl">Legales</h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Lorem Ipsum</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Dolor Sit</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Amet Consectetur</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Adipiscing Elit</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Sed Do</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Eiusmod Tempor</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Incididunt Ut</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="m-0 mb-4 text-2xl">Habitat</h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Departamentos</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Hoteles</Link></li>
              <li><Link className="text-[#e6f0fa] no-underline" href="#">Facturación Electrónica</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/35 mt-9 pt-4 flex flex-wrap gap-3 justify-center opacity-95">
          <span>Copyright © 2024 Habitat</span>
          <span>|</span>
          <span>All rights reserved</span>
          <span>|</span>
          <Link className="underline text-white" href="#">Terms of Service</Link>
          <span>|</span>
          <Link className="underline text-white" href="#">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;