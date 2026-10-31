import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'motion/react';


import { useSEO } from '../../hooks/useSEO';



import { TypographyMarquee } from './TypographyMarquee';
import { ChapterCravingSection } from './ChapterCravingSection';
import { ChapterMenuSection } from './ChapterMenuSection';
import { ChapterShopsSection } from './ChapterShopsSection';
import { ChapterLocationSection } from './ChapterLocationSection';
import { ChapterNextStopSection } from './ChapterNextStopSection';
import { TOTAL_FRAMES, getFrameUrl } from './CinematicScrollSequence';
import { MagneticButton } from "@/components/ui/magnetic-button";

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
  const isClickNavigatingRef = useRef(false);
  const clickNavTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Synchronized active chapter tracking for all chapters (including tall pinned Chapter III)
  useEffect(() => {
    const chapterIds = [
      'chapter-discovery',
      'chapter-craving',
      'chapter-menu',
      'chapter-gallery',
      'chapter-around-you',
      'chapter-next-bite',
    ];

    const updateActiveChapter = () => {
      if (isClickNavigatingRef.current) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // 1. Edge case: At or near the very top of the page
      if (scrollY < 120) {
        setActiveChapter('chapter-discovery');
        return;
      }

      // 2. Edge case: At or near the bottom of the page
      if (scrollY + viewportHeight >= docHeight - 80) {
        setActiveChapter('chapter-next-bite');
        return;
      }

      // 3. Focal point for active chapter detection (35% down the viewport)
      const focalY = viewportHeight * 0.35;

      // 4. Dedicated Chapter III pinned range check:
      // Chapter III is a tall pinned section (~400vh) encompassing both Stage 1 (headline)
      // and Stage 2 (3D carousel). It must remain active as long as its top has reached
      // the focal area and its bottom has not scrolled past.
      const menuEl = document.getElementById('chapter-menu');
      if (menuEl) {
        const menuRect = menuEl.getBoundingClientRect();
        if (menuRect.top <= focalY && menuRect.bottom > focalY) {
          setActiveChapter('chapter-menu');
          return;
        }
      }

      // 5. General check: Find the section currently spanning the focal point
      for (let i = 0; i < chapterIds.length; i++) {
        const id = chapterIds[i];
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= focalY && rect.bottom > focalY) {
          setActiveChapter(id);
          return;
        }
      }

      // 6. Fallback: Last section whose top has crossed the focal point
      let latestPassed = 'chapter-discovery';
      for (let i = 0; i < chapterIds.length; i++) {
        const id = chapterIds[i];
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= focalY) {
          latestPassed = id;
        }
      }
      setActiveChapter(latestPassed);
    };

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateActiveChapter();
        rafId = null;
      });
    };

    updateActiveChapter();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(clickNavTimeoutRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleChapterNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    setActiveChapter(id);
    isClickNavigatingRef.current = true;
    clearTimeout(clickNavTimeoutRef.current);
    clickNavTimeoutRef.current = setTimeout(() => {
      isClickNavigatingRef.current = false;
    }, 1000);

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', `#${id}`);
  };

  useSEO({
    title: 'Find Food, Menus & Prices Near You',
    description:
      'Search local food shops, browse real digital menus, compare portion prices, and check live operating hours with zero fake ratings.',
    canonicalUrl: typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com',
    ogType: 'website',
  });



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
    <div className="min-h-screen bg-[#0A0807] text-cream-100 flex flex-col relative selection:bg-amber-500/30 overflow-x-clip">
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
          { id: 'chapter-next-bite', num: 'VI', label: 'Your Next Food Stop' },
        ].map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              onClick={(e) => handleChapterNavClick(e, ch.id)}
              title={`Chapter ${ch.num}: ${ch.label}`}
              className={`flex items-center justify-center w-6 h-6 rounded-full font-mono text-[10px] transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-[#0A0807] font-bold scale-110 shadow-md shadow-amber-400/30'
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
            {/* 1. Small chapter label fades in */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center space-x-2.5 mb-5 sm:mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              <span className="chapter-label text-xs sm:text-sm text-amber-300 font-medium tracking-[0.25em] uppercase font-mono">
                CHAPTER I — THE DISCOVERY
              </span>
            </motion.div>

            {/* 2. Main headline appears with cinematic word-by-word reveal */}
            <h1
              aria-label="FIND FOOD THAT FEELS Right"
              className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[6.75rem] xl:text-[7.5rem] font-normal tracking-tight leading-[0.92] mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
            >
              {/* Line 1: FIND FOOD */}
              <span className="block overflow-hidden py-1 -my-1">
                <motion.span
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 44, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.75,
                    delay: prefersReducedMotion ? 0 : 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block text-[#FAF8F5] mr-[0.28em] will-change-[transform,opacity,filter]"
                >
                  FIND
                </motion.span>
                <motion.span
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 44, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.75,
                    delay: prefersReducedMotion ? 0 : 0.49,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block text-[#FAF8F5] will-change-[transform,opacity,filter]"
                >
                  FOOD
                </motion.span>
              </span>

              {/* Line 2: THAT */}
              <span className="block overflow-hidden py-1 -my-1">
                <motion.span
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 44, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.75,
                    delay: prefersReducedMotion ? 0 : 0.63,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block text-[#FAF8F5] will-change-[transform,opacity,filter]"
                >
                  THAT
                </motion.span>
              </span>

              {/* Line 3: FEELS Right */}
              <span className="block overflow-hidden pt-1 pb-3 -mt-1 -mb-3 pr-6 -mr-6">
                <span className="flex items-baseline flex-wrap">
                  <motion.span
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 44, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.75,
                      delay: prefersReducedMotion ? 0 : 0.77,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="inline-block text-[#FAF8F5] mr-3 sm:mr-4 will-change-[transform,opacity,filter]"
                  >
                    FEELS
                  </motion.span>
                  <motion.span
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 48, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.82,
                      delay: prefersReducedMotion ? 0 : 0.92,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="inline-block will-change-[transform,opacity,filter]"
                  >
                    <span className="inline-block italic font-normal text-[#E8A856] tracking-normal font-serif drop-shadow-[0_0_24px_rgba(232,168,86,0.35)]">
                      Right
                    </span>
                  </motion.span>
                </span>
              </span>
            </h1>

            {/* 3. Description fades in */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.65,
                delay: prefersReducedMotion ? 0 : 1.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-w-md sm:max-w-lg mb-8"
            >
              <p className="text-sm sm:text-base text-cream-100/90 font-sans font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                Discover local food spots, explore real menus, compare prices, and find your next favourite bite.
              </p>
            </motion.div>

            {/* 4. MANU SEARCH button enters with a gentle slide and fade */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.65,
                delay: prefersReducedMotion ? 0 : 1.48,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center mb-8 sm:mb-10"
            >
              <MagneticButton>
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="group inline-flex items-center justify-center bg-[#D98A48] hover:bg-[#E59755] active:bg-[#C87D3E] text-[#1A1817] font-sans font-bold text-xs sm:text-sm uppercase tracking-widest px-8 sm:px-10 py-3.5 sm:py-4 rounded-md transition-all duration-200 shadow-xl hover:shadow-[#D98A48]/35 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                >
                  <span>MANU SEARCH</span>
                  <ArrowRight className="w-4 h-4 ml-3 transition-transform duration-200 group-hover:translate-x-1.5 text-[#1A1817] stroke-[2.5]" />
                </button>
              </MagneticButton>
            </motion.div>

            {/* 5. Scroll indicator appears last */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.65,
                delay: prefersReducedMotion ? 0 : 1.72,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-cream-200/60"
            >
              <a
                href="#chapter-craving"
                className="group inline-flex items-center space-x-2 text-cream-200/80 hover:text-amber-300 transition-colors py-1 cursor-pointer"
              >
                <span>SCROLL TO EXPLORE</span>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform duration-200" />
              </a>
              <span className="mx-3.5 text-cream-200/30" aria-hidden="true">|</span>
              <span className="text-cream-200/50 tracking-[0.2em]">
                SIX CHAPTERS · ONE CITY
              </span>
            </motion.div>
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
          CHAPTER II — FOLLOW YOUR CRAVINGS
          ========================================================================= */}
      <ChapterCravingSection />
      {/* =========================================================================
          CHAPTER III — EXPLORE THE MENUS
          ========================================================================= */}
      <ChapterMenuSection />


      {/* =========================================================================
          CHAPTER IV — TOP SHOPS NEAR YOU
          ========================================================================= */}
      <ChapterShopsSection />

      {/* =========================================================================
          CHAPTER V — FIND FOOD NEAR YOU
          ========================================================================= */}
      <ChapterLocationSection />


      {/* =========================================================================
          CHAPTER VI — YOUR NEXT FOOD STOP
          ========================================================================= */}
      <ChapterNextStopSection />
    </div>
  );
};

export default FoodDiscoveryPage;
