export type Header = { key: string; label: string };

/** Convierte un arreglo de objetos a CSV robusto (escapando comas, comillas y saltos de línea) */
export function exportCSV(filename: string, headers: Header[], data: any[]) {
  const headerLine = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(",");
  const lines = data.map(row =>
    headers
      .map(h => {
        const v = row[h.key] ?? "";
        const s = String(v);
        return `"${s.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headerLine, ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** "XLS" simple vía HTML table (compatible con Excel) sin dependencias externas */
export function exportXLS(filename: string, headers: Header[], data: any[]) {
  const th = headers.map(h => `<th>${escapeHtml(h.label)}</th>`).join("");
  const trs = data
    .map(row => {
      const tds = headers.map(h => `<td>${escapeHtml(row[h.key] ?? "")}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  const html =
    `<!DOCTYPE html><html><head><meta charset="utf-8" />` +
    `<meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=utf-8" /></head>` +
    `<body><table border="1"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeHtml(v: any) {
  const s = String(v ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
