'use client';

import React from 'react';
import ProjectDetailTemplate, { type FeatureItem } from './ProjectDetailTemplate';
import { Trees, Route, Building2, HandCoins, MapPin } from 'lucide-react';

export default function PiscoCondominioDetail() {
  const features: FeatureItem[] = [
    { label: 'Áreas verdes', Icon: Trees },
    { label: 'Pistas y veredas', Icon: Route },
    { label: 'Departamentos familiares', Icon: Building2 },
    { label: 'Cercano a servicios', Icon: MapPin },
    { label: 'Crédito directo', Icon: HandCoins },
  ];

  // Reemplaza por el embed real cuando lo tengas:
  const MAP_EMBED_FALLBACK =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1184.329934611341!2d-75.80947486645502!3d-14.065955537013645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9110e4a72c514841%3A0x52f1fe9788525c53!2sLas%20Palmeras%20de%20San%20Fernando!5e0!3m2!1ses!2ses!4v1755880895715!5m2!1ses!2ses';

  return (
    <ProjectDetailTemplate
      cover="/images/slider-5.jpg"
      title="Pisco Condominio"
      subtitle="Quintas Las Palmas"
      location="Av. Cáceres, cerca de Open Plaza y Univ. de Piura"
      badges={['Crédito directo', 'PRE VENTA']}
      description="Condominio con acceso a servicios y equipamiento urbano, pensado para la vida en familia."
      features={features}
      mapEmbedUrl={MAP_EMBED_FALLBACK}
    />
  );
}
