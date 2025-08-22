'use client';

import React from 'react';
import ProjectDetailTemplate, { type FeatureItem } from './ProjectDetailTemplate';
import { Trees, Route, Church, GraduationCap, Home, HandCoins } from 'lucide-react';

export default function IcaSanFernandoDetail() {
  const features: FeatureItem[] = [
    { label: 'Parques y amplias áreas verdes', Icon: Trees },
    { label: 'Pistas asfaltadas', Icon: Route },
    { label: 'Colegio e iglesia en funcionamiento', Icon: Church },
    { label: 'Próxima universidad', Icon: GraduationCap },
    { label: 'Viviendas con construcción de calidad', Icon: Home },
    { label: 'Financiamiento directo sin intereses', Icon: HandCoins },
  ];

  const MAP_EMBED =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1184.329934611341!2d-75.80947486645502!3d-14.065955537013645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9110e4a72c514841%3A0x52f1fe9788525c53!2sLas%20Palmeras%20de%20San%20Fernando!5e0!3m2!1ses!2ses!4v1755880895715!5m2!1ses!2ses';

  return (
    <ProjectDetailTemplate
      cover="/images/slider-5.jpg"
      title="Ica San Fernando"
      subtitle="Km 180 Pan. Sur"
      location="Acceso directo por Panamericana Sur"
      badges={['Crédito directo', 'PRE VENTA']}
      description="Ica San Fernando es una urbanización con áreas verdes, vías asfaltadas y equipamiento urbano clave para una vida cómoda y segura."
      features={features}
      mapEmbedUrl={MAP_EMBED}
    />
  );
}
