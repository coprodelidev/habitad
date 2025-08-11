import Link from 'next/link';

const TopBar: React.FC = () => {
  return (
    <div className="topbar">
      <div className="container">
        <div className="row">
          <Link href="#">Mi cuenta</Link>
          <Link href="#">Paga aquí</Link>
          <Link href="#">Blog</Link>
          <Link href="#">Compra de Terrenos</Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;