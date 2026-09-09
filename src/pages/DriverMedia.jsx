import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/api/apiClient';
import {
  Video, User, Clock, MapPin, Eye, ToggleLeft, ToggleRight, Radio, Brain, AlertTriangle,
  Download, Archive, HardDrive,
} from 'lucide-react';
import { filterByCustomerId, isFleetCoAdmin } from '@/lib/roles';
import { canManageCustomerTeam } from '@/lib/customerRoles';
import { uploadUrl } from '@/lib/nativeBridge';
import { safetyEventLabel, SEVERITY_COLORS } from '@/lib/drivingSafety';
import LiveStreamViewer from '@/components/live/LiveStreamViewer';
import { daysRemainingLabel, downloadLiveRecording } from '@/lib/liveVideo';

const MODE_LABELS = {
  view_ahead: 'View Ahead (Time-Lapse)',
  dual_monitoring: 'Road + Driver (Dual ELD)',
  live_stream: 'Live Stream (Dual Camera)',
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

function LiveFeedCard({ feed }) {
  const { session, latestRoad, latestCabin, recentAlerts, isLive } = feed;
  const roadUrl = latestRoad ? uploadUrl(latestRoad.image_url) : null;
  const cabinUrl = latestCabin ? uploadUrl(latestCabin.image_url) : null;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div>
          <div className="font-bold text-white text-sm flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-red-400 text-xs font-black uppercase">
                <Radio className="w-3 h-3 animate-pulse" /> Live
              </span>
            )}
            {session.driver_name}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{MODE_LABELS[session.mode] || session.mode}</div>
        </div>
        <div className="text-xs text-slate-400">{session.frame_count || 0} frames</div>
      </div>

      <div className={`grid ${cabinUrl || session.mode !== 'view_ahead' ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 bg-black`}>
        <div className="relative">
          {roadUrl ? (
            <img src={roadUrl} alt="Road live" className="w-full h-40 sm:h-48 object-cover" />
          ) : (
            <div className="w-full h-40 sm:h-48 bg-slate-800 flex items-center justify-center text-slate-500 text-xs">Waiting for road feed…</div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] font-bold text-white">ROAD</div>
        </div>
        {(cabinUrl || session.mode === 'live_stream' || session.mode === 'dual_monitoring') && (
          <div className="relative">
            {cabinUrl ? (
              <img src={cabinUrl} alt="Driver live" className="w-full h-40 sm:h-48 object-cover" />
            ) : (
              <div className="w-full h-40 sm:h-48 bg-slate-800 flex items-center justify-center text-slate-500 text-xs">Waiting for driver feed…</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] font-bold text-white">DRIVER</div>
          </div>
        )}
      </div>

      {recentAlerts?.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-700 space-y-1.5 max-h-32 overflow-y-auto">
          <div className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
            <Brain className="w-3 h-3" /> Safety AI Alerts
          </div>
          {recentAlerts.map((alert) => (
            <div key={alert.id} className={`text-xs px-2 py-1 rounded border ${SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.low}`}>
              <span className="font-bold">{safetyEventLabel(alert.event_type)}</span>
              {alert.description && <span className="opacity-90"> — {alert.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DriverMedia() {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [frames, setFrames] = useState([]);
  const [safetyEvents, setSafetyEvents] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDual, setSavingDual] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [liveFeeds, setLiveFeeds] = useState([]);
  const [liveVideoSessions, setLiveVideoSessions] = useState([]);
  const [livekitConfigured, setLivekitConfigured] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [retentionDays, setRetentionDays] = useState(15);
  const [canDownloadRecordings, setCanDownloadRecordings] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(false);

  const load = async () => {
    const [u, allSessions, allFrames, allEvents] = await Promise.all([
      api.auth.me(),
      api.entities.DashcamSession.list('-started_at', 100),
      api.entities.DashcamFrame.list('-captured_at', 500),
      api.entities.DrivingSafetyEvent.list('-captured_at', 200),
    ]);
    setUser(u);
    const internal = isFleetCoAdmin(u?.role) || ['fleet_manager', 'fleet_coordinator'].includes(u?.role);
    const sess = internal ? allSessions : filterByCustomerId(allSessions, u);
    const sessionIds = new Set(sess.map((s) => s.id));
    const fr = internal ? allFrames : allFrames.filter((f) => sessionIds.has(f.session_id));
    const ev = internal ? allEvents : allEvents.filter((e) => sessionIds.has(e.session_id) || e.customer_id === u?.customer_id);
    setSessions(sess);
    setFrames(fr);
    setSafetyEvents(ev);

    if (u?.customer_id && canManageCustomerTeam(u.role)) {
      const rows = await api.entities.Customer.filter({ id: u.customer_id });
      setCustomer(rows[0] || null);
    }
    setLoading(false);
  };

  const refreshLive = useCallback(async () => {
    try {
      const [dashcam, liveVideo] = await Promise.all([
        api.functions.invoke('getLiveDashcamFeeds'),
        api.functions.invoke('listActiveLiveVideoSessions').catch(() => ({ sessions: [], livekitConfigured: false })),
      ]);
      setLiveFeeds(dashcam.feeds || []);
      setAiConfigured(!!dashcam.aiConfigured);
      setLiveVideoSessions(liveVideo.sessions || []);
      setLivekitConfigured(!!liveVideo.livekitConfigured);
    } catch { /* ignore */ }
  }, []);

  const refreshRecordings = useCallback(async () => {
    setRecordingsLoading(true);
    try {
      const result = await api.functions.invoke('listLiveVideoRecordings');
      setRecordings(result.recordings || []);
      setRetentionDays(result.retentionDays || 15);
      setCanDownloadRecordings(!!result.canDownload);
    } catch { /* ignore */ }
    finally { setRecordingsLoading(false); }
  }, []);

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  useEffect(() => {
    if (activeTab !== 'live') return undefined;
    refreshLive();
    const t = setInterval(refreshLive, 2000);
    return () => clearInterval(t);
  }, [activeTab, refreshLive]);

  useEffect(() => {
    if (activeTab === 'recordings') refreshRecordings();
  }, [activeTab, refreshRecordings]);

  const handleDownloadRecording = async (rec, track = 'road') => {
    setDownloadingId(`${rec.id}-${track}`);
    try {
      const label = track === 'cabin' ? 'driver' : 'road';
      const name = `FleetCo-${rec.driver_name || 'driver'}-${rec.started_at?.slice(0, 10) || 'recording'}-${label}.webm`;
      await downloadLiveRecording(rec.id, track, name.replace(/[^\w.-]+/g, '_'));
    } catch (err) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleArchiveRecording = async (rec) => {
    setArchivingId(rec.id);
    try {
      await api.functions.invoke('archiveLiveVideoRecording', { recordingId: rec.id });
      await refreshRecordings();
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Could not save recording');
    } finally {
      setArchivingId(null);
    }
  };

  const sessionFrames = selectedSession ? frames.filter((f) => f.session_id === selectedSession) : [];
  const sessionAlerts = selectedSession ? safetyEvents.filter((e) => e.session_id === selectedSession) : [];
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

  const toggleSafetyAi = async () => {
    if (!customer) return;
    setSavingAi(true);
    try {
      const next = customer.driver_safety_ai_enabled === false;
      await api.entities.Customer.update(customer.id, { driver_safety_ai_enabled: next });
      setCustomer({ ...customer, driver_safety_ai_enabled: next });
    } finally {
      setSavingAi(false);
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
          Live WebRTC video, 15-day auto-saved recordings, Safety AI alerts, and dashcam session review.
        </p>
      </div>

      {canManageDual && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" /> Dual camera monitoring
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enables live stream and dual ELD modes — road + driver cameras at the same time.
              </p>
            </div>
            <button
              type="button"
              disabled={savingDual}
              onClick={toggleDualCamera}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shrink-0 ${
                customer.driver_dual_camera_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {customer.driver_dual_camera_enabled ? <><ToggleRight className="w-5 h-5" /> Enabled</> : <><ToggleLeft className="w-5 h-5" /> Disabled</>}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" /> FleetCo Safety AI
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                AI analyzes frames for lane departure, distraction, drowsiness, phone use, and impairment signs.
                {!aiConfigured && ' Requires GEMINI_API_KEY on server.'}
              </p>
            </div>
            <button
              type="button"
              disabled={savingAi || !aiConfigured}
              onClick={toggleSafetyAi}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shrink-0 ${
                customer.driver_safety_ai_enabled !== false ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {customer.driver_safety_ai_enabled !== false ? <><ToggleRight className="w-5 h-5" /> Enabled</> : <><ToggleLeft className="w-5 h-5" /> Disabled</>}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          <Radio className="w-4 h-4" /> Live Feeds
          {(liveVideoSessions.length + liveFeeds.length) > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {liveVideoSessions.length + liveFeeds.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recordings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'recordings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          <HardDrive className="w-4 h-4" /> Video Library
          {recordings.length > 0 && activeTab !== 'recordings' && (
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{recordings.length}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'sessions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          <Clock className="w-4 h-4" /> Session Review
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'alerts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          <AlertTriangle className="w-4 h-4" /> Safety AI
          {safetyEvents.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{safetyEvents.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'live' && (
        liveVideoSessions.length === 0 && liveFeeds.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No active live streams</p>
            <p className="text-sm mt-1">Drivers start live stream from Dashcam & Media in the driver app.</p>
            {!livekitConfigured && (
              <p className="text-xs mt-3 text-amber-600 max-w-md mx-auto">
                Live WebRTC requires LiveKit on the server (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET).
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {liveVideoSessions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liveVideoSessions.map((session) => (
                  <LiveStreamViewer key={session.id} session={session} />
                ))}
              </div>
            )}
            {liveFeeds.length > 0 && (
              <>
                {liveVideoSessions.length > 0 && (
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Photo-based dashcam feeds</p>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {liveFeeds.map((feed) => (
                    <LiveFeedCard key={feed.session.id} feed={feed} />
                  ))}
                </div>
              </>
            )}
          </div>
        )
      )}

      {activeTab === 'recordings' && (
        recordingsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <HardDrive className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No saved live video yet</p>
            <p className="text-sm mt-1">Recordings appear here after drivers stop a live stream — kept {retentionDays} days unless you save permanently.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Live stream recordings auto-delete after <strong>{retentionDays} days</strong>.
              {canDownloadRecordings ? ' Download or tap Keep to save permanently.' : ' Contact your fleet manager to download or keep recordings.'}
            </p>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {recordings.map((rec) => (
                <div key={rec.id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" /> {rec.driver_name}
                      {rec.archived && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">KEPT</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(rec.started_at).toLocaleString()}</span>
                      {rec.duration_sec != null && <span>{Math.round(rec.duration_sec / 60)} min</span>}
                      <span className={rec.archived ? 'text-emerald-600' : rec.days_remaining <= 3 ? 'text-amber-600' : 'text-slate-400'}>
                        {daysRemainingLabel(rec)}
                      </span>
                    </div>
                  </div>
                  {canDownloadRecordings && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={!!downloadingId}
                        onClick={() => handleDownloadRecording(rec, 'road')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === `${rec.id}-road` ? '…' : 'Road'}
                      </button>
                      {rec.cabin_video_url && (
                        <button
                          type="button"
                          disabled={!!downloadingId}
                          onClick={() => handleDownloadRecording(rec, 'cabin')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingId === `${rec.id}-cabin` ? '…' : 'Driver'}
                        </button>
                      )}
                      {!rec.archived && (
                        <button
                          type="button"
                          disabled={archivingId === rec.id}
                          onClick={() => handleArchiveRecording(rec)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 disabled:opacity-50"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          {archivingId === rec.id ? 'Saving…' : 'Keep'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === 'alerts' && (
        safetyEvents.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No Safety AI alerts yet</p>
            <p className="text-sm mt-1">Alerts appear when AI detects lane issues, distraction, or impairment during recording.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {safetyEvents.map((alert) => (
              <div key={alert.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded border shrink-0 w-fit ${SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.low}`}>
                  {alert.severity?.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900">{safetyEventLabel(alert.event_type)}</div>
                  {alert.description && <div className="text-xs text-slate-500 truncate">{alert.description}</div>}
                </div>
                <div className="text-xs text-slate-400 shrink-0">
                  {new Date(alert.captured_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'sessions' && (
        sessions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No driver media sessions yet.</p>
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
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {s.status === 'recording' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    {MODE_LABELS[s.mode] || s.mode}
                  </div>
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
                  {sessionAlerts.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-1">
                      <div className="text-xs font-bold text-indigo-800 flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> Safety AI — this session</div>
                      {sessionAlerts.slice(0, 5).map((a) => (
                        <div key={a.id} className="text-xs text-indigo-900">{safetyEventLabel(a.event_type)} — {a.description}</div>
                      ))}
                    </div>
                  )}
                  {(selectedSessionMeta?.mode === 'dual_monitoring' || selectedSessionMeta?.mode === 'live_stream') && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      Dual camera session — road view (left) and driver view (right).
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayGroups.map(({ index, road, cabin }) => (
                      <div key={road.id} className={`rounded-lg overflow-hidden border border-slate-200 ${cabin ? 'sm:col-span-2' : ''}`}>
                        <div className={`grid ${cabin ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 bg-slate-100`}>
                          <div>
                            <img src={uploadUrl(road.image_url)} alt={`Road frame ${index}`} className="w-full h-32 object-cover bg-slate-100" />
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 bg-white">ROAD #{index}</div>
                          </div>
                          {cabin && (
                            <div>
                              <img src={uploadUrl(cabin.image_url)} alt={`Driver frame ${index}`} className="w-full h-32 object-cover bg-slate-100" />
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
        )
      )}
    </div>
  );
}
