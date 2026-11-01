import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Search,
  Bell,
  ExternalLink,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
  Store,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Restaurant } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';

interface OwnerTopHeaderProps {
  currentRestaurant: Restaurant | null;
  onToggleMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  staleCount?: number;
  reviewCount?: number;
}

export const OwnerTopHeader: React.FC<OwnerTopHeaderProps> = ({
  currentRestaurant,
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
  staleCount = 0,
  reviewCount = 0,
}) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalAlerts = (staleCount > 0 ? 1 : 0) + (reviewCount > 0 ? 1 : 0) + (currentRestaurant?.status === 'pending' ? 1 : 0);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EBE6DF] px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left Side: Mobile Toggle & Global Search */}
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-lg">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            aria-label="Toggle navigation"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search your menu items, categories, prices..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E0DACF] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Right Side: Public Link, Notifications, Profile Dropdown */}
        <div className="flex items-center space-x-2.5 sm:space-x-4 shrink-0">
          {/* View Public Menu Link */}
          {currentRestaurant?.slug && currentRestaurant.status === 'approved' && (
            <Link
              to={`/restaurant/${currentRestaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-900 border border-amber-400/30 text-xs font-sans font-semibold transition-all shadow-sm"
              title="Open public menu in a new tab"
            >
              <span>Live Menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            </Link>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E0DACF] rounded-2xl shadow-xl p-3 z-50 text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                  <span className="font-serif font-bold text-xs text-slate-900">Notifications &amp; Alerts</span>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{totalAlerts} Active</span>
                </div>

                <div className="space-y-2 text-xs">
                  {currentRestaurant?.status === 'pending' && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-900 block">Restaurant Profile Under Review</span>
                        <span className="text-[11px] text-amber-700/90 leading-tight block mt-0.5">
                          Admin team is currently reviewing your registration. Your dishes are ready to go live!
                        </span>
                      </div>
                    </div>
                  )}

                  {staleCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/70 flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-rose-900 block">{staleCount} Dishes Need Price Review</span>
                        <span className="text-[11px] text-rose-700/90 leading-tight block mt-0.5">
                          Prices have not been updated in over 60 days. Reconfirm prices to maintain verified digital badge.
                        </span>
                      </div>
                    </div>
                  )}

                  {reviewCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-900 block">{reviewCount} Dishes Review Recommended</span>
                        <span className="text-[11px] text-amber-700/90 leading-tight block mt-0.5">
                          Menu items updated 30-60 days ago. Quick review keeps your kitchen fresh.
                        </span>
                      </div>
                    </div>
                  )}

                  {totalAlerts === 0 && (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                      <span>All menu items and kitchen statuses are up to date!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0A0807] font-bold text-xs shadow-sm">
                {(profile?.name || user?.email || 'O').charAt(0).toUpperCase()}
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="font-sans text-xs font-bold text-slate-800 leading-tight">
                  {profile?.name || user?.email?.split('@')[0] || 'Restaurant Owner'}
                </span>
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                  Kitchen Partner
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
                  showUserDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Account Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E0DACF] rounded-2xl shadow-xl p-2 z-50 text-left">
                <div className="p-2 border-b border-slate-100">
                  <span className="font-sans font-bold text-xs text-slate-900 block truncate">
                    {profile?.name || user?.email}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 truncate block mt-0.5">
                    {user?.email}
                  </span>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    to="/owner/restaurant"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <Store className="w-4 h-4 text-slate-400" />
                    <span>Restaurant Profile</span>
                  </Link>
                  <Link
                    to="/owner/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                  <a
                    href="mailto:support@shopmanu.com?subject=Owner%20Support"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Help Center</span>
                  </a>
                </div>

                <div className="pt-1 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

