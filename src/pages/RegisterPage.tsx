import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Store, Info } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: 'Register Your Food Shop',
    description: 'Create a verified shop owner account to list and manage your food shop on ManuMania.',
    noIndex: true,
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Full owner / representative name must be at least 2 characters.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid business email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (phone.trim() && (phone.trim().length < 7 || phone.trim().length > 25)) {
      setErrorMsg('Phone number must be between 7 and 25 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role: 'owner',
      });

      // Shop owner accounts always land on the owner portal
      navigate('/owner', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
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
          MERCHANT ONBOARDING
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-cream-100 tracking-tight mb-2">
          Register Your Food Shop
        </h1>
        <p className="text-xs text-cream-300/60 mb-6 leading-relaxed">
          Create an owner account to list your business, manage menus, set dish variant prices, and configure operating schedules.
        </p>

        {/* Public Visitor Notice */}
        <div className="mb-6 p-4 bg-[#181310] border border-cream-200/10 flex items-start space-x-3 text-xs text-cream-300/70 rounded-xs">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-cream-100 font-medium">Looking for food?</strong> Customers do not need an account. You can freely search, view menus, and get directions without registering.
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
              htmlFor="reg-name"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Owner / Representative Name <span className="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
              aria-required="true"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#181310] border border-cream-200/15 text-cream-100 placeholder-cream-300/30 focus:outline-none focus:border-amber-400/60 disabled:opacity-50 transition-colors rounded-xs"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Business Email Address <span className="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
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
              htmlFor="reg-password"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Password <span className="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              aria-required="true"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#181310] border border-cream-200/15 text-cream-100 placeholder-cream-300/30 focus:outline-none focus:border-amber-400/60 disabled:opacity-50 transition-colors rounded-xs"
            />
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1"
            >
              Contact Telephone <span className="text-cream-300/40 font-normal">(optional)</span>
            </label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98301 23456"
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
                  <span>Registering shop...</span>
                </>
              ) : (
                <span>Register & Open Dashboard</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-5 border-t border-cream-200/10 text-center text-xs text-cream-300/60">
          Already registered as a shop owner?{' '}
          <Link to="/owner/login" className="text-amber-400 hover:text-amber-300 font-mono font-medium underline">
            Owner Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
