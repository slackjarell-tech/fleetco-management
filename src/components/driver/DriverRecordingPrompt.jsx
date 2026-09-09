import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Video, Radio, Play } from 'lucide-react';

/**
 * Home-screen banner — driver can start recording themselves or accept an office request.
 */
export default function DriverRecordingPrompt({ user }) {
  const livekitReady = !!user?.livekit_configured;
  const canStream = livekitReady && user?.driver_dual_camera_enabled !== false;
  const [officeRequest, setOfficeRequest] = useState(null);

  useEffect(() => {
    if (!canStream) return undefined;
    const check = async () => {
      try {
        const result = await api.functions.invoke('getPendingLiveVideoRequest');
        setOfficeRequest(result.pending ? result : null);
      } catch {
        setOfficeRequest(null);
      }
    };
    check();
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
  }, [canStream]);

  if (!canStream) return null;

  return (
    <div className="bg-gradient-to-br from-red-950 to-slate-800 rounded-xl border border-red-800/60 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-red-600/30 rounded-xl flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-black text-sm">Live dashcam recording</div>
          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
            You can start recording yourself — or your fleet office can request you to go live.
          </p>
        </div>
      </div>

      {officeRequest && (
        <Link
          to={`/driver/dashcam?accept=${officeRequest.pending.id}`}
          className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl text-sm"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          Office requested recording — tap to start
        </Link>
      )}

      <Link
        to="/driver/dashcam?autostart=1"
        className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl"
      >
        <Play className="w-5 h-5" />
        Start Recording
      </Link>
    </div>
  );
}
