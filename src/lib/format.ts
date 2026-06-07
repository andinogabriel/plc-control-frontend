/** Locale-aware number formatting (Argentine Spanish: comma decimals). */
const nf1 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** One-decimal number, e.g. 20.7 -> "20,7". */
export function formatNumber(value: number): string {
  return nf1.format(value);
}

/** Temperature with unit, e.g. "20,7 °C". */
export function formatTemp(value: number): string {
  return `${nf1.format(value)} °C`;
}

/** Percentage with unit, e.g. "38,2 %". */
export function formatPct(value: number): string {
  return `${nf1.format(value)} %`;
}
