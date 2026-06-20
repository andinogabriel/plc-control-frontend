const BASE_ICON = '/uncaus-logo-color.svg';

/**
 * Overlays a red alarm dot on the app icon when there are unacknowledged alarms (and restores the
 * plain logo at zero), so the browser tab signals a pending alarm even when the app isn't focused.
 * Draws the SVG logo onto a canvas and adds the badge; same-origin, so the canvas isn't tainted.
 */
export function setFaviconAlarm(active: boolean): void {
  const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) return;

  if (!active) {
    link.type = 'image/svg+xml';
    link.href = BASE_ICON;
    return;
  }

  const img = new Image();
  img.onload = () => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, size, size);
    const r = size * 0.26;
    ctx.beginPath();
    ctx.arc(size - r, size - r, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = size * 0.06;
    ctx.strokeStyle = '#0b1120';
    ctx.stroke();

    link.type = 'image/png';
    link.href = canvas.toDataURL('image/png');
  };
  img.src = BASE_ICON;
}
