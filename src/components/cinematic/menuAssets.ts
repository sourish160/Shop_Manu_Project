/**
 * =========================================================================
 * CHAPTER III: EXPLORE THE MENUS — ASSET MAPPING & TEMPORARY PHOTOGRAPHY
 * =========================================================================
 *
 * HOW TO REPLACE TEMPORARY PHOTOGRAPHS:
 * 1. Place your food photography files in `public/images/menu/`
 *    (e.g., `public/images/menu/biryani.jpg`, `thali.jpg`, `kathi-roll.jpg`, etc.)
 * 2. Update the corresponding key in `MENU_IMAGE_MAP` below with your local path
 *    or custom hosted CDN URL.
 * 3. If a dish has its own `image_url` stored in the InsForge database,
 *    `resolveMenuItemImage` will automatically prioritize the database image first!
 */

export interface MenuItemAsset {
  key: string;
  name: string;
  url: string;
  alt: string;
}

/**
 * Central dictionary of temporary high-resolution food photography.
 */
export const MENU_IMAGE_MAP: Record<string, string> = {
  biryani: '/images/menu/biryani.jpg',
  thali: '/images/menu/thali.jpg',
  curry: '/images/menu/curry.jpg',
  rolls: '/images/menu/rolls.jpg',
  snacks: '/images/menu/snacks.jpg',
  kebabs: '/images/menu/kebabs.jpg',
  dosa: '/images/menu/dosa.jpg',
  sweets: '/images/menu/sweets.jpg',
  beverages: '/images/menu/beverages.jpg',
  default: '/images/menu/thali.jpg',
};

/**
 * Intelligently resolves the most appetizing image for a menu item.
 * Prioritizes the food's real uploaded `image_url` if present, then falls back
 * to culinary-matched temporary photography based on category and dish name.
 */
export function resolveMenuItemImage(food: {
  name?: string;
  description?: string | null;
  image_url?: string | null;
  category?: { name?: string } | string | null;
}): string {
  if (food.image_url && food.image_url.trim().length > 0) {
    return food.image_url;
  }

  const categoryName =
    typeof food.category === 'string'
      ? food.category
      : food.category?.name || '';
  const text = `${food.name || ''} ${categoryName} ${food.description || ''}`.toLowerCase();

  if (text.includes('biryani') || text.includes('rice') || text.includes('dum') || text.includes('pulao') || text.includes('khichdi')) {
    return MENU_IMAGE_MAP.biryani;
  }
  if (text.includes('thali') || text.includes('meal') || text.includes('combo') || text.includes('banana leaf') || text.includes('platter')) {
    return MENU_IMAGE_MAP.thali;
  }
  if (text.includes('dosa') || text.includes('vada') || text.includes('idli') || text.includes('tiffin') || text.includes('uttapam')) {
    return MENU_IMAGE_MAP.dosa;
  }
  if (text.includes('roll') || text.includes('kathi') || text.includes('wrap') || text.includes('frankie')) {
    return MENU_IMAGE_MAP.rolls;
  }
  if (text.includes('kebab') || text.includes('reshmi') || text.includes('tandoor') || text.includes('tikka') || text.includes('chaap') || text.includes('boti')) {
    return MENU_IMAGE_MAP.kebabs;
  }
  if (text.includes('curry') || text.includes('gravy') || text.includes('masala') || text.includes('korma') || text.includes('dal') || text.includes('paneer') || text.includes('chicken') || text.includes('mutton') || text.includes('fish') || text.includes('rogan')) {
    return MENU_IMAGE_MAP.curry;
  }
  if (text.includes('snack') || text.includes('fry') || text.includes('cutlet') || text.includes('puchka') || text.includes('samosa') || text.includes('singara') || text.includes('chaat') || text.includes('pakora')) {
    return MENU_IMAGE_MAP.snacks;
  }
  if (text.includes('sweet') || text.includes('firni') || text.includes('halwa') || text.includes('dessert') || text.includes('sandesh') || text.includes('jamun') || text.includes('roshogolla') || text.includes('mishti') || text.includes('rasgulla')) {
    return MENU_IMAGE_MAP.sweets;
  }
  if (text.includes('chai') || text.includes('coffee') || text.includes('tea') || text.includes('beverage') || text.includes('lassi') || text.includes('brew') || text.includes('juice') || text.includes('shake') || text.includes('drink')) {
    return MENU_IMAGE_MAP.beverages;
  }

  return MENU_IMAGE_MAP.default;
}
