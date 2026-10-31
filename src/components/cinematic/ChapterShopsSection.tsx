import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, MapPin, ArrowRight, ShieldCheck, Utensils } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { insforge, RestaurantHours } from '../../lib/insforge';
import { getRestaurantOpeningStatus, OpeningStatusResult } from '../../utils/operatingHours';
import { ChapterSection } from './ChapterSection';
import { EditorialHeading } from './EditorialHeading';
import { ScrollReveal } from './ScrollReveal';
import { resolveShopImage, STOREFRONT_IMAGES } from './shopAssets';
import {
  cardEntranceVariants,
  cardImageVariants,
  cardBadgeVariants,
  cardTextVariants,
  cardTagsContainerVariants,
  cardTagItemVariants,
  cardButtonVariants,
} from './cardAnimations';

export interface ShopRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  status: string;
  verified?: boolean;
  logo_url?: string | null;
  cover_url?: string | null;
  created_at?: string;
  hours?: RestaurantHours[];
  foods?: Array<{
    id: string;
    name: string;
    veg_type?: string;
    status: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
  }>;
  openingStatus?: OpeningStatusResult;
}

export const ChapterShopsSection: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch approved registered shops from InsForge backend
  useEffect(() => {
    let isMounted = true;
    async function fetchShops() {
      setIsLoading(true);
      try {
        const { data, error } = await insforge.database
          .from('restaurants')
          .select(`
            id, name, slug, description, phone, address, area, city, status, verified, logo_url, cover_url, created_at,
            hours:restaurant_hours(day_of_week, open_time, close_time, is_closed),
            foods:foods(id, name, veg_type, status),
            categories:categories(id, name)
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(16);

        if (error) {
          console.error('Error fetching Chapter IV registered shops:', error);
        } else if (data && isMounted) {
          const transformed = (data as unknown as ShopRecord[]).map((shop) => ({
            ...shop,
            openingStatus: getRestaurantOpeningStatus(shop.hours || []),
          }));
          setShops(transformed);
        }
      } catch (err) {
        console.error('Exception fetching Chapter IV registered shops:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchShops();
    return () => {
      isMounted = false;
    };
  }, []);

  // Prominent shop feature split: First prominent shop alongside companion shops
  const prominentShop = shops[0] || null;
  const companionShops = shops.slice(1, 3);
  const secondaryShops = shops.slice(3, 9);

  return (
    <ChapterSection
      id="chapter-gallery"
      chapterNumber="IV"
      chapterLabel="Top Shops Near You"
      scrimIntensity="deep"
      layout="full"
      className="py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =====================================================================
            CHAPTER IV HEADER
            ===================================================================== */}
        <div className="mb-12 sm:mb-16">
          <ScrollReveal direction="up" delay={0.04}>
            <EditorialHeading
              chapterNumber="IV"
              eyebrow="Top Shops Near You"
              title="TOP SHOPS *NEAR YOU*"
              subtitle="Locally verified food shops, heritage dining rooms, and artisan kitchens registered on ManuMania. Authentic digital menus with zero fake reviews."
              size="lg"
              className="max-w-3xl"
            />
          </ScrollReveal>
        </div>

        {/* =====================================================================
            LOADING STATE
            ===================================================================== */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-pulse">
            <div className="lg:col-span-7 h-[460px] rounded-2xl bg-cream-100/5 border border-cream-200/10" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-[220px] rounded-2xl bg-cream-100/5 border border-cream-200/10" />
              <div className="h-[220px] rounded-2xl bg-cream-100/5 border border-cream-200/10" />
            </div>
          </div>
        ) : shops.length === 0 ? (
          /* =====================================================================
              BEAUTIFUL EMPTY STATE (When no shops are registered/approved)
              ===================================================================== */
          <div className="editorial-card p-12 sm:p-16 text-center rounded-3xl border border-cream-200/10 max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-6">
              <Store className="w-8 h-8 text-amber-400" />
            </div>
            <h4 className="font-serif text-2xl sm:text-3xl text-cream-100 font-light mb-3">
              No Registered Kitchens Yet
            </h4>
            <p className="text-xs sm:text-sm text-cream-200/70 font-sans leading-relaxed max-w-md mx-auto mb-8">
              We are constantly onboarding authentic local food spots across Kolkata. Do you operate a food kitchen or stall? Register your menu today with complete price control and zero platform commission.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-amber-400 text-[#0A0807] font-sans font-semibold text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors text-center"
              >
                Register Your Shop
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* =====================================================================
                TIER 1: PROMINENT SHOWCASE + COMPANION SHOP CARDS
                ===================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-10 items-stretch">
              {/* Prominent Showcase Card (7 cols when companions exist, 12 cols if solo) */}
              {prominentShop && (
                <motion.div
                  initial={prefersReducedMotion ? false : 'hidden'}
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={cardEntranceVariants}
                  custom={0.04}
                  className={companionShops.length > 0 ? 'lg:col-span-7 flex' : 'lg:col-span-12 flex'}
                >
                  {(() => {
                    const shopImage = resolveShopImage(prominentShop, 0);
                    const isOpen = prominentShop.openingStatus?.isOpen;
                    const statusText = prominentShop.openingStatus?.statusText;
                    const activeFoodsCount = prominentShop.foods?.filter((f) => f.status === 'active').length ?? 0;

                    return (
                      <div className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between p-6 sm:p-8 min-h-[480px]">
                        {/* Storefront Photography Background with scale 1.06 -> 1 entrance */}
                        <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                          <motion.div variants={cardImageVariants} className="w-full h-full overflow-hidden">
                            <img
                              src={shopImage.url}
                              alt={`${prominentShop.name} storefront`}
                              className="w-full h-full object-cover brightness-[0.78] contrast-[1.1] saturate-[1.08] group-hover:brightness-[0.88] group-hover:scale-[1.03] transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                              loading="eager"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.src = STOREFRONT_IMAGES[0];
                              }}
                            />
                          </motion.div>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/65 via-50% to-[#0A0807]/25 transition-opacity duration-500 group-hover:from-[#0A0807]/95" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0807]/75 via-[#0A0807]/30 to-transparent" />
                          <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        </div>

                        {/* Top Metadata Badges */}
                        <motion.div variants={cardBadgeVariants} className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {/* Live Operating Status */}
                            {isOpen !== null && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase backdrop-blur-md ${
                                  isOpen
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-black/75 text-cream-200/70 border border-cream-200/15'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOpen ? 'bg-emerald-400' : 'bg-cream-200/40'
                                  }`}
                                  aria-hidden="true"
                                />
                                {statusText || (isOpen ? 'Open Now' : 'Closed')}
                              </span>
                            )}

                            {prominentShop.verified && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] tracking-wider uppercase backdrop-blur-md">
                                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                Verified Kitchen
                              </span>
                            )}
                          </div>

                          {/* Neighborhood badge */}
                          <span className="font-mono text-[10px] tracking-widest uppercase text-cream-200/80 bg-[#0A0807]/75 border border-cream-200/15 px-3 py-1 rounded-full backdrop-blur-md">
                            {prominentShop.area || 'Kolkata'}
                          </span>
                        </motion.div>

                        {/* Bottom Information & CTA */}
                        <div className="relative z-10 flex flex-col space-y-4 pt-20">
                          <motion.div variants={cardTextVariants}>
                            {/* Area & Location */}
                            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono tracking-wider uppercase mb-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                              <span>{prominentShop.area || prominentShop.city || 'Kolkata'}</span>
                              {prominentShop.address && (
                                <span className="text-cream-200/40 truncate hidden sm:inline">
                                  · {prominentShop.address}
                                </span>
                              )}
                            </div>

                            <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-cream-100 font-normal tracking-tight group-hover:text-amber-200 transition-colors">
                              {prominentShop.name}
                            </h3>

                            {prominentShop.description && (
                              <p className="text-xs sm:text-sm text-cream-200/80 font-sans line-clamp-2 mt-2 leading-relaxed max-w-xl">
                                {prominentShop.description}
                              </p>
                            )}
                          </motion.div>

                          {/* Menu Highlights Strip (Real categories & active dishes) */}
                          <motion.div variants={cardTagsContainerVariants} className="pt-2 flex flex-wrap items-center gap-2">
                            <motion.span variants={cardTagItemVariants} className="inline-flex items-center gap-1 text-[11px] font-mono text-cream-200/75 bg-cream-100/10 px-2.5 py-1 rounded-md border border-cream-200/15 backdrop-blur-md">
                              <Utensils className="w-3 h-3 text-amber-400" aria-hidden="true" />
                              <span>{activeFoodsCount} Dishes on Menu</span>
                            </motion.span>

                            {prominentShop.categories?.slice(0, 3).map((cat) => (
                              <motion.span
                                key={cat.id}
                                variants={cardTagItemVariants}
                                className="text-[10px] font-mono tracking-wider text-cream-200/70 bg-black/50 px-2 py-1 rounded-md border border-cream-200/10 backdrop-blur-md"
                              >
                                {cat.name}
                              </motion.span>
                            ))}
                          </motion.div>

                          {/* Action Footer */}
                          <motion.div variants={cardButtonVariants} className="pt-4 flex items-center justify-between border-t border-cream-200/15">
                            <span className="text-xs font-sans text-cream-200/60 uppercase tracking-widest hidden sm:inline">
                              Direct Digital Menu
                            </span>

                            <Link
                              to={`/restaurant/${prominentShop.slug}`}
                              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A0807] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-amber-400/25 active:scale-[0.98]"
                            >
                              <span>Explore Shop &amp; Menu</span>
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* Companion Shop Cards (Stacked on Right, 5 cols) */}
              {companionShops.length > 0 && (
                <div className="lg:col-span-5 flex flex-col space-y-5">
                  {companionShops.map((shop, idx) => {
                    const shopImage = resolveShopImage(shop, idx + 1);
                    const isOpen = shop.openingStatus?.isOpen;
                    const statusText = shop.openingStatus?.statusText;
                    const activeFoodsCount = shop.foods?.filter((f) => f.status === 'active').length ?? 0;

                    return (
                      <motion.div
                        key={shop.id}
                        initial={prefersReducedMotion ? false : 'hidden'}
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.15 }}
                        variants={cardEntranceVariants}
                        custom={isMobile ? 0.05 : 0.14 + idx * 0.12}
                        className="w-full flex-1"
                      >
                        <div className="group relative rounded-2xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 sm:p-6 flex flex-col justify-between min-h-[230px] h-full">
                          {/* Storefront Image Background */}
                          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                            <motion.div variants={cardImageVariants} className="w-full h-full overflow-hidden">
                              <img
                                src={shopImage.url}
                                alt={`${shop.name} storefront`}
                                className="w-full h-full object-cover brightness-[0.72] contrast-[1.08] group-hover:scale-[1.03] transition-transform duration-700 ease-out motion-reduce:transition-none"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  e.currentTarget.src = STOREFRONT_IMAGES[0];
                                }}
                              />
                            </motion.div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/75 via-45% to-[#0A0807]/30" />
                          </div>

                          {/* Top Badges */}
                          <motion.div variants={cardBadgeVariants} className="relative z-10 flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              {isOpen !== null && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider backdrop-blur-md ${
                                    isOpen
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-black/75 text-cream-200/70 border border-cream-200/15'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isOpen ? 'bg-emerald-400' : 'bg-cream-200/40'
                                    }`}
                                  />
                                  {statusText || (isOpen ? 'Open' : 'Closed')}
                                </span>
                              )}

                              {shop.verified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[9px] uppercase tracking-wider backdrop-blur-md">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-mono text-cream-200/50 uppercase">
                              {shop.area || 'Kolkata'}
                            </span>
                          </motion.div>

                          {/* Content */}
                          <div className="relative z-10">
                            <motion.div variants={cardTextVariants}>
                              <h4 className="font-serif text-2xl text-cream-100 font-normal leading-snug group-hover:text-amber-200 transition-colors mb-1.5">
                                {shop.name}
                              </h4>

                              <div className="flex items-center gap-3 text-xs text-cream-200/70 font-sans mb-3">
                                <span>{activeFoodsCount} Dishes Indexed</span>
                                {shop.categories && shop.categories.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate max-w-[180px]">{shop.categories[0].name}</span>
                                  </>
                                )}
                              </div>
                            </motion.div>

                            {/* Action Link */}
                            <motion.div variants={cardButtonVariants} className="pt-2 border-t border-cream-200/10 flex items-center justify-between">
                              <span className="text-[11px] font-sans uppercase tracking-wider text-cream-200/60">
                                Digital Menu Available
                              </span>

                              <Link
                                to={`/restaurant/${shop.slug}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A0807] font-sans font-semibold text-xs uppercase tracking-wider transition-colors shadow-md"
                              >
                                <span>View Menu</span>
                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                              </Link>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* =====================================================================
                TIER 2: SECONDARY REGISTERED SHOP GRID (When 4+ shops exist)
                ===================================================================== */}
            {secondaryShops.length > 0 && (
              <div className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream-200/60">
                    More Verified Neighborhood Kitchens
                  </span>
                  <div className="h-px bg-cream-200/10 flex-1 max-w-xs ml-4 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {secondaryShops.map((shop, index) => {
                    const shopImage = resolveShopImage(shop, index + 3);
                    const isOpen = shop.openingStatus?.isOpen;
                    const statusText = shop.openingStatus?.statusText;
                    const activeFoodsCount = shop.foods?.filter((f) => f.status === 'active').length ?? 0;

                    return (
                      <motion.div
                        key={shop.id}
                        initial={prefersReducedMotion ? false : 'hidden'}
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.15 }}
                        variants={cardEntranceVariants}
                        custom={isMobile ? 0.05 : (index % 3) * 0.12}
                        className="h-full"
                      >
                        <div className="group relative rounded-2xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
                          {/* Storefront Image Banner */}
                          <div className="relative h-44 overflow-hidden">
                            <motion.div variants={cardImageVariants} className="w-full h-full overflow-hidden">
                              <img
                                src={shopImage.url}
                                alt={`${shop.name} storefront`}
                                className="w-full h-full object-cover brightness-[0.82] contrast-[1.08] group-hover:scale-[1.03] transition-transform duration-500 ease-out motion-reduce:transition-none"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  e.currentTarget.src = STOREFRONT_IMAGES[0];
                                }}
                              />
                            </motion.div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#120E0C] via-transparent to-transparent pointer-events-none" />

                            {/* Top Badges */}
                            <motion.div variants={cardBadgeVariants} className="absolute top-3 left-3 right-3 flex items-center justify-between">
                              {isOpen !== null && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider backdrop-blur-md ${
                                    isOpen
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-black/75 text-cream-200/70 border border-cream-200/15'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isOpen ? 'bg-emerald-400' : 'bg-cream-200/40'
                                    }`}
                                  />
                                  {statusText || (isOpen ? 'Open' : 'Closed')}
                                </span>
                              )}

                              <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/80 bg-[#0A0807]/75 backdrop-blur-md border border-cream-200/15 px-2.5 py-0.5 rounded-full">
                                {shop.area || 'Kolkata'}
                              </span>
                            </motion.div>
                          </div>

                          {/* Body Information */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <motion.div variants={cardTextVariants}>
                              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono mb-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{shop.area || shop.city || 'Kolkata'}</span>
                              </div>

                              <h4 className="font-serif text-xl text-cream-100 font-normal group-hover:text-amber-200 transition-colors mb-1.5">
                                {shop.name}
                              </h4>

                              {shop.description && (
                                <p className="text-xs text-cream-200/65 font-sans line-clamp-2 leading-relaxed mb-3">
                                  {shop.description}
                                </p>
                              )}
                            </motion.div>

                            {/* Card Footer */}
                            <motion.div variants={cardButtonVariants} className="pt-3 border-t border-cream-200/10 flex items-center justify-between">
                              <span className="text-xs font-mono text-cream-200/60">
                                {activeFoodsCount} Dishes
                              </span>

                              <Link
                                to={`/restaurant/${shop.slug}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] text-cream-200/90 text-xs font-sans font-medium uppercase tracking-wider transition-colors duration-200"
                              >
                                <span>Explore Shop</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* =====================================================================
            CHAPTER IV EXPLORATION CTA
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.1} className="mt-14 sm:mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#120E0C]/90 border border-cream-200/10 max-w-2xl mx-auto w-full backdrop-blur-md">
            <div className="text-left">
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-0.5">
                Explore All Registered Kitchens
              </span>
              <p className="text-xs text-cream-200/80 font-sans">
                Browse our complete neighborhood restaurant directory with verified digital menus.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/search?tab=restaurants')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A0807] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-200 shrink-0 shadow-lg hover:shadow-amber-400/25 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>All Restaurants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </ChapterSection>
  );
};
