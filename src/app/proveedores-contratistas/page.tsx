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
  title: 'Proveedores y Contratistas | Habitad',
  description:
    'Registro de proveedores y contratistas: especialidades, requisitos, proceso de homologación y contacto para licitaciones.',
};

export default function PageProveedoresContratistas() {
  return (
    <main className="bg-white">
           <Nav />
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[300px] md:h-[380px]">
          <Image
            src="/images/slider-5.jpg"
            alt="Proveedores y Contratistas"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324]/85 via-[#0b1324]/40 to-transparent" />
          <div className="absolute bottom-6 left-0 right-0">
            <div className="mx-auto max-w-[1200px] px-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/30">
                <Handshake className="h-4 w-4" /> Alianzas y licitaciones
              </div>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Proveedores y Contratistas
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/90">
                Colaboramos con socios confiables para urbanizaciones, vivienda e infraestructura
                complementaria, cuidando calidad, seguridad y plazos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(16,24,40,.08)] md:p-8">
          <h2 className="text-xl font-extrabold text-[#0E08C9]">¿Con quiénes colaboramos?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Buscamos proveedores y contratistas con experiencia, solvencia y enfoque en calidad/
            seguridad. Integramos especialidades para cumplir plazos y presupuestos.
          </p>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section className="mx-auto max-w-[1200px] px-5 pb-6">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Especialidades</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              Icon: Building2,
              title: 'Obra civil y edificación',
              desc: 'Movimiento de tierras, estructuras de concreto, albañilería, acabados.',
            },
            {
              Icon: Wrench,
              title: 'Instalaciones',
              desc: 'Eléctrica, sanitaria, gas, HVAC, riego tecnificado y telecomunicaciones.',
            },
            {
              Icon: Truck,
              title: 'Materiales y logística',
              desc: 'Concreto, acero, agregados, asfaltos, prefabricados, transporte y maquinaria.',
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
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Requisitos de registro</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              Icon: ClipboardList,
              title: 'Documentación legal',
              bullets: ['RUC/NIF vigente', 'Poder del representante legal', 'Acta o escritura constitutiva'],
            },
            {
              Icon: Shield,
              title: 'Seguridad y calidad',
              bullets: ['Política SSOMA', 'Certificaciones (si aplica)', 'Procedimientos y evidencias'],
            },
            {
              Icon: FileText,
              title: 'Experiencia y solvencia',
              bullets: ['Referencias de obras similares', 'Estados financieros', 'Relación de equipos y personal'],
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
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Proceso de homologación</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {[
            { n: 1, title: 'Solicitud', desc: 'Envío de ficha y documentos.' },
            { n: 2, title: 'Evaluación', desc: 'Revisión técnica, legal y financiera.' },
            { n: 3, title: 'Visita', desc: 'Verificación de planta y capacidades (si aplica).' },
            { n: 4, title: 'Alta', desc: 'Registro en el padrón de proveedores.' },
            { n: 5, title: 'Licitación', desc: 'Participación en invitaciones y concursos.' },
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
          <h4 className="font-extrabold">¿Quieres registrarte?</h4>
          <p className="mt-1 text-sm text-white/90">
            Comparte tu especialidad y cobertura. Te contactaremos para próximos procesos.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b1324] shadow hover:bg-white/90"
            >
              Enviar propuesta
            </Link>
            <Link
              href="/construimos-y-terceros"
              className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/15"
            >
              Ver capacidades de obra
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
              ¿Cómo reciben órdenes de compra?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Por correo con términos y anexos. Toda entrega requiere OC y guía/acta firmada.
            </p>
          </details>

          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-semibold text-[#0b1324]">
              ¿Plazos de pago?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Según contrato y recepción conforme (típicamente 15–30 días).
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}
