import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { Crown, Loader2, RefreshCw, MessageSquare, Zap, Phone, PhoneCall, Maximize2 } from 'lucide-react';
import JarvisSpeakMode from '@/components/assistant/JarvisSpeakMode';
import AssistantChat from '@/components/assistant/AssistantChat';
import PortalPageShell from '@/components/layout/PortalPageShell';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';

export default function Revan() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [jarvisStatus, setJarvisStatus] = useState(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [callBusy, setCallBusy] = useState(false);
  const [callNote, setCallNote] = useState('');
  const [speakOpen, setSpeakOpen] = useState(false);
  const [utterance, setUtterance] = useState(null);
  const [jarvisActivity, setJarvisActivity] = useState({});

  const loadBriefing = useCallback(async () => {
    setLoadingBrief(true);
    try {
      const data = await api.revan.getBriefing('manual');
      setBriefing(data);
    } catch {
      setBriefing(null);
    } finally {
      setLoadingBrief(false);
    }
  }, []);

  useEffect(() => {
    api.auth.me().then((u) => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user && ['owner', 'executive'].includes(user.role)) {
      loadBriefing();
      api.revan.getStatus().then(setJarvisStatus).catch(() => setJarvisStatus(null));
    }
  }, [user, loadBriefing]);

  useEffect(() => {
    if (user?.phone) setPhoneDraft(user.phone);
  }, [user?.phone]);

  const savePhone = async () => {
    const updated = await api.auth.updateMe({ phone: phoneDraft.trim() });
    setUser(updated);
    const st = await api.revan.getStatus();
    setJarvisStatus(st);
    setCallNote('Mobile saved — Jarvis can call this number.');
  };

  const callMe = async () => {
    setCallBusy(true);
    setCallNote('');
    try {
      const r = await api.revan.callMe('manual');
      setCallNote(
        r.success
          ? (r.interactive ? 'Jarvis is calling — answer and talk back-and-forth.' : 'Calling your phone now…')
          : (r.message || r.error || 'Call failed'),
      );
      const st = await api.revan.getStatus();
      setJarvisStatus(st);
    } catch (e) {
      setCallNote(e.message || 'Call failed');
    } finally {
      setCallBusy(false);
    }
  };

  if (loading) {
    return (
      <PortalPageShell variant="fullBleed" className="items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </PortalPageShell>
    );
  }

  if (user?.role !== 'executive' && user?.role !== 'owner') {
    return (
      <PortalPageShell variant="fullBleed" className="items-center justify-center">
        <div className="text-center px-4">
          <Crown className="w-12 h-12 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 text-lg font-medium">Executive access required</p>
          <p className="text-slate-600 text-sm mt-1">Revan reports only to owner and executive.</p>
        </div>
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell variant="fullBleed">
      <div className="flex flex-col lg:flex-row flex-1 h-full min-h-0 w-full overflow-hidden">
        <aside className="shrink-0 w-full lg:w-[min(360px,38%)] max-h-[45vh] lg:max-h-none lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-violet-400" />
                Jarvis briefing
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">7:00 AM & 6:00 PM Central → Messages</p>
            </div>
            <button
              type="button"
              onClick={loadBriefing}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Refresh briefing"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBrief ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <JarvisCore active />

          <div className="mb-3 p-3 rounded-xl border border-violet-800/50 bg-slate-900/80 space-y-2">
            <p className="text-[11px] text-violet-300 font-semibold flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" /> Jarvis phone line
            </p>
            <input
              type="tel"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              placeholder="(360) 555-0100"
              className="w-full text-sm bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-slate-700" onClick={savePhone}>
                Save mobile
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-500"
                disabled={callBusy || !jarvisStatus?.can_call}
                onClick={callMe}
              >
                {callBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4 mr-1" />}
                Call me
              </Button>
            </div>
            {jarvisStatus?.inbound_jarvis?.inbound_instructions && (
              <p className="text-[10px] text-violet-400/80 leading-relaxed">{jarvisStatus.inbound_jarvis.inbound_instructions}</p>
            )}
            {jarvisStatus && !jarvisStatus.can_call && (
              <p className="text-[10px] text-slate-500 leading-relaxed">{jarvisStatus.voice_note}</p>
            )}
            {callNote && <p className="text-[10px] text-violet-300">{callNote}</p>}
          </div>

          <motionNote />

          {loadingBrief && !briefing?.markdown ? (
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin mx-auto my-8" />
          ) : briefing?.markdown ? (
            <div className="text-xs text-slate-300 prose prose-sm prose-invert max-w-none mb-4">
              <ReactMarkdown>{briefing.markdown}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Ask Revan: &quot;Morning briefing&quot;</p>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-violet-800 text-violet-300 hover:bg-violet-950 mb-2"
            onClick={() => api.revan.sendBriefing('morning').then(loadBriefing)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send briefing to Messages now
          </Button>
        </aside>

        <div className="flex-1 min-h-0 flex flex-col relative">
          <Button
            type="button"
            size="sm"
            className="absolute top-3 right-3 z-10 bg-violet-600 hover:bg-violet-500 hidden lg:flex"
            onClick={() => setSpeakOpen(true)}
          >
            <Maximize2 className="w-4 h-4 mr-1" /> Jarvis TV mode
          </Button>
          <JarvisSpeakMode
            open={speakOpen}
            onClose={() => setSpeakOpen(false)}
            onUtterance={(t) => setUtterance(t)}
            statusText={
              jarvisActivity.listening
                ? 'Listening…'
                : jarvisActivity.speaking
                  ? 'Revan speaking…'
                  : 'Full-screen Jarvis — like the Luke Builds AI demo'
            }
            listening={jarvisActivity.listening}
          />
          <AssistantChat
            agentName="revan"
            variant="revan"
            title="Revan"
            subtitle="Executive Commander · runs marketing autopilot, fleet audits, website control"
            placeholder="Jarvis — morning briefing, run the business for me, system health..."
            emptyTitle="Command your executive AI"
            emptySubtitle="Have a real back-and-forth — ask how we're doing, follow up on leads, or run the business. I remember this chat. Optional GROQ_API_KEY for even freer reasoning."
            suggestedQuestions={[
              'Morning briefing — what needs my attention today?',
              'Run business operations (autopilot + advertising AI)',
              'System health and production readiness',
              'List interested leads and marketing outbox status',
              'Change the homepage headline for fleetcomanagement.org',
              'Full fleet audit — customers, open work orders, new inquiries',
            ]}
            showHeader
            jarvisContinuous={speakOpen}
            externalUtterance={utterance}
            onExternalUtteranceHandled={() => setUtterance(null)}
            onJarvisActivity={setJarvisActivity}
          />
        </div>
      </div>
    </PortalPageShell>
  );
}

function JarvisCore({ active }) {
  return (
    <div className="relative flex justify-center mb-4" aria-hidden>
      <div
        className={`w-20 h-20 rounded-full border border-violet-500/40 bg-gradient-to-br from-violet-600/30 to-slate-950 shadow-[0_0_40px_rgba(139,92,246,0.35)] ${active ? 'animate-pulse' : ''}`}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap className="w-8 h-8 text-violet-300" />
      </div>
    </div>
  );
}

function motionNote() {
  return (
    <div className="mb-3 p-2 rounded-lg border border-violet-900/40 bg-violet-950/25 text-[11px] text-slate-400">
      <span className="text-violet-300 font-semibold flex items-center gap-1">
        <Zap className="w-3 h-3" /> Autonomous loop
      </span>
      <p className="mt-1 leading-relaxed">
        Marketing autopilot every 15 minutes. Jarvis loop runs business ops on a schedule, speaks replies in-chat, and can call or text your briefing when Twilio is set.
      </p>
    </div>
  );
}