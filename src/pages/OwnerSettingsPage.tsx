import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge, Restaurant } from '../lib/insforge';
import { OwnerNav } from '../components/OwnerNav';
import { formatDate } from '../utils/formatters';
import { useSEO } from '../hooks/useSEO';
import { Store, ExternalLink } from 'lucide-react';

export const OwnerSettingsPage: React.FC = () => {
  const { user, profile } = useAuth();

  useSEO({
    title: 'Owner Settings',
    noIndex: true,
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOwnerRestaurants() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchErr } = await insforge.database
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchErr) {
          setError(fetchErr.message);
          return;
        }

        setRestaurants((data as Restaurant[]) || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load restaurant settings.');
      } finally {
        setLoading(false);
      }
    }

    fetchOwnerRestaurants();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <OwnerNav />
      <div className="max-w-5xl mx-auto px-4">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Owner Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your account profile and all food shops registered under your ownership.
          </p>
        </div>

      {error && (
        <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-white border border-slate-200 rounded">
          Loading settings...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Account Profile Details */}
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 mb-4">
              Owner Profile
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</dt>
                <dd className="mt-1 text-slate-900">{profile?.name || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</dt>
                <dd className="mt-1 text-slate-900">{user?.email || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Role</dt>
                <dd className="mt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-800">
                    {profile?.role || 'owner'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Member Since</dt>
                <dd className="mt-1 text-slate-700">
                  {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Registered Food Shops Section */}
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Registered Food Shops ({restaurants.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Establishments registered under your ownership account. You have exclusive management access to these shops.
                </p>
              </div>
              <Link
                to="/owner/restaurant/new"
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                + Register Another Shop
              </Link>
            </div>

            {restaurants.length > 0 ? (
              <div className="space-y-4">
                {restaurants.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-slate-50/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{res.name}</h3>
                          <p className="text-xs text-slate-500">{res.address}, {res.area}, {res.city}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
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
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Registered on {formatDate(res.created_at)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/owner/menu?restaurantId=${res.id}`}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-800 font-medium transition-colors"
                        >
                          Manage Menu
                        </Link>
                        <Link
                          to={`/owner/restaurant?id=${res.id}`}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-800 font-medium transition-colors"
                        >
                          Edit Profile
                        </Link>
                        {res.slug && res.status === 'approved' && (
                          <Link
                            to={`/restaurant/${res.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1"
                          >
                            <span>Public Page</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-1">No food shop registered yet</p>
                <p className="text-xs text-slate-400 mb-4">Register your restaurant to start adding menus and managing portion prices.</p>
                <Link
                  to="/owner/restaurant/new"
                  className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  Register First Shop
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
