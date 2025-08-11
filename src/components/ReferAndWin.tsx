
const ReferAndWin: React.FC = () => {
  return (
    <section
      className="relative bg-center bg-cover py-16"
      style={{ backgroundImage: "url('/images/slider3.jpg')" }}
    >
      <div className="max-w-[640px] bg-white rounded-[28px] p-8 md:ml-12 shadow-[0_24px_48px_rgba(16,24,40,0.18)]">
        <h2 className="text-[#0074bc] text-[40px] leading-tight font-extrabold mb-2">¡Refiere y gana!</h2>
        <p className="text-[#0b1324] font-extrabold text-[20px] mb-5">Lorem ipsum dolor sit amet</p>
        <ul className="list-none m-0 p-0 flex flex-col gap-5 mb-6">
          <li className="flex items-start text-[#164e8e] text-[20px] leading-snug">
            <span className="flex-shrink-0 w-7 h-7 border-2 border-[#0074bc] rounded-full flex items-center justify-center mr-3 font-extrabold text-[#0074bc]">✓</span>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </li>
          <li className="flex items-start text-[#164e8e] text-[20px] leading-snug">
            <span className="flex-shrink-0 w-7 h-7 border-2 border-[#0074bc] rounded-full flex items-center justify-center mr-3 font-extrabold text-[#0074bc]">✓</span>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </li>
          <li className="flex items-start text-[#164e8e] text-[20px] leading-snug">
            <span className="flex-shrink-0 w-7 h-7 border-2 border-[#0074bc] rounded-full flex items-center justify-center mr-3 font-extrabold text-[#0074bc]">✓</span>
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </li>
        </ul>
        <button
          className="bg-[#ffc107] border-none rounded-full py-4 px-6 font-extrabold inline-flex items-center gap-3 shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
          onClick={() => console.log('click más información')}
        >
          Más información <span className="text-lg">→</span>
        </button>
      </div>
    </section>
  );
};

export default ReferAndWin;
