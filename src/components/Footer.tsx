import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid">
          <div>
            <Link className="brand" href="#">
              <span className="mark"></span>
              <span>Habitat</span>
            </Link>
            <p style={{ marginTop: '16px', opacity: 0.95 }}>
              Lorem ipsum dolor sit amet,<br />
              consectetur adipiscing elit
            </p>
            <div className="social">
              <Link className="sbtn" href="#" aria-label="Facebook">L1</Link>
              <Link className="sbtn" href="#" aria-label="Instagram">L2</Link>
              <Link className="sbtn" href="#" aria-label="YouTube">L3</Link>
              <Link className="sbtn" href="#" aria-label="TikTok">L4</Link>
            </div>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li>+1 234 567 890</li>
              <li>
                Lorem Ipsum 123,<br />
                Dolor Sit Amet
              </li>
            </ul>
          </div>
          <div>
            <h4>Legales</h4>
            <ul>
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
            <h4>Habitat</h4>
            <ul>
              <li><Link href="#">Departamentos</Link></li>
              <li><Link href="#">Hoteles</Link></li>
              <li><Link href="#">Facturación Electrónica</Link></li>
            </ul>
          </div>
        </div>
        <div className="bottom">
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