import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Loader2, Megaphone, Mail, Calendar, Users, RefreshCw, Send } from 'lucide-react';
import AssistantChat from '@/components/assistant/AssistantChat';
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!SLT_ROLES.includes(user?.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Megaphone className="w-12 h-12 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-300 text-lg font-medium">SLT access required</p>
          <p className="text-slate-500 text-sm mt-2">
            Marketing Commander is for owner, executive, and fleet manager roles.
          </p>
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary;
  const social = dashboard?.social_config || {};

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-4rem)] -m-4 lg:-m-6">
      <aside className="lg:w-[340px] xl:w-[380px] shrink-0 border-r border-slate-800 bg-slate-950 p-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cyan-400" />
              SLT Marketing
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Daily lead report · 3:00 PM CST</p>
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

        {loadingDash && !summary ? (
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mx-auto my-8" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatCard label="Interested" value={summary?.interested_count ?? '—'} icon={Users} />
              <StatCard label="New leads" value={summary?.new_count ?? '—'} icon={Mail} />
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
                      <div className="text-cyan-500/80 mt-0.5">{l.lead_status}</div>
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

      <div className="flex-1 min-h-[50vh] lg:min-h-0 flex flex-col">
        <AssistantChat
          agentName="slt_marketing"
          variant="slt_marketing"
          title="SLT Marketing Commander"
          subtitle="Leads · email · social queue · scheduled calls"
          placeholder="Ask to follow up on leads, draft posts, or schedule a sales call…"
          emptyTitle="Grow FleetCo"
          emptySubtitle="I queue social content for approval, send lead emails via Resend, schedule calls, and sync with the daily 3 PM CST interested-lead report."
          suggestedQuestions={[
            'Show all interested leads and summarize their messages',
            'Draft a follow-up email for each new lead and send the first one',
            'Queue a Facebook post about our driver app and fleet portal',
            'Schedule a discovery call next Tuesday at 10am for Patricia Nguyen',
            'Approve and publish the latest Facebook draft if connected',
          ]}
        />
      </div>
    </div>
  );
}
