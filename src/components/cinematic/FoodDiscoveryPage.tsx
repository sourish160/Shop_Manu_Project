import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, MapPin, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { insforge } from '../../lib/insforge';
import { getRestaurantOpeningStatus } from '../../utils/operatingHours';
import { useSEO } from '../../hooks/useSEO';

import { ChapterSection } from './ChapterSection';
import { EditorialHeading } from './EditorialHeading';
import { TypographyMarquee } from './TypographyMarquee';
import { ScrollReveal } from './ScrollReveal';
import { TOTAL_FRAMES, getFrameUrl } from './CinematicScrollSequence';

export const FoodDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Scroll tracking for entire landing-page sequence background
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map complete landing-page scroll progress to available frame range [0, TOTAL_FRAMES - 1]
  // Conceptually: frameIndex = Math.round(progress * (frameCount - 1))
  const mappedFrameIndex = useTransform(scrollYProgress, (progress) =>
    Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1))))
  );

  // Scroll-triggered gradient disappearance:
  // Concentrated behind hero text at initial load (progress = 0, opacity = 1)
  // Fades out smoothly as visitor begins scrolling down ([0, 0.08] -> [1, 0])
  const heroGradientOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  const heroContentY = useTransform(scrollYProgress, [0, 0.15], [0, -35]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.08, 0.18, 0.25], [1, 1, 0.85, 0]);
  const heroPointerEvents = useTransform(scrollYProgress, (v) => (v > 0.2 ? 'none' : 'auto'));

  const currentTargetRef = useRef(0);
  const lastDrawnIndexRef = useRef<number | null>(null);
  const imagePoolRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const inFlightRef = useRef<Set<number>>(new Set());

  // Active chapter state for discreet side navigation rail
  const [activeChapter, setActiveChapter] = useState('chapter-discovery');

  useEffect(() => {
    const chapterIds = [
      'chapter-discovery',
      'chapter-craving',
      'chapter-menu',
      'chapter-gallery',
      'chapter-around-you',
      'chapter-next-bite',
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    chapterIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useSEO({
    title: 'Find Food, Menus & Prices Near You',
    description:
      'Search local food shops, browse real digital menus, compare portion prices, and check live operating hours with zero fake ratings.',
    canonicalUrl: typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com',
    ogType: 'website',
  });

  const [selectedLocation] = useState('Kolkata');
  const [approvedRestaurants, setApprovedRestaurants] = useState<any[]>([]);
  const [signatureFoods, setSignatureFoods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real approved restaurants and signature foods from InsForge
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [restRes, foodRes] = await Promise.all([
          insforge.database
            .from('restaurants')
            .select(
              `id, name, slug, description, address, area, city, status, verified, logo_url, cover_url,
               hours:restaurant_hours(day_of_week, open_time, close_time, is_closed)`
            )
            .eq('status', 'approved')
            .limit(6),

          insforge.database
            .from('foods')
            .select(
              `id, name, slug, description, veg_type, status,
               restaurant:restaurants(id, name, slug, area),
               variants:food_variants(id, name, price, available)`
            )
            .eq('status', 'active')
            .limit(6),
        ]);

        if (restRes.data) {
          const transformed = restRes.data.map((r: any) => ({
            ...r,
            openingStatus: getRestaurantOpeningStatus(r.hours || []),
          }));
          setApprovedRestaurants(transformed);
        }

        if (foodRes.data) {
          setSignatureFoods(foodRes.data);
        }
      } catch (err) {
        console.error('Error fetching discovery data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  /**
   * Cover-fit rendering helper preserving 1280x720 aspect ratio without stretching
   */
  const renderFrameToCanvas = useCallback((img: HTMLImageElement, frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (cw === 0 || ch === 0) return;

    const imgW = img.naturalWidth || 1280;
    const imgH = img.naturalHeight || 720;
    const imgRatio = imgW / imgH;
    const canvasRatio = cw / ch;

    let renderW: number;
    let renderH: number;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderW = cw;
      renderH = cw / imgRatio;
      offsetY = (ch - renderH) / 2;
    } else {
      renderH = ch;
      renderW = ch * imgRatio;
      offsetX = (cw - renderW) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    lastDrawnIndexRef.current = frameIdx;
  }, []);

  /**
   * Finds closest loaded frame in cache to prevent blank screens or flickering during fast scrolling
   */
  const findClosestLoadedFrame = useCallback((targetIdx: number): number | null => {
    const pool = imagePoolRef.current;
    if (pool.has(targetIdx)) return targetIdx;

    let closestIdx: number | null = null;
    let minDistance = Infinity;

    for (const loadedIdx of pool.keys()) {
      const dist = Math.abs(loadedIdx - targetIdx);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = loadedIdx;
      }
    }

    return closestIdx;
  }, []);

  /**
   * Asynchronously loads a specific frame and caches it in memory
   */
  const loadFrame = useCallback(
    (index: number): Promise<HTMLImageElement | null> => {
      const clamped = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(index)));
      if (imagePoolRef.current.has(clamped)) {
        return Promise.resolve(imagePoolRef.current.get(clamped)!);
      }
      if (inFlightRef.current.has(clamped)) {
        return Promise.resolve(null);
      }
      inFlightRef.current.add(clamped);

      return new Promise((resolve) => {
        const img = new Image();
        img.src = getFrameUrl(clamped);
        img.decoding = 'async';

        img.onload = () => {
          inFlightRef.current.delete(clamped);
          imagePoolRef.current.set(clamped, img);

          if (currentTargetRef.current === clamped) {
            renderFrameToCanvas(img, clamped);
          }
          resolve(img);
        };

        img.onerror = () => {
          inFlightRef.current.delete(clamped);
          resolve(null);
        };
      });
    },
    [renderFrameToCanvas]
  );

  /**
   * Handles high-DPI canvas resizing to fill the viewport edge-to-edge
   */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    const targetW = Math.floor(vw * dpr);
    const targetH = Math.floor(vh * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;

      const targetIdx = currentTargetRef.current;
      const bestIdx = findClosestLoadedFrame(targetIdx);
      if (bestIdx !== null) {
        const img = imagePoolRef.current.get(bestIdx);
        if (img) renderFrameToCanvas(img, bestIdx);
      }
    }
  }, [findClosestLoadedFrame, renderFrameToCanvas]);

  // Initial load: Preload Frame 0 immediately, followed by coarse keyframes
  useEffect(() => {
    let isMounted = true;

    loadFrame(0).then((img0) => {
      if (!isMounted || !img0) return;
      resizeCanvas();
      renderFrameToCanvas(img0, 0);

      if (prefersReducedMotion) return;

      const coarseKeyframes: number[] = [];
      for (let i = 12; i < TOTAL_FRAMES; i += 12) {
        coarseKeyframes.push(i);
      }
      if (!coarseKeyframes.includes(TOTAL_FRAMES - 1)) {
        coarseKeyframes.push(TOTAL_FRAMES - 1);
      }

      let currentBatch = 0;
      const batchSize = 4;

      function loadNextBatch() {
        if (!isMounted) return;
        const slice = coarseKeyframes.slice(currentBatch, currentBatch + batchSize);
        if (slice.length === 0) return;

        Promise.all(slice.map((idx) => loadFrame(idx))).then(() => {
          currentBatch += batchSize;
          if (currentBatch < coarseKeyframes.length && isMounted) {
            setTimeout(loadNextBatch, 80);
          }
        });
      }

      setTimeout(loadNextBatch, 150);
    });

    window.addEventListener('resize', resizeCanvas, { passive: true });
    return () => {
      isMounted = false;
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [loadFrame, prefersReducedMotion, renderFrameToCanvas, resizeCanvas]);

  // Scroll listener mapping landing-page scroll progress to frame index [0, 239]
  useMotionValueEvent(mappedFrameIndex, 'change', (targetIndex) => {
    if (prefersReducedMotion) return;

    currentTargetRef.current = targetIndex;

    if (imagePoolRef.current.has(targetIndex)) {
      const img = imagePoolRef.current.get(targetIndex)!;
      renderFrameToCanvas(img, targetIndex);
    } else {
      const closest = findClosestLoadedFrame(targetIndex);
      if (closest !== null && lastDrawnIndexRef.current !== closest) {
        const fallbackImg = imagePoolRef.current.get(closest)!;
        renderFrameToCanvas(fallbackImg, closest);
      }
      loadFrame(targetIndex);
    }

    const lookahead = 8;
    const lookbehind = 4;
    const minWin = Math.max(0, targetIndex - lookbehind);
    const maxWin = Math.min(TOTAL_FRAMES - 1, targetIndex + lookahead);

    for (let i = targetIndex; i <= maxWin; i++) {
      if (!imagePoolRef.current.has(i) && !inFlightRef.current.has(i)) loadFrame(i);
    }
    for (let i = targetIndex - 1; i >= minWin; i--) {
      if (!imagePoolRef.current.has(i) && !inFlightRef.current.has(i)) loadFrame(i);
    }
  });

  return (
    <div className="min-h-screen bg-[#0A0807] text-cream-100 flex flex-col relative selection:bg-amber-500/30 overflow-x-hidden">
      {/* =========================================================================
          SHARED FULL-WEBSITE BACKGROUND SCROLL ANIMATION (Chapters I through VI)
          ========================================================================= */}
      <div
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Full-Bleed Hardware-Accelerated HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover filter brightness-[0.88] contrast-[1.08] saturate-[1.05]"
          aria-hidden="true"
        />

        {/* Layer 2: Dedicated Scroll-Triggered Hero Dark Gradient Overlay (Fades out as visitor scrolls) */}
        <motion.div
          style={{
            opacity: prefersReducedMotion ? 0.85 : heroGradientOpacity,
          }}
          className="absolute inset-0 pointer-events-none z-[2]"
          aria-hidden="true"
        >
          <div
            className="w-full h-full"
            style={{
              background: `
                linear-gradient(90deg, rgba(8, 7, 6, 0.96) 0%, rgba(8, 7, 6, 0.90) 28%, rgba(8, 7, 6, 0.72) 46%, rgba(8, 7, 6, 0.30) 68%, transparent 88%),
                radial-gradient(ellipse 65% 55% at 20% 45%, rgba(8, 7, 6, 0.92) 0%, rgba(8, 7, 6, 0.60) 50%, transparent 80%),
                linear-gradient(180deg, rgba(8, 7, 6, 0.75) 0%, transparent 20%, transparent 75%, rgba(8, 7, 6, 0.85) 100%)
              `,
            }}
          />
        </motion.div>

        {/* Layered Atmospheric Editorial Lighting & Scrims (Ensures Text/Card Legibility Across All Six Chapters) */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'linear-gradient(180deg, rgba(10, 8, 7, 0.55) 0%, rgba(10, 8, 7, 0.32) 40%, rgba(10, 8, 7, 0.68) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Ambient Warm Amber Artisan Radial Glow */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'radial-gradient(ellipse 75% 65% at 75% 45%, rgba(200, 138, 88, 0.12) 0%, rgba(200, 138, 88, 0.02) 60%, transparent 80%)',
          }}
          aria-hidden="true"
        />

        {/* Subtle Edge Vignettes */}
        <div
          className="absolute top-0 inset-x-0 h-28 pointer-events-none z-[1]"
          style={{
            background: 'linear-gradient(180deg, rgba(10, 8, 7, 0.8) 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none z-[1]"
          style={{
            background: 'linear-gradient(0deg, #0A0807 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Scroll-Linked Progress Line (Top of Viewport) */}
      <motion.div
        style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 z-50 pointer-events-none"
        aria-hidden="true"
      />

      {/* Understated Chapter Floating Progression Rail (Desktop) */}
      <nav
        aria-label="Story chapter progression"
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-2.5 bg-[#120E0C]/85 backdrop-blur-md px-2.5 py-4 rounded-full border border-cream-200/10 shadow-2xl"
      >
        {[
          { id: 'chapter-discovery', num: 'I', label: 'The Discovery' },
          { id: 'chapter-craving', num: 'II', label: 'The Craving' },
          { id: 'chapter-menu', num: 'III', label: 'The Menu' },
          { id: 'chapter-gallery', num: 'IV', label: 'The Food Gallery' },
          { id: 'chapter-around-you', num: 'V', label: 'Around You' },
          { id: 'chapter-next-bite', num: 'VI', label: 'Your Next Bite' },
        ].map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              title={`Chapter ${ch.num}: ${ch.label}`}
              className={`flex items-center justify-center w-6 h-6 rounded-full font-mono text-[10px] transition-all ${
                isActive
                  ? 'bg-amber-400 text-[#0A0807] font-bold scale-110 shadow-md'
                  : 'text-cream-200/50 hover:text-cream-100 hover:bg-cream-200/10'
              }`}
            >
              <span>{ch.num}</span>
            </a>
          );
        })}
      </nav>

      {/* =========================================================================
          CHAPTER I — THE DISCOVERY (Opening Chapter over Shared Background)
          ========================================================================= */}
      <section
        id="chapter-discovery"
        ref={heroRef}
        aria-label="Chapter I: The Discovery"
        /* chapterNumber="I" chapterLabel="The Discovery" bgImage="/image-sequence/videp000.jpg" prefersReducedMotion ? 'min-h-screen' : 'h-[400vh]' sticky top-0 sticky */
        className="relative z-10 w-full min-h-screen flex flex-col justify-between pt-28 pb-8 overflow-hidden"
      >
        {/* Chapter Watermark Numeral */}
        <div
          aria-hidden="true"
          className="absolute right-6 sm:right-12 lg:right-20 top-20 pointer-events-none select-none z-[2]"
        >
          <span className="font-serif text-stroke-cream text-7xl sm:text-9xl lg:text-[10rem] font-light opacity-25 tracking-tight">
            I
          </span>
        </div>

        {/* Foreground Hero Content Layer (Spacious, Aligned, Perfectly Read) */}
        <motion.div
          style={{
            opacity: prefersReducedMotion ? 1 : heroContentOpacity,
            y: prefersReducedMotion ? 0 : heroContentY,
            pointerEvents: prefersReducedMotion ? 'auto' : heroPointerEvents,
          }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between pt-6"
        >
          <div className="flex-1 flex flex-col justify-center max-w-3xl">
            <ScrollReveal direction="up" delay={0.04}>
              {/* Chapter Label */}
              {/* Chapter I — The Discovery */}
              <div className="inline-flex items-center space-x-2.5 mb-5 sm:mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" aria-hidden="true" />
                <span className="chapter-label text-xs sm:text-sm text-amber-300 font-medium tracking-[0.25em] uppercase font-mono">
                  CHAPTER I — THE DISCOVERY
                </span>
              </div>

              {/* Main Headline: FIND FOOD THAT FEELS Right */}
              {/* previous headline reference: Slow grilled, stacked like velvet. */}
              <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[6.75rem] xl:text-[7.5rem] font-normal tracking-tight leading-[0.92] mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
                <span className="block text-[#FAF8F5]">
                  FIND FOOD
                </span>
                <span className="block text-[#FAF8F5]">
                  THAT
                </span>
                <span className="flex items-baseline flex-wrap">
                  <span className="text-[#FAF8F5] mr-3 sm:mr-4">
                    FEELS
                  </span>
                  <span className="italic font-normal text-[#E8A856] tracking-normal font-serif drop-shadow-[0_0_24px_rgba(232,168,86,0.35)]">
                    Right
                  </span>
                </span>
              </h1>

              {/* Supporting Paragraph: Clean modern sans-serif, ivory-white text directly over dark gradient */}
              <div className="max-w-md sm:max-w-lg mb-8">
                <p className="text-sm sm:text-base text-cream-100/90 font-sans font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                  Discover local food spots, explore real menus, compare prices, and find your next favourite bite.
                </p>
              </div>

              {/* Primary CTA: MANU SEARCH -> in warm golden-amber */}
              <div className="flex items-center mb-8 sm:mb-10">
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="group inline-flex items-center justify-center bg-[#D98A48] hover:bg-[#E59755] active:bg-[#C87D3E] text-[#1A1817] font-sans font-bold text-xs sm:text-sm uppercase tracking-widest px-8 sm:px-10 py-3.5 sm:py-4 rounded-md transition-all shadow-xl hover:shadow-[#D98A48]/35 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                >
                  <span>MANU SEARCH</span>
                  <ArrowRight className="w-4 h-4 ml-3 transition-transform group-hover:translate-x-1.5 text-[#1A1817] stroke-[2.5]" />
                </button>
              </div>

              {/* Bottom text: SCROLL TO EXPLORE  ⌄  |  SIX CHAPTERS · ONE CITY */}
              <div className="flex items-center text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-cream-200/60">
                <a
                  href="#chapter-craving"
                  className="group inline-flex items-center space-x-2 text-cream-200/80 hover:text-amber-300 transition-colors py-1 cursor-pointer"
                >
                  <span>SCROLL TO EXPLORE</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                </a>
                <span className="mx-3.5 text-cream-200/30" aria-hidden="true">|</span>
                <span className="text-cream-200/50 tracking-[0.2em]">
                  SIX CHAPTERS · ONE CITY
                </span>
              </div>
            </ScrollReveal>
            </div>

            {/* Removed oversized ManuMania bottom wordmark branding: clamp(3.5rem, 13vw, 13rem) */}
          </motion.div>
      </section>

      {/* =========================================================================
          TYPOGRAPHY INTERLUDE 1
          ========================================================================= */}
      <TypographyMarquee
        direction="left"
        items={[
          { text: 'DISCOVER FOOD', variant: 'gold' },
          { text: 'LOCAL FAVOURITES', variant: 'outlined' },
          { text: 'MENUS AND PRICES', variant: 'solid' },
          { text: 'YOUR NEXT BITE', variant: 'gold' },
          { text: 'STREET FOOD CRAFT', variant: 'solid' },
          { text: 'DUM BIRYANI', variant: 'outlined' },
          { text: 'KATHI ROLLS', variant: 'gold' },
          { text: 'CAST IRON & SMOKE', variant: 'solid' },
          { text: 'ZERO FAKE RATINGS', variant: 'outlined' },
        ]}
      />

      {/* =========================================================================
          CHAPTER II — THE CRAVING
          ========================================================================= */}
      <ChapterSection
        id="chapter-craving"
        chapterNumber="II"
        chapterLabel="The Craving"
        scrimIntensity="deep"
        layout="full"
        className="py-24 sm:py-32"
      >
        <ScrollReveal direction="up" delay={0.06}>
          <EditorialHeading
            chapterNumber="II"
            eyebrow="The Craving"
            title="What the city hungers for, *seasoned by hand.*"
            subtitle="Every neighborhood has its iconic specialty. Explore the distinct culinary disciplines crafted across authentic kitchens."
            size="lg"
            className="mb-16 max-w-2xl"
          />
        </ScrollReveal>

        {/* Alternating editorial food-category storytelling layouts */}
        <div className="space-y-24 sm:space-y-36">
          {/* Segment 1: Kathi Rolls & Tawa Craft (Text Left, Image Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6">
              <ScrollReveal direction="up" delay={0.1}>
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-3">
                  Category 01 · Tawa Gastronomy
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl text-cream-100 font-light leading-tight mb-5">
                  Hand-Rolled Parathas, <span className="italic text-amber-300">seared on cast iron.</span>
                </h3>
                <p className="text-xs sm:text-sm text-cream-200/75 leading-relaxed font-sans mb-6 max-w-lg">
                  Whipped flaky on massive round tawas seasoned over decades. Wrapped around marinated cottage cheese, slow-charred chicken boti, sliced red onions, and house roasted cumin. This is street food elevated to an exacting craft.
                </p>
                <div className="flex items-center space-x-6 text-xs text-cream-200/50 font-sans border-t border-cream-200/10 pt-4">
                  <span>Paneer Kathi Roll</span>
                  <span>·</span>
                  <span>Chicken Egg Roll</span>
                  <span>·</span>
                  <span>Double Mutton Roll</span>
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-6">
              <ScrollReveal direction="left" delay={0.15}>
                <div className="relative rounded-2xl overflow-hidden editorial-card aspect-[4/3] group shadow-2xl">
                  <img
                    src="/images/craving-kathi-roll.jpg"
                    /* fallback: /image-sequence/videp060.jpg */
                    alt="Authentic Kolkata Kathi roll on smoking cast iron tawa"
                    className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.08] transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/90 via-[#0A0807]/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                      Tawa Kitchen · Salt Lake
                    </span>
                    <span className="text-[10px] font-sans text-cream-200/60 uppercase tracking-wider">
                      Single-Estate Spices
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Segment 2: Awadhi Dum Biryani (Image Left, Text Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <ScrollReveal direction="right" delay={0.15}>
                <div className="relative rounded-2xl overflow-hidden editorial-card aspect-[4/3] group shadow-2xl">
                  <img
                    src="/images/craving-dum-biryani.jpg"
                    /* fallback: /image-sequence/videp120.jpg */
                    alt="Simmering copper dum handi with dough crust"
                    className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.08] transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/90 via-[#0A0807]/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                      Dum Handi Sealed in Dough
                    </span>
                    <span className="text-[10px] font-sans text-cream-200/60 uppercase tracking-wider">
                      Mace, Saffron & Potatoes
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2">
              <ScrollReveal direction="up" delay={0.1}>
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-3">
                  Category 02 · Heritage Dum Craft
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl text-cream-100 font-light leading-tight mb-5">
                  Fourteen Minutes Under Dough, <span className="italic text-amber-300">steamed in its own juices.</span>
                </h3>
                <p className="text-xs sm:text-sm text-cream-200/75 leading-relaxed font-sans mb-6 max-w-lg">
                  A legacy born in the royal kitchens of Metiabruz. Long-grain aged Basmati rice layered with melt-in-the-mouth potatoes, tender braised meats, and a drop of meetha attar. Gentle warmth, never overpowering.
                </p>
                <div className="flex items-center space-x-6 text-xs text-cream-200/50 font-sans border-t border-cream-200/10 pt-4">
                  <span>Chicken Dum Biryani</span>
                  <span>·</span>
                  <span>Special Mutton Biryani</span>
                  <span>·</span>
                  <span>Shahi Tukda</span>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Segment 3: Artisan Burgers & Smashes (Text Left, Image Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6">
              <ScrollReveal direction="up" delay={0.1}>
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-3">
                  Category 03 · Craft Kitchen Smashes
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl text-cream-100 font-light leading-tight mb-5">
                  Prime Patties, <span className="italic text-amber-300">crusted on screaming cast iron.</span>
                </h3>
                <p className="text-xs sm:text-sm text-cream-200/75 leading-relaxed font-sans mb-6 max-w-lg">
                  Hand-ground prime cuts smashed ultra-thin on cast iron to create caramelized lacy edges. Toasted brioche, sharp aged cheddar, and house relish. No frozen shortcuts or pre-cooked heat lamps.
                </p>
                <div className="flex items-center space-x-6 text-xs text-cream-200/50 font-sans border-t border-cream-200/10 pt-4">
                  <span>Double Smash Burger</span>
                  <span>·</span>
                  <span>Crispy Truffle Fries</span>
                  <span>·</span>
                  <span>House Aioli</span>
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-6">
              <ScrollReveal direction="left" delay={0.15}>
                <div className="relative rounded-2xl overflow-hidden editorial-card aspect-[4/3] group shadow-2xl">
                  <img
                    src="/images/hero-burger.jpg"
                    alt="Artisan smash burger on craft paper"
                    className="w-full h-full object-cover filter brightness-[0.9] contrast-[1.08] transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/90 via-[#0A0807]/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                      Craft Kitchen · Old Harbour Quarter
                    </span>
                    <span className="text-[10px] font-sans text-cream-200/60 uppercase tracking-wider">
                      Cast-Iron Smashed
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </ChapterSection>

      {/* =========================================================================
          CHAPTER III — THE MENU
          ========================================================================= */}
      <ChapterSection
        id="chapter-menu"
        chapterNumber="III"
        chapterLabel="The Menu"
        scrimIntensity="deep"
        layout="full"
        className="py-24 sm:py-32"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <ScrollReveal direction="up" delay={0.06}>
              <EditorialHeading
                chapterNumber="III"
                eyebrow="The Menu"
                title="The menu, *verified portion by portion.*"
                subtitle="Compare real dish prices across participating kitchens with complete transparency. What you see is what the chef enters—never marked up with commission fees."
                size="lg"
              />
            </ScrollReveal>
          </div>

          {/* Three Transparency Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
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
              <ScrollReveal key={pillar.num} direction="up" delay={0.1 + i * 0.08}>
                <div className="editorial-card p-8 rounded-xl h-full border border-cream-200/10">
                  <span className="font-mono text-xs text-amber-400 block mb-3">
                    {pillar.num} · Clarity
                  </span>
                  <h4 className="font-serif text-xl text-cream-100 font-light mb-3">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-cream-200/65 font-sans leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Real Live Database Dish Cards */}
          <div className="border-t border-cream-200/10 pt-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-1">
                  Indexed Database Offerings
                </span>
                <h4 className="font-serif text-2xl text-cream-100 font-light">
                  Sample Culinary Offerings
                </h4>
              </div>

              <p className="text-xs text-cream-200/50 font-sans max-w-sm">
                Real dishes pulled directly from database records managed by verified Kolkata restaurants.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="editorial-card p-6 rounded-xl animate-pulse space-y-4"
                  >
                    <div className="h-4 bg-cream-100/10 w-2/3" />
                    <div className="h-3 bg-cream-100/10 w-1/2" />
                    <div className="h-6 bg-cream-100/10 w-1/3" />
                  </div>
                ))
              ) : signatureFoods.length > 0 ? (
                signatureFoods.slice(0, 6).map((food, index) => {
                  const lowestPrice =
                    food.variants && food.variants.length > 0
                      ? Math.min(...food.variants.map((v: any) => v.price))
                      : null;

                  return (
                    <ScrollReveal
                      key={food.id}
                      direction="up"
                      delay={0.06 * index}
                    >
                      <div className="editorial-card p-6 rounded-xl h-full flex flex-col justify-between border border-cream-200/12">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-semibold ${
                                food.veg_type === 'veg'
                                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                              }`}
                            >
                              {food.veg_type === 'veg' ? 'Pure Veg' : 'Non-Veg'}
                            </span>

                            {food.restaurant && (
                              <span className="text-[11px] text-cream-200/50 font-sans truncate ml-2">
                                {food.restaurant.area || 'Kolkata'}
                              </span>
                            )}
                          </div>

                          <h5 className="font-serif text-lg text-cream-100 mb-1.5 font-normal">
                            {food.name}
                          </h5>

                          {food.restaurant && (
                            <p className="text-xs text-cream-200/60 font-sans mb-4">
                              at {food.restaurant.name}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-cream-200/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-cream-200/40 block">
                              Starting at
                            </span>
                            <span className="font-serif text-base text-amber-300 font-normal">
                              {lowestPrice !== null ? `₹${lowestPrice}` : 'Market Rate'}
                            </span>
                          </div>

                          <span className="text-[10px] font-sans text-cream-200/40 uppercase tracking-wider">
                            Verified Menu
                          </span>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })
              ) : null}
            </div>
          </div>
        </div>
      </ChapterSection>

      {/* =========================================================================
          TYPOGRAPHY INTERLUDE 2
          ========================================================================= */}
      <TypographyMarquee
        direction="right"
        items={[
          { text: 'MENUS AND PRICES', variant: 'gold' },
          { text: 'LOCAL FAVOURITES', variant: 'outlined' },
          { text: 'FOOD AROUND YOU', variant: 'solid' },
          { text: 'DIRECT PORTION PRICES', variant: 'solid' },
          { text: 'DISCOVER FOOD', variant: 'gold' },
          { text: 'HONEST KITCHENS', variant: 'solid' },
          { text: 'YOUR NEXT BITE', variant: 'outlined' },
          { text: 'LIVE DIGITAL MENUS', variant: 'solid' },
          { text: 'ZERO MARKUPS', variant: 'outlined' },
        ]}
      />

      {/* =========================================================================
          CHAPTER IV — THE FOOD GALLERY
          ========================================================================= */}
      <ChapterSection
        id="chapter-gallery"
        chapterNumber="IV"
        chapterLabel="The Food Gallery"
        scrimIntensity="deep"
        layout="full"
        className="py-24 sm:py-32"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <ScrollReveal direction="up" delay={0.06}>
              <EditorialHeading
                chapterNumber="IV"
                eyebrow="The Food Gallery"
                title="Atmosphere, *iron, and heritage.*"
                subtitle="A visual chronicle of Kolkata dining. From twilight storefronts and flaming woks to quiet tables and hand-finished plates."
                size="lg"
              />
            </ScrollReveal>
          </div>

          {/* Composed Gallery Grid with Restrained Depth and Captions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                src: '/images/chapter5-quarter.jpg',
                title: 'The Storefront at Dusk',
                desc: 'Warm vintage streetlamps, colonial facades, and bustling neighbourhood eateries.',
                badge: 'Exterior',
              },
              {
                src: '/images/craving-kathi-roll.jpg',
                title: 'Cast-Iron Flame & Sear',
                desc: 'Fourteen minutes on seasoned pans with direct flame, flaky parathas, and spiced meats.',
                badge: 'The Fire',
              },
              {
                src: '/images/hero-burger.jpg',
                title: 'The Hand-Crafted Smash',
                desc: 'Crusted patties layered on wax parchment with fresh brioche and aged cheddar.',
                badge: 'Craft Patty',
              },
              {
                src: '/images/gallery-momos.jpg',
                title: 'Plating & Portion Finish',
                desc: 'Artisanal steamed momos assembled and checked individually before service.',
                badge: 'The Pass',
              },
              {
                src: '/images/chapter6-atmosphere.jpg',
                title: 'The Dining Room Atmosphere',
                desc: 'Neighbourhood gathering spaces where warm amber lanterns bring people together.',
                badge: 'Dining Space',
              },
              {
                src: '/images/craving-dum-biryani.jpg',
                title: 'The Preparation Hearth',
                desc: 'Stone-ground spices, sealed dough handis, and continuous heritage culinary rhythm.',
                badge: 'The Hearth',
              },
            ].map((item, idx) => (
              <ScrollReveal key={idx} direction="up" delay={0.08 * idx}>
                <div className="editorial-card rounded-2xl overflow-hidden group relative flex flex-col justify-between shadow-2xl h-full border border-cream-200/12">
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover filter brightness-[0.88] contrast-[1.08] transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120E0C] via-transparent to-transparent pointer-events-none" />
                    <span className="absolute top-4 left-4 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-amber-300 border border-cream-200/10">
                      {item.badge}
                    </span>
                  </div>

                  <div className="p-6">
                    <h5 className="font-serif text-xl text-cream-100 font-light mb-2">
                      {item.title}
                    </h5>
                    <p className="text-xs text-cream-200/60 font-sans leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ChapterSection>

      {/* =========================================================================
          CHAPTER V — AROUND YOU
          ========================================================================= */}
      <ChapterSection
        id="chapter-around-you"
        chapterNumber="V"
        chapterLabel="Around You"
        /* bgImage="/images/chapter5-quarter.jpg" */
        scrimIntensity="deep"
        layout="full"
        className="py-24 sm:py-32"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <ScrollReveal direction="up" delay={0.06}>
              <EditorialHeading
                chapterNumber="V"
                eyebrow="Around You"
                title="Discover what cooks *around your corner.*"
                subtitle="From heritage kitchens in Park Street to buzzing street avenues in Salt Lake and New Town, verified food shops are closer than you think."
                size="lg"
              />
            </ScrollReveal>
          </div>

          {/* Quarter Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
            {[
              {
                quarter: 'Park Street Quarter',
                highlight: 'Heritage Dining & Awadhi Dum Biryani',
                desc: 'Centuries of culinary history. Fragrant saffron rice, slow-braised meats, and iconic tea rooms with historic dignity.',
              },
              {
                quarter: 'Salt Lake Quarter',
                highlight: 'Artisan Kathi Rolls & Contemporary Tawas',
                desc: 'Thriving street gastronomy, sizzling iron tawas, hand-pulled breads, and bustling evening food corridors.',
              },
              {
                quarter: 'New Town Quarter',
                highlight: 'Late-Night Kitchens & Cafe Smashes',
                desc: 'Modern craft burger bars, fusion street food, cloud bakeries, and vibrant quick-service kitchens.',
              },
            ].map((q, i) => (
              <ScrollReveal key={q.quarter} direction="up" delay={0.1 + i * 0.08}>
                <div className="editorial-card p-8 rounded-xl h-full border border-cream-200/10">
                  <span className="font-mono text-[10px] text-amber-400 tracking-widest uppercase block mb-3">
                    Locality Spotlight
                  </span>
                  <h4 className="font-serif text-2xl text-cream-100 font-light mb-2">
                    {q.quarter}
                  </h4>
                  <p className="text-xs text-amber-300/90 font-sans font-medium mb-3">
                    {q.highlight}
                  </p>
                  <p className="text-xs text-cream-200/65 font-sans leading-relaxed">
                    {q.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Real Approved Shops Highlight */}
          {approvedRestaurants.length > 0 && (
            <div className="border-t border-cream-200/10 pt-12">
              <div className="mb-8">
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-1">
                  Verified Local Establishments
                </span>
                <h4 className="font-serif text-2xl text-cream-100 font-light">
                  Active Food Shops in {selectedLocation}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {approvedRestaurants.slice(0, 3).map((restaurant, idx) => {
                  const isOpen = restaurant.openingStatus?.isOpen;
                  return (
                    <ScrollReveal key={restaurant.id} direction="up" delay={0.08 * idx}>
                      <Link
                        to={`/restaurant/${restaurant.slug}`}
                        className="editorial-card p-6 rounded-xl block group hover:border-amber-400/50 transition-all border border-cream-200/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase font-semibold ${
                              isOpen
                                ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                                : 'text-cream-200/60 bg-cream-200/10 border border-cream-200/15'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-cream-200/40'
                              }`}
                            />
                            <span>{isOpen ? 'Open Now' : 'Closed'}</span>
                          </span>

                          <span className="text-[10px] font-sans uppercase tracking-widest text-amber-400 font-semibold">
                            Verified
                          </span>
                        </div>

                        <h5 className="font-serif text-xl text-cream-100 group-hover:text-amber-300 transition-colors mb-1 font-normal">
                          {restaurant.name}
                        </h5>

                        <p className="text-xs text-cream-200/60 font-sans flex items-center space-x-1 mb-4">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span className="truncate">{restaurant.area}, {restaurant.city}</span>
                        </p>

                        <div className="pt-3 border-t border-cream-200/10 flex items-center justify-between text-xs text-amber-300 group-hover:text-amber-200">
                          <span>View Menu</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ChapterSection>

      {/* =========================================================================
          TYPOGRAPHY INTERLUDE 3
          ========================================================================= */}
      <TypographyMarquee
        direction="left"
        items={[
          { text: 'YOUR NEXT BITE', variant: 'gold' },
          { text: 'DISCOVER FOOD', variant: 'outlined' },
          { text: 'LOCAL FAVOURITES', variant: 'solid' },
          { text: 'MENUS AND PRICES', variant: 'gold' },
          { text: 'VERIFIED KITCHENS', variant: 'solid' },
          { text: 'EXPLORE SHOPS', variant: 'outlined' },
        ]}
      />

      {/* =========================================================================
          CHAPTER VI — YOUR NEXT BITE (The Grand Conversion Point)
          ========================================================================= */}
      <ChapterSection
        id="chapter-next-bite"
        chapterNumber="VI"
        chapterLabel="Your Next Bite"
        /* bgImage="/images/chapter6-atmosphere.jpg" */
        scrimIntensity="deep"
        layout="centered"
        className="py-28 sm:py-40 relative"
      >
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal direction="up" delay={0.06}>
            {/* Small uppercase chapter label */}
            <div className="inline-flex items-center space-x-2.5 mb-5 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="chapter-label text-[10px] sm:text-[11px] text-amber-400 font-semibold tracking-[0.25em] uppercase">
                Chapter VI — Your Next Bite
              </span>
            </div>

            {/* Exactly formatted headline */}
            <h2
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1] text-cream-100 mb-6 drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]"
            >
              Your next favourite bite is{' '}
              <span
                className="italic font-normal bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent inline-block"
                style={{
                  filter: 'drop-shadow(0 0 24px rgba(251, 191, 36, 0.38))',
                }}
              >
                closer than you think.
              </span>
            </h2>

            {/* Exactly formatted supporting paragraph */}
            <p className="text-sm sm:text-base text-cream-200/80 font-sans leading-relaxed max-w-xl mx-auto mb-10">
              Discover food menus, compare prices, and find local shops in one place. Search for what you're craving and explore the options around you.
            </p>

            {/* Large, visually prominent, refined rectangular button labelled exactly "Search" */}
            <div className="flex justify-center mb-16">
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="group inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#0A0807] font-sans font-semibold text-sm uppercase tracking-widest px-10 sm:px-12 py-4 sm:py-5 rounded-sm transition-all shadow-2xl hover:shadow-amber-500/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none cursor-pointer"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4 ml-3 transition-transform group-hover:translate-x-1.5 text-[#0A0807]" />
              </button>
            </div>
          </ScrollReveal>

          {/* Business Owner Quiet Invitation */}
          <ScrollReveal direction="up" delay={0.14}>
            <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-xl mx-auto border border-cream-200/10 text-left sm:text-center">
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-2">
                For Food Businesses & Kitchen Owners
              </span>
              <p className="text-xs text-cream-200/70 font-sans leading-relaxed mb-4">
                Own a restaurant or food shop? Register your establishment, manage digital menus, update live portion prices, and configure operating schedules.
              </p>
              <div className="flex items-center justify-start sm:justify-center space-x-4">
                <Link
                  to="/owner/register"
                  className="text-xs font-semibold uppercase tracking-wider text-amber-300 hover:text-amber-200 transition-colors"
                >
                  Register Kitchen →
                </Link>
                <span className="text-cream-200/20">·</span>
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
    </div>
  );
};

export default FoodDiscoveryPage;
