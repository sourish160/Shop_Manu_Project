import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

interface ChapterSectionProps {
  id: string;
  chapterNumber?: string;
  chapterLabel?: string;
  bgImage?: string;
  layout?: 'split-left' | 'split-right' | 'centered' | 'full';
  scrimIntensity?: 'light' | 'medium' | 'deep';
  children: React.ReactNode;
  className?: string;
}

export const ChapterSection: React.FC<ChapterSectionProps> = ({
  id,
  chapterNumber,
  chapterLabel,
  bgImage,
  layout = 'split-left',
  scrimIntensity = 'medium',
  children,
  className = '',
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const scrollScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.07, 1.0, 1.07]);
  const scrollY = useTransform(scrollYProgress, [0, 1], ['-2.5%', '2.5%']);

  const getScrimStyles = () => {
    switch (scrimIntensity) {
      case 'light':
        return 'linear-gradient(90deg, rgba(10, 8, 7, 0.88) 0%, rgba(10, 8, 7, 0.72) 40%, rgba(10, 8, 7, 0.35) 75%, rgba(10, 8, 7, 0.2) 100%)';
      case 'deep':
        return 'linear-gradient(90deg, rgba(10, 8, 7, 0.96) 0%, rgba(10, 8, 7, 0.92) 35%, rgba(10, 8, 7, 0.82) 65%, rgba(10, 8, 7, 0.75) 100%)';
      case 'medium':
      default:
        return 'linear-gradient(90deg, rgba(10, 8, 7, 0.94) 0%, rgba(10, 8, 7, 0.88) 30%, rgba(10, 8, 7, 0.6) 55%, rgba(10, 8, 7, 0.32) 80%, rgba(10, 8, 7, 0.18) 100%)';
    }
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={chapterLabel ? `Chapter ${chapterNumber || ''}: ${chapterLabel}` : undefined}
      className={`relative min-h-screen flex flex-col justify-center py-20 sm:py-28 overflow-hidden ${className}`}
    >
      {/* Background Photographic Scene with Restrained Scale & Lighting */}
      {bgImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <motion.div
            className="w-full h-full"
            style={{
              scale: prefersReducedMotion ? 1 : scrollScale,
              y: prefersReducedMotion ? 0 : scrollY,
            }}
          >
            <img
              src={bgImage}
              alt=""
              className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.1] saturate-[1.05]"
              loading="lazy"
              decoding="async"
            />
          </motion.div>

          {/* Layered dark atmospheric gradient for text contrast */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: getScrimStyles() }}
          />

          {/* Ambient warm amber glow from artisan lanterns / fire */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 75% 45%, rgba(200, 138, 88, 0.15) 0%, rgba(200, 138, 88, 0.03) 50%, transparent 75%)',
            }}
          />

          {/* Top subtle vignette */}
          <div
            className="absolute top-0 inset-x-0 h-32 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, #0A0807 0%, rgba(10, 8, 7, 0.5) 50%, transparent 100%)',
            }}
          />

          {/* Bottom subtle vignette */}
          <div
            className="absolute bottom-0 inset-x-0 h-40 pointer-events-none"
            style={{
              background:
                'linear-gradient(0deg, #0A0807 0%, rgba(10, 8, 7, 0.8) 50%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* Decorative Chapter Watermark Numeral */}
      {chapterNumber && (
        <div
          aria-hidden="true"
          className="absolute right-4 sm:right-8 lg:right-16 top-12 pointer-events-none select-none z-[1]"
        >
          <span className="font-serif text-stroke-cream text-6xl sm:text-8xl lg:text-9xl font-light opacity-30 tracking-tight">
            {chapterNumber}
          </span>
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {layout === 'split-left' ? (
          <div className="max-w-2xl text-left">{children}</div>
        ) : layout === 'split-right' ? (
          <div className="max-w-2xl ml-auto text-left sm:text-right">{children}</div>
        ) : layout === 'centered' ? (
          <div className="max-w-3xl mx-auto text-center">{children}</div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </section>
  );
};
