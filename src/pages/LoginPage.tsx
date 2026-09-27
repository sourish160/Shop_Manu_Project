import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Store, Info } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

// Safe internal redirect validator (prevents open redirects)
function isSafeInternalRedirect(path?: string): boolean {
  if (!path || typeof path !== 'string') return false;
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useSEO({
    title: 'Shop Owner Login',
    description: 'Sign in to access your restaurant management dashboard.',
    noIndex: true,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your business email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await login(email, password);
      const from = (location.state as any)?.from?.pathname;

      if (from && isSafeInternalRedirect(from)) {
        navigate(from, { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'owner') {
        navigate('/owner', { replace: true });
      } else {
        // If a legacy account logs in, inform that browsing requires no account
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="forge-card rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header Icon & Title */}
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A064] mb-4 shadow-inner">
          <Store className="w-6 h-6" />
        </div>

        <h1 className="font-editorial text-3xl font-light text-[#F4F2ED] tracking-tight mb-1.5">
          Shop Owner Login
        </h1>
        <p className="text-xs text-zinc-400 font-light mb-6 leading-relaxed">
          Sign in with your registered shop owner credentials to manage your restaurant, menu items, variant pricing, and operating schedule.
        </p>

        {/* Public Visitor Notice */}
        <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl flex items-start space-x-2.5 text-xs text-zinc-400 font-light">
          <Info className="w-4 h-4 text-[#C5A064] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="text-[#F4F2ED] font-medium">Visiting customer?</span> Browsing menus, finding restaurants, and checking prices does not require login or registration.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 leading-relaxed font-mono"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5"
            >
              Business Email Address <span className="text-amber-500" aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@atelier.com"
              required
              aria-required="true"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/15 rounded-xl text-[#F4F2ED] placeholder-zinc-500 focus:outline-none focus:border-[#C5A064] font-mono disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5"
            >
              Password <span className="text-amber-500" aria-hidden="true">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your owner password"
              required
              aria-required="true"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/15 rounded-xl text-[#F4F2ED] placeholder-zinc-500 focus:outline-none focus:border-[#C5A064] font-mono disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="forge-btn w-full py-3 text-xs font-mono uppercase tracking-widest text-[#F4F2ED] rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5A064]" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Shop Owner Sign In</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs font-mono text-zinc-400">
          Want to list your restaurant?{' '}
          <Link to="/register" className="text-[#C5A064] hover:text-white transition-colors underline">
            Register Your Shop
          </Link>
        </div>
      </div>
    </div>
  );
};
