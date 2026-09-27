import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  ChevronDown,
  Sparkles,
  Compass,
  Loader2,
  ArrowDown,
} from 'lucide-react';

interface MapScrollHeroProps {
  onSearch: (query: string) => void;
  onNearMe: () => void;
  isLocating: boolean;
  locationError: string | null;
  selectedLocation?: string;
  onQuickChipClick?: (term: string) => void;
}

const TOTAL_FRAMES = 100;

const getFrameUrl = (index: number): string => {
  const padded = String(Math.min(Math.max(index, 0), TOTAL_FRAMES - 1)).padStart(3, '0');
  return `/map-sequence/Camera_enters_map_showing_shop_20260927192603_${padded}.jpg`;
};

export const MapScrollHero: React.FC<MapScrollHeroProps> = ({
  onSearch,
  onNearMe,
  isLocating,
  locationError,
  selectedLocation = 'Kolkata',
  onQuickChipClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cache for loaded images
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));

  // Animation & Frame tracking
  const targetFrameRef = useRef<number>(0);
  const currentRenderedFrameRef = useRef<number>(0);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');

  // 1. Draw frame to canvas with aspect ratio preservation (cover) & Retina DPI support
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Find the closest loaded image so we never flash blank
    const targetIdx = Math.min(Math.max(frameIndex, 0), TOTAL_FRAMES - 1);
    let img: HTMLImageElement | null = imagesRef.current[targetIdx];

    if (!img) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (targetIdx - offset >= 0 && imagesRef.current[targetIdx - offset]) {
          img = imagesRef.current[targetIdx - offset];
          break;
        }
        if (targetIdx + offset < TOTAL_FRAMES && imagesRef.current[targetIdx + offset]) {
          img = imagesRef.current[targetIdx + offset];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.naturalWidth || 1920;
    const imgHeight = img.naturalHeight || 1080;

    const canvasRatio = canvasWidth / canvasHeight;
    const imgRatio = imgWidth / imgHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }, []);

  // 2. Handle Canvas Resizing
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    const newWidth = Math.round(rect.width * dpr);
    const newHeight = Math.round(rect.height * dpr);

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      renderFrame(Math.round(currentRenderedFrameRef.current));
    }
  }, [renderFrame]);

  // 3. Progressive image loader: Priority first 20 frames, then remaining
  useEffect(() => {
    let isCancelled = false;

    // First load frame 0 immediately
    const img0 = new Image();
    img0.src = getFrameUrl(0);
    img0.onload = () => {
      if (isCancelled) return;
      imagesRef.current[0] = img0;
      renderFrame(0);
    };

    // Load key milestone frames first (every 5th frame)
    const priorityIndices: number[] = [];
    for (let i = 1; i < TOTAL_FRAMES; i += 4) {
      priorityIndices.push(i);
    }
    // Then fill remaining frames
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      if (!priorityIndices.includes(i)) {
        priorityIndices.push(i);
      }
    }

    // Queue loader with batch concurrency to preserve bandwidth
    let currentIndex = 0;
    const concurrency = 6;

    const loadNext = () => {
      if (isCancelled || currentIndex >= priorityIndices.length) return;
      const idx = priorityIndices[currentIndex++];
      const img = new Image();
      img.src = getFrameUrl(idx);
      img.onload = () => {
        if (isCancelled) return;
        imagesRef.current[idx] = img;
        // If current frame being viewed matches this loaded frame, redraw
        if (Math.round(currentRenderedFrameRef.current) === idx) {
          renderFrame(idx);
        }
        loadNext();
      };
      img.onerror = () => {
        if (isCancelled) return;
        loadNext();
      };
    };

    for (let i = 0; i < concurrency; i++) {
      loadNext();
    }

    return () => {
      isCancelled = true;
    };
  }, [renderFrame]);

  // 4. Resize listener
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 5. Scroll tracking & target frame calculation
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const navOffset = 64;
      const totalScrollable = rect.height - (window.innerHeight - navOffset);

      if (totalScrollable <= 0) return;

      const currentScrolled = -(rect.top - navOffset);
      const progress = Math.min(Math.max(currentScrolled / totalScrollable, 0), 1);
      setScrollProgress(progress);

      const targetIndex = Math.min(
        Math.floor(progress * (TOTAL_FRAMES - 1)),
        TOTAL_FRAMES - 1
      );
      targetFrameRef.current = targetIndex;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 6. Smooth requestAnimationFrame Lerp loop for silky 60fps / 120fps scrubbing
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const diff = targetFrameRef.current - currentRenderedFrameRef.current;
      if (Math.abs(diff) > 0.02) {
        currentRenderedFrameRef.current += diff * 0.28;
        const frameIndex = Math.round(currentRenderedFrameRef.current);
        renderFrame(frameIndex);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  // 7. Autoplay loop
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    const durationMs = 8000; // 8s cinematic glide
    let startTime: number | null = null;

    const container = containerRef.current;
    if (!container) return;

    const startScrollY = window.scrollY;
    const containerTop = container.offsetTop;
    const maxScroll = containerTop + container.offsetHeight - window.innerHeight;

    const step = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const fraction = Math.min(elapsed / durationMs, 1);

      // EaseInOutQuad
      const eased =
        fraction < 0.5
          ? 2 * fraction * fraction
          : 1 - Math.pow(-2 * fraction + 2, 2) / 2;

      const targetY = startScrollY + (maxScroll - startScrollY) * eased;
      window.scrollTo(0, targetY);

      if (fraction < 1 && isPlaying) {
        animId = requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  // Skip animation to restaurants section
  const handleSkipToContent = () => {
    setIsPlaying(false);
    const target = document.getElementById('explore-restaurants-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else if (containerRef.current) {
      const endY =
        containerRef.current.offsetTop +
        containerRef.current.offsetHeight -
        window.innerHeight +
        100;
      window.scrollTo({ top: endY, behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleChipClick = (term: string) => {
    if (onQuickChipClick) {
      onQuickChipClick(term);
    } else {
      onSearch(term);
    }
  };

  // Telemetry Altitude computation
  const getAltitudeText = () => {
    if (scrollProgress < 0.25) return '15,000m • SATELLITE RADAR';
    if (scrollProgress < 0.55) return '3,800m • SECTOR DESCENT';
    if (scrollProgress < 0.8) return '850m • NEIGHBORHOOD GRID';
    return 'GROUND • KITCHENS & MENUS ACTIVE';
  };

  // Narrative Stage Opacity / Transform calculations
  // Stage 1: 0% -> 22%
  const stage1Opacity = Math.max(0, Math.min(1, (0.22 - scrollProgress) / 0.08));
  // Stage 2: 26% -> 50%
  const stage2Opacity =
    scrollProgress >= 0.24 && scrollProgress <= 0.52
      ? Math.sin(((scrollProgress - 0.24) / 0.28) * Math.PI)
      : 0;
  // Stage 3: 54% -> 78%
  const stage3Opacity =
    scrollProgress >= 0.52 && scrollProgress <= 0.78
      ? Math.sin(((scrollProgress - 0.52) / 0.26) * Math.PI)
      : 0;
  // Stage 4: 80% -> 100%
  const stage4Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.8) / 0.1));

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-950 text-white"
      style={{ height: '360vh' }}
    >
      {/* Sticky Viewport */}
      <div className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col justify-between select-none">
        {/* Fullscreen High-DPI Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.92) contrast(1.04)' }}
        />

        {/* Cinematic Vignette & Ambient Gradient Overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-950/85 via-slate-950/20 to-slate-950/95" />
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-slate-950/30 via-slate-950/40 to-slate-950/85" />

        {/* ---------------------------------------------------- */}
        {/* TOP HUD: Telemetry, Radar Status, Controls */}
        {/* ---------------------------------------------------- */}
        <header className="relative z-20 px-4 sm:px-8 pt-5 pb-2 flex items-center justify-between">
          {/* Telemetry Badge */}
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-[#0C0C0C]/85 backdrop-blur-md border border-white/10 text-xs font-mono shadow-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A064] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A064]" />
              </span>
              <span className="text-[#C5A064] font-semibold tracking-[0.2em] text-[11px] uppercase">Kolkata Sector</span>
              <span className="text-white/20">|</span>
              <span className="text-[#F4F2ED]/70 font-medium hidden sm:inline text-[11px] tracking-widest">
                {getAltitudeText()}
              </span>
            </div>
          </div>

          {/* Controls: Skip Intro */}
          <div className="flex items-center space-x-2.5">
            {/* Skip to Content */}
            <button
              type="button"
              onClick={handleSkipToContent}
              className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full bg-[#0C0C0C]/80 hover:bg-[#161616] backdrop-blur-md border border-white/15 text-[11px] font-mono tracking-widest uppercase text-[#F4F2ED]/80 hover:text-white transition-all shadow-lg"
            >
              <span>Explore</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#C5A064]" />
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------- */}
        {/* CENTER STAGE: Dynamic Narrative Storytelling Cards */}
        {/* ---------------------------------------------------- */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pointer-events-none">
          {/* STAGE 1: Welcome & Mission (0% - 22%) */}
          {stage1Opacity > 0.01 && (
            <div
              className="max-w-3xl text-center space-y-5 transition-all duration-300 ease-out p-7 sm:p-10 rounded-3xl forge-card shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
              style={{
                opacity: stage1Opacity,
                transform: `translateY(${(1 - stage1Opacity) * -20}px) scale(${0.96 + stage1Opacity * 0.04})`,
              }}
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0C0C0C]/90 backdrop-blur-md border border-[#C5A064]/40 text-xs font-mono font-medium text-[#C5A064] tracking-[0.25em] uppercase shadow-xl">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A064] animate-spin-slow" />
                <span>Atelier Culinaire • Kolkata Grid</span>
              </div>

              <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] select-none text-[#F4F2ED]">
                <span className="text-outline-black">Every Dish.</span>{' '}
                <span className="italic font-normal text-[#C5A064] text-outline-black">
                  Every Price.
                </span>{' '}
                <span className="text-outline-black">Real Menus.</span>
              </h1>

              <p className="font-sans font-light text-[#F4F2ED]/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed text-shadow-deep">
                A luxury atelier for authentic dining discovery. Verified portion prices, true operating hours, and zero artificial reviews.
              </p>

              <div className="pt-3 flex items-center justify-center">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#080808]/90 backdrop-blur-md border border-white/15 text-[#F4F2ED]/80 font-mono shadow-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A064] animate-ping" />
                  <span className="uppercase text-[10px] font-semibold text-[#F4F2ED] tracking-[0.25em]">
                    Scroll down to explore the city
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: Neighborhood Zoom (26% - 50%) */}
          {stage2Opacity > 0.01 && (
            <div
              className="max-w-xl text-center space-y-4 transition-all duration-300 ease-out p-7 sm:p-9 rounded-3xl forge-card shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
              style={{
                opacity: stage2Opacity,
                transform: `translateY(${(1 - stage2Opacity) * 20}px) scale(${0.95 + stage2Opacity * 0.05})`,
              }}
            >
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#C5A064]/10 border border-[#C5A064]/30 text-[#C5A064] text-[11px] font-mono tracking-widest uppercase shadow-md">
                <MapPin className="w-3 h-3 text-[#C5A064]" />
                <span>02 / Pinpoint Sectors</span>
              </div>

              <h2 className="font-editorial text-3xl sm:text-5xl font-light tracking-tight text-[#F4F2ED] leading-tight text-outline-black">
                From Historic Heritage to Modern Hubs
              </h2>

              <p className="font-sans font-light text-[#F4F2ED]/85 text-xs sm:text-sm leading-relaxed text-shadow-deep">
                Glide over Park Street, Salt Lake, New Town, and hidden alley gems. Accurate coordinates and direct Google Maps navigation for every kitchen.
              </p>
            </div>
          )}

          {/* STAGE 3: Portion Pricing & Hours (54% - 78%) */}
          {stage3Opacity > 0.01 && (
            <div
              className="max-w-xl text-center space-y-4 transition-all duration-300 ease-out p-7 sm:p-9 rounded-3xl forge-card shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
              style={{
                opacity: stage3Opacity,
                transform: `translateY(${(1 - stage3Opacity) * 20}px) scale(${0.95 + stage3Opacity * 0.05})`,
              }}
            >
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#C5A064]/10 border border-[#C5A064]/30 text-[#C5A064] text-[11px] font-mono tracking-widest uppercase shadow-md">
                <Compass className="w-3 h-3 text-[#C5A064]" />
                <span>03 / Price Integrity</span>
              </div>

              <h2 className="font-editorial text-3xl sm:text-5xl font-light tracking-tight text-[#F4F2ED] leading-tight text-outline-black">
                Live Variant Prices & Real Operating Hours
              </h2>

              <p className="font-sans font-light text-[#F4F2ED]/85 text-xs sm:text-sm leading-relaxed text-shadow-deep">
                Know the exact cost before stepping out. Compare Half vs. Full portion prices, dietary tags, and live open/closed indicators.
              </p>
            </div>
          )}

          {/* STAGE 4: Interactive Command Center & Search Hub (80% - 100%) */}
          {stage4Opacity > 0.01 && (
            <div
              className="w-full max-w-3xl pointer-events-auto transition-all duration-300 ease-out"
              style={{
                opacity: stage4Opacity,
                transform: `translateY(${(1 - stage4Opacity) * 25}px) scale(${0.96 + stage4Opacity * 0.04})`,
              }}
            >
              <div className="p-7 sm:p-10 rounded-3xl forge-card shadow-[0_35px_90px_rgba(0,0,0,0.95)] space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#C5A064]/10 border border-[#C5A064]/30 text-[#C5A064] text-[11px] font-mono tracking-widest uppercase shadow-md">
                    <MapPin className="w-3 h-3 text-[#C5A064]" />
                    <span>04 / Arrival • Kitchens Active</span>
                  </div>

                  <h2 className="font-editorial text-3xl sm:text-5xl font-light tracking-tight text-[#F4F2ED] text-outline-black">
                    What are you craving today?
                  </h2>

                  <p className="font-sans font-light text-[#F4F2ED]/80 text-xs sm:text-sm text-shadow-deep">
                    Search dishes, variant prices, or restaurant names in {selectedLocation}.
                  </p>
                </div>

                {/* Primary Interactive Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-[#C5A064] pointer-events-none" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search chicken biryani, momos, kebabs, or restaurant name..."
                      className="w-full pl-12 pr-32 py-4 rounded-xl bg-black/60 hover:bg-black/80 focus:bg-black/90 border border-white/15 focus:border-[#C5A064] text-[#F4F2ED] placeholder-white/40 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-[#C5A064]/30 backdrop-blur-md"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 px-5 py-2.5 rounded-lg bg-[#C5A064] hover:bg-[#d8b577] text-[#080808] font-mono font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                      Search
                    </button>
                  </div>
                </form>

                {/* Quick Filters / Locality Chips */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C5A064] font-semibold">
                      Curated Sectors
                    </span>
                    <button
                      type="button"
                      onClick={onNearMe}
                      disabled={isLocating}
                      className="inline-flex items-center space-x-1.5 font-mono text-[11px] uppercase tracking-wider text-[#C5A064] hover:text-[#d8b577] transition-colors disabled:opacity-50"
                    >
                      {isLocating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5 text-[#C5A064]" />
                      )}
                      <span>{isLocating ? 'Locating...' : 'Use Live GPS'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Near Me', special: true },
                      { label: 'Chicken Biryani' },
                      { label: 'Kebab' },
                      { label: 'Park Street' },
                      { label: 'Salt Lake' },
                      { label: 'New Town' },
                      { label: 'Mutton Rolls' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleChipClick(item.label)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all ${
                          item.special
                            ? 'bg-[#C5A064] text-[#080808] font-bold shadow-lg hover:bg-[#d8b577]'
                            : 'bg-black/60 hover:bg-black/90 text-[#F4F2ED]/70 hover:text-white border border-white/10 hover:border-[#C5A064]/50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {locationError && (
                    <p className="text-xs font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded px-3 py-1.5">
                      {locationError}
                    </p>
                  )}
                </div>

                {/* Downward Transition Anchor */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleSkipToContent}
                    className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-[#F4F2ED]/60 hover:text-white transition-colors"
                  >
                    <span>View Approved Kitchens</span>
                    <ArrowDown className="w-3.5 h-3.5 animate-bounce text-[#C5A064]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* BOTTOM HUD: Scrubber Progress Line & Navigation Hint */}
        {/* ---------------------------------------------------- */}
        <footer className="relative z-20 px-4 sm:px-8 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#F4F2ED]/60">
          {/* Scroll progress bar */}
          <div className="w-full sm:w-80 flex items-center space-x-3">
            <span className="text-[10px] tracking-widest text-[#C5A064]">ALTITUDE</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-[#9A783E] via-[#C5A064] to-[#F4F2ED] transition-all duration-75 rounded-full"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-[#F4F2ED] min-w-[32px]">
              {Math.round(scrollProgress * 100)}%
            </span>
          </div>

          {/* Mouse Scroll Cue */}
          <div className="flex items-center space-x-2 text-[11px] tracking-widest uppercase text-[#F4F2ED]/70">
            {scrollProgress < 0.85 ? (
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-4 border border-[#C5A064]/60 rounded-full flex items-start justify-center p-0.5">
                  <span className="w-0.5 h-1.5 bg-[#C5A064] rounded-full animate-bounce" />
                </span>
                <span>Scroll to scrub timeline</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSkipToContent}
                className="text-[#C5A064] hover:text-[#d8b577] flex items-center space-x-1 uppercase tracking-widest font-semibold"
              >
                <span>Enter Directory</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
