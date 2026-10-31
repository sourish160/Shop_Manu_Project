import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { insforge } from '../../lib/insforge';
import { ChapterMenuCard } from './ChapterMenuCard';

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

// =========================================================================
// CHAPTER III: TWO-STAGE SCROLL EXPERIENCE
// Stage 1: Oversized headline reveal ("EXPLORE SOME BEAUTIFUL MENUS")
// Stage 2: Siglitos-style 3D fan card carousel
// =========================================================================

export const ChapterMenuSection: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [foods, setFoods] = useState<FoodWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  // Manual active index for nav controls, synced with scroll
  const [activeIndex, setActiveIndex] = useState(0);
  // Whether the user is currently using nav buttons (temporarily override scroll)
  const navOverrideRef = useRef(false);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Responsive mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          .limit(20);

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

  // Exactly 5 curated dishes for Chapter III
  const displayedFoods = useMemo(() => foods.slice(0, 5), [foods]);
  const totalCards = displayedFoods.length;

  // Helper to format lowest price
  const getLowestPrice = (item: FoodWithRelations) => {
    if (!item.variants || item.variants.length === 0) return null;
    return Math.min(...item.variants.map((v) => v.price));
  };

  // =========================================================================
  // SCROLL TRACKING
  // =========================================================================
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // =========================================================================
  // STAGE PROGRESS MAPPING
  // Total scroll height: ~500vh
  // 0.00 – 0.18: Stage 1 – Headline reveal
  // 0.18 – 0.28: Transition – headline fades, carousel appears
  // 0.28 – 0.92: Stage 2 – Carousel cycling through cards
  // 0.92 – 1.00: Release / fade out
  // =========================================================================

  // --- STAGE 1: Headline animations ---
  const headlineWords = ['EXPLORE', 'SOME', 'BEAUTIFUL', 'MENUS'];

  // Each word reveals in sequence during 0.0 – 0.16
  const wordAnimations = headlineWords.map((_, i) => {
    const wordStart = 0.02 + i * 0.035;
    const wordEnd = wordStart + 0.06;
    return { start: wordStart, end: wordEnd };
  });

  // Word transforms
  const word0Opacity = useTransform(scrollYProgress, [wordAnimations[0].start, wordAnimations[0].end], [0, 1]);
  const word0Y = useTransform(scrollYProgress, [wordAnimations[0].start, wordAnimations[0].end], [50, 0]);
  const word1Opacity = useTransform(scrollYProgress, [wordAnimations[1].start, wordAnimations[1].end], [0, 1]);
  const word1Y = useTransform(scrollYProgress, [wordAnimations[1].start, wordAnimations[1].end], [50, 0]);
  const word2Opacity = useTransform(scrollYProgress, [wordAnimations[2].start, wordAnimations[2].end], [0, 1]);
  const word2Y = useTransform(scrollYProgress, [wordAnimations[2].start, wordAnimations[2].end], [50, 0]);
  const word3Opacity = useTransform(scrollYProgress, [wordAnimations[3].start, wordAnimations[3].end], [0, 1]);
  const word3Y = useTransform(scrollYProgress, [wordAnimations[3].start, wordAnimations[3].end], [50, 0]);

  const wordOpacities = [word0Opacity, word1Opacity, word2Opacity, word3Opacity];
  const wordYs = [word0Y, word1Y, word2Y, word3Y];

  // Headline overall fade out (during transition)
  const headlineOpacity = useTransform(scrollYProgress, [0.16, 0.26], [1, 0]);
  const headlineScale = useTransform(scrollYProgress, [0.16, 0.26], [1, 0.92]);

  // --- STAGE 2: Carousel animations ---
  const carouselOpacity = useTransform(scrollYProgress, [0.22, 0.30], [0, 1]);
  const carouselScale = useTransform(scrollYProgress, [0.22, 0.30], [0.9, 1]);

  // Active index derived from scroll position (0.28 – 0.92 maps to card indices)
  const scrollActiveIndex = useTransform(scrollYProgress, (p) => {
    if (totalCards === 0) return 0;
    const carouselStart = 0.28;
    const carouselEnd = 0.92;
    const normalized = Math.max(0, Math.min(1, (p - carouselStart) / (carouselEnd - carouselStart)));
    return Math.round(normalized * (totalCards - 1));
  });

  // Keep activeIndex in sync with scroll unless nav buttons are being used
  useMotionValueEvent(scrollActiveIndex, 'change', (latest) => {
    if (!navOverrideRef.current) {
      setActiveIndex(Math.max(0, Math.min(totalCards - 1, latest)));
    }
  });

  // Section chapter label opacity
  const chapterLabelOpacity = useTransform(scrollYProgress, [0.0, 0.03, 0.90, 0.96], [0, 1, 1, 0]);

  // Overall section progress for the scrollbar indicator
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // =========================================================================
  // NAVIGATION CONTROLS
  // =========================================================================
  const goToCard = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(totalCards - 1, index));
      setActiveIndex(clamped);
      navOverrideRef.current = true;
      clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = setTimeout(() => {
        navOverrideRef.current = false;
      }, 1200);
    },
    [totalCards],
  );

  const goNext = useCallback(() => goToCard(activeIndex + 1), [activeIndex, goToCard]);
  const goPrev = useCallback(() => goToCard(activeIndex - 1), [activeIndex, goToCard]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Touch swipe detection
  const touchStartRef = useRef<number>(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartRef.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev],
  );

  // =========================================================================
  // 3D FAN CAROUSEL CARD POSITIONING
  // =========================================================================
  const getCardTransform = (index: number, active: number) => {
    const offset = index - active;
    const absOffset = Math.abs(offset);

    if (absOffset > 3) {
      return {
        x: offset > 0 ? 140 : -140,
        rotateY: offset > 0 ? 65 : -65,
        z: -700,
        scale: 0.4,
        opacity: 0,
        zIndex: 0,
        filter: 'blur(4px)',
      };
    }

    // Center card
    if (offset === 0) {
      return {
        x: 0,
        rotateY: 0,
        z: 0,
        scale: 1,
        opacity: 1,
        zIndex: 10,
        filter: 'blur(0px)',
      };
    }

    // Side cards
    const configs: Record<number, { xBase: number; rotateBase: number; zBase: number; scaleBase: number; opacityBase: number }> = {
      1: { xBase: isMobile ? 62 : 52, rotateBase: isMobile ? 38 : 42, zBase: -220, scaleBase: 0.78, opacityBase: 0.85 },
      2: { xBase: isMobile ? 88 : 82, rotateBase: isMobile ? 52 : 56, zBase: -420, scaleBase: 0.62, opacityBase: 0.5 },
      3: { xBase: isMobile ? 105 : 100, rotateBase: isMobile ? 60 : 64, zBase: -580, scaleBase: 0.48, opacityBase: 0.25 },
    };

    const cfg = configs[absOffset]!;
    const sign = offset > 0 ? 1 : -1;

    return {
      x: sign * cfg.xBase,
      rotateY: sign * cfg.rotateBase,
      z: cfg.zBase,
      scale: cfg.scaleBase,
      opacity: cfg.opacityBase,
      zIndex: 10 - absOffset * 2,
      filter: absOffset >= 2 ? `blur(${absOffset}px)` : 'blur(0px)',
    };
  };

  // =========================================================================
  // REDUCED MOTION STATIC LAYOUT
  // =========================================================================
  if (prefersReducedMotion) {
    return (
      <section
        id="chapter-menu"
        aria-label="Chapter III: Explore The Menus"
        className="relative w-full py-20 sm:py-28 bg-[#0A0807] overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <div className="inline-flex items-center space-x-2.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" aria-hidden="true" />
              <span className="text-xs sm:text-sm text-amber-300 font-semibold tracking-[0.28em] uppercase font-mono">
                CHAPTER III — EXPLORE THE MENUS
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-cream-100 tracking-tight leading-tight">
              EXPLORE SOME BEAUTIFUL <span className="italic font-normal text-[#E8A856] font-serif">MENUS</span>
            </h2>
            <p className="text-xs sm:text-sm text-cream-200/70 font-sans max-w-xl mt-2 leading-relaxed">
              Real dishes pulled live from registered kitchens across Kolkata. Transparent portion breakdowns and chef-direct pricing.
            </p>
          </div>

          {/* Static Scrollable Horizontal Sequence */}
          <div className="flex gap-7 sm:gap-9 overflow-x-auto pb-10 pt-4 no-scrollbar snap-x">
            {displayedFoods.map((item, index) => {
              const lowest = getLowestPrice(item);
              return (
                <div
                  key={item.id}
                  className="shrink-0 w-[340px] sm:w-[390px] md:w-[440px] h-[480px] sm:h-[530px] snap-start"
                >
                  <ChapterMenuCard
                    item={item}
                    index={index}
                    isCenter={true}
                    lowestPrice={lowest}
                    onCardClick={() => {
                      if (item.restaurant) {
                        navigate(`/restaurant/${item.restaurant.slug}`);
                      } else {
                        navigate(`/search?q=${encodeURIComponent(item.name)}`);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // MAIN ANIMATED TWO-STAGE SCROLL EXPERIENCE
  // =========================================================================
  return (
    <section
      ref={sectionRef}
      id="chapter-menu"
      aria-label="Chapter III: Explore The Menus"
      className="relative w-full h-[360vh] sm:h-[390vh] lg:h-[420vh] bg-[#0A0807]"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col select-none z-10">
        {/* Subtle Background Radial Atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(217,138,72,0.05)_0%,transparent_75%)]"
          aria-hidden="true"
        />

        {/* Chapter Label (persistent, fades at edges) */}
        <motion.div
          style={{ opacity: chapterLabelOpacity }}
          className="absolute top-6 sm:top-8 left-4 sm:left-8 z-30"
        >
          <div className="inline-flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]" aria-hidden="true" />
            <span className="text-xs sm:text-sm text-amber-300 font-semibold tracking-[0.28em] uppercase font-mono">
              CHAPTER III — EXPLORE THE MENUS
            </span>
          </div>
        </motion.div>

        {/* Scroll Progress Bar (persistent) */}
        <motion.div
          style={{ opacity: chapterLabelOpacity }}
          className="absolute top-6 sm:top-8 right-4 sm:right-8 z-30 flex items-center gap-3"
        >
          <span className="hidden sm:inline font-mono text-[11px] tracking-widest text-cream-200/70 uppercase font-medium">
            Scroll to explore
          </span>
          <div className="w-24 sm:w-32 h-1.5 bg-cream-200/15 rounded-full overflow-hidden p-[1px]">
            <motion.div
              style={{ width: progressWidth }}
              className="h-full bg-gradient-to-r from-amber-400 via-[#E8A856] to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            />
          </div>
        </motion.div>

        {/* =====================================================================
            STAGE 1: OVERSIZED HEADLINE REVEAL
            ===================================================================== */}
        <motion.div
          style={{ opacity: headlineOpacity, scale: headlineScale }}
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center px-4 max-w-[95vw]">
            {/* Word-by-word animated headline */}
            <h2 className="font-serif font-light tracking-tight leading-[0.9] flex flex-wrap justify-center gap-x-[2.5vw] gap-y-[0.5vw]">
              {headlineWords.map((word, i) => (
                <span key={word} className="inline-block overflow-hidden">
                  <motion.span
                    style={{
                      opacity: wordOpacities[i],
                      y: wordYs[i],
                    }}
                    className={`inline-block text-[12vw] sm:text-[11vw] md:text-[10vw] lg:text-[9vw] ${
                      word === 'MENUS'
                        ? 'italic font-normal text-[#E8A856] font-serif'
                        : 'text-cream-100'
                    }`}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h2>

            {/* Subtle editorial subline */}
            <motion.p
              style={{
                opacity: useTransform(scrollYProgress, [0.12, 0.16, 0.20, 0.26], [0, 1, 1, 0]),
              }}
              className="text-sm sm:text-base text-cream-200/60 font-sans mt-6 sm:mt-8 max-w-lg mx-auto leading-relaxed tracking-wide"
            >
              Artisan dishes from Kolkata&apos;s finest kitchens — chef-direct pricing, live portions
            </motion.p>
          </div>
        </motion.div>

        {/* =====================================================================
            STAGE 2: SIGLITOS-STYLE 3D FAN CARD CAROUSEL
            ===================================================================== */}
        <motion.div
          style={{ opacity: carouselOpacity, scale: carouselScale }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 3D Perspective Container */}
          <div
            className="relative w-full flex-1 flex items-center justify-center"
            style={{ perspective: isMobile ? '900px' : '1200px' }}
          >
            {isLoading ? (
              /* Loading Skeleton */
              <div className="flex items-center justify-center gap-6 animate-pulse">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-[290px] sm:w-[350px] md:w-[410px] lg:w-[450px] xl:w-[480px] h-[380px] sm:h-[440px] md:h-[490px] lg:h-[540px] rounded-3xl bg-cream-100/5 border border-cream-200/10"
                    style={{
                      transform: i === 1 ? 'scale(1)' : `rotateY(${i === 0 ? -40 : 40}deg) scale(0.8) translateZ(-200px)`,
                    }}
                  />
                ))}
              </div>
            ) : displayedFoods.length === 0 ? (
              /* Empty State */
              <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-[#120E0C]/90 border border-cream-200/10">
                <h4 className="font-serif text-xl text-cream-100 mb-2">Menu catalog loading</h4>
                <p className="text-xs text-cream-200/60 font-sans">
                  Fetching authentic dishes directly from local kitchens.
                </p>
              </div>
            ) : (
              /* 3D Fan Carousel */
              <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                {displayedFoods.map((item, index) => {
                  const lowest = getLowestPrice(item);
                  const transform = getCardTransform(index, activeIndex);
                  const isCenter = index === activeIndex;

                  return (
                    <motion.div
                      key={item.id}
                      animate={{
                        x: `${transform.x}%`,
                        rotateY: transform.rotateY,
                        z: transform.z,
                        scale: transform.scale,
                        opacity: transform.opacity,
                        filter: transform.filter,
                      }}
                      transition={{
                        duration: 0.65,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ zIndex: transform.zIndex }}
                      className="absolute w-[310px] sm:w-[360px] md:w-[420px] lg:w-[460px] xl:w-[490px] h-[400px] sm:h-[460px] md:h-[520px] lg:h-[560px] xl:h-[580px]"
                    >
                      <ChapterMenuCard
                        item={item}
                        index={index}
                        isCenter={isCenter}
                        lowestPrice={lowest}
                        onCardClick={() => {
                          if (isCenter) {
                            if (item.restaurant) {
                              navigate(`/restaurant/${item.restaurant.slug}`);
                            } else {
                              navigate(`/search?q=${encodeURIComponent(item.name)}`);
                            }
                          } else {
                            goToCard(index);
                          }
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {!isLoading && displayedFoods.length > 0 && (
            <div className="relative z-30 flex items-center justify-center gap-6 pb-6 sm:pb-8 pt-3">
              {/* Previous Button */}
              <button
                onClick={goPrev}
                disabled={activeIndex === 0}
                aria-label="Previous dish"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-cream-200/20 bg-[#0A0807]/80 backdrop-blur-md flex items-center justify-center text-cream-200/80 hover:text-amber-300 hover:border-amber-400/50 hover:bg-amber-400/10 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-cream-200/80 disabled:hover:border-cream-200/20 disabled:hover:bg-[#0A0807]/80"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Card Indicators */}
              <div className="flex items-center gap-2">
                {displayedFoods.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToCard(i)}
                    aria-label={`Go to dish ${i + 1}`}
                    className={`transition-all duration-400 rounded-full ${
                      i === activeIndex
                        ? 'w-7 h-2 bg-gradient-to-r from-amber-400 to-[#E8A856] shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'w-2 h-2 bg-cream-200/25 hover:bg-cream-200/50'
                    }`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={goNext}
                disabled={activeIndex === totalCards - 1}
                aria-label="Next dish"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-cream-200/20 bg-[#0A0807]/80 backdrop-blur-md flex items-center justify-center text-cream-200/80 hover:text-amber-300 hover:border-amber-400/50 hover:bg-amber-400/10 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-cream-200/80 disabled:hover:border-cream-200/20 disabled:hover:bg-[#0A0807]/80"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Active Card Info (below carousel) */}
          {!isLoading && displayedFoods.length > 0 && (
            <div className="relative z-20 text-center pb-4 sm:pb-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-cream-200/50 uppercase">
                {String(activeIndex + 1).padStart(2, '0')} / {String(totalCards).padStart(2, '0')}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
