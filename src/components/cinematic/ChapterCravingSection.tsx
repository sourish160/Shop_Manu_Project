import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, UtensilsCrossed } from 'lucide-react';
import { ChapterSection } from './ChapterSection';
import { EditorialHeading } from './EditorialHeading';
import { ScrollReveal } from './ScrollReveal';
import {
  CRAVING_CATEGORIES,
  CRAVING_IMAGE_MAP,
  CravingCategory,
} from './cravingAssets';

export const ChapterCravingSection: React.FC = () => {
  const navigate = useNavigate();

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

          {/* Discreet status pill & exploration hint */}
          <ScrollReveal direction="up" delay={0.08} className="lg:mb-2 shrink-0">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#120E0C]/90 border border-cream-200/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream-200/75">
                07 Curated Territories
              </span>
              <span className="text-cream-200/30" aria-hidden="true">|</span>
              <span className="font-mono text-[10px] tracking-wider text-amber-300/90 hidden sm:inline">
                Live Menus &amp; Portion Rates
              </span>
            </div>
          </ScrollReveal>
        </div>

        {/* =====================================================================
            TIER 1: THE CROWN JEWELS (Asymmetric Hero Pair — 5:7 Desktop Ratio)
            ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Card 01: Street Food — Tall Portrait Framing (5 cols) */}
          <ScrollReveal direction="up" delay={0.1} className="lg:col-span-5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryClick(heroStreetFood)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategoryClick(heroStreetFood);
                }
              }}
              aria-label={`Explore ${heroStreetFood.title} category`}
              className="group relative block w-full h-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-2xl transition-all duration-500 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer text-left flex flex-col justify-between p-6 sm:p-8"
            >
              {/* Background Photography */}
              <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                <img
                  src={heroStreetFood.image}
                  alt={heroStreetFood.alt}
                  className={`w-full h-full object-cover ${heroStreetFood.position} brightness-[0.82] contrast-[1.08] saturate-[1.08] group-hover:brightness-[0.92] group-hover:scale-105 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = CRAVING_IMAGE_MAP.streetFood;
                  }}
                />

                {/* Layered Scrim Gradients for Absolute Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/55 via-50% to-[#0A0807]/20 transition-opacity duration-500 group-hover:from-[#0A0807]/95" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0807]/60 via-transparent to-transparent" />

                {/* Subtle Amber Glow on Hover */}
                <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </div>

              {/* Card Header Metadata */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.25em] text-cream-200/80">
                  {heroStreetFood.count} / 07
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A0807]/75 backdrop-blur-md border border-cream-200/15 font-mono text-[10px] tracking-widest text-amber-300 uppercase shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-400" aria-hidden="true" />
                  {heroStreetFood.curatorBadge}
                </span>
              </div>

              {/* Card Footer Content & Dish Pills */}
              <div className="relative z-10 flex flex-col space-y-4 pt-16">
                <div>
                  <p className="text-xs sm:text-sm text-cream-200/75 font-sans mb-1.5 line-clamp-2 leading-relaxed">
                    {heroStreetFood.tagline}
                  </p>
                  <h3 className="font-serif text-3xl sm:text-4xl text-cream-100 font-normal tracking-tight group-hover:text-amber-200 transition-colors">
                    {heroStreetFood.headline}
                  </h3>
                </div>

                {/* Interactive Dish Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Popular dishes">
                  {heroStreetFood.highlightDishes.map((dish) => (
                    <button
                      key={dish}
                      type="button"
                      onClick={(e) => handleDishClick(e, dish)}
                      title={`Search menus for ${dish}`}
                      className="px-2.5 py-1 rounded-md bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] border border-cream-100/15 text-cream-200/90 text-[11px] font-mono tracking-wider transition-colors backdrop-blur-sm cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-300"
                    >
                      {dish}
                    </button>
                  ))}
                </div>

                {/* Call-to-action link */}
                <div className="pt-2 flex items-center justify-between border-t border-cream-200/15">
                  <span className="font-sans text-xs uppercase tracking-widest text-cream-100/90 group-hover:text-amber-300 transition-colors font-semibold">
                    Explore Street Menus
                  </span>
                  <div className="w-8 h-8 rounded-full bg-cream-100/10 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-[#0A0807] text-amber-300 transition-all duration-300 shadow-md">
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 02: Biryani — Expansive Widescreen Focal Hero (7 cols) */}
          <ScrollReveal direction="up" delay={0.16} className="lg:col-span-7">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryClick(heroBiryani)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategoryClick(heroBiryani);
                }
              }}
              aria-label={`Explore ${heroBiryani.title} category`}
              className="group relative block w-full h-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/50 shadow-2xl transition-all duration-500 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer text-left flex flex-col justify-between p-6 sm:p-8"
            >
              {/* Background Photography */}
              <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                <img
                  src={heroBiryani.image}
                  alt={heroBiryani.alt}
                  className={`w-full h-full object-cover ${heroBiryani.position} brightness-[0.82] contrast-[1.1] saturate-[1.1] group-hover:brightness-[0.92] group-hover:scale-105 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = CRAVING_IMAGE_MAP.biryani;
                  }}
                />

                {/* Layered Scrim Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/60 via-45% to-[#0A0807]/25 transition-opacity duration-500 group-hover:from-[#0A0807]/95" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0807]/75 via-[#0A0807]/30 to-transparent" />

                {/* Golden Amber Radiance */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(200,138,88,0.18)_0%,transparent_60%)] group-hover:opacity-100 opacity-60 transition-opacity duration-700 pointer-events-none" />
              </div>

              {/* Card Header Metadata */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.25em] text-cream-200/80">
                  {heroBiryani.count} / 07
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-400/40 font-mono text-[10px] tracking-widest text-amber-300 uppercase shadow-lg backdrop-blur-md">
                  <UtensilsCrossed className="w-3 h-3 text-amber-300" aria-hidden="true" />
                  {heroBiryani.curatorBadge}
                </span>
              </div>

              {/* Card Footer Content */}
              <div className="relative z-10 flex flex-col space-y-4 pt-16 max-w-xl">
                <div>
                  <p className="text-xs sm:text-sm text-cream-200/85 font-sans mb-1.5 line-clamp-2 leading-relaxed">
                    {heroBiryani.tagline}
                  </p>
                  <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-cream-100 font-normal tracking-tight group-hover:text-amber-200 transition-colors">
                    {heroBiryani.headline}
                  </h3>
                </div>

                {/* Interactive Dish Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Popular biryanis">
                  {heroBiryani.highlightDishes.map((dish) => (
                    <button
                      key={dish}
                      type="button"
                      onClick={(e) => handleDishClick(e, dish)}
                      title={`Search menus for ${dish}`}
                      className="px-3 py-1 rounded-md bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] border border-cream-100/15 text-cream-200/90 text-[11px] font-mono tracking-wider transition-colors backdrop-blur-sm cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-300"
                    >
                      {dish}
                    </button>
                  ))}
                </div>

                {/* Call-to-action link */}
                <div className="pt-2 flex items-center justify-between border-t border-cream-200/15">
                  <span className="font-sans text-xs uppercase tracking-widest text-amber-300 font-bold group-hover:text-amber-200 transition-colors">
                    Browse Dum Kitchens
                  </span>
                  <div className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-[#0A0807] bg-amber-400 group-hover:bg-amber-300 px-4 py-2 rounded-lg transition-all shadow-lg group-hover:shadow-amber-400/30">
                    <span>Inspect Menus</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
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
            <ScrollReveal
              key={category.id}
              direction="up"
              delay={0.08 + index * 0.06}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCategoryClick(category)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(category);
                  }
                }}
                aria-label={`Explore ${category.title} category`}
                className="group relative block w-full h-full min-h-[400px] sm:min-h-[440px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-2xl transition-all duration-500 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer text-left flex flex-col justify-between p-6 sm:p-7"
              >
                {/* Background Photography */}
                <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                  <img
                    src={category.image}
                    alt={category.alt}
                    className={`w-full h-full object-cover ${category.position} brightness-[0.82] contrast-[1.08] saturate-[1.08] group-hover:brightness-[0.92] group-hover:scale-105 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = CRAVING_IMAGE_MAP.meals;
                    }}
                  />

                  {/* Scrim Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/60 via-50% to-[#0A0807]/20 transition-opacity duration-500 group-hover:from-[#0A0807]/95" />
                  <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>

                {/* Card Header */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="font-mono text-xs tracking-[0.25em] text-cream-200/80">
                    {category.count} / 07
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#0A0807]/75 backdrop-blur-md border border-cream-200/15 font-mono text-[9px] tracking-widest text-amber-300 uppercase shadow-sm">
                    {category.curatorBadge}
                  </span>
                </div>

                {/* Card Footer */}
                <div className="relative z-10 flex flex-col space-y-3.5 pt-12">
                  <div>
                    <p className="text-xs text-cream-200/75 font-sans mb-1 line-clamp-2 leading-relaxed">
                      {category.tagline}
                    </p>
                    <h3 className="font-serif text-2xl sm:text-3xl text-cream-100 font-normal tracking-tight group-hover:text-amber-200 transition-colors">
                      {category.headline}
                    </h3>
                  </div>

                  {/* Dish Chips */}
                  <div className="flex flex-wrap items-center gap-1.5" aria-label={`Dishes in ${category.title}`}>
                    {category.highlightDishes.map((dish) => (
                      <button
                        key={dish}
                        type="button"
                        onClick={(e) => handleDishClick(e, dish)}
                        title={`Search for ${dish}`}
                        className="px-2 py-0.5 rounded bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] border border-cream-100/15 text-cream-200/90 text-[10px] font-mono tracking-wider transition-colors backdrop-blur-sm cursor-pointer"
                      >
                        {dish}
                      </button>
                    ))}
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-2 flex items-center justify-between border-t border-cream-200/15">
                    <span className="font-sans text-[11px] uppercase tracking-wider text-cream-100/90 group-hover:text-amber-300 transition-colors font-medium">
                      Explore {category.title}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-cream-100/10 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-[#0A0807] text-amber-300 transition-all duration-300">
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
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
              <ScrollReveal
                key={category.id}
                direction="up"
                delay={0.1 + index * 0.08}
                className={colSpanClass}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCategoryClick(category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCategoryClick(category);
                    }
                  }}
                  aria-label={`Explore ${category.title} category`}
                  className="group relative block w-full h-full min-h-[340px] sm:min-h-[380px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/40 shadow-2xl transition-all duration-500 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer text-left flex flex-col justify-between p-6 sm:p-7"
                >
                  {/* Background Photography */}
                  <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                    <img
                      src={category.image}
                      alt={category.alt}
                      className={`w-full h-full object-cover ${category.position} brightness-[0.82] contrast-[1.08] saturate-[1.08] group-hover:brightness-[0.92] group-hover:scale-105 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = CRAVING_IMAGE_MAP.desserts;
                      }}
                    />

                    {/* Scrim Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/60 via-50% to-[#0A0807]/20 transition-opacity duration-500 group-hover:from-[#0A0807]/95" />
                    <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </div>

                  {/* Card Header */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.25em] text-cream-200/80">
                      {category.count} / 07
                    </span>
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#0A0807]/75 backdrop-blur-md border border-cream-200/15 font-mono text-[9px] tracking-widest text-amber-300 uppercase shadow-sm">
                      {category.curatorBadge}
                    </span>
                  </div>

                  {/* Card Footer */}
                  <div className="relative z-10 flex flex-col space-y-3.5 pt-12">
                    <div>
                      <p className="text-xs sm:text-sm text-cream-200/75 font-sans mb-1 line-clamp-1 leading-relaxed">
                        {category.tagline}
                      </p>
                      <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-cream-100 font-normal tracking-tight group-hover:text-amber-200 transition-colors">
                        {category.headline}
                      </h3>
                    </div>

                    {/* Dish Chips */}
                    <div className="flex flex-wrap items-center gap-1.5" aria-label={`Dishes in ${category.title}`}>
                      {category.highlightDishes.map((dish) => (
                        <button
                          key={dish}
                          type="button"
                          onClick={(e) => handleDishClick(e, dish)}
                          title={`Search for ${dish}`}
                          className="px-2.5 py-0.5 rounded bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] border border-cream-100/15 text-cream-200/90 text-[10px] font-mono tracking-wider transition-colors backdrop-blur-sm cursor-pointer"
                        >
                          {dish}
                        </button>
                      ))}
                    </div>

                    {/* Card Action Link */}
                    <div className="pt-2 flex items-center justify-between border-t border-cream-200/15">
                      <span className="font-sans text-xs uppercase tracking-wider text-cream-100/90 group-hover:text-amber-300 transition-colors font-medium">
                        Explore {category.title}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-cream-100/10 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-[#0A0807] text-amber-300 transition-all duration-300">
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </ChapterSection>
  );
};
