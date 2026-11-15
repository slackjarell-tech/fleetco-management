import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { Crown, Loader2, RefreshCw, MessageSquare, Zap } from 'lucide-react';
import AssistantChat from '@/components/assistant/AssistantChat';
import PortalPageShell from '@/components/layout/PortalPageShell';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';

export default function Revan() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

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
    if (user && ['owner', 'executive'].includes(user.role)) loadBriefing();
  }, [user, loadBriefing]);

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

        <div className="flex-1 min-h-0 flex flex-col">
          <AssistantChat
            agentName="revan"
            variant="revan"
            title="Revan"
            subtitle="Executive Commander · runs marketing autopilot, fleet audits, website control"
            placeholder="Jarvis — morning briefing, run the business for me, system health..."
            emptyTitle="Command your executive AI"
            emptySubtitle="Revan operates FleetCo: briefings, autopilot, leads, site content, and fleet records. Works without Groq; smarter with GROQ_API_KEY."
            suggestedQuestions={[
              'Morning briefing — what needs my attention today?',
              'Run business operations (autopilot + advertising AI)',
              'System health and production readiness',
              'List interested leads and marketing outbox status',
              'Change the homepage headline for fleetcomanagement.org',
              'Full fleet audit — customers, open work orders, new inquiries',
            ]}
            showHeader
          />
        </div>
      </div>
    </PortalPageShell>
  );
}

function motionNote() {
  return (
    <div className="mb-3 p-2 rounded-lg border border-violet-900/40 bg-violet-950/25 text-[11px] text-slate-400">
      <span className="text-violet-300 font-semibold flex items-center gap-1">
        <Zap className="w-3 h-3" /> Autonomous loop
      </span>
      <p className="mt-1 leading-relaxed">
        Marketing autopilot runs every 15 minutes. Revan can trigger the same tick on demand and summarizes results for you.
      </p>
    </div>
  );
}