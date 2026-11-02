import React, { useRef } from 'react';
import { motion, useTransform, useReducedMotion, type MotionValue } from 'motion/react';

interface BurgerAssemblyAnimationProps {
  /**
   * Scroll progress of Chapter I (0.0 at top of hero to 1.0 when scrolling to Chapter II)
   */
  scrollProgress: MotionValue<number>;
  className?: string;
}

interface IngredientLayerConfig {
  id: string;
  name: string;
  imageWebp: string;
  imagePng: string;
  // Scroll threshold window [enterStart, enterEnd]
  enterStart: number;
  enterEnd: number;
  // Starting y offset (falling from above) and final resting y in 420px container
  startY: number;
  targetY: number;
  // Natural rotation during descent to 0deg on impact
  startRotate: number;
  // Z-index stacking
  zIndex: number;
  // Contact shadow
  shadowClass: string;
}

const INGREDIENTS: IngredientLayerConfig[] = [
  {
    id: '01_bottom_bun',
    name: 'Toasted Bottom Bun',
    imageWebp: '/images/burger/01_bottom_bun.webp',
    imagePng: '/images/burger/01_bottom_bun.png',
    enterStart: 0.03,
    enterEnd: 0.16,
    startY: -120,
    targetY: 260,
    startRotate: -1.5,
    zIndex: 10,
    shadowClass: 'drop-shadow-[0_16px_20px_rgba(0,0,0,0.7)]',
  },
  {
    id: '02_crispy_onions',
    name: 'Crispy Fried Onion Straws',
    imageWebp: '/images/burger/02_crispy_onions.webp',
    imagePng: '/images/burger/02_crispy_onions.png',
    enterStart: 0.15,
    enterEnd: 0.28,
    startY: -160,
    targetY: 215,
    startRotate: 2.2,
    zIndex: 20,
    shadowClass: 'drop-shadow-[0_8px_12px_rgba(0,0,0,0.55)]',
  },
  {
    id: '03_bottom_patty',
    name: 'First Searing Smash Patty',
    imageWebp: '/images/burger/03_bottom_patty.webp',
    imagePng: '/images/burger/03_bottom_patty.png',
    enterStart: 0.27,
    enterEnd: 0.40,
    startY: -180,
    targetY: 175,
    startRotate: -2.0,
    zIndex: 30,
    shadowClass: 'drop-shadow-[0_10px_14px_rgba(0,0,0,0.6)]',
  },
  {
    id: '04_cheese_slice',
    name: 'Melted Cheddar Cheese Slice',
    imageWebp: '/images/burger/04_cheese_slice.webp',
    imagePng: '/images/burger/04_cheese_slice.png',
    enterStart: 0.39,
    enterEnd: 0.52,
    startY: -190,
    targetY: 145,
    startRotate: 2.8,
    zIndex: 40,
    shadowClass: 'drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]',
  },
  {
    id: '05_top_patty',
    name: 'Second Juicy Smash Patty',
    imageWebp: '/images/burger/05_top_patty.webp',
    imagePng: '/images/burger/05_top_patty.png',
    enterStart: 0.51,
    enterEnd: 0.64,
    startY: -210,
    targetY: 115,
    startRotate: -1.8,
    zIndex: 50,
    shadowClass: 'drop-shadow-[0_10px_14px_rgba(0,0,0,0.6)]',
  },
  {
    id: '06_top_cheese',
    name: 'Melted Cheddar & Secret Sauce',
    imageWebp: '/images/burger/06_top_cheese.webp',
    imagePng: '/images/burger/06_top_cheese.png',
    enterStart: 0.63,
    enterEnd: 0.75,
    startY: -210,
    targetY: 85,
    startRotate: 2.0,
    zIndex: 60,
    shadowClass: 'drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]',
  },
  {
    id: '07_pickles',
    name: 'Crunchy Jalapeño & Dill Pickles',
    imageWebp: '/images/burger/07_pickles.webp',
    imagePng: '/images/burger/07_pickles.png',
    enterStart: 0.74,
    enterEnd: 0.85,
    startY: -230,
    targetY: 60,
    startRotate: -2.5,
    zIndex: 70,
    shadowClass: 'drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]',
  },
  {
    id: '08_top_bun',
    name: 'Golden Glazed Brioche Top Bun',
    imageWebp: '/images/burger/08_top_bun.webp',
    imagePng: '/images/burger/08_top_bun.png',
    enterStart: 0.84,
    enterEnd: 0.94,
    startY: -260,
    targetY: 0,
    startRotate: 1.8,
    zIndex: 80,
    shadowClass: 'drop-shadow-[0_14px_18px_rgba(0,0,0,0.55)]',
  },
];

/**
 * Individual Ingredient Layer connected to Chapter I scroll progress.
 */
const IngredientLayerItem: React.FC<{
  config: IngredientLayerConfig;
  scrollProgress: MotionValue<number>;
}> = ({ config, scrollProgress }) => {
  // Fade in over first 35% of its descent window
  const fadeEnd = config.enterStart + (config.enterEnd - config.enterStart) * 0.35;
  const opacity = useTransform(
    scrollProgress,
    [config.enterStart - 0.01, config.enterStart, fadeEnd],
    [0, 0, 1]
  );

  // Smooth descent with realistic deceleration as it settles on the stack
  const y = useTransform(
    scrollProgress,
    [
      config.enterStart,
      config.enterStart + (config.enterEnd - config.enterStart) * 0.85,
      config.enterEnd,
    ],
    [config.startY, config.targetY + 4, config.targetY]
  );

  // Gentle settling rotation to 0deg
  const rotate = useTransform(
    scrollProgress,
    [config.enterStart, config.enterEnd],
    [config.startRotate, 0]
  );

  // Subtle squash scale on landing (1.0 -> 1.03 -> 1.0)
  const scale = useTransform(
    scrollProgress,
    [
      config.enterStart,
      config.enterStart + (config.enterEnd - config.enterStart) * 0.85,
      config.enterEnd,
    ],
    [0.98, 1.025, 1.0]
  );

  return (
    <motion.div
      style={{
        opacity,
        y,
        rotate,
        scale,
        zIndex: config.zIndex,
      }}
      className={`absolute inset-x-0 top-0 w-full pointer-events-none will-change-[transform,opacity] ${config.shadowClass}`}
    >
      <picture>
        <source srcSet={config.imageWebp} type="image/webp" />
        <img
          src={config.imagePng}
          alt={config.name}
          className="w-full h-auto object-contain block mx-auto select-none"
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </picture>
    </motion.div>
  );
};

export const BurgerAssemblyAnimation: React.FC<BurgerAssemblyAnimationProps> = ({
  scrollProgress,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload all ingredient assets on mount for instantaneous, flicker-free rendering
  React.useEffect(() => {
    const urlsToPreload = [
      ...INGREDIENTS.map((item) => item.imageWebp),
      '/images/burger/assembled_burger.webp',
    ];
    urlsToPreload.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Overall burger assembly container visibility:
  // Starts completely invisible at progress = 0.0 (initial page load)
  // Rapidly fades in once user begins scrolling (0.01 -> 0.04)
  const containerOpacity = useTransform(scrollProgress, [0.0, 0.02, 0.04], [0, 0, 1]);

  // Seamless cross-fade to unified final assembled image at the climax (0.94 -> 0.98)
  const finalImageOpacity = useTransform(scrollProgress, [0.93, 0.96], [0, 1]);
  const layersOpacity = useTransform(scrollProgress, [0.94, 0.97], [1, 0]);

  // Restrained aroma steam rising when burger finishes assembly (0.95 -> 1.0)
  const steamOpacity = useTransform(scrollProgress, [0.93, 0.97], [0, 0.65]);
  const steamY = useTransform(scrollProgress, [0.93, 1.0], [10, -18]);

  // Static fallback for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div
        className={`relative flex items-center justify-center max-w-[420px] w-full select-none ${className}`}
        aria-label="Freshly assembled double patty smash burger"
      >
        <picture>
          <source srcSet="/images/burger/assembled_burger.webp" type="image/webp" />
          <img
            src="/images/burger/assembled_burger.png"
            alt="Double smash burger with melted cheddar cheese and crispy onions"
            className="w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
          />
        </picture>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity: containerOpacity }}
      className={`relative w-full max-w-[410px] xl:max-w-[450px] aspect-[410/420] flex items-center justify-center select-none ${className}`}
      aria-label="Scroll-triggered exploded burger assembly animation"
    >
      {/* Background Soft Ambient Atmosphere Glow behind burger */}
      <div
        className="absolute inset-0 -inset-x-8 rounded-full pointer-events-none z-0 blur-3xl opacity-40 bg-[radial-gradient(ellipse_at_center,rgba(232,168,86,0.22)_0%,rgba(217,138,72,0.08)_50%,transparent_75%)]"
        aria-hidden="true"
      />

      {/* Surface Base Contact Shadow on ground plane */}
      <motion.div
        style={{
          opacity: useTransform(scrollProgress, [0.03, 0.16], [0, 0.85]),
          scaleX: useTransform(scrollProgress, [0.03, 0.16, 0.94], [0.5, 1, 1.08]),
        }}
        className="absolute bottom-2 inset-x-8 h-8 rounded-full bg-black/75 blur-md pointer-events-none z-[5]"
        aria-hidden="true"
      />

      {/* 8 Independent Falling Ingredients */}
      <motion.div
        style={{ opacity: layersOpacity }}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {INGREDIENTS.map((layer) => (
          <IngredientLayerItem
            key={layer.id}
            config={layer}
            scrollProgress={scrollProgress}
          />
        ))}
      </motion.div>

      {/* Final Assembled Climax Moment (Frame 230 render with squish highlights) */}
      <motion.div
        style={{ opacity: finalImageOpacity }}
        className="absolute inset-0 w-full h-full pointer-events-none z-[90] flex items-center justify-center"
      >
        <picture>
          <source srcSet="/images/burger/assembled_burger.webp" type="image/webp" />
          <img
            src="/images/burger/assembled_burger.png"
            alt="Double smash burger complete"
            className="w-full h-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.85)]"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </picture>
      </motion.div>

      {/* Restrained Warm Aroma Whisps rising from freshly grilled burger */}
      <motion.div
        style={{ opacity: steamOpacity, y: steamY }}
        className="absolute -top-10 inset-x-0 flex justify-center pointer-events-none z-[100]"
        aria-hidden="true"
      >
        <svg
          className="w-24 h-20 text-amber-300/40 blur-[1px]"
          viewBox="0 0 100 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M30 70C25 55 40 45 35 30C30 15 45 5 40 0"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M50 75C45 60 60 48 55 35C50 20 62 10 58 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M70 70C65 58 75 45 72 32C68 18 78 8 75 0"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};

export default BurgerAssemblyAnimation;
