import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Store, Info } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { sanitizeErrorMessage } from '../utils/errorHandler';

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
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      setErrorMsg(sanitizeErrorMessage(err, 'Failed to sign in. Please verify your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 w-full">
      <div className="editorial-card bg-[#120E0C] border border-cream-200/10 p-8 sm:p-10 rounded-sm">
        {/* Header Icon & Title */}
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 rounded-sm">
          <Store className="w-6 h-6 stroke-[1.2]" />
        </div>

        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
          RESTAURATEUR PORTAL
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-cream-100 tracking-tight mb-2">
          Shop Owner Sign In
        </h1>
        <p className="text-xs text-cream-300/60 mb-6 leading-relaxed">
          Sign in to manage your food shop, update dish prices, and configure operating schedules.
        </p>

        {/* Public Visitor Notice */}
        <div className="mb-6 p-4 bg-[#181310] border border-cream-200/10 flex items-start space-x-3 text-xs text-cream-300/70 rounded-xs">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-cream-100 font-medium">Browsing for food?</strong> Customers do not need an account. You can freely search, browse menus, and check prices without logging in.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-200 leading-relaxed rounded-xs"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Business Email Address <span className="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourrestaurant.com"
              required
              aria-required="true"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#181310] border border-cream-200/15 text-cream-100 placeholder-cream-300/30 focus:outline-none focus:border-amber-400/60 disabled:opacity-50 transition-colors rounded-xs"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Password <span className="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              aria-required="true"
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
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0807]" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-5 border-t border-cream-200/10 flex flex-col space-y-3 text-center text-xs text-cream-300/60">
          <div>
            Want to list your food shop?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-mono font-medium underline">
              Register Your Shop
            </Link>
          </div>
          <div className="pt-2 border-t border-cream-200/10 text-[11px] font-mono text-cream-300/40">
            Platform administrator?{' '}
            <Link to="/admin/login" className="text-cream-300/60 hover:text-cream-100 underline">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
