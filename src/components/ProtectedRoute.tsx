import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/insforge';
import { ShieldAlert, Loader2 } from 'lucide-react';

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
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <div className="text-slate-500 text-xs font-medium">Verifying access...</div>
      </div>
    );
  }

  const loginRoute = requiredRole === 'admin' ? '/admin/login' : '/owner/login';

  if (!user) {
    return <Navigate to={loginRoute} state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 editorial-card bg-[#120E0C] border border-cream-200/12 rounded-2xl text-center shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-2xl font-normal text-cream-100 mb-2 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-cream-200/70 mb-6 leading-relaxed font-sans">
          This portal requires a {requiredRole === 'admin' ? 'platform administrator' : requiredRole === 'owner' ? 'shop owner' : requiredRole} account. Your current session has the <strong className="font-semibold text-amber-300 font-mono">{profile?.role || 'guest'}</strong> role.
        </p>
        <div className="flex justify-center space-x-3 text-xs font-semibold">
          <Link
            to="/"
            className="px-4 py-2 border border-cream-200/15 bg-cream-100/[0.06] hover:bg-cream-100/[0.12] text-cream-100 rounded-lg transition-colors font-sans uppercase tracking-wider text-[11px]"
          >
            Go to Home
          </Link>
          <Link
            to={loginRoute}
            className={`px-4 py-2 text-[#0A0807] rounded-lg transition-colors shadow-sm font-sans uppercase tracking-wider text-[11px] font-semibold ${
              requiredRole === 'admin'
                ? 'bg-red-400 hover:bg-red-300'
                : 'bg-amber-400 hover:bg-amber-300'
            }`}
          >
            Sign In to {requiredRole === 'admin' ? 'Admin Portal' : 'Owner Portal'}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
