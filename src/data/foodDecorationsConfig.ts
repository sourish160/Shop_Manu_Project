/**
 * =========================================================================
 * MANUMANIA — PREMIUM DECORATIVE FOOD PNG ELEMENTS CONFIGURATION
 * =========================================================================
 *
 * High-quality photorealistic food cutouts with transparent backgrounds
 * to enhance visual appetite, vibrancy, and editorial luxury across all
 * six story chapters.
 *
 * HOW TO REPLACE DECORATIVE IMAGES:
 * 1. Place your own high-resolution transparent PNG into `public/images/decorations/`
 *    using the same filename (e.g. `biryani-cutout.png`, `kathi-roll-cutout.png`).
 * 2. Save and refresh the browser. The new cutout will appear immediately.
 */

export interface FoodDecorationItem {
  id: string;
  name: string;
  image: string;
  alt: string;
  positionClasses: string;
  sizeClasses: string;
  floatDuration?: number; // Float cycle duration in seconds
  floatOffset?: number; // Max vertical drift in px
  rotateRange?: [number, number]; // [minDeg, maxDeg]
  delay?: number; // Entrance / animation delay
  hideOnMobile?: boolean; // Hide on small mobile to avoid viewport clutter
  hideBelowLg?: boolean; // Show only on large screens
  depth?: 'foreground' | 'midground' | 'background';
  parallaxSpeed?: number; // Scroll parallax factor (-30 to +30)
}

export const FOOD_DECORATIONS: Record<string, FoodDecorationItem[]> = {
  /**
   * CHAPTER I: THE DISCOVERY (HERO)
   * Small floating food elements around the hero composition without
   * covering the headline ("FIND FOOD THAT FEELS Right") or MANU SEARCH button.
   */
  chapterI: [
    {
      id: 'hero-kathi-roll',
      name: 'Crisp Kathi Roll',
      image: '/images/decorations/kathi-roll-cutout.png',
      alt: 'Artisanal Kolkata kathi roll wrap with spiced filling',
      positionClasses: 'top-[16%] right-[4%] md:right-[8%] lg:right-[12%]',
      sizeClasses: 'w-28 sm:w-36 md:w-44 lg:w-52 xl:w-60',
      floatDuration: 7.2,
      floatOffset: 10,
      rotateRange: [-3, 3],
      delay: 0.4,
      hideOnMobile: true,
      depth: 'midground',
      parallaxSpeed: -15,
    },
    {
      id: 'hero-kulhad-chai',
      name: 'Earthen Kulhad Chai',
      image: '/images/decorations/chai-cutout.png',
      alt: 'Traditional earthen clay cup tea with fragrant spices',
      positionClasses: 'bottom-[20%] right-[6%] md:right-[12%] lg:right-[18%]',
      sizeClasses: 'w-24 sm:w-28 md:w-36 lg:w-40',
      floatDuration: 6.4,
      floatOffset: 8,
      rotateRange: [-2, 2],
      delay: 0.8,
      hideOnMobile: true,
      depth: 'background',
      parallaxSpeed: 12,
    },
  ],

  /**
   * CHAPTER II: FOLLOW YOUR CRAVINGS
   * Decorative food cutouts around category cards, complementing existing photography.
   */
  chapterII: [
    {
      id: 'craving-samosa',
      name: 'Golden Samosa',
      image: '/images/decorations/samosa-cutout.png',
      alt: 'Crispy golden samosa with aromatic herb filling',
      positionClasses: '-top-6 -right-2 sm:-right-6 lg:-right-10',
      sizeClasses: 'w-28 sm:w-36 md:w-44',
      floatDuration: 6.8,
      floatOffset: 9,
      rotateRange: [-4, 2],
      delay: 0.2,
      hideOnMobile: true,
      depth: 'foreground',
      parallaxSpeed: -18,
    },
    {
      id: 'craving-fish-fry',
      name: 'Crisp Fish Fry',
      image: '/images/decorations/fish-fry-cutout.png',
      alt: 'Golden crumbed Bengali bhetki fish fry with mustard dip',
      positionClasses: '-bottom-10 -left-4 sm:-left-8 lg:-left-12',
      sizeClasses: 'w-32 sm:w-40 md:w-48 lg:w-56',
      floatDuration: 7.8,
      floatOffset: 12,
      rotateRange: [-2, 3],
      delay: 0.3,
      hideOnMobile: true,
      depth: 'midground',
      parallaxSpeed: 20,
    },
    {
      id: 'craving-desserts',
      name: 'Artisan Dessert Platter',
      image: '/images/decorations/desserts-cutout.png',
      alt: 'Decadent artisanal dessert presentation',
      positionClasses: 'top-1/2 -right-4 sm:-right-8 lg:-right-12 translate-y-24',
      sizeClasses: 'w-28 sm:w-36 md:w-44',
      floatDuration: 7.0,
      floatOffset: 8,
      rotateRange: [-3, 2],
      delay: 0.5,
      hideOnMobile: true,
      hideBelowLg: true,
      depth: 'background',
      parallaxSpeed: -10,
    },
  ],

  /**
   * CHAPTER III: EXPLORE THE MENUS
   * Food illustrations around the menu showcase and card composition.
   */
  chapterIII: [
    {
      id: 'menu-momos',
      name: 'Steamed Momos',
      image: '/images/decorations/momos-cutout.png',
      alt: 'Platter of steaming handcrafted momos with red chilli chutney',
      positionClasses: 'top-[12%] -left-6 sm:-left-10 lg:-left-14',
      sizeClasses: 'w-32 sm:w-40 md:w-48 lg:w-56',
      floatDuration: 8.0,
      floatOffset: 10,
      rotateRange: [-3, 2],
      delay: 0.25,
      hideOnMobile: true,
      depth: 'foreground',
      parallaxSpeed: -20,
    },
    {
      id: 'menu-kebab',
      name: 'Charred Tandoori Kebabs',
      image: '/images/decorations/kebab-cutout.png',
      alt: 'Succulent flame-grilled seekh kebabs garnished with lime and onions',
      positionClasses: 'bottom-[14%] -right-6 sm:-right-10 lg:-right-14',
      sizeClasses: 'w-36 sm:w-44 md:w-52 lg:w-64',
      floatDuration: 7.5,
      floatOffset: 11,
      rotateRange: [-2, 3],
      delay: 0.4,
      hideOnMobile: true,
      depth: 'foreground',
      parallaxSpeed: 18,
    },
    {
      id: 'menu-mughlai-paratha',
      name: 'Crisp Mughlai Paratha',
      image: '/images/decorations/mughlai-paratha-cutout.png',
      alt: 'Golden flaky Mughlai paratha with savory egg filling',
      positionClasses: 'top-[48%] -right-4 sm:-right-8 lg:-right-12',
      sizeClasses: 'w-28 sm:w-36 md:w-44 lg:w-48',
      floatDuration: 6.9,
      floatOffset: 8,
      rotateRange: [-2, 2],
      delay: 0.5,
      hideOnMobile: true,
      hideBelowLg: true,
      depth: 'midground',
      parallaxSpeed: -12,
    },
  ],

  /**
   * CHAPTER IV: TOP SHOPS NEAR YOU
   * Small decorative ingredients or food elements around shop cards.
   */
  chapterIV: [
    {
      id: 'shops-chicken-chop',
      name: 'Kolkata Chicken Chop',
      image: '/images/decorations/chicken-chop-cutout.png',
      alt: 'Heritage street-style breadcrumb spiced chicken cutlet',
      positionClasses: '-top-8 -left-3 sm:-left-8 lg:-left-12',
      sizeClasses: 'w-28 sm:w-36 md:w-44',
      floatDuration: 7.1,
      floatOffset: 8,
      rotateRange: [-3, 2],
      delay: 0.3,
      hideOnMobile: true,
      depth: 'midground',
      parallaxSpeed: -14,
    },
    {
      id: 'shops-rosogolla',
      name: 'Syrupy Rosogolla',
      image: '/images/decorations/rosogolla-cutout.png',
      alt: 'Delicate sponge chhena rosogollas in aromatic cardamom syrup',
      positionClasses: '-bottom-8 -right-3 sm:-right-8 lg:-right-12',
      sizeClasses: 'w-28 sm:w-36 md:w-44',
      floatDuration: 7.6,
      floatOffset: 9,
      rotateRange: [-2, 3],
      delay: 0.45,
      hideOnMobile: true,
      depth: 'midground',
      parallaxSpeed: 16,
    },
  ],

  /**
   * CHAPTER V: FIND FOOD NEAR YOU (AROUND YOU)
   * Subtle food cutouts around location search and map presentation.
   */
  chapterV: [
    {
      id: 'location-jalebi',
      name: 'Golden Jalebi',
      image: '/images/decorations/jalebi-cutout.png',
      alt: 'Saffron-infused golden spiral sweets',
      positionClasses: '-top-6 -right-2 sm:-right-6 lg:-right-10',
      sizeClasses: 'w-28 sm:w-36 md:w-44',
      floatDuration: 6.6,
      floatOffset: 9,
      rotateRange: [-3, 2],
      delay: 0.2,
      hideOnMobile: true,
      depth: 'midground',
      parallaxSpeed: -12,
    },
    {
      id: 'location-spices',
      name: 'Aromatic Spices',
      image: '/images/decorations/spices-cutout.png',
      alt: 'Fresh culinary spices and seasoning accents',
      positionClasses: '-bottom-8 -left-2 sm:-left-6 lg:-left-10',
      sizeClasses: 'w-24 sm:w-32 md:w-40',
      floatDuration: 7.4,
      floatOffset: 7,
      rotateRange: [-2, 3],
      delay: 0.35,
      hideOnMobile: true,
      depth: 'background',
      parallaxSpeed: 14,
    },
  ],

  /**
   * CHAPTER VI: YOUR NEXT FOOD STOP
   * Larger, attractive food decorations around the main Explore Menus
   * and Find a Shop area. Keep the primary CTA highly visible.
   */
  chapterVI: [
    {
      id: 'next-stop-biryani',
      name: 'Royal Dum Biryani Bowl',
      image: '/images/decorations/biryani-cutout.png',
      alt: 'Aromatic saffron Kolkata biryani handi bowl with tender cuts and golden aloo',
      positionClasses: '-top-14 sm:-top-16 lg:-top-20 -right-4 sm:-right-8 lg:-right-16 xl:-right-20',
      sizeClasses: 'w-36 sm:w-48 md:w-60 lg:w-72 xl:w-80',
      floatDuration: 8.2,
      floatOffset: 12,
      rotateRange: [-2, 3],
      delay: 0.2,
      hideOnMobile: false, // Essential crown jewel, responsive scale
      depth: 'foreground',
      parallaxSpeed: -22,
    },
    {
      id: 'next-stop-sweets',
      name: 'Heritage Bengali Sweets',
      image: '/images/decorations/bengali-sweets-cutout.png',
      alt: 'Artisanal platter of handcrafted sandesh and heritage sweets',
      positionClasses: 'bottom-4 sm:bottom-8 lg:bottom-12 -left-4 sm:-left-8 lg:-left-16 xl:-left-20',
      sizeClasses: 'w-32 sm:w-44 md:w-52 lg:w-64 xl:w-72',
      floatDuration: 7.8,
      floatOffset: 10,
      rotateRange: [-3, 2],
      delay: 0.35,
      hideOnMobile: true,
      depth: 'midground',
      parallaxSpeed: 18,
    },
  ],
};
