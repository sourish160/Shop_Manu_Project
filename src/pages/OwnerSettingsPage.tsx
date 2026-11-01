import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge, Restaurant } from '../lib/insforge';
import { OwnerLayout } from '../components/owner/OwnerLayout';
import { formatDate } from '../utils/formatters';
import { useSEO } from '../hooks/useSEO';
import { Store, ExternalLink, User, ShieldCheck, Mail, Calendar, Plus } from 'lucide-react';

export const OwnerSettingsPage: React.FC = () => {
  const { user, profile } = useAuth();

  useSEO({
    title: 'Partner Settings — ManuMania Restaurant Platform',
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
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-[#EBE6DF] rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                  Account &amp; Establishments
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Partner Account
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-slate-900 font-normal">
                Owner Settings
              </h1>
              <p className="font-sans text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Manage your credentials, partner verification status, and all restaurants registered under your account.
              </p>
            </div>

            <Link
              to="/owner/restaurant/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-sans text-xs font-semibold shadow-sm transition-all shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Kitchen</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-sans text-sm bg-white border border-[#EBE6DF] rounded-3xl">
            Loading settings...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Profile Details */}
            <div className="bg-white border border-[#EBE6DF] rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-xl text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                <span>Kitchen Partner Profile</span>
              </h2>

              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <dt className="text-[11px] font-mono uppercase font-bold text-slate-400">Owner Name</dt>
                  <dd className="mt-1 font-sans font-bold text-slate-900 text-sm">
                    {profile?.name || 'Partner'}
                  </dd>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <dt className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </dt>
                  <dd className="mt-1 font-sans font-medium text-slate-900 text-sm truncate">
                    {user?.email || 'Not provided'}
                  </dd>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <dt className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Role</span>
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      {profile?.role || 'Kitchen Partner'}
                    </span>
                  </dd>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <dt className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Member Since</span>
                  </dt>
                  <dd className="mt-1 font-sans text-slate-700 text-sm">
                    {profile?.created_at ? formatDate(profile.created_at) : 'Active Partner'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Registered Food Shops Section */}
            <div className="bg-white border border-[#EBE6DF] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="font-serif text-xl text-slate-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-amber-600" />
                    <span>Registered Establishments ({restaurants.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Restaurants managed under your owner account with real-time menu and pricing control.
                  </p>
                </div>

                <Link
                  to="/owner/restaurant/new"
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-amber-400 hover:text-amber-800 transition-colors shadow-sm self-start sm:self-auto"
                >
                  + Add Kitchen
                </Link>
              </div>

              {restaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurants.map((res) => (
                    <div
                      key={res.id}
                      className="p-5 border border-[#EBE6DF] rounded-2xl hover:border-amber-400/50 hover:shadow-md transition-all bg-white flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {res.logo_url ? (
                              <img
                                src={res.logo_url}
                                alt={res.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <Store className="w-5 h-5 text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-serif text-slate-900 truncate">{res.name}</h3>
                            <p className="text-xs text-slate-500 font-sans truncate">
                              {res.address}, {res.area}, {res.city}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
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
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 text-[11px] font-sans">
                          Registered {formatDate(res.created_at)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/owner/menu?restaurantId=${res.id}`}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                          >
                            Menu
                          </Link>
                          <Link
                            to={`/owner/restaurant?id=${res.id}`}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                          >
                            Profile
                          </Link>
                          {res.slug && (
                            <Link
                              to={`/restaurant/${res.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1.5 text-amber-700 hover:text-amber-800 inline-flex items-center space-x-1 text-xs font-semibold font-sans"
                            >
                              <span>Live</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Store className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">No restaurants registered yet</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Register your kitchen to start showcasing digital menus to foodies across Kolkata.
                  </p>
                  <Link
                    to="/owner/restaurant/new"
                    className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Register First Kitchen
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};
