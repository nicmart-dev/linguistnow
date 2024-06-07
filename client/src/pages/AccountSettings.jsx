import { useState, useEffect } from "react";
import axios from "axios";
import CalendarSelector from "../components/CalendarSelector";

/* The AccountSettings component utilizes the CalendarSelector 
to manage and save the user's calendar selections. */
const AccountSettings = () => {
  const [userEmail, setUserEmail] = useState(""); // Keep track of user email

  /* Save user selected calendars, and Google tokens in Airtable */
  const handleSaveCalendars = async (
    selectedCalendars,
    googleAccessToken,
    googleRefreshToken
  ) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/${userEmail}`,
        {
          calendarIds: selectedCalendars,
          googleAccessToken: googleAccessToken,
          googleRefreshToken: googleRefreshToken,
        }
      );
      console.log("Calendars saved:", response.data);
    } catch (error) {
      console.error("Failed to save calendars:", error);
    }
  };

  /* Get user email set after login and store in state 
  to be passed to backend to save calendars for the matching user */
  useEffect(() => {
    const storedUserEmail = localStorage.getItem("userEmail");
    if (storedUserEmail) {
      setUserEmail(storedUserEmail);
    }
  }, []);

  return (
    <div>
      <h2>Account Settings</h2>
      {/* Show list of calendars */}
      <CalendarSelector onSave={handleSaveCalendars} />
    </div>
  );
};

export default AccountSettings;
