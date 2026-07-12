import React from "react";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import PortalLoginForm from "@/components/auth/PortalLoginForm";

export default function Login() {
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
      <PortalLoginForm variant="dark" />

      <p className="text-center text-xs text-slate-500 pt-4">
        First time signing in? Use the temporary password from your welcome email, then you'll be prompted to choose a new password.
      </p>
    </AuthLayout>
  );
}
