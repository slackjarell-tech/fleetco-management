import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { isDriverAppContext, isNativeApp } from '@/lib/platform';

export function resolveLoginDestination(result) {
  const isDriver = result?.user?.role === 'driver';
  if (isDriver && (isNativeApp() || isDriverAppContext())) return '/driver';
  if (isDriver && new URLSearchParams(window.location.search).get('app') === 'driver') return '/driver';
  return '/portal';
}

export async function completePortalLogin(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await api.auth.loginViaEmailPassword(normalizedEmail, password);
  if (result.must_change_password) {
    window.location.href = '/set-password';
    return result;
  }
  window.location.href = resolveLoginDestination(result);
  return result;
}

export default function PortalLoginForm({
  variant = 'dark',
  compact = false,
  showForgotLink = true,
  submitLabel = 'Sign In to Portal',
  onSuccess,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = variant === 'dark';
  const isHero = variant === 'hero';
  const inputClass = isHero
    ? 'pl-10 pr-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-amber-400'
    : isDark
      ? 'pl-10 pr-10 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500'
      : 'pl-10 pr-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500';
  const labelClass = isHero || isDark
    ? 'text-slate-200 text-xs font-semibold uppercase tracking-wider'
    : 'text-slate-600 text-xs font-semibold uppercase tracking-wider';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await completePortalLogin(email, password);
      onSuccess?.(result);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      {error && (
        <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-red-900/30 border border-red-800/50 text-red-400' : 'bg-red-500/20 border border-red-400/30 text-red-200'}`}>
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`login-email-${variant}`} className={labelClass}>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            id={`login-email-${variant}`}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`login-password-${variant}`} className={labelClass}>Password</Label>
          {showForgotLink && (
            <Link to="/forgot-password" className="text-xs text-amber-400 font-semibold hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            id={`login-password-${variant}`}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className={`w-full font-bold ${compact ? 'h-10' : 'h-11 mt-2'} bg-amber-500 hover:bg-amber-400 text-slate-900`}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
