import Link from 'next/link';

const InfoCards: React.FC = () => {
  return (
    <section className="info-cards">
 <div className="card bg-img" style={{ backgroundImage: 'url(\'/images/placeholder_image.jpg\')' }}>
 <h3>Lorem ipsum dolor sit amet</h3>
 <div className="years">Lorem</div>
 <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>
      <div className="card bg-blue">
 <h3>Lorem ipsum dolor sit amet</h3>
 <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: '700' }}>Lorem ipsum <span style={{ color: 'var(--lp-yellow)' }}>Habitat</span></p>
        <div className="subscribe-btn">▶ Suscríbete</div>
      </div>
    </section>
  );
};

export default InfoCards;