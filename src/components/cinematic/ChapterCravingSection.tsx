import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, UtensilsCrossed } from 'lucide-react';
import { ChapterSection } from './ChapterSection';
import { EditorialHeading } from './EditorialHeading';
import { ScrollReveal } from './ScrollReveal';
import { CRAVING_CATEGORIES, CravingCategory } from './cravingAssets';
import { FoodCategoryCard } from './FoodCategoryCard';

export const ChapterCravingSection: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Divide into curated artistic tiers
  const heroStreetFood = CRAVING_CATEGORIES.find((c) => c.id === 'street-food')!;
  const heroBiryani = CRAVING_CATEGORIES.find((c) => c.id === 'biryani')!;
  const triptychCategories = CRAVING_CATEGORIES.filter((c) =>
    ['snacks', 'meals', 'sweets'].includes(c.id)
  );
  const finishCategories = CRAVING_CATEGORIES.filter((c) =>
    ['beverages', 'desserts'].includes(c.id)
  );

  const handleCategoryClick = (category: CravingCategory) => {
    navigate(`/search?q=${encodeURIComponent(category.query)}`);
  };

  const handleDishClick = (e: React.MouseEvent, dishName: string) => {
    e.stopPropagation();
    navigate(`/search?q=${encodeURIComponent(dishName)}`);
  };

  return (
    <ChapterSection
      id="chapter-craving"
      chapterNumber="II"
      chapterLabel="Follow Your Cravings"
      scrimIntensity="deep"
      layout="full"
      className="py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =====================================================================
            CHAPTER II HEADER
            ===================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 gap-6">
          <ScrollReveal direction="up" delay={0.04}>
            <EditorialHeading
              chapterNumber="II"
              eyebrow="Follow Your Cravings"
              title="FOLLOW YOUR *CRAVINGS*"
              subtitle="From sizzling street corners and fragrant handi biryanis to evening chai companions and heritage confections—discover authentic flavours curated across your city."
              size="lg"
              className="max-w-3xl"
            />
          </ScrollReveal>

          {/* Editorial metadata */}
          <ScrollReveal direction="up" delay={0.08} className="lg:mb-2 shrink-0">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream-200/50">
              Curated City Territories
            </span>
          </ScrollReveal>
        </div>

        {/* =====================================================================
            TIER 1: THE CROWN JEWELS (Asymmetric Hero Pair — 5:7 Desktop Ratio)
            ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Card 01: Street Food — Tall Portrait Framing (5 cols) */}
          <FoodCategoryCard
            category={heroStreetFood}
            onCategoryClick={handleCategoryClick}
            onDishClick={handleDishClick}
            minHeightClass="min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]"
            headlineSizeClass="text-3xl sm:text-4xl lg:text-[2.75rem]"
            badgeIcon={<Sparkles className="w-3 h-3 text-amber-400" aria-hidden="true" />}
            ctaText="Explore Street Menus"
            entranceDelay={0.04}
            className="lg:col-span-5 h-full"
          />

          {/* Card 02: Biryani — Expansive Widescreen Focal Hero (7 cols) */}
          <FoodCategoryCard
            category={heroBiryani}
            onCategoryClick={handleCategoryClick}
            onDishClick={handleDishClick}
            minHeightClass="min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]"
            headlineSizeClass="text-3xl sm:text-4xl lg:text-[3.25rem]"
            badgeIcon={<UtensilsCrossed className="w-3 h-3 text-amber-300" aria-hidden="true" />}
            badgeClassName="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A0807]/80 border border-amber-400/30 font-mono text-[10px] tracking-widest text-amber-300 uppercase shadow-md backdrop-blur-md"
            extraOverlay={
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(200,138,88,0.18)_0%,transparent_60%)] group-hover:opacity-100 opacity-60 transition-opacity duration-700 pointer-events-none" />
            }
            ctaText="Browse Dum Kitchens"
            customCtaButton={
              <div className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-[#0A0807] bg-amber-400 group-hover:bg-amber-300 px-4 py-2 rounded-lg transition-all shadow-lg group-hover:shadow-amber-400/30">
                <span>Inspect Menus</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            }
            entranceDelay={isMobile ? 0.06 : 0.16}
            className="lg:col-span-7 h-full"
          />
        </div>

        {/* =====================================================================
            EDITORIAL INTERLUDE: Curated Rhythm Divider
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.06} className="my-8 sm:my-10">
          <div className="relative py-4 flex flex-col sm:flex-row sm:items-center justify-between border-y border-cream-200/10 gap-3">
            <p className="font-serif italic text-sm sm:text-base text-cream-200/70">
              &ldquo;Seven culinary territories, one living city heritage.&rdquo;
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cream-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Direct Kitchen Menus · Verified Portion Rates</span>
            </div>
          </div>
        </ScrollReveal>

        {/* =====================================================================
            TIER 2: THE COMFORT & HERITAGE TRIPTYCH (Snacks, Meals, Sweets)
            ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {triptychCategories.map((category, index) => (
            <FoodCategoryCard
              key={category.id}
              category={category}
              onCategoryClick={handleCategoryClick}
              onDishClick={handleDishClick}
              minHeightClass="min-h-[400px] sm:min-h-[440px]"
              headlineSizeClass="text-2xl sm:text-[1.85rem]"
              ctaText={`Explore ${category.title}`}
              entranceDelay={isMobile ? 0.05 : index * 0.12}
              className="h-full"
            />
          ))}
        </div>

        {/* =====================================================================
            TIER 3: SIPS & SWEET FINISHES (Beverages + Desserts — 5:7 Desktop Duo)
            ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {finishCategories.map((category, index) => {
            const isWide = category.id === 'desserts';
            const colSpanClass = isWide ? 'lg:col-span-7' : 'lg:col-span-5';

            return (
              <FoodCategoryCard
                key={category.id}
                category={category}
                onCategoryClick={handleCategoryClick}
                onDishClick={handleDishClick}
                minHeightClass="min-h-[340px] sm:min-h-[380px]"
                headlineSizeClass={isWide ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-2xl sm:text-3xl'}
                ctaText={`Explore ${category.title}`}
                entranceDelay={isMobile ? 0.05 : index * 0.12}
                className={`${colSpanClass} h-full`}
              />
            );
          })}
        </div>
      </div>
    </ChapterSection>
  );
};
