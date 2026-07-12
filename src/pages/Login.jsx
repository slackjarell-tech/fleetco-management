import React from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import PortalLoginForm from "@/components/auth/PortalLoginForm";

export default function Login() {
  const handleGoogle = () => {
    api.auth.loginWithProvider("google", "/portal");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your FleetCo portal"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-amber-400 font-semibold hover:underline">Contact your fleet administrator</Link>
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

      <PortalLoginForm variant="dark" />

      <p className="text-center text-xs text-slate-500 pt-4">
        First time signing in? Use the temporary password from your welcome email, then you'll be prompted to choose a new password.
      </p>
    </AuthLayout>
  );
}
