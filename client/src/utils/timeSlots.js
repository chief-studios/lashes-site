import { apiUrl } from '../config/api';

// Generate time slots for booking based on business hours or default (8:00 AM - 8:00 PM, 2-hour blocks)
export const generateTimeSlots = (businessHoursForDay = null, slotDurationMinutes = 120) => {
  let openStr = '08:00';
  let closeStr = '20:00';

  if (businessHoursForDay) {
    if (businessHoursForDay.isOpen === false) {
      return [];
    }
    if (businessHoursForDay.open) openStr = businessHoursForDay.open;
    if (businessHoursForDay.close) closeStr = businessHoursForDay.close;
  }

  const [openH, openM] = openStr.split(':').map(Number);
  const [closeH, closeM] = closeStr.split(':').map(Number);

  let startMins = openH * 60 + openM;
  const endMins = closeH * 60 + closeM;

  const slots = [];
  while (startMins + slotDurationMinutes <= endMins) {
    const h = Math.floor(startMins / 60);
    const m = startMins % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    const formattedHour = String(displayHour).padStart(2, '0');
    const formattedMins = String(m).padStart(2, '0');

    slots.push({
      value: timeStr,
      display: `${formattedHour}:${formattedMins}${ampm}`
    });

    startMins += slotDurationMinutes;
  }

  return slots;
};

// Fetch available slots dynamically from backend for a specific date
export const fetchAvailableSlotsForDate = async (dateStr) => {
  if (!dateStr) return [];
  try {
    const response = await fetch(apiUrl(`/api/timeslots/available?date=${encodeURIComponent(dateStr)}`));
    if (!response.ok) return [];

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map(slot => {
        const timeStr = typeof slot === 'string' ? slot : slot.time;
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const formattedHour = String(displayHour).padStart(2, '0');
        return {
          value: timeStr,
          display: `${formattedHour}:${minutes}${ampm}`
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return [];
  }
};


