import React, { useEffect } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';

export interface BurgerAssemblyAnimationProps {
  scrollProgress: MotionValue<number>;
  prefersReducedMotion?: boolean | null;
  className?: string;
}

// Preload all burger layer assets for instantaneous rendering
const BURGER_ASSETS = [
  '/images/burger/01-bottom-bun.webp',
  '/images/burger/02-lettuce.webp',
  '/images/burger/03-patty.webp',
  '/images/burger/04-cheese.webp',
  '/images/burger/05-tomato.webp',
  '/images/burger/06-onion.webp',
  '/images/burger/07-sauce.webp',
  '/images/burger/08-top-bun.webp',
  '/images/burger/complete-burger.webp',
];

export const BurgerAssemblyAnimation: React.FC<BurgerAssemblyAnimationProps> = ({
  scrollProgress,
  prefersReducedMotion,
  className = '',
}) => {
  // Preload images into memory
  useEffect(() => {
    BURGER_ASSETS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // =========================================================================
  // SCROLL-DRIVEN TRANSFORM MAPPINGS FOR EACH LAYER
  // Each layer has a designated scroll bracket [enterStart, decelerate, landEnd]:
  // It starts high with negative Y and subtle rotation, decelerates smoothly,
  // lands on the previous layer, and remains securely in place.
  // =========================================================================

  // 1. Bottom Bun: Enters at [0.00, 0.05, 0.09]
  const bunBottomY = useTransform(scrollProgress, [0.00, 0.05, 0.09], [-140, -10, 0]);
  const bunBottomOpacity = useTransform(scrollProgress, [0.00, 0.06], [0.2, 1]);
  const bunBottomRotate = useTransform(scrollProgress, [0.00, 0.09], [-2.5, 0]);

  // 2. Fresh Lettuce: Enters at [0.09, 0.18, 0.22]
  const lettuceY = useTransform(scrollProgress, [0.09, 0.18, 0.22], [-260, -20, 0]);
  const lettuceOpacity = useTransform(scrollProgress, [0.09, 0.15], [0, 1]);
  const lettuceRotate = useTransform(scrollProgress, [0.09, 0.22], [-3.5, 0]);

  // 3. Grilled Patty: Enters at [0.22, 0.31, 0.35]
  const pattyY = useTransform(scrollProgress, [0.22, 0.31, 0.35], [-280, -20, 0]);
  const pattyOpacity = useTransform(scrollProgress, [0.22, 0.27], [0, 1]);
  const pattyRotate = useTransform(scrollProgress, [0.22, 0.35], [2.5, 0]);

  // 4. Melted Cheddar Cheese: Enters at [0.35, 0.44, 0.48]
  const cheeseY = useTransform(scrollProgress, [0.35, 0.44, 0.48], [-280, -18, 0]);
  const cheeseOpacity = useTransform(scrollProgress, [0.35, 0.40], [0, 1]);
  const cheeseRotate = useTransform(scrollProgress, [0.35, 0.48], [-2.5, 0]);

  // 5. Tomato Slices: Enters at [0.48, 0.57, 0.61]
  const tomatoY = useTransform(scrollProgress, [0.48, 0.57, 0.61], [-280, -18, 0]);
  const tomatoOpacity = useTransform(scrollProgress, [0.48, 0.53], [0, 1]);
  const tomatoRotate = useTransform(scrollProgress, [0.48, 0.61], [3, 0]);

  // 6. Onion Rings: Enters at [0.61, 0.70, 0.74]
  const onionY = useTransform(scrollProgress, [0.61, 0.70, 0.74], [-280, -18, 0]);
  const onionOpacity = useTransform(scrollProgress, [0.61, 0.66], [0, 1]);
  const onionRotate = useTransform(scrollProgress, [0.61, 0.74], [-2, 0]);

  // 7. Burger Sauce: Enters at [0.74, 0.82, 0.86]
  const sauceY = useTransform(scrollProgress, [0.74, 0.82, 0.86], [-260, -15, 0]);
  const sauceOpacity = useTransform(scrollProgress, [0.74, 0.79], [0, 1]);
  const sauceRotate = useTransform(scrollProgress, [0.74, 0.86], [1.5, 0]);

  // 8. Top Sesame Bun: Enters at [0.86, 0.92, 0.94]
  const bunTopY = useTransform(scrollProgress, [0.86, 0.92, 0.94], [-320, -20, 0]);
  const bunTopOpacity = useTransform(scrollProgress, [0.86, 0.89], [0, 1]);
  const bunTopRotate = useTransform(scrollProgress, [0.86, 0.94], [-2, 0]);

  // Subtle settling compression squish across the entire stack when top bun lands [0.93, 0.97]
  const stackScaleY = useTransform(
    scrollProgress,
    [0.92, 0.945, 0.97, 1.00],
    [1, 0.97, 1, 1]
  );

  // Final Burger Moment Aura & Steam visibility [0.93, 1.00]
  const finalAuraOpacity = useTransform(scrollProgress, [0.92, 0.95], [0, 1]);
  const steamOpacity = useTransform(scrollProgress, [0.93, 0.96], [0, 0.85]);

  // Ground Pedestal Contact Shadow: expands and deepens as layers stack
  const groundShadowScale = useTransform(scrollProgress, [0.00, 0.94], [0.85, 1.15]);
  const groundShadowOpacity = useTransform(scrollProgress, [0.00, 0.94], [0.45, 0.85]);

  // -------------------------------------------------------------------------
  // REDUCED MOTION FALLBACK: A pristine, static completed burger presentation
  // -------------------------------------------------------------------------
  if (prefersReducedMotion) {
    return (
      <div className={`relative w-full max-w-[480px] sm:max-w-[520px] aspect-[863/699] mx-auto flex items-center justify-center select-none ${className}`}>
        {/* Soft radial glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(232,168,86,0.15)_0%,transparent_70%)] pointer-events-none"
        />
        {/* Ground shadow */}
        <div
          aria-hidden="true"
          className="absolute bottom-2 inset-x-8 h-8 rounded-full bg-black/60 blur-xl pointer-events-none"
        />
        <picture>
          <source srcSet="/images/burger/complete-burger.webp" type="image/webp" />
          <img
            src="/images/burger/complete-burger.png"
            alt="Artisanal ManuMania Burger stacked with brioche buns, fresh lettuce, grilled patty, melted cheddar, tomato slices, onion rings and chef sauce"
            className="w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // INTERACTIVE SCROLL-DRIVEN BURGER ASSEMBLY ANIMATION
  // -------------------------------------------------------------------------
  return (
    <div
      aria-label="Interactive scroll-driven burger assembly animation"
      className={`relative w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] xl:max-w-[560px] aspect-[863/699] mx-auto flex items-center justify-center select-none pointer-events-none ${className}`}
    >
      {/* 0. Ambient Warm Backlight Glow (intensifies at completion) */}
      <motion.div
        style={{ opacity: finalAuraOpacity }}
        aria-hidden="true"
        className="absolute inset-0 -inset-y-10 bg-[radial-gradient(ellipse_75%_65%_at_50%_52%,rgba(232,168,86,0.22)_0%,rgba(217,138,72,0.08)_50%,transparent_75%)] pointer-events-none z-0"
      />

      {/* 0. Ground Contact Pedestal Shadow (beneath bottom bun) */}
      <motion.div
        style={{
          scaleX: groundShadowScale,
          opacity: groundShadowOpacity,
        }}
        aria-hidden="true"
        className="absolute bottom-[-1%] w-[82%] h-8 rounded-[100%] bg-black/80 blur-xl pointer-events-none z-0"
      />

      {/* Subtle floating steam/aroma ribbons at final assembly */}
      <motion.div
        style={{ opacity: steamOpacity }}
        aria-hidden="true"
        className="absolute -top-12 inset-x-0 h-32 flex justify-center items-center pointer-events-none z-30"
      >
        <div className="relative w-48 h-28 opacity-75">
          <span className="burger-steam-wisp wisp-1" />
          <span className="burger-steam-wisp wisp-2" />
          <span className="burger-steam-wisp wisp-3" />
        </div>
      </motion.div>

      {/* =====================================================================
          MAIN BURGER VERTICAL STACK CONTAINER
          Contains all 8 individual ingredient layers with precise z-index,
          drop shadows, and scroll-linked vertical displacement.
          ===================================================================== */}
      <motion.div
        style={{ scaleY: stackScaleY }}
        className="relative w-full h-full origin-bottom z-10"
      >
        {/* -----------------------------------------------------------------
            LAYER 1: BOTTOM BURGER BUN
            Positioned at the base of the stack (y: 540/699 = 77.25%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: bunBottomY,
            opacity: bunBottomOpacity,
            rotate: bunBottomRotate,
            top: '77.25%',
          }}
          className="absolute inset-x-0 w-full z-10 will-change-transform filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)]"
        >
          <picture>
            <source srcSet="/images/burger/01-bottom-bun.webp" type="image/webp" />
            <img
              src="/images/burger/01-bottom-bun.png"
              alt="Golden toasted brioche bottom burger bun"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* -----------------------------------------------------------------
            LAYER 4: MELTED CHEDDAR CHEESE
            Square cheddar slice draping over the hot patty (y: 510/699 = 73.0%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: cheeseY,
            opacity: cheeseOpacity,
            rotate: cheeseRotate,
            top: '73.0%',
          }}
          className="absolute inset-x-0 w-full z-11 will-change-transform filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
        >
          <picture>
            <source srcSet="/images/burger/04-cheese.webp" type="image/webp" />
            <img
              src="/images/burger/04-cheese.png"
              alt="Golden melted cheddar cheese slice"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* -----------------------------------------------------------------
            LAYER 3: GRILLED BURGER PATTY
            Juicy flame-grilled seasoned burger patty (y: 440/699 = 62.95%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: pattyY,
            opacity: pattyOpacity,
            rotate: pattyRotate,
            top: '62.95%',
          }}
          className="absolute inset-x-0 w-full z-12 will-change-transform filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.65)]"
        >
          <picture>
            <source srcSet="/images/burger/03-patty.webp" type="image/webp" />
            <img
              src="/images/burger/03-patty.png"
              alt="Juicy flame-grilled burger beef patty"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* -----------------------------------------------------------------
            LAYER 7: CHEF BURGER SAUCE
            Rich savory drizzle cascading across cutlet (y: 320/699 = 45.78%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: sauceY,
            opacity: sauceOpacity,
            rotate: sauceRotate,
            top: '45.78%',
          }}
          className="absolute inset-x-0 w-full z-13 will-change-transform filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.5)]"
        >
          <picture>
            <source srcSet="/images/burger/07-sauce.webp" type="image/webp" />
            <img
              src="/images/burger/07-sauce.png"
              alt="Rich gourmet chef burger sauce drizzle"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* -----------------------------------------------------------------
            LAYER 6: CRISP ONION RINGS
            Sliced onion rings perching above sauce (y: 280/699 = 40.06%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: onionY,
            opacity: onionOpacity,
            rotate: onionRotate,
            top: '40.06%',
          }}
          className="absolute inset-x-0 w-full z-14 will-change-transform filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]"
        >
          <picture>
            <source srcSet="/images/burger/06-onion.webp" type="image/webp" />
            <img
              src="/images/burger/06-onion.png"
              alt="Crisp fresh sliced onion rings"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* -----------------------------------------------------------------
            LAYER 5: RIPE TOMATO SLICES
            Vibrant red tomato rounds with dewdrops (y: 230/699 = 32.90%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: tomatoY,
            opacity: tomatoOpacity,
            rotate: tomatoRotate,
            top: '32.90%',
          }}
          className="absolute inset-x-0 w-full z-15 will-change-transform filter drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
        >
          <picture>
            <source srcSet="/images/burger/05-tomato.webp" type="image/webp" />
            <img
              src="/images/burger/05-tomato.png"
              alt="Fresh thick-cut juicy ripe tomato slices"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* -----------------------------------------------------------------
            LAYER 2: FRESH CRISP LETTUCE
            Rests atop tomato slices (y: 140/699 = 20.03%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: lettuceY,
            opacity: lettuceOpacity,
            rotate: lettuceRotate,
            top: '20.03%',
          }}
          className="absolute inset-x-0 w-full z-16 will-change-transform filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]"
        >
          <picture>
            <source srcSet="/images/burger/02-lettuce.webp" type="image/webp" />
            <img
              src="/images/burger/02-lettuce.png"
              alt="Fresh ruffled crisp green lettuce leaf"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* -----------------------------------------------------------------
            LAYER 8: TOP SESAME SEED BRIOCHE BUN
            Crown of the burger with glossy crust and golden sesame seeds (y: 0%)
            ----------------------------------------------------------------- */}
        <motion.div
          style={{
            y: bunTopY,
            opacity: bunTopOpacity,
            rotate: bunTopRotate,
            top: '0%',
          }}
          className="absolute inset-x-0 w-full z-20 will-change-transform filter drop-shadow-[0_18px_30px_rgba(0,0,0,0.7)]"
        >
          <picture>
            <source srcSet="/images/burger/08-top-bun.webp" type="image/webp" />
            <img
              src="/images/burger/08-top-bun.png"
              alt="Glossy golden-brown brioche top bun with toasted sesame seeds"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </picture>
        </motion.div>
      </motion.div>

      {/* -----------------------------------------------------------------
          SUBTLE INGREDIENT INDICATOR PILL (Discreet, editorial)
          Fades in as ingredients assemble, showcasing the craftsmanship
          ----------------------------------------------------------------- */}
      <motion.div
        style={{ opacity: finalAuraOpacity }}
        aria-hidden="true"
        className="absolute -bottom-6 right-2 sm:right-4 z-25 pointer-events-none"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#120E0C]/85 border border-amber-400/30 backdrop-blur-md shadow-xl text-[10px] font-mono tracking-widest text-amber-300 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>8-Layer Stack Complete</span>
        </div>
      </motion.div>
    </div>
  );
};

export default BurgerAssemblyAnimation;
