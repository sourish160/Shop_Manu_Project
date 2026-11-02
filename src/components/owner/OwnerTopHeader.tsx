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

  const totalAlerts =
    (staleCount > 0 ? 1 : 0) +
    (reviewCount > 0 ? 1 : 0) +
    (currentRestaurant?.status === 'pending' ? 1 : 0);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#130F0D]/95 backdrop-blur-md border-b border-[#382820] px-4 sm:px-6 lg:px-8 py-3.5 transition-all text-[#F5EDE5]">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left Side: Mobile Toggle & Global Search */}
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-lg">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#1C1512] transition-colors"
            aria-label="Toggle navigation"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#B6A69A]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dishes, categories, prices..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#1C1512] border border-[#382820] rounded-xl text-[#F5EDE5] placeholder-[#B6A69A]/50 focus:outline-none focus:border-[#E9A052] focus:ring-1 focus:ring-[#E9A052] transition-all"
            />
          </div>
        </div>

        {/* Right Side: Public Link, Notifications, Profile Dropdown */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0">
          {/* View Public Menu Link */}
          {currentRestaurant?.slug && currentRestaurant.status === 'approved' && (
            <Link
              to={`/restaurant/${currentRestaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#241A15] hover:bg-[#2C201A] text-[#E9A052] border border-[#382820] hover:border-[#E9A052]/50 text-xs font-sans font-medium transition-all"
              title="Open public menu in a new tab"
            >
              <span>Live Menu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#1C1512] border border-transparent hover:border-[#382820] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E9A052] ring-2 ring-[#130F0D]" />
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1C1512] border border-[#382820] rounded-2xl shadow-2xl p-3 z-50 text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#382820] px-1">
                  <span className="font-serif font-medium text-xs text-[#F5EDE5]">Notifications &amp; Alerts</span>
                  <span className="font-mono text-[10px] text-[#E9A052] uppercase tracking-wider">{totalAlerts} Active</span>
                </div>

                <div className="space-y-2 text-xs">
                  {currentRestaurant?.status === 'pending' && (
                    <div className="p-2.5 rounded-xl bg-[#241A15] border border-[#382820] flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-[#E9A052] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#F5EDE5] block">Profile Under Review</span>
                        <span className="text-[11px] text-[#B6A69A] leading-tight block mt-0.5">
                          Admin team is reviewing your restaurant. Your menu dishes are indexed and ready to go live!
                        </span>
                      </div>
                    </div>
                  )}

                  {staleCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-rose-200 block">{staleCount} Dishes Need Price Review</span>
                        <span className="text-[11px] text-rose-300/80 leading-tight block mt-0.5">
                          Prices have not been updated in over 60 days. Reconfirm prices to maintain verified digital badge.
                        </span>
                      </div>
                    </div>
                  )}

                  {reviewCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#241A15] border border-[#382820] flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#E9A052] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#F5EDE5] block">{reviewCount} Dishes Review Recommended</span>
                        <span className="text-[11px] text-[#B6A69A] leading-tight block mt-0.5">
                          Menu items updated 30-60 days ago. Quick price confirmation keeps your kitchen freshness high.
                        </span>
                      </div>
                    </div>
                  )}

                  {totalAlerts === 0 && (
                    <div className="py-4 text-center text-[#B6A69A] text-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
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
              className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-[#1C1512] border border-transparent hover:border-[#382820] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E9A052] to-amber-700 flex items-center justify-center text-[#100D0B] font-bold text-xs shadow-sm">
                {(profile?.name || user?.email || 'O').charAt(0).toUpperCase()}
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="font-sans text-xs font-semibold text-[#F5EDE5] leading-tight">
                  {profile?.name || user?.email?.split('@')[0] || 'Owner'}
                </span>
                <span className="font-mono text-[9px] text-[#E9A052] uppercase tracking-wider">
                  Partner
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-[#B6A69A] transition-transform duration-200 hidden sm:block ${
                  showUserDropdown ? 'rotate-180 text-[#E9A052]' : ''
                }`}
              />
            </button>

            {/* Account Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1C1512] border border-[#382820] rounded-2xl shadow-2xl p-2 z-50 text-left">
                <div className="p-2.5 border-b border-[#382820]">
                  <span className="font-sans font-semibold text-xs text-[#F5EDE5] block truncate">
                    {profile?.name || user?.email}
                  </span>
                  <span className="font-mono text-[10px] text-[#B6A69A] truncate block mt-0.5">
                    {user?.email}
                  </span>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    to="/owner/restaurant"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs text-[#F5EDE5] hover:bg-[#241A15] hover:text-[#E9A052] transition-colors"
                  >
                    <Store className="w-4 h-4 text-[#B6A69A]" />
                    <span>Restaurant Profile</span>
                  </Link>
                  <Link
                    to="/owner/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs text-[#F5EDE5] hover:bg-[#241A15] hover:text-[#E9A052] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#B6A69A]" />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to="/owner/help"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs text-[#F5EDE5] hover:bg-[#241A15] hover:text-[#E9A052] transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-[#B6A69A]" />
                    <span>Help &amp; Support</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-[#382820] mt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
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
