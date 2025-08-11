import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0074bc] text-white py-14">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
          <div>
            <Link className="text-white inline-flex items-center gap-3 font-extrabold text-[22px]" href="#">
              <span className="w-10 h-7 rounded bg-gradient-to-br from-[#ffd54f] to-[#ffb300]" />
              <span>Habitat</span>
            </Link>
            <p className="mt-4 opacity-95">
              Lorem ipsum dolor sit amet,<br />consectetur adipiscing elit
            </p>
            <div className="flex gap-4 mt-5">
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="Facebook">L1</Link>
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="Instagram">L2</Link>
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="YouTube">L3</Link>
              <Link className="w-11 h-11 rounded-lg bg-[#0a6aa8] flex items-center justify-center font-extrabold" href="#" aria-label="TikTok">L4</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[22px] mb-4">Contacto</h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-3 text-[18px]">
              <li>+1 234 567 890</li>
              <li>
                Lorem Ipsum 123,<br />Dolor Sit Amet
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[22px] mb-4">Legales</h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-3 text-[18px]">
              <li><Link href="#">Lorem Ipsum</Link></li>
              <li><Link href="#">Dolor Sit</Link></li>
              <li><Link href="#">Amet Consectetur</Link></li>
              <li><Link href="#">Adipiscing Elit</Link></li>
              <li><Link href="#">Sed Do</Link></li>
              <li><Link href="#">Eiusmod Tempor</Link></li>
              <li><Link href="#">Incididunt Ut</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[22px] mb-4">Habitat</h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-3 text-[18px]">
              <li><Link href="#">Departamentos</Link></li>
              <li><Link href="#">Hoteles</Link></li>
              <li><Link href="#">Facturación Electrónica</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/35 mt-9 pt-4 flex flex-wrap gap-3 justify-center opacity-95 text-[18px]">
          <span>Copyright © 2024 Habitat</span>
          <span>|</span>
          <span>All rights reserved</span>
          <span>|</span>
          <Link href="#">Terms of Service</Link>
          <span>|</span>
          <Link href="#">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
