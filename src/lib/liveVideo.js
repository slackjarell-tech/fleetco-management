import { getToken } from '@/api/apiClient';
import { apiUrl } from '@/lib/nativeBridge';

/** Upload WebM recording after live stream ends. */
export async function uploadLiveRecording(blob, { sessionId, track = 'road' } = {}) {
  const form = new FormData();
  const name = track === 'cabin' ? 'cabin.webm' : 'road.webm';
  form.append('file', blob, name);
  if (sessionId) form.append('sessionId', sessionId);

  const headers = {};
  const token = getToken?.() || localStorage.getItem('fleet_pulse_access_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl('/live-recordings/upload'), {
    method: 'POST',
    headers,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export function liveRecordingDownloadUrl(recordingId, track = 'road') {
  const q = track === 'cabin' ? '?track=cabin' : '';
  return apiUrl(`/live-recordings/${recordingId}/download${q}`);
}

export function daysRemainingLabel(rec) {
  if (rec.archived) return 'Saved permanently';
  if (rec.days_remaining == null) return '';
  if (rec.days_remaining <= 0) return 'Expires today';
  return `${rec.days_remaining} day${rec.days_remaining === 1 ? '' : 's'} left`;
}

/** Authenticated download (Bearer token) for fleet managers. */
export async function downloadLiveRecording(recordingId, track = 'road', filename) {
  const headers = {};
  const token = getToken?.() || localStorage.getItem('fleet_pulse_access_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(liveRecordingDownloadUrl(recordingId, track), { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Download failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `FleetCo-recording-${recordingId}.webm`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
