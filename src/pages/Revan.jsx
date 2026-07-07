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

  if (user?.role !== 'executive' && user?.role !== 'owner') return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Crown className="w-12 h-12 mx-auto mb-4 text-slate-700" />
        <p className="text-slate-400 text-lg font-medium">Executive access required</p>
        <p className="text-slate-600 text-sm mt-1">Only the owner or executive role can access Revan.</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <AssistantChat
        agentName="revan"
        variant="revan"
        title="Revan"
        subtitle="Executive Commander · Cursor-style control over site & fleet"
        placeholder="Command Revan — change the website, audit the fleet, manage users..."
        emptyTitle="What should Revan change?"
        emptySubtitle="Full executive authority: update fleetcomanagement.org content, fleet records, users, and run system-wide audits."
        suggestedQuestions={[
          'Change the homepage headline to "FleetCo — Powering Owner Operators"',
          'Run a full system health audit',
          'List all open work orders and overdue maintenance',
          'Show fleet-wide summary — vehicles, drivers, customers',
          'Update the contact phone on the public website',
          'Create a work order for brake inspection on unit 104',
        ]}
      />
    </div>
  );
}
