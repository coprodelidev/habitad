"use client";

import React, { useEffect, useState } from "react";
import {
  listGestiones,
  getSignedUrlFromDocs,
  getSignedUrlFromPayments,
  uploadDocumento,
  getDocumento,
  addCuota,
  getResumenCuotaInicial,
  type GestionPagoRow,
  type DocumentoTipo,
  type PagoInicial,
} from "./gestionPagosService";

/* =============== UI util =============== */
function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50">Cerrar</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function fmt(n?: number | null) {
  if (n == null) return "-";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* =============== Página =============== */
export default function GestionPagosPage() {
  const [rows, setRows] = useState<GestionPagoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [clienteOpen, setClienteOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);
  const [cuotasOpen, setCuotasOpen] = useState(false);

  // Doc modals: ver / editar
  const [docView, setDocView] = useState<{ open: boolean; title: string; url: string | null }>({
    open: false, title: "", url: null,
  });
  const [docEdit, setDocEdit] = useState<{ open: boolean; tipo: DocumentoTipo | null; row: GestionPagoRow | null }>({
    open: false, tipo: null, row: null,
  });
  const [docVersion, setDocVersion] = useState(0);

  // Selección actual
  const [current, setCurrent] = useState<GestionPagoRow | null>(null);

  // Cuotas
  const [cuotas, setCuotas] = useState<PagoInicial[]>([]);
  const [cuotaResumen, setCuotaResumen] = useState<{ pagado: number; objetivo: number; restante: number } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [voucher, setVoucher] = useState<File | null>(null);

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

  function openCliente(row: GestionPagoRow) {
    setCurrent(row);
    setClienteOpen(true);
  }
  function openProp(row: GestionPagoRow) {
    setCurrent(row);
    setPropOpen(true);
  }
  async function openCuotas(row: GestionPagoRow) {
    setCurrent(row);
    setCuotasOpen(true);
    // ✅ ahora getResumenCuotaInicial usa precio_promotor de la propiedad
    const res = await getResumenCuotaInicial(row.reserva);
    setCuotas(res.cuotas);
    setCuotaResumen({ pagado: res.pagado, objetivo: res.objetivo, restante: res.restante });
  }

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

  /* ======== Cuotas ======== */
  async function agregarCuota() {
    if (!current) return;
    const val = Number(amount);
    if (!isFinite(val) || val <= 0) return alert("Ingresa un monto válido");
    setUploading(true);
    try {
      await addCuota(current.reserva.id, val, voucher);
      const res = await getResumenCuotaInicial(current.reserva);
      setCuotas(res.cuotas);
      setCuotaResumen({ pagado: res.pagado, objetivo: res.objetivo, restante: res.restante });
      setAmount("");
      setVoucher(null);
      alert("Cuota registrada");
    } catch (e: any) {
      alert(`Error: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  }

  function verVoucher(path?: string | null) {
    if (!path) return;
    getSignedUrlFromPayments(path).then((url) => window.open(url, "_blank"));
  }

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Gestión de Pagos</h2>
            <p className="text-sm text-gray-500">Documentos (DNI, Anexos) y cuotas de la inicial.</p>
          </div>
          <button
            onClick={() => location.reload()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">Sin gestiones.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2">Documento identidad</th>
                  <th className="px-3 py-2">Primer nombre</th>
                  <th className="px-3 py-2">Segundo nombre</th>
                  <th className="px-3 py-2">Primer apellido</th>
                  <th className="px-3 py-2">Segundo apellido</th>
                  <th className="px-3 py-2">Propiedad</th>
                  <th className="px-3 py-2">DNI (PDF)</th>
                  <th className="px-3 py-2">Anexo 1</th>
                  <th className="px-3 py-2">Anexo A2</th>
                  <th className="px-3 py-2">Cuotas iniciales</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.reserva.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{row.cliente.documento_identidad || "—"}</td>

                    <td className="px-3 py-2">{row.cliente.primer_nombre || "—"}</td>
                    <td className="px-3 py-2">{row.cliente.segundo_nombre || "—"}</td>
                    <td className="px-3 py-2">{row.cliente.primer_apellido || "—"}</td>
                    <td className="px-3 py-2">{row.cliente.segundo_apellido || "—"}</td>

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
                    </td>

                    <td className="px-3 py-2">
                      <DocCell
                        row={row}
                        tipo="dni"
                        version={docVersion}
                        onView={handleOpenDocView}
                        onEdit={handleOpenDocEdit}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DocCell
                        row={row}
                        tipo="anexo1"
                        version={docVersion}
                        onView={handleOpenDocView}
                        onEdit={handleOpenDocEdit}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DocCell
                        row={row}
                        tipo="anexoA2"
                        version={docVersion}
                        onView={handleOpenDocView}
                        onEdit={handleOpenDocEdit}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <button
                        onClick={() => openCuotas(row)}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Ver / Subir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cliente */}
      <Modal open={clienteOpen} onClose={() => setClienteOpen(false)} title="Datos del cliente">
        {current && (
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-500">ID: </span><span className="font-mono">{current.cliente.id}</span></div>
            <div><span className="text-gray-500">Documento: </span>{current.cliente.documento_identidad || "—"} ({current.cliente.tipo_documento || "—"})</div>
            <div><span className="text-gray-500">Email: </span>{current.cliente.email || "—"}</div>
          </div>
        )}
      </Modal>

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
            <Info label="Ubicación" value={current.propiedad.ubicacion || "—"} />
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

      {/* Modal Cuotas */}
      <Modal open={cuotasOpen} onClose={() => setCuotasOpen(false)} title="Cuotas de la inicial">
        {cuotaResumen && (
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <Info label="Objetivo (precio promotor)" value={`$ ${fmt(cuotaResumen.objetivo)}`} />
            <Info label="Pagado" value={`$ ${fmt(cuotaResumen.pagado)}`} />
            <Info label="Restante" value={`$ ${fmt(cuotaResumen.restante)}`} />
          </div>
        )}

        <div className="rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Monto</th>
                <th className="px-3 py-2">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cuotas.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">{new Date(c.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">$ {fmt(c.amount)}</td>
                  <td className="px-3 py-2">
                    {c.file_path ? (
                      <button onClick={() => getSignedUrlFromPayments(c.file_path!).then(url => window.open(url, "_blank"))} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Ver</button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
          <h4 className="font-medium mb-2">Registrar nueva cuota</h4>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-40 rounded border px-3 py-2 text-sm"
            />
            <input type="file" accept="application/pdf" onChange={(e) => setVoucher(e.target.files?.[0] || null)} />
            <button
              onClick={agregarCuota}
              disabled={uploading}
              className="rounded bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? "Guardando…" : "Subir comprobante"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">El comprobante (PDF) es opcional.</p>
        </div>
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

function DocCell({
  row, tipo, version, onView, onEdit,
}: {
  row: GestionPagoRow;
  tipo: DocumentoTipo;
  version: number;
  onView: (row: GestionPagoRow, tipo: DocumentoTipo) => void;
  onEdit: (row: GestionPagoRow, tipo: DocumentoTipo) => void;
}) {
  const [hasDoc, setHasDoc] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const reg = await getDocumento(row.reserva.id, tipo);
        if (mounted) setHasDoc(!!reg);
      } catch {
        if (mounted) setHasDoc(false);
      }
    })();
    return () => { mounted = false; };
  }, [row.reserva.id, tipo, version]);

  if (hasDoc == null) {
    return <span className="text-[10px] text-gray-400">…</span>;
  }

  if (!hasDoc) {
    return (
      <button
        onClick={() => onEdit(row, tipo)}
        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
      >
        Subir
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onView(row, tipo)}
        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
      >
        Ver
      </button>
      <button
        onClick={() => onEdit(row, tipo)}
        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
      >
        Editar
      </button>
      <span className="text-[10px] rounded bg-green-100 px-2 py-0.5 text-green-700">cargado</span>
    </div>
  );
}
