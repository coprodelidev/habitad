'use client';

import Link from 'next/link';

const SectionInfo: React.FC = () => {
  return (
    <section className="section-info lp-info">
      <div className="container info-grid">
        <div className="info-left">
          <h2 className="info-title">
            Descubre lo que tenemos para<br className="br-md" />
            cumplir tus sueños
          </h2>
          <img
            className="info-photo"
            src="/images/placeholder_image.jpg"
 alt="familia"
          />
        </div>

        {/* ahora es cliente: el handler ya no rompe */}
        <form className="form-box lead-card" onSubmit={(e) => e.preventDefault()}>
          <div className="steps">
            <span className="step active">1</span>
            <span className="bar" />
            <span className="step">2</span>
          </div>

          <h3 className="lead-title">Quiero recibir información</h3>

          <div className="row two">
            <input className="field" type="text" placeholder="Nombre*" />
            <input className="field" type="text" placeholder="Apellidos*" />
          </div>

          <div className="row two">
            <input className="field" type="text" placeholder="Nro. de documento*" />
            <div className="row phone">
              <select className="field code" aria-label="Código de país">
                <option value="+51">+51</option>
                <option value="+34">+34</option>
                <option value="+55">+55</option>
              </select>
              <input className="field tel" type="text" placeholder="Teléfono*" />
            </div>
          </div>

          <input className="field" type="email" placeholder="Correo electrónico*" />

          <div className="select-wrap">
            <select className="field select" defaultValue="">
              <option value="" disabled>Ubicación</option>
              <option>Lima</option>
              <option>Ica</option>
              <option>Pisco</option>
            </select>
            <span className="chev">▾</span>
          </div>

          <div className="select-wrap disabled">
            <select className="field select" disabled>
              <option>No hay proyectos disponibles</option>
            </select>
            <span className="chev">▾</span>
          </div>

          <label className="chk">
            <input type="checkbox" />
            <span className="control" />
            He leído y acepto el <Link href="#" className="link">Tratamiento de mis datos personales</Link>.
          </label>

          <label className="chk">
            <input type="checkbox" />
            <span className="control" />
            He leído y acepto la <Link href="#" className="link">Política para envío de comunicaciones comerciales</Link>.
          </label>

          <button className="btn-primary" type="submit">Solicitar información</button>
        </form>
      </div>
    </section>
  );
};

export default SectionInfo;
