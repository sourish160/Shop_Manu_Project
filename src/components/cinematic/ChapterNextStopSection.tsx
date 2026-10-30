import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Utensils, Store, MapPin, ShieldCheck } from 'lucide-react';
import { insforge, RestaurantHours } from '../../lib/insforge';
import { getRestaurantOpeningStatus, OpeningStatusResult } from '../../utils/operatingHours';
import { ChapterSection } from './ChapterSection';
import { EditorialHeading } from './EditorialHeading';
import { ScrollReveal } from './ScrollReveal';
import { NEXT_STOP_ASSETS } from './nextStopAssets';

interface FeaturedStop {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  area?: string | null;
  city?: string | null;
  verified?: boolean;
  cover_url?: string | null;
  hours?: RestaurantHours[];
  foods?: Array<{ id: string; name: string }>;
  openingStatus?: OpeningStatusResult;
}

export const ChapterNextStopSection: React.FC = () => {
  const navigate = useNavigate();
  const [featuredStop, setFeaturedStop] = useState<FeaturedStop | null>(null);

  // Fetch real approved shop destination from InsForge
  useEffect(() => {
    let isMounted = true;
    async function loadDestination() {
      try {
        const { data, error } = await insforge.database
          .from('restaurants')
          .select(`
            id, name, slug, description, area, city, verified, cover_url,
            hours:restaurant_hours(day_of_week, open_time, close_time, is_closed),
            foods:foods(id, name)
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && isMounted) {
          const shop = data[0] as unknown as FeaturedStop;
          setFeaturedStop({
            ...shop,
            openingStatus: getRestaurantOpeningStatus(shop.hours || []),
          });
        }
      } catch (err) {
        console.error('Error fetching Chapter VI featured destination:', err);
      }
    }

    loadDestination();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ChapterSection
      id="chapter-next-bite"
      chapterNumber="VI"
      chapterLabel="Your Next Food Stop"
      scrimIntensity="deep"
      layout="centered"
      className="py-24 sm:py-36 relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* =====================================================================
            CHAPTER VI HEADER & EDITORIAL TITLE
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.06}>
          <EditorialHeading
            chapterNumber="VI"
            eyebrow="Your Next Food Stop"
            title="YOUR NEXT *FOOD STOP*"
            subtitle="Whether it is a midnight kathi roll fresh off smoking cast iron, a slow-steamed Awadhi dum biryani handi, or a warm kulhad chai—your next culinary destination is already cooking across Kolkata."
            size="xl"
            align="center"
            className="mb-10 sm:mb-12 max-w-3xl mx-auto"
          />
        </ScrollReveal>

        {/* =====================================================================
            MAIN VISUAL ANCHOR (Atmospheric Warm Dining Showcase Card)
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.1} className="mb-12 sm:mb-14">
          <div className="group relative w-full h-[360px] sm:h-[440px] lg:h-[480px] rounded-3xl overflow-hidden border border-cream-200/15 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_rgba(200,138,88,0.12)]">
            {/* Cinematic Background Photograph */}
            <img
              src={NEXT_STOP_ASSETS.mainAnchor}
              alt="Warm atmospheric restaurant dining room with amber pendant lamps"
              className="w-full h-full object-cover brightness-[0.78] contrast-[1.08] saturate-[1.08] group-hover:scale-[1.03] group-hover:brightness-[0.85] transition-all duration-700 ease-out motion-reduce:transition-none"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85';
              }}
            />

            {/* Layered Scrim Gradients for Visual Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/50 via-50% to-[#0A0807]/30 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(10,8,7,0.7)_100%)]" />

            {/* Ambient Warm Golden Aura */}
            <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Centered In-Image Invocation & Dual Primary CTAs */}
            <div className="absolute inset-0 flex flex-col items-center justify-end p-6 sm:p-10 pb-8 sm:pb-12 text-center z-10">
              <p className="font-serif italic text-base sm:text-lg text-cream-100/90 max-w-xl mx-auto mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                &ldquo;Taste the city without the guesswork. Real prices, transparent portions, zero fake reviews.&rdquo;
              </p>

              {/* Dual Clear Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
                {/* Action 1: EXPLORE MENUS */}
                <button
                  type="button"
                  onClick={() => navigate('/search?tab=foods')}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#0A0807] font-sans font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 shadow-xl hover:shadow-amber-400/25 active:scale-[0.98] cursor-pointer"
                >
                  <Utensils className="w-4 h-4 text-[#0A0807]" />
                  <span>EXPLORE MENUS</span>
                  <ArrowRight className="w-4 h-4 text-[#0A0807] transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                {/* Action 2: FIND A SHOP */}
                <button
                  type="button"
                  onClick={() => navigate('/search?tab=restaurants')}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-[#0A0807]/85 hover:bg-[#120E0C] text-cream-100 font-sans font-semibold text-xs uppercase tracking-widest border border-cream-200/20 hover:border-amber-400/50 transition-all duration-200 hover:-translate-y-0.5 shadow-xl backdrop-blur-md active:scale-[0.98] cursor-pointer"
                >
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>FIND A SHOP</span>
                  <ArrowRight className="w-4 h-4 text-amber-300 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* =====================================================================
            REAL REGISTERED DESTINATION SPOTLIGHT (Pulled from InsForge)
            ===================================================================== */}
        {featuredStop && (
          <ScrollReveal direction="up" delay={0.14} className="mb-12">
            <div className="inline-flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#120E0C]/90 border border-cream-200/12 backdrop-blur-md max-w-2xl mx-auto w-full text-left">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest">
                      Featured Destination
                    </span>
                    {featuredStop.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg text-cream-100 font-normal truncate">
                    {featuredStop.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-cream-200/60 font-sans">
                    <MapPin className="w-3 h-3 text-cream-200/40" />
                    <span>{featuredStop.area || 'Kolkata'}</span>
                    {featuredStop.openingStatus?.isOpen !== null && (
                      <>
                        <span>·</span>
                        <span className={featuredStop.openingStatus?.isOpen ? 'text-emerald-400 font-medium' : 'text-cream-200/50'}>
                          {featuredStop.openingStatus?.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link
                to={`/restaurant/${featuredStop.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] text-cream-100 font-sans font-medium text-xs uppercase tracking-wider transition-colors duration-200 shrink-0"
              >
                <span>View Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>
        )}

        {/* =====================================================================
            QUIET INVITATION FOR KITCHEN OWNERS
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.18}>
          <div className="pt-10 mt-6 border-t border-cream-200/10 max-w-xl mx-auto text-center">
            <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-2">
              For Food Businesses &amp; Kitchen Owners
            </span>
            <p className="text-xs text-cream-200/70 font-sans leading-relaxed mb-4 max-w-md mx-auto">
              Operate a restaurant, cloud kitchen, or street stall in Kolkata? Join ManuMania to list your digital menu with live portion rates and zero commissions.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                to="/owner/register"
                className="text-xs font-semibold uppercase tracking-wider text-amber-300 hover:text-amber-200 transition-colors"
              >
                Register Kitchen &rarr;
              </Link>
              <span className="text-cream-200/20" aria-hidden="true">·</span>
              <Link
                to="/owner/login"
                className="text-xs font-semibold uppercase tracking-wider text-cream-200/60 hover:text-cream-100 transition-colors"
              >
                Owner Sign In
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </ChapterSection>
  );
};

