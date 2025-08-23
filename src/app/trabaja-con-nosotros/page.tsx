// src/app/trabaja-con-nosotros/page.tsx
import Nav from '@/components/Nav';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  Sparkles,
  Building2,
  HardHat,
  Trees,
  Route,
  ClipboardCheck,
  Handshake,
  Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trabaja con nosotros | Habitad',
  description:
    'Conoce lo que hacemos en Habitad y envíanos tu CV por correo para unirte al equipo.',
};

// 👇 Cambia este correo por el tuyo
const TALENTO_EMAIL = 'talento@habitad.com';

export default function PageTrabajaConNosotros() {
  const subject = encodeURIComponent('Postulación - [Área] - [Nombre y Apellidos]');
  const body = encodeURIComponent(
    [
      'Hola Habitad,',
      '',
      'Quisiera postular a la posición/área: [especifica aquí].',
      'Adjunto mi CV y datos de contacto.',
      '',
      'Nombre:',
      'Teléfono:',
      'Ubicación:',
      '',
      'Saludos,',
      '',
    ].join('\n'),
  );
  const mailHref = `mailto:${TALENTO_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <main className="bg-white">
      {/* NAV superior */}
      <Nav />

      {/* HERO */}
      <section className="relative">
        <div className="relative h-[300px] md:h-[380px]">
          <Image
            src="/images/slider-5.jpg"
            alt="Trabaja con nosotros"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324]/85 via-[#0b1324]/35 to-transparent" />
          <div className="absolute bottom-6 left-0 right-0">
            <div className="mx-auto max-w-[1200px] px-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/30">
                <Sparkles className="h-4 w-4" /> Talento Habitad
              </div>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Trabaja con nosotros
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/90">
                Construimos urbanizaciones, viviendas y equipamiento urbano con foco en calidad,
                seguridad y plazos. Si te mueve hacer que las cosas pasen, queremos conocerte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ HACEMOS */}
      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(16,24,40,.08)] md:p-8">
          <h2 className="text-xl font-extrabold text-[#0E08C9]">¿Qué hacemos en Habitad?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Diseñamos, habilitamos y construimos espacios para familias: desde trazado y obras de
            urbanización hasta viviendas de concreto armado y áreas verdes. Coordinamos equipos y
            proveedores para cumplir con lo prometido: especificaciones, presupuesto y cronograma.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Icon: Building2,
                title: 'Urbanizaciones',
                desc: 'Trazado, redes, pistas, veredas y señalización.',
              },
              {
                Icon: HardHat,
                title: 'Vivienda',
                desc: 'Estructuras de concreto y acabados listos para crecer.',
              },
              {
                Icon: Trees,
                title: 'Áreas verdes',
                desc: 'Parques, riego tecnificado y mobiliario urbano.',
              },
              {
                Icon: Route,
                title: 'Obras viales internas',
                desc: 'Asfaltado, sardineles y gestión pluvial.',
              },
              {
                Icon: ClipboardCheck,
                title: 'Gestión técnica',
                desc: 'Planos, metrados, costos y control de calidad.',
              },
              {
                Icon: Handshake,
                title: 'Trabajo en equipo',
                desc: 'Colaboración real con clientes y contratistas.',
              },
            ].map(({ Icon, title, desc }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-[#eef6ff] p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 ring-1 ring-slate-200">
                    <Icon className="h-6 w-6 text-[#0E08C9]" strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0b1324]">{title}</h3>
                    <p className="mt-1 text-sm text-slate-700">{desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ENVÍA TU CV */}
      <section className="mx-auto max-w-[1200px] px-5 pb-12">
        <div className="rounded-2xl border border-slate-200 bg-[#0E08C9] p-6 text-white shadow md:p-8">
          <h2 className="text-lg font-extrabold">¿Quieres sumarte?</h2>
          <p className="mt-1 text-sm text-white/90">
            Envíanos tu CV por correo con el asunto{' '}
            <span className="font-semibold">“Postulación - [Área] - [Nombre y Apellidos]”</span>.
            Cuéntanos brevemente dónde puedes aportar.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={mailHref}
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b1324] shadow hover:bg-white/90"
            >
              Enviar CV por correo
            </a>
            <a
              href={`mailto:${TALENTO_EMAIL}`}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/15"
            >
              {TALENTO_EMAIL}
            </a>
          </div>

          <ul className="mt-4 list-disc pl-5 text-xs text-white/80">
            <li>Adjunta CV en PDF (máx. 10 MB).</li>
            <li>Incluye teléfono y ciudad de residencia.</li>
            <li>Si tienes portafolio, agrega el enlace.</li>
          </ul>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] ring-1 ring-white/30">
            <Shield className="h-4 w-4" />
            Cuidamos tus datos y solo los usamos para procesos de selección.
          </div>
        </div>
      </section>
    </main>
  );
}
