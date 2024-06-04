import React, { useState } from "react";
import CalendarSelector from "../components/CalendarSelector";

/* The AccountSettings component utilizes the CalendarSelector 
to manage and save the user's calendar selections. */
const AccountSettings = () => {
  /* Store selected calendars in state */
  // eslint-disable-next-line no-unused-vars
  const [selectedCalendars, setSelectedCalendars] = useState([]);

  // Save settings to the database
  const handleSaveCalendars = (selectedCalendars) => {
    // store selected calendars in state from the CalendarSelector component
    setSelectedCalendars(selectedCalendars);

    // TODO Save selected calendars to the database
    console.log("Selected Calendars:", selectedCalendars);
  };

  return (
    <div>
      <h2>Account Settings</h2>
      {/* Show list of calendars */}
      <CalendarSelector onSave={handleSaveCalendars} />
    </div>
  );
};

export default AccountSettings;
