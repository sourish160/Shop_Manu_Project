import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Store, Flag, ClipboardList } from 'lucide-react';

export const AdminNav: React.FC = () => {
  const navItems = [
    { to: '/admin', label: 'Overview', icon: ShieldCheck, end: true },
    { to: '/admin/restaurants', label: 'Restaurants & Verification', icon: Store },
    { to: '/admin/reports', label: 'User Reports', icon: Flag },
    { to: '/admin/audit', label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div className="bg-white border-b border-slate-200 mb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Platform Administration
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Admin Mode
          </span>
        </div>
        <nav className="flex space-x-6 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center space-x-2 text-xs font-medium py-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-slate-900 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
