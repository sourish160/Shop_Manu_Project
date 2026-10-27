import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  Search,
  Store,
  LogOut,
  User,
} from 'lucide-react';

interface ChapterLink {
  id: string;
  numeral: string;
  label: string;
}

const CHAPTER_LINKS: ChapterLink[] = [
  { id: 'chapter-discovery', numeral: 'I', label: 'The Discovery' },
  { id: 'chapter-craving', numeral: 'II', label: 'The Craving' },
  { id: 'chapter-menu', numeral: 'III', label: 'The Menu' },
  { id: 'chapter-gallery', numeral: 'IV', label: 'Gallery' },
  { id: 'chapter-around-you', numeral: 'V', label: 'Around You' },
  { id: 'chapter-next-bite', numeral: 'VI', label: 'Your Next Bite' },
];

export const CinematicNavigation: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [activeChapter, setActiveChapter] = useState('chapter-discovery');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  // Track scroll depth and active chapter
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      if (isHomePage) {
        const scrollPos = window.scrollY + 200;
        for (let i = CHAPTER_LINKS.length - 1; i >= 0; i--) {
          const el = document.getElementById(CHAPTER_LINKS[i].id);
          if (el && el.offsetTop <= scrollPos) {
            setActiveChapter(CHAPTER_LINKS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleLogout = async () => {
    const wasAdmin = profile?.role === 'admin';
    setMobileMenuOpen(false);
    await logout();
    navigate(wasAdmin ? '/admin/login' : '/owner/login');
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToChapter = (id: string, e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      closeMenu();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      closeMenu();
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || !isHomePage
          ? 'bg-[#0A0807]/95 backdrop-blur-md border-b border-cream-200/10 shadow-xl shadow-black/40 py-0'
          : 'bg-[#0A0807]/80 backdrop-blur-sm border-b border-cream-200/5 py-1'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          aria-label="ManuMania Home"
          className="flex items-center space-x-2.5 focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-1 group shrink-0"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
          <span className="font-serif text-xl sm:text-2xl tracking-tight text-cream-100 group-hover:text-amber-300 transition-colors font-medium">
            ManuMania
          </span>
        </Link>

        {/* Desktop Chapter Navigation Band (Generously Spaced) */}
        {isHomePage && (
          <nav className="hidden xl:flex items-center space-x-6 2xl:space-x-8" aria-label="Chapter Navigation">
            {CHAPTER_LINKS.map((chapter) => {
              const isActive = activeChapter === chapter.id;
              return (
                <a
                  key={chapter.id}
                  href={`#${chapter.id}`}
                  onClick={(e) => scrollToChapter(chapter.id, e)}
                  className={`group flex items-center space-x-1.5 text-xs font-sans uppercase tracking-[0.16em] transition-all py-1.5 border-b-2 ${
                    isActive
                      ? 'text-amber-300 border-amber-400 font-semibold'
                      : 'text-cream-200/60 border-transparent hover:text-cream-100 hover:border-cream-200/25'
                  }`}
                >
                  <span className="font-mono text-[10px] text-amber-400/80 group-hover:text-amber-300">
                    {chapter.numeral}
                  </span>
                  <span>{chapter.label}</span>
                </a>
              );
            })}
          </nav>
        )}

        {!isHomePage && (
          <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
            <Link
              to="/search"
              className="text-xs font-sans uppercase tracking-widest text-cream-200/70 hover:text-amber-300 transition-colors"
            >
              Food Search
            </Link>
            <Link
              to="/search?tab=restaurants"
              className="text-xs font-sans uppercase tracking-widest text-cream-200/70 hover:text-amber-300 transition-colors"
            >
              All Shops
            </Link>
            <Link
              to="/search?location=near-me"
              className="text-xs font-sans uppercase tracking-widest text-cream-200/70 hover:text-amber-300 transition-colors"
            >
              Nearby
            </Link>
          </nav>
        )}

        {/* Desktop Actions & Auth (Visually Distinct & Non-Overlapping) */}
        <div className="hidden sm:flex items-center space-x-4 shrink-0">
          <Link
            to="/search"
            className="group px-3.5 py-1.5 rounded-full border border-cream-200/20 bg-cream-100/[0.06] hover:bg-cream-100/[0.12] hover:border-amber-400/50 backdrop-blur-md transition-all flex items-center space-x-2 text-xs font-sans font-medium text-cream-100 tracking-wider uppercase shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Search</span>
          </Link>

          {user && profile ? (
            <div className="flex items-center space-x-3 pl-3 border-l border-cream-200/15">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-cream-200/10 border border-cream-200/20 text-cream-200">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold text-cream-100 truncate max-w-[100px]">
                  {profile.name}
                </span>
              </div>

              {profile.role === 'owner' && (
                <Link
                  to="/owner"
                  className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300"
                >
                  Portal
                </Link>
              )}

              {profile.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-300"
                >
                  Admin
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="text-[10px] font-medium tracking-wider uppercase p-1.5 text-cream-200/60 hover:text-cream-100 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/owner/login"
                className="text-xs font-sans font-medium tracking-wider uppercase text-cream-200/70 hover:text-cream-100 transition-colors px-2 py-1"
              >
                Sign In
              </Link>
              <Link
                to="/owner/register"
                className="text-xs font-sans font-semibold tracking-wider uppercase px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-espresso-950 transition-all shadow-md shrink-0"
              >
                Register Shop
              </Link>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Menu Toggle Button */}
        <div className="flex xl:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="p-2 border rounded-md border-cream-200/20 text-cream-100 hover:border-cream-200/40 focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
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
        <div className="xl:hidden border-t border-cream-200/10 bg-[#0E0C0B]/98 backdrop-blur-xl px-4 pt-4 pb-6 space-y-4 shadow-2xl animate-fade-in">
          {/* Chapter Links */}
          {isHomePage && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] uppercase tracking-widest-2 text-cream-200/40 font-semibold mb-2">
                Story Chapters
              </p>
              {CHAPTER_LINKS.map((chapter) => (
                <a
                  key={chapter.id}
                  href={`#${chapter.id}`}
                  onClick={(e) => scrollToChapter(chapter.id, e)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded text-xs tracking-wider uppercase transition-colors ${
                    activeChapter === chapter.id
                      ? 'text-amber-300 bg-amber-400/10 font-semibold'
                      : 'text-cream-200/70 hover:text-cream-100 hover:bg-cream-100/[0.05]'
                  }`}
                >
                  <span className="font-mono text-amber-400/70 text-[10px]">
                    {chapter.numeral}
                  </span>
                  <span>{chapter.label}</span>
                </a>
              ))}
            </div>
          )}

          {/* Quick Access */}
          <div className="space-y-1 pt-2 border-t border-cream-200/10">
            <Link
              to="/search"
              onClick={closeMenu}
              className="flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-semibold tracking-wider uppercase text-amber-400 hover:bg-cream-100/[0.05]"
            >
              <Search className="w-4 h-4" />
              <span>Search Dishes & Portions</span>
            </Link>
            <Link
              to="/search?tab=restaurants"
              onClick={closeMenu}
              className="flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-semibold tracking-wider uppercase text-cream-200/80 hover:text-cream-100 hover:bg-cream-100/[0.05]"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>All Food Establishments</span>
            </Link>
          </div>

          {/* Auth Controls */}
          <div className="pt-3 border-t border-cream-200/10">
            {user && profile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3">
                  <span className="text-xs font-semibold text-cream-100">{profile.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded uppercase tracking-widest-2">
                    {profile.role === 'owner' ? 'Owner' : profile.role}
                  </span>
                </div>
                {profile.role === 'owner' && (
                  <Link
                    to="/owner"
                    onClick={closeMenu}
                    className="block text-center py-2 rounded bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wider uppercase"
                  >
                    Owner Dashboard
                  </Link>
                )}
                {profile.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="block text-center py-2 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold tracking-wider uppercase"
                  >
                    Admin Moderation
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded text-[11px] font-semibold tracking-wider uppercase text-cream-200/70 border border-cream-200/20 hover:bg-cream-100/[0.05] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/owner/login"
                  onClick={closeMenu}
                  className="text-center py-2.5 text-[11px] font-semibold tracking-wider uppercase text-cream-100 border border-cream-200/20 bg-cream-100/[0.06] hover:bg-cream-100/[0.1] rounded transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/owner/register"
                  onClick={closeMenu}
                  className="text-center py-2.5 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-espresso-950 text-[11px] font-semibold uppercase tracking-wider"
                >
                  Register Shop
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
