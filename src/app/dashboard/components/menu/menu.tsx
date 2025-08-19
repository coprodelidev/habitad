'use client';

import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Menu() {
  const { roleId, loading } = useUser();
  console.log("📌 Estado del UserContext:", { roleId, loading });

  if (loading) {
    console.log("⏳ Cargando menú...");
    return <div className="text-white p-4">Cargando menú...</div>;
  }

  if (!roleId) {
    console.log("⚠️ No hay roleId, mostrando menú de invitado");
    return (
      <nav className="flex flex-col gap-2 p-4 bg-[rgb(14,8,201)]">
        <Link href="/" className="text-white hover:text-blue-300 transition-colors duration-200">Inicio</Link>
        <Link href="/login" className="text-white hover:text-blue-300 transition-colors duration-200">Iniciar sesión</Link>
      </nav>
    );
  }

  const menuItems = [];
  if (roleId === 'bcff237c-9c85-483d-bcf4-f2e0b531098a') {
    // Administrador: ve todas las pestañas
    console.log("✅ Mostrando menú de administrador");
    menuItems.push(
      <Link key="inicio" href="/dashboard" className="text-white hover:text-blue-300 transition-colors duration-200">Inicio</Link>,
      <Link key="cuh" href="/dashboard/components/catalogo" className="text-white hover:text-blue-300 transition-colors duration-200">CUH</Link>,
      <Link key="stock" href="/dashboard/components/stock" className="text-white hover:text-blue-300 transition-colors duration-200">Propiedades</Link>,
      <Link key="clients" href="/dashboard/components/clientes" className="text-white hover:text-blue-300 transition-colors duration-200">Registro</Link>,
      <Link key="Pagos" href="/dashboard/components/gestion-pagos" className="text-white hover:text-blue-300 transition-colors duration-200">Gestión de pagos</Link>,
    );
  } else if (roleId === 'bd693628-4a47-4176-8689-8f8ced52d469') {
    // Promotor: ve solo Stock y Clientes
    console.log("✅ Mostrando menú de promotor");
    menuItems.push(
      <Link key="stock" href="/dashboard/components/stock" className="text-white hover:text-blue-300 transition-colors duration-200">Stock</Link>,
      <Link key="clients" href="/dashboard/components/clientes" className="text-white hover:text-blue-300 transition-colors duration-200">Clientes</Link>,
      <Link key="Pagos" href="/dashboard/components/gestion-pagos" className="text-white hover:text-blue-300 transition-colors duration-200">Gestión de pagos</Link>,
    );
  } else if (roleId === '883ed691-dbc7-448f-9635-18f6c1a6db5e') {
    // Asistente: ve solo CUH
    console.log("✅ Mostrando menú de asistente");
    menuItems.push(
      <Link key="cuh" href="/dashboard/components/catalogo" className="text-white hover:text-blue-300 transition-colors duration-200">CUH</Link>
    );
  } else {
    // Supervisor u otros roles: menú básico (Inicio)
    console.log("ℹ️ Mostrando menú de supervisor u otro rol");
    menuItems.push(
      <Link key="inicio" href="/dashboard" className="text-white hover:text-blue-300 transition-colors duration-200">Inicio</Link>
    );
  }

  return (
    <nav className="flex flex-col gap-2 p-4 bg-[rgb(14,8,201)]">
      {menuItems}
      <button
        onClick={async () => {
          console.log("🔴 Cerrando sesión...");
          await supabase.auth.signOut();
          window.location.href = '/';
        }}
        className="text-white hover:text-blue-300 transition-colors duration-200 text-left"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}