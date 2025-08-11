import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid">
          <div>
            <Link className="brand" href="#">
              <span className="mark"></span>
              <span>Los Portales</span>
            </Link>
            <p style={{ marginTop: '16px', opacity: 0.95 }}>
              Razón Social: Los Portales S.A.<br />
              RUC: 20301837896
            </p>
            <div className="social">
              <Link className="sbtn" href="#" aria-label="Facebook">f</Link>
              <Link className="sbtn" href="#" aria-label="Instagram">IG</Link>
              <Link className="sbtn" href="#" aria-label="YouTube">▶</Link>
              <Link className="sbtn" href="#" aria-label="TikTok">♬</Link>
            </div>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li>(01) 211 4470</li>
              <li>
                Jr. Mariscal la Mar 991,<br />
                Magdalena del Mar
              </li>
            </ul>
          </div>
          <div>
            <h4>Legales</h4>
            <ul>
              <li><Link href="#">Condiciones de Uso</Link></li>
              <li><Link href="#">Políticas de Cookies</Link></li>
              <li><Link href="#">Información Legal</Link></li>
              <li><Link href="#">Políticas de Privacidad</Link></li>
              <li><Link href="#">Financiamiento</Link></li>
              <li><Link href="#">Documentación de proveedores</Link></li>
              <li><Link href="#">Libro de reclamaciones</Link></li>
            </ul>
          </div>
          <div>
            <h4>Portales</h4>
            <ul>
              <li><Link href="#">Corporativo</Link></li>
              <li><Link href="#">Departamentos</Link></li>
              <li><Link href="#">Hoteles</Link></li>
              <li><Link href="#">Facturación Electrónica</Link></li>
            </ul>
          </div>
        </div>
        <div className="bottom">
          <span>Copyright © 2024 Los Portales</span>
          <span>|</span>
          <span>Todos los derechos reservados</span>
          <span>|</span>
          <Link href="#">Términos y condiciones</Link>
          <span>|</span>
          <Link href="#">Políticas de Privacidad</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;