/**
 * Build booking payload fields shared with the API (date + slot + ISO).
 */
export function buildBookingDateTimeFields(date, time) {
  const [hours, minutes] = time.split(':');
  const bookingDateTime = new Date(date);
  bookingDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  return {
    bookingDate: date,
    timeSlot: time,
    bookingTime: bookingDateTime.toISOString(),
  };
}
