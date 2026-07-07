import React from 'react';
import { api } from '@/api/apiClient';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-amber-500/20">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Account Not Found</h1>
          <p className="text-slate-400 mb-6">
            Your account isn't set up yet, or you may be logged in with the wrong email address.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => api.auth.logout('/login')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2.5 rounded-lg transition-colors"
            >
              Sign In with a Different Account
            </button>
            <p className="text-slate-500 text-sm">
              If you received an invitation email, use the link in that email to set your password first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;