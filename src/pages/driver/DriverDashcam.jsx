import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { takePhoto, getCurrentPosition } from '@/lib/nativeBridge';
import {
  Video, Camera, ChevronDown, ChevronUp, Battery, MapPin, AlertTriangle,
  Square, Play, Image as ImageIcon, Mic, Wind,
} from 'lucide-react';

const MODES = [
  { id: 'view_ahead', label: 'View Ahead', desc: 'Dashcam time-lapse (photo every few seconds)' },
  { id: 'cabin', label: 'In-Cabin', desc: 'Driver/passenger vlog & reactions' },
  { id: 'broll', label: 'B-Roll', desc: 'Manual clips at stops (scenic, fuel, etc.)' },
];

const INTERVALS = [3, 5, 10, 15];

const SETUP_GUIDES = {
  view_ahead: {
    title: 'Recording the View Ahead (Dashcam Style)',
    tips: [
      'Use a sturdy, vibration-free dashboard or windshield mount.',
      'Position the lens just below your rearview mirror — don\'t block your view.',
      'Use Time-Lapse mode (photo every few seconds), not continuous video — saves memory and battery.',
      'Keep the phone plugged into a fast car charger the entire trip.',
      'Texas & some states restrict suction mounts on the main windshield — use dash mount if needed.',
      'Clean the lens before each leg; avoid digital zoom — move the mount instead.',
    ],
  },
  cabin: {
    title: 'In-Cabin Reactions & Vlogs',
    tips: [
      'MagSafe mount or flexible arm on passenger headrest or sun visor works well.',
      'Turn on camera gridlines for a straight horizon.',
      'Ultra-wide for scenic cabin shots; standard lens for close-ups.',
      'Road noise is loud — use a wireless mic or wired headphones near your collar.',
      'Capture mode: tap Capture Frame when ready (manual).',
    ],
  },
  broll: {
    title: 'B-Roll at Stops',
    tips: [
      'Only record when parked — scenic overlooks, fuel stops, rest breaks.',
      'Use 4K / 60fps or Cinematic mode on your phone for smooth slow-motion if exporting locally.',
      'Short clips: doors opening, stretching, fueling — tap Capture Frame per shot.',
      'For hours-long continuous recording, a dedicated action cam (GoPro) avoids phone overheating.',
    ],
  },
};

export default function DriverDashcam() {
  const { user } = useOutletContext();
  const [mode, setMode] = useState('view_ahead');
  const [intervalSec, setIntervalSec] = useState(5);
  const [session, setSession] = useState(null);
  const [recording, setRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [lastPreview, setLastPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const timerRef = useRef(null);

  const captureFrame = async (activeSession) => {
    if (!activeSession) return;
    setCapturing(true);
    try {
      const { file, previewUrl } = await takePhoto();
      setLastPreview(previewUrl);
      const upload = await api.integrations.Core.UploadFile({ file });
      let lat = null;
      let lng = null;
      let heading = 0;
      let speed = 0;
      try {
        const pos = await getCurrentPosition();
        lat = pos.lat;
        lng = pos.lng;
        heading = pos.heading;
        speed = pos.speed;
      } catch { /* optional */ }

      const result = await api.functions.invoke('captureDashcamFrame', {
        sessionId: activeSession.id,
        imageUrl: upload.file_url,
        lat,
        lng,
        heading,
        speed,
      });
      setFrameCount(result.frameIndex);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Capture failed');
    } finally {
      setCapturing(false);
    }
  };

  const startRecording = async () => {
    setError('');
    setMessage('');
    try {
      const result = await api.functions.invoke('startDashcamSession', {
        mode,
        intervalSec: mode === 'view_ahead' ? intervalSec : 0,
        mountNotes: SETUP_GUIDES[mode].title,
      });
      setSession(result.session);
      setRecording(true);
      setFrameCount(0);
      setMessage(result.message);

      if (mode === 'view_ahead') {
        timerRef.current = setInterval(() => captureFrame(result.session), intervalSec * 1000);
        captureFrame(result.session);
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not start session');
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!session) return;
    try {
      const result = await api.functions.invoke('stopDashcamSession', { sessionId: session.id });
      setMessage(result.message);
      setRecording(false);
      setSession(null);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not stop session');
    }
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const guide = SETUP_GUIDES[mode];

  return (
    <div className="p-4 space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-amber-500" /> Dashcam & Media
        </h1>
        <p className="text-slate-500 text-sm mt-1">Time-lapse view ahead, in-cabin shots, and B-roll — synced to your fleet office.</p>
      </div>

      {/* Setup guide */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button type="button" onClick={() => setGuideOpen(!guideOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left">
          <span className="font-bold text-slate-900 text-sm">{guide.title}</span>
          {guideOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {guideOpen && (
          <ul className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
            {guide.tips.map((tip, i) => (
              <li key={i} className="text-xs text-slate-600 flex gap-2">
                <span className="text-amber-500 font-bold">{i + 1}.</span> {tip}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Safety strip */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
          <Battery className="w-3 h-3" /> Keep plugged in
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full">
          <Wind className="w-3 h-3" /> Photos not video (saves space)
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Check local mount laws
        </span>
      </div>

      {!recording && (
        <>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Recording mode</label>
            <div className="grid gap-2 mt-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`text-left px-4 py-3 rounded-xl border ${mode === m.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
                >
                  <div className="font-bold text-sm text-slate-900">{m.label}</div>
                  <div className="text-xs text-slate-500">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {mode === 'view_ahead' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Time-lapse interval</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {INTERVALS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setIntervalSec(sec)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${intervalSec === sec ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">1 photo every {intervalSec}s — hours of driving compress into a manageable sequence.</p>
            </div>
          )}

          {mode === 'cabin' && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 flex gap-2">
              <Mic className="w-4 h-4 flex-shrink-0 mt-0.5" />
              For clear audio, use a wireless lapel mic or wired headphones near your collar — road noise is heavy in-cabin.
            </div>
          )}

          <button
            type="button"
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl"
          >
            <Play className="w-5 h-5" /> Start {mode === 'view_ahead' ? 'Time-Lapse' : 'Session'}
          </button>
        </>
      )}

      {recording && (
        <div className="space-y-4">
          <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="font-black text-sm">REC — {MODES.find((m) => m.id === mode)?.label}</div>
              <div className="text-xs text-red-100">{frameCount} frame{frameCount !== 1 ? 's' : ''} captured</div>
            </div>
            {mode === 'view_ahead' && (
              <span className="text-xs font-bold bg-red-800 px-2 py-1 rounded">every {intervalSec}s</span>
            )}
          </div>

          {lastPreview && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <img src={lastPreview} alt="Last frame" className="w-full h-40 object-cover" />
              <div className="px-3 py-2 bg-slate-50 text-xs text-slate-500 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Latest frame · synced to portal
              </div>
            </div>
          )}

          {(mode === 'cabin' || mode === 'broll') && (
            <button
              type="button"
              disabled={capturing}
              onClick={() => captureFrame(session)}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl disabled:opacity-60"
            >
              <Camera className="w-5 h-5" /> {capturing ? 'Capturing…' : 'Capture Frame'}
            </button>
          )}

          <button
            type="button"
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
          >
            <Square className="w-4 h-4" /> Stop & Save Session
          </button>
        </div>
      )}

      {message && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">{message}</div>}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}

      <p className="text-xs text-slate-400 flex items-center gap-1">
        <MapPin className="w-3 h-3" /> GPS tagged on each frame · customers view under Driver Media in portal
      </p>
    </div>
  );
}
