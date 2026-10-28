import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const TOTAL_FRAMES = 240;
export const FRAME_ASPECT_RATIO = 1280 / 720;

/**
 * Returns the URL for a specific zero-padded frame in the sequence.
 * Naming convention: videp000.jpg to videp239.jpg
 */
export function getFrameUrl(index: number): string {
  const clamped = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(index)));
  const padded = String(clamped).padStart(3, '0');
  return `/image-sequence/videp${padded}.jpg`;
}

interface CinematicScrollSequenceProps {
  id?: string;
  className?: string;
  onExploreClick?: () => void;
}

export const CinematicScrollSequence: React.FC<CinematicScrollSequenceProps> = ({
  id = 'chapter-discovery',
  className = '',
  onExploreClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Scroll tracking across the sticky pinned distance (300vh allows natural cinematic pacing)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Track the current frame index
  const [currentFrame, setCurrentFrame] = useState(0);
  const currentTargetRef = useRef(0);
  const lastDrawnIndexRef = useRef<number | null>(null);

  // In-memory cache of loaded image elements
  const imagePoolRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const inFlightRef = useRef<Set<number>>(new Set());

  // Text transitions mapped to scroll progress
  // Scroll-triggered gradient disappearance: Fades out smoothly as visitor scrolls down
  const heroGradientOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Phase 1 (0 -> 0.30): Hero text smoothly fades out and lifts
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15, 0.32], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.32], [0, -45]);
  const heroPointerEvents = useTransform(scrollYProgress, (v) => (v > 0.3 ? 'none' : 'auto'));

  // Phase 2 (0.35 -> 0.75): Atmospheric mid-sequence narrative overlay
  const midStoryOpacity = useTransform(
    scrollYProgress,
    [0.34, 0.44, 0.65, 0.75],
    [0, 1, 1, 0]
  );
  const midStoryY = useTransform(scrollYProgress, [0.34, 0.44, 0.65, 0.75], [30, 0, 0, -30]);

  // Phase 3 (0.80 -> 1.0): Settle cue guiding into Chapter II
  const settleOpacity = useTransform(scrollYProgress, [0.82, 0.92, 1], [0, 1, 1]);

  /**
   * Cover-fit rendering helper preserving 1280x720 aspect ratio without stretching
   */
  const renderFrameToCanvas = useCallback(
    (img: HTMLImageElement, frameIdx: number) => {
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
    },
    []
  );

  /**
   * Finds the closest already-loaded frame in cache to prevent blank screens during fast scrolling
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
   * Loads a specific frame asynchronously and caches it in memory
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

          // If this frame matches the current active target, render immediately
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
   * Resizes canvas to match high-DPI display
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

      // Redraw the current frame after resize
      const targetIdx = currentTargetRef.current;
      const bestIdx = findClosestLoadedFrame(targetIdx);
      if (bestIdx !== null) {
        const img = imagePoolRef.current.get(bestIdx);
        if (img) renderFrameToCanvas(img, bestIdx);
      }
    }
  }, [findClosestLoadedFrame, renderFrameToCanvas]);

  // Initial load: Preload critical Frame 0, then coarse keyframes across the sequence
  useEffect(() => {
    let isMounted = true;

    // 1. Critical path: Load Frame 0 immediately
    loadFrame(0).then((img0) => {
      if (!isMounted || !img0) return;
      resizeCanvas();
      renderFrameToCanvas(img0, 0);

      if (prefersReducedMotion) return;

      // 2. Coarse keyframe pass: Load every 12th frame across sequence
      // This guarantees that any fast swipe will hit a nearby preloaded keyframe within 12 frames
      const coarseKeyframes: number[] = [];
      for (let i = 12; i < TOTAL_FRAMES; i += 12) {
        coarseKeyframes.push(i);
      }
      // Also ensure final frame is in coarse set
      if (!coarseKeyframes.includes(TOTAL_FRAMES - 1)) {
        coarseKeyframes.push(TOTAL_FRAMES - 1);
      }

      // Load coarse keyframes in small batches
      let currentBatch = 0;
      const batchSize = 4;

      function loadNextBatch() {
        if (!isMounted) return;
        const slice = coarseKeyframes.slice(currentBatch, currentBatch + batchSize);
        if (slice.length === 0) return;

        Promise.all(slice.map((idx) => loadFrame(idx))).then(() => {
          currentBatch += batchSize;
          if (currentBatch < coarseKeyframes.length && isMounted) {
            // Schedule next batch on idle/micro-delay to preserve main thread
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

  // Motion Value listener for scroll-driven frame updates
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (prefersReducedMotion) return;

    // Calculate clamped frame index from scroll progress (0 -> TOTAL_FRAMES - 1)
    const targetIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1)))
    );

    currentTargetRef.current = targetIndex;
    setCurrentFrame(targetIndex);

    // 1. Try to render the target frame immediately
    if (imagePoolRef.current.has(targetIndex)) {
      const img = imagePoolRef.current.get(targetIndex)!;
      renderFrameToCanvas(img, targetIndex);
    } else {
      // 2. Target frame is pending: immediately show closest loaded frame (flicker-free)
      const closest = findClosestLoadedFrame(targetIndex);
      if (closest !== null && lastDrawnIndexRef.current !== closest) {
        const fallbackImg = imagePoolRef.current.get(closest)!;
        renderFrameToCanvas(fallbackImg, closest);
      }
      // Trigger target load
      loadFrame(targetIndex);
    }

    // 3. Proximity window preloading: load ahead and behind current scroll position
    // Prioritize upcoming direction
    const lookahead = 8;
    const lookbehind = 4;
    const minWin = Math.max(0, targetIndex - lookbehind);
    const maxWin = Math.min(TOTAL_FRAMES - 1, targetIndex + lookahead);

    for (let i = targetIndex; i <= maxWin; i++) {
      if (!imagePoolRef.current.has(i) && !inFlightRef.current.has(i)) {
        loadFrame(i);
      }
    }
    for (let i = targetIndex - 1; i >= minWin; i--) {
      if (!imagePoolRef.current.has(i) && !inFlightRef.current.has(i)) {
        loadFrame(i);
      }
    }
  });

  return (
    <div
      ref={containerRef}
      id={id}
      aria-label="Chapter I: The Discovery — Cinematic Scroll Experience"
      className={`relative w-full ${
        prefersReducedMotion ? 'min-h-screen' : 'h-[280vh] sm:h-[300vh]'
      } ${className}`}
    >
      {/* Sticky Fullscreen Scene Viewport */}
      <div
        className={
          prefersReducedMotion
            ? 'relative w-full min-h-screen'
            : 'sticky top-0 h-screen w-full overflow-hidden'
        }
      >
        {/* Hardware-Accelerated HTML5 Canvas Renderer */}
        <div className="absolute inset-0 z-0 bg-[#0A0807] overflow-hidden pointer-events-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover filter brightness-[0.88] contrast-[1.08] saturate-[1.05]"
            aria-hidden="true"
          />

          {/* Fallback image for SSR or non-JS environments */}
          <noscript>
            <img
              src="/image-sequence/videp000.jpg"
              alt="ManuMania Food Storefront"
              className="w-full h-full object-cover"
            />
          </noscript>

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

          {/* Layered Cinematic Atmospheric Lighting & Scrims */}
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              background:
                'linear-gradient(90deg, rgba(10, 8, 7, 0.85) 0%, rgba(10, 8, 7, 0.65) 32%, rgba(10, 8, 7, 0.35) 60%, rgba(10, 8, 7, 0.18) 85%, transparent 100%)',
            }}
          />

          {/* Warm Amber Radial Artisan Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 75% 45%, rgba(200, 138, 88, 0.16) 0%, rgba(200, 138, 88, 0.04) 50%, transparent 75%)',
            }}
          />

          {/* Top Edge Vignette */}
          <div
            className="absolute top-0 inset-x-0 h-36 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, #0A0807 0%, rgba(10, 8, 7, 0.6) 45%, transparent 100%)',
            }}
          />

          {/* Bottom Edge Fade for Seamless Blend */}
          <div
            className="absolute bottom-0 inset-x-0 h-40 pointer-events-none"
            style={{
              background:
                'linear-gradient(0deg, #0A0807 0%, rgba(10, 8, 7, 0.75) 50%, transparent 100%)',
            }}
          />
        </div>

        {/* =====================================================================
            STAGE 1: EDITORIAL HEADLINE & INTRODUCTION (Scroll Progress 0 -> 0.30)
            ===================================================================== */}
        <motion.div
          style={{
            opacity: prefersReducedMotion ? 1 : heroOpacity,
            y: prefersReducedMotion ? 0 : heroY,
            pointerEvents: prefersReducedMotion ? 'auto' : heroPointerEvents,
          }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between pt-24 pb-8"
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
                <a
                  href="/search"
                  onClick={onExploreClick ? (e) => { e.preventDefault(); onExploreClick(); } : undefined}
                  className="group inline-flex items-center justify-center bg-[#D98A48] hover:bg-[#E59755] active:bg-[#C87D3E] text-[#1A1817] font-sans font-bold text-xs sm:text-sm uppercase tracking-widest px-8 sm:px-10 py-3.5 sm:py-4 rounded-md transition-all shadow-xl hover:shadow-[#D98A48]/35 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                >
                  <span>MANU SEARCH</span>
                  <ArrowRight className="w-4 h-4 ml-3 transition-transform group-hover:translate-x-1.5 text-[#1A1817] stroke-[2.5]" />
                </a>
              </div>

              {/* Bottom text: SCROLL TO EXPLORE  ⌄  |  SIX CHAPTERS · ONE CITY */}
              <div className="flex items-center text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-cream-200/60">
                <a
                  href="#chapter-craving"
                  onClick={onExploreClick ? (e) => { e.preventDefault(); onExploreClick(); } : undefined}
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

        {/* =====================================================================
            STAGE 2: MID-SEQUENCE CINEMATIC NARRATIVE (Scroll Progress 0.35 -> 0.75)
            ===================================================================== */}
        {!prefersReducedMotion && (
          <motion.div
            style={{
              opacity: midStoryOpacity,
              y: midStoryY,
            }}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-end max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-md border border-cream-200/15 shadow-2xl backdrop-blur-xl bg-[#120E0C]/80">
              <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase tracking-[0.25em] block mb-2">
                Authentic Craft · Frame {String(currentFrame).padStart(3, '0')} / {TOTAL_FRAMES - 1}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-cream-100 tracking-tight leading-snug mb-3">
                From morning prep to night flame.
              </h3>
              <p className="text-xs text-cream-200/75 font-sans leading-relaxed">
                Step inside the authentic kitchens of our city. Each frame captures real culinary rhythm, honest portions, and transparent pricing directly from the kitchen counter.
              </p>
            </div>
          </motion.div>
        )}

        {/* =====================================================================
            STAGE 3: SETTLE CUE GUIDING TO CHAPTER II (Scroll Progress 0.82 -> 1.0)
            ===================================================================== */}
        {!prefersReducedMotion && (
          <motion.div
            style={{
              opacity: settleOpacity,
            }}
            className="absolute bottom-8 inset-x-0 z-20 pointer-events-none flex justify-center"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#120E0C]/90 border border-amber-400/30 text-xs font-mono tracking-widest text-amber-300 uppercase shadow-lg backdrop-blur-md">
              <span>Chapter II · The Craving</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
