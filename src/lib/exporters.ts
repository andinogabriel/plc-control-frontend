/** Tiny client-side exporters for tables (CSV) and charts (PNG). */
import { notifyToast } from '../components/toast';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  // Confirm the download started (the browser's own download UI is easy to miss).
  notifyToast(filename.endsWith('.csv') ? 'CSV descargado' : 'Imagen descargada', 'success');
}

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface CsvColumn<T> { header: string; value: (row: T) => unknown }

/** Builds the CSV text (header row + body) for the given rows and columns. */
export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => csvCell(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(',')).join('\n');
  return `${head}\n${body}`;
}

/** Builds a UTF-8 CSV (BOM included so Excel respects accents) and downloads it. */
export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  triggerDownload(new Blob(['﻿', buildCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' }), filename);
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

export interface ChartPngMeta {
  /** Chart name, drawn as a header (e.g. "Temperatura vs tiempo"). */
  title?: string;
  /** Screen the chart came from, drawn in the footer (e.g. "Mediciones"). */
  source?: string;
  /** Series legend, drawn under the title (the on-screen legend is HTML, not part of the SVG, so
   *  the export would otherwise have no colour key). `dashed` draws a dashed line swatch;
   *  `area` draws a filled-zone swatch (for shaded regions like the setpoint band or cooler-ON). */
  legend?: { label: string; color: string; dashed?: boolean; area?: boolean }[];
}

const FONT_STACK = 'Inter, Roboto, Helvetica, Arial, sans-serif';

/**
 * High-contrast ink colour for the given background. The on-screen axis labels use a muted grey
 * (`text.secondary`) that reads fine in the card but washes out on a flat exported image, so the
 * export forces a near-black (on light) or near-white (on dark) colour instead.
 */
export function contrastInk(bg: string): string {
  const parts = bg.match(/\d+(\.\d+)?/g);
  if (!parts || parts.length < 3) return '#0f172a';
  const [r, g, b] = parts.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0f172a' : '#f8fafc';
}

/**
 * Serialises the first chart SVG inside {@code container} to a PNG and downloads it. Computed
 * styles are inlined so the export matches the on-screen chart (colours, strokes, fonts),
 * regardless of light/dark theme. A title header and a footer (source screen + download
 * date/time) are baked into the image so a saved chart is self-describing.
 */
export async function exportChartPng(container: HTMLElement | null, filename: string, meta: ChartPngMeta = {}) {
  // Target the chart surface specifically: the card also contains the download button's icon
  // SVG (which would otherwise be picked first and exported as a blank image). MUI X v9 moved
  // the `MuiChartsSurface-root` class onto the layer container (a <div>) with the <svg> nested
  // inside; older versions put it on the <svg> itself. Resolve to the real <svg> either way.
  const surface = container?.querySelector('.MuiChartsSurface-root');
  const svg = (surface instanceof SVGSVGElement ? surface : surface?.querySelector('svg'))
    ?? container?.querySelector('svg');
  if (!svg) return;

  const rect = svg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const scale = 2;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineSvgStyles(svg, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const styles = getComputedStyle(container as Element);
  const bg = styles.backgroundColor || '#ffffff';
  const opaqueBg = bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' ? '#ffffff' : bg;
  const textColor = contrastInk(opaqueBg);

  // The muted-grey axis text washes out on the flat export; force it to the high-contrast ink.
  // (Reference-line labels live outside `MuiChartsAxis-root`, so their colours are preserved.)
  clone.querySelectorAll('.MuiChartsAxis-root text, .MuiChartsAxis-root tspan').forEach((el) => {
    (el as SVGElement).style.fill = textColor;
  });
  clone.setAttribute('width', String(rect.width));
  clone.setAttribute('height', String(rect.height));

  const legend = meta.legend ?? [];
  const headerH = meta.title ? 36 : 0;
  const legendH = legend.length ? 24 : 0;
  const footerH = 26;
  const w = rect.width;
  const totalH = headerH + legendH + rect.height + footerH;

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = totalH * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = opaqueBg;
        ctx.fillRect(0, 0, w, totalH);
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'middle';

        if (meta.title) {
          ctx.font = `600 16px ${FONT_STACK}`;
          ctx.textAlign = 'left';
          ctx.fillText(meta.title, 12, headerH / 2 + 2);
        }

        // Legend row (line swatch + label), centred under the title — solid or dashed per series.
        if (legend.length) {
          ctx.font = `600 12px ${FONT_STACK}`;
          const swatch = 18;
          const gap = 6;
          const itemGap = 18;
          const items = legend.map((l) => ({ ...l, tw: ctx.measureText(l.label).width }));
          const totalW = items.reduce((acc, it) => acc + swatch + gap + it.tw, 0) + itemGap * (items.length - 1);
          let x = Math.max(12, (w - totalW) / 2);
          const ly = headerH + legendH / 2;
          for (const it of items) {
            if (it.area) {
              // Filled-zone swatch (shaded region: setpoint band, cooler-ON), matching the chart.
              ctx.globalAlpha = 0.22;
              ctx.fillStyle = it.color;
              ctx.fillRect(x, ly - 5, swatch, 10);
              ctx.globalAlpha = 1;
              ctx.strokeStyle = it.color;
              ctx.lineWidth = 1;
              ctx.setLineDash([]);
              ctx.strokeRect(x + 0.5, ly - 4.5, swatch - 1, 9);
            } else {
              ctx.strokeStyle = it.color;
              ctx.lineWidth = 3;
              ctx.setLineDash(it.dashed ? [5, 4] : []);
              ctx.beginPath();
              ctx.moveTo(x, ly);
              ctx.lineTo(x + swatch, ly);
              ctx.stroke();
              ctx.setLineDash([]);
            }
            ctx.fillStyle = textColor;
            ctx.textAlign = 'left';
            ctx.fillText(it.label, x + swatch + gap, ly);
            x += swatch + gap + it.tw + itemGap;
          }
        }

        ctx.drawImage(img, 0, headerH + legendH, w, rect.height);

        const fy = headerH + legendH + rect.height + footerH / 2;
        ctx.globalAlpha = 0.65;
        ctx.font = `12px ${FONT_STACK}`;
        if (meta.source) { ctx.textAlign = 'left'; ctx.fillText(meta.source, 12, fy); }
        ctx.textAlign = 'right';
        ctx.fillText(
          `Descargado: ${new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'medium', hour12: false })}`,
          w - 12, fy,
        );
        ctx.globalAlpha = 1;

        canvas.toBlob((blob) => { if (blob) triggerDownload(blob, filename); resolve(); }, 'image/png');
      } else resolve();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    img.src = url;
  });
}
