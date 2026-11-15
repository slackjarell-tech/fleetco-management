import React, { useEffect, useState } from 'react';
import { X, Mic, Loader2, Zap } from 'lucide-react';
import { listenOnce, speakRevan, stopSpeaking, speechRecognitionAvailable } from '@/lib/revanVoice';

/**
 * Full-screen "TV mode" Jarvis — matches Luke Builds AI speak / big-screen demo.
 */
export default function JarvisSpeakMode({ open, onClose, onUtterance, statusText, listening: parentListening }) {
  const [localListening, setLocalListening] = useState(false);
  const listening = parentListening ?? localListening;

  const promptMic = () => {
    if (!speechRecognitionAvailable()) return;
    setLocalListening(true);
    listenOnce({
      onResult: (text) => {
        setLocalListening(false);
        onUtterance?.(text);
      },
      onError: () => setLocalListening(false),
      onEnd: () => setLocalListening(false),
    });
  };

  useEffect(() => {
    if (!open) {
      stopSpeaking();
      setLocalListening(false);
      return;
    }
    speakRevan('Revan online. At your service.', {
      onEnd: () => promptMic(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col items-center justify-center p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
        aria-label="Exit Jarvis mode"
      >
        <X className="w-6 h-6" />
      </button>

      <motionOrb listening={listening} />

      <p className="text-violet-200/90 text-sm mt-8 text-center max-w-md">
        {statusText || (listening ? 'Listening…' : 'Jarvis speak mode — talk naturally')}
      </p>

      <button
        type="button"
        onClick={promptMic}
        className={`mt-8 flex items-center gap-2 px-6 py-3 rounded-full border text-sm font-medium ${
          listening
            ? 'border-red-500/50 bg-red-500/10 text-red-200 animate-pulse'
            : 'border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20'
        }`}
      >
        {listening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        {listening ? 'Listening…' : 'Tap to speak'}
      </button>
    </div>
  );
}

function motionOrb({ listening }) {
  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64">
      <div
        className={`absolute inset-0 rounded-full border-2 border-violet-400/50 bg-gradient-to-br from-violet-600/40 via-slate-950 to-violet-900/30 shadow-[0_0_80px_rgba(139,92,246,0.55)] ${
          listening ? 'animate-pulse scale-105' : 'animate-[pulse_3s_ease-in-out_infinite]'
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap className="w-16 h-16 text-violet-200 drop-shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
      </div>
    </div>
  );
}