import { isNativeApp } from '@/lib/platform';

/** Android foreground notification while road cam is active — keeps process alive (no API keys). */
export async function startDashcamForegroundService(label = 'Road cam active') {
  if (!isNativeApp()) return;
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const DashcamService = registerPlugin('DashcamService');
    await DashcamService.start({ label });
  } catch (err) {
    console.warn('[dashcam-fg] start failed:', err?.message || err);
  }
}

export async function stopDashcamForegroundService() {
  if (!isNativeApp()) return;
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const DashcamService = registerPlugin('DashcamService');
    await DashcamService.stop();
  } catch (err) {
    console.warn('[dashcam-fg] stop failed:', err?.message || err);
  }
}

export function mpsToMph(mps) {
  if (mps == null || !Number.isFinite(Number(mps))) return null;
  return Math.round(Number(mps) * 2.23694);
}
