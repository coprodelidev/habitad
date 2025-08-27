'use client';

import ProjectDetailTemplate, { type FeatureItem } from './ProjectDetailTemplate';
import {
  Trees,
  Route,
  Church,
  GraduationCap,
  Home,
  Ruler,
  BookOpen,
  Activity,
} from 'lucide-react';

export default function IcaSanFernandoDetail() {
  const features: FeatureItem[] = [
    { label: '3,000 viviendas de concreto armado, ampliables', Icon: Home },
    { label: '650 lotes de 90 m² o 120 m²', Icon: Ruler },
    { label: '10 parques y 1 parque zonal', Icon: Trees },
    { label: 'Pistas asfaltadas', Icon: Route },
    { label: '2 colegios en funcionamiento', Icon: BookOpen },
    { label: 'Iglesia en funcionamiento', Icon: Church },
    { label: 'Centro recreativo con campos y piscina', Icon: Activity },
    { label: 'Próxima Universidad', Icon: GraduationCap },
  ];

  const MAP_EMBED =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1184.329934611341!2d-75.80947486645502!3d-14.065955537013645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9110e4a72c514841%3A0x52f1fe9788525c53!2sLas%20Palmeras%20de%20San%20Fernando!5e0!3m2!1ses!2ses!4v1755880895715!5m2!1ses!2ses';

  return (
    <ProjectDetailTemplate
      cover="/images/sanfernando.jpg"
      title="Ica San Fernando Lotes y Viviendas"
      subtitle="Km 180 Pan. Sur"
      location="Acceso directo por Panamericana Sur"
      badges={['Crédito directo', 'PRE VENTA']}
      description="Ica San Fernando es una urbanización consolidada con equipamiento urbano, áreas verdes y vías asfaltadas para una vida cómoda y segura."
      features={features}
      videoUrl="https://youtu.be/0MuWOPA369E?t=338"
      mapEmbedUrl={MAP_EMBED}
    />
  );
}
