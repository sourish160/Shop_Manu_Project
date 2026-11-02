import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  Store,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { Restaurant } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';

interface OwnerSidebarProps {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenInquiriesModal?: () => void;
  inquiryCount?: number;
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({
  restaurants,
  currentRestaurant,
  onSelectRestaurant,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Helper to determine active state
  const isDashboardActive = location.pathname === '/owner';
  const isMenuActive = location.pathname.startsWith('/owner/menu');
  const isProfileActive = location.pathname.startsWith('/owner/restaurant');
  const isSettingsActive = location.pathname.startsWith('/owner/settings');
  const isHelpActive = location.pathname.startsWith('/owner/help');

  // Primary navigation options (1 - 4)
  const primaryNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      subtitle: '',
      path: '/owner',
      icon: LayoutDashboard,
      isActive: isDashboardActive,
    },
    {
      id: 'menu',
      label: 'Menu Management',
      subtitle: 'Dishes, prices & categories',
      path: currentRestaurant ? `/owner/menu?restaurantId=${currentRestaurant.id}` : '/owner/menu',
      icon: Utensils,
      isActive: isMenuActive,
    },
    {
      id: 'profile',
      label: 'Restaurant Profile',
      subtitle: 'Shop details, photos & location',
      path: currentRestaurant ? `/owner/restaurant?id=${currentRestaurant.id}` : '/owner/restaurant',
      icon: Store,
      isActive: isProfileActive,
    },
    {
      id: 'settings',
      label: 'Settings',
      subtitle: 'Account & preferences',
      path: '/owner/settings',
      icon: Settings,
      isActive: isSettingsActive,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 bg-[#130F0D] border-r border-[#382820] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Restaurant Switcher */}
        <div className="p-4 sm:p-5 pb-2 flex flex-col space-y-4">
          {/* Brand Logo & Mobile Close */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <img
                src="/images/logo.png"
                alt="ManuMania"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/images/ManuMania%20Chef%20Sticker%20Logo.png';
                }}
              />
            </Link>

            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-cream-200/60 hover:text-cream-100 hover:bg-cream-200/10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Restaurant Mini-Card with Switcher */}
          {currentRestaurant ? (
            <div className="relative">
              <div
                onClick={() => restaurants.length > 1 && setShowShopDropdown(!showShopDropdown)}
                className={`p-2.5 sm:p-3 rounded-2xl bg-[#1C1512] border border-[#382820] flex items-center justify-between gap-2.5 ${
                  restaurants.length > 1 ? 'cursor-pointer hover:border-[#E9A052]/40 transition-all' : ''
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-[#241A15] shrink-0 border border-[#382820]">
                    <img
                      src={currentRestaurant.cover_url || currentRestaurant.logo_url || '/images/shops/storefront-1.jpg'}
                      alt={currentRestaurant.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/shops/storefront-1.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-xs sm:text-sm font-medium text-[#F5EDE5] truncate">
                      {currentRestaurant.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          currentRestaurant.status === 'approved'
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-[#E9A052]'
                        }`}
                      />
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#B6A69A] truncate">
                        {currentRestaurant.status === 'approved' ? 'Live on ManuMania' : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {restaurants.length > 1 && (
                  <ChevronDown
                    className={`w-4 h-4 text-[#B6A69A] shrink-0 transition-transform duration-200 ${
                      showShopDropdown ? 'rotate-180 text-[#E9A052]' : ''
                    }`}
                  />
                )}
              </div>

              {/* Multi-Restaurant Dropdown */}
              {showShopDropdown && restaurants.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1C1512] border border-[#382820] rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#B6A69A]/60">
                    Your Registered Kitchens ({restaurants.length})
                  </div>
                  {restaurants.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        onSelectRestaurant(res);
                        setShowShopDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs font-sans flex items-center justify-between transition-colors ${
                        res.id === currentRestaurant.id
                          ? 'bg-[#241A15] text-[#E9A052] font-semibold border border-[#382820]'
                          : 'text-[#B6A69A] hover:bg-[#241A15] hover:text-[#F5EDE5]'
                      }`}
                    >
                      <span className="truncate">{res.name}</span>
                      <span className="font-mono text-[9px] text-[#B6A69A]/50 uppercase">
                        {res.area || res.city}
                      </span>
                    </button>
                  ))}
                  <div className="pt-1.5 mt-1 border-t border-[#382820]">
                    <Link
                      to="/owner/restaurant/new"
                      onClick={() => setShowShopDropdown(false)}
                      className="w-full text-left p-2 rounded-xl text-xs text-[#E9A052] hover:bg-[#241A15] flex items-center gap-1.5 font-medium"
                    >
                      <span>+ Register Another Kitchen</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/owner/restaurant/new"
              className="p-3 rounded-2xl bg-[#241A15] border border-dashed border-[#E9A052]/40 text-[#E9A052] hover:bg-[#2C201A] text-xs font-sans font-medium text-center transition-all block"
            >
              + Register Restaurant Profile
            </Link>
          )}
        </div>

        {/* Navigation Content Area */}
        <div className="px-3.5 sm:px-4 py-2 flex-1 overflow-y-auto space-y-1.5 scrollbar-none">
          {/* Options 1 to 4: Dashboard, Menu Management, Restaurant Profile, Settings */}
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onCloseMobile}
                className={`group flex items-start space-x-3.5 p-3 rounded-2xl transition-all duration-200 text-left ${
                  item.isActive
                    ? 'bg-[#241A15] text-[#E9A052] border border-[#382820] shadow-sm'
                    : 'border border-transparent hover:bg-[#1C1512] text-[#F5EDE5]'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      item.isActive
                        ? 'text-[#E9A052]'
                        : 'text-[#B6A69A] group-hover:text-[#E9A052]'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-sans leading-snug transition-colors ${
                      item.isActive
                        ? 'font-semibold text-[#E9A052]'
                        : 'font-medium text-[#F5EDE5] group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </div>
                  {item.subtitle && (
                    <div
                      className={`text-[11px] font-sans mt-0.5 leading-tight transition-colors ${
                        item.isActive
                          ? 'text-[#E9A052]/80'
                          : 'text-[#B6A69A] group-hover:text-[#F5EDE5]'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Section: Divider + Options 5 & 6 (Help & Support, Sign Out) */}
        <div className="p-3.5 sm:p-4 pt-0">
          {/* Clean Horizontal Divider */}
          <div className="border-t border-[#382820] mb-3" />

          <div className="space-y-1.5">
            {/* 5. Help & Support */}
            <NavLink
              to="/owner/help"
              onClick={onCloseMobile}
              className={`group flex items-start space-x-3.5 p-3 rounded-2xl transition-all duration-200 text-left ${
                isHelpActive
                  ? 'bg-[#241A15] text-[#E9A052] border border-[#382820] shadow-sm'
                  : 'border border-transparent hover:bg-[#1C1512] text-[#F5EDE5]'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <HelpCircle
                  className={`w-5 h-5 transition-colors ${
                    isHelpActive
                      ? 'text-[#E9A052]'
                      : 'text-[#B6A69A] group-hover:text-[#E9A052]'
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-sans leading-snug transition-colors ${
                    isHelpActive
                      ? 'font-semibold text-[#E9A052]'
                      : 'font-medium text-[#F5EDE5] group-hover:text-white'
                  }`}
                >
                  Help &amp; Support
                </div>
                <div
                  className={`text-[11px] font-sans mt-0.5 leading-tight transition-colors ${
                    isHelpActive
                      ? 'text-[#E9A052]/80'
                      : 'text-[#B6A69A] group-hover:text-[#F5EDE5]'
                  }`}
                >
                  Guides and assistance
                </div>
              </div>
            </NavLink>

            {/* 6. Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="group w-full flex items-center space-x-3.5 p-3 rounded-2xl border border-transparent hover:bg-rose-500/10 hover:border-rose-500/20 text-[#B6A69A] hover:text-rose-400 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="shrink-0">
                <LogOut className="w-5 h-5 text-[#B6A69A] group-hover:text-rose-400 transition-colors" />
              </div>
              <span className="text-sm font-sans font-medium text-[#F5EDE5] group-hover:text-rose-300">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
