import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { profile } = useAuth();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="text-base font-bold text-slate-900 tracking-tight block mb-2">
              ShopManu
            </Link>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              Transparent food and restaurant discovery. View authentic dish variant prices, verified operating schedules, and live menu freshness without fake ratings or artificial marketing claims.
            </p>
          </div>

          {/* Discovery Links */}
          <div>
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block mb-3">
              Explore
            </span>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/search" className="hover:text-slate-900 transition-colors">
                  Search Foods & Places
                </Link>
              </li>
              <li>
                <Link to="/search?location=near-me&radius=5" className="hover:text-slate-900 transition-colors">
                  Near Me
                </Link>
              </li>
              <li>
                <Link to="/search?tab=restaurants" className="hover:text-slate-900 transition-colors">
                  All Restaurants
                </Link>
              </li>
              {profile?.role === 'owner' && (
                <li>
                  <Link to="/owner" className="hover:text-slate-900 font-medium transition-colors">
                    Owner Dashboard
                  </Link>
                </li>
              )}
              {profile?.role === 'admin' && (
                <li>
                  <Link to="/admin" className="text-rose-600 hover:text-rose-700 font-medium transition-colors">
                    Admin Moderation
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Legal & Standards */}
          <div>
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block mb-3">
              Platform & Legal
            </span>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/privacy" className="hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-slate-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-slate-400 block pt-1">
                  Data Accuracy Standards
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ShopManu. All rights reserved.</p>
          <p className="text-slate-400">
            Real restaurant menus and honest portion pricing.
          </p>
        </div>
      </div>
    </footer>
  );
};
