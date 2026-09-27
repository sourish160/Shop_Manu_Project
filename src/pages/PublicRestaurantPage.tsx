import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { insforge, Restaurant, Category, Food, FoodVariant, RestaurantHours } from '../lib/insforge';
import { RestaurantHeader } from '../components/public/RestaurantHeader';
import { CategoryNav } from '../components/public/CategoryNav';
import { MenuSection } from '../components/public/MenuSection';
import { LocationSection } from '../components/public/LocationSection';
import { ReportModal } from '../components/public/ReportModal';
import { useSEO } from '../hooks/useSEO';
import { generateRestaurantSchema } from '../utils/schemaGenerator';

export const PublicRestaurantPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
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
      // 1. Fetch approved restaurant by slug
      const { data: resData, error: resError } = await insforge.database
        .from('restaurants')
        .select('*')
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

      // 2. Fetch categories, foods, variants, and hours in parallel
      const [catRes, foodRes, hoursRes] = await Promise.all([
        insforge.database
          .from('categories')
          .select('*')
          .eq('restaurant_id', currentRes.id)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),

        insforge.database
          .from('foods')
          .select('*')
          .eq('restaurant_id', currentRes.id)
          .eq('status', 'active')
          .order('name', { ascending: true }),

        insforge.database
          .from('restaurant_hours')
          .select('*')
          .eq('restaurant_id', currentRes.id)
          .order('day_of_week', { ascending: true }),
      ]);

      if (catRes.error) throw new Error(catRes.error.message);
      if (foodRes.error) throw new Error(foodRes.error.message);

      const loadedCats = (catRes.data || []) as Category[];
      const loadedFoods = (foodRes.data || []) as Food[];
      const loadedHours = (hoursRes.data || []) as RestaurantHours[];

      // 3. Fetch variants for all foods in one query
      if (loadedFoods.length > 0) {
        const foodIds = loadedFoods.map((f) => f.id);
        const { data: variantsData, error: varError } = await insforge.database
          .from('food_variants')
          .select('*')
          .in('food_id', foodIds)
          .order('price', { ascending: true });

        if (varError) throw new Error(varError.message);

        const variantsByFoodId = new Map<string, FoodVariant[]>();
        ((variantsData || []) as FoodVariant[]).forEach((v) => {
          const list = variantsByFoodId.get(v.food_id) || [];
          list.push(v);
          variantsByFoodId.set(v.food_id, list);
        });

        loadedFoods.forEach((f) => {
          f.variants = variantsByFoodId.get(f.id) || [];
        });
      }

      setCategories(loadedCats);
      setFoods(loadedFoods);
      setHours(loadedHours);

      if (loadedCats.length > 0) {
        setActiveCategoryId(loadedCats[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load restaurant data:', err);
      setErrorMessage(err.message || 'Failed to load restaurant details.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  // SEO & Schema.org Structured Data
  const locationPart = restaurant ? [restaurant.area, restaurant.city].filter(Boolean).join(', ') : '';
  const seoOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';
  const restaurantSchema = restaurant
    ? generateRestaurantSchema(restaurant, hours, categories, seoOrigin)
    : null;

  useSEO({
    title: isNotFound
      ? 'Restaurant Not Found'
      : errorMessage
      ? 'Restaurant Unavailable'
      : restaurant
      ? (locationPart ? `${restaurant.name} | ${locationPart}` : restaurant.name)
      : 'Loading Restaurant...',
    description: restaurant
      ? (restaurant.description ||
          `Explore the menu, portion prices, and dining hours for ${restaurant.name} located at ${restaurant.address}, ${locationPart}.`)
      : undefined,
    canonicalUrl: restaurant ? `${seoOrigin}/restaurant/${restaurant.slug}` : undefined,
    ogType: 'restaurant',
    ogImage: restaurant?.cover_url || restaurant?.logo_url || null,
    noIndex: isNotFound || !!errorMessage,
    jsonLd: restaurantSchema,
  });

  useEffect(() => {
    loadRestaurantData();
  }, [loadRestaurantData]);

  // Scroll to section handler
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

  const handleOpenReportDish = (food: Food) => {
    setReportTargetFood(food);
    setIsReportModalOpen(true);
  };

  const handleOpenGeneralReport = () => {
    setReportTargetFood(null);
    setIsReportModalOpen(true);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#080808] text-[#F4F2ED]">
        <div className="w-10 h-10 border-2 border-[#C5A064] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Summoning atelier catalog...</p>
      </div>
    );
  }

  // 2. 404 Not Found State (Pending, Rejected, Suspended, or Nonexistent)
  if (isNotFound) {
    return (
      <div className="min-h-[70vh] max-w-lg mx-auto px-4 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#C5A064] font-mono text-xl mb-5 shadow-2xl">
          404
        </div>
        <h1 className="font-editorial text-3xl font-light text-[#F4F2ED] tracking-tight">
          Specimen Not Located
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 mt-2 leading-relaxed">
          The atelier or kitchen you are seeking is unindexed or pending accreditation.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="forge-btn px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-[#F4F2ED] rounded-lg transition-all"
          >
            Return to Index
          </Link>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (errorMessage || !restaurant) {
    return (
      <div className="min-h-[70vh] max-w-lg mx-auto px-4 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center font-mono font-bold text-xl mb-5 shadow-2xl">
          !
        </div>
        <h1 className="font-editorial text-3xl font-light text-[#F4F2ED] tracking-tight">
          Telemetry Interrupted
        </h1>
        <p className="font-mono text-xs text-zinc-400 mt-2">
          {errorMessage || 'An unexpected telemetry interruption occurred.'}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={loadRestaurantData}
            className="forge-btn px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-[#F4F2ED] rounded-lg transition-all"
          >
            Retry Sync
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 border border-white/15 bg-white/5 hover:border-white/30 text-zinc-300 rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
          >
            Return to Index
          </Link>
        </div>
      </div>
    );
  }

  // 4. Main Restaurant Content
  return (
    <div className="min-h-screen bg-[#080808] text-[#F4F2ED] flex flex-col">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 flex-1 w-full pb-16">
        {/* Menu Section */}
        <MenuSection
          categories={categories}
          foods={foods}
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
