import type { Moneda } from './types';

export function formatMoney(amount: number | null | undefined, moneda: Moneda = 'USD'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const symbol = moneda === 'PEN' ? 'S/' : '$';
  return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeRemaining(target: string | Date | null | undefined): string {
  if (!target) return '—';
  const d = typeof target === 'string' ? new Date(target) : target;
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return 'Vencida';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}
