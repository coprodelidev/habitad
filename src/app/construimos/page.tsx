import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Handshake,
  Ruler,
  Trees,
  Route,
  Church,
  Hammer,
  ClipboardCheck,
  Shield,
  Clock,
  Workflow,
  ClipboardList,
  HardHat,
} from 'lucide-react';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Construimos y Terceros | Habitad',
  description:
    'Servicios de construcción propia y para terceros: urbanizaciones, viviendas y equipamiento urbano. Modalidades llave en mano, administración y por etapas.',
};

type Service = { Icon: LucideIcon; title: string; desc: string };
type Mode = { title: string; bullets: string[]; Icon: LucideIcon };
type Step = { num: number; title: string; desc: string; Icon: LucideIcon };

const heroImg = '/images/sanfernando.jpg'; // reutilizamos tu imagen

const servicios: Service[] = [
  { Icon: Building2, title: 'Urbanizaciones completas', desc: 'Trazado, habilitación urbana, pistas, veredas, redes y señalización.' },
  { Icon: Hammer, title: 'Vivienda y ampliaciones', desc: 'Estructuras de concreto armado y acabados de calidad, listas para crecer.' },
  { Icon: Trees, title: 'Parques y áreas verdes', desc: 'Diseño paisajístico, riego tecnificado y mobiliario urbano.' },
  { Icon: Church, title: 'Equipamiento urbano', desc: 'Colegios, iglesias, centros recreativos y zonas deportivas.' },
  { Icon: Route, title: 'Obras viales internas', desc: 'Asfaltado, sardineles, accesos y control de aguas pluviales.' },
  { Icon: ClipboardCheck, title: 'Gestión técnica', desc: 'Planos, metrados, presupuestos y control de calidad (QA/QC).' },
];

const modalidades: Mode[] = [
  {
    title: 'Llave en mano (precio cerrado)',
    bullets: [
      'Alcance completo: diseño, procura y construcción.',
      'Plazos, hitos y penalidades definidos en contrato.',
    ],
    Icon: Shield,
  },
  {
    title: 'Administración (cost + fee)',
    bullets: [
      'Transparencia en costos y compras.',
      'Ideal para proyectos con ajustes progresivos.',
    ],
    Icon: ClipboardList,
  },
  {
    title: 'Por etapas',
    bullets: [
      'Ejecución modular según prioridad y caja.',
      'Permite avanzar habilitación mientras se gestionan licencias adicionales.',
    ],
    Icon: Workflow,
  },
];

const pasos: Step[] = [
  { num: 1, title: 'Reunión y alcance', desc: 'Levantamiento de objetivos, presupuesto y plazos.', Icon: Handshake },
  { num: 2, title: 'Anteproyecto y propuesta', desc: 'Planos base, metrados, cronograma y oferta económica.', Icon: Ruler },
  { num: 3, title: 'Permisos y arranque', desc: 'Check de requisitos, seguridad y logística de obra.', Icon: Shield },
  { num: 4, title: 'Ejecución y control', desc: 'Bitácora semanal, avances medibles y control de calidad.', Icon: HardHat },
  { num: 5, title: 'Entrega y postventa', desc: 'Recepción, manuales y atención de observaciones.', Icon: Clock },
];

export default function PageConstruimosYTerceros() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="relative">
        <Nav />
        <div className="relative h-[300px] md:h-[380px]">
          <Image src={heroImg} alt="Construcción y servicios para terceros" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324]/85 via-[#0b1324]/40 to-transparent" />
          <div className="absolute bottom-6 left-0 right-0">
            <div className="mx-auto max-w-[1200px] px-5">
              <div className="inline-block rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/30">
                Servicios de construcción
              </div>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Construimos y Terceros
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/90">
                Ejecutamos proyectos propios y para terceros: urbanizaciones, vivienda y equipamiento urbano,
                con control de calidad y cumplimiento de plazos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(16,24,40,.08)] md:p-8">
          <h2 className="text-xl font-extrabold text-[#0E08C9]">¿Qué hacemos?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Desarrollamos y construimos con estándares de seguridad y calidad. También trabajamos
            con aliados y clientes bajo modalidades flexibles que se adaptan al alcance de cada proyecto.
            Nuestro enfoque es práctico: planificación clara, compras eficientes y ejecución con control.
          </p>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="mx-auto max-w-[1200px] px-5 pb-6">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Servicios</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map(({ Icon, title, desc }) => (
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

      {/* MODALIDADES */}
      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Modalidades de trabajo</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {modalidades.map(({ title, bullets, Icon }) => (
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
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Cómo trabajamos</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {pasos.map(({ num, title, desc, Icon }) => (
            <div
              key={num}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eef6ff]">
                <Icon className="h-5 w-5 text-[#0E08C9]" strokeWidth={2.6} />
              </div>
              <div className="mt-2 text-[11px] font-semibold text-[#0E08C9]">Paso {num}</div>
              <h4 className="mt-1 text-sm font-semibold text-[#0b1324]">{title}</h4>
              <p className="mt-1 text-xs text-slate-700">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POR QUÉ NOSOTROS */}
      <section className="mx-auto max-w-[1200px] px-5 pb-10">
        <div className="rounded-2xl border border-slate-200 bg-[#0E08C9] p-6 text-white shadow-md md:p-8">
          <h3 className="text-lg font-extrabold">¿Por qué con nosotros?</h3>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <li className="flex items-start gap-2">
              <Shield className="mt-[2px] h-4 w-4 flex-none" />
              Control de calidad y seguridad en obra.
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-[2px] h-4 w-4 flex-none" />
              Plazos realistas con seguimiento semanal.
            </li>
            <li className="flex items-start gap-2">
              <Handshake className="mt-[2px] h-4 w-4 flex-none" />
              Cercanía con el cliente y reportes claros.
            </li>
            <li className="flex items-start gap-2">
              <Building2 className="mt-[2px] h-4 w-4 flex-none" />
              Experiencia en urbanizaciones y vivienda.
            </li>
          </ul>

          <div className="mt-5">
            <Link
              href="/contacto"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b1324] shadow hover:bg-white/90"
            >
              Solicitar propuesta
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ (sin JS, accesible) */}
      <section className="mx-auto max-w-[1200px] px-5 pb-14">
        <h3 className="mb-4 text-lg font-extrabold text-[#0b1324]">Preguntas frecuentes</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-semibold text-[#0b1324]">
              ¿Trabajan con proveedores y contratistas externos?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Sí. Contamos con red de terceros para especialidades. Integramos compras y supervisión
              para asegurar calidad y costos.
            </p>
          </details>

          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-semibold text-[#0b1324]">
              ¿Pueden iniciar por etapas pequeñas?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Podemos empezar por accesos, movimiento de tierras o redes básicas mientras se gestiona
              el resto de permisos y financiamiento.
            </p>
          </details>

          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-semibold text-[#0b1324]">
              ¿Qué documentación entregan al finalizar?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Entregamos planos conforme a obra, manuales, actas de recepción y garantías de equipos/materiales.
            </p>
          </details>

          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-semibold text-[#0b1324]">
              ¿Qué tan rápido obtengo una propuesta?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Tras la reunión de alcance, usualmente 5–7 días para anteproyecto, metrados y cronograma preliminar.
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}
