import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import AuthLayout from '@/components/AuthLayout';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

export default function SetPassword() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.auth.me().then((u) => {
      if (!u) {
        navigate('/login');
        return;
      }
      if (!u.must_change_password) {
        window.location.href = '/portal';
        return;
      }
      setUser(u);
      setLoading(false);
    }).catch(() => navigate('/login'));
  }, [navigate]);

  const handleSuccess = async () => {
    setDone(true);
    let destination = '/portal';
    try {
      const me = await api.auth.me();
      if (me?.role === 'driver') destination = '/driver';
    } catch (_) {}
    setTimeout(() => { window.location.href = destination; }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-900">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password Set!" subtitle="Redirecting you to the portal...">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-slate-300 text-sm">Your password has been updated. Taking you to your dashboard...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set Your New Password"
      subtitle="Use your temporary password, then choose a permanent one"
    >
      <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-800/30 text-amber-400 text-sm flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
        <span>For security, you must set a new password before accessing the portal. Enter the temporary password from your welcome email as the current password.</span>
      </div>
      <ChangePasswordForm
        userId={user?.id}
        onSuccess={handleSuccess}
        submitLabel="Set New Password & Continue"
        variant="dark"
      />
    </AuthLayout>
  );
}
