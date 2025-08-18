'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Carga dinámica por si el bundle de xlsx pesa
const CUHImport = dynamic(() => import('./CUHImport'), { ssr: false });

export default function CatalogoPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Catálogo CUH</h1>
      <CUHImport />
    </div>
  );
}
