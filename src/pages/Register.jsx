import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan');
  const inviteEmail = params.get('invite_email');

  // Redirect unpaid visitors unless invited
  useEffect(() => {
    if (!plan && !inviteEmail) {
      navigate('/', { replace: true });
    }
  }, [plan, inviteEmail, navigate]);

  // Pre-fill email from invite link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteEmail = params.get('invite_email');
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await api.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        api.auth.setToken(result.access_token);
      }
      window.location.href = "/portal";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await api.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  if (showOtp) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
            {error}
          </div>
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
        <Button
          className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Access Portal"}
        </Button>
        <p className="text-center text-sm text-slate-500 mt-4">
          Didn't receive it?{" "}
          <button onClick={handleResend} className="text-amber-400 font-semibold hover:underline">
            Resend code
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={plan ? `Sign up — ${plan} Plan` : "Create your account"}
      subtitle={plan ? "Complete registration to access your FleetCo portal" : "Get access to the FleetCo management portal"}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-amber-400 font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500"
              readOnly={!!new URLSearchParams(window.location.search).get('invite_email')}
              required
            />
          </div>
          {new URLSearchParams(window.location.search).get('invite_email') && (
            <p className="text-xs text-amber-400 mt-1">✓ Email pre-filled from invitation</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm mt-2"
          disabled={loading}
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
        </Button>
      </form>
    </AuthLayout>
  );
}