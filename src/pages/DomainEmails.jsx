import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Crown } from 'lucide-react';
import FleetCoEmailAccessPanel from '@/components/admin/FleetCoEmailAccessPanel';
import { isSLT } from '@/lib/roles';

export default function DomainEmails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSLT(user?.role)) {
    return (
      <div className="flex items-center justify-center h-64 p-6">
        <div className="text-center text-slate-500">
          <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">SLT access required</p>
          <p className="text-sm mt-1">Owner and Senior Leadership Team can manage company emails.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <FleetCoEmailAccessPanel variant="full" user={user} />
    </div>
  );
}
