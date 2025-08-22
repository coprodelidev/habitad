'use client';

import Image from 'next/image';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type FeatureItem = { label: string; Icon: LucideIcon };

export type RelatedProject = {
  id: string;
  cover: string;
  /** Usamos el nombre tal como aparece en el menú superior (region). */
  title: string;
  subtitle?: string;
  location?: string;
  badges?: string[];
  priceFromLabel?: string;
  href?: string;
};

export type ProjectDetailTemplateProps = {
  cover: string;
  title: string;
  subtitle?: string;
  location?: string;
  badges?: string[];
  priceFromLabel?: string;
  cashPriceLabel?: string;
  description?: string;
  features: FeatureItem[];
  /** URL de YouTube (watch o youtu.be). Si no se pasa, usamos el default con autoplay. */
  videoUrl?: string;
  /** URL de Google Maps Embed. */
  mapEmbedUrl?: string;
  /** Identificador del proyecto actual para excluirlo en la lista inferior. */
  currentId?: string;
  /** También excluimos por título (region) si lo pasas. */
  currentTitle?: string;
  /** Todos los condominios del sitio (para mostrar debajo del mapa). */
  condominios?: RelatedProject[];
  onSelectCondominio?: (id: string) => void;
  onClose?: () => void;
};

const DEFAULT_MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1184.329934611341!2d-75.80947486645502!3d-14.065955537013645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9110e4a72c514841%3A0x52f1fe9788525c53!2sLas%20Palmeras%20de%20San%20Fernando!5e0!3m2!1ses!2ses!4v1755880895715!5m2!1ses!2ses';

function buildYouTubeEmbedSrc(videoUrl?: string) {
  let id = 'pkfV_zDTVo8';
  let start = 298;
  try {
    if (videoUrl) {
      const u = new URL(videoUrl);
      if (u.hostname.includes('youtu.be')) {
        id = u.pathname.replace('/', '') || id;
        const t = u.searchParams.get('t');
        if (t) start = Number(t) || start;
      }
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
        const vid = u.searchParams.get('v');
        if (vid) id = vid;
        const t = u.searchParams.get('t') || u.searchParams.get('start');
        if (t) start = Number(t) || start;
      }
    }
  } catch {}
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: id,
    controls: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    start: String(start),
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

/** Card igual al estilo de la página principal: badge + franja azul con el nombre (region). */
function RelatedCondoCard({ item, onClick }: { item: RelatedProject; onClick?: () => void }) {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-[2px]"
    >
      <div className="relative h-44 w-full">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(min-width:1024px) 33vw,(min-width:640px) 50vw, 100vw"
        />
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#0E08C9] shadow">
          CONDOMINIOS
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-[#0E08C9] px-5 py-4">
          <div className="text-lg font-extrabold text-white">{item.title}</div>
        </div>
      </div>
    </article>
  );
}

export default function ProjectDetailTemplate({
  cover,
  title,
  subtitle,
  location,
  badges = [],
  priceFromLabel,
  cashPriceLabel,
  description,
  features,
  videoUrl,
  mapEmbedUrl,
  currentId,
  currentTitle,
  condominios = [],
  onSelectCondominio,
  onClose,
}: ProjectDetailTemplateProps) {
  const ytSrc = buildYouTubeEmbedSrc(videoUrl);
  const mapSrc = mapEmbedUrl || DEFAULT_MAP_EMBED;

  // Excluir el actual (por id o por el título/region)
  const otrosCondominios = (condominios || []).filter(
    (c) => (currentId ? c.id !== currentId : true) && (currentTitle ? c.title !== currentTitle : true),
  );

  return (
    <section className="mx-auto mb-10 max-w-[1200px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
      {/* Hero */}
      <div className="relative h-[320px] w-full md:h-[380px]">
        <Image src={cover} alt={title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324]/80 via-[#0b1324]/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 text-white">
          <div>
            {subtitle && <div className="text-xs font-semibold uppercase opacity-80">{subtitle}</div>}
            <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">{title}</h2>
            {location && <div className="mt-1 text-sm opacity-90">{location}</div>}
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                {badges.map((b) => (
                  <span key={b} className="rounded-full bg-white/20 px-2 py-1 font-semibold">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(priceFromLabel || cashPriceLabel) && (
            <div className="rounded-xl bg-white p-4 text-[#0b1324] shadow">
              {priceFromLabel && (
                <div className="flex items-baseline gap-2">
                  <div className="text-xs font-semibold text-slate-600">Desde</div>
                  <div className="text-3xl font-extrabold">{priceFromLabel}</div>
                </div>
              )}
              {cashPriceLabel && <div className="mt-1 text-[11px] text-slate-600">{cashPriceLabel}</div>}
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-[#0b1324] shadow hover:bg-white"
          >
            Cerrar detalle
          </button>
        )}
      </div>

      {/* Cuerpo */}
      <div className="grid grid-cols-1 gap-8 p-6 md:p-8">
        {description && <p className="text-sm leading-relaxed text-slate-700">{description}</p>}

        {/* Características */}
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-[#0b1324]">Características</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {features.map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#eef6ff] p-5 text-center">
                <Icon className="h-10 w-10 text-[#0E08C9]" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-[#0b1324]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Video */}
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-[#0b1324]">Video</h3>
          <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow md:h-[460px]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={ytSrc}
              title={`${title} - Video`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>

        {/* Ubicación / Google Maps */}
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-[#0b1324]">Ubicación</h3>
          <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow md:h-[420px]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={mapSrc}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title={`${title} - Mapa`}
            />
          </div>
        </div>


      </div>
    </section>
  );
}
