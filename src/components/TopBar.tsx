import Link from 'next/link';

const TopBar: React.FC = () => {
  return (
    <div className="bg-[#0E08C9] text-white text-[14px]">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="flex justify-end gap-[28px] py-3">
          <Link href="#" className="hover:opacity-90">Lorem Ipsum</Link>
          <Link href="#" className="hover:opacity-90">Dolor Sit</Link>
          <Link href="#" className="hover:opacity-90">Amet Consectetur</Link>
          <Link href="#" className="hover:opacity-90">Adipiscing Elit</Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
