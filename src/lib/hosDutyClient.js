import { api } from '@/api/apiClient';

/** Record movement / vehicle login for HOS clock snapshots. */
export async function recordHosMovementEvent(payload) {
  try {
    return await api.functions.invoke('recordHosMovementEvent', payload);
  } catch {
    return null;
  }
}
