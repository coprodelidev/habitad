import Link from 'next/link';

const ReferAndWin: React.FC = () => {
  return (
    <section
      className="relative bg-cover bg-center py-16"
      style={{ backgroundImage: 'url(/images/slider1.jpg)' }}
    >
      <div className="max-w-7xl mx-auto px-5">
        <div className="bg-white rounded-3xl max-w-2xl px-8 py-8 ml-12 shadow-2xl">
          <h2 className="text-lp-blue text-4xl leading-tight m-0 mb-2 font-extrabold">¡Refiere y gana!</h2>
          <p className="text-gray-900 font-extrabold m-0 mb-5 text-xl">Lorem ipsum dolor sit amet</p>
          <ul className="list-none m-0 mb-6 p-0 flex flex-col gap-5">
            <li className="flex items-start text-[#164e8e] text-xl leading-snug">
              <span className="flex-shrink-0 w-7 h-7 border-2 border-lp-blue rounded-full inline-flex items-center justify-center mr-3.5 text-lp-blue font-black">✓</span>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </li>
            <li className="flex items-start text-[#164e8e] text-xl leading-snug">
              <span className="flex-shrink-0 w-7 h-7 border-2 border-lp-blue rounded-full inline-flex items-center justify-center mr-3.5 text-lp-blue font-black">✓</span>
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </li>
            <li className="flex items-start text-[#164e8e] text-xl leading-snug">
              <span className="flex-shrink-0 w-7 h-7 border-2 border-lp-blue rounded-full inline-flex items-center justify-center mr-3.5 text-lp-blue font-black">✓</span>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </li>
          </ul>
          <button className="bg-lp-yellow border-none rounded-full px-6 py-4 font-extrabold inline-flex items-center gap-3 cursor-pointer shadow-lg">
            Más información <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReferAndWin;