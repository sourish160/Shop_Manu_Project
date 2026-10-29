import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Utensils, Store, Sparkles, CheckCircle2 } from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { ChapterSection } from './ChapterSection';
import { EditorialHeading } from './EditorialHeading';
import { ScrollReveal } from './ScrollReveal';
import { resolveMenuItemImage, MENU_IMAGE_MAP } from './menuAssets';

export interface FoodWithRelations {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  veg_type: 'veg' | 'non_veg';
  status: string;
  image_url?: string | null;
  category?: { id?: string; name?: string } | null;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    area?: string | null;
    city?: string | null;
    verified?: boolean;
    address?: string | null;
  } | null;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    available?: boolean;
  }>;
}

export const ChapterMenuSection: React.FC = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<FoodWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Fetch real menu items from InsForge backend
  useEffect(() => {
    let isMounted = true;
    async function loadMenuData() {
      setIsLoading(true);
      try {
        const { data, error } = await insforge.database
          .from('foods')
          .select(`
            id, name, slug, description, veg_type, status, image_url,
            category:categories(id, name),
            restaurant:restaurants(id, name, slug, area, city, verified, address),
            variants:food_variants(id, name, price, available)
          `)
          .eq('status', 'active')
          .limit(24);

        if (error) {
          console.error('Error fetching Chapter III menu items:', error);
        } else if (data && isMounted) {
          setFoods(data as unknown as FoodWithRelations[]);
        }
      } catch (err) {
        console.error('Exception fetching Chapter III menu items:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMenuData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter tabs definition
  const filterTabs = [
    { id: 'all', label: 'All Offerings' },
    { id: 'biryani', label: 'Biryani & Rice' },
    { id: 'thalis', label: 'Thalis & Curries' },
    { id: 'rolls', label: 'Rolls & Street Bites' },
    { id: 'kebabs', label: 'Tandoor & Kebabs' },
    { id: 'sweets', label: 'Desserts & Sips' },
  ];

  // Client-side filtering for fast, responsive browsing
  const filteredFoods = useMemo(() => {
    if (activeFilter === 'all') return foods;

    return foods.filter((item) => {
      const text = `${item.name} ${item.category?.name || ''} ${item.description || ''}`.toLowerCase();
      switch (activeFilter) {
        case 'biryani':
          return text.includes('biryani') || text.includes('rice') || text.includes('dum');
        case 'thalis':
          return (
            text.includes('thali') ||
            text.includes('curry') ||
            text.includes('gravy') ||
            text.includes('masala') ||
            text.includes('dal') ||
            text.includes('dosa') ||
            text.includes('meal')
          );
        case 'rolls':
          return (
            text.includes('roll') ||
            text.includes('kathi') ||
            text.includes('snack') ||
            text.includes('puchka') ||
            text.includes('fry') ||
            text.includes('cutlet')
          );
        case 'kebabs':
          return (
            text.includes('kebab') ||
            text.includes('reshmi') ||
            text.includes('tandoor') ||
            text.includes('chaap') ||
            text.includes('boti')
          );
        case 'sweets':
          return (
            text.includes('sweet') ||
            text.includes('firni') ||
            text.includes('dessert') ||
            text.includes('pak') ||
            text.includes('coffee') ||
            text.includes('chai') ||
            text.includes('tea')
          );
        default:
          return true;
      }
    });
  }, [foods, activeFilter]);

  // Featured hero item and subsequent tasting items
  const featuredItem = filteredFoods[0] || null;
  const tastingFlight = filteredFoods.slice(1, 4);
  const secondaryItems = filteredFoods.slice(4, 10);

  // Helper to format lowest price
  const getLowestPrice = (item: FoodWithRelations) => {
    if (!item.variants || item.variants.length === 0) return null;
    return Math.min(...item.variants.map((v) => v.price));
  };

  return (
    <ChapterSection
      id="chapter-menu"
      chapterNumber="III"
      chapterLabel="Explore The Menus"
      scrimIntensity="deep"
      layout="full"
      className="py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =====================================================================
            CHAPTER III HEADER
            ===================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 gap-6">
          <ScrollReveal direction="up" delay={0.04}>
            <EditorialHeading
              chapterNumber="III"
              eyebrow="Explore The Menus"
              title="EXPLORE THE *MENUS*"
              subtitle="Real dishes pulled live from registered kitchens across Kolkata. Transparent portion breakdowns, chef-direct pricing, and zero platform markups."
              size="lg"
              className="max-w-3xl"
            />
          </ScrollReveal>

          {/* Quick status counter badge */}
          <ScrollReveal direction="up" delay={0.08} className="lg:mb-2 shrink-0">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#120E0C]/90 border border-cream-200/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream-200/80">
                {foods.length > 0 ? `${foods.length} Dishes Indexed` : 'Live Menu Catalog'}
              </span>
              <span className="text-cream-200/30" aria-hidden="true">|</span>
              <span className="font-mono text-[10px] tracking-wider text-amber-300">
                Zero Markups
              </span>
            </div>
          </ScrollReveal>
        </div>

        {/* =====================================================================
            THREE TRANSPARENCY PILLARS (Restrained Editorial Band)
            ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-16">
          {[
            {
              num: '01',
              title: 'Portion Breakdown',
              desc: 'Half, Full, Regular, or Special. View authentic portion weights and variant pricing so you always know what is placed on your table.',
            },
            {
              num: '02',
              title: 'Chef-Direct Rates',
              desc: 'Menus are updated in real time by restaurant owners. No surprise fees, no hidden platform markups at checkout.',
            },
            {
              num: '03',
              title: 'Live Kitchen Status',
              desc: 'Know if the kitchen is serving right now. Operating hours indicators are computed from genuine weekly owner schedules.',
            },
          ].map((pillar, i) => (
            <ScrollReveal key={pillar.num} direction="up" delay={0.06 + i * 0.05}>
              <div className="editorial-card p-6 sm:p-7 rounded-2xl h-full border border-cream-200/10 hover:border-amber-400/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-amber-400 font-semibold tracking-wider">
                    {pillar.num} · Clarity
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-amber-400/60" aria-hidden="true" />
                </div>
                <h4 className="font-serif text-lg sm:text-xl text-cream-100 font-light mb-2">
                  {pillar.title}
                </h4>
                <p className="text-xs text-cream-200/65 font-sans leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* =====================================================================
            FILTER TABS FOR FAST, PRACTICAL BROWSING
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.1} className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between pb-4 border-b border-cream-200/10 gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0" role="tablist" aria-label="Menu categories">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-[#0A0807] font-bold shadow-md shadow-amber-400/20'
                        : 'bg-[#120E0C]/80 text-cream-200/70 hover:text-cream-100 hover:bg-cream-200/10 border border-cream-200/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-mono text-cream-200/50 uppercase tracking-widest hidden md:inline shrink-0">
              Showing {filteredFoods.length} items
            </span>
          </div>
        </ScrollReveal>

        {/* =====================================================================
            LOADING STATE
            ===================================================================== */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-pulse">
            <div className="lg:col-span-7 h-[460px] rounded-2xl bg-cream-100/5 border border-cream-200/10" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-[140px] rounded-2xl bg-cream-100/5 border border-cream-200/10" />
              <div className="h-[140px] rounded-2xl bg-cream-100/5 border border-cream-200/10" />
              <div className="h-[140px] rounded-2xl bg-cream-100/5 border border-cream-200/10" />
            </div>
          </div>
        ) : filteredFoods.length === 0 ? (
          /* Empty state for filter */
          <div className="editorial-card p-12 text-center rounded-2xl border border-cream-200/10 my-8">
            <Utensils className="w-10 h-10 text-amber-400/50 mx-auto mb-4" />
            <h4 className="font-serif text-2xl text-cream-100 mb-2">No dishes in this category yet</h4>
            <p className="text-xs text-cream-200/60 font-sans max-w-md mx-auto mb-6">
              Our registered Kolkata kitchens are constantly expanding their digital menus. Try viewing all offerings or search directly.
            </p>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="px-5 py-2 rounded-lg bg-amber-400 text-[#0A0807] font-semibold text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors"
            >
              Reset to All Offerings
            </button>
          </div>
        ) : (
          <>
            {/* =====================================================================
                TIER 1: ASYMMETRIC CHEF'S SHOWCASE (Featured Lead + Tasting Flight)
                ===================================================================== */}
            {featuredItem && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-10 items-stretch">
                {/* Hero Lead Feature Card (7 cols) */}
                <ScrollReveal direction="up" delay={0.08} className="lg:col-span-7 flex">
                  <div className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between p-6 sm:p-8 min-h-[480px]">
                    {/* Background Photographic Atmosphere */}
                    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                      <img
                        src={resolveMenuItemImage(featuredItem)}
                        alt={featuredItem.name}
                        className="w-full h-full object-cover brightness-[0.8] contrast-[1.1] saturate-[1.08] group-hover:brightness-[0.9] group-hover:scale-105 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src = MENU_IMAGE_MAP.default;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/65 via-50% to-[#0A0807]/25 transition-opacity duration-500 group-hover:from-[#0A0807]/95" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0807]/75 via-[#0A0807]/30 to-transparent" />
                      <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    </div>

                    {/* Top Badges */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-semibold ${
                            featuredItem.veg_type === 'veg'
                              ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                              : 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                          }`}
                        >
                          {featuredItem.veg_type === 'veg' ? 'Pure Veg' : 'Non-Veg'}
                        </span>
                        {featuredItem.category && (
                          <span className="font-mono text-[10px] tracking-widest text-cream-200/80 uppercase px-2 py-0.5 rounded bg-[#0A0807]/60 backdrop-blur-md border border-cream-200/10">
                            {featuredItem.category.name}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-400/30 font-mono text-[9px] tracking-widest text-amber-300 uppercase shadow-sm backdrop-blur-md">
                        <Sparkles className="w-3 h-3 text-amber-300" aria-hidden="true" />
                        Signature Showcase
                      </span>
                    </div>

                    {/* Content & Portion Rates */}
                    <div className="relative z-10 flex flex-col space-y-4 pt-20">
                      <div>
                        {featuredItem.restaurant && (
                          <div className="flex items-center gap-2 text-xs text-cream-200/70 font-sans mb-1.5">
                            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                            <span>Crafted by</span>
                            <Link
                              to={`/restaurant/${featuredItem.restaurant.slug}`}
                              className="font-medium text-cream-100 hover:text-amber-300 transition-colors underline decoration-cream-200/30 underline-offset-4"
                            >
                              {featuredItem.restaurant.name}
                            </Link>
                            {featuredItem.restaurant.area && (
                              <span className="text-cream-200/40">· {featuredItem.restaurant.area}</span>
                            )}
                          </div>
                        )}

                        <h3 className="font-serif text-3xl sm:text-4xl text-cream-100 font-normal tracking-tight group-hover:text-amber-200 transition-colors">
                          {featuredItem.name}
                        </h3>

                        {featuredItem.description && (
                          <p className="text-xs sm:text-sm text-cream-200/80 font-sans line-clamp-2 mt-1 leading-relaxed max-w-xl">
                            {featuredItem.description}
                          </p>
                        )}
                      </div>

                      {/* Portion Breakdown Table / Tags */}
                      {featuredItem.variants && featuredItem.variants.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-cream-200/50 block mb-1.5">
                            Available Portions &amp; Direct Prices
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {featuredItem.variants.map((v) => (
                              <div
                                key={v.id}
                                className="px-3 py-1 rounded-md bg-[#0A0807]/80 border border-cream-200/15 backdrop-blur-md flex items-center gap-2"
                              >
                                <span className="font-sans text-xs text-cream-200/80">{v.name}:</span>
                                <span className="font-serif text-sm text-amber-300 font-medium">₹{v.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-cream-200/15">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-cream-200/45 block">
                            Starting from
                          </span>
                          <span className="font-serif text-2xl text-amber-300 font-normal">
                            ₹{getLowestPrice(featuredItem) ?? '—'}
                          </span>
                        </div>

                        {featuredItem.restaurant ? (
                          <Link
                            to={`/restaurant/${featuredItem.restaurant.slug}`}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A0807] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-amber-400/25 active:scale-[0.98]"
                          >
                            <span>Explore Shop Menu</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/search?q=${encodeURIComponent(featuredItem.name)}`)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A0807] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-300"
                          >
                            <span>Find in Search</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Right Stack: Tasting Flight (5 cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  {tastingFlight.map((item, idx) => (
                    <ScrollReveal key={item.id} direction="up" delay={0.12 + idx * 0.06}>
                      <div className="group relative rounded-2xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 sm:p-5 flex gap-4 items-center">
                        {/* Compact thumbnail image */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden">
                          <img
                            src={resolveMenuItemImage(item)}
                            alt={item.name}
                            className="w-full h-full object-cover brightness-[0.85] contrast-[1.08] group-hover:scale-105 transition-transform duration-500 ease-out motion-reduce:transition-none"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = MENU_IMAGE_MAP.default;
                            }}
                          />
                          <span
                            className={`absolute top-2 left-2 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-semibold ${
                              item.veg_type === 'veg'
                                ? 'text-emerald-400 bg-black/75 border border-emerald-500/30'
                                : 'text-amber-400 bg-black/75 border border-amber-500/30'
                            }`}
                          >
                            {item.veg_type === 'veg' ? 'Veg' : 'Non-Veg'}
                          </span>
                        </div>

                        {/* Text and price content */}
                        <div className="flex-1 min-w-0">
                          {item.restaurant && (
                            <Link
                              to={`/restaurant/${item.restaurant.slug}`}
                              className="text-[11px] font-sans text-cream-200/60 hover:text-amber-300 transition-colors truncate block mb-1"
                            >
                              {item.restaurant.name} {item.restaurant.area ? `· ${item.restaurant.area}` : ''}
                            </Link>
                          )}

                          <h4 className="font-serif text-lg text-cream-100 font-normal leading-snug group-hover:text-amber-200 transition-colors truncate mb-1">
                            {item.name}
                          </h4>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-cream-200/10">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-cream-200/40 block">
                                Price
                              </span>
                              <span className="font-serif text-base text-amber-300 font-medium">
                                ₹{getLowestPrice(item) ?? '—'}
                              </span>
                            </div>

                            {item.restaurant && (
                              <Link
                                to={`/restaurant/${item.restaurant.slug}`}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-cream-200/70 hover:text-amber-300 transition-colors group-hover:translate-x-0.5 duration-200"
                              >
                                <span>Menu</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            )}

            {/* =====================================================================
                TIER 2: ALTERNATING ASYMMETRIC GRID (Curated Dishes)
                ===================================================================== */}
            {secondaryItems.length > 0 && (
              <div className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream-200/60">
                    Additional Indexed Kitchen Dishes
                  </span>
                  <div className="h-px bg-cream-200/10 flex-1 max-w-xs ml-4 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {secondaryItems.map((item, index) => {
                    const lowest = getLowestPrice(item);
                    return (
                      <ScrollReveal
                        key={item.id}
                        direction="up"
                        delay={0.06 * (index % 3)}
                      >
                        <div className="group relative rounded-2xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
                          {/* Image Banner */}
                          <div className="relative h-44 overflow-hidden">
                            <img
                              src={resolveMenuItemImage(item)}
                              alt={item.name}
                              className="w-full h-full object-cover brightness-[0.85] contrast-[1.08] group-hover:scale-105 transition-transform duration-500 ease-out motion-reduce:transition-none"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.src = MENU_IMAGE_MAP.default;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#120E0C] via-transparent to-transparent" />

                            {/* Veg / Non-veg indicator */}
                            <span
                              className={`absolute top-3 left-3 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-semibold backdrop-blur-md ${
                                item.veg_type === 'veg'
                                  ? 'text-emerald-400 bg-black/75 border border-emerald-500/30'
                                  : 'text-amber-400 bg-black/75 border border-amber-500/30'
                              }`}
                            >
                              {item.veg_type === 'veg' ? 'Pure Veg' : 'Non-Veg'}
                            </span>

                            {item.category && (
                              <span className="absolute top-3 right-3 text-[9px] font-mono uppercase tracking-wider text-cream-200/80 bg-black/75 backdrop-blur-md border border-cream-200/15 px-2 py-0.5 rounded">
                                {item.category.name}
                              </span>
                            )}
                          </div>

                          {/* Body Details */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-serif text-xl text-cream-100 font-normal group-hover:text-amber-200 transition-colors mb-1">
                                {item.name}
                              </h4>

                              {item.restaurant && (
                                <Link
                                  to={`/restaurant/${item.restaurant.slug}`}
                                  className="text-xs text-cream-200/60 hover:text-amber-300 transition-colors block mb-2 font-sans truncate"
                                >
                                  at {item.restaurant.name} {item.restaurant.area ? `(${item.restaurant.area})` : ''}
                                </Link>
                              )}

                              {item.description && (
                                <p className="text-xs text-cream-200/65 font-sans line-clamp-2 leading-relaxed mb-3">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Variants & Action */}
                            <div>
                              {item.variants && item.variants.length > 1 && (
                                <div className="flex flex-wrap gap-1.5 mb-3 pt-2 border-t border-cream-200/10">
                                  {item.variants.map((v) => (
                                    <span
                                      key={v.id}
                                      className="text-[10px] font-mono text-cream-200/70 bg-cream-100/5 px-2 py-0.5 rounded border border-cream-200/10"
                                    >
                                      {v.name}: ₹{v.price}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-3 border-t border-cream-200/10">
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider text-cream-200/40 block">
                                    Starting at
                                  </span>
                                  <span className="font-serif text-lg text-amber-300 font-medium">
                                    {lowest !== null ? `₹${lowest}` : 'Market Price'}
                                  </span>
                                </div>

                                {item.restaurant && (
                                  <Link
                                    to={`/restaurant/${item.restaurant.slug}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] text-cream-200/90 text-xs font-sans font-medium uppercase tracking-wider transition-colors duration-200"
                                  >
                                    <span>View Shop</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* =====================================================================
            CHAPTER III FOOTER / EXPLORATION CALL-TO-ACTION
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.1} className="mt-14 sm:mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#120E0C]/90 border border-cream-200/10 max-w-2xl mx-auto w-full backdrop-blur-md">
            <div className="text-left">
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-0.5">
                Looking for a specific dish or neighborhood?
              </span>
              <p className="text-xs text-cream-200/80 font-sans">
                Search all verified menu items, portion comparisons &amp; live hours.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/search')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A0807] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-200 shrink-0 shadow-lg hover:shadow-amber-400/25 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Full Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </ChapterSection>
  );
};
