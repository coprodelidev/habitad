"use client";

import React from "react";
import { Header, exportCSV, exportXLS } from "./exportUtils";

type Props = {
  filename: string;
  headers: Header[];
  rows: any[]; // ya mapeados a las keys del header
};

export default function DownloadButtons({ filename, headers, rows }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportCSV(filename, headers, rows)}
        className="rounded bg-emerald-600 px-3 py-2 text-white text-xs hover:bg-emerald-700"
      >
        Descargar CSV
      </button>
      <button
        onClick={() => exportXLS(filename, headers, rows)}
        className="rounded bg-indigo-600 px-3 py-2 text-white text-xs hover:bg-indigo-700"
      >
        Descargar XLS
      </button>
    </div>
  );
}
