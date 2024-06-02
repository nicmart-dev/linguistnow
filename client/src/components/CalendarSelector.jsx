import React from "react";

const CalendarSelector = ({
  calendars,
  selectedCalendars,
  setSelectedCalendars,
}) => {
  // Set calendar selection to state
  const handleSelectCalendar = (calendarId) => {
    if (selectedCalendars.includes(calendarId)) {
      setSelectedCalendars(selectedCalendars.filter((id) => id !== calendarId));
    } else {
      setSelectedCalendars([...selectedCalendars, calendarId]);
    }
  };

  return (
    <>
      <h3>Choose Calendars:</h3>
      <ul>
        {/* Show all calendars from logged in user */}
        {calendars.map((calendar) => (
          <li key={calendar.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedCalendars.includes(calendar.id)}
                onChange={() => handleSelectCalendar(calendar.id)}
              />
              {calendar.summary}
            </label>
          </li>
        ))}
      </ul>
    </>
  );
};

export default CalendarSelector;
