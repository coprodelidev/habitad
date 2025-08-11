import React from 'react';
import Link from 'next/link';

const Testimonials: React.FC = () => {
  return (
    <section className="testimonials">
      <div className="testimonial">
        <img src="https://picsum.photos/400/300?random=3" alt="persona1" />
        <div className="text">
          <h3>“Inversión con disfrute asegurado”</h3>
          <p>Compré con Los Portales para invertir y alquilar, pero también para disfrutar. Todo el proceso fue fácil y sin problemas.</p>
          <div className="author">Marcial Contreras</div>
          <div className="project">HU2 - Lima Sur Mirador del Prado</div>
        </div>
      </div>
      <div className="testimonial">
        <img src="https://picsum.photos/400/300?random=4" alt="persona2" />
        <div className="text">
          <h3>“Mi inversión con futuro en Chilca”</h3>
          <p>Compramos en Los Portales por su transparencia, buen precio y el gran potencial de Chilca. ¡Nuestra casa soñada ya es realidad!</p>
          <div className="author">Patricia Martinelli</div>
          <div className="project">MiVivienda - Chilca</div>
        </div>
      </div>
      <div className="testimonial">
        <img src="https://picsum.photos/400/300?random=5" alt="persona3" />
        <div className="text">
          <h3>“Nuestro sueño hecho realidad en Chincha”</h3>
          <p>Cumplimos el sueño de la casa propia con Los Portales. En Chincha hallamos un lugar hermoso, accesible y con bono Techo Propio.</p>
          <div className="author">Eduardo Diaz</div>
          <div className="project">Techo Propio - Chincha</div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;