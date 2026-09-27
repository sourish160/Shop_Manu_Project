import { Restaurant, RestaurantHours, Category } from '../lib/insforge';
import { validateCoordinates } from './geolocation';

const DAY_MAP: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

/**
 * Builds valid Schema.org Restaurant / LocalBusiness structured data.
 * Adheres strictly to genuine database values with NO invented ratings, reviews, or metrics.
 */
export function generateRestaurantSchema(
  restaurant: Restaurant,
  hours: RestaurantHours[] = [],
  categories: Category[] = [],
  origin: string = 'https://shopmanu.com'
): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    url: `${origin}/restaurant/${restaurant.slug}`,
  };

  if (restaurant.description && restaurant.description.trim()) {
    schema.description = restaurant.description.trim();
  }

  if (restaurant.phone && restaurant.phone.trim()) {
    schema.telephone = restaurant.phone.trim();
  }

  if (restaurant.logo_url) {
    schema.image = restaurant.logo_url;
  } else if (restaurant.cover_url) {
    schema.image = restaurant.cover_url;
  }

  // Address
  schema.address = {
    '@type': 'PostalAddress',
    streetAddress: restaurant.address,
    addressLocality: restaurant.area,
    addressRegion: restaurant.city,
  };

  // Geographic coordinates (only if authentic and valid)
  if (
    typeof restaurant.latitude === 'number' &&
    typeof restaurant.longitude === 'number' &&
    validateCoordinates(restaurant.latitude, restaurant.longitude)
  ) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    };
  }

  // Real Operating Hours
  const validHours = hours.filter((h) => !h.is_closed && h.open_time && h.close_time);
  if (validHours.length > 0) {
    schema.openingHoursSpecification = validHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_MAP[h.day_of_week] || 'Monday',
      opens: h.open_time,
      closes: h.close_time,
    }));
  }

  // Cuisine categories if configured
  if (categories.length > 0) {
    schema.servesCuisine = categories.map((c) => c.name);
  }

  return schema;
}
