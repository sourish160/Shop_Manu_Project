import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { FoodDecorationItem } from '../../data/foodDecorationsConfig';

interface FloatingFoodItemProps {
  item: FoodDecorationItem;
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const FloatingFoodItem: React.FC<FloatingFoodItemProps> = ({
  item,
  containerRef,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const elementRef = useRef<HTMLDivElement>(null);

  // Scroll parallax tracking (either relative to container or window)
  const { scrollYProgress } = useScroll({
    target: containerRef || elementRef,
    offset: ['start end', 'end start'],
  });

  // Calculate subtle parallax drift
  const parallaxOffset = (item.parallaxSpeed ?? 15) * 1.5;
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    [parallaxOffset, -parallaxOffset]
  );

  // Organic floating animation loops
  const floatDuration = item.floatDuration || 7;
  const floatOffset = item.floatOffset || 10;
  const rotateRange = item.rotateRange || [-2, 2];

  const floatingAnimation = prefersReducedMotion
    ? {}
    : {
        y: [-floatOffset, floatOffset, -floatOffset],
        rotate: [rotateRange[0], rotateRange[1], rotateRange[0]],
        x: [-3, 3, -3],
        transition: {
          duration: floatDuration,
          repeat: Infinity,
          ease: 'easeInOut' as const,
          delay: item.delay || 0,
        },
      };

  // Depth-specific styling
  const depthStyles = {
    foreground: 'z-20 opacity-95 hover:opacity-100',
    midground: 'z-10 opacity-90',
    background: 'z-0 opacity-75',
  }[item.depth || 'midground'];

  // Responsive display rules
  const responsiveClasses = item.hideBelowLg
    ? 'hidden lg:block'
    : item.hideOnMobile
    ? 'hidden sm:block'
    : 'block';

  return (
    <motion.div
      ref={elementRef}
      style={{
        y: prefersReducedMotion ? 0 : parallaxY,
      }}
      className={`absolute pointer-events-none select-none ${item.positionClasses} ${depthStyles} ${responsiveClasses} ${className}`}
      aria-hidden="true"
    >
      <motion.div
        animate={floatingAnimation}
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.8,
          delay: item.delay || 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`relative ${item.sizeClasses} will-change-transform`}
      >
        {/* Soft atmospheric ambient glow behind the cutout */}
        <div
          className="absolute inset-0 scale-90 blur-2xl rounded-full bg-amber-500/10 pointer-events-none -z-10"
          aria-hidden="true"
        />

        {/* High-Resolution Transparent PNG Cutout */}
        <img
          src={item.image}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)] transition-transform duration-500"
          style={{
            imageRendering: '-webkit-optimize-contrast',
          }}
          onError={(e) => {
            // Gracefully hide if asset is missing without breaking surrounding layout
            e.currentTarget.style.display = 'none';
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingFoodItem;
