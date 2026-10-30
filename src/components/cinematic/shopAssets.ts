/**
 * =========================================================================
 * CHAPTER IV: TOP SHOPS NEAR YOU — ASSET MAPPING & AUTHENTIC STOREFRONTS
 * =========================================================================
 *
 * HOW TO REPLACE STOREFRONT PHOTOGRAPHS:
 * 1. Place your shop/restaurant photographs in `public/images/shops/`
 *    (e.g., `public/images/shops/storefront-1.jpg`, `storefront-2.jpg`, etc.)
 * 2. When restaurant owners upload a real `cover_url` in their InsForge dashboard,
 *    `resolveShopImage` will automatically prioritize the real shop photograph.
 */

export const STOREFRONT_IMAGES: string[] = [
  '/images/shops/storefront-1.jpg',
  '/images/shops/storefront-2.jpg',
  '/images/locations/park-street.jpg',
  '/images/cravings/biryani.jpg',
  '/images/cravings/rolls.jpg',
  '/images/cravings/snacks.jpg',
];

/**
 * Curated high-resolution culinary & heritage atmosphere mapping
 * for Kolkata's signature food spots.
 */
const KOLKATA_SHOP_ATMOSPHERE_MAP: Record<string, string> = {
  arsalan: '/images/cravings/biryani.jpg',
  flurys: '/images/locations/park-street.jpg',
  'peter cat': '/images/shops/storefront-1.jpg',
  "nizam's": '/images/cravings/rolls.jpg',
  nizams: '/images/cravings/rolls.jpg',
  '6 ballygunge place': '/images/shops/storefront-2.jpg',
  'kusum rolls': '/images/cravings/street-food.jpg',
  'mitra cafe': '/images/cravings/snacks.jpg',
  paramount: '/images/cravings/beverages.jpg',
  nahoum: '/images/cravings/desserts.jpg',
  putiram: '/images/cravings/sweets.jpg',
};

export interface ResolvedShopImage {
  url: string;
  isFallback: boolean;
  label: string;
}

/**
 * Resolves the storefront image for a registered shop.
 * Prioritizes genuine uploaded cover_url from the database.
 * If null, matches authentic culinary atmosphere for the shop.
 */
export function resolveShopImage(
  shop: { id?: string; name?: string; slug?: string; cover_url?: string | null; logo_url?: string | null },
  index: number = 0
): ResolvedShopImage {
  if (shop.cover_url && shop.cover_url.trim().length > 0) {
    return {
      url: shop.cover_url,
      isFallback: false,
      label: 'Storefront',
    };
  }

  const nameKey = (shop.name || shop.slug || '').toLowerCase();
  for (const [key, imagePath] of Object.entries(KOLKATA_SHOP_ATMOSPHERE_MAP)) {
    if (nameKey.includes(key)) {
      return {
        url: imagePath,
        isFallback: false,
        label: 'Kitchen Atmosphere',
      };
    }
  }

  const imageIndex = Math.abs(index) % STOREFRONT_IMAGES.length;
  return {
    url: STOREFRONT_IMAGES[imageIndex],
    isFallback: true,
    label: 'Kitchen Atmosphere',
  };
}
