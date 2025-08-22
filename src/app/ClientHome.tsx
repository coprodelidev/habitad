"use client";

import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import InfoCards from '@/components/InfoCards';
import Nav from '@/components/Nav';
import ReferAndWin from '@/components/ReferAndWin';
import SectionInfo from '@/components/SectionInfo';
import { Testimonials } from '@/components/Testimonials';

export default function ClientHome() {
  return (
    <>
      <Nav />
      <Hero />
      <SectionInfo />
      <Testimonials />
      <ReferAndWin />
      <Footer />
    </>
  );
}
