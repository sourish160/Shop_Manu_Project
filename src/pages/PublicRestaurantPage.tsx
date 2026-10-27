import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  insforge,
  Restaurant,
  Category,
  Food,
  FoodVariant,
  FoodAddon,
  Combo,
  ComboItem,
  RestaurantHours,
} from '../lib/insforge';
import { RestaurantHeader } from '../components/public/RestaurantHeader';
import { CategoryNav } from '../components/public/CategoryNav';
import { MenuSection } from '../components/public/MenuSection';
import { LocationSection } from '../components/public/LocationSection';
import { ReportModal } from '../components/public/ReportModal';
import { useSEO } from '../hooks/useSEO';
import { generateRestaurantSchema } from '../utils/schemaGenerator';
import { Loader2, Store, AlertCircle, ArrowLeft } from 'lucide-react';
import { sanitizeErrorMessage } from '../utils/errorHandler';

export const PublicRestaurantPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [hours, setHours] = useState<RestaurantHours[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetFood, setReportTargetFood] = useState<Food | null>(null);

  // Fetch all public restaurant data in single parallel batch
  const loadRestaurantData = useCallback(async () => {
    if (!slug) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      // 1. Fetch approved restaurant by slug - select ONLY public columns, omitting owner_id and admin_notes
      const { data: resData, error: resError } = await insforge.database
        .from('restaurants')
        .select('id, name, slug, description, phone, address, area, city, latitude, longitude, status, verified, logo_url, cover_url, created_at, updated_at')
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (resError) {
        throw new Error(resError.message);
      }

      if (!resData) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      const currentRes = resData as Restaurant;
      setRestaurant(currentRes);

      // 2. Fetch categories, foods, combos, and hours in parallel
      const [catRes, foodRes, hoursRes, combosRes] = await Promise.all([
        insforge.database
          .from('categories')
          .select('id, restaurant_id, name, description, sort_order, created_at, updated_at')
          .eq('restaurant_id', currentRes.id)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),

        insforge.database
          .from('foods')
          .select('id, restaurant_id, category_id, name, slug, description, image_url, veg_type, available, status, prep_time_minutes, base_price, discount_price, created_at, updated_at')
          .eq('restaurant_id', currentRes.id)
          .eq('status', 'active')
          .order('name', { ascending: true }),

        insforge.database
          .from('restaurant_hours')
          .select('id, restaurant_id, day_of_week, open_time, close_time, is_closed')
          .eq('restaurant_id', currentRes.id)
          .order('day_of_week', { ascending: true }),

        insforge.database
          .from('combos')
          .select('*')
          .eq('restaurant_id', currentRes.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
      ]);

      if (catRes.error) throw new Error(catRes.error.message);
      if (foodRes.error) throw new Error(foodRes.error.message);

      const loadedCats = (catRes.data || []) as Category[];
      const loadedFoods = (foodRes.data || []) as Food[];
      const loadedHours = (hoursRes.data || []) as RestaurantHours[];
      const loadedCombos = (combosRes.data || []) as Combo[];

      // 3. Fetch variants and add-ons for foods
      if (loadedFoods.length > 0) {
        const foodIds = loadedFoods.map((f) => f.id);
        const [variantsRes, addonsRes, mappingRes] = await Promise.all([
          insforge.database
            .from('food_variants')
            .select('id, food_id, name, price, available, created_at, updated_at')
            .in('food_id', foodIds)
            .order('price', { ascending: true }),

          insforge.database
            .from('food_addons')
            .select('*')
            .eq('restaurant_id', currentRes.id)
            .eq('available', true),

          insforge.database
            .from('food_to_addons')
            .select('*')
            .in('food_id', foodIds),
        ]);

        const variantsByFoodId = new Map<string, FoodVariant[]>();
        ((variantsRes.data || []) as FoodVariant[]).forEach((v) => {
          const list = variantsByFoodId.get(v.food_id) || [];
          list.push(v);
          variantsByFoodId.set(v.food_id, list);
        });

        const addonsById = new Map<string, FoodAddon>();
        ((addonsRes.data || []) as FoodAddon[]).forEach((a) => {
          addonsById.set(a.id, a);
        });

        const addonIdsByFoodId = new Map<string, string[]>();
        ((mappingRes.data || []) as { food_id: string; addon_id: string }[]).forEach((m) => {
          const list = addonIdsByFoodId.get(m.food_id) || [];
          list.push(m.addon_id);
          addonIdsByFoodId.set(m.food_id, list);
        });

        loadedFoods.forEach((food) => {
          food.variants = variantsByFoodId.get(food.id) || [];
          const adIds = addonIdsByFoodId.get(food.id) || [];
          food.addons = adIds.map((id) => addonsById.get(id)!).filter(Boolean);
        });
      }

      // 4. Fetch combo items for combos
      if (loadedCombos.length > 0) {
        const comboIds = loadedCombos.map((c) => c.id);
        const { data: comboItemsData, error: ciError } = await insforge.database
          .from('combo_items')
          .select('*, food:foods(id, name, image_url, veg_type)')
          .in('combo_id', comboIds);

        if (!ciError && comboItemsData) {
          const itemsByCombo = new Map<string, ComboItem[]>();
          (comboItemsData as ComboItem[]).forEach((item) => {
            const list = itemsByCombo.get(item.combo_id) || [];
            list.push(item);
            itemsByCombo.set(item.combo_id, list);
          });
          loadedCombos.forEach((c) => {
            c.items = itemsByCombo.get(c.id) || [];
          });
        }
      }

      setCategories(loadedCats);
      setFoods(loadedFoods);
      setHours(loadedHours);
      setCombos(loadedCombos);

      if (loadedCats.length > 0) {
        setActiveCategoryId(loadedCats[0].id);
      }
    } catch (err: unknown) {
      console.error('Failed to load restaurant data:', err);
      setErrorMessage(sanitizeErrorMessage(err, 'Unable to load menu. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadRestaurantData();
  }, [loadRestaurantData]);

  // SEO & Structured Schema
  const seoOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';
  const canonicalUrl = `${seoOrigin}/restaurant/${slug}`;
  const seoTitle = restaurant ? `${restaurant.name} - Digital Menu & Prices` : 'Food Menu';
  const seoDesc = restaurant
    ? `Explore the complete, verified digital menu and prices for ${restaurant.name} at ${restaurant.address}.`
    : 'View food menus, dish prices, and operating hours.';

  const jsonLdSchema = restaurant ? generateRestaurantSchema(restaurant, hours) : null;

  useSEO({
    title: seoTitle,
    description: seoDesc,
    canonicalUrl,
    ogImage: restaurant?.cover_url || restaurant?.logo_url,
    ogType: 'restaurant',
    jsonLd: jsonLdSchema,
  });

  // Category Intersection Observer
  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catId = entry.target.id.replace('category-', '');
            if (catId) {
              setActiveCategoryId(catId);
            }
          }
        });
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0,
      }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(`category-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToLocation = () => {
    const el = document.getElementById('restaurant-location');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenGeneralReport = () => {
    setReportTargetFood(null);
    setIsReportModalOpen(true);
  };

  const handleOpenReportDish = (food: Food) => {
    setReportTargetFood(food);
    setIsReportModalOpen(true);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#0A0807] text-cream-200">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-cream-200/50">Loading restaurant menu...</p>
      </div>
    );
  }

  // 2. 404 Not Found State
  if (isNotFound) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center my-16">
        <div className="editorial-card w-16 h-16 bg-[#14100D] border border-cream-200/15 rounded-2xl flex items-center justify-center text-amber-400 mb-5 shadow-2xl">
          <Store className="w-8 h-8 stroke-[1.2]" />
        </div>
        <h1 className="font-serif text-3xl font-normal text-cream-100 tracking-tight">
          Restaurant Not Found
        </h1>
        <p className="text-xs sm:text-sm text-cream-200/60 mt-2 leading-relaxed font-sans">
          The restaurant or food shop you are seeking does not exist or has not yet been approved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-2.5 text-xs font-sans uppercase tracking-wider font-semibold text-espresso-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-lg transition-colors shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (errorMessage || !restaurant) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center my-16">
        <div className="editorial-card w-16 h-16 bg-[#160E0B] border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mb-5 shadow-2xl">
          <AlertCircle className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h1 className="font-serif text-3xl font-normal text-cream-100 tracking-tight">
          Unable to Load Menu
        </h1>
        <p className="text-xs sm:text-sm text-cream-200/60 mt-2 leading-relaxed font-sans">
          {errorMessage || 'A network error occurred while loading this shop.'}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={loadRestaurantData}
            className="px-5 py-2.5 text-xs font-sans uppercase tracking-wider font-semibold text-espresso-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-lg transition-colors shadow-md"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 border border-cream-200/15 bg-cream-100/[0.06] hover:bg-cream-100/[0.12] text-cream-100 text-xs font-sans uppercase tracking-wider rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // 4. Main Restaurant Content
  return (
    <div className="min-h-screen bg-[#0A0807] text-cream-100 flex flex-col font-sans">
      {/* Restaurant Header */}
      <RestaurantHeader
        restaurant={restaurant}
        hours={hours}
        onScrollToLocation={handleScrollToLocation}
        onOpenReport={handleOpenGeneralReport}
      />

      {/* Sticky Category Navigation */}
      <CategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 flex-1 w-full pb-20">
        {/* Menu Section */}
        <MenuSection
          categories={categories}
          foods={foods}
          combos={combos}
          onReportDish={handleOpenReportDish}
        />

        {/* Location & Opening Hours Section */}
        <LocationSection
          restaurant={restaurant}
          hours={hours}
        />
      </main>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        foods={foods}
        preselectedFood={reportTargetFood}
      />
    </div>
  );
};
