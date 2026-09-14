import { mpsToMph } from '@/lib/vehicleMapColors';

export function truckCircleIcon(L, color, { speedMps, label, size = 16, pulse = false } = {}) {
  const mph = mpsToMph(speedMps);
  const speedHtml = mph > 0
    ? `<div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.85);color:white;font-size:9px;font-weight:800;padding:1px 4px;border-radius:4px;white-space:nowrap">${mph} mph</div>`
    : '';
  const labelHtml = label
    ? `<div style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:700;color:#334155;white-space:nowrap">${label}</div>`
    : '';
  const pulseRing = pulse
    ? `<div style="position:absolute;inset:-5px;border-radius:50%;background:${color}33;animation:pulse 2s infinite"></div>`
    : '';

  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px">
      ${speedHtml}${labelHtml}${pulseRing}
      <div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function trailerRectIcon(L, color, { label, stale = false, size = 18 } = {}) {
  const w = Math.round(size * 1.6);
  const h = size;
  const border = stale ? '2px dashed #64748b' : `2px solid white`;
  const opacity = stale ? 0.75 : 1;
  const labelHtml = label
    ? `<div style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:700;color:#334155;white-space:nowrap">📦 ${label}</div>`
    : '';

  return L.divIcon({
    html: `<div style="position:relative;width:${w}px;height:${h}px;opacity:${opacity}">
      ${labelHtml}
      <div style="background:${color};width:${w}px;height:${h}px;border-radius:3px;border:${border};box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>
    </div>`,
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
  });
}

/** Offset trailer slightly east of truck when coupled (approx 0.0003 deg ~ 30m). */
export function offsetTrailerCoords(lat, lng) {
  return [lat, lng + 0.00035];
}

export function startOfLocalDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
