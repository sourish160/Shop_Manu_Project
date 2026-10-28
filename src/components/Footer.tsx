import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <footer className="bg-[#070504] border-t border-cream-200/10 py-16 text-cream-200 relative z-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block group" aria-label="ManuMania Home">
              <img
                src="/images/ManuMania%20Chef%20Sticker%20Logo.png"
                alt="ManuMania"
                className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ width: 'auto', height: 'auto', maxHeight: '2.5rem' }}
              />
            </Link>
            <p className="text-xs text-cream-200/60 max-w-md leading-relaxed font-sans">
              A transparent, chapter-based food discovery atelier. Real dish portion prices, live operating schedules, and authentic dining locations with zero fake ratings.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
              <span>Verified Menus</span>
              <span>·</span>
              <span>Portion Prices</span>
              <span>·</span>
              <span>Kolkata</span>
            </div>
          </div>

          {/* Chapters or Main Links */}
          <div>
            <p className="chapter-label text-[10px] text-amber-400 mb-4">
              {isHomePage ? 'Story Chapters' : 'Navigation'}
            </p>
            <ul className="space-y-2 text-xs text-cream-200/60 font-sans">
              {isHomePage ? (
                <>
                  <li>
                    <a href="#chapter-discovery" className="hover:text-amber-300 transition-colors">
                      Chapter I — The Discovery
                    </a>
                  </li>
                  <li>
                    <a href="#chapter-craving" className="hover:text-amber-300 transition-colors">
                      Chapter II — The Craving
                    </a>
                  </li>
                  <li>
                    <a href="#chapter-menu" className="hover:text-amber-300 transition-colors">
                      Chapter III — The Menu
                    </a>
                  </li>
                  <li>
                    <a href="#chapter-gallery" className="hover:text-amber-300 transition-colors">
                      Chapter IV — The Food Gallery
                    </a>
                  </li>
                  <li>
                    <a href="#chapter-around-you" className="hover:text-amber-300 transition-colors">
                      Chapter V — Around You
                    </a>
                  </li>
                  <li>
                    <a href="#chapter-next-bite" className="hover:text-amber-300 transition-colors">
                      Chapter VI — Your Next Bite
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/" className="hover:text-amber-300 transition-colors">
                      Home Film
                    </Link>
                  </li>
                  <li>
                    <Link to="/search" className="hover:text-amber-300 transition-colors">
                      Food Search
                    </Link>
                  </li>
                  <li>
                    <Link to="/search?tab=restaurants" className="hover:text-amber-300 transition-colors">
                      All Establishments
                    </Link>
                  </li>
                  <li>
                    <Link to="/search?location=near-me" className="hover:text-amber-300 transition-colors">
                      Nearby
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Explore & Portal */}
          <div>
            <p className="chapter-label text-[10px] text-amber-400 mb-4">
              Explore & Portal
            </p>
            <ul className="space-y-2 text-xs text-cream-200/60 font-sans">
              <li>
                <Link to="/search" className="hover:text-amber-300 transition-colors">
                  Food & Portion Search
                </Link>
              </li>
              <li>
                <Link to="/search?location=near-me" className="hover:text-amber-300 transition-colors">
                  Nearby Establishments
                </Link>
              </li>
              <li>
                <Link to="/search?tab=restaurants" className="hover:text-amber-300 transition-colors">
                  All Food Shops
                </Link>
              </li>
              <li>
                <Link to="/owner/register" className="text-amber-300 hover:text-amber-200 transition-colors font-medium">
                  Register Your Food Shop
                </Link>
              </li>
              <li>
                <Link to="/owner/login" className="hover:text-amber-300 transition-colors">
                  Owner Sign In
                </Link>
              </li>
              {profile?.role === 'owner' && (
                <li>
                  <Link to="/owner" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                    Owner Dashboard
                  </Link>
                </li>
              )}
              {profile?.role === 'admin' && (
                <li>
                  <Link to="/admin" className="text-red-400 font-semibold hover:text-red-300 transition-colors">
                    Admin Moderation
                  </Link>
                </li>
              )}
              <li>
                <Link to="/privacy" className="hover:text-cream-100 transition-colors text-cream-200/40">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-cream-200/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-cream-200/40 font-sans gap-4">
          <p>© {new Date().getFullYear()} ManuMania. Authentic food discovery with zero fake ratings.</p>
          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="hover:text-cream-100 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-cream-100 transition-colors">
              Terms
            </Link>
            <Link to="/admin/login" className="hover:text-cream-100 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
