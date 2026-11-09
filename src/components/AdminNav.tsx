import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShieldCheck, Store, Flag, ClipboardList, ArrowLeft } from 'lucide-react';

export const AdminNav: React.FC = () => {
  const navItems = [
    { to: '/admin', label: 'Overview', icon: ShieldCheck, end: true },
    { to: '/admin/restaurants', label: 'Restaurants & Verification', icon: Store },
    { to: '/admin/reports', label: 'User Reports', icon: Flag },
    { to: '/admin/audit', label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div className="sticky top-0 z-30 bg-[#120E0C]/95 backdrop-blur-md border-b border-cream-200/10 mb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5 border-b border-cream-200/10 gap-4">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" aria-hidden="true" />
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-cream-100">
              Platform Administration
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
              Super Admin Mode
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-[11px] font-mono uppercase tracking-wider text-cream-200/60 hover:text-amber-300 transition-colors px-2.5 py-1 rounded-lg hover:bg-cream-100/[0.04]"
              title="Return to public discovery"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Site</span>
            </Link>
          </div>
        </div>

        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none" aria-label="Admin Sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center space-x-2 text-xs font-sans font-medium px-3.5 py-2 rounded-xl transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'border border-transparent text-cream-200/70 hover:text-cream-100 hover:bg-cream-100/[0.04]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
