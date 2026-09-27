import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Search, ShieldAlert, Store, LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const isSearchActive = location.pathname.startsWith('/search');

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Desktop Nav */}
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center space-x-2 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 rounded p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="text-lg font-bold tracking-tight">ShopManu</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            <Link
              to="/search"
              className={`text-sm font-medium px-3 py-1.5 rounded transition-colors flex items-center space-x-1.5 ${
                isSearchActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Search</span>
            </Link>

            {profile?.role === 'owner' && (
              <Link
                to="/owner"
                className={`text-sm font-medium px-3 py-1.5 rounded transition-colors flex items-center space-x-1.5 ${
                  location.pathname.startsWith('/owner')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Owner Dashboard</span>
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors flex items-center space-x-1.5 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {user && profile ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span className="font-medium text-slate-900">{profile.name}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200 uppercase tracking-wide">
                {profile.role}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium ml-1 px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-md animate-in fade-in duration-100">
          <nav className="space-y-1" aria-label="Mobile Navigation">
            <Link
              to="/search"
              onClick={closeMenu}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded text-sm font-medium ${
                isSearchActive ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Search Foods & Restaurants</span>
            </Link>

            {profile?.role === 'owner' && (
              <Link
                to="/owner"
                onClick={closeMenu}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Store className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Owner Dashboard</span>
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <span>Admin Moderation</span>
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-100">
            {user && profile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm font-medium text-slate-900">{profile.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200 uppercase">
                    {profile.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="text-center py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="text-center py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
