import Link from 'next/link';

const TopBar: React.FC = () => {
  return (
    <div className="bg-lp-blue text-white text-sm">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex justify-end gap-7 py-3">
          <Link href="#">Lorem Ipsum</Link>
          <Link href="#">Dolor Sit</Link>
          <Link href="#">Amet Consectetur</Link>
          <Link href="#">Adipiscing Elit</Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;