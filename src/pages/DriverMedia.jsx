import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/api/apiClient';
import {
  Video, User, Clock, Eye, ToggleLeft, ToggleRight, Radio,
  Download, Archive, HardDrive, Play, X,
} from 'lucide-react';
import { canManageCustomerTeam } from '@/lib/customerRoles';
import LiveStreamViewer from '@/components/live/LiveStreamViewer';
import RecordingSessionCard from '@/components/live/RecordingSessionCard';
import { daysRemainingLabel, downloadLiveRecording } from '@/lib/liveVideo';

export default function DriverMedia() {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDual, setSavingDual] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [liveVideoSessions, setLiveVideoSessions] = useState([]);
  const [requestedVideoSessions, setRequestedVideoSessions] = useState([]);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [canStartLiveVideo, setCanStartLiveVideo] = useState(false);
  const [livekitConfigured, setLivekitConfigured] = useState(false);
  const [startingDriverId, setStartingDriverId] = useState(null);
  const [cancellingSessionId, setCancellingSessionId] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [retentionDays, setRetentionDays] = useState(15);
  const [canDownloadRecordings, setCanDownloadRecordings] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    const u = await api.auth.me();
    setUser(u);
    if (u?.customer_id && canManageCustomerTeam(u.role)) {
      const rows = await api.entities.Customer.filter({ id: u.customer_id });
      setCustomer(rows[0] || null);
    }
    setLoading(false);
  };

  const refreshLive = useCallback(async () => {
    try {
      const [liveVideo, driverList] = await Promise.all([
        api.functions.invoke('listActiveLiveVideoSessions').catch(() => ({ sessions: [], requestedSessions: [], livekitConfigured: false })),
        api.functions.invoke('listDriversForLiveVideo').catch(() => ({ drivers: [], canStart: false })),
      ]);
      setLiveVideoSessions(liveVideo.sessions || []);
      setRequestedVideoSessions(liveVideo.requestedSessions || []);
      setLivekitConfigured(!!liveVideo.livekitConfigured);
      setCanStartLiveVideo(!!liveVideo.canStart);
      setLiveDrivers(driverList.drivers || []);
      if (driverList.canStart != null) setCanStartLiveVideo(!!driverList.canStart);
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

  const handleRequestLiveVideo = async (driverId) => {
    setStartingDriverId(driverId);
    try {
      await api.functions.invoke('requestLiveVideoForDriver', { driverId });
      await refreshLive();
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Could not request live dashcam');
    } finally {
      setStartingDriverId(null);
    }
  };

  const handleCancelLiveRequest = async (sessionId) => {
    setCancellingSessionId(sessionId);
    try {
      await api.functions.invoke('cancelLiveVideoRequest', { sessionId });
      await refreshLive();
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Could not cancel request');
    } finally {
      setCancellingSessionId(null);
    }
  };

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

  const toggleDualCamera = async () => {
    if (!customer) return;
    setSavingDual(true);
    try {
      const enabled = customer.driver_dual_camera_enabled !== false;
      await api.entities.Customer.update(customer.id, { driver_dual_camera_enabled: !enabled });
      setCustomer({ ...customer, driver_dual_camera_enabled: !enabled });
    } finally {
      setSavingDual(false);
    }
  };

  const canManageDual = customer && canManageCustomerTeam(user?.role);

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
          Dashcam recording — drivers save video from the app; review in the library (15-day retention). Live office viewing when LiveKit is configured.
        </p>
      </div>

      {canManageDual && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" /> Live dashcam
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Included for all fleets — drivers stream road + driver cameras live. Turn off only if your fleet opts out.
            </p>
          </div>
          <button
            type="button"
            disabled={savingDual}
            onClick={toggleDualCamera}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shrink-0 ${
              customer.driver_dual_camera_enabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {customer.driver_dual_camera_enabled !== false ? <><ToggleRight className="w-5 h-5" /> Enabled</> : <><ToggleLeft className="w-5 h-5" /> Disabled</>}
          </button>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          <Radio className="w-4 h-4" /> Live Feeds
          {(liveVideoSessions.length + requestedVideoSessions.length) > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {liveVideoSessions.length + requestedVideoSessions.length}
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
      </div>

      {activeTab === 'live' && (
        <div className="space-y-4">
          {canStartLiveVideo && liveDrivers.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-600" /> Request driver recording
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Drivers can tap <strong>Start Recording</strong> anytime — or you can request them to start from here.
                  {!livekitConfigured && ' Live office viewing requires LiveKit; saved video always works.'}
                </p>
              </div>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {liveDrivers.map((d) => (
                  <div key={d.id} className="px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900">{d.name}</div>
                      <div className="text-xs text-slate-500 truncate">{d.email}</div>
                    </div>
                    {d.liveSession ? (
                      <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                        <Radio className="w-3 h-3 animate-pulse" /> Live now
                      </span>
                    ) : d.pendingSession ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600">Waiting for driver…</span>
                        <button
                          type="button"
                          disabled={cancellingSessionId === d.pendingSession.id}
                          onClick={() => handleCancelLiveRequest(d.pendingSession.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!!startingDriverId}
                        onClick={() => handleRequestLiveVideo(d.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-60"
                      >
                        <Video className="w-3.5 h-3.5" />
                        {startingDriverId === d.id ? 'Requesting…' : 'Request Recording'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {requestedVideoSessions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {requestedVideoSessions.map((session) => (
                <div key={session.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse" /> Waiting for {session.driver_name}
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Request sent — driver will see a prompt in the FleetCo Driver app.
                  </p>
                  {canStartLiveVideo && (
                    <button
                      type="button"
                      disabled={cancellingSessionId === session.id}
                      onClick={() => handleCancelLiveRequest(session.id)}
                      className="mt-3 text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      {cancellingSessionId === session.id ? 'Cancelling…' : 'Cancel request'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {liveVideoSessions.length === 0 && requestedVideoSessions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No active dashcam recordings</p>
              <p className="text-sm mt-1">Request a driver above, or they can tap Start Recording on their home screen or Recording tab.</p>
            </div>
          ) : (
            liveVideoSessions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liveVideoSessions.map((session) => (
                  session.stream_mode === 'livekit' && livekitConfigured ? (
                    <LiveStreamViewer key={session.id} session={session} />
                  ) : (
                    <RecordingSessionCard key={session.id} session={session} />
                  )
                ))}
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'recordings' && (
        recordingsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <HardDrive className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No saved dashcam video yet</p>
            <p className="text-sm mt-1">Recordings appear after drivers stop a live stream — kept {retentionDays} days unless saved permanently.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Recordings auto-delete after <strong>{retentionDays} days</strong>.
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
    </div>
  );
}
