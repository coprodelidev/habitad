'use client';

import { useEffect, useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { supabasePublic } from '@/lib/v2/supabaseV2';

interface Props {
  bucket: string;
  path: string | null;
  title?: string;
  onClose: () => void;
}

export function DocumentDrawer({ bucket, path, title, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabasePublic.storage.from(bucket).createSignedUrl(path, 3600);
      if (!active) return;
      if (error || !data) {
        setError(error?.message ?? 'No se pudo firmar la URL');
      } else {
        setUrl(data.signedUrl);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [bucket, path]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  if (!path) return null;

  const isPdf = /\.pdf($|\?)/i.test(path);
  const isImg = /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(path);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {title ?? 'Documento'}
            </h3>
            <div className="truncate font-mono text-xs text-slate-500">{path}</div>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <>
                <a
                  href={url}
                  download
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" /> Descargar
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Pestaña nueva
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {loading && <div className="text-center text-sm text-slate-500">Cargando documento…</div>}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No se pudo cargar: {error}
            </div>
          )}
          {url && !loading && !error && (
            <>
              {isPdf ? (
                <iframe
                  src={url}
                  className="h-full w-full rounded border border-slate-200 bg-white"
                  style={{ minHeight: 600 }}
                />
              ) : isImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={title ?? 'Documento'}
                  className="mx-auto max-h-full rounded border border-slate-200 bg-white shadow-sm"
                />
              ) : (
                <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                  Formato desconocido — usa "Descargar" o "Pestaña nueva" para abrirlo.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
