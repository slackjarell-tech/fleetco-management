import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import PortalLoginForm from "@/components/auth/PortalLoginForm";
import DriverAppDownload from "@/components/shared/DriverAppDownload";
import DriverAppBranding from "@/components/mobile/DriverAppBranding";

export default function Login() {
  const [searchParams] = useSearchParams();
  const isDriverLogin = searchParams.get("app") === "driver";

  return (
    <AuthLayout
      title={isDriverLogin ? "FleetCo Driver" : "Welcome back"}
      subtitle={
        isDriverLogin
          ? "Sign in to your driver account"
          : "Sign in to access your FleetCo portal"
      }
      footer={
        isDriverLogin ? (
          <>
            Fleet manager or owner?{" "}
            <Link to="/login" className="text-amber-400 font-semibold hover:underline">
              Sign in to the Client Portal
            </Link>
          </>
        ) : (
          <>
            Fleet broker?{' '}
            <Link to="/broker-signup" className="text-amber-400 font-semibold hover:underline">
              Create a free load board account
            </Link>
            {' · '}
            Fleet customer?{' '}
            <Link to="/pricing" className="text-slate-400 hover:text-amber-300">
              See subscription plans
            </Link>
          </>
        )
      }
    >
      {isDriverLogin && (
        <div className="mb-6">
          <DriverAppDownload variant="compact" />
        </div>
      )}

      <PortalLoginForm
        variant="dark"
        submitLabel={isDriverLogin ? "Sign In to Driver App" : "Sign In to Portal"}
      />

      <p className="text-center text-xs text-slate-500 pt-4">
        {isDriverLogin
          ? "Install the app above, then sign in with the credentials from your fleet administrator."
          : "First time signing in? Use the temporary password from your welcome email, then you'll be prompted to choose a new password."}
      </p>
      {isDriverLogin && <DriverAppBranding variant="login" />}
    </AuthLayout>
  );
}
