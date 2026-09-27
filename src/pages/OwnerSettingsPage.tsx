import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { insforge, Restaurant } from '../lib/insforge';
import { OwnerNav } from '../components/OwnerNav';
import { formatDate } from '../utils/formatters';
import { useSEO } from '../hooks/useSEO';

export const OwnerSettingsPage: React.FC = () => {
  const { user, profile } = useAuth();

  useSEO({
    title: 'Owner Settings',
    noIndex: true,
  });

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOwnerRestaurant() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchErr } = await insforge.database
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (fetchErr) {
          setError(fetchErr.message);
          return;
        }

        setRestaurant((data as Restaurant) || null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load restaurant settings.');
      } finally {
        setLoading(false);
      }
    }

    fetchOwnerRestaurant();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Owner Settings</h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your account profile and restaurant system settings.
        </p>
      </div>

      <OwnerNav />

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

          {/* Restaurant Association Details */}
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 mb-4">
              Linked Restaurant
            </h2>
            {restaurant ? (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Restaurant Name</dt>
                  <dd className="mt-1 font-medium text-slate-900">{restaurant.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Listing Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                      restaurant.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : restaurant.status === 'rejected' || restaurant.status === 'suspended'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {restaurant.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Restaurant ID</dt>
                  <dd className="mt-1 font-mono text-xs text-slate-600 select-all">{restaurant.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Public Slug</dt>
                  <dd className="mt-1 font-mono text-xs text-slate-600">{restaurant.slug}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verification Status</dt>
                  <dd className="mt-1 text-slate-700">
                    {restaurant.verified ? 'Verified by Admin' : 'Unverified (Admin review required)'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered At</dt>
                  <dd className="mt-1 text-slate-700">{formatDate(restaurant.created_at)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">
                No restaurant profile found. Visit the Restaurant section to set up your establishment.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
