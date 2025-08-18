"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Cliente = {
  id: string;
  country_code: string;
  phone_number: string;
  email: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  full_phone: string | null;
  created_at: string;
  tipo: "cliente" | "interesado" | string;
};

const PAGE_SIZE = 10;

function normalizeCountryCode(cc: string) {
  const trimmed = (cc || "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\s+/g, "");
  return digits.startsWith("+") ? digits : `+${digits.replace(/^\+?/, "")}`;
}

function normalizePhone(p: string) {
  return (p || "").replace(/\s+/g, "");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Clientes() {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [countryCode, setCountryCode] = useState("+34");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [primerNombre, setPrimerNombre] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [tipo, setTipo] = useState<"cliente" | "interesado">("interesado");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const from = page * PAGE_SIZE;
  const toPlusOne = from + PAGE_SIZE;

  const whereFilter = useMemo(() => {
    const q = search.trim();
    return q || null;
  }, [search]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, toPlusOne);

      if (whereFilter) {
        query = query.or(
          `email.ilike.%${whereFilter}%,phone_number.ilike.%${whereFilter}%,full_phone.ilike.%${whereFilter}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const list = (data as Cliente[]) ?? [];
      setHasMore(list.length > PAGE_SIZE);
      setRows(list.slice(0, PAGE_SIZE));
    } catch (e: any) {
      console.error("[clientes.fetchPage] error:", e);
      setError(e?.message ?? "Error al cargar clientes.");
    } finally {
      setLoading(false);
    }
  }, [from, toPlusOne, whereFilter]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);

    const cc = normalizeCountryCode(countryCode);
    const pn = normalizePhone(phoneNumber);

    if (!cc || !pn) return setError("País y teléfono son obligatorios.");
    if (!primerNombre || !primerApellido) return setError("Nombre y apellido requeridos.");
    if (!email || !isValidEmail(email)) return setError("Email inválido.");

    const payload = {
      country_code: cc,
      phone_number: pn,
      email: email.trim().toLowerCase(),
      primer_nombre: primerNombre.trim(),
      segundo_nombre: (segundoNombre || "").trim() || null,
      primer_apellido: primerApellido.trim(),
      segundo_apellido: (segundoApellido || "").trim() || null,
      tipo,
    };

    setSubmitting(true);
    try {
      const { error } = await (supabase
        .from("clientes") as any)
        .insert(payload as any);

      if (error) throw error;

      setSuccessMsg("Cliente registrado correctamente.");
      setPhoneNumber("");
      setEmail("");
      setPrimerNombre("");
      setSegundoNombre("");
      setPrimerApellido("");
      setSegundoApellido("");
      setTipo("interesado");

      setPage(0);
      await fetchPage();
    } catch (e: any) {
      console.error("[clientes.insert] error:", e);
      const parts = [
        e?.message,
        e?.details ? `Detalles: ${e.details}` : "",
        e?.hint ? `Pista: ${e.hint}` : "",
        e?.code ? `Código: ${e.code}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      setError(parts || "No se pudo registrar el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Registrar cliente</h2>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input placeholder="+34" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="border px-3 py-2 rounded-lg" />
          <input placeholder="612345678" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="border px-3 py-2 rounded-lg" />
          <input placeholder="persona@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="border px-3 py-2 rounded-lg" />
          <input placeholder="Primer nombre" value={primerNombre} onChange={(e) => setPrimerNombre(e.target.value)} className="border px-3 py-2 rounded-lg" />
          <input placeholder="Segundo nombre" value={segundoNombre} onChange={(e) => setSegundoNombre(e.target.value)} className="border px-3 py-2 rounded-lg" />
          <input placeholder="Primer apellido" value={primerApellido} onChange={(e) => setPrimerApellido(e.target.value)} className="border px-3 py-2 rounded-lg" />
          <input placeholder="Segundo apellido" value={segundoApellido} onChange={(e) => setSegundoApellido(e.target.value)} className="border px-3 py-2 rounded-lg" />
          <select value={tipo} onChange={(e) => setTipo(e.target.value as "cliente" | "interesado")} className="border px-3 py-2 rounded-lg">
            <option value="interesado">interesado</option>
            <option value="cliente">cliente</option>
          </select>

          <div className="col-span-3 flex gap-2 items-center mt-2">
            <button type="submit" disabled={submitting} className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50">
              {submitting ? "Guardando…" : "Guardar"}
            </button>
            {successMsg && <span className="text-green-600 text-sm">{successMsg}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Clientes registrados</h2>
          <input
            className="border px-3 py-2 rounded-lg"
            placeholder="Buscar por email o teléfono…"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Apellidos</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Cargando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6}>Sin resultados.</td></tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 pr-3">{new Date(c.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{c.tipo}</td>
                    <td className="py-2 pr-3">{c.primer_nombre} {c.segundo_nombre ?? ""}</td>
                    <td className="py-2 pr-3">{c.primer_apellido} {c.segundo_apellido ?? ""}</td>
                    <td className="py-2 pr-3">{c.email}</td>
                    <td className="py-2 pr-3">{c.full_phone ?? `${c.country_code}${c.phone_number}`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">Página {rows.length ? page + 1 : 0}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="border px-3 py-1 rounded-lg">Anterior</button>
            <button onClick={() => setPage(p => hasMore ? p + 1 : p)} disabled={!hasMore} className="border px-3 py-1 rounded-lg">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
