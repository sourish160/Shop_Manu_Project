import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge, Restaurant } from '../lib/insforge';

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      setRestaurants((data || []) as Restaurant[]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load restaurants.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your registered restaurants and status.
          </p>
        </div>
        <Link
          to="/owner/restaurant/new"
          className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          Create restaurant
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading your restaurants...
        </div>
      ) : restaurants.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded p-12 text-center bg-white">
          <p className="text-sm font-medium text-slate-800 mb-1">
            No restaurants found
          </p>
          <p className="text-xs text-slate-500 mb-4">
            You have not registered any restaurants yet.
          </p>
          <Link
            to="/owner/restaurant/new"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Create restaurant
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {restaurants.map((res) => (
            <div
              key={res.id}
              className="border border-slate-200 bg-white rounded p-5 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {res.name}
                    </h2>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded tracking-wide border ${
                        res.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : res.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {res.status}
                    </span>
                    {res.verified && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Slug: <span className="font-mono text-slate-700">/restaurant/{res.slug}</span>
                  </p>

                  {res.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                      {res.description}
                    </p>
                  )}

                  <div className="text-xs text-slate-500 pt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Address: {res.address}</span>
                    <span>Area: {res.area}</span>
                    <span>City: {res.city}</span>
                    <span>Phone: {res.phone}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0">
                  <Link
                    to={`/owner/restaurant?id=${res.id}`}
                    className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Edit details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
