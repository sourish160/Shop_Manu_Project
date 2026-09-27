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
    <section id="restaurant-location" className="border-t border-slate-200 pt-8 pb-12">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Location & Schedule
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Visit {restaurant.name} in person or check weekly dining hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Address, Phone, & Operating Hours */}
        <div className="space-y-6">
          {/* Physical Address */}
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Physical Address
            </h3>
            <p className="text-sm font-medium text-slate-900 leading-snug">
              {restaurant.address}
            </p>
            {(restaurant.area || restaurant.city) && (
              <p className="text-xs text-slate-600 mt-1">
                {[restaurant.area, restaurant.city].filter(Boolean).join(', ')}
              </p>
            )}

            {hasValidCoordinates ? (
              <p className="text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Coordinates: {restaurant.latitude?.toFixed(4)}, {restaurant.longitude?.toFixed(4)}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                Coordinates not specified
              </p>
            )}

            {restaurant.phone && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  Phone: <span className="font-mono text-slate-900 font-medium">{restaurant.phone}</span>
                </div>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  <Phone className="w-3 h-3 text-slate-500" />
                  Call Restaurant
                </a>
              </div>
            )}
          </div>

          {/* Operating Hours Table */}
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Weekly Operating Hours
            </h3>

            {sortedHours.length === 0 ? (
              <p className="text-xs text-slate-400">
                Operating hours have not been configured for this restaurant yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-xs">
                {DAY_NAMES.map((dayName, idx) => {
                  const dayHour = sortedHours.find((h) => h.day_of_week === idx);
                  const isToday = currentDayIndex === idx;

                  return (
                    <li
                      key={dayName}
                      className={`py-2 flex items-center justify-between ${
                        isToday ? 'font-semibold text-slate-900 bg-slate-50/80 -mx-2 px-2 rounded' : 'text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {dayName}
                        {isToday && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            Today
                          </span>
                        )}
                      </span>
                      <span>
                        {!dayHour || dayHour.is_closed || !dayHour.open_time || !dayHour.close_time ? (
                          <span className="text-slate-400 font-normal">Closed</span>
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
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Restaurant Map
              </h3>
              {hasValidCoordinates && (
                <span className="text-[10px] font-mono text-slate-400">
                  {restaurant.latitude?.toFixed(4)}, {restaurant.longitude?.toFixed(4)}
                </span>
              )}
            </div>

            {/* Interactive Google Map Component */}
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

          {/* Directions Action Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700 block sm:inline">Destination:</span>{' '}
              {restaurant.name}
            </div>

            {directionsUrl ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                Get Directions
              </a>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                Directions unavailable without coordinates
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
