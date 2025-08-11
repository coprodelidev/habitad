import Link from 'next/link';

const SectionInfo: React.FC = () => {
  return (
    <section className="section-info">
      <img src="https://picsum.photos/800/600?random=2" alt="familia" />
      <div className="form-box">
        <h2>Quiero recibir información</h2>
        <input type="text" placeholder="Nombre*" />
        <input type="text" placeholder="Apellidos*" />
        <input type="text" placeholder="Nro. de documento*" />
        <input type="text" placeholder="Teléfono*" />
        <input type="email" placeholder="Correo electrónico*" />
        <select>
          <option>Ubicación</option>
        </select>
        <select>
          <option>No hay proyectos disponibles</option>
        </select>
        <label>
          <input type="checkbox" /> He leído y acepto el Tratamiento de mis datos personales.
        </label>
        <label>
          <input type="checkbox" /> He leído y acepto la Política para envío de comunicaciones comerciales.
        </label>
        <button>Solicitar información</button>
      </div>
    </section>
  );
};

export default SectionInfo;