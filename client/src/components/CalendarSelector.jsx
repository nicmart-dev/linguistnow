import React from "react";

const CalendarSelector = ({ calendars }) => {
  return (
    <>
      <h3>Choose Calendars:</h3>
      <ul>
        {calendars.map((calendar) => (
          <li key={calendar.id}>{calendar.summary}</li>
        ))}
      </ul>
    </>
  );
};

export default CalendarSelector;
