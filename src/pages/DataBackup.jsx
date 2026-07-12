import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { canManageDatastore } from '@/lib/roles';
import {
  Database, Download, Upload, Shield, KeyRound, AlertTriangle, CheckCircle2, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ROLE_LABELS = {
  owner: 'Owner',
  executive: 'Executive',
  fleet_manager: 'Fleet Manager',
  fleet_coordinator: 'Coordinator',
  user: 'Customer Admin',
  driver: 'Driver',
};

export default function DataBackup() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const u = await api.auth.me();
      setUser(u);
      if (!canManageDatastore(u?.role)) {
        setLoading(false);
        return;
      }
      const [statsRes, credRes] = await Promise.all([
        api.admin.getDatastoreStats(),
        api.admin.getCredentials(),
      ]);
      setStats(statsRes.stats);
      setCredentials(credRes.credentials || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleExport = async () => {
    setBusy('export');
    setMessage(null);
    try {
      const backup = await api.admin.exportFullBackup();
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(backup, `fleetco-full-backup-${date}.json`);
      setMessage({
        type: 'success',
        text: `Downloaded full backup — ${backup.stats?.users ?? 0} users, ${backup.stats?.customers ?? 0} customers, ${backup.stats?.entities ?? 0} entities. Password hashes included so logins work after restore.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setBusy('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setValidation(null);
    setPendingFile(null);
    setConfirmText('');
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      setPendingFile({ name: file.name, backup });
      const result = await api.admin.validateBackup(backup);
      setValidation(result);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not read backup file' });
    }
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!pendingFile?.backup) return;
    if (confirmText.trim().toUpperCase() !== 'RESTORE') {
      setMessage({ type: 'error', text: 'Type RESTORE to confirm' });
      return;
    }
    setBusy('import');
    setMessage(null);
    try {
      const result = await api.admin.importBackup(pendingFile.backup);
      setMessage({
        type: 'success',
        text: result.message || 'Data restored successfully. All logins and passwords preserved.',
      });
      setPendingFile(null);
      setValidation(null);
      setConfirmText('');
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setBusy('');
  };

  const exportCredentialsCsv = () => {
    const rows = [
      ['Email', 'Name', 'Role', 'Company', 'Password', 'Notes'].join(','),
      ...credentials.map((c) =>
        [
          c.email,
          `"${(c.full_name || '').replace(/"/g, '""')}"`,
          c.role,
          `"${(c.company_name || '').replace(/"/g, '""')}"`,
          c.password ? `"${c.password}"` : '(hash preserved in backup)',
          `"${(c.note || c.password_source || '').replace(/"/g, '""')}"`,
        ].join(','),
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetco-logins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canManageDatastore(user?.role)) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Executive or SLT access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Database className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Data Backup & Restore</h1>
          <p className="text-slate-500 text-sm">
            Download everything before redeploying, then bulk upload to restore customers, employees, and logins.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-4 text-sm flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Users', stats.userCount],
            ['Customers', stats.customerCount],
            ['Entities', stats.entityCount],
            ['Storage', stats.postgres ? 'PostgreSQL' : 'File'],
          ].map(([label, value]) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Download className="w-4 h-4 text-amber-500" />
            Bulk Download
          </div>
          <p className="text-sm text-slate-600">
            Exports all users (with password hashes), customers, vehicles, invoices, messages, pending
            accounts, and site settings. Logins work unchanged after restore.
          </p>
          <Button onClick={handleExport} disabled={busy === 'export'} className="w-full">
            {busy === 'export' ? 'Preparing…' : 'Download Full Backup (.json)'}
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Upload className="w-4 h-4 text-amber-500" />
            Bulk Upload / Restore
          </div>
          <p className="text-sm text-slate-600">
            After redeploying, upload your backup file to restore the entire system. Replaces current data.
          </p>
          <label className="block">
            <input
              type="file"
              accept=".json,application/json"
              className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:font-medium"
              onChange={handleFileSelect}
            />
          </label>
          {validation && pendingFile && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-2">
              <p className="font-medium text-slate-800">{pendingFile.name}</p>
              <p className="text-slate-600">
                {validation.users} users · {validation.customers} customers · {validation.entities} entities
              </p>
              {validation.exported_at && (
                <p className="text-xs text-slate-500">Exported {new Date(validation.exported_at).toLocaleString()}</p>
              )}
              <input
                type="text"
                placeholder='Type RESTORE to confirm'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <Button
                variant="destructive"
                onClick={handleImport}
                disabled={busy === 'import' || confirmText.trim().toUpperCase() !== 'RESTORE'}
                className="w-full"
              >
                {busy === 'import' ? 'Restoring…' : 'Restore All Data'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <KeyRound className="w-4 h-4 text-amber-500" />
            Login Credentials
            <span className="text-xs font-normal text-slate-500">(Executive & SLT only)</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPasswords((v) => !v)}>
              {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCredentialsCsv}>
              Export CSV
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Temporary passwords from pending accounts are shown in plain text. Changed passwords are stored as
          secure hashes — those logins are preserved in the backup file and work after restore.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {credentials.map((c) => (
                <tr key={c.email} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 font-mono text-xs">{c.email}</td>
                  <td className="px-3 py-2">{c.full_name}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-xs">
                      {['owner', 'executive'].includes(c.role) && <Crown className="w-3 h-3 text-amber-500" />}
                      {ROLE_LABELS[c.role] || c.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{c.company_name || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {c.password && showPasswords ? (
                      <span className="text-amber-700 font-semibold">{c.password}</span>
                    ) : c.password && !showPasswords ? (
                      '••••••••'
                    ) : (
                      <span className="text-slate-400" title={c.note}>
                        Hash preserved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Before every deploy:</strong> download a full backup here. After redeploy, upload the same file
        to restore all customers, employees, and portal logins. Link PostgreSQL on Render so data also persists
        automatically between deploys.
      </div>
    </div>
  );
}
