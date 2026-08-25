/**
 * Build booking payload fields shared with the API (date + slot + ISO).
 */
export function buildBookingDateTimeFields(date, time) {
  const [hours, minutes] = time.split(':');
  const bookingDateTime = new Date(date);
  bookingDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  return {
    bookingDate: formatDateToDDMMYYYY(date),
    timeSlot: time,
    bookingTime: bookingDateTime.toISOString(),
  };
}

function formatDateToDDMMYYYY(date) {
  if (!date) return '';
  const isoMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }

  const slashMatch = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(date);
  if (slashMatch) {
    return date;
  }

  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return date;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getOrdinalSuffix(day) {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
}

export function formatDateFormatted(input) {
  if (!input) return '';
  let d;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const parts = input.trim().split('-').map(Number);
    d = new Date(parts[0], parts[1] - 1, parts[2]);
  } else if (typeof input === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(input.trim())) {
    const parts = input.trim().split('/').map(Number);
    d = new Date(parts[2], parts[1] - 1, parts[0]);
  } else {
    d = new Date(input);
  }

  if (Number.isNaN(d.getTime())) return String(input);

  const dayName = DAY_NAMES[d.getDay()];
  const dayOrdinal = getOrdinalSuffix(d.getDate());
  const monthName = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${dayName}, ${dayOrdinal} ${monthName}, ${year}`;
}

