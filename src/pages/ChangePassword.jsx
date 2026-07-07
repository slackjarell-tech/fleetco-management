import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.auth.me().then(u => {
      if (u) setUser(u);
      else navigate('/login');
    }).catch(() => navigate('/login')).finally(() => setLoading(false));
  }, [navigate]);

  const handleSuccess = () => {
    setDone(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <p className="text-sm font-bold">Password changed successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">Your new password is now active.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Enter your current password and choose a new one — no email required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm
            userId={user?.id}
            onSuccess={handleSuccess}
            submitLabel="Change Password"
          />
        </CardContent>
      </Card>
    </div>
  );
}