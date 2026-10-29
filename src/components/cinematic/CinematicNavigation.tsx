import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Search, LogOut, User } from 'lucide-react';

export const CinematicNavigation: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';
  const isSearchPage = location.pathname.startsWith('/search');

  // Track subtle scroll depth for surface elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const wasAdmin = profile?.role === 'admin';
    setMobileMenuOpen(false);
    await logout();
    navigate(wasAdmin ? '/admin/login' : '/owner/login');
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    closeMenu();
    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-transparent backdrop-blur-md border-b border-cream-200/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] sm:h-[72px] flex items-center justify-between gap-4 relative">
        {/* Left: Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            onClick={handleHomeClick}
            aria-label="ManuMania Home"
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md p-1 group"
          >
            <img
              src="/images/logo.png"
              alt="ManuMania"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              style={{ width: 'auto', height: 'auto', maxHeight: '2.25rem' }}
              onError={(e) => {
                e.currentTarget.src = '/images/ManuMania%20Chef%20Sticker%20Logo.png';
              }}
            />
          </Link>
        </div>

        {/* Center: HOME and MENU SEARCH (Desktop) */}
        <nav
          className="hidden md:flex items-center space-x-6 lg:space-x-8 absolute left-1/2 -translate-x-1/2"
          aria-label="Main Navigation"
        >
          {/* 1. HOME */}
          <Link
            to="/"
            onClick={handleHomeClick}
            className={`group relative py-1 px-1.5 text-xs font-sans uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded ${
              isHomePage
                ? 'text-amber-300 font-semibold'
                : 'text-cream-200/70 hover:text-cream-100 font-medium'
            }`}
          >
            <span>HOME</span>
            {isHomePage ? (
              <span
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400/80 via-amber-300 to-amber-400/80 rounded-full"
                aria-hidden="true"
              />
            ) : (
              <span
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-amber-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            )}
          </Link>

          {/* 2. MENU SEARCH */}
          <Link
            to="/search"
            onClick={closeMenu}
            className={`group relative flex items-center space-x-2 px-3.5 py-1.5 rounded-full border transition-all text-xs font-sans font-medium uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isSearchPage
                ? 'border-amber-400/60 bg-amber-400/10 text-amber-300 shadow-sm'
                : 'border-cream-200/20 bg-cream-100/[0.04] text-cream-200/90 hover:text-cream-100 hover:border-amber-400/40 hover:bg-cream-100/[0.08] backdrop-blur-sm'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:scale-105" />
            <span>MENU SEARCH</span>
          </Link>
        </nav>

        {/* Right: SIGN IN and REGISTER SHOP (Desktop) */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4 shrink-0">
          {user && profile ? (
            <div className="flex items-center space-x-3 pl-3 border-l border-cream-200/15">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-cream-200/10 border border-cream-200/20 text-cream-200">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold text-cream-100 truncate max-w-[110px]">
                  {profile.name}
                </span>
              </div>

              {profile.role === 'owner' && (
                <Link
                  to="/owner"
                  className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  Portal
                </Link>
              )}

              {profile.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  Admin
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="text-[10px] font-medium tracking-wider uppercase p-1.5 text-cream-200/60 hover:text-cream-100 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* 3. SIGN IN */}
              <Link
                to="/owner/login"
                className="text-xs font-sans font-medium tracking-[0.12em] uppercase text-cream-200/70 hover:text-amber-300 transition-colors py-1.5 px-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
              >
                SIGN IN
              </Link>

              {/* 4. REGISTER SHOP */}
              <Link
                to="/owner/register"
                className="text-xs font-sans font-semibold tracking-[0.12em] uppercase px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#140F0A] transition-all shadow-sm hover:shadow-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98] shrink-0"
              >
                REGISTER SHOP
              </Link>
            </>
          )}
        </div>

        {/* Mobile & Tablet Menu Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
            className="p-2 border rounded-lg border-cream-200/20 text-cream-100 hover:border-amber-400/40 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-t border-cream-200/10 bg-[#0A0807]/98 backdrop-blur-xl px-4 pt-4 pb-6 space-y-3 shadow-2xl animate-fade-in"
        >
          {/* 1. HOME */}
          <Link
            to="/"
            onClick={handleHomeClick}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-sans font-medium tracking-[0.12em] uppercase transition-colors ${
              isHomePage
                ? 'text-amber-300 bg-amber-400/10 font-semibold border border-amber-400/20'
                : 'text-cream-200/80 hover:text-cream-100 hover:bg-cream-100/[0.05]'
            }`}
          >
            <span>HOME</span>
            {isHomePage && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </Link>

          {/* 2. MENU SEARCH */}
          <Link
            to="/search"
            onClick={closeMenu}
            className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-xs font-sans font-medium tracking-[0.12em] uppercase transition-colors ${
              isSearchPage
                ? 'text-amber-300 bg-amber-400/10 font-semibold border border-amber-400/20'
                : 'text-cream-200/80 hover:text-cream-100 hover:bg-cream-100/[0.05] border border-cream-200/10'
            }`}
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>MENU SEARCH</span>
          </Link>

          {/* 3 & 4. Auth Actions */}
          <div className="pt-2 border-t border-cream-200/10">
            {user && profile ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-3.5 py-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-cream-200/10 border border-cream-200/20 text-cream-200">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-semibold text-cream-100">{profile.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded uppercase tracking-wider">
                    {profile.role === 'owner' ? 'Owner' : profile.role}
                  </span>
                </div>

                {profile.role === 'owner' && (
                  <Link
                    to="/owner"
                    onClick={closeMenu}
                    className="block text-center py-2.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wider uppercase hover:bg-amber-500/25 transition-colors"
                  >
                    Owner Dashboard
                  </Link>
                )}

                {profile.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="block text-center py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold tracking-wider uppercase hover:bg-red-500/25 transition-colors"
                  >
                    Admin Moderation
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase text-cream-200/70 border border-cream-200/15 hover:bg-cream-100/[0.05] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* 3. SIGN IN */}
                <Link
                  to="/owner/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center py-2.5 text-xs font-sans font-semibold tracking-[0.12em] uppercase text-cream-100 border border-cream-200/15 bg-cream-100/[0.04] hover:bg-cream-100/[0.08] hover:border-amber-400/40 rounded-lg transition-colors"
                >
                  SIGN IN
                </Link>

                {/* 4. REGISTER SHOP */}
                <Link
                  to="/owner/register"
                  onClick={closeMenu}
                  className="flex items-center justify-center py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#140F0A] text-xs font-sans font-semibold uppercase tracking-[0.12em] transition-all shadow-sm"
                >
                  REGISTER SHOP
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
