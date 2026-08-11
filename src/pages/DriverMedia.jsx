import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Video, User, Clock, MapPin, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { filterByCustomerId, isFleetCoAdmin } from '@/lib/roles';
import { canManageCustomerTeam } from '@/lib/customerRoles';
import { uploadUrl } from '@/lib/nativeBridge';

const MODE_LABELS = {
  view_ahead: 'View Ahead (Time-Lapse)',
  dual_monitoring: 'Road + Driver (Dual ELD)',
  cabin: 'In-Cabin',
  broll: 'B-Roll',
};

function groupFramesForDisplay(frames) {
  const road = frames.filter((f) => f.camera_facing !== 'cabin');
  const cabinByPair = new Map(
    frames.filter((f) => f.camera_facing === 'cabin').map((f) => [f.frame_index, f])
  );
  const cabinByPairId = new Map(
    frames.filter((f) => f.camera_facing === 'cabin' && f.pair_frame_id).map((f) => [f.pair_frame_id, f])
  );

  return road
    .sort((a, b) => a.frame_index - b.frame_index)
    .map((roadFrame) => ({
      index: roadFrame.frame_index,
      road: roadFrame,
      cabin: cabinByPair.get(roadFrame.frame_index) || cabinByPairId.get(roadFrame.id) || null,
    }));
}

export default function DriverMedia() {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [frames, setFrames] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDual, setSavingDual] = useState(false);

  const load = async () => {
    const [u, allSessions, allFrames] = await Promise.all([
      api.auth.me(),
      api.entities.DashcamSession.list('-started_at', 100),
      api.entities.DashcamFrame.list('-captured_at', 500),
    ]);
    setUser(u);
    const internal = isFleetCoAdmin(u?.role) || ['fleet_manager', 'fleet_coordinator'].includes(u?.role);
    const sess = internal ? allSessions : filterByCustomerId(allSessions, u);
    const sessionIds = new Set(sess.map((s) => s.id));
    const fr = internal ? allFrames : allFrames.filter((f) => sessionIds.has(f.session_id));
    setSessions(sess);
    setFrames(fr);

    if (u?.customer_id && canManageCustomerTeam(u.role)) {
      const rows = await api.entities.Customer.filter({ id: u.customer_id });
      setCustomer(rows[0] || null);
    }
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const sessionFrames = selectedSession
    ? frames.filter((f) => f.session_id === selectedSession)
    : [];

  const selectedSessionMeta = sessions.find((s) => s.id === selectedSession);
  const displayGroups = groupFramesForDisplay(sessionFrames);
  const canManageDual = customer && canManageCustomerTeam(user?.role);

  const toggleDualCamera = async () => {
    if (!customer) return;
    setSavingDual(true);
    try {
      const next = !customer.driver_dual_camera_enabled;
      await api.entities.Customer.update(customer.id, { driver_dual_camera_enabled: next });
      setCustomer({ ...customer, driver_dual_camera_enabled: next });
    } finally {
      setSavingDual(false);
    }
  };

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
        <p className="text-slate-500 text-sm mt-1">
          Dashcam time-lapse, dual road + driver monitoring, and field captures from the FleetCo Driver app.
        </p>
      </div>

      {canManageDual && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" /> Dual camera & distraction monitoring
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              When enabled, drivers can run <strong>Road + Driver (Dual ELD)</strong> mode — rear camera on the road and front camera on the driver at the same time. Review both feeds here to check road conditions and driver focus.
            </p>
          </div>
          <button
            type="button"
            disabled={savingDual}
            onClick={toggleDualCamera}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shrink-0 ${
              customer.driver_dual_camera_enabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {customer.driver_dual_camera_enabled ? (
              <><ToggleRight className="w-5 h-5" /> Enabled</>
            ) : (
              <><ToggleLeft className="w-5 h-5" /> Disabled</>
            )}
          </button>
        </div>
      )}

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
            ) : displayGroups.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">No frames in this session</div>
            ) : (
              <div className="space-y-4">
                {selectedSessionMeta?.mode === 'dual_monitoring' && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                    Dual ELD session — road view (left) and driver view (right) captured together for distraction review.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayGroups.map(({ index, road, cabin }) => (
                    <div key={road.id} className={`rounded-lg overflow-hidden border border-slate-200 ${cabin ? 'sm:col-span-2' : ''}`}>
                      <div className={`grid ${cabin ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 bg-slate-100`}>
                        <div>
                          <img
                            src={uploadUrl(road.image_url)}
                            alt={`Road frame ${index}`}
                            className="w-full h-32 object-cover bg-slate-100"
                          />
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 bg-white">ROAD #{index}</div>
                        </div>
                        {cabin && (
                          <div>
                            <img
                              src={uploadUrl(cabin.image_url)}
                              alt={`Driver frame ${index}`}
                              className="w-full h-32 object-cover bg-slate-100"
                            />
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 bg-white">DRIVER #{index}</div>
                          </div>
                        )}
                      </div>
                      <div className="px-2 py-1.5 text-[10px] text-slate-500 flex justify-between bg-white">
                        <span>{new Date(road.captured_at).toLocaleTimeString()}</span>
                        {road.lat && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> GPS</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
