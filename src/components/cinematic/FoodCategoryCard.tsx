import React, { useRef, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { CravingCategory, CRAVING_IMAGE_MAP } from './cravingAssets';

interface FoodCategoryCardProps {
  category: CravingCategory;
  onCategoryClick: (category: CravingCategory) => void;
  onDishClick: (e: React.MouseEvent, dishName: string) => void;
  minHeightClass?: string;
  headlineSizeClass?: string;
  taglineClampClass?: string;
  badgeIcon?: React.ReactNode;
  badgeClassName?: string;
  ctaText?: string;
  customCtaButton?: React.ReactNode;
  extraOverlay?: React.ReactNode;
  className?: string;
}

/**
 * Premium 3D Tilt Card Component for ManuMania Food Categories
 * - Subtle perspective-based 3D rotation (max ~6 deg)
 * - Dynamic golden specular highlight / sheen following cursor
 * - Responsive dynamic drop shadow shifting counter-tilt
 * - Subtle translateZ depth layering for badges, typography, and dish chips
 * - Zero React re-rendering on pointer move via requestAnimationFrame
 * - Automatic graceful fallback on touch devices and prefers-reduced-motion
 */
export const FoodCategoryCard: React.FC<FoodCategoryCardProps> = ({
  category,
  onCategoryClick,
  onDishClick,
  minHeightClass = 'min-h-[400px] sm:min-h-[440px]',
  headlineSizeClass = 'text-2xl sm:text-3xl',
  taglineClampClass = 'line-clamp-2',
  badgeIcon,
  badgeClassName,
  ctaText,
  customCtaButton,
  extraOverlay,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
    currentShadowY: 12,
    currentGlareOpacity: 0,
    targetRotateX: 0,
    targetRotateY: 0,
    targetTranslateY: 0,
    targetShadowX: 0,
    targetShadowY: 12,
    targetGlareOpacity: 0,
    glareX: 50,
    glareY: 50,
    sheenAngle: 120,
    rafId: null as number | null,
    isTouchOrReducedMotion: false,
  });

  // Check touch and reduced motion once on mount and on media query change
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

  // Butter-smooth RAF render loop with linear interpolation (damping)
  const stepAnimation = useCallback(() => {
    const s = animState.current;
    const card = cardRef.current;
    const glare = glareRef.current;
    const sheen = sheenRef.current;

    if (!card) return;

    // Responsive lerp damping factor: 0.12 provides smooth physical momentum
    const factor = 0.12;

    s.currentRotateX += (s.targetRotateX - s.currentRotateX) * factor;
    s.currentRotateY += (s.targetRotateY - s.currentRotateY) * factor;
    s.currentTranslateY += (s.targetTranslateY - s.currentTranslateY) * factor;
    s.currentShadowX += (s.targetShadowX - s.currentShadowX) * factor;
    s.currentShadowY += (s.targetShadowY - s.currentShadowY) * factor;
    s.currentGlareOpacity += (s.targetGlareOpacity - s.currentGlareOpacity) * factor;

    // Apply 3D perspective transform
    card.style.transform = `perspective(1000px) rotateX(${s.currentRotateX.toFixed(2)}deg) rotateY(${s.currentRotateY.toFixed(2)}deg) translateY(${s.currentTranslateY.toFixed(2)}px)`;

    // Apply physically responding shadow
    const amberGlow = s.isHovered ? 0.14 : 0.04;
    card.style.boxShadow = `${s.currentShadowX.toFixed(1)}px ${s.currentShadowY.toFixed(1)}px 34px -4px rgba(0, 0, 0, 0.75), 0 0 24px rgba(245, 158, 11, ${amberGlow})`;

    // Apply cursor-following golden specular highlight
    if (glare) {
      glare.style.background = `radial-gradient(circle 340px at ${s.glareX.toFixed(1)}% ${s.glareY.toFixed(1)}%, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.07) 40%, transparent 75%)`;
      glare.style.opacity = s.currentGlareOpacity.toFixed(2);
    }

    // Apply dynamic surface reflection angle
    if (sheen) {
      sheen.style.background = `linear-gradient(${s.sheenAngle}deg, transparent 25%, rgba(254, 243, 199, 0.06) 50%, transparent 75%)`;
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
      // Snapped to exact resting state
      s.currentRotateX = 0;
      s.currentRotateY = 0;
      s.currentTranslateY = 0;
      s.currentShadowX = 0;
      s.currentShadowY = 12;
      s.currentGlareOpacity = 0;
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      card.style.boxShadow = '0 12px 30px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(254, 243, 199, 0.1)';
      if (glare) glare.style.opacity = '0';
      if (sheen) sheen.style.opacity = '0';
      s.rafId = null;
    }
  }, []);

  const startLoopIfNeeded = useCallback(() => {
    if (!animState.current.rafId) {
      animState.current.rafId = requestAnimationFrame(stepAnimation);
    }
  }, [stepAnimation]);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (animState.current.isTouchOrReducedMotion || e.pointerType === 'touch') return;

    const s = animState.current;
    s.isHovered = true;
    s.targetTranslateY = -6; // Subtle 6px hover elevation
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

    // Normalize from -1 to 1 relative to card's center
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // Restrained maximum rotation of 5.5 to 6.0 degrees
    const MAX_TILT = 5.8;

    const s = animState.current;
    s.targetRotateX = -normY * MAX_TILT;
    s.targetRotateY = normX * MAX_TILT;
    s.targetShadowX = -normX * 14;
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
    s.targetShadowY = 12;
    s.targetGlareOpacity = 0;

    if (!s.isTouchOrReducedMotion) {
      startLoopIfNeeded();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${className}`}
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={() => onCategoryClick(category)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCategoryClick(category);
          }
        }}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-label={`Explore ${category.title} category`}
        className={`group relative block w-full h-full ${minHeightClass} rounded-2xl sm:rounded-3xl overflow-hidden bg-[#120E0C]/90 border border-cream-200/10 hover:border-amber-400/50 shadow-2xl cursor-pointer text-left flex flex-col justify-between p-6 sm:p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 will-change-transform`}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'border-color 0.4s ease',
        }}
      >
        {/* =====================================================================
            1. BACKGROUND PHOTOGRAPHY & SCRIM GRADIENTS (Subtle Depth Base)
            ===================================================================== */}
        <div
          className="absolute inset-0 z-0 overflow-hidden rounded-2xl sm:rounded-3xl"
          aria-hidden="true"
          style={{ transform: 'translateZ(0px)' }}
        >
          <img
            src={category.image}
            alt={category.alt}
            className={`w-full h-full object-cover ${category.position} brightness-[0.82] contrast-[1.08] saturate-[1.08] group-hover:brightness-[0.92] group-hover:scale-[1.03] transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
            loading={category.role === 'hero-portrait' || category.role === 'hero-landscape' ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => {
              const fallbackMap: Record<string, string> = {
                'street-food': CRAVING_IMAGE_MAP.streetFood,
                biryani: CRAVING_IMAGE_MAP.biryani,
                snacks: CRAVING_IMAGE_MAP.snacks,
                meals: CRAVING_IMAGE_MAP.meals,
                sweets: CRAVING_IMAGE_MAP.sweets,
                beverages: CRAVING_IMAGE_MAP.beverages,
                desserts: CRAVING_IMAGE_MAP.desserts,
              };
              const fallback = fallbackMap[category.id] || CRAVING_IMAGE_MAP.streetFood;
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />

          {/* Layered Scrim Gradients for Absolute Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/55 via-50% to-[#0A0807]/20 transition-opacity duration-500 group-hover:from-[#0A0807]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0807]/60 via-transparent to-transparent" />

          {/* Optional Specialty Overlay (e.g., Warm Radial Radiance on Biryani) */}
          {extraOverlay}

          {/* Ambient Amber Glow Border Sheen on Hover */}
          <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>

        {/* =====================================================================
            2. DYNAMIC 3D SPECULAR HIGHLIGHT (Pointer Following Golden Sheen)
            ===================================================================== */}
        <div
          ref={glareRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl transition-opacity duration-300 z-20 mix-blend-screen"
          style={{
            opacity: 0,
            transform: 'translateZ(2px)',
          }}
        />

        {/* Dynamic Angled Sheen Overlay */}
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl transition-opacity duration-300 z-20 mix-blend-overlay"
          style={{
            opacity: 0,
            transform: 'translateZ(3px)',
          }}
        />

        {/* =====================================================================
            3. CARD HEADER METADATA (Floats with subtle translateZ in 3D space)
            ===================================================================== */}
        <div
          className="relative z-10 flex items-center justify-end"
          style={{ transform: 'translateZ(18px)' }}
        >
          <span
            className={
              badgeClassName ||
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A0807]/75 backdrop-blur-md border border-cream-200/15 font-mono text-[10px] tracking-widest text-amber-300 uppercase shadow-sm'
            }
          >
            {badgeIcon}
            <span>{category.curatorBadge}</span>
          </span>
        </div>

        {/* =====================================================================
            4. CARD FOOTER CONTENT & INTERACTIVE DISH PILLS (translateZ 22px)
            ===================================================================== */}
        <div
          className="relative z-10 flex flex-col space-y-4 pt-14 sm:pt-16"
          style={{ transform: 'translateZ(22px)' }}
        >
          <div>
            <p className={`text-xs sm:text-sm text-cream-200/80 font-sans mb-1.5 ${taglineClampClass} leading-relaxed`}>
              {category.tagline}
            </p>
            <h3 className={`font-serif ${headlineSizeClass} text-cream-100 font-normal tracking-tight group-hover:text-amber-200 transition-colors`}>
              {category.headline}
            </h3>
          </div>

          {/* Interactive Dish Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1" aria-label={`Popular dishes in ${category.title}`}>
            {category.highlightDishes.map((dish) => (
              <button
                key={dish}
                type="button"
                onClick={(e) => onDishClick(e, dish)}
                title={`Search menus for ${dish}`}
                className="px-2.5 py-1 rounded-md bg-cream-100/10 hover:bg-amber-400 hover:text-[#0A0807] border border-cream-100/15 text-cream-200/90 text-[10px] sm:text-[11px] font-mono tracking-wider transition-colors backdrop-blur-sm cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-300 relative z-30"
              >
                {dish}
              </button>
            ))}
          </div>

          {/* Call-to-action link */}
          <div className="pt-2 flex items-center justify-between border-t border-cream-200/15">
            <span className="font-sans text-xs uppercase tracking-wider sm:tracking-widest text-cream-100/90 group-hover:text-amber-300 transition-colors font-semibold">
              {ctaText || `Explore ${category.title} Menus`}
            </span>

            {customCtaButton ? (
              customCtaButton
            ) : (
              <div className="w-8 h-8 rounded-full bg-cream-100/10 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-[#0A0807] text-amber-300 transition-all duration-300 shadow-md">
                <ArrowRight className="w-4 h-4 transition-transform duration-250 ease-out group-hover:translate-x-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
