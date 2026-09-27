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
    <section id="restaurant-location" className="border-t border-white/10 pt-10 pb-12">
      <div className="border-b border-white/10 pb-4 mb-6">
        <h2 className="font-editorial text-3xl sm:text-4xl font-light text-[#F4F2ED] tracking-tight">
          Location & Telemetry
        </h2>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mt-1">
          Coordinate map & operating schedule for {restaurant.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Address, Phone, & Operating Hours */}
        <div className="space-y-6">
          {/* Physical Address */}
          <div className="forge-card rounded-2xl p-6 shadow-xl">
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-2.5">
              Atelier Coordinates
            </h3>
            <p className="text-base font-light text-[#F4F2ED] leading-snug">
              {restaurant.address}
            </p>
            {(restaurant.area || restaurant.city) && (
              <p className="text-xs text-zinc-400 mt-1 font-light">
                {[restaurant.area, restaurant.city].filter(Boolean).join(', ')}
              </p>
            )}

            {hasValidCoordinates ? (
              <p className="text-[11px] font-mono text-zinc-500 mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A064] shrink-0" />
                <span>Geospatial: {restaurant.latitude?.toFixed(4)}, {restaurant.longitude?.toFixed(4)}</span>
              </p>
            ) : (
              <p className="text-[11px] font-mono text-zinc-500 mt-3 pt-3 border-t border-white/10">
                Coordinates uncalibrated
              </p>
            )}

            {restaurant.phone && (
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-zinc-400 font-mono">
                  Direct: <span className="text-[#C5A064] font-medium">{restaurant.phone}</span>
                </div>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="forge-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider text-[#F4F2ED] transition-all"
                >
                  <Phone className="w-3 h-3 text-[#C5A064]" />
                  Call Kitchen
                </a>
              </div>
            )}
          </div>

          {/* Operating Hours Table */}
          <div className="forge-card rounded-2xl p-6 shadow-xl">
            <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-3.5">
              Weekly Service Schedule
            </h3>

            {sortedHours.length === 0 ? (
              <p className="text-xs font-mono text-zinc-500">
                Operating hours have not been configured for this restaurant yet.
              </p>
            ) : (
              <ul className="divide-y divide-white/5 text-xs font-mono">
                {DAY_NAMES.map((dayName, idx) => {
                  const dayHour = sortedHours.find((h) => h.day_of_week === idx);
                  const isToday = currentDayIndex === idx;

                  return (
                    <li
                      key={dayName}
                      className={`py-2.5 flex items-center justify-between transition-colors ${
                        isToday ? 'font-medium text-[#F4F2ED] bg-[#C5A064]/10 border border-[#C5A064]/30 -mx-2 px-2.5 rounded-lg' : 'text-zinc-400'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {dayName}
                        {isToday && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#C5A064] text-black font-semibold uppercase tracking-wider">
                            Today
                          </span>
                        )}
                      </span>
                      <span>
                        {!dayHour || dayHour.is_closed || !dayHour.open_time || !dayHour.close_time ? (
                          <span className="text-zinc-600 font-normal">Closed</span>
                        ) : (
                          `${formatTime12Hour(dayHour.open_time)} to ${formatTime12Hour(dayHour.close_time)}`
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
        <div className="forge-card rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064]">
                Interactive Satellite HUD
              </h3>
              {hasValidCoordinates && (
                <span className="text-[10px] font-mono text-zinc-500">
                  {restaurant.latitude?.toFixed(4)}, {restaurant.longitude?.toFixed(4)}
                </span>
              )}
            </div>

            {/* Interactive Google Map Component */}
            <div className="rounded-xl overflow-hidden border border-white/10">
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
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
            <div className="text-xs text-zinc-400">
              <span className="text-zinc-500 block sm:inline">Destination:</span>{' '}
              <span className="text-[#F4F2ED] font-medium">{restaurant.name}</span>
            </div>

            {directionsUrl ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="forge-btn inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#F4F2ED] rounded-lg transition-all shadow-sm shrink-0"
              >
                <Navigation className="w-3.5 h-3.5 text-[#C5A064]" />
                Navigate
              </a>
            ) : (
              <span className="text-[11px] text-zinc-600 italic">
                Directions unavailable without coordinates
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
