import Link from 'next/link';

const ReferAndWin: React.FC = () => {
  return (
    <section className="refer-section">
      <div className="container">
        <div className="refer-panel">
          <h2 className="refer-title">¡Refiere y gana!</h2>
          <p className="refer-sub">Beneficio exclusivo solo para clientes</p>
          <ul className="refer-list">
            <li className="refer-item">
              <span className="check"></span>Si eres propietario o copropietario de un lote con Los Portales, refiere amigos y familiares.
            </li>
            <li className="refer-item">
              <span className="check"></span>Registra sus datos y si compran, podrás ganar una tarjeta de consumo.
            </li>
            <li className="refer-item">
              <span className="check"></span>A más referidos más opciones de ganar.
            </li>
          </ul>
          <button className="refer-btn">
            Más información <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReferAndWin;