import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.loginViaEmailPassword(email, password);
      
      // First-time login: upgrade role + mark activated + go to portal
      try {
        const pending = await api.entities.PendingAccount.filter({ email, activated: false });
        if (pending.length > 0) {
          await Promise.allSettled([
            api.functions.invoke('upgradeUserRole', {
              email: pending[0].email,
              role: pending[0].role,
              customer_id: pending[0].customer_id,
              employee_number: pending[0].employee_number
            }),
            api.entities.PendingAccount.update(pending[0].id, { activated: true })
          ]);
        }
      } catch (_) {}

      window.location.href = "/portal";
    } catch (err) {
      // Check if this is a newly created account that needs OTP verification
      try {
        const pending = await api.entities.PendingAccount.filter({ email, activated: false });
        if (pending.length > 0) {
          setShowOtp(true);
          return;
        }
      } catch (_) {}
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await api.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        api.auth.setToken(result.access_token);
      }

      // First-time login: upgrade role + mark activated + go to portal
      try {
        const pending = await api.entities.PendingAccount.filter({ email, activated: false });
        if (pending.length > 0) {
          await Promise.allSettled([
            api.functions.invoke('upgradeUserRole', {
              email: pending[0].email,
              role: pending[0].role,
              customer_id: pending[0].customer_id,
              employee_number: pending[0].employee_number
            }),
            api.entities.PendingAccount.update(pending[0].id, { activated: true })
          ]);
        }
      } catch (_) {}

      window.location.href = "/portal";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await api.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    api.auth.loginWithProvider("google", "/portal");
  };

  if (showOtp) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email}`}
        footer={
          <>
            Don't have an account?{" "}
            <Link to="/register" className="text-amber-400 font-semibold hover:underline">Register</Link>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} className="bg-slate-700 border-slate-600 text-white" />
              <InputOTPSlot index={1} className="bg-slate-700 border-slate-600 text-white" />
              <InputOTPSlot index={2} className="bg-slate-700 border-slate-600 text-white" />
              <InputOTPSlot index={3} className="bg-slate-700 border-slate-600 text-white" />
              <InputOTPSlot index={4} className="bg-slate-700 border-slate-600 text-white" />
              <InputOTPSlot index={5} className="bg-slate-700 border-slate-600 text-white" />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold" onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Access Portal"}
        </Button>
        <p className="text-center text-sm text-slate-500 mt-4">
          Didn't receive it?{" "}
          <button onClick={handleResendOtp} className="text-amber-400 font-semibold hover:underline">Resend code</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your FleetCo portal"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-amber-400 font-semibold hover:underline">Register</Link>
        </>
      }
    >
      <Button variant="outline" className="w-full h-11 text-sm font-medium mb-5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white" onClick={handleGoogle}>
        <GoogleIcon className="w-4 h-4 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-3 text-slate-500">or sign in with email</span></div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
            <Link to="/forgot-password" className="text-xs text-amber-400 font-semibold hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500" required />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold mt-2" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In to Portal"}
        </Button>
        <p className="text-center text-xs text-slate-500 pt-2">
          After login, open <span className="text-amber-400/90">Site Commander AI</span> in the portal to update your website and fleet with natural language.
        </p>
      </form>
    </AuthLayout>
  );
}