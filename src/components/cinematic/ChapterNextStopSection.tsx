import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Utensils,
  Store,
  LogIn,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion, type Variants, type TargetAndTransition } from 'motion/react';
import { ChapterSection } from './ChapterSection';
import { NEXT_STOP_ASSETS } from './nextStopAssets';

export const ChapterNextStopSection: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Word-by-word headline reveal animation variants
  const wordVariant: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 25,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.65,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  // Gentle organic floating motion loops for transparent Polaroid graphics
  const leftFloatAnimation: TargetAndTransition = prefersReducedMotion
    ? {}
    : {
        y: [-4, 6, -4],
        rotate: [-0.6, 0.6, -0.6],
        transition: {
          duration: 6.8,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        },
      };

  const rightFloatAnimation: TargetAndTransition = prefersReducedMotion
    ? {}
    : {
        y: [6, -4, 6],
        rotate: [0.5, -0.7, 0.5],
        transition: {
          duration: 7.4,
          repeat: Infinity,
          ease: 'easeInOut' as const,
          delay: 0.5,
        },
      };

  return (
    <ChapterSection
      id="chapter-next-bite"
      chapterNumber="VI"
      chapterLabel="Your Next Food Stop"
      scrimIntensity="deep"
      layout="full"
      className="py-20 sm:py-28 lg:py-32 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col space-y-10 sm:space-y-12">
        {/* =====================================================================
            TOP: PRIMARY CUSTOMER EXPERIENCE
            ===================================================================== */}
        <div className="flex flex-col space-y-7 sm:space-y-8">
          <div>
            {/* 1. Chapter Label & Editorial Eyebrow */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="flex items-center space-x-3 mb-4"
            >
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#E8A856] font-semibold">
                Chapter VI
              </span>
              <span className="h-px w-8 bg-[#E8A856]/40" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream-200/60">
                Your Next Food Stop
              </span>
            </motion.div>

            {/* 2. Main Headline (Word-by-word reveal) */}
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: prefersReducedMotion ? 0 : 0.09,
                    delayChildren: 0.1,
                  },
                },
              }}
              className="font-serif text-4xl sm:text-6xl lg:text-[4.75rem] xl:text-[5.5rem] font-light text-cream-100 tracking-tight leading-[1.04] mb-5 text-left"
            >
              <motion.span variants={wordVariant} className="inline-block mr-3 sm:mr-4">
                YOUR
              </motion.span>
              <motion.span variants={wordVariant} className="inline-block mr-3 sm:mr-4">
                NEXT
              </motion.span>
              <br className="hidden sm:inline" />
              <motion.span
                variants={wordVariant}
                className="inline-block mr-3 sm:mr-4 italic font-normal text-[#E8A856] drop-shadow-[0_2px_16px_rgba(232,168,86,0.3)]"
              >
                FOOD
              </motion.span>
              <motion.span
                variants={wordVariant}
                className="inline-block italic font-normal text-[#E8A856] drop-shadow-[0_2px_16px_rgba(232,168,86,0.3)]"
              >
                STOP
              </motion.span>
            </motion.h2>

            {/* 3. Supporting Text */}
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="font-sans text-base sm:text-lg text-cream-200/80 font-normal leading-relaxed max-w-2xl text-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] mb-7 sm:mb-8"
            >
              Discover Kolkata&rsquo;s food scene. Explore real menus, compare prices, and find your next favourite food spot.
            </motion.p>
          </div>

          {/* 4. Main Food Visual Showcase Card with Integrated Floating Polaroids */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.75, delay: 0.36, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="relative w-full rounded-3xl overflow-visible"
          >
            {/* Outer Decorative Floating Polaroid: Street Food ("Explore Real Menus") */}
            <motion.div
              animate={leftFloatAnimation}
              className="absolute -top-10 -left-4 sm:-left-8 lg:-left-10 w-28 sm:w-36 md:w-44 z-20 pointer-events-none select-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.7)] hidden sm:block"
            >
              <img
                src={NEXT_STOP_ASSETS.polaroidStreetFood}
                alt="Street Food - Explore Real Menus"
                className="w-full h-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </motion.div>

            {/* Outer Decorative Floating Polaroid: Authentic Taste ("Discover Hidden Gems") */}
            <motion.div
              animate={rightFloatAnimation}
              className="absolute -top-8 -right-4 sm:-right-6 lg:-right-8 w-24 sm:w-32 md:w-40 z-20 pointer-events-none select-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.7)] hidden sm:block"
            >
              <img
                src={NEXT_STOP_ASSETS.polaroidAuthenticTaste}
                alt="Authentic Taste - Discover Hidden Gems"
                className="w-full h-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </motion.div>

            {/* High-Quality Cinematic Food Showcase Container */}
            <div className="group relative w-full h-[280px] sm:h-[340px] lg:h-[380px] rounded-3xl overflow-hidden border border-cream-200/15 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),0_0_40px_rgba(232,168,86,0.14)] bg-[#120E0C]">
              {/* Background Food Scene with Subtle Hover Scale */}
              <img
                src={NEXT_STOP_ASSETS.mainAnchor}
                alt="Atmospheric Kolkata culinary dining scene with amber lanterns"
                className="w-full h-full object-cover brightness-[0.76] contrast-[1.08] saturate-[1.08] group-hover:scale-[1.03] group-hover:brightness-[0.84] transition-all duration-700 ease-out motion-reduce:transition-none"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== NEXT_STOP_ASSETS.mainAnchor) {
                    e.currentTarget.src = NEXT_STOP_ASSETS.mainAnchor;
                  }
                }}
              />

              {/* Scrim Gradients for Visual Contrast & Rich Atmosphere */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/45 to-transparent transition-opacity duration-500" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(10,8,7,0.75)_100%)]" />

              {/* Subtle Ambient Gold Aura on Hover */}
              <div className="absolute -inset-1 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Gastronomic Quote in Showcase */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-left z-10">
                <span className="font-mono text-[10px] sm:text-xs text-amber-300 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 drop-shadow">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>The Kolkata Gastronomic Archive</span>
                </span>
                <p className="font-serif italic text-base sm:text-lg lg:text-xl text-cream-100/90 max-w-xl leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                  &ldquo;Taste the city without the guesswork. Real prices, transparent portions, zero fake reviews.&rdquo;
                </p>
              </div>
            </div>
          </motion.div>

          {/* 5. Primary Customer CTAs: EXPLORE MENUS & FIND A SHOP */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.65, delay: 0.46, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-1"
          >
            {/* Primary Action 1: EXPLORE MENUS (Strongest Visual Emphasis) */}
            <button
              type="button"
              onClick={() => navigate('/search?tab=foods')}
              className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-[#E8A856] to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 text-[#0A0807] font-sans font-bold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_12px_32px_rgba(232,168,86,0.35)] hover:shadow-[0_16px_40px_rgba(232,168,86,0.5)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-[#0A0807] stroke-[2.5]" />
              <span>EXPLORE MENUS</span>
              <ArrowRight className="w-4 h-4 text-[#0A0807] transition-transform duration-200 group-hover:translate-x-1.5 stroke-[2.5]" />
            </button>

            {/* Secondary Action 2: FIND A SHOP (Refined Dark Gold-Bordered Treatment) */}
            <button
              type="button"
              onClick={() => navigate('/search?tab=restaurants')}
              className="group inline-flex items-center justify-center gap-2.5 px-7 sm:px-9 py-4 rounded-xl bg-[#0A0807]/90 hover:bg-[#161210] text-cream-100 hover:text-amber-300 font-sans font-semibold text-xs sm:text-sm uppercase tracking-widest border border-amber-400/30 hover:border-amber-400/70 transition-all duration-300 shadow-xl backdrop-blur-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>FIND A SHOP</span>
              <ArrowRight className="w-4 h-4 text-amber-300 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* =====================================================================
            HORIZONTAL BUSINESS OWNER AREA: FOR FOOD BUSINESSES
            (Directly underneath the Explore Menus & Find a Shop buttons)
            ===================================================================== */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: 0.52, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="w-full p-5 sm:p-6 md:p-6 lg:p-8 xl:p-9 rounded-3xl bg-[#120E0C]/85 border border-cream-200/12 backdrop-blur-md relative overflow-hidden group hover:border-amber-400/25 transition-all duration-500 text-left box-border"
        >
          {/* Ambient Warm Golden Aura */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-700" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-4 lg:gap-6 xl:gap-8 items-center relative z-10 w-full box-border">
            {/* Left Column: Heading & Intro */}
            <div className="md:col-span-4 min-w-0">
              <div className="flex items-center space-x-2 text-amber-400/90 mb-2 sm:mb-2.5">
                <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] font-semibold">
                  Kitchen Partners
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-cream-100 font-light tracking-tight mb-2">
                FOR FOOD <span className="italic font-normal text-[#E8A856]">BUSINESSES</span>
              </h3>

              <p className="font-sans text-xs sm:text-sm text-cream-200/75 leading-relaxed">
                Bring your kitchen online and connect with more food lovers across Kolkata.
              </p>
            </div>

            {/* Middle Column: 3 Key Value Propositions */}
            <div className="md:col-span-4 xl:col-span-5 min-w-0 space-y-2 sm:space-y-2.5 py-3 md:py-0 md:px-3 lg:px-6 md:border-x md:border-cream-200/10 box-border">
              <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-cream-200/80 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Zero platform commission on dine-in menus</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-cream-200/80 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Live price &amp; portion control anytime</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-cream-200/80 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Verified digital badge for authentic kitchens</span>
              </div>
            </div>

            {/* Right Column: Both CTA buttons stacked vertically */}
            <div className="md:col-span-4 xl:col-span-3 min-w-0 w-full flex flex-col gap-2.5 sm:gap-3 box-border">
              {/* REGISTER KITCHEN */}
              <Link
                to="/owner/register"
                className="group w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#0A0807] font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-amber-400/25 hover:-translate-y-0.5 active:scale-[0.98] box-border shrink-0"
              >
                <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                  <Store className="w-4 h-4 text-[#0A0807] shrink-0" />
                  <span className="truncate">REGISTER KITCHEN</span>
                </div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#0A0807]/35 flex items-center justify-center shrink-0 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0A0807] stroke-[2.2]" />
                </div>
              </Link>

              {/* OWNER SIGN IN */}
              <Link
                to="/owner/login"
                className="group w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-[#0A0807]/85 hover:bg-[#161210] text-cream-200/90 hover:text-cream-100 border border-cream-200/20 hover:border-amber-400/40 font-sans font-medium text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 box-border shrink-0"
              >
                <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                  <LogIn className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">OWNER SIGN IN</span>
                </div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-cream-200/25 group-hover:border-amber-400/40 flex items-center justify-center shrink-0 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cream-200/70 group-hover:text-amber-300 stroke-[2.2]" />
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </ChapterSection>
  );
};
