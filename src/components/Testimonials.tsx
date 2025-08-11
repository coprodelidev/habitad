import React from 'react';

export const Testimonials: React.FC = () => {
  return (
    <section className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-5 px-5 py-10">
      {/* Card 1 */}
      <article className="flex-1 min-w-[280px] max-w-[350px] overflow-hidden rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <img src="/images/placeholder_image.jpg" alt="persona1" className="block w-full" />
        <div className="p-5 text-center">
          <h3 className="mb-2.5 font-extrabold text-[#0074bc]">“Lorem ipsum dolor sit amet”</h3>
          <p className="mb-3 text-sm text-[#333]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
          <div className="text-sm font-bold text-[#0074bc]">Lorem Ipsum</div>
          <div className="text-[13px] text-[#555]">Habitat - Lorem Ipsum</div>
        </div>
      </article>

      {/* Card 2 */}
      <article className="flex-1 min-w-[280px] max-w-[350px] overflow-hidden rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <img src="/images/placeholder_image.jpg" alt="persona2" className="block w-full" />
        <div className="p-5 text-center">
          <h3 className="mb-2.5 font-extrabold text-[#0074bc]">“Consectetur adipiscing elit”</h3>
          <p className="mb-3 text-sm text-[#333]">
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat.
          </p>
          <div className="text-sm font-bold text-[#0074bc]">Dolor Sitamet</div>
          <div className="text-[13px] text-[#555]">MiVivienda - Chilca</div>
        </div>
      </article>

      {/* Card 3 */}
      <article className="flex-1 min-w-[280px] max-w-[350px] overflow-hidden rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <img src="/images/placeholder_image.jpg" alt="persona3" className="block w-full" />
        <div className="p-5 text-center">
          <h3 className="mb-2.5 font-extrabold text-[#0074bc]">
            “Nuestro sueño hecho realidad en Chincha”
          </h3>
          <p className="mb-3 text-sm text-[#333]">
            Cumplimos el sueño de la casa propia con Coprodeli Habitad. En Chincha hallamos un lugar
            hermoso, accesible y con bono Techo Propio.
          </p>
          <div className="text-sm font-bold text-[#0074bc]">Eduardo Diaz</div>
          <div className="text-[13px] text-[#555]">Techo Propio - Chincha</div>
        </div>
      </article>
    </section>
  );
};

export default Testimonials;
