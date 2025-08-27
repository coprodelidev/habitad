import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  Handshake,
  Building2,
  Truck,
  Wrench,
  Shield,
  ClipboardList,
  Clock,
  FileText,
} from 'lucide-react';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Camposanto | Habitad',
  description:
    'Plan maestro, habilitación y operación de camposantos: nichos y columbarios, capilla y salas de velación, áreas verdes, vialidad interna y cumplimiento sanitario/municipal.',
};

export default function PageCamposanto() {
  return (
    <main className="bg-white">
      <Nav />

      {/* HERO */}
      <section className="relative">
        <div className="relative h-[300px] md:h-[380px]">
          <Image
            src="/images/slider-5.jpg" // cambia por /images/camposanto.jpg si lo tienes
            alt="Camposanto"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324]/85 via-[#0b1324]/40 to-transparent" />
          <div className="absolute bottom-6 left-0 right-0">
            <div className="mx-auto max-w-[1200px] px-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/30">
                <Handshake className="h-4 w-4" /> Plan maestro y operación
              </div>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Camposanto
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/90">
                Diseñamos, habilitamos y operamos espacios dignos y sostenibles: nichos y
                columbarios, capilla, áreas verdes y vialidad interna, cumpliendo normativa
                sanitaria y municipal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(16,24,40,.08)] md:p-8">
          <h2 className="text-xl font-extrabold text-[#0E08C9]">¿Qué incluye?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Un camposanto requiere visión de largo plazo, respeto por la memoria y cumplimiento
            regulatorio. Proyectamos fases claras, control de costos y estándares de seguridad
            para una operación sencilla de mantener en el tiempo.
          </p>
        </div>
      </section>

      {/* COMPONENTES */}
      <section className="mx-auto max-w-[1200px] px-5 pb-6">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Componentes principales</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              Icon: Building2,
              title: 'Nichos y columbarios',
              desc: 'Sistemas modulares y prefabricados, escalables y de bajo mantenimiento.',
            },
            {
              Icon: Wrench,
              title: 'Capilla y salas de velación',
              desc: 'Espacios de acogida con accesibilidad, acústica y confort térmico.',
            },
            {
              Icon: Truck,
              title: 'Vialidad interna y accesos',
              desc: 'Trazos, pavimentos, drenaje, iluminación, cercos y control de ingresos.',
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
                  <h4 className="font-semibold text-[#0b1324]">{title}</h4>
                  <p className="mt-1 text-sm text-slate-700">{desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* REQUISITOS */}
      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Requisitos sanitarios y municipales</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              Icon: ClipboardList,
              title: 'Normativa y autorizaciones',
              bullets: ['Zonificación/uso de suelo', 'Autorización sanitaria', 'Gestión ambiental (según aplique)'],
            },
            {
              Icon: Shield,
              title: 'Seguridad y operación',
              bullets: ['Plan SSOMA', 'Protocolos de inhumación y bioseguridad', 'Plan de mantenimiento'],
            },
            {
              Icon: FileText,
              title: 'Documentación técnica',
              bullets: ['Plan maestro y planos', 'Metrados y presupuesto', 'Cronograma y reglamento interno'],
            },
          ].map(({ Icon, title, bullets }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,.10)]"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-[#0E08C9]" strokeWidth={2.6} />
                <h4 className="font-semibold text-[#0b1324]">{title}</h4>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
                {bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* PROCESO */}
      <section className="mx-auto max-w-[1200px] px-5 pb-10">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Fases del proyecto</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {[
            { n: 1, title: 'Diagnóstico', desc: 'Suelos, topografía, normativa y entorno.' },
            { n: 2, title: 'Anteproyecto', desc: 'Plan maestro, metrados y presupuesto base.' },
            { n: 3, title: 'Permisos', desc: 'Tramitología sanitaria, municipal y ambiental.' },
            { n: 4, title: 'Ejecución', desc: 'Paquetes: nichos/columbarios, vialidad, capilla, áreas verdes.' },
            { n: 5, title: 'Puesta en marcha', desc: 'Reglamentos, protocolos y mantenimiento.' },
          ].map((p) => (
            <div
              key={p.n}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eef6ff]">
                <Clock className="h-5 w-5 text-[#0E08C9]" strokeWidth={2.6} />
              </div>
              <div className="mt-2 text-[11px] font-semibold text-[#0E08C9]">Paso {p.n}</div>
              <h4 className="mt-1 text-sm font-semibold text-[#0b1324]">{p.title}</h4>
              <p className="mt-1 text-xs text-slate-700">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-[#0E08C9] p-6 text-white shadow">
          <h4 className="font-extrabold">¿Quieres impulsar un camposanto?</h4>
          <p className="mt-1 text-sm text-white/90">
            Conversemos sobre tu terreno, capacidad inicial y fases de crecimiento.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b1324] shadow hover:bg-white/90"
            >
              Solicitar reunión
            </Link>
            <Link
              href="/construimos-y-terceros"
              className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/15"
            >
              Ver modalidades de trabajo
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1200px] px-5 pb-14">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Preguntas frecuentes</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-semibold text-[#0b1324]">
              ¿Cumplen la normativa sanitaria y municipal?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Sí. Diseñamos y ejecutamos conforme a exigencias sanitarias, ambientales y de seguridad,
              con tramitología completa y protocolos operativos verificados.
            </p>
          </details>

          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-semibold text-[#0b1324]">
              ¿Se puede desarrollar por etapas?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Empezamos por cercado y accesos, primeros módulos de nichos/columbarios y servicios
              básicos, para operar pronto mientras se amplía la capacidad.
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}
