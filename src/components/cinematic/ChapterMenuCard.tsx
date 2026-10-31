import React, { useRef, useEffect, useCallback } from 'react';
import { Store, ArrowRight } from 'lucide-react';
import { resolveMenuItemImage, MENU_IMAGE_MAP } from './menuAssets';
import { FoodWithRelations } from './ChapterMenuSection';

interface ChapterMenuCardProps {
  item: FoodWithRelations;
  index: number;
  isCenter: boolean;
  lowestPrice: number | null;
  onCardClick: () => void;
  className?: string;
}

/**
 * Premium 3D Tilt Card Component for Chapter III Menu Cards (Inspired by Chapter II)
 * - Subtle perspective-based 3D rotation (up to ~5.8 deg) responding to mouse position
 * - Dynamic golden specular highlight / glare following cursor
 * - Responsive dynamic drop shadow shifting counter-tilt
 * - Multi-layer translateZ depth layering for badges, typography, price, and CTA
 * - Butter-smooth requestAnimationFrame lerp loop with zero React re-renders
 * - Automatic graceful fallback on touch devices and prefers-reduced-motion
 */
export const ChapterMenuCard: React.FC<ChapterMenuCardProps> = ({
  item,
  index,
  isCenter,
  lowestPrice,
  onCardClick,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  // Animation state tracking (persists without triggering React re-renders)
  const animState = useRef({
    isHovered: false,
    currentRotateX: 0,
    currentRotateY: 0,
    currentTranslateY: 0,
    currentShadowX: 0,
    currentShadowY: 14,
    currentGlareOpacity: 0,
    targetRotateX: 0,
    targetRotateY: 0,
    targetTranslateY: 0,
    targetShadowX: 0,
    targetShadowY: 14,
    targetGlareOpacity: 0,
    glareX: 50,
    glareY: 50,
    sheenAngle: 120,
    rafId: null as number | null,
    isTouchOrReducedMotion: false,
  });

  // Check touch and reduced motion capabilities once on mount and on media query change
  useEffect(() => {
    const checkMotionCapability = () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const hasTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      animState.current.isTouchOrReducedMotion = prefersReduced || hasTouchOnly;
    };

    checkMotionCapability();
    const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaTouch = window.matchMedia('(hover: none)');

    mediaReduced.addEventListener('change', checkMotionCapability);
    mediaTouch.addEventListener('change', checkMotionCapability);

    return () => {
      mediaReduced.removeEventListener('change', checkMotionCapability);
      mediaTouch.removeEventListener('change', checkMotionCapability);
      if (animState.current.rafId) {
        cancelAnimationFrame(animState.current.rafId);
      }
    };
  }, []);

  // RAF render loop with linear damping for buttery-smooth momentum
  const stepAnimation = useCallback(() => {
    const s = animState.current;
    const card = cardRef.current;
    const glare = glareRef.current;
    const sheen = sheenRef.current;

    if (!card) return;

    const factor = 0.12;

    s.currentRotateX += (s.targetRotateX - s.currentRotateX) * factor;
    s.currentRotateY += (s.targetRotateY - s.currentRotateY) * factor;
    s.currentTranslateY += (s.targetTranslateY - s.currentTranslateY) * factor;
    s.currentShadowX += (s.targetShadowX - s.currentShadowX) * factor;
    s.currentShadowY += (s.targetShadowY - s.currentShadowY) * factor;
    s.currentGlareOpacity += (s.targetGlareOpacity - s.currentGlareOpacity) * factor;

    // Apply 3D perspective tilt
    card.style.transform = `perspective(1000px) rotateX(${s.currentRotateX.toFixed(2)}deg) rotateY(${s.currentRotateY.toFixed(2)}deg) translateY(${s.currentTranslateY.toFixed(2)}px)`;

    // Apply physically responding shadow + warm golden ambient glow
    const amberGlow = s.isHovered ? (isCenter ? 0.28 : 0.14) : (isCenter ? 0.08 : 0.03);
    card.style.boxShadow = `${s.currentShadowX.toFixed(1)}px ${s.currentShadowY.toFixed(1)}px 36px -4px rgba(0, 0, 0, 0.88), 0 0 28px rgba(245, 158, 11, ${amberGlow})`;

    // Apply cursor-following golden specular highlight
    if (glare) {
      glare.style.background = `radial-gradient(circle 340px at ${s.glareX.toFixed(1)}% ${s.glareY.toFixed(1)}%, rgba(245, 158, 11, 0.24) 0%, rgba(245, 158, 11, 0.08) 40%, transparent 75%)`;
      glare.style.opacity = s.currentGlareOpacity.toFixed(2);
    }

    // Apply dynamic surface reflection angle
    if (sheen) {
      sheen.style.background = `linear-gradient(${s.sheenAngle}deg, transparent 25%, rgba(254, 243, 199, 0.08) 50%, transparent 75%)`;
      sheen.style.opacity = (s.currentGlareOpacity * 0.75).toFixed(2);
    }

    // Continue loop if hovered OR while decaying smoothly back to resting equilibrium
    const isSettled =
      !s.isHovered &&
      Math.abs(s.currentRotateX) < 0.04 &&
      Math.abs(s.currentRotateY) < 0.04 &&
      Math.abs(s.currentTranslateY) < 0.04 &&
      Math.abs(s.currentGlareOpacity) < 0.02;

    if (!isSettled) {
      s.rafId = requestAnimationFrame(stepAnimation);
    } else {
      s.currentRotateX = 0;
      s.currentRotateY = 0;
      s.currentTranslateY = 0;
      s.currentShadowX = 0;
      s.currentShadowY = 14;
      s.currentGlareOpacity = 0;
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      card.style.boxShadow = isCenter
        ? '0 24px 60px -15px rgba(0, 0, 0, 0.92), 0 0 20px rgba(245, 158, 11, 0.08)'
        : '0 24px 60px -15px rgba(0, 0, 0, 0.92)';
      if (glare) glare.style.opacity = '0';
      if (sheen) sheen.style.opacity = '0';
      s.rafId = null;
    }
  }, [isCenter]);

  const startLoopIfNeeded = useCallback(() => {
    if (!animState.current.rafId) {
      animState.current.rafId = requestAnimationFrame(stepAnimation);
    }
  }, [stepAnimation]);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (animState.current.isTouchOrReducedMotion || e.pointerType === 'touch') return;

    const s = animState.current;
    s.isHovered = true;
    s.targetTranslateY = isCenter ? -8 : -4;
    s.targetGlareOpacity = 1;
    startLoopIfNeeded();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (animState.current.isTouchOrReducedMotion || e.pointerType === 'touch') return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // Full 5.8 deg tilt on center card, gentle 2.5 deg tilt on side cards
    const MAX_TILT = isCenter ? 5.8 : 2.5;

    const s = animState.current;
    s.targetRotateX = -normY * MAX_TILT;
    s.targetRotateY = normX * MAX_TILT;
    s.targetShadowX = -normX * 16;
    s.targetShadowY = 14 + normY * 8;
    s.glareX = (x / rect.width) * 100;
    s.glareY = (y / rect.height) * 100;
    s.sheenAngle = 115 + normX * 30;

    startLoopIfNeeded();
  };

  const handlePointerLeave = () => {
    const s = animState.current;
    s.isHovered = false;
    s.targetRotateX = 0;
    s.targetRotateY = 0;
    s.targetTranslateY = 0;
    s.targetShadowX = 0;
    s.targetShadowY = 14;
    s.targetGlareOpacity = 0;

    if (!s.isTouchOrReducedMotion) {
      startLoopIfNeeded();
    }
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick();
        }
      }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-cursor="view"
      style={{
        transformStyle: 'preserve-3d',
        transition: 'border-color 0.4s ease',
      }}
      className={`group relative w-full h-full rounded-3xl overflow-hidden bg-[#120E0C]/90 border flex flex-col justify-between p-5 sm:p-6 ring-1 transition-all duration-500 will-change-transform ${
        isCenter
          ? 'cursor-pointer border-amber-400/40 ring-amber-400/20 hover:border-amber-400/70 hover:ring-amber-400/40'
          : 'cursor-pointer border-cream-200/10 ring-white/[0.04] hover:border-cream-200/20'
      } ${className}`}
    >
      {/* 1. Food Photography Background (translateZ 0px) */}
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
        style={{ transform: 'translateZ(0px)' }}
      >
        <img
          src={resolveMenuItemImage(item)}
          alt={item.name}
          className={`w-full h-full object-cover transition-all duration-700 ease-out will-change-transform ${
            isCenter
              ? 'brightness-[0.82] contrast-[1.1] saturate-[1.1] group-hover:brightness-[0.95] group-hover:scale-[1.05]'
              : 'brightness-[0.6] contrast-[1.05] saturate-[0.9]'
          }`}
          loading={index < 5 ? 'eager' : 'lazy'}
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = MENU_IMAGE_MAP.default;
          }}
        />
        {/* Cinematic Scrim Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/70 via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0807]/75 via-[#0A0807]/15 to-transparent h-28" />

        {/* Warm Hover Spotlight (Center card only) */}
        {isCenter && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(232,168,86,0.2)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-400/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </>
        )}
      </div>

      {/* 2. Dynamic 3D Specular Highlight (Pointer Following Golden Sheen) */}
      <div
        ref={glareRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 z-20 mix-blend-screen"
        style={{
          opacity: 0,
          transform: 'translateZ(2px)',
        }}
      />

      {/* Dynamic Angled Sheen Overlay */}
      <div
        ref={sheenRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 z-20 mix-blend-overlay"
        style={{
          opacity: 0,
          transform: 'translateZ(3px)',
        }}
      />

      {/* 3. Top Labels (Floats with translateZ 14px in 3D Space) */}
      <div
        className="relative z-10 flex items-center justify-between"
        style={{ transform: 'translateZ(14px)' }}
      >
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-amber-300 bg-[#0A0807]/80 border border-amber-400/30 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
          <span>{String(index + 1).padStart(2, '0')}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono font-semibold backdrop-blur-md flex items-center gap-1.5 ${
              item.veg_type === 'veg'
                ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/35'
                : 'text-amber-300 bg-amber-950/70 border border-amber-500/35'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.veg_type === 'veg' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>{item.veg_type === 'veg' ? 'Pure Veg' : 'Non-Veg'}</span>
          </span>

          {item.category?.name && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/85 bg-[#0A0807]/80 backdrop-blur-md border border-cream-200/15 px-2.5 py-1 rounded-full hidden sm:inline-block">
              {item.category.name}
            </span>
          )}
        </div>
      </div>

      {/* 4. Bottom Content Layer (Floats with translateZ 16px in 3D Space) */}
      <div
        className="relative z-10 flex flex-col space-y-2.5 pt-4"
        style={{ transform: 'translateZ(16px)' }}
      >
        <div>
          {item.restaurant && (
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase mb-1.5 text-amber-300/90">
              <div className="w-5 h-5 rounded-md bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Store className="w-3 h-3 text-amber-400" aria-hidden="true" />
              </div>
              <span className="truncate max-w-[240px] font-medium text-amber-200">
                {item.restaurant.name}
              </span>
              {item.restaurant.area && (
                <span className="text-cream-200/50 truncate hidden sm:inline">
                  · {item.restaurant.area}
                </span>
              )}
            </div>
          )}

          <h3 className="font-serif text-xl sm:text-2xl md:text-[1.65rem] text-cream-100 font-normal tracking-tight leading-snug line-clamp-2 drop-shadow-sm">
            {item.name}
          </h3>

          {item.description && isCenter && (
            <p className="text-xs sm:text-[13px] text-cream-200/70 font-sans line-clamp-2 mt-1.5 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Price & CTA Button (Floats with translateZ 20px) */}
        <div
          className="pt-3 border-t border-cream-200/15 flex items-end justify-between gap-3"
          style={{ transform: 'translateZ(20px)' }}
        >
          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-cream-200/50 block mb-0.5">
              Starting from
            </span>
            <span className="font-serif text-xl sm:text-2xl text-amber-300 font-normal tracking-tight">
              {lowestPrice !== null ? `₹${lowestPrice}` : 'Market Price'}
            </span>
          </div>

          {isCenter && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#E8A856] group-hover:from-amber-300 group-hover:to-amber-400 text-[#0A0807] font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-300 shadow-md group-hover:shadow-[0_0_24px_rgba(245,158,11,0.45)] group-hover:scale-[1.03]">
              <span>View Menu</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

