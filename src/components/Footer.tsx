import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { profile } = useAuth();

  return (
    <footer className="bg-[#080808] border-t border-white/10 mt-auto text-[#F4F2ED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-block group">
              <span className="font-editorial text-2xl sm:text-3xl font-light tracking-[0.25em] text-[#F4F2ED] uppercase block group-hover:text-white transition-colors">
                Shop Manu
              </span>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C5A064] block mt-0.5">
                Atelier Culinaire
              </span>
            </Link>
            <p className="font-sans font-light text-xs sm:text-sm text-[#F4F2ED]/65 max-w-md leading-relaxed">
              A bespoke platform for transparent culinary discovery. Verified dish variant prices, authentic operating schedules, and honest dining intelligence with zero simulated reviews or paid rankings.
            </p>
          </div>

          {/* Discovery Links */}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C5A064] block mb-4">
              Explore Atelier
            </span>
            <ul className="space-y-2.5 font-mono text-xs text-[#F4F2ED]/70 tracking-wider">
              <li>
                <Link to="/search" className="hover:text-[#C5A064] transition-colors">
                  Search Foods & Places
                </Link>
              </li>
              <li>
                <Link to="/search?location=near-me&radius=5" className="hover:text-[#C5A064] transition-colors">
                  Near Me (GPS)
                </Link>
              </li>
              <li>
                <Link to="/search?tab=restaurants" className="hover:text-[#C5A064] transition-colors">
                  Approved Kitchens
                </Link>
              </li>
              {profile?.role === 'owner' && (
                <li>
                  <Link to="/owner" className="hover:text-[#C5A064] transition-colors text-amber-200">
                    Owner Dashboard
                  </Link>
                </li>
              )}
              {profile?.role === 'admin' && (
                <li>
                  <Link to="/admin" className="text-rose-400 hover:text-rose-300 transition-colors">
                    Admin Moderation
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Legal & Standards */}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C5A064] block mb-4">
              Standards & Legal
            </span>
            <ul className="space-y-2.5 font-mono text-xs text-[#F4F2ED]/70 tracking-wider">
              <li>
                <Link to="/privacy" className="hover:text-[#C5A064] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#C5A064] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-[#F4F2ED]/40 block">
                  Data Accuracy Standards
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[#F4F2ED]/40 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} ShopManu Atelier. All rights reserved.</p>
          <p className="text-[#C5A064]/70">
            Bespoke Portions • Honest Pricing • Authentic Schedules
          </p>
        </div>
      </div>
    </footer>
  );
};
