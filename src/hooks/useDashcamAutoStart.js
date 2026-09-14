import { useEffect, useRef } from 'react';

/**
 * Auto-start road cam when duty = Driving (semi/OTR workflow). No API keys.
 */
export function useDashcamAutoStart({
  enabled,
  duty,
  clockedIn,
  canRecord,
  recording,
  starting,
  startRecording,
  stopRecording,
}) {
  const lastDutyRef = useRef(duty);

  useEffect(() => {
    if (!enabled || !canRecord || starting) return;

    const prev = lastDutyRef.current;
    lastDutyRef.current = duty;

    if (duty === 'driving' && clockedIn && !recording) {
      startRecording();
      return;
    }

    if (
      recording
      && (duty === 'off_duty' || duty === 'sleeper_berth')
      && prev === 'driving'
    ) {
      stopRecording();
    }
  }, [
    enabled,
    duty,
    clockedIn,
    canRecord,
    recording,
    starting,
    startRecording,
    stopRecording,
  ]);
}
