import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordForm({
  userId,
  onSuccess,
  submitLabel = 'Change Password',
  variant = 'light',
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDark = variant === 'dark';
  const labelClass = isDark
    ? 'text-slate-300 text-xs font-semibold uppercase tracking-wider'
    : 'text-xs font-semibold uppercase tracking-wider';
  const inputClass = isDark
    ? 'pl-10 pr-10 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
    : 'pl-10 pr-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400';
  const errorClass = isDark
    ? 'p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm'
    : 'p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword({
        userId,
        currentPassword,
        newPassword,
      });
      onSuccess?.();
    } catch (err) {
      const msg = err?.data?.error || err?.message || '';
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('invalid')) {
        setError('Current password is incorrect. Please try again.');
      } else {
        setError(msg || 'Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleBtn = (
    <button
      type="button"
      onClick={() => setShowPasswords(!showPasswords)}
      className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-400 hover:text-slate-600'}`}
      aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
    >
      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className={errorClass}>{error}</div>}

      <div className="space-y-1.5">
        <Label htmlFor="current" className={labelClass}>Current Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="current"
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            placeholder="Temporary password from welcome email"
            required
          />
          {toggleBtn}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new" className={labelClass}>New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="new"
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm" className={labelClass}>Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="confirm"
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Changing...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
