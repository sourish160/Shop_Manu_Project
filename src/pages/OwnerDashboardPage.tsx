import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  insforge,
  Restaurant,
  Category,
  Food,
  FoodVariant,
  FoodAddon,
} from '../lib/insforge';
import { useSEO } from '../hooks/useSEO';
import { formatDateTime, formatCurrency } from '../utils/formatters';
import { getFreshnessStatus } from '../utils/freshness';

// Subcomponents
import { OwnerSidebar } from '../components/owner/OwnerSidebar';
import { OwnerTopHeader } from '../components/owner/OwnerTopHeader';
import { FoodEditorModal, FoodFormData } from '../components/menu/FoodEditorModal';
import { CategoryModal } from '../components/menu/CategoryModal';
import { ConfirmDialog } from '../components/menu/ConfirmDialog';
import { DietaryBadge } from '../components/menu/DietaryBadge';

// Icons
import {
  UtensilsCrossed,
  Layers,
  Eye,
  MessageSquare,
  Plus,
  ArrowRight,
  Store,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Edit,
  Trash2,
  Calendar,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';

interface FoodWithVariants extends Food {
  variants?: FoodVariant[];
  category?: Category;
}

interface DashboardStats {
  categoryCount: number;
  foodCount: number;
  activeFoodCount: number;
  lastUpdate: string;
  freshCount: number;
  reviewRecommendedCount: number;
  staleCount: number;
  unavailableCount: number;
  inquiryCount: number;
}

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  useSEO({
    title: 'Owner Workspace — ManuMania Restaurant Platform',
    noIndex: true,
  });

  // State Management
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals & Action Payloads
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isSubmittingFood, setIsSubmittingFood] = useState(false);
  const [addons, setAddons] = useState<FoodAddon[]>([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [showInquiriesModal, setShowInquiriesModal] = useState(false);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats>({
    categoryCount: 0,
    foodCount: 0,
    activeFoodCount: 0,
    lastUpdate: '',
    freshCount: 0,
    reviewRecommendedCount: 0,
    staleCount: 0,
    unavailableCount: 0,
    inquiryCount: 0,
  });

  // Determine current active restaurant
  const currentRestaurant = useMemo(() => {
    return (
      restaurants.find((r) => r.id === selectedRestaurantId) ||
      (restaurants.length > 0 ? restaurants[0] : null)
    );
  }, [restaurants, selectedRestaurantId]);

  // Show auto-dismiss toast
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Fetch all restaurants belonging to authenticated owner
  const fetchOwnerRestaurants = useCallback(async () => {
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
          if (prev && items.some((r) => r.id === prev)) return prev;
          return items[0].id;
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load restaurant profile.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOwnerRestaurants();
  }, [fetchOwnerRestaurants]);

  // Load menu items, categories, and inquiries for active restaurant
  const loadRestaurantData = useCallback(async (resId: string) => {
    try {
      // 1. Fetch categories
      const { data: catData, error: catErr } = await insforge.database
        .from('categories')
        .select('*')
        .eq('restaurant_id', resId)
        .order('sort_order', { ascending: true });

      if (catErr) console.error('Categories error:', catErr);
      const catList = (catData || []) as Category[];
      setCategories(catList);

      // 2. Fetch food items with variants
      const { data: foodData, error: foodErr } = await insforge.database
        .from('foods')
        .select(`
          *,
          category:categories(*),
          variants:food_variants(*)
        `)
        .eq('restaurant_id', resId)
        .order('created_at', { ascending: false });

      if (foodErr) console.error('Foods error:', foodErr);
      const foodList = (foodData || []) as FoodWithVariants[];
      setFoods(foodList);

      // 3. Fetch addons
      const { data: addonData } = await insforge.database
        .from('food_addons')
        .select('*')
        .eq('restaurant_id', resId);
      setAddons((addonData || []) as FoodAddon[]);

      // 4. Fetch customer inquiries / reports
      const { data: reportsData } = await insforge.database
        .from('restaurant_reports')
        .select('*')
        .eq('restaurant_id', resId)
        .order('created_at', { ascending: false });
      const inquiries = reportsData || [];
      setInquiriesList(inquiries);

      // 5. Compute real stats & freshness calculations
      let fresh = 0;
      let review = 0;
      let stale = 0;
      let unavail = 0;
      let active = 0;

      foodList.forEach((f) => {
        if (f.status === 'active') active++;
        if (!f.available) unavail++;
        const s = getFreshnessStatus(f.updated_at);
        if (s === 'fresh') fresh++;
        else if (s === 'review_recommended') review++;
        else stale++;
      });

      setStats({
        categoryCount: catList.length,
        foodCount: foodList.length,
        activeFoodCount: active,
        lastUpdate: currentRestaurant?.updated_at || new Date().toISOString(),
        freshCount: fresh,
        reviewRecommendedCount: review,
        staleCount: stale,
        unavailableCount: unavail,
        inquiryCount: inquiries.length,
      });
    } catch (err: any) {
      console.error('Failed to load restaurant data:', err);
    }
  }, [currentRestaurant?.updated_at]);

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadRestaurantData(currentRestaurant.id);
    }
  }, [currentRestaurant?.id, loadRestaurantData]);

  // Handle live availability toggle
  const handleToggleAvailability = async (e: React.MouseEvent, food: FoodWithVariants) => {
    e.stopPropagation();
    const newStatus = !food.available;
    const now = new Date().toISOString();

    // Optimistic UI update
    setFoods((prev) =>
      prev.map((f) => (f.id === food.id ? { ...f, available: newStatus, updated_at: now } : f))
    );

    try {
      const { error } = await insforge.database
        .from('foods')
        .update({
          available: newStatus,
          updated_at: now,
        })
        .eq('id', food.id);

      if (error) throw new Error(error.message);

      showToast(`"${food.name}" is now marked as ${newStatus ? 'Available' : 'Unavailable'}.`);
      if (currentRestaurant?.id) loadRestaurantData(currentRestaurant.id);
    } catch (err: any) {
      // Revert optimistic update on error
      setFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, available: food.available } : f))
      );
      setErrorMsg(`Failed to update availability: ${err.message}`);
    }
  };

  // Handle Save Food (Create or Update)
  const handleSaveFood = async (data: FoodFormData) => {
    if (!currentRestaurant) return;
    setIsSubmittingFood(true);
    try {
      if (editingFood) {
        // Update food
        const { error: fErr } = await insforge.database
          .from('foods')
          .update({
            category_id: data.category_id,
            name: data.name,
            description: data.description || null,
            image_url: data.image_url,
            veg_type: data.veg_type,
            prep_time_minutes: data.prep_time_minutes,
            base_price: data.base_price,
            discount_price: data.discount_price,
            available: data.available,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFood.id);

        if (fErr) throw new Error(fErr.message);

        // Update variants
        for (const v of data.variants) {
          const priceNum = parseFloat(v.price) || 0;
          if (v.id) {
            await insforge.database
              .from('food_variants')
              .update({
                name: v.name.trim(),
                price: priceNum,
                available: v.available,
              })
              .eq('id', v.id);
          } else {
            await insforge.database.from('food_variants').insert([
              {
                food_id: editingFood.id,
                name: v.name.trim(),
                price: priceNum,
                available: v.available,
              },
            ]);
          }
        }

        showToast(`"${data.name}" updated successfully.`);
      } else {
        // Create new food
        const { data: newFood, error: fErr } = await insforge.database
          .from('foods')
          .insert([
            {
              restaurant_id: currentRestaurant.id,
              category_id: data.category_id,
              name: data.name,
              description: data.description || null,
              image_url: data.image_url,
              veg_type: data.veg_type,
              prep_time_minutes: data.prep_time_minutes,
              base_price: data.base_price,
              discount_price: data.discount_price,
              available: data.available,
              status: 'active',
            },
          ])
          .select()
          .single();

        if (fErr) throw new Error(fErr.message);

        // Insert variants
        if (newFood && data.variants.length > 0) {
          const variantRows = data.variants.map((v) => ({
            food_id: newFood.id,
            name: v.name.trim(),
            price: parseFloat(v.price) || 0,
            available: v.available,
          }));
          await insforge.database.from('food_variants').insert(variantRows);
        }

        showToast(`New dish "${data.name}" added to menu.`);
      }

      setShowFoodModal(false);
      loadRestaurantData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save menu item.');
    } finally {
      setIsSubmittingFood(false);
    }
  };

  // Handle Delete Food
  const handleDeleteFood = (food: FoodWithVariants) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete "${food.name}"`,
      message: 'Are you sure you want to permanently remove this dish from your menu? This action cannot be undone.',
      confirmLabel: 'Delete Dish',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await insforge.database.from('foods').delete().eq('id', food.id);
          if (error) throw new Error(error.message);
          showToast(`"${food.name}" removed from your menu.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (currentRestaurant?.id) loadRestaurantData(currentRestaurant.id);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete dish.');
        }
      },
    });
  };

  // Handle Save Category
  const handleSaveCategory = async (payload: { name: string; description: string; sort_order: number }) => {
    if (!currentRestaurant) return;
    setIsSubmittingCategory(true);
    try {
      const { error } = await insforge.database.from('categories').insert([
        {
          restaurant_id: currentRestaurant.id,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          sort_order: payload.sort_order,
        },
      ]);

      if (error) throw new Error(error.message);

      showToast(`Category "${payload.name}" created successfully.`);
      setShowCategoryModal(false);
      loadRestaurantData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save category.');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Filtered Food Items for "YOUR MENU ITEMS" section
  const displayedFoods = useMemo(() => {
    let result = [...foods];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.category?.name?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeCategoryFilter !== 'all') {
      result = result.filter((f) => f.category_id === activeCategoryFilter);
    }

    return result;
  }, [foods, searchQuery, activeCategoryFilter]);

  // Format Lowest Price for a Dish Card
  const getDisplayPrice = (food: FoodWithVariants) => {
    if (food.variants && food.variants.length > 0) {
      const prices = food.variants.map((v) => Number(v.price)).filter((p) => !isNaN(p));
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
      }
    }
    if (food.base_price !== null && food.base_price !== undefined) {
      return formatCurrency(Number(food.base_price));
    }
    return 'Portion on request';
  };

  // Dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  // Formatted current date string
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Profile completion calculation
  const profileCompletion = useMemo(() => {
    if (!currentRestaurant) return 0;
    let score = 0;
    if (currentRestaurant.name) score += 20;
    if (currentRestaurant.address && currentRestaurant.area) score += 20;
    if (currentRestaurant.phone) score += 20;
    if (currentRestaurant.cover_url || currentRestaurant.logo_url) score += 20;
    if (foods.length > 0) score += 20;
    return score;
  }, [currentRestaurant, foods.length]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex font-sans antialiased selection:bg-amber-400/30">
      {/* 1. Left Fixed Dark Sidebar */}
      <OwnerSidebar
        restaurants={restaurants}
        currentRestaurant={currentRestaurant}
        onSelectRestaurant={(res) => setSelectedRestaurantId(res.id)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenInquiriesModal={() => setShowInquiriesModal(true)}
        inquiryCount={stats.inquiryCount}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-w-0">
        {/* 2. Top Header Navigation Bar */}
        <OwnerTopHeader
          currentRestaurant={currentRestaurant}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          staleCount={stats.staleCount}
          reviewCount={stats.reviewRecommendedCount}
        />

        {/* Floating Notification Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#120E0C] text-cream-100 border border-amber-400/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="font-semibold text-rose-600 hover:text-rose-900 underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
                Loading kitchen operations...
              </p>
            </div>
          ) : restaurants.length === 0 ? (
            /* Empty State: No Restaurant Registered */
            <div className="p-12 sm:p-16 rounded-3xl bg-white border border-[#EBE6DF] text-center max-w-2xl mx-auto shadow-sm space-y-4 my-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                <Store className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h2 className="font-serif text-2xl text-slate-900 font-normal">
                Register Your Kitchen on ManuMania
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-md mx-auto leading-relaxed">
                Connect your Kolkata restaurant with food lovers across the city. Publish transparent dine-in menus with zero platform commissions.
              </p>
              <div className="pt-2">
                <Link
                  to="/owner/restaurant/new"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#0A0807] font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-amber-400/25 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Register Kitchen Profile</span>
                </Link>
              </div>
            </div>
          ) : currentRestaurant ? (
            <>
              {/* ===================================================================
                  3. WELCOME BANNER (Cinematic Dark Showcase Banner)
                  =================================================================== */}
              <div className="relative rounded-3xl overflow-hidden bg-[#120E0C] text-cream-100 border border-cream-200/10 shadow-xl group">
                {/* Background Ambient Glow & Texture */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-l from-black/80 via-transparent to-transparent pointer-events-none z-10 hidden md:block" />

                {/* Right Side Visual Food Composition */}
                <div className="absolute top-0 right-0 bottom-0 w-full md:w-5/12 overflow-hidden opacity-35 md:opacity-85 pointer-events-none">
                  <img
                    src={currentRestaurant.cover_url || '/images/shops/storefront-1.jpg'}
                    alt={currentRestaurant.name}
                    className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out brightness-[0.75] contrast-[1.1]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#120E0C] via-[#120E0C]/80 to-transparent" />
                </div>

                {/* Banner Content */}
                <div className="relative z-20 p-6 sm:p-8 lg:p-10 max-w-2xl">
                  {/* Top Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-3 sm:mb-4">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/50 border border-cream-200/15 text-[10px] font-mono uppercase tracking-wider text-cream-200/80 backdrop-blur-md">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{formattedDate}</span>
                    </span>

                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider backdrop-blur-md border ${
                        currentRestaurant.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          currentRestaurant.status === 'approved'
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span>
                        {currentRestaurant.status === 'approved' ? 'Verified & Live' : 'Pending Verification'}
                      </span>
                    </span>

                    {currentRestaurant.area && (
                      <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-mono text-amber-300/80">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{currentRestaurant.area}, Kolkata</span>
                      </span>
                    )}
                  </div>

                  {/* Dynamic Headline */}
                  <div className="space-y-1 mb-3">
                    <span className="font-serif italic text-base sm:text-lg text-amber-300/90 block">
                      {greeting}
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] text-cream-100 font-light tracking-tight leading-tight">
                      {currentRestaurant.name}!
                    </h1>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-cream-200/75 leading-relaxed max-w-lg mb-6">
                    Manage your menu, update real portion prices, and connect directly with food lovers across Kolkata with zero commission.
                  </p>

                  {/* Banner Quick CTAs */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFood(null);
                        setShowFoodModal(true);
                      }}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#0A0807] font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-amber-400/25 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add New Dish</span>
                    </button>

                    <Link
                      to={`/owner/menu?restaurantId=${currentRestaurant.id}`}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-cream-100 border border-cream-200/20 font-sans font-semibold text-xs uppercase tracking-wider transition-all"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-300" />
                      <span>Full Menu Manager</span>
                    </Link>

                    {currentRestaurant.slug && currentRestaurant.status === 'approved' && (
                      <Link
                        to={`/restaurant/${currentRestaurant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-cream-200/70 hover:text-amber-300 text-xs font-sans transition-colors"
                      >
                        <span>View Public Listing</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* ===================================================================
                  4. DASHBOARD STATISTICS (4 Clean Metric Cards)
                  =================================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Stat 1: Total Menu Items */}
                <div className="bg-white border border-[#EBE6DF] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Total Menu Items
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 text-amber-800 flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-serif text-3xl font-normal text-slate-900">
                      {stats.foodCount}
                    </span>
                    <span className="text-xs font-sans font-medium text-emerald-600">
                      {stats.activeFoodCount} active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    Dishes catalogued in your live kitchen menu
                  </p>
                </div>

                {/* Stat 2: Categories */}
                <div className="bg-white border border-[#EBE6DF] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Categories
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-serif text-3xl font-normal text-slate-900">
                      {stats.categoryCount}
                    </span>
                    <span className="text-xs font-sans font-medium text-slate-500">
                      sections
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    Organized food territories in your menu
                  </p>
                </div>

                {/* Stat 3: Menu Views / Live Status */}
                <div className="bg-white border border-[#EBE6DF] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Public Visibility
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-serif text-2xl font-normal text-emerald-700">
                      {currentRestaurant.status === 'approved' ? 'Directory Live' : 'Under Review'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    {currentRestaurant.status === 'approved'
                      ? 'Accessible to diners across Kolkata'
                      : 'Pending administrator approval'}
                  </p>
                </div>

                {/* Stat 4: Customer Inquiries */}
                <div
                  onClick={() => setShowInquiriesModal(true)}
                  className="bg-white border border-[#EBE6DF] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-400/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-semibold group-hover:text-amber-800 transition-colors">
                      Customer Inquiries
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-800 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-serif text-3xl font-normal text-slate-900">
                      {stats.inquiryCount}
                    </span>
                    <span className="text-xs font-sans text-slate-400">
                      {stats.inquiryCount === 0 ? 'No alerts' : 'inquiries'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    Customer feedback &amp; dish price reports
                  </p>
                </div>
              </div>

              {/* ===================================================================
                  5. TWO-COLUMN MAIN CONTENT (Left: Menus + Freshness; Right: Profile)
                  =================================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                {/* -------------------------------------------------------------
                    LEFT COLUMN: YOUR MENU ITEMS & FRESHNESS HEALTH (~65% width)
                    ------------------------------------------------------------- */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                  {/* --- SECTION: YOUR MENU ITEMS --- */}
                  <div className="bg-white border border-[#EBE6DF] rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 font-normal tracking-tight">
                          YOUR MENU ITEMS
                        </h2>
                        <p className="font-sans text-xs text-slate-500 mt-0.5">
                          Quickly manage your food items, prices and live portion availability.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFood(null);
                            setShowFoodModal(true);
                          }}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0A0807] font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add New Item</span>
                        </button>

                        <Link
                          to={`/owner/menu?restaurantId=${currentRestaurant.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-sans font-semibold text-xs uppercase tracking-wider transition-all"
                        >
                          <span>View All</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setActiveCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all whitespace-nowrap cursor-pointer ${
                          activeCategoryFilter === 'all'
                            ? 'bg-[#120E0C] text-cream-100 font-semibold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        All Items ({foods.length})
                      </button>

                      {categories.map((cat) => {
                        const countInCat = foods.filter((f) => f.category_id === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategoryFilter(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all whitespace-nowrap cursor-pointer ${
                              activeCategoryFilter === cat.id
                                ? 'bg-[#120E0C] text-cream-100 font-semibold shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                            }`}
                          >
                            <span>{cat.name}</span>
                            <span className="ml-1.5 opacity-60 text-[10px] font-mono">
                              ({countInCat})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Menu Items Grid */}
                    {displayedFoods.length === 0 ? (
                      <div className="py-12 text-center rounded-2xl bg-[#FAF8F5] border border-dashed border-[#E0DACF] p-6 space-y-3">
                        <UtensilsCrossed className="w-8 h-8 text-amber-500/60 mx-auto" />
                        <h4 className="font-serif text-base text-slate-800">
                          {searchQuery
                            ? `No dishes found matching "${searchQuery}"`
                            : 'No dishes in this category yet'}
                        </h4>
                        <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                          Add authentic signature items with prices to complete your menu.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFood(null);
                            setShowFoodModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-400 text-[#0A0807] font-semibold text-xs uppercase tracking-wider"
                        >
                          + Add First Dish
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {displayedFoods.slice(0, 8).map((food) => {
                          return (
                            <div
                              key={food.id}
                              className={`group relative rounded-2xl border bg-white p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                                food.available
                                  ? 'border-[#EBE6DF] hover:border-amber-400/50'
                                  : 'border-slate-200 bg-slate-50/70 opacity-80'
                              }`}
                            >
                              <div className="space-y-3">
                                {/* Top Row: Image Thumbnail & Badges */}
                                <div className="flex items-start space-x-3">
                                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-slate-200/70">
                                    <img
                                      src={food.image_url || '/images/menu/thali.jpg'}
                                      alt={food.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.src = '/images/menu/thali.jpg';
                                      }}
                                    />
                                    {!food.available && (
                                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center text-[9px] font-mono text-white font-bold uppercase tracking-wider text-center p-0.5">
                                        Sold Out
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <DietaryBadge type={food.veg_type} size="sm" />
                                      {food.category?.name && (
                                        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full truncate">
                                          {food.category.name}
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="font-sans font-bold text-sm text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                                      {food.name}
                                    </h3>
                                    <span className="font-serif text-sm font-semibold text-amber-700 block mt-0.5">
                                      {getDisplayPrice(food)}
                                    </span>
                                  </div>
                                </div>

                                {food.description && (
                                  <p className="text-xs text-slate-500 font-sans line-clamp-2 leading-relaxed">
                                    {food.description}
                                  </p>
                                )}
                              </div>

                              {/* Bottom Controls Row: Availability Switcher & Actions */}
                              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                {/* Availability Live Toggle */}
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleAvailability(e, food)}
                                  className="flex items-center space-x-2 text-[11px] font-sans font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                                  title="Click to toggle available / sold out"
                                >
                                  <span
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                                      food.available ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                        food.available ? 'translate-x-4' : 'translate-x-1'
                                      }`}
                                    />
                                  </span>
                                  <span className={food.available ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                                    {food.available ? 'Available' : 'Unavailable'}
                                  </span>
                                </button>

                                {/* Edit & Options Actions */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingFood(food);
                                      setShowFoodModal(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                                    title="Edit Dish Details"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFood(food)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete Dish"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* View All Disher Footer Callout */}
                    {foods.length > 8 && (
                      <div className="pt-2 text-center">
                        <Link
                          to={`/owner/menu?restaurantId=${currentRestaurant.id}`}
                          className="inline-flex items-center space-x-1.5 text-xs font-sans font-semibold text-amber-800 hover:text-amber-900 hover:underline"
                        >
                          <span>View all {foods.length} items in Menu Management</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* --- SECTION: MENU FRESHNESS & ACCURACY HEALTH --- */}
                  <div className="bg-white border border-[#EBE6DF] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-serif text-lg text-slate-900 font-normal flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Menu Freshness &amp; Price Accuracy</span>
                        </h3>
                        <p className="font-sans text-xs text-slate-500 mt-0.5">
                          Calculated directly from actual database price revision timestamps.
                        </p>
                      </div>

                      <span className="font-mono text-[11px] text-slate-500">
                        Last revision: {formatDateTime(stats.lastUpdate)}
                      </span>
                    </div>

                    {/* 4 Freshness Health Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Fresh (0-30 days) */}
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-800 block mb-0.5">
                          Fresh (0–30 Days)
                        </span>
                        <span className="font-serif text-2xl font-bold text-emerald-900 block">
                          {stats.freshCount}
                        </span>
                        <span className="text-[11px] text-emerald-700/90 mt-0.5 block">
                          Recently verified
                        </span>
                      </div>

                      {/* Review Recommended (31-60 days) */}
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-800 block mb-0.5">
                          Review (31–60 Days)
                        </span>
                        <span className="font-serif text-2xl font-bold text-amber-900 block">
                          {stats.reviewRecommendedCount}
                        </span>
                        <span className="text-[11px] text-amber-700/90 mt-0.5 block">
                          Verification advised
                        </span>
                      </div>

                      {/* Stale (>60 days) */}
                      <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-rose-800 block mb-0.5">
                          Stale (&gt;60 Days)
                        </span>
                        <span className="font-serif text-2xl font-bold text-rose-900 block">
                          {stats.staleCount}
                        </span>
                        <span className="text-[11px] text-rose-700/90 mt-0.5 block">
                          Price review needed
                        </span>
                      </div>

                      {/* Unavailable Dishes */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-600 block mb-0.5">
                          Unavailable
                        </span>
                        <span className="font-serif text-2xl font-bold text-slate-900 block">
                          {stats.unavailableCount}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Temporarily sold out
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    RIGHT COLUMN: RESTAURANT PROFILE & QUICK ACTIONS (~35% width)
                    ------------------------------------------------------------- */}
                <div className="lg:col-span-4 space-y-6">
                  {/* --- RIGHT PANEL 1: RESTAURANT PROFILE CARD --- */}
                  <div className="bg-white border border-[#EBE6DF] rounded-3xl overflow-hidden shadow-sm">
                    {/* Cover Photo Header */}
                    <div className="relative h-36 bg-[#120E0C] overflow-hidden">
                      <img
                        src={currentRestaurant.cover_url || '/images/shops/storefront-1.jpg'}
                        alt={currentRestaurant.name}
                        className="w-full h-full object-cover brightness-[0.8]"
                        onError={(e) => {
                          e.currentTarget.src = '/images/shops/storefront-1.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Status Badges on Cover */}
                      <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider backdrop-blur-md border ${
                            currentRestaurant.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {currentRestaurant.status === 'approved' ? 'Approved' : 'Pending Review'}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span>{currentRestaurant.city || 'Kolkata'}</span>
                        </span>

                        {currentRestaurant.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Verified Badge</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="font-serif text-xl font-normal text-slate-900 leading-snug">
                          {currentRestaurant.name}
                        </h3>
                        {currentRestaurant.description && (
                          <p className="font-sans text-xs text-slate-500 mt-1 line-clamp-2">
                            {currentRestaurant.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 font-sans border-y border-slate-100 py-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">
                            {currentRestaurant.address ? `${currentRestaurant.address}, ` : ''}
                            {currentRestaurant.area ? `${currentRestaurant.area}, ` : ''}
                            {currentRestaurant.city || 'Kolkata'}
                          </span>
                        </div>

                        {currentRestaurant.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{currentRestaurant.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Profile Completion Checklist */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-sans font-semibold text-slate-700">Profile Readiness</span>
                          <span className="font-mono text-amber-700 font-bold">{profileCompletion}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                            style={{ width: `${profileCompletion}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-sans text-slate-500 pt-1">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Name &amp; Phone
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Kitchen Menu
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cover Photo
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Storefront Address
                          </span>
                        </div>
                      </div>

                      {/* Edit Profile Action Button */}
                      <Link
                        to={`/owner/restaurant?id=${currentRestaurant.id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/50 text-slate-800 font-sans font-semibold text-xs uppercase tracking-wider transition-all shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5 mr-2 text-slate-500" />
                        <span>Edit Restaurant Profile</span>
                      </Link>
                    </div>
                  </div>

                  {/* --- RIGHT PANEL 2: QUICK ACTIONS --- */}
                  <div className="bg-white border border-[#EBE6DF] rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5">
                    <h3 className="font-serif text-lg font-normal text-slate-900 tracking-tight">
                      Quick Actions
                    </h3>

                    <div className="space-y-2">
                      <Link
                        to={`/owner/menu?restaurantId=${currentRestaurant.id}`}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-amber-50/70 border border-[#EBE6DF] text-xs font-sans font-medium text-slate-800 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                          <span>Manage Menu Items</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-amber-50/70 border border-[#EBE6DF] text-xs font-sans font-medium text-slate-800 transition-colors group text-left cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Layers className="w-4 h-4 text-amber-700" />
                          <span>Add / Manage Categories</span>
                        </div>
                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-amber-800 transition-colors" />
                      </button>

                      <Link
                        to={`/owner/restaurant?id=${currentRestaurant.id}`}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-amber-50/70 border border-[#EBE6DF] text-xs font-sans font-medium text-slate-800 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <Store className="w-4 h-4 text-amber-700" />
                          <span>Update Operating Hours</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <Link
                        to={`/owner/restaurant?id=${currentRestaurant.id}#media`}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-amber-50/70 border border-[#EBE6DF] text-xs font-sans font-medium text-slate-800 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <ImageIcon className="w-4 h-4 text-amber-700" />
                          <span>Upload Kitchen Photos</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {currentRestaurant.slug && currentRestaurant.status === 'approved' && (
                        <Link
                          to={`/restaurant/${currentRestaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-sans font-semibold text-amber-900 transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <ExternalLink className="w-4 h-4 text-amber-700" />
                            <span>Preview Public Menu</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>

      {/* ===================================================================
          MODALS & DIALOGS
          =================================================================== */}
      {/* 1. Food Editor Modal (Add/Edit Dishes directly from Dashboard) */}
      <FoodEditorModal
        isOpen={showFoodModal}
        food={editingFood}
        categories={categories}
        addons={addons}
        defaultCategoryId={activeCategoryFilter !== 'all' ? activeCategoryFilter : categories[0]?.id}
        isSubmitting={isSubmittingFood}
        onClose={() => setShowFoodModal(false)}
        onSave={handleSaveFood}
      />

      {/* 2. Category Modal (Add Categories directly from Dashboard) */}
      <CategoryModal
        isOpen={showCategoryModal}
        category={null}
        currentCount={categories.length}
        isSubmitting={isSubmittingCategory}
        onClose={() => setShowCategoryModal(false)}
        onSave={handleSaveCategory}
      />

      {/* 3. Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 4. Customer Inquiries & Feedback Modal */}
      {showInquiriesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif text-xl text-slate-900 font-normal">
                  Customer Inquiries &amp; Reports
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInquiriesModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                &times;
              </button>
            </div>

            {inquiriesList.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-serif text-base text-slate-800">No Inquiries or Price Discrepancies</h4>
                <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                  Diners can report price changes or send inquiries directly from your public menu page. Everything is clean!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {inquiriesList.map((inq) => (
                  <div key={inq.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-amber-800 uppercase font-semibold">
                        {inq.report_type || 'General Inquiry'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatDateTime(inq.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-700 font-sans">{inq.details}</p>
                    {inq.reporter_email && (
                      <span className="text-[10px] text-slate-400 block">
                        Contact: {inq.reporter_email}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowInquiriesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-sans text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
