import Link from 'next/link';

const InfoCards: React.FC = () => {
  return (
    <section className="info-cards">
      <div className="card bg-img">
        <h3>Somos Líderes en el Rubro Inmobiliario</h3>
        <div className="years">+65 Años</div>
        <p>Mejorando tu ciudad, mejorando tu vida</p>
      </div>
      <div className="card bg-blue">
        <h3>¡Entérate cómo invertir inteligentemente!</h3>
        <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: '700' }}>Hablando con <span style={{ color: 'var(--lp-yellow)' }}>Propiedad</span> de Los Portales</p>
        <div className="subscribe-btn">▶ Suscríbete</div>
      </div>
    </section>
  );
};

export default InfoCards;