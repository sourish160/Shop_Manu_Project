import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user, profile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="border border-slate-200 bg-white rounded p-8 shadow-sm">
        <div className="border-b border-slate-200 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Food Discovery Platform
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            Phase 1: Backend Foundation, Authentication, Ownership & Row-Level Security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-slate-200 rounded p-5 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Backend Infrastructure</h2>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>• Provider: <span className="font-mono text-slate-800">InsForge PostgreSQL</span></li>
              <li>• Auth Model: <span className="font-mono text-slate-800">InsForge Auth SDK + Deno Edge Functions</span></li>
              <li>• Security: <span className="font-mono text-slate-800">PostgreSQL Row-Level Security (RLS)</span></li>
              <li>• Role Enforcement: <span className="font-mono text-slate-800">Database triggers + server validation</span></li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded p-5 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Current Session</h2>
            {user && profile ? (
              <div className="text-xs text-slate-700 space-y-1">
                <div><span className="text-slate-500">Name:</span> {profile.name}</div>
                <div><span className="text-slate-500">Email:</span> {profile.email}</div>
                <div>
                  <span className="text-slate-500">Role:</span>{' '}
                  <span className="font-semibold text-slate-900 uppercase">{profile.role}</span>
                </div>
                <div><span className="text-slate-500">User ID:</span> <span className="font-mono">{user.id}</span></div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Not signed in. Register as a Customer or Restaurant Owner to test role boundaries.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {profile?.role === 'owner' ? (
            <Link
              to="/owner"
              className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Go to Owner Dashboard
            </Link>
          ) : user ? (
            <div className="text-sm text-slate-600 py-1.5">
              Signed in as <span className="font-medium text-slate-900">{profile?.role}</span>. Customer role does not have owner access.
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Register New Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
