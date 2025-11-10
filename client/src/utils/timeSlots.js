// Generate time slots for booking (8:00 AM - 10:00 PM, 2-hour blocks)
export const generateTimeSlots = () => {
  // Working hours: 08:00 to 22:00 (10:00 PM) with 2-hour blocks
  const timeSlots = [
    '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'
  ];
  
  return timeSlots.map(timeStr => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return {
      value: timeStr,
      display: `${displayHour}:${minutes} ${ampm}`
    };
  });
};

