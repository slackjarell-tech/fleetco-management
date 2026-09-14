import { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';

/** Active Time Clock shift for the driver (tractor + trailer assignment). */
export function useActiveShift(userId) {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setShift(null);
      setLoading(false);
      return undefined;
    }

    const load = async () => {
      try {
        const entries = await api.entities.TimeClockEntry.filter({ user_id: userId }, '-clock_in', 30);
        const active = (entries || []).find((e) => e.entry_type === 'shift' && !e.clock_out);
        setShift(active || null);
      } catch {
        setShift(null);
      } finally {
        setLoading(false);
      }
    };

    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [userId]);

  return { shift, loading, clockedIn: !!shift };
}
