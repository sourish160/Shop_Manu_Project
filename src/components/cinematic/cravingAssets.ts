/**
 * =========================================================================
 * CHAPTER II: FOLLOW YOUR CRAVINGS — ASSET MAPPING & CATEGORY CONFIGURATION
 * =========================================================================
 *
 * HOW TO REPLACE TEMPORARY PHOTOGRAPHS:
 * 1. Place your own high-resolution photography files into `public/images/cravings/`
 *    (e.g., `public/images/cravings/street-food.jpg`, `biryani.jpg`, etc.)
 * 2. Update the corresponding `image` property in `CRAVING_CATEGORIES` or the
 *    central `CRAVING_IMAGE_MAP` below with your local path (e.g., '/images/cravings/biryani.jpg')
 *    or custom hosted CDN URL.
 *
 * Current temporary images are curated high-resolution culinary photographs
 * matched to the dark amber aesthetic of ManuMania.
 */

export interface CravingCategory {
  id: string;
  count: string;
  title: string;
  headline: string;
  tagline: string;
  curatorBadge: string;
  query: string;
  image: string;
  alt: string;
  position: string;
  highlightDishes: string[];
  role: 'hero-portrait' | 'hero-landscape' | 'trio' | 'duo-left' | 'duo-right';
}

/**
 * Central dictionary of temporary category images for quick single-point replacement.
 */
export const CRAVING_IMAGE_MAP = {
  streetFood: '/images/cravings/street-food.jpg',
  biryani: '/images/cravings/biryani.jpg',
  snacks: '/images/cravings/snacks.jpg',
  meals: '/images/cravings/meals.jpg',
  sweets: '/images/cravings/sweets.jpg',
  beverages: '/images/cravings/beverages.jpg',
  desserts: '/images/cravings/desserts.jpg',
};

/**
 * Seven signature culinary territories featured in Chapter II:
 * 1. Street Food
 * 2. Biryani
 * 3. Snacks
 * 4. Meals
 * 5. Sweets
 * 6. Beverages
 * 7. Desserts
 */
export const CRAVING_CATEGORIES: CravingCategory[] = [
  {
    id: 'street-food',
    count: '01',
    title: 'Street Food',
    headline: 'Street Food',
    tagline: 'Crisp kathi rolls, spicy puchkas & midnight tawa sizzle',
    curatorBadge: 'STREET ESSENTIALS',
    query: 'Street Food',
    image: CRAVING_IMAGE_MAP.streetFood,
    alt: 'Crispy Indian street food delicacies garnished with spices and fresh herbs',
    position: 'object-center',
    highlightDishes: ['Kati Roll', 'Puchka', 'Mughlai Paratha'],
    role: 'hero-portrait',
  },
  {
    id: 'biryani',
    count: '02',
    title: 'Biryani',
    headline: 'Dum Biryani',
    tagline: 'Saffron basmati grains, golden spiced aloo & slow-steamed tender cuts',
    curatorBadge: 'SIGNATURE DUM · CITY OBSESSION',
    query: 'Biryani',
    image: CRAVING_IMAGE_MAP.biryani,
    alt: 'Royal aromatic Dum Biryani in a handi with saffron rice, caramelized onions and tender meat',
    position: 'object-[center_40%]',
    highlightDishes: ['Mutton Dum', 'Chicken Biryani', 'Kolkata Aloo Special'],
    role: 'hero-landscape',
  },
  {
    id: 'snacks',
    count: '03',
    title: 'Snacks',
    headline: 'Snacks & Savouries',
    tagline: 'Golden singaras, crispy cutlets, telebhaja & evening adda treats',
    curatorBadge: 'TEA-TIME CRAFT',
    query: 'Snacks',
    image: CRAVING_IMAGE_MAP.snacks,
    alt: 'Golden crispy triangular samosas and savoury snacks with tangy mint chutney',
    position: 'object-center',
    highlightDishes: ['Singara', 'Fish Fry', 'Vegetable Chop'],
    role: 'trio',
  },
  {
    id: 'meals',
    count: '04',
    title: 'Meals',
    headline: 'Meals & Thalis',
    tagline: 'Fragrant rice platters, slow-simmered curries & wholesome homestyle thalis',
    curatorBadge: 'FEAST & THALI',
    query: 'Meals',
    image: CRAVING_IMAGE_MAP.meals,
    alt: 'Wholesome royal Indian meal thali with bowls of aromatic curries, lentils and fresh flatbread',
    position: 'object-center',
    highlightDishes: ['Special Thali', 'Kosha Mangsho', 'Dal Makhani'],
    role: 'trio',
  },
  {
    id: 'sweets',
    count: '05',
    title: 'Sweets',
    headline: 'Heritage Sweets',
    tagline: 'Warm syrupy gulab jamuns, delicate roshogollas & rich saffron mishti',
    curatorBadge: 'HERITAGE MISHTI',
    query: 'Sweets',
    image: CRAVING_IMAGE_MAP.sweets,
    alt: 'Traditional syrupy golden jalebis and artisanal Indian confections',
    position: 'object-center',
    highlightDishes: ['Roshogolla', 'Gulab Jamun', 'Nolen Gur Sandesh'],
    role: 'trio',
  },
  {
    id: 'beverages',
    count: '06',
    title: 'Beverages',
    headline: 'Beverages & Brews',
    tagline: 'Steaming earthen kulhad chai, hand-beaten coffees & spiced coolers',
    curatorBadge: 'CLAY-CUP & COOLERS',
    query: 'Beverages',
    image: CRAVING_IMAGE_MAP.beverages,
    alt: 'Authentic spiced masala tea poured into an earthen clay cup (kulhad)',
    position: 'object-center',
    highlightDishes: ['Kulhad Masala Chai', 'Mango Lassi', 'Cold Brew'],
    role: 'duo-left',
  },
  {
    id: 'desserts',
    count: '07',
    title: 'Desserts',
    headline: 'Decadent Desserts',
    tagline: 'Artisan baked confections, molten chocolate indulgences & chilled kulfis',
    curatorBadge: 'MODERN INDULGENCE',
    query: 'Desserts',
    image: CRAVING_IMAGE_MAP.desserts,
    alt: 'Decadent gourmet molten chocolate dessert with warm chocolate sauce drizzle',
    position: 'object-center',
    highlightDishes: ['Matka Kulfi', 'Chocolate Lava', 'Baked Cheesecake'],
    role: 'duo-right',
  },
];

