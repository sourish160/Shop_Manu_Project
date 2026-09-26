import React from 'react';
import { NavLink } from 'react-router-dom';

export const OwnerNav: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/owner', end: true },
    { label: 'Restaurant', path: '/owner/restaurant', end: false },
    { label: 'Menu', path: '/owner/menu', end: false },
    { label: 'Settings', path: '/owner/settings', end: false },
  ];

  return (
    <div className="border-b border-slate-200 bg-white mb-6">
      <div className="max-w-5xl mx-auto px-4 flex space-x-1 sm:space-x-4 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `py-3 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
