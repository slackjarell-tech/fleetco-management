import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Video, User, Clock, Image as ImageIcon, MapPin } from 'lucide-react';
import { filterByCustomerId } from '@/lib/roles';
import { uploadUrl } from '@/lib/nativeBridge';

const MODE_LABELS = {
  view_ahead: 'View Ahead (Time-Lapse)',
  cabin: 'In-Cabin',
  broll: 'B-Roll',
};

export default function DriverMedia() {
  const [sessions, setSessions] = useState([]);
  const [frames, setFrames] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.auth.me(),
      api.entities.DashcamSession.list('-started_at', 100),
      api.entities.DashcamFrame.list('-captured_at', 500),
    ]).then(([u, allSessions, allFrames]) => {
      const internal = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(u?.role);
      const sess = internal ? allSessions : filterByCustomerId(allSessions, u);
      const sessionIds = new Set(sess.map((s) => s.id));
      const fr = internal ? allFrames : allFrames.filter((f) => sessionIds.has(f.session_id));
      setSessions(sess);
      setFrames(fr);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sessionFrames = selectedSession
    ? frames.filter((f) => f.session_id === selectedSession).sort((a, b) => a.frame_index - b.frame_index)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Video className="w-7 h-7 text-amber-500" /> Driver Media
        </h1>
        <p className="text-slate-500 text-sm mt-1">Dashcam time-lapse, in-cabin, and B-roll from the FleetCo Driver app — same data as the field.</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No driver media sessions yet.</p>
          <p className="text-sm mt-1">Drivers record from the app under Dashcam & Media.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSession(s.id)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${selectedSession === s.id ? 'bg-amber-50 border-l-2 border-amber-500' : ''}`}
              >
                <div className="font-bold text-slate-900 text-sm">{MODE_LABELS[s.mode] || s.mode}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3" /> {s.driver_name}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(s.started_at).toLocaleString()}</span>
                  <span>{s.frame_count} frames</span>
                  <span className="capitalize">{s.status}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
            {!selectedSession ? (
              <div className="text-center py-20 text-slate-400 text-sm">Select a session to view frames</div>
            ) : sessionFrames.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">No frames in this session</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sessionFrames.map((f) => (
                  <div key={f.id} className="rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={uploadUrl(f.image_url)}
                      alt={`Frame ${f.frame_index}`}
                      className="w-full h-28 object-cover bg-slate-100"
                    />
                    <div className="px-2 py-1.5 text-[10px] text-slate-500 flex justify-between">
                      <span>#{f.frame_index}</span>
                      {f.lat && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> GPS</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
