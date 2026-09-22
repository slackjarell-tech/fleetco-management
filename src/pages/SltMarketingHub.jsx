import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Loader2, Megaphone, Users, RefreshCw, Send, Globe, Bot, Zap, Mail, Copy, Check, X } from 'lucide-react';
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
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [outboxActionId, setOutboxActionId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const runAutopilotNow = async () => {
    setAutopilotRunning(true);
    try {
      await api.sltMarketing.runAutopilot();
      await loadDashboard();
    } finally {
      setAutopilotRunning(false);
    }
  };

  const copyOutbox = async (item, field) => {
    const text = field === 'subject' ? item.subject : (item.body_text || item.body_html || '');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`${item.id}-${field}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const markOutboxSent = async (id) => {
    setOutboxActionId(id);
    try {
      await api.sltMarketing.markOutboxSent(id);
      await loadDashboard();
    } finally {
      setOutboxActionId(null);
    }
  };

  const dismissOutbox = async (id) => {
    setOutboxActionId(id);
    try {
      await api.sltMarketing.dismissOutbox(id);
      await loadDashboard();
    } finally {
      setOutboxActionId(null);
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
  const autopilot = dashboard?.autopilot;
  const aiStatus = dashboard?.ai_status;
  const marketingMode = dashboard?.marketing_mode;
  const localMode = marketingMode?.local_only !== false;
  const outbox = dashboard?.outbox || [];
  const dailyDigest = dashboard?.daily_digest;

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
              <p className="text-slate-500 text-xs mt-0.5">
                {localMode ? 'Local mode — no API keys' : 'Hybrid mode'} · 3 PM CST digest
              </p>
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

          <div className={`mb-4 p-3 rounded-lg border text-xs ${
            localMode
              ? 'border-emerald-900/50 bg-emerald-950/20 text-slate-300'
              : 'border-amber-900/50 bg-amber-950/20 text-slate-300'
          }`}>
            <div className={`flex items-center gap-2 font-semibold mb-1 ${localMode ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Zap className="w-3.5 h-3.5" />
              {localMode ? 'Local marketing — zero API keys' : 'Marketing Autopilot'}
            </div>
            <p className="text-slate-400 leading-relaxed">
              {localMode
                ? 'Leads, nurture, social drafts, and daily digest all run inside FleetCo. Copy emails from the outbox and send from your own inbox. No Groq, Resend, or social tokens required.'
                : 'Hybrid mode — Resend sends nurture emails when configured. Social drafts Monday mornings. Optional Groq/Gemini adds free-form chat.'}
            </p>
            {autopilot && (
              <p className="mt-2 text-slate-500">
                {autopilot.enrolled_count} enrolled · {autopilot.due_now} due now
                {summary?.outbox_pending ? ` · ${summary.outbox_pending} in outbox` : ''}
                {autopilot.enabled ? '' : ' · paused'}
              </p>
            )}
          </div>

          <div className="mb-4 p-3 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
              <Globe className="w-3.5 h-3.5" />
              Public FleetCo Guide
            </div>
            Prospects chat on the website via <strong className="text-slate-300">Ask FleetCo AI</strong>. Leads auto-enroll in Autopilot.
          </div>

          <div className={`mb-4 px-3 py-2 rounded-lg border text-xs ${
            localMode
              ? 'border-cyan-800/60 bg-cyan-950/30 text-cyan-300'
              : aiStatus?.configured && aiStatus?.healthy
                ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-400'
                : 'border-cyan-800/60 bg-cyan-950/30 text-cyan-300'
          }`}>
            {localMode
              ? 'Chat uses built-in commands — show dashboard, list leads, outbox, draft post, run autopilot'
              : aiStatus?.configured && aiStatus?.healthy
                ? `AI (${aiStatus?.provider}): connected — free-form chat enabled`
                : 'Command mode active — add Groq/Gemini for free-form chat'}
          </div>

          {loadingDash && !summary ? (
            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mx-auto my-8" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatCard label="Interested" value={summary?.interested_count ?? '—'} icon={Users} />
                <StatCard label="Autopilot" value={summary?.autopilot_enrolled ?? '—'} icon={Zap} />
                <StatCard label="Website AI" value={aiLeads} icon={Bot} />
                <StatCard label="Outbox" value={summary?.outbox_pending ?? '—'} icon={Mail} />
                <StatCard label="Social drafts" value={summary?.social_draft ?? '—'} icon={Megaphone} />
              </div>

              <div className="text-xs text-slate-500 mb-2">Social accounts (optional env tokens)</div>
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
                className="w-full mb-2 border-amber-800 text-amber-300 hover:bg-amber-950"
                disabled={autopilotRunning}
                onClick={runAutopilotNow}
              >
                {autopilotRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Run autopilot now
              </Button>

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

              {outbox.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email outbox ({outbox.length})
                  </h2>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Copy and send from your email client, then mark sent.
                  </p>
                  <ul className="space-y-2 max-h-56 overflow-y-auto">
                    {outbox.slice(0, 10).map((item) => (
                      <li key={item.id} className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-2">
                        <div className="text-white font-medium truncate">{item.lead_name || item.to_email}</div>
                        <div className="text-slate-500 truncate">{item.subject}</div>
                        {item.nurture_step != null && (
                          <div className="text-amber-500/80 mt-0.5">Nurture step {item.nurture_step}</div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <button
                            type="button"
                            onClick={() => copyOutbox(item, 'subject')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            {copiedId === `${item.id}-subject` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            Subject
                          </button>
                          <button
                            type="button"
                            onClick={() => copyOutbox(item, 'body')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            {copiedId === `${item.id}-body` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            Body
                          </button>
                          <button
                            type="button"
                            disabled={outboxActionId === item.id}
                            onClick={() => markOutboxSent(item.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-800 text-emerald-400 hover:bg-emerald-950 disabled:opacity-50"
                          >
                            {outboxActionId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Sent
                          </button>
                          <button
                            type="button"
                            disabled={outboxActionId === item.id}
                            onClick={() => dismissOutbox(item.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-900 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            Dismiss
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dailyDigest && (
                <div className="mb-4 p-2 rounded-lg border border-slate-800 bg-slate-900/60">
                  <h2 className="text-xs font-bold uppercase text-slate-400 mb-1">Latest daily digest</h2>
                  <p className="text-[11px] text-slate-500 mb-1">{dailyDigest.report_date}</p>
                  <p className="text-[11px] text-slate-400 whitespace-pre-wrap line-clamp-4">
                    {(dailyDigest.body_text || '').slice(0, 400)}
                  </p>
                </div>
              )}

              {dashboard?.interested_leads?.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xs font-bold uppercase text-slate-400 mb-2">Interested pipeline</h2>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {dashboard.interested_leads.slice(0, 8).map((l) => (
                      <li key={l.id} className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-2">
                        <div className="text-white font-medium truncate">{l.name}</div>
                        <div className="text-slate-500 truncate">{l.email}</div>
                        <div className="text-cyan-500/80 mt-0.5 flex flex-wrap gap-2">
                          <span>{l.lead_status}</span>
                          {l.autopilot_enrolled_at && !l.autopilot_paused && <span className="text-amber-500/80">· autopilot</span>}
                          {l.autopilot_paused && <span className="text-red-400/80">· paused</span>}
                          {l.source === 'marketing_ai' && <span className="text-amber-500/80">· website AI</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {autopilot?.recent_activity?.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xs font-bold uppercase text-slate-400 mb-2">Autopilot activity</h2>
                  <ul className="space-y-1 max-h-32 overflow-y-auto text-[11px] text-slate-500">
                    {autopilot.recent_activity.slice(0, 6).map((a) => (
                      <li key={a.id} className="truncate">
                        {a.action} · {(a.created_at || '').slice(0, 16).replace('T', ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dashboard?.daily_report?.report_sent_today && (
                <p className="text-[11px] text-emerald-500/90">
                  Today&apos;s 3 PM CST digest {localMode ? 'posted in-app' : 'was emailed'}.
                </p>
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
            subtitle="Autopilot nurture · leads · social · calls"
            placeholder="Ask about autopilot status, follow up on leads, draft posts, or schedule calls…"
            emptyTitle="Self-contained marketing"
            emptySubtitle="Autopilot emails new leads automatically. Manage pipeline, approve social drafts, and schedule discovery calls — all inside FleetCo, no paid CRM required."
            suggestedQuestions={[
              'Show dashboard',
              'List interested leads',
              'Outbox',
              'Draft a LinkedIn post about our driver app',
              'Run autopilot now',
            ]}
          />
        </div>
      </div>
    </PortalPageShell>
  );
}
