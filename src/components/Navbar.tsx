import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-lg font-semibold text-slate-900 tracking-tight">
            Food Discovery
          </Link>
          {profile?.role === 'owner' && (
            <Link
              to="/owner"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Owner Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user && profile ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-700">
                {profile.name}
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200 uppercase tracking-wide">
                {profile.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-slate-900 font-medium ml-2 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
