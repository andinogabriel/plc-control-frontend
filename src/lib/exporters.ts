/** Tiny client-side exporters for tables (CSV) and charts (PNG). No dependencies. */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface CsvColumn<T> { header: string; value: (row: T) => unknown }

/** Builds a UTF-8 CSV (BOM included so Excel respects accents) and downloads it. */
export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const head = columns.map((c) => csvCell(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(',')).join('\n');
  triggerDownload(new Blob(['﻿', head, '\n', body], { type: 'text/csv;charset=utf-8;' }), filename);
}

// SVG presentation properties that come from CSS classes (our chartStyle) rather than
// attributes. They must be inlined onto the clone or the serialized SVG paints blank.
// NOTE: never inline `transform` — SVG groups position themselves via transform *attributes*
// (preserved by cloneNode); overriding them with a computed value breaks the whole layout.
const SVG_STYLE_PROPS = [
  'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
  'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-size', 'font-family',
  'font-weight', 'text-anchor', 'dominant-baseline',
];

/** Copies computed styles from a live SVG tree onto its clone (lockstep traversal). */
function inlineSvgStyles(source: Element, target: Element) {
  const computed = window.getComputedStyle(source);
  let decl = '';
  for (const prop of SVG_STYLE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (value) decl += `${prop}:${value};`;
  }
  target.setAttribute('style', decl);
  const sChildren = source.children;
  const tChildren = target.children;
  for (let i = 0; i < sChildren.length; i += 1) {
    if (tChildren[i]) inlineSvgStyles(sChildren[i], tChildren[i]);
  }
}

/**
 * Serialises the first chart SVG inside {@code container} to a PNG and downloads it. Computed
 * styles are inlined so the export matches the on-screen chart (colours, strokes, fonts),
 * regardless of light/dark theme.
 */
export async function exportChartPng(container: HTMLElement | null, filename: string) {
  const svg = container?.querySelector('svg');
  if (!svg) return;

  const rect = svg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const scale = 2;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineSvgStyles(svg, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(rect.width));
  clone.setAttribute('height', String(rect.height));

  const bg = getComputedStyle(container as Element).backgroundColor || '#ffffff';
  const opaqueBg = bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' ? '#ffffff' : bg;

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = opaqueBg;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        canvas.toBlob((blob) => { if (blob) triggerDownload(blob, filename); resolve(); }, 'image/png');
      } else resolve();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    img.src = url;
  });
}
