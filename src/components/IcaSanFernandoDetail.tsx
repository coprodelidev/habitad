'use client';

import React from 'react';
import Image from 'next/image';
import {
  Trees,
  Route,
  Church,
  GraduationCap,
  Home,
  Ruler,
  BookOpen,
  Activity,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function IcaSanFernandoDetail() {
  const images = [
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 21.45.13.jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 21.45.14 (2).jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 21.45.14 (3).jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 21.45.14.jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 21.45.15 (1).jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 21.45.15.jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 21.45.55.jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 23.07.51.jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 23.07.52 (1).jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 23.07.52 (2).jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 23.07.52 (3).jpeg',
    '/images/icasanfernando/WhatsApp Image 2026-02-16 at 23.07.52.jpeg',
  ];

  return (
    <section className="mx-auto mb-10 max-w-[1200px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
      {/* Hero */}
      <div className="relative h-[320px] w-full md:h-[380px]">
        <Image
          src="/images/sanfernando.jpg"
          alt="Ica San Fernando"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324]/80 via-[#0b1324]/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">ICA SAN FERNANDO</h2>
          <div className="mt-2 flex items-center gap-2 text-sm opacity-90">
            <MapPin size={16} />
            <span>Ica, Carretera de Carhuaz, km 9, a 17 min del centro</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full bg-white/20 px-2 py-1 font-semibold">Crédito directo</span>
            <span className="rounded-full bg-white/20 px-2 py-1 font-semibold">ACTIVO</span>
          </div>
        </div>
      </div>

      {/* Slider de Imágenes */}
      <div className="px-6 py-8 md:px-12">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="relative h-[250px] overflow-hidden rounded-xl border border-slate-200">
                  <Image
                    src={image}
                    alt={`Ica San Fernando ${index + 1}`}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 gap-8 p-6 md:p-8">

        {/* Características de la Urbanización */}
        <div>
          <h3 className="mb-4 text-xl font-extrabold text-[#0b1324]">Características Urbanización San Fernando</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <Home className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">3,000 viviendas con estructura de concreto armado, de calidad, que pueden ser ampliadas por el propietario</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <Ruler className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">650 lotes de 90 m² o 120 m²</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <Trees className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">10 parques y uno zonal con amplias áreas verdes</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <Route className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">Pistas asfaltadas</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <BookOpen className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">2 colegios en funcionamiento</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <Church className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">Iglesia en funcionamiento</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <Activity className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">Centro recreativo con campos deportivos y piscina</span>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#eef6ff] p-4">
              <GraduationCap className="h-6 w-6 flex-shrink-0 text-[#0E08C9]" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#0b1324]">Próxima Universidad</span>
            </div>
          </div>
        </div>

        {/* CASAS */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="mb-4 inline-block rounded-full bg-[#0E08C9] px-4 py-2 text-sm font-bold text-white">
            CASAS
          </div>
          <h3 className="mb-3 text-2xl font-extrabold text-[#0b1324]">Urbanización San Fernando - Ica</h3>
          <p className="mb-4 text-sm leading-relaxed text-slate-700">
            La casa soñada, en un terreno de 90 m², con una edificación tradicional en material noble de concreto armado,
            que puedes ampliar y construir sobre él, ubicada en la Urb. San Fernando, al inicio de la Nueva Ica, una zona
            de constante revalorización, en la carretera a Carhuaz, a 17 min del centro de Ica.
          </p>
          <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-[#0b1324]">
              Valor S/ 54,685 incluidos los intereses
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Te damos crédito directo, que puedes pagar con una inicial del 15% y 84 cuotas de S/ 651
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-bold text-[#0b1324]">
              Requisitos para acceder a una casa Techo Propio:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span>Tener un ingreso familiar inferior a S/ 3,715</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span>No ser propietario de otra vivienda o terreno para vivienda a nivel nacional</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span>Conformar un grupo familiar</span>
              </li>
            </ul>
          </div>
        </div>

        {/* LOTES */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-green-50 to-white p-6">
          <div className="mb-4 inline-block rounded-full bg-[#0E08C9] px-4 py-2 text-sm font-bold text-white">
            LOTES
          </div>
          <h3 className="mb-3 text-2xl font-extrabold text-[#0b1324]">Urbanización San Fernando - Ica</h3>
          <p className="text-sm leading-relaxed text-slate-700">
            Si buscas lotes en Ica, este es el lugar ideal. Contamos con servicios completos: título de propiedad,
            pozo propio, luz, agua y desagüe, 2 colegios para que estudien tus niños, complejo deportivo y parroquia.
            Disfruta de varios parques y áreas verdes. ¡Es el mejor legado para tus hijos!
          </p>
        </div>

        {/* AMENIDADES / EQUIPAMIENTO */}
        <div>
          <h3 className="mb-4 text-xl font-extrabold text-[#0b1324]">Amenidades y Equipamiento</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Colegio San Fernando */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-[#0E08C9]" strokeWidth={2.5} />
                <h4 className="text-lg font-bold text-[#0b1324]">Colegio COPRODELI San Fernando</h4>
              </div>
              <p className="text-sm text-slate-700">
                Ya está en funcionamiento todos los grados de los niveles de Inicial, primaria y secundaria.
              </p>
            </div>

            {/* Colegio Asunción */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-[#0E08C9]" strokeWidth={2.5} />
                <h4 className="text-lg font-bold text-[#0b1324]">Colegio COPRODELI Asunción</h4>
              </div>
              <p className="text-sm text-slate-700">
                Inicio de funcionamiento, marzo del 2026 con inicial y primaria
              </p>
            </div>

            {/* Iglesia */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Church className="h-6 w-6 text-[#0E08C9]" strokeWidth={2.5} />
                <h4 className="text-lg font-bold text-[#0b1324]">Iglesia (Parroquia) San Fernando</h4>
              </div>
              <p className="text-sm text-slate-700">
                Se celebran misas y sacramentos los domingos y fiestas.
              </p>
            </div>

            {/* Complejo Deportivo */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-6 w-6 text-[#0E08C9]" strokeWidth={2.5} />
                <h4 className="text-lg font-bold text-[#0b1324]">Complejo Deportivo</h4>
              </div>
              <p className="text-sm text-slate-700">
                Se está terminando un complejo deportivo con campo de fútbol, piscina, área de juegos infantiles y cafetería-restaurante.
              </p>
            </div>

            {/* Parques */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Trees className="h-6 w-6 text-[#0E08C9]" strokeWidth={2.5} />
                <h4 className="text-lg font-bold text-[#0b1324]">Parques</h4>
              </div>
              <p className="text-sm text-slate-700">
                Ya se tienen los dos primeros parques y el parque central con una laguna tipo Huacachina.
              </p>
            </div>
          </div>
        </div>

        {/* Videos */}
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-[#0b1324]">Videos</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/kMuRRtkFtbI?autoplay=0&mute=0&controls=1&modestbranding=1&rel=0&playsinline=1"
                title="Ica San Fernando - Video 1"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/-9k3MGQ5u3s?autoplay=0&mute=0&controls=1&modestbranding=1&rel=0&playsinline=1"
                title="Ica San Fernando - Video 2"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>

        {/* Ubicación / Google Maps */}
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-[#0b1324]">Ubicación</h3>
          <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow md:h-[450px]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30961.514160820137!2d-75.84529868916019!3d-14.065998099999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9110e4a72c514841%3A0x52f1fe9788525c53!2sLas%20Palmeras%20de%20San%20Fernando!5e0!3m2!1ses!2ses!4v1771280865643!5m2!1ses!2ses"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title="Ica San Fernando - Mapa"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
