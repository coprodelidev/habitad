'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const CUHImport = dynamic(() => import('./CUHImport'), { ssr: false });

export default function CatalogoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Catálogo CUH</h1>
        <CUHImport />
      </div>
    </div>
  );
}