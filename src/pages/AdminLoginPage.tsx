import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldCheck, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { sanitizeErrorMessage } from '../utils/errorHandler';

function isSafeInternalRedirect(path?: string): boolean {
  if (!path || typeof path !== 'string') return false;
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export const AdminLoginPage: React.FC = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useSEO({
    title: 'Admin Portal Sign In',
    description: 'Restricted administrative portal login for platform moderators.',
    noIndex: true,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nonAdminAttempt, setNonAdminAttempt] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNonAdminAttempt(false);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your administrative email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await login(email.trim(), password);

      // Strict Role Isolation: Only users with role === 'admin' are permitted
      if (profile.role !== 'admin') {
        await logout();
        setNonAdminAttempt(true);
        setErrorMsg('Access denied. This account does not possess platform administrative privileges.');
        return;
      }

      const from = (location.state as any)?.from?.pathname;
      if (from && isSafeInternalRedirect(from)) {
        navigate(from, { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err: unknown) {
      setErrorMsg(sanitizeErrorMessage(err, 'Administrative sign-in failed. Please verify your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 w-full">
      <div className="editorial-card bg-[#120E0C] border border-cream-200/10 p-8 sm:p-10 rounded-sm">
        {/* Header Badge */}
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6 shadow-sm rounded-sm">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
        </div>

        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
          PLATFORM ADMINISTRATION
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-cream-100 tracking-tight mb-2">
          Admin Portal Sign In
        </h1>
        <p className="text-xs text-cream-300/60 mb-6 leading-relaxed">
          Restricted access for platform moderators, verifiers, and staff.
        </p>

        {/* Security Notice */}
        <div className="mb-6 p-4 bg-[#181310] border border-cream-200/10 flex items-start space-x-3 text-xs text-cream-300/70 rounded-xs">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-cream-100 font-medium">Authorized Personnel Only:</strong> Administrative logins and moderation decisions are recorded in platform audit logs.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-4 bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-200 leading-relaxed space-y-2 rounded-xs"
          >
            <div className="flex items-center gap-2 font-medium text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="uppercase tracking-wider text-[10px]">Authentication Notice</span>
            </div>
            <p>{errorMsg}</p>
            {nonAdminAttempt && (
              <div className="pt-2 border-t border-cream-200/10">
                <Link
                  to="/owner/login"
                  className="inline-flex items-center gap-1 font-medium text-amber-400 hover:text-amber-300 underline"
                >
                  <span>Sign in via Shop Owner Portal instead</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Administrator Email <span className="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@manumania.com"
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#181310] border border-cream-200/15 text-cream-100 placeholder-cream-300/30 focus:outline-none focus:border-amber-400/60 disabled:opacity-50 transition-colors rounded-xs"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Master Password <span className="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#181310] border border-cream-200/15 text-cream-100 placeholder-cream-300/30 focus:outline-none focus:border-amber-400/60 disabled:opacity-50 transition-colors rounded-xs"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 text-xs font-mono uppercase tracking-wider font-semibold text-[#0A0807] bg-amber-400 hover:bg-amber-300 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 rounded-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0807]" />
                  <span>Verifying Administrative Credentials...</span>
                </>
              ) : (
                <span>Sign In to Admin Portal</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-5 border-t border-cream-200/10 text-center text-xs text-cream-300/60">
          <p>
            Are you a restaurant or food shop owner?{' '}
            <Link to="/owner/login" className="text-amber-400 hover:text-amber-300 font-mono font-medium underline">
              Shop Owner Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
