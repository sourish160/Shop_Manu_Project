import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OwnerNav } from '../components/OwnerNav';
import { insforge, Restaurant } from '../lib/insforge';
import { formatDateTime } from '../utils/formatters';

interface DashboardStats {
  categoryCount: number;
  foodCount: number;
  lastUpdate: string;
}

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    categoryCount: 0,
    foodCount: 0,
    lastUpdate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch owner's restaurants
      const { data: resList, error: resError } = await insforge.database
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (resError) throw new Error(resError.message);

      const items = (resList || []) as Restaurant[];
      setRestaurants(items);

      if (items.length > 0) {
        const activeRes = selectedRestaurant
          ? items.find((r) => r.id === selectedRestaurant.id) || items[0]
          : items[0];
        setSelectedRestaurant(activeRes);

        // 2. Fetch category count
        const { count: catCount, error: catError } = await insforge.database
          .from('categories')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', activeRes.id);

        if (catError) console.error('Category count error:', catError);

        // 3. Fetch active food items count
        const { count: foodCount, error: foodError } = await insforge.database
          .from('foods')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', activeRes.id)
          .eq('status', 'active');

        if (foodError) console.error('Food count error:', foodError);

        setStats({
          categoryCount: catCount || 0,
          foodCount: foodCount || 0,
          lastUpdate: activeRes.updated_at,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedRestaurant]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSelectRestaurant = (res: Restaurant) => {
    setSelectedRestaurant(res);
  };

  return (
    <div>
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
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-xs font-medium text-slate-500 shrink-0">Switch:</span>
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRestaurant(r)}
                    className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                      r.id === selectedRestaurant.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
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
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
