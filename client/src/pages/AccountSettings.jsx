import React, { useState } from "react";
import axios from "axios";
import CalendarSelector from "../components/CalendarSelector";

/* The AccountSettings component utilizes the CalendarSelector 
to manage and save the user's calendar selections. */
const AccountSettings = () => {
  /* Store selected calendars in state */
  // eslint-disable-next-line no-unused-vars
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [googleAccessToken, setGoogleAccessToken] = useState(""); // keep track of access token so we can pass it to n8n workflow

  const handleSaveCalendars = async (selectedCalendars) => {
    // store selected calendars in state from the CalendarSelector component
    setSelectedCalendars(selectedCalendars);

    // Send selected calendars to the backend to trigger n8n workflow
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/calendars/save-calendars`,
        {
          calendarIds: selectedCalendars,
          googleAccessToken: googleAccessToken,
        }
      );
      console.log("n8n workflow triggered:", response.data);
    } catch (error) {
      console.error("Failed to trigger n8n workflow:", error);
    }
  };

  return (
    <div>
      <h2>Account Settings</h2>
      {/* Show list of calendars */}
      <CalendarSelector
        onSave={handleSaveCalendars}
        setAccessToken={setGoogleAccessToken} // Pass setter function to update googleAccessToken
      />
    </div>
  );
};

export default AccountSettings;
