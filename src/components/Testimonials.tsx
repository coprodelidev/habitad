import React from 'react';
import Link from 'next/link';

const Testimonials: React.FC = () => {
  return (
    <section className="testimonials">
      <div className="testimonial">
        <img src="https://picsum.photos/400/300?random=3" alt="persona1" />
        <div className="text">
          <h3>“Lorem ipsum dolor sit amet”</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <div className="author">Lorem Ipsum</div>
          <div className="project">Habitat - Lorem Ipsum</div>
        </div>
      </div>
      <div className="testimonial">
        <img src="https://picsum.photos/400/300?random=4" alt="persona2" />
        <div className="text">
          <h3>“Consectetur adipiscing elit”</h3>
          <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <div className="author">Dolor Sitamet</div>
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