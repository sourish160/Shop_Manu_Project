import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/insforge';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded shadow-sm text-center">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-4">
          This area is restricted to {requiredRole} accounts. Your account has the {profile?.role || 'unassigned'} role.
        </p>
        <div className="flex justify-center space-x-3">
          <Link
            to="/"
            className="text-xs px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
