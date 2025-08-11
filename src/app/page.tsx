import Footer from '/home/user/studio/src/components/Footer';
import Hero from '/home/user/studio/src/components/Hero';
import InfoCards from '/home/user/studio/src/components/InfoCards';
import Nav from '/home/user/studio/src/components/Nav';
import ReferAndWin from '/home/user/studio/src/components/ReferAndWin';
import SectionInfo from '/home/user/studio/src/components/SectionInfo';
import Testimonials from '/home/user/studio/src/components/Testimonials';
import TopBar from '/home/user/studio/src/components/TopBar';

export default function Home() {
  return (
    <>
      <TopBar />
      <Nav />
      <Hero />
      <SectionInfo />
      <Testimonials />
      <InfoCards />
      <ReferAndWin />
      <Footer />
    </>
  );
}