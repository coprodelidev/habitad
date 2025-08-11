import Link from 'next/link';

const TopBar: React.FC = () => {
  return (
    <div className="topbar">
      <div className="container">
        <div className="row">
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