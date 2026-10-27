import React from 'react';
import { Phone, Navigation, MapPin } from 'lucide-react';
import { Restaurant, RestaurantHours } from '../../lib/insforge';
import { DAY_NAMES, formatTime12Hour } from '../../utils/operatingHours';
import { RestaurantMap } from '../maps/RestaurantMap';
import { getGoogleMapsDirectionsUrl } from '../../utils/googleMapsLoader';
import { validateCoordinates } from '../../utils/geolocation';

interface LocationSectionProps {
  restaurant: Restaurant;
  hours: RestaurantHours[];
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  restaurant,
  hours,
}) => {
  const currentDayIndex = new Date().getDay();

  // Sort hours Sun (0) through Sat (6)
  const sortedHours = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  const hasValidCoordinates =
    typeof restaurant.latitude === 'number' &&
    typeof restaurant.longitude === 'number' &&
    validateCoordinates(restaurant.latitude, restaurant.longitude);

  const directionsUrl = hasValidCoordinates
    ? getGoogleMapsDirectionsUrl(
        restaurant.latitude,
        restaurant.longitude,
        restaurant.name
      )
    : null;

  return (
    <section id="restaurant-location" className="border-t border-cream-200/10 pt-12 pb-14">
      <div className="border-b border-cream-200/10 pb-4 mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
          VISIT & OPERATING SCHEDULE
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-cream-100 tracking-tight">
          Location & Hours
        </h2>
        <p className="text-xs text-cream-300/60 mt-1">
          Address, operating schedule, and directions for {restaurant.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Address & Operating Hours */}
        <div className="space-y-6">
          {/* Physical Address */}
          <div className="editorial-card bg-[#120E0C] border border-cream-200/10 p-6 rounded-sm">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-2">
              Physical Address
            </h3>
            <p className="font-serif text-base font-medium text-cream-100 leading-snug">
              {restaurant.address}
            </p>
            {(restaurant.area || restaurant.city) && (
              <p className="text-xs text-cream-300/70 mt-1">
                {[restaurant.area, restaurant.city].filter(Boolean).join(', ')}
              </p>
            )}

            {hasValidCoordinates ? (
              <p className="text-xs font-mono text-cream-300/50 mt-4 pt-3 border-t border-cream-200/10 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Coordinates: {restaurant.latitude?.toFixed(4)}, {restaurant.longitude?.toFixed(4)}</span>
              </p>
            ) : (
              <p className="text-xs font-mono text-cream-300/40 mt-4 pt-3 border-t border-cream-200/10">
                Exact map coordinates not provided
              </p>
            )}

            {restaurant.phone && (
              <div className="mt-4 pt-3 border-t border-cream-200/10 flex items-center justify-between">
                <div className="text-xs font-mono text-cream-300/80">
                  Phone: <span className="font-semibold text-cream-100">{restaurant.phone}</span>
                </div>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-cream-200 bg-cream-200/10 hover:bg-amber-400/20 hover:text-amber-300 border border-cream-200/15 transition-colors rounded-xs"
                >
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span>Call Shop</span>
                </a>
              </div>
            )}
          </div>

          {/* Operating Hours Table */}
          <div className="editorial-card bg-[#120E0C] border border-cream-200/10 p-6 rounded-sm">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-4">
              Weekly Schedule
            </h3>

            {sortedHours.length === 0 ? (
              <p className="text-xs font-mono text-cream-300/40">
                Operating hours have not been added for this shop yet.
              </p>
            ) : (
              <ul className="divide-y divide-cream-200/10 text-xs font-mono">
                {DAY_NAMES.map((dayName, idx) => {
                  const dayHour = sortedHours.find((h) => h.day_of_week === idx);
                  const isToday = currentDayIndex === idx;

                  return (
                    <li
                      key={dayName}
                      className={`py-2.5 flex items-center justify-between ${
                        isToday ? 'font-medium text-amber-300 bg-amber-500/10 -mx-3 px-3 rounded-xs' : 'text-cream-300/70'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{dayName}</span>
                        {isToday && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-[#0A0807] uppercase tracking-wider font-mono font-semibold rounded-xs">
                            Today
                          </span>
                        )}
                      </span>
                      <span>
                        {!dayHour || dayHour.is_closed || !dayHour.open_time || !dayHour.close_time ? (
                          <span className="text-cream-300/40">Closed</span>
                        ) : (
                          `${formatTime12Hour(dayHour.open_time)} – ${formatTime12Hour(dayHour.close_time)}`
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Google Maps & Directions */}
        <div className="editorial-card bg-[#120E0C] border border-cream-200/10 p-6 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cream-200/10 pb-3 mb-4">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50">
                Location Map
              </h3>
              {hasValidCoordinates && (
                <span className="text-xs font-mono text-cream-300/50">
                  {restaurant.latitude?.toFixed(4)}, {restaurant.longitude?.toFixed(4)}
                </span>
              )}
            </div>

            {/* Interactive Map Component */}
            <div className="overflow-hidden border border-cream-200/10 rounded-sm">
              <RestaurantMap
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
                restaurantName={restaurant.name}
                address={restaurant.address}
                area={restaurant.area}
                city={restaurant.city}
                zoom={15}
              />
            </div>
          </div>

          {/* Directions Action Footer */}
          <div className="mt-5 pt-4 border-t border-cream-200/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs font-mono text-cream-300/60">
              <span>Map location for:</span>{' '}
              <strong className="text-amber-300 font-medium font-serif">{restaurant.name}</strong>
            </div>

            {directionsUrl ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold text-[#0A0807] bg-amber-400 hover:bg-amber-300 transition-colors shrink-0 rounded-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-[#0A0807]" />
                <span>Get Directions</span>
              </a>
            ) : (
              <span className="text-xs font-mono text-cream-300/40 italic">
                Directions unavailable without coordinates
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
