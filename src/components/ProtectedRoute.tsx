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
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-[#C5A064] border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Authenticating Session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 forge-card rounded-2xl border border-white/10 text-center shadow-2xl">
        <h2 className="font-editorial text-3xl font-light text-[#F4F2ED] mb-2 tracking-tight">Access Restricted</h2>
        <p className="text-xs font-mono text-zinc-400 mb-6 leading-relaxed">
          This portal is restricted to {requiredRole === 'owner' ? 'shop owner' : requiredRole} accounts. Your session possesses the {profile?.role || 'unassigned'} role.
        </p>
        <div className="flex justify-center space-x-3 font-mono text-xs uppercase tracking-wider">
          <Link
            to="/"
            className="px-4 py-2 border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors"
          >
            Index
          </Link>
          <Link
            to="/login"
            className="forge-btn px-4 py-2 text-[#F4F2ED] rounded-lg transition-all"
          >
            Owner Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
