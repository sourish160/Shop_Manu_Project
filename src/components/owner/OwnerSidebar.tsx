import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Store,
  MessageSquare,
  Image as ImageIcon,
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
  onOpenInquiriesModal,
  inquiryCount = 0,
}) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/owner',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: 'Menu Management',
      path: currentRestaurant ? `/owner/menu?restaurantId=${currentRestaurant.id}` : '/owner/menu',
      icon: UtensilsCrossed,
      end: false,
    },
    {
      label: 'Restaurant Profile',
      path: currentRestaurant ? `/owner/restaurant?id=${currentRestaurant.id}` : '/owner/restaurant',
      icon: Store,
      end: false,
    },
    {
      label: 'Categories',
      path: currentRestaurant ? `/owner/menu?restaurantId=${currentRestaurant.id}&tab=categories` : '/owner/menu',
      icon: Layers,
      end: false,
    },
    {
      label: 'Orders & Inquiries',
      onClick: onOpenInquiriesModal,
      icon: MessageSquare,
      badge: inquiryCount > 0 ? String(inquiryCount) : undefined,
    },
    {
      label: 'Photos & Media',
      path: currentRestaurant ? `/owner/restaurant?id=${currentRestaurant.id}#media` : '/owner/restaurant',
      icon: ImageIcon,
      end: false,
    },
    {
      label: 'Settings',
      path: '/owner/settings',
      icon: Settings,
      end: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 bg-[#120E0C] border-r border-cream-200/10 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Restaurant Switcher */}
        <div className="p-5 flex flex-col space-y-5">
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
                className={`p-3 rounded-xl bg-[#1A1412] border border-cream-200/10 flex items-center justify-between gap-3 ${
                  restaurants.length > 1 ? 'cursor-pointer hover:border-amber-400/30 transition-all' : ''
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#241D1A] shrink-0 border border-amber-400/20">
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
                    <h3 className="font-serif text-sm font-medium text-cream-100 truncate">
                      {currentRestaurant.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          currentRestaurant.status === 'approved'
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-cream-200/60 truncate">
                        {currentRestaurant.status === 'approved' ? 'Live on ManuMania' : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {restaurants.length > 1 && (
                  <ChevronDown
                    className={`w-4 h-4 text-cream-200/60 shrink-0 transition-transform duration-200 ${
                      showShopDropdown ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                )}
              </div>

              {/* Multi-Restaurant Dropdown */}
              {showShopDropdown && restaurants.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1412] border border-cream-200/15 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-cream-200/40">
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
                      className={`w-full text-left p-2 rounded-lg text-xs font-sans flex items-center justify-between transition-colors ${
                        res.id === currentRestaurant.id
                          ? 'bg-amber-400/15 text-amber-300 font-semibold'
                          : 'text-cream-200/80 hover:bg-cream-200/10 hover:text-cream-100'
                      }`}
                    >
                      <span className="truncate">{res.name}</span>
                      <span className="font-mono text-[9px] text-cream-200/40 uppercase">
                        {res.area || res.city}
                      </span>
                    </button>
                  ))}
                  <div className="pt-1.5 mt-1 border-t border-cream-200/10">
                    <Link
                      to="/owner/restaurant/new"
                      onClick={() => setShowShopDropdown(false)}
                      className="w-full text-left p-2 rounded-lg text-xs text-amber-400 hover:bg-amber-400/10 flex items-center gap-1.5 font-medium"
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
              className="p-3 rounded-xl bg-amber-400/10 border border-dashed border-amber-400/30 text-amber-300 hover:bg-amber-400/15 text-xs font-sans font-medium text-center transition-all block"
            >
              + Register Restaurant Profile
            </Link>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.onClick?.();
                      onCloseMobile();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium text-[#CBBBB0] hover:text-[#FAF8F5] hover:bg-[#201511]/70 transition-all text-left group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <Icon className="w-4 h-4 text-[#CBBBB0] group-hover:text-[#E8A856] transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-[#E8A856] font-mono text-[10px] font-semibold border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path!}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium transition-all ${
                      isActive
                        ? 'bg-[#221611] text-[#E8A856] border border-[#52331C] shadow-sm'
                        : 'text-[#CBBBB0] hover:text-[#FAF8F5] hover:bg-[#201511]/70'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#E8A856]' : 'text-[#CBBBB0]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Help Center & User Profile */}
        <div className="p-4 border-t border-cream-200/10 space-y-3">
          {/* Need Help Card */}
          <div className="p-3.5 rounded-xl bg-[#1A1412] border border-cream-200/10 text-left">
            <div className="flex items-center space-x-2 text-amber-400 mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                Need Help?
              </span>
            </div>
            <p className="font-sans text-[11px] text-cream-200/60 leading-tight mb-2.5">
              Have questions about your menu or verification badge?
            </p>
            <a
              href="mailto:support@shopmanu.com?subject=Restaurant%20Owner%20Support"
              className="inline-flex items-center justify-center w-full px-3 py-1.5 rounded-lg bg-cream-200/10 hover:bg-cream-200/15 text-cream-100 font-sans text-[11px] font-medium transition-all"
            >
              Help Center &amp; Support
            </a>
          </div>

          {/* Account Profile & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0A0807] font-bold text-xs shrink-0 shadow">
                {(profile?.name || user?.email || 'O').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="font-sans text-xs font-semibold text-cream-100 truncate block">
                  {profile?.name || user?.email?.split('@')[0] || 'Owner'}
                </span>
                <span className="font-mono text-[10px] text-amber-400/80 uppercase tracking-wider block">
                  Kitchen Partner
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-cream-200/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

