import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Loader2, Megaphone, Calendar, Users, RefreshCw, Send, Globe, Bot } from 'lucide-react';
import AssistantChat from '@/components/assistant/AssistantChat';
import PortalPageShell from '@/components/layout/PortalPageShell';
import { Button } from '@/components/ui/button';

const SLT_ROLES = ['owner', 'executive', 'fleet_manager'];

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wide mb-1">
        {label}
        <Icon className="w-4 h-4 text-cyan-500" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export default function SltMarketingHub() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [reportSending, setReportSending] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    try {
      const data = await api.sltMarketing.getDashboard();
      setDashboard(data);
    } catch {
      setDashboard(null);
    } finally {
      setLoadingDash(false);
    }
  }, []);

  useEffect(() => {
    api.auth.me().then((u) => { setUser(u); setLoadingUser(false); }).catch(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (user && SLT_ROLES.includes(user.role)) loadDashboard();
  }, [user, loadDashboard]);

  const sendReportNow = async () => {
    setReportSending(true);
    try {
      await api.sltMarketing.sendDailyReport(true);
      await loadDashboard();
    } finally {
      setReportSending(false);
    }
  };

  if (loadingUser) {
    return (
      <PortalPageShell variant="fullBleed" className="items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </PortalPageShell>
    );
  }

  if (!SLT_ROLES.includes(user?.role)) {
    return (
      <PortalPageShell variant="fullBleed" className="items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Megaphone className="w-12 h-12 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-300 text-lg font-medium">SLT access required</p>
          <p className="text-slate-500 text-sm mt-2">
            FleetCo Marketing AI is for owner, executive, and fleet manager roles.
          </p>
        </div>
      </PortalPageShell>
    );
  }

  const summary = dashboard?.summary;
  const social = dashboard?.social_config || {};
  const aiLeads = summary?.marketing_ai_leads ?? '—';

  return (
    <PortalPageShell variant="fullBleed">
      <div className="flex flex-col lg:flex-row flex-1 h-full min-h-0 w-full overflow-hidden">
        <aside className="shrink-0 w-full lg:w-[min(340px,38%)] max-h-[42vh] lg:max-h-none lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 p-4 overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-bold text-lg flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cyan-400" />
                FleetCo Marketing AI
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">SLT command · website AI · 3:00 PM CST report</p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDash ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mb-4 p-3 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
              <Globe className="w-3.5 h-3.5" />
              Public FleetCo Guide
            </div>
            Prospects chat on the website via <strong className="text-slate-300">Ask FleetCo AI</strong>. Leads save to your pipeline automatically.
          </div>

          {loadingDash && !summary ? (
            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mx-auto my-8" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatCard label="Interested" value={summary?.interested_count ?? '—'} icon={Users} />
                <StatCard label="Website AI" value={aiLeads} icon={Bot} />
                <StatCard label="Social drafts" value={summary?.social_draft ?? '—'} icon={Megaphone} />
                <StatCard label="Calls booked" value={summary?.upcoming_calls ?? '—'} icon={Calendar} />
              </div>

              <div className="text-xs text-slate-500 mb-2">Social accounts (server env)</div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['facebook', 'linkedin', 'instagram', 'x'].map((p) => (
                  <span
                    key={p}
                    className={`text-[10px] uppercase px-2 py-1 rounded border ${
                      social[p]
                        ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                        : 'border-slate-700 text-slate-500'
                    }`}
                  >
                    {p} {social[p] ? 'on' : 'manual'}
                  </span>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mb-4 border-cyan-800 text-cyan-300 hover:bg-cyan-950"
                disabled={reportSending}
                onClick={sendReportNow}
              >
                {reportSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send lead report now
              </Button>

              {dashboard?.interested_leads?.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xs font-bold uppercase text-slate-400 mb-2">Interested pipeline</h2>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {dashboard.interested_leads.slice(0, 8).map((l) => (
                      <li key={l.id} className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-2">
                        <div className="text-white font-medium truncate">{l.name}</div>
                        <div className="text-slate-500 truncate">{l.email}</div>
                        <div className="text-cyan-500/80 mt-0.5 flex gap-2">
                          <span>{l.lead_status}</span>
                          {l.source === 'marketing_ai' && <span className="text-amber-500/80">· website AI</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dashboard?.daily_report?.report_sent_today && (
                <p className="text-[11px] text-emerald-500/90">Today&apos;s 3 PM CST report was sent.</p>
              )}
            </>
          )}
        </aside>

        <div className="flex-1 min-h-0 min-w-0 h-full flex flex-col overflow-hidden">
          <AssistantChat
            agentName="slt_marketing"
            variant="slt_marketing"
            channel="portal"
            title="SLT Command Center"
            subtitle="Leads · email · social · calls · website AI pipeline"
            placeholder="Ask to follow up on website leads, draft posts, or schedule sales calls…"
            emptyTitle="Grow FleetCo"
            emptySubtitle="Manage leads from FleetCo Guide on the website, queue social content, send emails via Resend, and schedule discovery calls."
            suggestedQuestions={[
              'Show leads captured by the website marketing AI',
              'Draft a follow-up email for each interested lead',
              'Queue a Facebook post about our driver app and fleet portal',
              'Schedule a discovery call next Tuesday at 10am for Patricia Nguyen',
            ]}
          />
        </div>
      </div>
    </PortalPageShell>
  );
}
