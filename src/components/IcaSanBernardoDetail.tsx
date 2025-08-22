'use client';

import React from 'react';
import ProjectDetailTemplate, { type FeatureItem } from './ProjectDetailTemplate';
import { Trees, Route, Ruler, HandCoins, MapPin } from 'lucide-react';

export default function IcaSanBernardoDetail() {
  const features: FeatureItem[] = [
    { label: 'Áreas verdes', Icon: Trees },
    { label: 'Vías de acceso', Icon: Route },
    { label: 'Lotes amplios', Icon: Ruler },
    { label: 'Crédito directo', Icon: HandCoins },
    { label: 'Buena ubicación', Icon: MapPin },
  ];

  // Reemplaza por el embed real cuando lo tengas:
  const MAP_EMBED_FALLBACK =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1184.329934611341!2d-75.80947486645502!3d-14.065955537013645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9110e4a72c514841%3A0x52f1fe9788525c53!2sLas%20Palmeras%20de%20San%20Fernando!5e0!3m2!1ses!2ses!4v1755880895715!5m2!1ses!2ses';

  return (
    <ProjectDetailTemplate
      cover="/images/slider-5.jpg"
      title="Ica San Bernardo"
      subtitle="La Planicie de Cañete"
      location="Alt. Km 130 Panamericana Sur"
      badges={['Crédito directo']}
      description="Lotes con buena conectividad y proyección de crecimiento urbano."
      features={features}
      mapEmbedUrl={MAP_EMBED_FALLBACK}
    />
  );
}
