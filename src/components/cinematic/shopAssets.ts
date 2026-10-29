/**
 * =========================================================================
 * CHAPTER IV: TOP SHOPS NEAR YOU — ASSET MAPPING & FALLBACK STOREFRONTS
 * =========================================================================
 *
 * HOW TO REPLACE TEMPORARY STOREFRONT PHOTOGRAPHS:
 * 1. Place your shop/restaurant storefront photographs in `public/images/shops/`
 *    (e.g., `public/images/shops/storefront-1.jpg`, `storefront-2.jpg`, etc.)
 * 2. Update the `STOREFRONT_IMAGES` array below with your local paths or hosted CDN URLs.
 * 3. When restaurant owners upload a real `cover_url` or `logo_url` in their InsForge dashboard,
 *    `resolveShopImage` will automatically prioritize the real shop photograph over the temporary fallback.
 */

export const STOREFRONT_IMAGES: string[] = [
  // 0: Warm amber-lit heritage dining hall & storefront
  '/images/shops/storefront-1.jpg',
  // 1: Contemporary dining room with warm pendant lighting
  '/images/shops/storefront-2.jpg',
  // 2: Warm neighborhood cafe & street facade
  '/images/locations/park-street.jpg',
  // 3: Chic open kitchen & culinary counter
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=85',
  // 4: Elegant dining space with ambient lanterns
  'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=85',
  // 5: Cozy artisanal kitchen interior
  'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=85',
];

export interface ResolvedShopImage {
  url: string;
  isFallback: boolean;
  label: string;
}

/**
 * Resolves the storefront image for a registered shop.
 * Prioritizes genuine uploaded cover_url from the database.
 * If null, falls back to a temporary storefront photograph without
 * misrepresenting it as an authenticated actual photo.
 */
export function resolveShopImage(
  shop: { id?: string; name?: string; cover_url?: string | null; logo_url?: string | null },
  index: number = 0
): ResolvedShopImage {
  if (shop.cover_url && shop.cover_url.trim().length > 0) {
    return {
      url: shop.cover_url,
      isFallback: false,
      label: 'Storefront',
    };
  }

  // Deterministic fallback based on index or string hash of shop id/name
  let imageIndex = Math.abs(index) % STOREFRONT_IMAGES.length;
  if (index === 0 && (shop.id || shop.name)) {
    const seed = shop.id || shop.name || '';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    imageIndex = Math.abs(hash) % STOREFRONT_IMAGES.length;
  }

  return {
    url: STOREFRONT_IMAGES[imageIndex],
    isFallback: true,
    label: 'Atmosphere Preview',
  };
}

