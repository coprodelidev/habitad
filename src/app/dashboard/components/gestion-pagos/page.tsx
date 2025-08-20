"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50">Cerrar</button>
        </div>
        <div>{children}</div>
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
  const [pagosOpen, setPagosOpen] = useState(false);

  // Docs
  const [docView, setDocView] = useState<{ open: boolean; title: string; url: string | null }>({
    open: false, title: "", url: null,
  });
  const [docEdit, setDocEdit] = useState<{ open: boolean; tipo: DocumentoTipo | null; row: GestionPagoRow | null }>({
    open: false, tipo: null, row: null,
  });
  const [docVersion, setDocVersion] = useState(0);

  // Selección actual
  const [current, setCurrent] = useState<GestionPagoRow | null>(null);

  // Estado de pagos (resumen y listas)
  const [resumen, setResumen] = useState<{
    reserva: { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
    inicial: { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
    final:   { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
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

  /* ======== Docs: Ver / Editar ======== */
  async function handleOpenDocView(row: GestionPagoRow, tipo: DocumentoTipo) {
    const reg = await getDocumento(row.reserva.id, tipo);
    if (!reg) return alert("No hay documento cargado todavía");
    const url = await getSignedUrlFromDocs(reg.file_path);
    setDocView({
      open: true,
      title: `Documento: ${tipo.toUpperCase()} — ${row.cliente.documento_identidad ?? row.cliente.email ?? row.cliente.id}`,
      url,
    });
  }
  function handleOpenDocEdit(row: GestionPagoRow, tipo: DocumentoTipo) {
    setDocEdit({ open: true, tipo, row });
  }
  async function handleUploadReplace(file: File) {
    if (!docEdit.open || !docEdit.tipo || !docEdit.row) return;
    setUploading(true);
    try {
      await uploadDocumento(docEdit.row.reserva.id, docEdit.tipo, file);
      setDocEdit({ open: false, tipo: null, row: null });
      setDocVersion((v) => v + 1);
      await handleOpenDocView(docEdit.row, docEdit.tipo);
    } catch (e: any) {
      alert(`Error al subir: ${e?.message || e}`);
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
    // Preselecciona la etapa “actual” en el formulario
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
            <p className="text-sm text-gray-500">Documentos (DNI, Anexos) y pagos por etapas: <b>Reserva</b>, <b>Cuota inicial (5%)</b> y <b>Cuotas finales</b>.</p>
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
                  <th className="px-3 py-2">Documento identidad</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Propiedad</th>
                  <th className="px-3 py-2">Docs</th>
                  <th className="px-3 py-2">Pagos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.reserva.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{row.cliente.documento_identidad || "—"}</td>

                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {row.cliente.primer_nombre} {row.cliente.primer_apellido}
                      </div>
                      <div className="text-xs text-gray-500">{row.cliente.email || "—"}</div>
                      <div className="text-xs text-gray-500">{row.cliente.full_phone || "—"}</div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{row.propiedad.codigo_cuh}</span>
                        <button
                          onClick={() => { setCurrent(row); setPropOpen(true); }}
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Ver propiedad
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        ET {row.propiedad.etapa} · MZ {row.propiedad.manzana} · LT {row.propiedad.lote}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex gap-2 flex-wrap">
                        <DocButtons row={row} version={docVersion} onView={handleOpenDocView} onEdit={handleOpenDocEdit} />
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <button
                        onClick={() => openPagos(row)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Ver / Registrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Propiedad */}
      <Modal open={propOpen} onClose={() => setPropOpen(false)} title="Datos de la propiedad">
        {current && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Código CUH" value={current.propiedad.codigo_cuh} mono />
            <Info label="Etapa" value={String(current.propiedad.etapa)} />
            <Info label="Modelo" value={current.propiedad.modelo} />
            <Info label="Partida" value={current.propiedad.partida} mono />
            <Info label="MZ" value={String(current.propiedad.manzana)} />
            <Info label="LT" value={String(current.propiedad.lote)} />
            <Info label="Ubicación" value={(current.propiedad.ubicacion && current.propiedad.ubicacion.trim()) ? current.propiedad.ubicacion : "Interior"} />
            <Info label="Área lote" value={current.propiedad.area_lote != null ? String(current.propiedad.area_lote) : "—"} />
            <Info label="Precio CUH" value={`$ ${fmt(current.propiedad.precio_cuh)}`} />
            <Info label="Precio promotor" value={current.propiedad.precio_promotor != null ? `$ ${fmt(current.propiedad.precio_promotor)}` : "—"} />
          </div>
        )}
      </Modal>

      {/* Modal Ver Documento */}
      <Modal open={docView.open} onClose={() => setDocView({ open: false, title: "", url: null })} title={docView.title || "Documento"}>
        {docView.url ? (
          <div className="h-[70vh] w-full">
            <iframe src={docView.url} className="h-full w-full rounded border" />
            <div className="mt-2 text-xs">
              Si no carga el visor, <a className="text-blue-600 underline" href={docView.url} target="_blank" rel="noreferrer">ábrelo en una pestaña nueva</a>.
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Cargando…</p>
        )}
      </Modal>

      {/* Modal Editar/Subir Documento */}
      <Modal
        open={docEdit.open}
        onClose={() => setDocEdit({ open: false, tipo: null, row: null })}
        title={`Subir / Reemplazar: ${docEdit.tipo?.toUpperCase() || ""}`}
      >
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => e.target.files && handleUploadReplace(e.target.files[0])}
            disabled={uploading || !docEdit.open}
          />
          <span className="text-xs text-gray-500">Solo PDF. Reemplaza si ya existe.</span>
        </div>
      </Modal>

      {/* Modal Pagos (gráfico + tablas + registrar) */}
      <Modal open={pagosOpen} onClose={() => setPagosOpen(false)} title="Pagos y estado por etapas">
        {!current || !resumen ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : (
          <div className="space-y-5">
            {/* Encabezado del caso */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs text-gray-500">Reserva</div>
                  <div className="text-sm font-medium">#{current.reserva.id.slice(0,8)} · {current.propiedad.codigo_cuh}</div>
                </div>
                <div className="text-xs text-gray-500">
                  Estado: <b className="text-gray-800 capitalize">{etapaActual === "completado" ? "completado" : `en ${etapaActual}`}</b>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <Stepper etapa={etapaActual} />

            {/* Tarjetas de progreso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StageCard
                title="Reserva"
                color="emerald"
                objetivo={resumen.reserva.objetivo}
                pagado={resumen.reserva.pagado}
              />
              <StageCard
                title="Cuota inicial (5%)"
                color="sky"
                objetivo={resumen.inicial.objetivo}
                pagado={resumen.inicial.pagado}
              />
              <StageCard
                title="Cuotas finales"
                color="violet"
                objetivo={resumen.final.objetivo}
                pagado={resumen.final.pagado}
              />
            </div>

            {/* Registrar pago */}
            <div className="rounded-2xl border bg-gray-50 p-4">
              <h4 className="font-medium mb-3">Registrar pago</h4>
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
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setVoucher(e.target.files?.[0] || null)}
                />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <PagosTable
                title="Pagos de reserva"
                pagos={resumen.reserva.pagos}
                onOpen={(p) => p.file_path && getSignedUrlFromPayments(p.file_path).then((url) => window.open(url, "_blank"))}
              />
              <PagosTable
                title="Pagos de cuota inicial"
                pagos={resumen.inicial.pagos}
                onOpen={(p) => p.file_path && getSignedUrlFromPayments(p.file_path).then((url) => window.open(url, "_blank"))}
              />
              <PagosTable
                title="Pagos de cuotas finales"
                pagos={resumen.final.pagos}
                onOpen={(p) => p.file_path && getSignedUrlFromPayments(p.file_path).then((url) => window.open(url, "_blank"))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* =============== Subcomponentes =============== */
function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value}</div>
    </div>
  );
}

function DocButtons({
  row, version, onView, onEdit,
}: {
  row: GestionPagoRow;
  version: number;
  onView: (row: GestionPagoRow, tipo: DocumentoTipo) => void;
  onEdit: (row: GestionPagoRow, tipo: DocumentoTipo) => void;
}) {
  const [hasDNI, setHasDNI] = useState<boolean | null>(null);
  const [hasA1, setHasA1] = useState<boolean | null>(null);
  const [hasA2, setHasA2] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [d1, d2, d3] = await Promise.all([
          getDocumento(row.reserva.id, "dni"),
          getDocumento(row.reserva.id, "anexo1"),
          getDocumento(row.reserva.id, "anexoA2"),
        ]);
        if (mounted) {
          setHasDNI(!!d1);
          setHasA1(!!d2);
          setHasA2(!!d3);
        }
      } catch {
        if (mounted) {
          setHasDNI(false); setHasA1(false); setHasA2(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [row.reserva.id, version]);

  return (
    <div className="flex gap-2 flex-wrap">
      <DocCellMini label="DNI" has={hasDNI} onView={() => onView(row, "dni")} onEdit={() => onEdit(row, "dni")} />
      <DocCellMini label="Anexo 1" has={hasA1} onView={() => onView(row, "anexo1")} onEdit={() => onEdit(row, "anexo1")} />
      <DocCellMini label="Anexo A2" has={hasA2} onView={() => onView(row, "anexoA2")} onEdit={() => onEdit(row, "anexoA2")} />
    </div>
  );
}

function DocCellMini({
  label, has, onView, onEdit,
}: {
  label: string;
  has: boolean | null;
  onView: () => void;
  onEdit: () => void;
}) {
  if (has == null) return <span className="text-[10px] text-gray-400">…</span>;

  if (!has) {
    return (
      <button
        onClick={onEdit}
        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
      >
        Subir {label}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={onView} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Ver {label}</button>
      <button onClick={onEdit} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Editar</button>
      <span className="text-[10px] rounded bg-green-100 px-2 py-0.5 text-green-700">cargado</span>
    </div>
  );
}

/* ======= Gráficos “ligeros” (progress bars) ======= */

function Stepper({ etapa }: { etapa: PagoStage | "completado" }) {
  const steps: Array<{ key: PagoStage; label: string }> = [
    { key: "reserva", label: "Reserva" },
    { key: "inicial", label: "Cuota inicial" },
    { key: "final",   label: "Cuotas finales" },
  ];

  const index = etapa === "completado" ? steps.length : steps.findIndex(s => s.key === etapa);
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      {steps.map((s, i) => {
        const done = index > i;
        const current = index === i;
        return (
          <div key={s.key} className="flex-1 flex items-center">
            <div className={[
              "flex items-center gap-2 rounded-full px-3 py-1",
              done ? "bg-emerald-100 text-emerald-900" :
              current ? "bg-sky-100 text-sky-900" : "bg-gray-100 text-gray-600"
            ].join(" ")}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold">
                {i+1}
              </span>
              <span className="font-medium">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="mx-2 h-0.5 flex-1 bg-gray-200" />}
          </div>
        );
      })}
      {etapa === "completado" && (
        <div className="ml-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          COMPLETADO
        </div>
      )}
    </div>
  );
}

function StageCard({
  title, color, objetivo, pagado,
}: { title: string; color: "emerald" | "sky" | "violet"; objetivo: number; pagado: number; }) {
  const pct = objetivo > 0 ? Math.min(100, Math.round((pagado / objetivo) * 100)) : 0;
  const restante = Math.max(0, objetivo - pagado);

  const barColor =
    color === "emerald" ? "bg-emerald-500" :
    color === "sky"     ? "bg-sky-500" :
                          "bg-violet-500";

  const chipColor =
    restante <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700";

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
  title, pagos, onOpen,
}: {
  title: string; pagos: Pago[]; onOpen: (p: Pago) => void;
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
              <tr><td className="px-3 py-3 text-gray-500 text-xs" colSpan={3}>Sin pagos.</td></tr>
            ) : pagos.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2">{new Date(p.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">$ {fmt(p.amount)}</td>
                <td className="px-3 py-2">
                  {p.file_path
                    ? <button onClick={() => onOpen(p)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Ver</button>
                    : <span className="text-gray-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
