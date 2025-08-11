import Link from 'next/link';

const InfoCards: React.FC = () => {
  return (
    <section className="flex gap-5 p-10 flex-wrap justify-center">
      <div
        className="flex-1 min-w-[280px] rounded-2xl overflow-hidden relative text-white text-center flex flex-col justify-center items-center p-5 shadow-lg bg-cover bg-center"
        style={{ backgroundImage: 'url(\'/images/slider3.jpg\')' }}
      >
        <h3 className="m-0 text-2xl font-extrabold">Lorem ipsum dolor sit amet</h3>
        <div className="border-2 border-white px-5 py-2.5 rounded-xl my-5 text-2xl font-extrabold">Lorem</div>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>
      <div className="flex-1 min-w-[280px] rounded-2xl overflow-hidden relative text-white text-center flex flex-col justify-center items-center p-5 shadow-lg bg-lp-blue">
        <h3 className="m-0 text-2xl font-extrabold">Lorem ipsum dolor sit amet</h3>
        <p className="mt-5 text-lg font-bold">Lorem ipsum <span className="text-lp-yellow">Habitat</span></p>
        <div className="bg-white text-lp-blue px-5 py-2.5 rounded-lg font-extrabold cursor-pointer mt-5 inline-flex items-center gap-2">▶ Suscríbete</div>
      </div>
    </section>
  );
};

export default InfoCards;