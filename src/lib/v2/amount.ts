export function parseAmountInput(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const raw = String(value ?? '').trim().replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  if (!raw) return 0;

  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  let normalized = raw;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/,/g, '');
  } else if (lastComma >= 0) {
    const [whole, fraction = ''] = raw.split(',');
    normalized = fraction.length === 3 && whole.length <= 3
      ? raw.replace(/,/g, '')
      : raw.replace(',', '.');
  } else if (lastDot >= 0) {
    const [whole, fraction = ''] = raw.split('.');
    normalized = fraction.length === 3 && whole.length <= 3
      ? raw.replace(/\./g, '')
      : raw;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}
