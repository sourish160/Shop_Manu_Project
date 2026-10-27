import React, { useEffect, useRef, useCallback } from 'react';
import { useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { TOTAL_FRAMES, getFrameUrl } from './CinematicScrollSequence';

export const SharedCinematicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Track the complete landing-page scroll progress (0.0 at top to 1.0 at bottom)
  const { scrollYProgress } = useScroll();

  // Map complete landing-page scroll progress to available frame range [0, TOTAL_FRAMES - 1]
  // Conceptually: frameIndex = Math.round(progress * (frameCount - 1))
  const mappedFrameIndex = useTransform(scrollYProgress, (progress) =>
    Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1))))
  );

  const currentTargetRef = useRef(0);
  const lastDrawnIndexRef = useRef<number | null>(null);
  const imagePoolRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const inFlightRef = useRef<Set<number>>(new Set());

  /**
   * Cover-fit rendering preserving 1280x720 frame aspect ratio across all display resolutions
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
   * Nearest-neighbor cache lookup to prevent blank screens or flickering during fast scrolls
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

  // Initial load: Preload Frame 0 immediately, followed by coarse keyframes pass
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

  // Global scroll listener mapping full-page scroll progress to frame index [0, 239]
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
    <div
      className="fixed inset-0 w-screen h-screen z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Full-Bleed Hardware-Accelerated HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover filter brightness-[0.84] contrast-[1.08] saturate-[1.05]"
        aria-hidden="true"
      />

      {/* Layered Atmospheric Editorial Lighting & Scrims (Ensures Text/Card Legibility Across All Six Chapters) */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(10, 8, 7, 0.78) 0%, rgba(10, 8, 7, 0.58) 45%, rgba(10, 8, 7, 0.82) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Ambient Warm Amber Artisan Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 75% 45%, rgba(200, 138, 88, 0.12) 0%, rgba(200, 138, 88, 0.02) 60%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle Edge Vignettes */}
      <div
        className="absolute top-0 inset-x-0 h-32 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 8, 7, 0.85) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 inset-x-0 h-36 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(0deg, #0A0807 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
};
