'use client';

import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  Home, Building, Users, FileText, CreditCard, BarChart3, 
  BookOpen, Zap, Settings, LogOut 
} from 'lucide-react';

export default function Menu() {
  const { roleId, loading } = useUser();
  console.log("📌 Estado del UserContext:", { roleId, loading });

  if (loading) {
    console.log("⏳ Cargando menú...");
    return (
      <div className="flex items-center justify-center h-full text-white p-4">
        <div className="animate-pulse">Cargando menú...</div>
      </div>
    );
  }

  if (!roleId) {
    console.log("⚠️ No hay roleId, mostrando menú de invitado");
    return (
      <nav className="flex flex-col gap-2 p-6 bg-[rgb(14,8,201)] h-full">
        <Link key="inicio" href="/dashboard" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
          <Home size={20} />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link key="cuh" href="/dashboard/components/catalogo" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
          <BookOpen size={20} />
          <span className="font-medium">Catálogo</span>
        </Link>
        <Link key="stock" href="/dashboard/components/stock" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
          <Building size={20} />
          <span className="font-medium">Propiedades</span>
        </Link>
        <Link key="clients" href="/dashboard/components/clientes" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
          <Users size={20} />
          <span className="font-medium">Registro</span>
        </Link>
        <Link key="pagos" href="/dashboard/components/gestion-pagos" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
          <CreditCard size={20} />
          <span className="font-medium">Gestión de pagos</span>
        </Link>
        <Link key="reporte" href="/dashboard/components/Reporte" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
          <BarChart3 size={20} />
          <span className="font-medium">Reporte</span>
        </Link>
      </nav>
    );
  }

  const menuItems = [];
  
  // Administrador: ve todas las secciones
  if (roleId === 'bcff237c-9c85-483d-bcf4-f2e0b531098a') {
    console.log("✅ Mostrando menú de administrador");
    menuItems.push(
      <Link key="inicio" href="/dashboard" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Home size={20} />
        <span className="font-medium">Dashboard</span>
      </Link>,
      <Link key="catalogo" href="/dashboard/components/catalogo" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <BookOpen size={20} />
        <span className="font-medium">Catálogo</span>
      </Link>,
      <Link key="propiedades" href="/dashboard/components/stock" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Building size={20} />
        <span className="font-medium">Propiedades</span>
      </Link>,
      <Link key="registro" href="/dashboard/components/clientes" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Users size={20} />
        <span className="font-medium">Registro</span>
      </Link>,
      <Link key="pagos" href="/dashboard/components/gestion-pagos" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <CreditCard size={20} />
        <span className="font-medium">Gestión de pagos</span>
      </Link>,
      <Link key="reporte" href="/dashboard/components/Reporte" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <BarChart3 size={20} />
        <span className="font-medium">Reporte</span>
      </Link>
    );
  } 
  // Promotor: ve propiedades, registro, gestión de pagos
  else if (roleId === 'bd693628-4a47-4176-8689-8f8ced52d469') {
    console.log("✅ Mostrando menú de promotor");
    menuItems.push(
      <Link key="propiedades" href="/dashboard/components/stock" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Building size={20} />
        <span className="font-medium">Propiedades</span>
      </Link>,
      <Link key="registro" href="/dashboard/components/clientes" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Users size={20} />
        <span className="font-medium">Registro</span>
      </Link>,
      <Link key="pagos" href="/dashboard/components/gestion-pagos" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <CreditCard size={20} />
        <span className="font-medium">Gestión de pagos</span>
      </Link>
    );
  } 
  // Asistente: ve solo catálogo
  else if (roleId === '883ed691-dbc7-448f-9635-18f6c1a6db5e') {
    console.log("✅ Mostrando menú de asistente");
    menuItems.push(
      <Link key="catalogo" href="/dashboard/components/catalogo" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <BookOpen size={20} />
        <span className="font-medium">Catálogo</span>
      </Link>
    );
  }
  // Cliente: ve todas las secciones
  else if (roleId === 'c49c8eaa-2f2b-48f1-a260-8e1efd90e570') {
    console.log("✅ Mostrando menú de cliente");
    menuItems.push(
      <Link key="inicio" href="/dashboard" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Home size={20} />
        <span className="font-medium">Dashboard</span>
      </Link>,
      <Link key="catalogo" href="/dashboard/components/catalogo" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <BookOpen size={20} />
        <span className="font-medium">Catálogo</span>
      </Link>,
      <Link key="propiedades" href="/dashboard/components/stock" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Building size={20} />
        <span className="font-medium">Propiedades</span>
      </Link>,
      <Link key="registro" href="/dashboard/components/clientes" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Users size={20} />
        <span className="font-medium">Registro</span>
      </Link>,
      <Link key="pagos" href="/dashboard/components/gestion-pagos" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <CreditCard size={20} />
        <span className="font-medium">Gestión de pagos</span>
      </Link>,
      <Link key="reporte" href="/dashboard/components/Reporte" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <BarChart3 size={20} />
        <span className="font-medium">Reporte</span>
      </Link>
    );
  }
  // Coordinador: ve catálogo y reportes
  else if (roleId === '74a6b0c3-fe44-4bfc-9c75-56851f8951d2') {
    console.log("✅ Mostrando menú de coordinador");
    menuItems.push(
      <Link key="catalogo" href="/dashboard/components/catalogo" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <BookOpen size={20} />
        <span className="font-medium">Catálogo</span>
      </Link>,
      <Link key="reporte" href="/dashboard/components/Reporte" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <BarChart3 size={20} />
        <span className="font-medium">Reporte</span>
      </Link>
    );
  }
  // Otros roles: menú básico (Dashboard)
  else {
    console.log("ℹ️ Mostrando menú básico para otros roles");
    menuItems.push(
      <Link key="inicio" href="/dashboard" className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200">
        <Home size={20} />
        <span className="font-medium">Dashboard</span>
      </Link>
    );
  }

  return (
    <nav className="flex flex-col h-full justify-between p-6 bg-[rgb(14,8,201)]">
      <div className="flex flex-col gap-1">
        {menuItems}
      </div>
      <button
        onClick={async () => {
          console.log("🔴 Cerrando sesión...");
          await supabase.auth.signOut();
          window.location.href = '/';
        }}
        className="flex items-center gap-3 text-white hover:bg-blue-800 p-3 rounded-lg transition-colors duration-200 mt-auto"
      >
        <LogOut size={20} />
        <span className="font-medium">Cerrar sesión</span>
      </button>
    </nav>
  );
}