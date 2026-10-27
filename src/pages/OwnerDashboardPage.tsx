import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OwnerNav } from '../components/OwnerNav';
import { insforge, Restaurant } from '../lib/insforge';
import { formatDateTime } from '../utils/formatters';
import { getFreshnessStatus } from '../utils/freshness';
import { Clock, Store, ExternalLink } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface DashboardStats {
  categoryCount: number;
  foodCount: number;
  lastUpdate: string;
  freshCount: number;
  reviewRecommendedCount: number;
  staleCount: number;
  unavailableCount: number;
}

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  useSEO({
    title: 'Owner Dashboard',
    noIndex: true,
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    categoryCount: 0,
    foodCount: 0,
    lastUpdate: '',
    freshCount: 0,
    reviewRecommendedCount: 0,
    staleCount: 0,
    unavailableCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedRestaurant =
    restaurants.find((r) => r.id === selectedRestaurantId) || (restaurants.length > 0 ? restaurants[0] : null);

  const fetchRestaurants = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data: resList, error: resError } = await insforge.database
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (resError) throw new Error(resError.message);

      const items = (resList || []) as Restaurant[];
      setRestaurants(items);

      if (items.length > 0) {
        setSelectedRestaurantId((prev) => {
          if (prev && items.some((r) => r.id === prev)) {
            return prev;
          }
          return items[0].id;
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Fetch category count & food freshness stats for the active restaurant
  useEffect(() => {
    if (!selectedRestaurant) return;

    let isMounted = true;

    async function fetchStats() {
      try {
        const activeRes = selectedRestaurant!;

        // 1. Fetch category count
        const { count: catCount, error: catError } = await insforge.database
          .from('categories')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', activeRes.id);

        if (catError) console.error('Category count error:', catError);

        // 2. Fetch active food items with updated_at timestamps for freshness calculation
        const { data: foodRows, error: foodError } = await insforge.database
          .from('foods')
          .select('id, updated_at, available')
          .eq('restaurant_id', activeRes.id)
          .eq('status', 'active');

        if (foodError) console.error('Food count error:', foodError);

        let fresh = 0;
        let review = 0;
        let stale = 0;
        let unavail = 0;

        (foodRows || []).forEach((f) => {
          if (!f.available) unavail++;
          const fStatus = getFreshnessStatus(f.updated_at);
          if (fStatus === 'fresh') fresh++;
          else if (fStatus === 'review_recommended') review++;
          else stale++;
        });

        if (isMounted) {
          setStats({
            categoryCount: catCount || 0,
            foodCount: (foodRows || []).length,
            lastUpdate: activeRes.updated_at,
            freshCount: fresh,
            reviewRecommendedCount: review,
            staleCount: stale,
            unavailableCount: unavail,
          });
        }
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [selectedRestaurant?.id, selectedRestaurant?.updated_at]);

  const handleSelectRestaurant = (res: Restaurant) => {
    setSelectedRestaurantId(res.id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <OwnerNav />
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Owner Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational overview of your restaurant and menu.
            </p>
          </div>
          <Link
            to="/owner/restaurant/new"
            className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            + New restaurant
          </Link>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading dashboard data...
          </div>
        ) : restaurants.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded p-12 text-center bg-white">
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              No restaurant registered yet
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              To begin managing your menu and dishes, register your restaurant profile.
            </p>
            <Link
              to="/owner/restaurant/new"
              className="inline-block px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Create restaurant
            </Link>
          </div>
        ) : selectedRestaurant ? (
          <div className="space-y-6">
            {/* Multiple restaurant switcher if owner has > 1 */}
            {restaurants.length > 1 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Your Food Shops ({restaurants.length})
                    </span>
                  </div>
                  <Link
                    to="/owner/restaurant/new"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline flex items-center gap-1"
                  >
                    + Register Another Shop
                  </Link>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {restaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRestaurant(r)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center space-x-2 shrink-0 ${
                        r.id === selectedRestaurant.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Store className={`w-3.5 h-3.5 ${r.id === selectedRestaurant.id ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="font-semibold">{r.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        r.id === selectedRestaurant.id
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {r.area || r.city}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurant Profile Card */}
            <div className="border border-slate-200 bg-white rounded p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Restaurant
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedRestaurant.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedRestaurant.address}, {selectedRestaurant.area}, {selectedRestaurant.city}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phone: {selectedRestaurant.phone}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-medium">Status:</span>
                    <span
                      className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded tracking-wide border ${
                        selectedRestaurant.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedRestaurant.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {selectedRestaurant.status === 'pending' ? 'Pending review' : selectedRestaurant.status}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    Verification:{' '}
                    <span className="font-medium text-slate-700">
                      {selectedRestaurant.verified ? 'Verified' : 'Unverified (Admin review required)'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Real Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-slate-200 bg-white rounded p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Menu Items
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {stats.foodCount}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Active foods in your menu
                </span>
              </div>

              <div className="border border-slate-200 bg-white rounded p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Categories
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {stats.categoryCount}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Organized dish categories
                </span>
              </div>

              <div className="border border-slate-200 bg-white rounded p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Last Menu Update
                </span>
                <span className="text-sm font-bold text-slate-900 mt-2 block">
                  {formatDateTime(stats.lastUpdate)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Recorded in database
                </span>
              </div>
            </div>

            {/* Menu Freshness & Price Accuracy Health */}
            <div className="border border-slate-200 bg-white rounded p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    Menu Freshness & Accuracy Health
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data-backed freshness based on your actual menu revision timestamps.
                  </p>
                </div>
                {(stats.staleCount > 0 || stats.reviewRecommendedCount > 0) && (
                  <Link
                    to={`/owner/menu?restaurantId=${selectedRestaurant.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700"
                  >
                    Review Menu Items &rarr;
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-800 block mb-0.5">
                    Fresh (0-30 days)
                  </span>
                  <span className="text-xl font-bold text-emerald-900 block">
                    {stats.freshCount}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    Recently updated
                  </span>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-800 block mb-0.5">
                    Review Recommended (31-60 days)
                  </span>
                  <span className="text-xl font-bold text-amber-900 block">
                    {stats.reviewRecommendedCount}
                  </span>
                  <span className="text-[11px] text-amber-700 mt-0.5 block">
                    Verification advised
                  </span>
                </div>

                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-rose-800 block mb-0.5">
                    Stale (&gt;60 days)
                  </span>
                  <span className="text-xl font-bold text-rose-900 block">
                    {stats.staleCount}
                  </span>
                  <span className="text-[11px] text-rose-700 mt-0.5 block">
                    Review needed
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-600 block mb-0.5">
                    Unavailable Dishes
                  </span>
                  <span className="text-xl font-bold text-slate-900 block">
                    {stats.unavailableCount}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Temporarily sold out
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Action Hub */}
            <div className="border border-slate-200 bg-white rounded p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/owner/menu?restaurantId=${selectedRestaurant.id}`}
                  className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Manage Menu
                </Link>
                <Link
                  to={`/owner/restaurant?id=${selectedRestaurant.id}`}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Manage Restaurant Profile
                </Link>
                {selectedRestaurant.slug && selectedRestaurant.status === 'approved' && (
                  <Link
                    to={`/restaurant/${selectedRestaurant.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors inline-flex items-center space-x-1.5"
                  >
                    <span>View Public Menu</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
