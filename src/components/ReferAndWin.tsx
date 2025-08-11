import Link from 'next/link';

const ReferAndWin: React.FC = () => {
  return (
    <section className="refer-section">
      <div className="container">
        <div className="refer-panel">
          <h2 className="refer-title">¡Refiere y gana!</h2>
          <p className="refer-sub">Lorem ipsum dolor sit amet</p>
          <ul className="refer-list">
            <li className="refer-item">
              <span className="check"></span>Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </li>
            <li className="refer-item">
              <span className="check"></span>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </li>
            <li className="refer-item">
              <span className="check"></span>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
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