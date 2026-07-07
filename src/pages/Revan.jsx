import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Crown, Loader2 } from 'lucide-react';
import AssistantChat from '@/components/assistant/AssistantChat';

export default function Revan() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  );

  if (user?.role !== 'executive') return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Crown className="w-12 h-12 mx-auto mb-4 text-slate-700" />
        <p className="text-slate-400 text-lg font-medium">Executive access required</p>
        <p className="text-slate-600 text-sm mt-1">Only the executive role can access Revan.</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <AssistantChat
        agentName="revan"
        title="Revan"
        subtitle="Executive Commander · Full system authority"
        placeholder="Command your fleet — audits, analysis, record management..."
        suggestedQuestions={[
          "Run a full system health audit",
          "Show me fleet-wide P&L summary",
          "List all customers with their fleet size",
          "Find vehicles with overdue maintenance",
          "Analyze fuel spend trends last 6 months",
          "Show all drivers with expired documents",
        ]}
      />
    </div>
  );
}