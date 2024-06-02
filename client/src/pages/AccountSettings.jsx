import React, { useState } from "react";
import CalendarSelector from "../components/CalendarSelector";

const AccountSettings = () => {
  // Store user's selected calendars in state
  const [selectedCalendars, setSelectedCalendars] = useState([]);

  // TODO Save selected calendars to the database
  const handleSaveCalendars = () => {
    // TODO: insert code here
    console.log("Selected Calendars:", selectedCalendars);
  };

  return (
    <div>
      <h2>Account Settings</h2>
      {/* Show list of calendars */}
      <CalendarSelector
        selectedCalendars={selectedCalendars}
        setSelectedCalendars={setSelectedCalendars}
      />
      {/* Button to save selected calendars */}
      <button onClick={handleSaveCalendars}>Save Calendars</button>
    </div>
  );
};

export default AccountSettings;
