import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { OwnerLayout } from '../components/owner/OwnerLayout';
import { formatDate } from '../utils/formatters';
import { useSEO } from '../hooks/useSEO';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Bell,
  Sliders,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Laptop,
} from 'lucide-react';
import { ConfirmDialog } from '../components/menu/ConfirmDialog';

interface NotificationSettings {
  priceReviewAlerts: boolean;
  dinerReportAlerts: boolean;
  weeklyDigest: boolean;
  marketingUpdates: boolean;
}

interface AccountPreferences {
  timezone: string;
  currency: string;
  staleThresholdDays: number;
}

export const OwnerSettingsPage: React.FC = () => {
  const { user, profile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: 'Account Settings — ManuMania Owner Portal',
    noIndex: true,
  });

  // Section 1: Account Profile Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Section 2: Security & Password Reset
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Section 3: Notification Preferences
  const [notifications, setNotifications] = useState<NotificationSettings>({
    priceReviewAlerts: true,
    dinerReportAlerts: true,
    weeklyDigest: true,
    marketingUpdates: false,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Section 4: Account Preferences
  const [preferences, setPreferences] = useState<AccountPreferences>({
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    staleThresholdDays: 30,
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Feedback Messages
  const [feedback, setFeedback] = useState<{
    section: 'profile' | 'security' | 'notifs' | 'prefs' | null;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sign out confirmation dialog
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Initialize from user profile and local storage
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }

    if (user?.id) {
      const notifsKey = `manumania_notifs_${user.id}`;
      const prefsKey = `manumania_prefs_${user.id}`;

      try {
        const savedNotifs = localStorage.getItem(notifsKey);
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

        const savedPrefs = localStorage.getItem(prefsKey);
        if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
      } catch (err) {
        // ignore storage parse error
      }
    }
  }, [profile, user]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setFeedback({
        section: 'profile',
        type: 'error',
        message: 'Name must be at least 2 characters long.',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      // Update in profiles table
      const { error } = await insforge.database
        .from('profiles')
        .update({
          name: cleanName,
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      await refreshProfile();
      setFeedback({
        section: 'profile',
        type: 'success',
        message: 'Account details updated successfully.',
      });
    } catch (err: any) {
      setFeedback({
        section: 'profile',
        type: 'error',
        message: err.message || 'Failed to update account details.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Send Password Reset Email
  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    setFeedback(null);
    setIsSendingReset(true);

    try {
      const { error } = await insforge.auth.sendResetPasswordEmail({
        email: user.email,
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw new Error(error.message);

      setFeedback({
        section: 'security',
        type: 'success',
        message: `A password reset link has been dispatched to ${user.email}. Check your inbox.`,
      });
    } catch (err: any) {
      setFeedback({
        section: 'security',
        type: 'error',
        message: err.message || 'Failed to dispatch password reset email.',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  // Handle Save Notifications
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingNotifications(true);
    try {
      localStorage.setItem(`manumania_notifs_${user.id}`, JSON.stringify(notifications));
      setFeedback({
        section: 'notifs',
        type: 'success',
        message: 'Notification preferences saved.',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingPreferences(true);
    try {
      localStorage.setItem(`manumania_prefs_${user.id}`, JSON.stringify(preferences));
      setFeedback({
        section: 'prefs',
        type: 'success',
        message: 'Portal preferences saved.',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Execute Sign Out
  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-8 pb-16">
        {/* ============================================================== */}
        {/* HEADER OVERVIEW */}
        {/* ============================================================== */}
        <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#E9A052] bg-[#241A15] px-2.5 py-0.5 rounded-full border border-[#382820]">
                  Credentials &amp; Security
                </span>
                <span className="text-[#382820]">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Partner Account
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl text-[#F5EDE5] font-normal tracking-tight">
                Settings &amp; Account Preferences
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#B6A69A] mt-1 max-w-2xl leading-relaxed">
                Manage your authenticated identity, communication channels, security parameters, and operational preferences.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#241A15] border border-rose-900/50 hover:border-rose-700/80 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-sans">{feedback.message}</div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[#B6A69A] hover:text-[#F5EDE5] text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. OWNER NAME & ACCOUNT DETAILS */}
        {/* ============================================================== */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                  1. Owner Information &amp; Account Details
                </h2>
                <p className="text-xs text-[#B6A69A]">
                  Primary contact identity associated with all registered kitchens.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
            >
              {isSavingProfile ? 'Saving...' : 'Save Account Details'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#241A15] border border-[#382820]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#B6A69A] block mb-1">
                Owner Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Partner Name"
                required
                className="w-full text-sm font-semibold text-[#F5EDE5] bg-transparent border-b border-[#382820] focus:outline-none focus:border-[#E9A052] py-1"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#241A15] border border-[#382820]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#B6A69A] flex items-center gap-1.5 mb-1">
                <Mail className="w-3 h-3 text-[#E9A052]" />
                <span>Email Address</span>
              </span>
              <div className="text-sm font-medium text-[#F5EDE5] truncate py-1">
                {user?.email || 'Not available'}
              </div>
              <span className="text-[10px] text-[#B6A69A]/60 block mt-0.5">
                Managed via InsForge Auth
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#241A15] border border-[#382820]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#B6A69A] flex items-center gap-1.5 mb-1">
                <Phone className="w-3 h-3 text-[#E9A052]" />
                <span>Contact Phone</span>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98300 00000"
                className="w-full text-sm font-semibold text-[#F5EDE5] bg-transparent border-b border-[#382820] focus:outline-none focus:border-[#E9A052] py-1"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#241A15] border border-[#382820]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#B6A69A] flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3 h-3 text-[#E9A052]" />
                <span>Partner Role &amp; Tenure</span>
              </span>
              <div className="flex items-center gap-2 py-1">
                <span className="font-mono text-xs font-bold text-[#E9A052] uppercase">
                  {profile?.role || 'Owner'}
                </span>
                <span className="text-[#382820]">•</span>
                <span className="text-xs text-[#B6A69A] font-sans">
                  Since {profile?.created_at ? formatDate(profile.created_at) : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* ============================================================== */}
        {/* 2. SECURITY PREFERENCES & CHANGE PASSWORD */}
        {/* ============================================================== */}
        <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                  2. Security &amp; Password Management
                </h2>
                <p className="text-xs text-[#B6A69A]">
                  Protect account access, reset credentials, and audit active sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Reset Card */}
            <div className="p-5 rounded-xl bg-[#241A15] border border-[#382820] space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-serif font-medium text-[#F5EDE5]">
                  <KeyRound className="w-4 h-4 text-[#E9A052]" />
                  <span>Update Account Password</span>
                </div>
                <p className="text-xs text-[#B6A69A] leading-relaxed">
                  To protect your kitchen menus against unauthorized alterations, password updates require verification dispatched to your registered email address ({user?.email}).
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSendResetPassword}
                  disabled={isSendingReset}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1512] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl text-xs font-semibold text-[#F5EDE5] hover:text-[#E9A052] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5 text-[#E9A052]" />
                  <span>{isSendingReset ? 'Sending link...' : 'Send Password Reset Link'}</span>
                </button>
              </div>
            </div>

            {/* Active Session Audit */}
            <div className="p-5 rounded-xl bg-[#241A15] border border-[#382820] space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-serif font-medium text-[#F5EDE5]">
                  <Laptop className="w-4 h-4 text-[#E9A052]" />
                  <span>Active Session Security</span>
                </div>
                <p className="text-xs text-[#B6A69A] leading-relaxed">
                  Your authenticated token is encrypted with PostgREST row-level security and automatically expires when signing out.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#1C1512] border border-[#382820] text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-[#F5EDE5]">Current Web Session</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Active &amp; Protected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. NOTIFICATION PREFERENCES */}
        {/* ============================================================== */}
        <form
          onSubmit={handleSaveNotifications}
          className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                  3. Notification Preferences
                </h2>
                <p className="text-xs text-[#B6A69A]">
                  Configure alerts for price adjustments, customer discrepancy reports, and performance digests.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingNotifications}
              className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
            >
              {isSavingNotifications ? 'Saving...' : 'Save Notification Preferences'}
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-start justify-between p-4 rounded-xl bg-[#241A15] border border-[#382820] cursor-pointer hover:border-[#E9A052]/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-semibold text-[#F5EDE5] block">
                  Price Review Reminders
                </span>
                <span className="text-[11px] text-[#B6A69A]">
                  Notify me when menu dishes reach the 30-day freshness review threshold.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.priceReviewAlerts}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, priceReviewAlerts: e.target.checked }))
                }
                className="rounded border-[#382820] bg-[#1C1512] text-[#E9A052] focus:ring-0 w-4 h-4 mt-0.5 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl bg-[#241A15] border border-[#382820] cursor-pointer hover:border-[#E9A052]/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-semibold text-[#F5EDE5] block">
                  Customer Discrepancy Reports
                </span>
                <span className="text-[11px] text-[#B6A69A]">
                  Receive immediate alerts when diners submit feedback regarding changed prices or unavailable items.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.dinerReportAlerts}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, dinerReportAlerts: e.target.checked }))
                }
                className="rounded border-[#382820] bg-[#1C1512] text-[#E9A052] focus:ring-0 w-4 h-4 mt-0.5 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl bg-[#241A15] border border-[#382820] cursor-pointer hover:border-[#E9A052]/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-semibold text-[#F5EDE5] block">
                  Weekly Menu Freshness Summary
                </span>
                <span className="text-[11px] text-[#B6A69A]">
                  Weekly recap detailing item views, freshness score, and top-performing dishes.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, weeklyDigest: e.target.checked }))
                }
                className="rounded border-[#382820] bg-[#1C1512] text-[#E9A052] focus:ring-0 w-4 h-4 mt-0.5 cursor-pointer"
              />
            </label>
          </div>
        </form>

        {/* ============================================================== */}
        {/* 4. ACCOUNT PREFERENCES */}
        {/* ============================================================== */}
        <form
          onSubmit={handleSavePreferences}
          className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                  4. Account &amp; Regional Preferences
                </h2>
                <p className="text-xs text-[#B6A69A]">
                  Currency formatting, time zone localization, and audit schedules.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingPreferences}
              className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
            >
              {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#241A15] border border-[#382820]">
              <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                Portal Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, timezone: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-[#382820] rounded-xl bg-[#1C1512] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, GMT+5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#241A15] border border-[#382820]">
              <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                Currency Standard
              </label>
              <select
                value={preferences.currency}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-[#382820] rounded-xl bg-[#1C1512] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
              >
                <option value="INR (₹)">INR (₹ Indian Rupee)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#241A15] border border-[#382820]">
              <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                Price Stale Threshold
              </label>
              <select
                value={preferences.staleThresholdDays}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    staleThresholdDays: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full px-3 py-2 text-xs border border-[#382820] rounded-xl bg-[#1C1512] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
              >
                <option value={30}>30 Days (Recommended)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          </div>
        </form>

        {/* ============================================================== */}
        {/* 5. SIGN OUT CARD */}
        {/* ============================================================== */}
        <div className="bg-[#1C1512] border border-rose-950/60 rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-serif font-medium text-[#F5EDE5] flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out of Owner Account</span>
              </h2>
              <p className="text-xs text-[#B6A69A] max-w-xl">
                Terminate active session on this device. You will be redirected to the sign-in portal and can log back in at any time.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="px-5 py-2.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 rounded-xl text-xs font-semibold text-rose-200 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Sign Out */}
      <ConfirmDialog
        isOpen={showSignOutConfirm}
        title="Sign Out of ManuMania"
        message="Are you sure you want to sign out of your restaurant partner account? Any unsaved edits will be discarded."
        confirmLabel="Yes, Sign Out"
        variant="warning"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </OwnerLayout>
  );
};
