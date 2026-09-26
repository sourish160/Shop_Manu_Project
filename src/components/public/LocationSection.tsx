import React from 'react';
import { Restaurant, RestaurantHours } from '../../lib/insforge';
import { DAY_NAMES, formatTime12Hour } from '../../utils/operatingHours';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address and Contact Information */}
        <div className="space-y-6">
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

            {restaurant.latitude !== null && restaurant.longitude !== null && (
              <p className="text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-100">
                Coordinates: {restaurant.latitude}, {restaurant.longitude}
              </p>
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

        {/* Prepared Maps & Directions Container (Phase 6 Placeholder) */}
        <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Restaurant Location
              </h3>
              <span className="text-[10px] font-medium text-slate-400">
                Google Maps integration pending Phase 6
              </span>
            </div>

            {/* Honest Neutral Map Placeholder */}
            <div className="w-full h-52 sm:h-64 bg-slate-50 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-6 text-center">
              <svg
                className="w-8 h-8 text-slate-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-xs font-medium text-slate-700">
                [Map integration will be implemented in the dedicated Maps phase]
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Interactive map rendering, directions, and live geocoding will connect in Phase 6.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Destination: {restaurant.name}</span>
            <span className="text-slate-400">Directions tool active in Phase 6</span>
          </div>
        </div>
      </div>
    </section>
  );
};
