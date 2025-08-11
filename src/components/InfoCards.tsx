'use client';

const InfoCards: React.FC = () => {
  return (
    <section className="flex flex-wrap justify-center gap-5 p-10">
      <div
        className="relative flex-1 min-w-[280px] rounded-2xl overflow-hidden text-white text-center flex flex-col justify-center items-center p-5 shadow-md"
        style={{ backgroundImage: "url('/images/slider2.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <h3 className="text-[22px] font-extrabold">Lorem ipsum dolor sit amet</h3>
        <div className="border-2 border-white py-2 px-5 rounded-lg my-5 text-[24px] font-extrabold">Lorem</div>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>
      <div className="flex-1 min-w-[280px] rounded-2xl overflow-hidden text-white text-center flex flex-col justify-center items-center p-5 shadow-md bg-[#0074bc]">
        <h3 className="text-[22px] font-extrabold">Lorem ipsum dolor sit amet</h3>
        <p className="mt-5 text-[18px] font-bold">Lorem ipsum <span className="text-[#ffc107]">Habitat</span></p>
        <div
          className="bg-white text-[#0074bc] py-2 px-5 rounded-lg font-extrabold cursor-pointer mt-5 inline-flex items-center gap-2"
          onClick={() => console.log('click suscríbete')}
        >
          ▶ Suscríbete
        </div>
      </div>
    </section>
  );
};

export default InfoCards;
