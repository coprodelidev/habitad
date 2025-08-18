"use client";

import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import InfoCards from '@/components/InfoCards';
import Nav from '@/components/Nav';
import ReferAndWin from '@/components/ReferAndWin';
import SectionInfo from '@/components/SectionInfo';
import { Testimonials } from '@/components/Testimonials';
import TopBar from '@/components/TopBar';



export default function Home() {
  return (
    <>
      <Hero />
      <Nav />
      <SectionInfo />
      <Testimonials />


      <InfoCards />
      <ReferAndWin />
      <Footer />
    </>
  );
}