import { Variants } from 'motion/react';

/**
 * Shared cinematic card entrance animation variants for ManuMania Chapters II & IV.
 * Designed according to high-end editorial motion choreography:
 * - Card reveal: opacity 0 -> 1, y: 35 -> 0, scale 0.97 -> 1, ease [0.22, 1, 0.36, 1]
 * - Inner photo reveal: scale 1.06 -> 1, opacity 0.45 -> 1
 * - Badges: subtle fade-in
 * - Title & description: upward slide
 * - Dish tags: rippling stagger
 * - Action button: reveals last
 */

export const cardEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 35,
    scale: 0.97,
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      delay,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.06,
      delayChildren: delay + 0.16,
    },
  }),
};

export const cardImageVariants: Variants = {
  hidden: {
    opacity: 0.45,
    scale: 1.06,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const cardBadgeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const cardTextVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const cardTagsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

export const cardTagItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const cardButtonVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

