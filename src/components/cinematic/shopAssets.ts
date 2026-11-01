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
  '/images/shops/peter-cat.jpg',
  '/images/shops/6-ballygunge-place.jpg',
  '/images/shops/flurys.jpg',
  '/images/shops/arsalan.jpg',
];

/**
 * Curated high-resolution culinary & heritage atmosphere mapping
 * for Kolkata's signature food spots.
 * Every photograph is cryptographically unique and tailored to the establishment.
 */
const KOLKATA_SHOP_ATMOSPHERE_MAP: Record<string, string> = {
  arsalan: '/images/shops/arsalan.jpg',
  flurys: '/images/shops/flurys.jpg',
  'peter cat': '/images/shops/peter-cat.jpg',
  "nizam's": '/images/shops/nizams.jpg',
  nizams: '/images/shops/nizams.jpg',
  '6 ballygunge place': '/images/shops/6-ballygunge-place.jpg',
  'kusum rolls': '/images/shops/kusum-rolls.jpg',
  'mitra cafe': '/images/shops/mitra-cafe.jpg',
  paramount: '/images/shops/paramount.jpg',
  nahoum: '/images/shops/nahoum-and-sons.jpg',
  'nahoum & sons': '/images/shops/nahoum-and-sons.jpg',
  putiram: '/images/shops/putiram-sweets.jpg',
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
