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
    <header className="border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
        {/* Brand & Desktop Nav */}
        <div className="flex items-center space-x-8">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center space-x-3 text-[#F4F2ED] focus-visible:ring-1 focus-visible:ring-[#C5A064] rounded p-1 group"
          >
            <div className="w-8 h-8 rounded border border-[#C5A064]/50 bg-gradient-to-br from-[#1C1812] to-[#0A0A0A] flex items-center justify-center text-[#C5A064] font-serif text-sm font-bold shadow-[0_0_15px_rgba(197,160,100,0.2)] group-hover:border-[#C5A064] transition-colors">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl font-light tracking-[0.25em] text-[#F4F2ED] uppercase leading-none group-hover:text-white transition-colors">
                Shop Manu
              </span>
              <span className="font-mono text-[9px] text-[#C5A064] tracking-[0.3em] uppercase mt-0.5 opacity-80">
                Atelier Culinaire
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-2" aria-label="Main Navigation">
            <Link
              to="/search"
              className={`font-mono text-xs tracking-[0.18em] uppercase px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                isSearchActive && !location.search.includes('location=near-me')
                  ? 'bg-white/10 text-[#C5A064] border border-[#C5A064]/30'
                  : 'text-[#F4F2ED]/70 hover:text-[#F4F2ED] hover:bg-white/5'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#C5A064]" aria-hidden="true" />
              <span>Explore Menus</span>
            </Link>

            <Link
              to="/search?location=near-me"
              className={`font-mono text-xs tracking-[0.18em] uppercase px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                location.search.includes('location=near-me')
                  ? 'bg-white/10 text-[#C5A064] border border-[#C5A064]/30'
                  : 'text-[#F4F2ED]/70 hover:text-[#F4F2ED] hover:bg-white/5'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-[#C5A064]" aria-hidden="true" />
              <span>Near Me</span>
            </Link>

            {profile?.role === 'owner' && (
              <Link
                to="/owner"
                className={`font-mono text-xs tracking-[0.18em] uppercase px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                  location.pathname.startsWith('/owner')
                    ? 'bg-white/10 text-[#C5A064] border border-[#C5A064]/30'
                    : 'text-[#F4F2ED]/70 hover:text-[#F4F2ED] hover:bg-white/5'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-[#C5A064]" aria-hidden="true" />
                <span>Owner Portal</span>
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className={`font-mono text-xs tracking-[0.18em] uppercase px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                <span>Admin Moderation</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {user && profile ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#F4F2ED]/80">
                <User className="w-3.5 h-3.5 text-[#C5A064]" aria-hidden="true" />
                <span className="font-semibold text-[#F4F2ED]">{profile.name}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#C5A064] border border-[#C5A064]/30 uppercase tracking-widest">
                {profile.role === 'owner' ? 'Shop Owner' : profile.role}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="font-mono text-xs tracking-wider uppercase text-[#F4F2ED]/70 hover:text-white px-2.5 py-1.5 rounded border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="font-mono text-xs uppercase tracking-widest text-[#F4F2ED]/70 hover:text-white px-3.5 py-2 rounded border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all"
              >
                Owner Login
              </Link>
              <Link
                to="/register"
                className="forge-btn text-xs font-mono uppercase tracking-widest px-4 py-2"
              >
                List Your Shop
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
            className="p-2 text-[#F4F2ED]/80 hover:text-white hover:bg-white/10 rounded-md border border-white/10"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#C5A064]" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0C0C0C] px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in fade-in duration-150">
          <nav className="space-y-1 font-mono text-xs" aria-label="Mobile Navigation">
            <Link
              to="/search"
              onClick={closeMenu}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg ${
                isSearchActive ? 'bg-white/10 text-[#C5A064]' : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4 text-[#C5A064]" aria-hidden="true" />
              <span>Explore Menus</span>
            </Link>

            <Link
              to="/search?location=near-me"
              onClick={closeMenu}
              className="flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/5"
            >
              <Store className="w-4 h-4 text-[#C5A064]" aria-hidden="true" />
              <span>Discover Near Me</span>
            </Link>

            {profile?.role === 'owner' && (
              <Link
                to="/owner"
                onClick={closeMenu}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/5"
              >
                <Store className="w-4 h-4 text-[#C5A064]" aria-hidden="true" />
                <span>Owner Dashboard</span>
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-rose-300 bg-rose-950/40 border border-rose-500/30"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" aria-hidden="true" />
                <span>Admin Moderation</span>
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-white/10">
            {user && profile ? (
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm font-medium text-[#F4F2ED]">{profile.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#C5A064] border border-[#C5A064]/30 uppercase tracking-widest">
                    {profile.role === 'owner' ? 'Shop Owner' : profile.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="text-center py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 border border-white/15 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  Owner Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="forge-btn text-center py-2 text-xs font-mono uppercase tracking-wider text-[#F4F2ED] rounded-lg"
                >
                  List Your Shop
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
