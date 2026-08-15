import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import PortalLoginForm from "@/components/auth/PortalLoginForm";

/** Client portal login — drivers use /driver/login */
export default function Login() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("app") === "driver") {
    return <Navigate to="/driver/login" replace />;
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your FleetCo portal"
      footer={
        <>
          Fleet broker?{" "}
          <Link to="/broker-signup" className="text-amber-400 font-semibold hover:underline">
            Create a free load board account
          </Link>
          {" · "}
          Fleet customer?{" "}
          <Link to="/pricing" className="text-slate-400 hover:text-amber-300">
            See subscription plans
          </Link>
          {" · "}
          Driver?{" "}
          <Link to="/driver/login" className="text-amber-400 font-semibold hover:underline">
            Sign in to Driver App
          </Link>
        </>
      }
    >
      <PortalLoginForm variant="dark" submitLabel="Sign In to Portal" />

      <p className="text-center text-xs text-slate-500 pt-4">
        First time signing in? Use the temporary password from your welcome email, then you&apos;ll be prompted to choose a new password.
      </p>
    </AuthLayout>
  );
}
