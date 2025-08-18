'use client';

import React, { useState } from 'react';
import StockList from './stock-list';
import StockPlan from './stock-plan'; // 👈 nuevo

export default function StockPage() {
  const [view, setView] = useState<'lista' | 'plano'>('lista');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stock</h1>
        <div className="inline-flex overflow-hidden rounded-md border">
          <button
            onClick={() => setView('lista')}
            className={`px-3 py-1.5 text-sm ${view==='lista'?'bg-gray-900 text-white':'bg-white'}`}
          >
            Listado
          </button>
          <button
            onClick={() => setView('plano')}
            className={`px-3 py-1.5 text-sm ${view==='plano'?'bg-gray-900 text-white':'bg-white'}`}
          >
            Plano
          </button>
        </div>
      </div>

      {view === 'lista' ? <StockList /> : <StockPlan />}
    </div>
  );
}
