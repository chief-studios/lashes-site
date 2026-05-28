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
