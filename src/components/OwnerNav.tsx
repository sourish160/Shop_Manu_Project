import React from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Store, Utensils, Settings } from 'lucide-react';

export const OwnerNav: React.FC = () => {
  const [searchParams] = useSearchParams();
  const currentResId = searchParams.get('restaurantId') || searchParams.get('id');

  const navItems = [
    { label: 'Dashboard', path: '/owner', icon: LayoutDashboard, end: true },
    {
      label: 'Restaurant Profile',
      path: currentResId ? `/owner/restaurant?id=${currentResId}` : '/owner/restaurant',
      icon: Store,
      end: false,
    },
    {
      label: 'Menu Management',
      path: currentResId ? `/owner/menu?restaurantId=${currentResId}` : '/owner/menu',
      icon: Utensils,
      end: false,
    },
    { label: 'Settings', path: '/owner/settings', icon: Settings, end: false },
  ];

  return (
    <div className="border-b border-slate-200 bg-white mb-8">
      <div className="max-w-5xl mx-auto px-4 flex space-x-1 sm:space-x-6 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `py-3.5 px-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
