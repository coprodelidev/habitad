import React from 'react';

export const Testimonials: React.FC = () => {
  return (
    <section className="flex flex-wrap justify-center gap-5 p-10">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md max-w-[350px] flex-1">
        <img src="/images/slider1.jpg" alt="persona1" className="w-full" />
        <div className="p-5 text-center">
          <h3 className="text-[#0074bc] mb-2">“Lorem ipsum dolor sit amet”</h3>
          <p className="mb-3 text-sm text-[#333]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
          <div className="text-[#0074bc] text-sm font-bold">Lorem Ipsum</div>
          <div className="text-xs text-[#555]">Habitat - Lorem Ipsum</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-md max-w-[350px] flex-1">
        <img src="/images/slider2.jpg" alt="persona2" className="w-full" />
        <div className="p-5 text-center">
          <h3 className="text-[#0074bc] mb-2">“Consectetur adipiscing elit”</h3>
          <p className="mb-3 text-sm text-[#333]">
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat.
          </p>
          <div className="text-[#0074bc] text-sm font-bold">Dolor Sitamet</div>
          <div className="text-xs text-[#555]">MiVivienda - Chilca</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-md max-w-[350px] flex-1">
        <img src="/images/slider3.jpg" alt="persona3" className="w-full" />
        <div className="p-5 text-center">
          <h3 className="text-[#0074bc] mb-2">“Nuestro sueño hecho realidad en Chincha”</h3>
          <p className="mb-3 text-sm text-[#333]">
            Cumplimos el sueño de la casa propia con Los Portales. En Chincha hallamos un lugar
            hermoso, accesible y con bono Techo Propio.
          </p>
          <div className="text-[#0074bc] text-sm font-bold">Eduardo Diaz</div>
          <div className="text-xs text-[#555]">Techo Propio - Chincha</div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
