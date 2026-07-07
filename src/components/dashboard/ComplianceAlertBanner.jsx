import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { AlertTriangle, X, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TRACKED_TYPES = ['Insurance', 'Registration', 'DOT Inspection Sticker', 'Annual Inspection Report', 'IFTA Permit', 'IRP Registration'];

export default function ComplianceAlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.entities.VehicleDocument.list().then(docs => {
      const urgent = docs.filter(d => {
        if (!TRACKED_TYPES.includes(d.doc_type) || !d.expiration_date) return false;
        const days = Math.ceil((new Date(d.expiration_date) - new Date()) / 86400000);
        return days <= 30;
      });
      setAlerts(urgent);
    }).catch(() => {});
  }, []);

  if (dismissed || alerts.length === 0) return null;

  const expired = alerts.filter(a => Math.ceil((new Date(a.expiration_date) - new Date()) / 86400000) < 0);
  const critical = alerts.filter(a => {
    const d = Math.ceil((new Date(a.expiration_date) - new Date()) / 86400000);
    return d >= 0 && d <= 14;
  });

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 mb-4 ${
      expired.length > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${expired.length > 0 ? 'text-red-500' : 'text-amber-500'}`} />
      <div className="flex-1 min-w-0">
        <span className={`font-black text-sm ${expired.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>
          {expired.length > 0 ? `${expired.length} document(s) EXPIRED` : `${critical.length} document(s) expiring within 14 days`}
        </span>
        <span className="text-xs text-slate-500 ml-2">({alerts.length} total compliance items need attention)</span>
      </div>
      <Link to="/portal/compliance"
        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
          expired.length > 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        }`}>
        View All <ChevronRight className="w-3 h-3" />
      </Link>
      <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}