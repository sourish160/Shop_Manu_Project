import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Store, Info } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: 'Register Your Shop',
    description: 'Create a verified shop owner account to list and manage your restaurant on Shop Manu.',
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
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="forge-card rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header Icon & Title */}
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A064] mb-4 shadow-inner">
          <Store className="w-6 h-6" />
        </div>

        <h1 className="font-editorial text-3xl font-light text-[#F4F2ED] tracking-tight mb-1.5">
          Register Your Shop
        </h1>
        <p className="text-xs text-zinc-400 font-light mb-6 leading-relaxed">
          Create an authenticated shop owner account to list and manage your restaurant, menu items, live portion pricing, and weekly schedules.
        </p>

        {/* Public Visitor Notice */}
        <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl flex items-start space-x-2.5 text-xs text-zinc-400 font-light">
          <Info className="w-4 h-4 text-[#C5A064] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="text-[#F4F2ED] font-medium">Looking for food?</span> Customers do not require an account. You can freely search, view menus, and get directions without registering.
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
              htmlFor="reg-name"
              className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5"
            >
              Owner / Representative Name <span className="text-amber-500" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marco Rossi"
              required
              aria-required="true"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/15 rounded-xl text-[#F4F2ED] placeholder-zinc-500 focus:outline-none focus:border-[#C5A064] font-mono disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5"
            >
              Business Email Address <span className="text-amber-500" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
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
              htmlFor="reg-password"
              className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5"
            >
              Password <span className="text-amber-500" aria-hidden="true">*</span>
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
              className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/15 rounded-xl text-[#F4F2ED] placeholder-zinc-500 focus:outline-none focus:border-[#C5A064] font-mono disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5"
            >
              Contact Telephone <span className="text-zinc-500 font-normal lowercase">(optional)</span>
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
                  <span>Registering shop...</span>
                </>
              ) : (
                <span>Register Your Shop</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs font-mono text-zinc-400">
          Already registered as a shop owner?{' '}
          <Link to="/login" className="text-[#C5A064] hover:text-white transition-colors underline">
            Shop Owner Login
          </Link>
        </div>
      </div>
    </div>
  );
};
