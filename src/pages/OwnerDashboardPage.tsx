import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge, Restaurant, Category, Food, RestaurantHours } from '../lib/insforge';
import { OwnerLayout } from '../components/owner/OwnerLayout';
import { useSEO } from '../hooks/useSEO';
import {
  Store,
  Utensils,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Plus,
  Edit,
  MapPin,
  Phone,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

interface FoodWithCategory extends Food {
  category?: Category;
}

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  useSEO({
    title: 'Dashboard — ManuMania Restaurant Partner Portal',
    noIndex: true,
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodWithCategory[]>([]);
  const [hours, setHours] = useState<RestaurantHours[]>([]);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch user's restaurants
  const loadRestaurants = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      const list = (data as Restaurant[]) || [];
      setRestaurants(list);
      if (list.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(list[0].id);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load restaurant data.');
    }
  }, [user, selectedRestaurantId]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const currentRestaurant = useMemo(() => {
    return (
      restaurants.find((r) => r.id === selectedRestaurantId) ||
      (restaurants.length > 0 ? restaurants[0] : null)
    );
  }, [restaurants, selectedRestaurantId]);

  // 2. Fetch dishes, categories, hours, and reports for active restaurant
  const loadRestaurantDetails = useCallback(async () => {
    if (!currentRestaurant) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Parallel fetch of real database entities
      const [catRes, foodRes, hoursRes, inqRes] = await Promise.all([
        insforge.database
          .from('categories')
          .select('*')
          .eq('restaurant_id', currentRestaurant.id)
          .order('sort_order', { ascending: true }),
        insforge.database
          .from('foods')
          .select(`
            *,
            category:categories(id, name, sort_order)
          `)
          .eq('restaurant_id', currentRestaurant.id)
          .order('updated_at', { ascending: false }),
        insforge.database
          .from('restaurant_hours')
          .select('*')
          .eq('restaurant_id', currentRestaurant.id),
        insforge.database
          .from('restaurant_reports')
          .select('id')
          .eq('restaurant_id', currentRestaurant.id),
      ]);

      if (catRes.data) setCategories(catRes.data as Category[]);
      if (foodRes.data) setFoods(foodRes.data as FoodWithCategory[]);
      if (hoursRes.data) setHours(hoursRes.data as RestaurantHours[]);
      if (inqRes.data) setInquiryCount(inqRes.data.length);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load dashboard operational statistics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentRestaurant]);

  useEffect(() => {
    loadRestaurantDetails();
  }, [loadRestaurantDetails]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRestaurantDetails();
  };

  // Operational metrics derived strictly from actual data
  const metrics = useMemo(() => {
    const totalFoods = foods.length;
    const availableFoods = foods.filter((f) => f.available).length;
    const unavailableFoods = totalFoods - availableFoods;
    const totalCategories = categories.length;

    // Freshness calculation based on days since update
    const now = Date.now();
    let freshCount = 0;
    let reviewCount = 0;
    let staleCount = 0;
    let latestUpdateTimestamp = '';

    foods.forEach((f) => {
      const updatedAtTime = new Date(f.updated_at).getTime();
      if (!latestUpdateTimestamp || updatedAtTime > new Date(latestUpdateTimestamp).getTime()) {
        latestUpdateTimestamp = f.updated_at;
      }

      const diffDays = Math.floor((now - updatedAtTime) / (1000 * 60 * 60 * 24));
      if (diffDays < 30) freshCount++;
      else if (diffDays <= 60) reviewCount++;
      else staleCount++;
    });

    const freshnessScore = totalFoods > 0 ? Math.round((freshCount / totalFoods) * 100) : 100;

    // Profile completeness calculation
    let completenessScore = 0;
    if (currentRestaurant) {
      if (currentRestaurant.name) completenessScore += 15;
      if (currentRestaurant.phone) completenessScore += 15;
      if (currentRestaurant.address && currentRestaurant.area) completenessScore += 15;
      if (currentRestaurant.latitude && currentRestaurant.longitude) completenessScore += 15;
      if (currentRestaurant.logo_url) completenessScore += 10;
      if (currentRestaurant.cover_url) completenessScore += 10;
      if (hours.length > 0) completenessScore += 10;
      if (totalFoods >= 3) completenessScore += 10;
    }

    return {
      totalFoods,
      availableFoods,
      unavailableFoods,
      totalCategories,
      freshCount,
      reviewCount,
      staleCount,
      freshnessScore,
      latestUpdateTimestamp: latestUpdateTimestamp || currentRestaurant?.updated_at || '',
      completenessScore: Math.min(100, completenessScore),
    };
  }, [foods, categories, hours, currentRestaurant]);

  // Quick toggle availability for top dishes
  const handleToggleAvailability = async (food: FoodWithCategory) => {
    const newStatus = !food.available;
    // Optimistic update
    setFoods((prev) =>
      prev.map((f) => (f.id === food.id ? { ...f, available: newStatus } : f))
    );

    try {
      const { error } = await insforge.database
        .from('foods')
        .update({
          available: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', food.id);

      if (error) {
        // Rollback
        setFoods((prev) =>
          prev.map((f) => (f.id === food.id ? { ...f, available: food.available } : f))
        );
        setErrorMsg('Failed to update dish availability.');
      }
    } catch {
      // Rollback
      setFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, available: food.available } : f))
      );
      setErrorMsg('Network error updating dish availability.');
    }
  };

  return (
    <OwnerLayout
      activeRestaurantId={selectedRestaurantId}
      onSelectRestaurant={(res) => setSelectedRestaurantId(res.id)}
    >
      <div className="space-y-6">
        {/* =====================================================================
            1. TOP PROFILE SUMMARY & QUICK ACTIONS
            ===================================================================== */}
        {currentRestaurant ? (
          <div className="bg-[#1C1512] border border-[#382820] rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Storefront Identity */}
              <div className="flex items-start space-x-4 sm:space-x-5 min-w-0">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#241A15] border border-[#382820] shrink-0">
                  <img
                    src={currentRestaurant.cover_url || currentRestaurant.logo_url || '/images/shops/storefront-1.jpg'}
                    alt={currentRestaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/shops/storefront-1.jpg';
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold ${
                        currentRestaurant.status === 'approved'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : currentRestaurant.status === 'pending'
                          ? 'bg-[#241A15] text-[#E9A052] border border-[#382820]'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          currentRestaurant.status === 'approved'
                            ? 'bg-emerald-400 animate-pulse'
                            : currentRestaurant.status === 'pending'
                            ? 'bg-[#E9A052]'
                            : 'bg-rose-400'
                        }`}
                      />
                      {currentRestaurant.status === 'approved'
                        ? 'Live on ManuMania'
                        : currentRestaurant.status === 'pending'
                        ? 'Pending Verification'
                        : 'Review Required'}
                    </span>

                    {currentRestaurant.verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#241A15] border border-[#E9A052]/40 text-[#E9A052] font-mono text-[10px] uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3 text-[#E9A052]" />
                        Verified Kitchen
                      </span>
                    )}

                    <span className="font-mono text-[10px] uppercase text-[#B6A69A]/80 bg-[#241A15] px-2 py-0.5 rounded border border-[#382820]">
                      {currentRestaurant.city || 'Kolkata'}
                    </span>
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl text-[#F5EDE5] font-normal tracking-tight truncate">
                    {currentRestaurant.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#B6A69A] mt-1.5 font-sans">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#E9A052] shrink-0" />
                      <span className="truncate max-w-xs">{currentRestaurant.address || currentRestaurant.area}</span>
                    </div>
                    {currentRestaurant.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#E9A052] shrink-0" />
                        <span>{currentRestaurant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-[#382820] lg:border-t-0">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2.5 rounded-xl bg-[#241A15] border border-[#382820] text-[#B6A69A] hover:text-[#F5EDE5] hover:border-[#E9A052]/40 transition-colors cursor-pointer"
                  title="Refresh statistics"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#E9A052]' : ''}`} />
                </button>

                <Link
                  to={`/owner/menu?restaurantId=${currentRestaurant.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#241A15] border border-[#382820] hover:border-[#E9A052]/50 text-[#F5EDE5] hover:text-[#E9A052] font-sans text-xs font-semibold transition-all"
                >
                  <Utensils className="w-3.5 h-3.5 text-[#E9A052]" />
                  <span>Manage Menu</span>
                </Link>

                <Link
                  to={`/owner/restaurant?id=${currentRestaurant.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#241A15] border border-[#382820] hover:border-[#E9A052]/50 text-[#F5EDE5] hover:text-[#E9A052] font-sans text-xs font-semibold transition-all"
                >
                  <Edit className="w-3.5 h-3.5 text-[#E9A052]" />
                  <span>Edit Profile</span>
                </Link>

                <Link
                  to={`/owner/menu?action=add&restaurantId=${currentRestaurant.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] font-sans font-semibold text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </Link>
              </div>
            </div>

            {/* Profile Completion Meter */}
            <div className="mt-5 pt-4 border-t border-[#382820] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 flex-1 max-w-md">
                <span className="font-mono text-xs text-[#B6A69A] uppercase tracking-wider shrink-0">
                  Profile Completion:
                </span>
                <div className="w-full bg-[#241A15] border border-[#382820] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-[#E9A052] h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.completenessScore}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-[#E9A052] shrink-0">
                  {metrics.completenessScore}%
                </span>
              </div>

              {metrics.completenessScore < 100 && (
                <div className="text-xs text-[#B6A69A] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E9A052]" />
                  <span>
                    Add operating hours &amp; storefront cover photo to achieve 100% verification readiness.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#1C1512] border border-[#382820] rounded-3xl p-8 text-center space-y-4">
            <Store className="w-12 h-12 text-[#E9A052] mx-auto opacity-80" />
            <h2 className="font-serif text-2xl text-[#F5EDE5]">No Restaurant Profile Registered</h2>
            <p className="text-xs text-[#B6A69A] max-w-md mx-auto">
              Register your kitchen to start adding menu categories, verified dishes, and operating hours for diners across your city.
            </p>
            <Link
              to="/owner/restaurant/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E9A052] text-[#100D0B] font-semibold text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Register Restaurant Profile</span>
            </Link>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button
              onClick={() => setErrorMsg(null)}
              className="font-mono text-xs text-rose-400 hover:text-rose-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* =====================================================================
            2. OPERATIONAL STATS OVERVIEW CARDS (Real InsForge Data)
            ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Total Menu Items */}
          <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#E9A052]/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#B6A69A] uppercase tracking-wider">
                Total Dishes
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#241A15] border border-[#382820] flex items-center justify-center">
                <Utensils className="w-3.5 h-3.5 text-[#E9A052]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif text-[#F5EDE5] font-light">
              {metrics.totalFoods}
            </div>
            <div className="text-[11px] text-[#B6A69A] mt-1">
              Active in digital menu
            </div>
          </div>

          {/* Card 2: Categories */}
          <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#E9A052]/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#B6A69A] uppercase tracking-wider">
                Categories
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#241A15] border border-[#382820] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-[#E9A052]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif text-[#F5EDE5] font-light">
              {metrics.totalCategories}
            </div>
            <div className="text-[11px] text-[#B6A69A] mt-1">
              Sections organized
            </div>
          </div>

          {/* Card 3: Available In-Stock */}
          <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider">
                Available
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif text-emerald-300 font-light">
              {metrics.availableFoods}
            </div>
            <div className="text-[11px] text-emerald-400/70 mt-1">
              Ready to order
            </div>
          </div>

          {/* Card 4: Unavailable Sold-Out */}
          <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-rose-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-rose-400 uppercase tracking-wider">
                Unavailable
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-950/40 border border-rose-800/40 flex items-center justify-center">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif text-rose-300 font-light">
              {metrics.unavailableFoods}
            </div>
            <div className="text-[11px] text-rose-400/70 mt-1">
              Temporarily paused
            </div>
          </div>

          {/* Card 5: Menu Freshness */}
          <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#E9A052]/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#E9A052] uppercase tracking-wider">
                Freshness
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#241A15] border border-[#382820] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#E9A052]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif text-[#E9A052] font-light">
              {metrics.freshnessScore}%
            </div>
            <div className="text-[11px] text-[#B6A69A] mt-1 truncate">
              {metrics.freshCount} fresh / {metrics.totalFoods} items
            </div>
          </div>

          {/* Card 6: Customer Inquiries */}
          <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#E9A052]/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#B6A69A] uppercase tracking-wider">
                Inquiries
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#241A15] border border-[#382820] flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-[#E9A052]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif text-[#F5EDE5] font-light">
              {inquiryCount}
            </div>
            <div className="text-[11px] text-[#B6A69A] mt-1">
              {inquiryCount === 0 ? 'No open reports' : 'Customer inquiries'}
            </div>
          </div>
        </div>

        {/* =====================================================================
            3. VERIFICATION & ACCOUNT ALERTS
            ===================================================================== */}
        {currentRestaurant?.status === 'pending' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#241A15] border border-[#382820] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#1C1512] border border-[#E9A052]/30 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5 text-[#E9A052]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-medium text-[#F5EDE5]">
                  Verification in Progress
                </h4>
                <p className="text-xs text-[#B6A69A] mt-0.5 leading-relaxed">
                  Your restaurant registration is under review by our Kolkata editorial team. You can continue updating your dishes and prices freely; changes will immediately reflect upon live activation.
                </p>
              </div>
            </div>

            <Link
              to={`/owner/restaurant?id=${currentRestaurant.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C1512] hover:bg-[#2C201A] text-[#E9A052] border border-[#382820] text-xs font-semibold shrink-0"
            >
              <span>Review Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {metrics.staleCount > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/25 border border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#1C1512] border border-rose-800/50 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-medium text-rose-200">
                  {metrics.staleCount} Dishes Need Price Re-Confirmation
                </h4>
                <p className="text-xs text-rose-300/80 mt-0.5 leading-relaxed">
                  Prices have not been confirmed in over 60 days. Quick confirmation protects diner trust and verified search placement.
                </p>
              </div>
            </div>

            <Link
              to={`/owner/menu?restaurantId=${currentRestaurant?.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C1512] hover:bg-rose-950/40 text-rose-300 border border-rose-900/60 text-xs font-semibold shrink-0"
            >
              <span>Review Prices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* =====================================================================
            4. RECENT MENU DISHES & QUICK OPERATIONAL CONTROLS
            ===================================================================== */}
        <div className="bg-[#1C1512] border border-[#382820] rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#382820]">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#F5EDE5] font-normal tracking-tight">
                Menu Overview &amp; Quick Availability
              </h2>
              <p className="text-xs text-[#B6A69A] font-sans mt-0.5">
                Toggle stock availability instantly or jump directly into the full menu manager.
              </p>
            </div>

            <Link
              to={`/owner/menu?restaurantId=${currentRestaurant?.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9A052] hover:text-amber-300 transition-colors shrink-0"
            >
              <span>Open Full Menu Management</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-[#B6A69A] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#E9A052] mx-auto" />
              <p className="text-xs font-mono uppercase tracking-wider">Loading verified menu records...</p>
            </div>
          ) : foods.length === 0 ? (
            <div className="py-16 text-center text-[#B6A69A] space-y-3">
              <Utensils className="w-10 h-10 mx-auto text-[#B6A69A]/40 stroke-[1.5]" />
              <h3 className="font-serif text-lg text-[#F5EDE5]">No Menu Items Added Yet</h3>
              <p className="text-xs text-[#B6A69A] max-w-sm mx-auto">
                Start building your kitchen catalogue by adding your signature dishes with verified prices.
              </p>
              <Link
                to={`/owner/menu?action=add&restaurantId=${currentRestaurant?.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] font-semibold text-xs uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Dish</span>
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {foods.slice(0, 6).map((food) => (
                <div
                  key={food.id}
                  className="p-3 sm:p-4 rounded-2xl bg-[#241A15] border border-[#382820] flex items-center justify-between gap-4 hover:border-[#E9A052]/30 transition-all"
                >
                  {/* Left: Dish thumbnail and details */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#1C1512] border border-[#382820] shrink-0">
                      <img
                        src={food.image_url || '/images/menu/biryani.jpg'}
                        alt={food.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/menu/biryani.jpg';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            food.veg_type === 'veg' ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                          title={food.veg_type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                        />
                        <h4 className="font-serif text-sm font-medium text-[#F5EDE5] truncate">
                          {food.name}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 mt-0.5 text-xs text-[#B6A69A]">
                        <span>{food.category?.name || 'General'}</span>
                        <span>•</span>
                        <span className="font-mono text-[#E9A052] font-semibold">
                          ₹{food.base_price || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Availability switch & edit button */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(food)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        food.available
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/50'
                          : 'bg-[#1C1512] text-[#B6A69A] border border-[#382820] hover:text-[#F5EDE5]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          food.available ? 'bg-emerald-400' : 'bg-[#B6A69A]'
                        }`}
                      />
                      <span>{food.available ? 'In Stock' : 'Paused'}</span>
                    </button>

                    <Link
                      to={`/owner/menu?editFoodId=${food.id}&restaurantId=${currentRestaurant?.id}`}
                      className="p-2 rounded-xl bg-[#1C1512] border border-[#382820] text-[#B6A69A] hover:text-[#E9A052] hover:border-[#E9A052]/40 transition-colors"
                      title="Edit dish"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categories Strip */}
          {categories.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#382820]">
              <span className="font-mono text-[10px] text-[#B6A69A] uppercase tracking-wider block mb-2.5">
                Indexed Category Breakdown ({categories.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const count = foods.filter((f) => f.category_id === cat.id).length;
                  return (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#241A15] border border-[#382820] text-xs text-[#F5EDE5]"
                    >
                      <span>{cat.name}</span>
                      <span className="font-mono text-[10px] text-[#E9A052] font-semibold">
                        {count}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
};
