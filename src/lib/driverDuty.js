const DUTY_KEY = 'fleetco_driver_duty';

export const DRIVER_DUTY_OPTIONS = [
  { value: 'off_duty', label: 'Off Duty', short: 'OFF' },
  { value: 'sleeper_berth', label: 'Sleeper', short: 'SB' },
  { value: 'driving', label: 'Driving', short: 'DRV' },
  { value: 'on_duty_not_driving', label: 'On Duty', short: 'ON' },
];

export function getDriverDuty() {
  try {
    return localStorage.getItem(DUTY_KEY) || 'off_duty';
  } catch {
    return 'off_duty';
  }
}

export function setDriverDuty(status) {
  localStorage.setItem(DUTY_KEY, status);
  window.dispatchEvent(new CustomEvent('fleetco:duty-change', { detail: status }));
}

export function subscribeDriverDuty(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener('fleetco:duty-change', handler);
  return () => window.removeEventListener('fleetco:duty-change', handler);
}

export function dutyLabel(status) {
  return DRIVER_DUTY_OPTIONS.find((d) => d.value === status)?.label || status;
}
