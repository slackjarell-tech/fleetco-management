import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import {
  Lightbulb, TrendingUp, Users, MessageSquare, AlertCircle,
  Search, ChevronDown, ChevronUp, BarChart2, Star, Zap, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { isPlatformAdmin } from '@/lib/roles';

const CATEGORY_COLORS = {
  'Troubleshooting': '#ef4444',
  'How-To Guidance': '#3b82f6',
  'Compliance / HOS': '#f59e0b',
  'Fleet Maintenance': '#f97316',
  'Financial Analysis': '#22c55e',
  'Fuel & IFTA': '#a855f7',
  'Load & Dispatch': '#06b6d4',
  'Driver Management': '#64748b',
  'Invoicing': '#84cc16',
  'Parts & Inventory': '#ec4899',
  'Vendor Management': '#8b5cf6',
  'Payroll': '#14b8a6',
  'Reporting': '#0ea5e9',
  'Feature Request': '#f43f5e',
  'General Question': '#94a3b8',
  'Other': '#475569',
};

const SENTIMENT_CONFIG = {
  positive: { color: 'text-green-600', bg: 'bg-green-50', label: 'Positive' },
  neutral: { color: 'text-slate-600', bg: 'bg-slate-50', label: 'Neutral' },
  frustrated: { color: 'text-red-600', bg: 'bg-red-50', label: 'Frustrated' },
  confused: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Confused' },
};

const PRIORITY_CONFIG = {
  high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  low: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
};

export default function DevFeedbackDashboard() {
  const [user, setUser] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const data = await api.entities.UsageFeedback.list('-created_date', 500);
      setFeedback(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Analytics ─────────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const categoryCount = {};
    const sentimentCount = { positive: 0, neutral: 0, frustrated: 0, confused: 0 };
    const featureGaps = {};
    const painPoints = [];

    feedback.forEach(f => {
      categoryCount[f.topic_category] = (categoryCount[f.topic_category] || 0) + 1;
      if (f.sentiment) sentimentCount[f.sentiment] = (sentimentCount[f.sentiment] || 0) + 1;
      if (f.feature_gap) featureGaps[f.feature_gap] = (featureGaps[f.feature_gap] || 0) + 1;
      if (f.pain_point) painPoints.push(f);
    });

    const categoryChart = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.length > 14 ? name.slice(0, 13) + '…' : name, fullName: name, value }));

    const topFeatureRequests = Object.entries(featureGaps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([gap, count]) => ({ gap, count }));

    const highPriority = feedback.filter(f => f.priority === 'high').length;
    const withFeatureGap = feedback.filter(f => f.feature_gap).length;
    const frustrated = sentimentCount.frustrated + sentimentCount.confused;

    return {
      categoryChart, topFeatureRequests, sentimentCount,
      highPriority, withFeatureGap, frustrated,
      totalSessions: feedback.length,
    };
  }, [feedback]);

  const filtered = useMemo(() => feedback.filter(f => {
    const matchSearch = !search ||
      f.user_message_summary?.toLowerCase().includes(search.toLowerCase()) ||
      f.feature_gap?.toLowerCase().includes(search.toLowerCase()) ||
      f.dev_recommendation?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || f.topic_category === filterCategory;
    const matchPri = filterPriority === 'all' || f.priority === filterPriority;
    return matchSearch && matchCat && matchPri;
  }), [feedback, search, filterCategory, filterPriority]);

  const sentimentDonut = Object.entries(analytics.sentimentCount)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: name === 'positive' ? '#22c55e' : name === 'neutral' ? '#64748b' : name === 'frustrated' ? '#ef4444' : '#f59e0b'
    }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isPlatformAdmin(user?.role)) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Admin access required.</div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-black flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" /> AI Usage & Dev Feedback Dashboard
        </h1>
        <p className="text-slate-300 text-xs mt-1">
          Tracks what users are asking the AI, identifies pain points, feature gaps, and generates development recommendations
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total AI Sessions', value: analytics.totalSessions, icon: MessageSquare, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'High Priority Issues', value: analytics.highPriority, icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Feature Gap Signals', value: analytics.withFeatureGap, icon: Zap, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Frustrated / Confused', value: analytics.frustrated, icon: TrendingUp, color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl border border-slate-100 p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[['overview', 'Overview'], ['recommendations', 'Dev Recommendations'], ['sessions', 'All Sessions']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === id ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>{label}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-slate-700 text-sm mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" /> Most Requested Topics
              </h3>
              {analytics.categoryChart.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.categoryChart} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v, n, p) => [v, p.payload.fullName]} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {analytics.categoryChart.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.fullName] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Sentiment Donut + Feature Gaps */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-700 text-sm mb-3">User Sentiment</h3>
                {sentimentDonut.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-4">No data yet</div>
                ) : (
                  <div className="flex items-center gap-4">
                    <PieChart width={100} height={100}>
                      <Pie data={sentimentDonut} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={2}>
                        {sentimentDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="space-y-1.5 flex-1">
                      {sentimentDonut.map(s => (
                        <div key={s.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                            <span className={`capitalize font-semibold ${SENTIMENT_CONFIG[s.name]?.color}`}>{s.name}</span>
                          </span>
                          <span className="font-black text-slate-700">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Feature Gaps */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Top Feature Gap Signals
                </h3>
                {analytics.topFeatureRequests.length === 0 ? (
                  <div className="text-slate-400 text-sm text-center py-2">No feature gaps captured yet</div>
                ) : (
                  <div className="space-y-2">
                    {analytics.topFeatureRequests.map(({ gap, count }) => (
                      <div key={gap} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-700 truncate">{gap}</div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (count / (analytics.topFeatureRequests[0]?.count || 1)) * 100)}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-black text-amber-600 flex-shrink-0">{count}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS TAB */}
      {activeTab === 'recommendations' && (
        <div className="space-y-3">
          {feedback.filter(f => f.dev_recommendation && f.priority === 'high').length === 0 &&
           feedback.filter(f => f.dev_recommendation).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No dev recommendations yet</p>
              <p className="text-xs mt-1">Recommendations are generated as users interact with the AI assistant</p>
            </div>
          ) : (
            ['high', 'medium', 'low'].map(priority => {
              const items = feedback.filter(f => f.dev_recommendation && f.priority === priority);
              if (items.length === 0) return null;
              const cfg = PRIORITY_CONFIG[priority];
              return (
                <div key={priority}>
                  <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${cfg.color}`}>
                    {priority.toUpperCase()} PRIORITY ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map(f => (
                      <div key={f.id} className={`bg-white rounded-xl border ${cfg.border} p-4`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Lightbulb className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>{f.topic_category}</span>
                              <span className="text-xs text-slate-400">{f.session_date}</span>
                              {f.sentiment && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SENTIMENT_CONFIG[f.sentiment]?.bg} ${SENTIMENT_CONFIG[f.sentiment]?.color}`}>
                                  {SENTIMENT_CONFIG[f.sentiment]?.label}
                                </span>
                              )}
                            </div>
                            {f.user_message_summary && (
                              <p className="text-xs text-slate-500 mb-1.5">
                                <span className="font-bold text-slate-600">User need:</span> {f.user_message_summary}
                              </p>
                            )}
                            <p className="text-sm text-slate-800 font-semibold">{f.dev_recommendation}</p>
                            {f.feature_gap && (
                              <p className="text-xs text-amber-600 mt-1 font-semibold">
                                💡 Feature Gap: {f.feature_gap}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ALL SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions..."
                className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-56" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
              <option value="all">All Categories</option>
              {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span className="text-xs text-slate-400">{filtered.length} sessions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No sessions match this filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(f => {
                const priCfg = PRIORITY_CONFIG[f.priority] || PRIORITY_CONFIG.medium;
                const sentCfg = SENTIMENT_CONFIG[f.sentiment] || SENTIMENT_CONFIG.neutral;
                return (
                  <div key={f.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpanded(p => ({ ...p, [f.id]: !p[f.id] }))}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-700">{f.topic_category}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${priCfg.bg} ${priCfg.color}`}>{f.priority}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sentCfg.bg} ${sentCfg.color}`}>{sentCfg.label}</span>
                          <span className="text-xs text-slate-400">{f.session_date}</span>
                          {f.user_role && <span className="text-xs text-slate-400 capitalize">• {f.user_role}</span>}
                        </div>
                        {f.user_message_summary && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{f.user_message_summary}</p>
                        )}
                      </div>
                      {expanded[f.id] ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </div>
                    {expanded[f.id] && (
                      <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2 text-sm">
                        {f.pain_point && <p><span className="font-bold text-slate-600">Pain Point:</span> {f.pain_point}</p>}
                        {f.feature_gap && <p><span className="font-bold text-amber-600">Feature Gap:</span> {f.feature_gap}</p>}
                        {f.dev_recommendation && <p><span className="font-bold text-blue-600">Dev Recommendation:</span> {f.dev_recommendation}</p>}
                        {f.page_context && <p className="text-xs text-slate-400">Page: {f.page_context}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}