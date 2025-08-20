"use client";

import React, { useEffect, useState } from "react";
import {
  listGestiones,
  getSignedUrlFromDocs,
  getSignedUrlFromPayments,
  uploadDocumento,
  getDocumento,
  addPago,
  getResumenPagos,
  type GestionPagoRow,
  type DocumentoTipo,
  type Pago,
  type PagoStage,
} from "./gestionPagosService";

/* =============== UI utils =============== */
function Modal({
  open,
  onClose,
  title,
  children,
  scroll = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50">
            Cerrar
          </button>
        </div>
        <div className={scroll ? "max-h-[70vh] overflow-y-auto pr-1" : ""}>{children}</div>
      </div>
    </div>
  );
}

const fmt = (n?: number | null) =>
  n == null ? "-" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* =============== Página =============== */
export default function GestionPagosPage() {
  const [rows, setRows] = useState<GestionPagoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [clienteOpen, setClienteOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [pagosOpen, setPagosOpen] = useState(false);

  // Doc viewer & editor
  const [docView, setDocView] = useState<{ open: boolean; title: string; url: string | null }>({
    open: false,
    title: "",
    url: null,
  });
  const [docEdit, setDocEdit] = useState<{
    open: boolean;
    reservaId: string | null;
    tipo: DocumentoTipo | null;
    title: string;
    exists: boolean;
  }>({ open: false, reservaId: null, tipo: null, title: "", exists: false });
  const [docEditFile, setDocEditFile] = useState<File | null>(null);
  const [docVersion, setDocVersion] = useState(0);

  // Selección actual
  const [current, setCurrent] = useState<GestionPagoRow | null>(null);

  // Estado de pagos
  const [resumen, setResumen] = useState<{
    reserva: { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
    inicial: { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
    final: { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
  } | null>(null);
  const [etapaActual, setEtapaActual] = useState<PagoStage | "completado">("reserva");

  // Registrar pago
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<PagoStage>("reserva");
  const [amount, setAmount] = useState<string>("");
  const [voucher, setVoucher] = useState<File | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listGestiones();
        setRows(data);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ======== Documentos ======== */
  function openDocs(row: GestionPagoRow) {
    setCurrent(row);
    setDocsOpen(true);
    setDocVersion((v) => v + 1); // forzar re-chequeo de existencia
  }

  async function handleViewDoc(reservaId: string, tipo: DocumentoTipo, title: string) {
    const reg = await getDocumento(reservaId, tipo);
    if (!reg) return alert("No hay documento cargado todavía");
    const url = await getSignedUrlFromDocs(reg.file_path);
    setDocView({ open: true, title, url });
  }

  async function quickUpload(reservaId: string, tipo: DocumentoTipo, file: File) {
    setUploading(true);
    try {
      await uploadDocumento(reservaId, tipo, file);
      setDocVersion((v) => v + 1);
      setToast(`Se cargó ${labelDoc(tipo)}.`);
      setTimeout(() => setToast(null), 2500);
    } catch (e: any) {
      alert(`Error al subir: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  }

  async function confirmReplace() {
    if (!docEdit.open || !docEdit.tipo || !docEdit.reservaId || !docEditFile) return;
    setUploading(true);
    try {
      await uploadDocumento(docEdit.reservaId, docEdit.tipo, docEditFile);
      setDocVersion((v) => v + 1);
      setDocEdit({ open: false, reservaId: null, tipo: null, title: "", exists: false });
      setDocEditFile(null);
      setToast(`Se reemplazó ${labelDoc(docEdit.tipo)}.`);
      setTimeout(() => setToast(null), 2500);
    } catch (e: any) {
      alert(`Error al reemplazar: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  }

  /* ======== Pagos ======== */
  async function openPagos(row: GestionPagoRow) {
    setCurrent(row);
    setPagosOpen(true);
    const res = await getResumenPagos(row.reserva);
    setResumen(res.resumen);
    setEtapaActual(res.etapaActual);
    setStage(res.etapaActual === "completado" ? "final" : res.etapaActual);
  }

  async function registrarPago() {
    if (!current) return;
    const val = Number(amount);
    if (!isFinite(val) || val <= 0) return alert("Ingresa un monto válido");
    setUploading(true);
    try {
      await addPago(current.reserva.id, stage, val, voucher || undefined);
      const res = await getResumenPagos(current.reserva);
      setResumen(res.resumen);
      setEtapaActual(res.etapaActual);
      setStage(res.etapaActual === "completado" ? "final" : res.etapaActual);
      setAmount("");
      setVoucher(null);
      setToast(`Pago registrado en etapa ${stage}.`);
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      alert(`Error: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  }

  const tableEmpty = !loading && !error && rows.length === 0;

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-900 shadow">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Gestión de Pagos</h2>
            <p className="text-sm text-gray-500">
              Tabla general con accesos a datos del cliente, propiedad, documentos y pagos (por etapas).
            </p>
          </div>
          <button
            onClick={() => location.reload()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla principal */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : tableEmpty ? (
          <p className="text-sm text-gray-500">Sin gestiones.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <Th>Documento</Th>
                  <Th>Primer apellido</Th>
                  <Th>Segundo apellido</Th>
                  <Th center>Ver datos cliente</Th>
                  <Th>Código de propiedad</Th>
                  <Th center>Ver datos propiedad</Th>
                  <Th center>Documentos</Th>
                  <Th center>Pagos</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.reserva.id} className="hover:bg-gray-50">
                    <Td mono>{row.cliente.documento_identidad || "—"}</Td>
                    <Td>{row.cliente.primer_apellido || "—"}</Td>
                    <Td>{row.cliente.segundo_apellido || "—"}</Td>

                    <Td center>
                      <button
                        onClick={() => {
                          setCurrent(row);
                          setClienteOpen(true);
                        }}
                        className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Ver datos cliente
                      </button>
                    </Td>

                    <Td mono>{row.propiedad.codigo_cuh}</Td>

                    <Td center>
                      <button
                        onClick={() => {
                          setCurrent(row);
                          setPropOpen(true);
                        }}
                        className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Ver datos propiedad
                      </button>
                    </Td>

                    <Td center>
                      <button
                        onClick={() => openDocs(row)}
                        className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        Documentos
                      </button>
                    </Td>

                    <Td center>
                      <button
                        onClick={() => openPagos(row)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Pagos
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Datos del cliente */}
      <Modal open={clienteOpen} onClose={() => setClienteOpen(false)} title="Datos del cliente" scroll>
        {current && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="ID" value={current.cliente.id} mono />
            <Info label="Tipo" value={current.cliente.tipo} />
            <Info label="Documento" value={current.cliente.documento_identidad ?? "—"} />
            <Info label="Tipo documento" value={current.cliente.tipo_documento ?? "—"} />
            <Info label="Primer nombre" value={current.cliente.primer_nombre ?? "—"} />
            <Info label="Segundo nombre" value={current.cliente.segundo_nombre ?? "—"} />
            <Info label="Primer apellido" value={current.cliente.primer_apellido ?? "—"} />
            <Info label="Segundo apellido" value={current.cliente.segundo_apellido ?? "—"} />
            <Info label="Email" value={current.cliente.email ?? "—"} />
            <Info
              label="Teléfono"
              value={
                current.cliente.full_phone ??
                `${current.cliente.country_code ?? ""} ${current.cliente.phone_number ?? ""}`
              }
            />
            <Info
              label="Creado"
              value={current.cliente.created_at ? new Date(current.cliente.created_at).toLocaleString() : "—"}
            />
          </div>
        )}
      </Modal>

      {/* Modal: Datos de la propiedad */}
      <Modal open={propOpen} onClose={() => setPropOpen(false)} title="Datos de la propiedad" scroll>
        {current && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Código CUH" value={current.propiedad.codigo_cuh} mono />
            <Info label="Etapa" value={String(current.propiedad.etapa)} />
            <Info label="Modelo" value={current.propiedad.modelo} />
            <Info label="Partida" value={current.propiedad.partida} mono />
            <Info label="MZ" value={String(current.propiedad.manzana)} />
            <Info label="LT" value={String(current.propiedad.lote)} />
            <Info
              label="Ubicación"
              value={
                current.propiedad.ubicacion && current.propiedad.ubicacion.trim()
                  ? current.propiedad.ubicacion
                  : "Interior"
              }
            />
            <Info
              label="Área lote"
              value={current.propiedad.area_lote != null ? String(current.propiedad.area_lote) : "—"}
            />
            <Info label="Precio CUH" value={`$ ${fmt(current.propiedad.precio_cuh)}`} />
            <Info
              label="Precio promotor"
              value={
                current.propiedad.precio_promotor != null ? `$ ${fmt(current.propiedad.precio_promotor)}` : "—"
              }
            />
          </div>
        )}
      </Modal>

      {/* Modal: Documentos - 3 cabeceras con acción debajo */}
      <Modal open={docsOpen} onClose={() => setDocsOpen(false)} title="Documentos del cliente" scroll>
        {!current ? (
          <p className="text-sm text-gray-500">Selecciona una fila.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DocHeaderCell
              key={`dni-${current.reserva.id}-${docVersion}`}
              title="Documento de identidad"
              tipo="dni"
              reservaId={current.reserva.id}
              onPencil={() =>
                setDocEdit({
                  open: true,
                  reservaId: current.reserva.id,
                  tipo: "dni",
                  title: "Documento de identidad",
                  exists: true,
                })
              }
              onUpload={(file) => quickUpload(current.reserva.id, "dni", file)}
            />
            <DocHeaderCell
              key={`a1-${current.reserva.id}-${docVersion}`}
              title="Anexo 1"
              tipo="anexo1"
              reservaId={current.reserva.id}
              onPencil={() =>
                setDocEdit({
                  open: true,
                  reservaId: current.reserva.id,
                  tipo: "anexo1",
                  title: "Anexo 1",
                  exists: true,
                })
              }
              onUpload={(file) => quickUpload(current.reserva.id, "anexo1", file)}
            />
            <DocHeaderCell
              key={`a2-${current.reserva.id}-${docVersion}`}
              title="Anexo A2"
              tipo="anexoA2"
              reservaId={current.reserva.id}
              onPencil={() =>
                setDocEdit({
                  open: true,
                  reservaId: current.reserva.id,
                  tipo: "anexoA2",
                  title: "Anexo A2",
                  exists: true,
                })
              }
              onUpload={(file) => quickUpload(current.reserva.id, "anexoA2", file)}
            />
          </div>
        )}
      </Modal>

      {/* Modal: Editar/Reemplazar documento (aparece con ✏️) */}
      <Modal open={docEdit.open} onClose={() => setDocEdit({ open: false, reservaId: null, tipo: null, title: "", exists: false })} title={docEdit.title || "Documento"} scroll>
        {!docEdit.open || !docEdit.tipo || !docEdit.reservaId ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded border p-3 text-sm">
              <div className="mb-2 font-medium">Archivo actual</div>
              <button
                onClick={() => handleViewDoc(docEdit.reservaId!, docEdit.tipo!, docEdit.title)}
                className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
              >
                Ver actual
              </button>
            </div>

            <div className="rounded border p-3 text-sm">
              <div className="mb-2 font-medium">Reemplazar por</div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setDocEditFile(e.target.files?.[0] ?? null)}
              />
              <div className="mt-3">
                <button
                  onClick={confirmReplace}
                  disabled={!docEditFile || uploading}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? "Subiendo…" : "Reemplazar"}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Formato permitido: PDF.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Visor PDF */}
      <Modal open={docView.open} onClose={() => setDocView({ open: false, title: "", url: null })} title={docView.title} scroll>
        {docView.url ? (
          <div className="h-[70vh] w-full">
            <iframe src={docView.url} className="h-full w-full rounded border" />
            <div className="mt-2 text-xs">
              Si no carga el visor,{" "}
              <a className="text-blue-600 underline" href={docView.url} target="_blank" rel="noreferrer">
                ábrelo en una pestaña nueva
              </a>
              .
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Cargando…</p>
        )}
      </Modal>

      {/* Modal: Pagos (con scroll) */}
      <Modal open={pagosOpen} onClose={() => setPagosOpen(false)} title="Pagos y estado por etapas" scroll>
        {!current || !resumen ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : (
          <div className="space-y-5">
            {/* Encabezado del caso */}
            <div className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-gray-500">Reserva</div>
                  <div className="text-sm font-medium">
                    #{current.reserva.id.slice(0, 8)} · {current.propiedad.codigo_cuh}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Estado:{" "}
                  <b className="text-gray-800 capitalize">
                    {etapaActual === "completado" ? "completado" : `en ${etapaActual}`}
                  </b>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <Stepper etapa={etapaActual} />

            {/* Tarjetas de progreso */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StageCard title="Reserva" color="emerald" objetivo={resumen.reserva.objetivo} pagado={resumen.reserva.pagado} />
              <StageCard title="Cuota inicial (5%)" color="sky" objetivo={resumen.inicial.objetivo} pagado={resumen.inicial.pagado} />
              <StageCard title="Cuotas finales" color="violet" objetivo={resumen.final.objetivo} pagado={resumen.final.pagado} />
            </div>

            {/* Registrar pago */}
            <div className="rounded-2xl border bg-gray-50 p-4">
              <h4 className="mb-3 font-medium">Registrar pago</h4>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as PagoStage)}
                  className="rounded border px-3 py-2 text-sm"
                >
                  <option value="reserva">Reserva</option>
                  <option value="inicial">Cuota inicial</option>
                  <option value="final">Cuotas finales</option>
                </select>
                <input
                  type="number"
                  placeholder="Monto"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-40 rounded border px-3 py-2 text-sm"
                />
                <input type="file" accept="application/pdf" onChange={(e) => setVoucher(e.target.files?.[0] || null)} />
                <button
                  onClick={registrarPago}
                  disabled={uploading}
                  className="rounded bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {uploading ? "Guardando…" : "Subir comprobante"}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">El comprobante (PDF) es opcional.</p>
            </div>

            {/* Listas por etapa */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PagosTable
                title="Pagos de reserva"
                pagos={resumen.reserva.pagos}
                onOpen={(p) =>
                  p.file_path && getSignedUrlFromPayments(p.file_path).then((url) => window.open(url, "_blank"))
                }
              />
              <PagosTable
                title="Pagos de cuota inicial"
                pagos={resumen.inicial.pagos}
                onOpen={(p) =>
                  p.file_path && getSignedUrlFromPayments(p.file_path).then((url) => window.open(url, "_blank"))
                }
              />
              <PagosTable
                title="Pagos de cuotas finales"
                pagos={resumen.final.pagos}
                onOpen={(p) =>
                  p.file_path && getSignedUrlFromPayments(p.file_path).then((url) => window.open(url, "_blank"))
                }
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* =============== Subcomponentes =============== */
function Th({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return <th className={`px-3 py-2 font-medium ${center ? "text-center" : "text-left"}`}>{children}</th>;
}
function Td({
  children,
  mono,
  center = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
  center?: boolean;
}) {
  return <td className={`px-3 py-2 ${mono ? "font-mono" : ""} ${center ? "text-center" : ""}`}>{children}</td>;
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value}</div>
    </div>
  );
}

/** Cabecera + acción debajo (✏️ si existe, “Subir PDF” si no) */
function DocHeaderCell({
  title,
  tipo,
  reservaId,
  onPencil,
  onUpload,
}: {
  title: string;
  tipo: DocumentoTipo;
  reservaId: string;
  onPencil: () => void;
  onUpload: (file: File) => void;
}) {
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const reg = await getDocumento(reservaId, tipo);
        if (mounted) setExists(!!reg);
      } catch {
        if (mounted) setExists(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reservaId, tipo]);

  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3">
        {exists == null ? (
          <span className="text-xs text-gray-400">Verificando…</span>
        ) : exists ? (
          <button
            title="Reemplazar"
            onClick={onPencil}
            className="inline-flex items-center gap-2 rounded border px-3 py-2 text-xs hover:bg-gray-50"
          >
            {/* Icono lápiz (inline SVG para no depender de librerías) */}
            <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80" aria-hidden>
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                fill="currentColor"
              />
              <path
                d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                fill="currentColor"
              />
            </svg>
            <span>Editar</span>
          </button>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700">
            Subir PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && onUpload(e.target.files[0])}
            />
          </label>
        )}
      </div>
      {exists && <span className="mt-2 inline-block rounded bg-green-100 px-2 py-0.5 text-[11px] text-green-700">cargado</span>}
    </div>
  );
}

/* ======= Gráficos “ligeros” (progress bars) ======= */

function Stepper({ etapa }: { etapa: PagoStage | "completado" }) {
  const steps: Array<{ key: PagoStage; label: string }> = [
    { key: "reserva", label: "Reserva" },
    { key: "inicial", label: "Cuota inicial" },
    { key: "final", label: "Cuotas finales" },
  ];

  const index = etapa === "completado" ? steps.length : steps.findIndex((s) => s.key === etapa);
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      {steps.map((s, i) => {
        const done = index > i;
        const current = index === i;
        return (
          <div key={s.key} className="flex flex-1 items-center">
            <div
              className={[
                "flex items-center gap-2 rounded-full px-3 py-1",
                done ? "bg-emerald-100 text-emerald-900" : current ? "bg-sky-100 text-sky-900" : "bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold">
                {i + 1}
              </span>
              <span className="font-medium">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="mx-2 h-0.5 flex-1 bg-gray-200" />}
          </div>
        );
      })}
      {etapa === "completado" && (
        <div className="ml-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">COMPLETADO</div>
      )}
    </div>
  );
}

function StageCard({
  title,
  color,
  objetivo,
  pagado,
}: {
  title: string;
  color: "emerald" | "sky" | "violet";
  objetivo: number;
  pagado: number;
}) {
  const pct = objetivo > 0 ? Math.min(100, Math.round((pagado / objetivo) * 100)) : 0;
  const restante = Math.max(0, objetivo - pagado);

  const barColor =
    color === "emerald" ? "bg-emerald-500" : color === "sky" ? "bg-sky-500" : "bg-violet-500";

  const chipColor = restante <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700";

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div className="font-semibold">{title}</div>
        <span className={`rounded px-2 py-0.5 text-[11px] ${chipColor}`}>
          {restante <= 0 ? "Completo" : "En progreso"}
        </span>
      </div>

      <div className="mt-3 h-2 w-full rounded bg-gray-100">
        <div className={`h-2 rounded ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-2 grid grid-cols-3 text-xs text-gray-600">
        <div>
          <div className="text-[11px]">Objetivo</div>
          <div className="font-medium">${fmt(objetivo)}</div>
        </div>
        <div>
          <div className="text-[11px]">Pagado</div>
          <div className="font-medium">${fmt(pagado)}</div>
        </div>
        <div>
          <div className="text-[11px]">Restante</div>
          <div className="font-medium">${fmt(restante)}</div>
        </div>
      </div>
    </div>
  );
}

function PagosTable({
  title,
  pagos,
  onOpen,
}: {
  title: string;
  pagos: Pago[];
  onOpen: (p: Pago) => void;
}) {
  return (
    <div className="rounded-xl border">
      <div className="border-b px-3 py-2 text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pagos.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-xs text-gray-500" colSpan={3}>
                  Sin pagos.
                </td>
              </tr>
            ) : (
              pagos.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">$ {fmt(p.amount)}</td>
                  <td className="px-3 py-2">
                    {p.file_path ? (
                      <button
                        onClick={() => onOpen(p)}
                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        Ver
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =============== Helpers =============== */
function labelDoc(t: DocumentoTipo) {
  return t === "dni" ? "Documento de identidad" : t === "anexo1" ? "Anexo 1" : "Anexo A2";
}
