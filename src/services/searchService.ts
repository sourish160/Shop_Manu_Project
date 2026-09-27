import { insforge } from '../lib/insforge.ts';
import type { FoodVariant, RestaurantHours } from '../lib/insforge.ts';
import { getRestaurantOpeningStatus } from '../utils/operatingHours.ts';
import type { OpeningStatusResult } from '../utils/operatingHours.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { validateCoordinates, DEFAULT_RADIUS_KM } from '../utils/geolocation.ts';

export interface SearchFilters {
  vegType?: 'all' | 'veg' | 'non_veg';
  availableOnly?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  openNow?: boolean;
  tab?: 'all' | 'foods' | 'restaurants' | 'locations';
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  locationName?: string;
  sortBy?: 'nearest' | 'relevance' | 'price_asc' | 'price_desc';
}

export interface FoodSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  veg_type: 'veg' | 'non_veg';
  available: boolean;
  updated_at: string;
  distance_km?: number | null;
  category?: {
    id: string;
    name: string;
  } | null;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    address: string;
    area: string;
    city: string;
    status: string;
    verified: boolean;
    latitude?: number | null;
    longitude?: number | null;
    hours?: RestaurantHours[];
  };
  variants: FoodVariant[];
  matchingVariant?: FoodVariant;
  displayPrice: number;
  displayPriceText: string;
  relevanceScore: number;
}

export interface RestaurantSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  area: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  verified: boolean;
  logo_url: string | null;
  cover_url: string | null;
  distance_km?: number | null;
  hours?: RestaurantHours[];
  openingStatus: OpeningStatusResult;
  relevanceScore: number;
  matchedBy: 'name' | 'location' | 'near_me';
}

export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'food' | 'restaurant' | 'location';
  subtitle?: string;
}

export interface UnifiedSearchResult {
  query: string;
  cleanedQuery: string;
  foods: FoodSearchResult[];
  restaurants: RestaurantSearchResult[];
  locations: RestaurantSearchResult[];
  totalCount: number;
  prominentCategory: 'foods' | 'restaurants' | 'locations' | 'none';
  hasLocationFilter: boolean;
  referenceLocationName?: string;
}

/**
 * Normalizes user search input by trimming whitespace and removing wildcard characters.
 */
export function normalizeQuery(query: string): string {
  if (!query) return '';
  return query.trim().replace(/[%_]/g, '');
}

/**
 * Calculates relevance score (0 - 100) based on match strength.
 */
function calculateRelevance(text: string, query: string): number {
  const normText = text.toLowerCase().trim();
  const normQ = query.toLowerCase().trim();

  if (normText === normQ) return 100;
  if (normText.startsWith(normQ)) return 85;

  const words = normText.split(/\s+/);
  if (words.some((w) => w === normQ)) return 75;
  if (words.some((w) => w.startsWith(normQ))) return 60;

  if (normText.includes(normQ)) return 40;
  return 10;
}

/**
 * Fetches lightweight search suggestions while the user types.
 * Queries actual database records for active foods, approved restaurants, and approved locations.
 */
export async function fetchSearchSuggestions(rawQuery: string): Promise<SearchSuggestion[]> {
  const query = normalizeQuery(rawQuery);
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const [foodRes, restRes] = await Promise.all([
      insforge.database
        .from('foods')
        .select('id, name, veg_type, restaurant:restaurants(name)')
        .ilike('name', `%${query}%`)
        .eq('status', 'active')
        .limit(5),

      insforge.database
        .from('restaurants')
        .select('id, name, area, city')
        .eq('status', 'approved')
        .or(`name.ilike.%${query}%,area.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(6),
    ]);

    const suggestions: SearchSuggestion[] = [];
    const seenTitles = new Set<string>();

    if (foodRes.data) {
      for (const f of foodRes.data as any[]) {
        const title = f.name;
        if (!seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          suggestions.push({
            id: `food-${f.id}`,
            title,
            type: 'food',
            subtitle: f.restaurant?.name ? `in ${f.restaurant.name}` : 'Food item',
          });
        }
      }
    }

    if (restRes.data) {
      for (const r of restRes.data as any[]) {
        const title = r.name;
        const normQ = query.toLowerCase();

        if (title.toLowerCase().includes(normQ) && !seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          suggestions.push({
            id: `rest-${r.id}`,
            title,
            type: 'restaurant',
            subtitle: `${r.area}, ${r.city}`,
          });
        }

        const areaTitle = r.area;
        if (areaTitle && areaTitle.toLowerCase().includes(normQ) && !seenTitles.has(areaTitle.toLowerCase())) {
          seenTitles.add(areaTitle.toLowerCase());
          suggestions.push({
            id: `loc-area-${r.id}`,
            title: areaTitle,
            type: 'location',
            subtitle: `Locality in ${r.city}`,
          });
        }
      }
    }

    return suggestions.slice(0, 8);
  } catch (err) {
    console.error('Failed to fetch search suggestions:', err);
    return [];
  }
}

/**
 * Searches public foods matching the search query and applied filters (without geographic radius).
 */
export async function searchPublicFoods(
  rawQuery: string,
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ items: FoodSearchResult[]; total: number }> {
  const query = normalizeQuery(rawQuery);

  let queryBuilder = insforge.database
    .from('foods')
    .select(
      `id, name, slug, description, image_url, veg_type, available, updated_at,
       category:categories(id, name),
       restaurant:restaurants(id, name, slug, address, area, city, status, verified, latitude, longitude, hours:restaurant_hours(day_of_week, open_time, close_time, is_closed)),
       variants:food_variants(id, name, price, available, updated_at)`
    )
    .eq('status', 'active');

  if (filters.vegType && filters.vegType !== 'all') {
    queryBuilder = queryBuilder.eq('veg_type', filters.vegType);
  }

  if (filters.availableOnly) {
    queryBuilder = queryBuilder.eq('available', true);
  }

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit * 2 - 1;
  queryBuilder = queryBuilder.range(from, to).order('name', { ascending: true });

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Food search error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { items: [], total: 0 };
  }

  const results: FoodSearchResult[] = [];

  for (const item of data as any[]) {
    if (!item.restaurant || item.restaurant.status !== 'approved') {
      continue;
    }

    const restaurantHours = (item.restaurant.hours || []) as RestaurantHours[];
    const openStatus = getRestaurantOpeningStatus(restaurantHours);

    if (filters.openNow && openStatus.isOpen !== true) {
      continue;
    }

    const variants = (item.variants || []) as FoodVariant[];
    if (variants.length === 0) {
      continue;
    }

    let eligibleVariants = [...variants];

    if (filters.availableOnly) {
      eligibleVariants = eligibleVariants.filter((v) => v.available);
      if (eligibleVariants.length === 0) {
        continue;
      }
    }

    const hasMinPrice = filters.minPrice !== null && filters.minPrice !== undefined && filters.minPrice > 0;
    const hasMaxPrice = filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice > 0;

    if (hasMinPrice) {
      eligibleVariants = eligibleVariants.filter((v) => v.price >= (filters.minPrice as number));
    }

    if (hasMaxPrice) {
      eligibleVariants = eligibleVariants.filter((v) => v.price <= (filters.maxPrice as number));
    }

    if ((hasMinPrice || hasMaxPrice) && eligibleVariants.length === 0) {
      continue;
    }

    eligibleVariants.sort((a, b) => a.price - b.price);
    const matchingVariant = eligibleVariants[0];

    let displayPriceText = '';
    if (variants.length === 1) {
      displayPriceText = `${variants[0].name} ${formatCurrency(variants[0].price)}`;
    } else if (hasMinPrice || hasMaxPrice) {
      displayPriceText = `${matchingVariant.name} ${formatCurrency(matchingVariant.price)}`;
    } else {
      displayPriceText = `From ${formatCurrency(matchingVariant.price)} (${matchingVariant.name})`;
    }

    const relevanceScore = query ? calculateRelevance(item.name, query) : 50;

    results.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      image_url: item.image_url,
      veg_type: item.veg_type,
      available: item.available,
      updated_at: item.updated_at,
      distance_km: null,
      category: item.category,
      restaurant: {
        id: item.restaurant.id,
        name: item.restaurant.name,
        slug: item.restaurant.slug,
        address: item.restaurant.address,
        area: item.restaurant.area,
        city: item.restaurant.city,
        status: item.restaurant.status,
        verified: item.restaurant.verified,
        latitude: item.restaurant.latitude,
        longitude: item.restaurant.longitude,
        hours: restaurantHours,
      },
      variants,
      matchingVariant,
      displayPrice: matchingVariant.price,
      displayPriceText,
      relevanceScore,
    });
  }

  // Sorting
  if (filters.sortBy === 'price_asc') {
    results.sort((a, b) => a.displayPrice - b.displayPrice || a.name.localeCompare(b.name));
  } else if (filters.sortBy === 'price_desc') {
    results.sort((a, b) => b.displayPrice - a.displayPrice || a.name.localeCompare(b.name));
  } else {
    results.sort((a, b) => b.relevanceScore - a.relevanceScore || a.name.localeCompare(b.name));
  }

  const pagedItems = results.slice(0, limit);
  return { items: pagedItems, total: results.length };
}

/**
 * Searches public restaurants by name without geographic filtering.
 */
export async function searchPublicRestaurants(
  rawQuery: string,
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ items: RestaurantSearchResult[]; total: number }> {
  const query = normalizeQuery(rawQuery);

  let queryBuilder = insforge.database
    .from('restaurants')
    .select(
      `id, name, slug, description, address, area, city, latitude, longitude, status, verified, logo_url, cover_url,
       hours:restaurant_hours(day_of_week, open_time, close_time, is_closed)`
    )
    .eq('status', 'approved');

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit * 2 - 1;
  queryBuilder = queryBuilder.range(from, to).order('name', { ascending: true });

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Restaurant search error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { items: [], total: 0 };
  }

  const results: RestaurantSearchResult[] = [];

  for (const item of data as any[]) {
    const hours = (item.hours || []) as RestaurantHours[];
    const openingStatus = getRestaurantOpeningStatus(hours);

    if (filters.openNow && openingStatus.isOpen !== true) {
      continue;
    }

    const relevanceScore = query ? calculateRelevance(item.name, query) : 50;

    results.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      address: item.address,
      area: item.area,
      city: item.city,
      latitude: item.latitude,
      longitude: item.longitude,
      status: item.status,
      verified: item.verified,
      logo_url: item.logo_url,
      cover_url: item.cover_url,
      distance_km: null,
      hours,
      openingStatus,
      relevanceScore,
      matchedBy: 'name',
    });
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore || a.name.localeCompare(b.name));

  const pagedItems = results.slice(0, limit);
  return { items: pagedItems, total: results.length };
}

/**
 * Searches restaurants by text matching locality / area / city.
 */
export async function searchLocationRestaurants(
  rawQuery: string,
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ items: RestaurantSearchResult[]; total: number }> {
  const query = normalizeQuery(rawQuery);
  if (!query) {
    return { items: [], total: 0 };
  }

  const queryBuilder = insforge.database
    .from('restaurants')
    .select(
      `id, name, slug, description, address, area, city, latitude, longitude, status, verified, logo_url, cover_url,
       hours:restaurant_hours(day_of_week, open_time, close_time, is_closed)`
    )
    .eq('status', 'approved')
    .or(`area.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
    .range((page - 1) * limit, page * limit * 2 - 1)
    .order('name', { ascending: true });

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Location search error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { items: [], total: 0 };
  }

  const results: RestaurantSearchResult[] = [];

  for (const item of data as any[]) {
    const hours = (item.hours || []) as RestaurantHours[];
    const openingStatus = getRestaurantOpeningStatus(hours);

    if (filters.openNow && openingStatus.isOpen !== true) {
      continue;
    }

    const areaRel = calculateRelevance(item.area || '', query);
    const cityRel = calculateRelevance(item.city || '', query);
    const relevanceScore = Math.max(areaRel, cityRel);

    results.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      address: item.address,
      area: item.area,
      city: item.city,
      latitude: item.latitude,
      longitude: item.longitude,
      status: item.status,
      verified: item.verified,
      logo_url: item.logo_url,
      cover_url: item.cover_url,
      distance_km: null,
      hours,
      openingStatus,
      relevanceScore,
      matchedBy: 'location',
    });
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore || a.name.localeCompare(b.name));

  const pagedItems = results.slice(0, limit);
  return { items: pagedItems, total: results.length };
}

/**
 * Searches nearby restaurants using the database PostGIS RPC function.
 * Filters within radius (km), calculates geodesic distance on database, and respects visibility.
 */
export async function searchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusKm = DEFAULT_RADIUS_KM,
  rawQuery = '',
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ items: RestaurantSearchResult[]; total: number }> {
  if (!validateCoordinates(lat, lng)) {
    throw new Error('Invalid coordinates provided for geographic search.');
  }

  const query = normalizeQuery(rawQuery);
  const sortBy = filters.sortBy || 'nearest';
  const offset = (page - 1) * limit;

  const { data, error } = await insforge.database.rpc('get_nearby_restaurants', {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
    p_query: query || null,
    p_sort_by: sortBy === 'nearest' ? 'nearest' : 'relevance',
    p_limit: limit * 2, // buffer for open-now post-filter
    p_offset: offset,
  });

  if (error) {
    throw new Error(`Nearby restaurant search failed: ${error.message}`);
  }

  if (!data || (data as any[]).length === 0) {
    return { items: [], total: 0 };
  }

  const results: RestaurantSearchResult[] = [];

  for (const item of data as any[]) {
    const hours = (item.hours || []) as RestaurantHours[];
    const openingStatus = getRestaurantOpeningStatus(hours);

    if (filters.openNow && openingStatus.isOpen !== true) {
      continue;
    }

    const relevanceScore = query ? calculateRelevance(item.name, query) : 100;
    const distanceKm = typeof item.distance_km === 'number' ? item.distance_km : parseFloat(item.distance_km);

    results.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      address: item.address,
      area: item.area,
      city: item.city,
      latitude: item.latitude,
      longitude: item.longitude,
      status: item.status,
      verified: item.verified,
      logo_url: item.logo_url,
      cover_url: item.cover_url,
      distance_km: distanceKm,
      hours,
      openingStatus,
      relevanceScore,
      matchedBy: 'near_me',
    });
  }

  const pagedItems = results.slice(0, limit);
  return { items: pagedItems, total: results.length };
}

/**
 * Searches nearby food items using the database PostGIS RPC function.
 * Filters within radius (km), price range, veg preference, availability, and calculates real distance.
 */
export async function searchNearbyFoods(
  lat: number,
  lng: number,
  radiusKm = DEFAULT_RADIUS_KM,
  rawQuery = '',
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ items: FoodSearchResult[]; total: number }> {
  if (!validateCoordinates(lat, lng)) {
    throw new Error('Invalid coordinates provided for geographic search.');
  }

  const query = normalizeQuery(rawQuery);
  const sortBy = filters.sortBy || 'nearest';
  const offset = (page - 1) * limit;

  const { data, error } = await insforge.database.rpc('get_nearby_foods', {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
    p_query: query || null,
    p_veg_type: filters.vegType && filters.vegType !== 'all' ? filters.vegType : 'all',
    p_available_only: filters.availableOnly || false,
    p_min_price: filters.minPrice && filters.minPrice > 0 ? filters.minPrice : null,
    p_max_price: filters.maxPrice && filters.maxPrice > 0 ? filters.maxPrice : null,
    p_sort_by: sortBy === 'price_asc' ? 'price_asc' : sortBy === 'relevance' ? 'relevance' : 'nearest',
    p_limit: limit * 2,
    p_offset: offset,
  });

  if (error) {
    throw new Error(`Nearby food search failed: ${error.message}`);
  }

  if (!data || (data as any[]).length === 0) {
    return { items: [], total: 0 };
  }

  const results: FoodSearchResult[] = [];

  for (const item of data as any[]) {
    const restaurant = item.restaurant || {};
    const restaurantHours = (restaurant.hours || []) as RestaurantHours[];
    const openStatus = getRestaurantOpeningStatus(restaurantHours);

    if (filters.openNow && openStatus.isOpen !== true) {
      continue;
    }

    const variants = (item.variants || []) as FoodVariant[];
    const displayPrice = typeof item.display_price === 'number' ? item.display_price : parseFloat(item.display_price);
    const distanceKm = typeof item.distance_km === 'number' ? item.distance_km : parseFloat(item.distance_km);

    const relevanceScore = query ? calculateRelevance(item.name, query) : 100;

    results.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      image_url: item.image_url,
      veg_type: item.veg_type,
      available: item.available,
      updated_at: item.updated_at,
      distance_km: distanceKm,
      category: null,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        area: restaurant.area,
        city: restaurant.city,
        status: restaurant.status,
        verified: restaurant.verified,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        hours: restaurantHours,
      },
      variants,
      displayPrice,
      displayPriceText: item.display_price_text,
      relevanceScore,
    });
  }

  const pagedItems = results.slice(0, limit);
  return { items: pagedItems, total: results.length };
}

/**
 * Unified multi-category search: executes food, restaurant, and location searches.
 * Handles both geographic location search (Near Me / selected location) and regular text search.
 */
export async function executeUnifiedSearch(
  rawQuery: string,
  filters: SearchFilters = {},
  page = 1,
  limit = 20
): Promise<UnifiedSearchResult> {
  const cleanedQuery = normalizeQuery(rawQuery);
  const hasCoordinates =
    filters.latitude !== null &&
    filters.latitude !== undefined &&
    filters.longitude !== null &&
    filters.longitude !== undefined &&
    validateCoordinates(filters.latitude, filters.longitude);

  const radiusKm = filters.radiusKm || DEFAULT_RADIUS_KM;

  // Case 1: Geographic Search (Coordinates Provided)
  if (hasCoordinates) {
    const lat = filters.latitude as number;
    const lng = filters.longitude as number;

    const [foodsRes, restaurantsRes] = await Promise.all([
      searchNearbyFoods(lat, lng, radiusKm, cleanedQuery, filters, page, limit),
      searchNearbyRestaurants(lat, lng, radiusKm, cleanedQuery, filters, page, limit),
    ]);

    const foods = foodsRes.items;
    const restaurants = restaurantsRes.items;
    const totalCount = foods.length + restaurants.length;

    let prominentCategory: 'foods' | 'restaurants' | 'locations' | 'none' = 'none';
    if (cleanedQuery) {
      if (foods.length > restaurants.length) {
        prominentCategory = 'foods';
      } else if (restaurants.length > 0) {
        prominentCategory = 'restaurants';
      }
    } else {
      prominentCategory = restaurants.length > 0 ? 'restaurants' : foods.length > 0 ? 'foods' : 'none';
    }

    return {
      query: rawQuery,
      cleanedQuery,
      foods,
      restaurants,
      locations: [],
      totalCount,
      prominentCategory,
      hasLocationFilter: true,
      referenceLocationName: filters.locationName || 'Near Me',
    };
  }

  // Case 2: Non-Geographic Search (Phase 4 text search)
  const hasFilterActive =
    (filters.vegType && filters.vegType !== 'all') ||
    filters.availableOnly ||
    (filters.minPrice !== null && filters.minPrice !== undefined && filters.minPrice > 0) ||
    (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice > 0) ||
    filters.openNow;

  if (!cleanedQuery && !hasFilterActive) {
    return {
      query: rawQuery,
      cleanedQuery: '',
      foods: [],
      restaurants: [],
      locations: [],
      totalCount: 0,
      prominentCategory: 'none',
      hasLocationFilter: false,
    };
  }

  const [foodsRes, restaurantsRes, locationsRes] = await Promise.all([
    searchPublicFoods(cleanedQuery, filters, page, limit),
    searchPublicRestaurants(cleanedQuery, filters, page, limit),
    cleanedQuery ? searchLocationRestaurants(cleanedQuery, filters, page, limit) : Promise.resolve({ items: [], total: 0 }),
  ]);

  const foods = foodsRes.items;
  const restaurants = restaurantsRes.items;
  const locations = locationsRes.items;
  const totalCount = foods.length + restaurants.length + locations.length;

  let prominentCategory: 'foods' | 'restaurants' | 'locations' | 'none' = 'none';

  const maxFoodRel = foods.length > 0 ? Math.max(...foods.map((f) => f.relevanceScore)) : 0;
  const maxRestRel = restaurants.length > 0 ? Math.max(...restaurants.map((r) => r.relevanceScore)) : 0;
  const maxLocRel = locations.length > 0 ? Math.max(...locations.map((l) => l.relevanceScore)) : 0;

  if (maxFoodRel >= 80 && maxFoodRel >= maxRestRel) {
    prominentCategory = 'foods';
  } else if (maxRestRel >= 80 && maxRestRel > maxLocRel) {
    prominentCategory = 'restaurants';
  } else if (maxLocRel >= 80) {
    prominentCategory = 'locations';
  } else if (foods.length > restaurants.length && foods.length > locations.length) {
    prominentCategory = 'foods';
  } else if (restaurants.length > 0) {
    prominentCategory = 'restaurants';
  } else if (locations.length > 0) {
    prominentCategory = 'locations';
  }

  return {
    query: rawQuery,
    cleanedQuery,
    foods,
    restaurants,
    locations,
    totalCount,
    prominentCategory,
    hasLocationFilter: false,
  };
}
