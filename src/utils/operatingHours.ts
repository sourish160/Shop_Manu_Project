export interface RestaurantHours {
  id?: string;
  restaurant_id?: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OpeningStatusResult {
  isOpen: boolean | null; // null if hours not configured
  statusText: string;     // e.g. "Open now", "Closed", "Hours not available"
  nextOpeningText?: string | null; // e.g. "Opens at 10:00 AM", "Opens tomorrow at 11:00 AM"
  closingText?: string | null;     // e.g. "Closes at 10:00 PM"
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/**
 * Formats a "HH:MM:SS" or "HH:MM" 24h string into 12-hour format with AM/PM
 * Example: "10:00:00" -> "10:00 AM", "22:30" -> "10:30 PM"
 */
export function formatTime12Hour(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${displayHours}:${displayMinutes} ${period}`;
}

function timeStringToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Calculates real-time open/closed status from genuine database operating hours
 */
export function getRestaurantOpeningStatus(
  hoursList: RestaurantHours[] | null | undefined,
  now: Date = new Date()
): OpeningStatusResult {
  if (!hoursList || hoursList.length === 0) {
    return {
      isOpen: null,
      statusText: 'Hours not available'
    };
  }

  const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = hoursList.find((h) => h.day_of_week === currentDay);
  const yesterdayDay = (currentDay + 6) % 7;
  const yesterdayHours = hoursList.find((h) => h.day_of_week === yesterdayDay);

  // Check 1: Is the restaurant currently open from yesterday's overnight hours?
  if (yesterdayHours && !yesterdayHours.is_closed && yesterdayHours.open_time && yesterdayHours.close_time) {
    const yOpen = timeStringToMinutes(yesterdayHours.open_time);
    const yClose = timeStringToMinutes(yesterdayHours.close_time);

    if (yOpen !== null && yClose !== null && yClose < yOpen) {
      // Overnight hours (e.g. 18:00 to 02:00)
      if (currentMinutes < yClose) {
        return {
          isOpen: true,
          statusText: 'Open now',
          closingText: `Closes at ${formatTime12Hour(yesterdayHours.close_time)}`
        };
      }
    }
  }

  // Check 2: If no hours defined for today
  if (!todayHours) {
    return {
      isOpen: null,
      statusText: 'Hours not available'
    };
  }

  // Check 3: Closed all day today
  if (todayHours.is_closed || !todayHours.open_time || !todayHours.close_time) {
    const nextOpen = findNextOpening(hoursList, currentDay, 1);
    return {
      isOpen: false,
      statusText: 'Closed',
      nextOpeningText: nextOpen
    };
  }

  const openMinutes = timeStringToMinutes(todayHours.open_time);
  const closeMinutes = timeStringToMinutes(todayHours.close_time);

  if (openMinutes === null || closeMinutes === null) {
    return {
      isOpen: null,
      statusText: 'Hours not available'
    };
  }

  // Check 4: Regular daytime shift (e.g. 10:00 to 22:00)
  if (closeMinutes > openMinutes) {
    if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        statusText: 'Closed',
        nextOpeningText: `Opens at ${formatTime12Hour(todayHours.open_time)}`
      };
    } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return {
        isOpen: true,
        statusText: 'Open now',
        closingText: `Closes at ${formatTime12Hour(todayHours.close_time)}`
      };
    } else {
      // Past closing time today
      const nextOpen = findNextOpening(hoursList, currentDay, 1);
      return {
        isOpen: false,
        statusText: 'Closed',
        nextOpeningText: nextOpen
      };
    }
  } else {
    // Check 5: Overnight shift starting today (e.g. 18:00 to 02:00)
    if (currentMinutes >= openMinutes) {
      return {
        isOpen: true,
        statusText: 'Open now',
        closingText: `Closes tomorrow at ${formatTime12Hour(todayHours.close_time)}`
      };
    } else {
      return {
        isOpen: false,
        statusText: 'Closed',
        nextOpeningText: `Opens at ${formatTime12Hour(todayHours.open_time)}`
      };
    }
  }
}

/**
 * Scans forward up to 7 days to find the next opening time
 */
function findNextOpening(
  hoursList: RestaurantHours[],
  startDay: number,
  offsetDays: number
): string | null {
  for (let i = offsetDays; i <= 7; i++) {
    const checkDay = (startDay + i) % 7;
    const h = hoursList.find((item) => item.day_of_week === checkDay);
    if (h && !h.is_closed && h.open_time) {
      const formattedTime = formatTime12Hour(h.open_time);
      if (i === 1) {
        return `Opens tomorrow at ${formattedTime}`;
      } else {
        return `Opens ${DAY_NAMES[checkDay]} at ${formattedTime}`;
      }
    }
  }
  return null;
}

export { DAY_NAMES };
